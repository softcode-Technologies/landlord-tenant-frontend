"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { io, Socket } from "socket.io-client"
import { messagingApi } from "@/lib/api/messaging"
import { tenanciesApi } from "@/lib/api/tenancies"
import { useAuthStore } from "@/lib/store/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { getInitials, formatRelativeTime, extractApiError } from "@/lib/utils"
import type { Message, Conversation } from "@/lib/types"
import { MessageCircle, Send, Loader2, Plus, ArrowLeft } from "lucide-react"
import { toast } from "sonner"

export default function TenantMessagesPage() {
  const { user, accessToken } = useAuthStore()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [composeOpen, setComposeOpen] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isLandlord = !!user?.landlordProfile

  // Connect Socket.IO
  useEffect(() => {
    if (!accessToken) return
    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3000", {
      auth: { token: accessToken },
    })
    socketRef.current = socket

    // Backend emits { conversationId, message } — unwrap the message
    socket.on("new_message", (payload: { conversationId?: string; message?: Message } | Message) => {
      const msg = (payload as { message?: Message }).message ?? (payload as Message)
      setMessages((prev) => {
        if (!msg?.id || prev.find((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    return () => { socket.disconnect() }
  }, [accessToken, queryClient])

  // Load messages when conversation selected
  useEffect(() => {
    if (!selected) return
    messagingApi.getMessages(selected.id).then((res) => {
      const payload = res.data as unknown
      const msgs: Message[] = Array.isArray(payload) ? payload : ((payload as { data: Message[] })?.data ?? [])
      // Backend returns DESC order; reverse for chronological display
      setMessages([...msgs].reverse())
    })
    socketRef.current?.emit("join_conversation", selected.id)
    return () => { socketRef.current?.emit("leave_conversation", selected.id) }
  }, [selected])

  useEffect(() => {
    // Scroll only the message list, never the whole page.
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [messages])

  // On a phone an open chat fills the screen. Give it a history entry so the
  // phone's Back button returns to the list instead of leaving Messages.
  const openChat = (conv: Conversation) => {
    const isPhone = typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches
    if (isPhone && !selected) window.history.pushState({ kribChat: true }, "")
    setSelected(conv)
  }
  const closeChat = () => {
    if (typeof window !== "undefined" && window.history.state?.kribChat) window.history.back()
    else setSelected(null)
  }
  useEffect(() => {
    const onPop = () => setSelected(null)
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const { data: convsData, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagingApi.getConversations(),
  })

  // Fetch tenancies to populate the contact picker
  const { data: tenanciesData } = useQuery({
    queryKey: isLandlord ? ["landlord-tenancies"] : ["tenant-tenancies"],
    queryFn: isLandlord
      ? () => tenanciesApi.getLandlordTenancies()
      : () => tenanciesApi.getTenantTenancies(),
    enabled: composeOpen,
  })

  const sendMutation = useMutation({
    mutationFn: () => messagingApi.sendMessage(selected!.id, inputText),
    onSuccess: (res) => {
      setMessages((prev) => [...prev, res.data])
      setInputText("")
    },
  })

  const startMutation = useMutation({
    mutationFn: (recipientUserId: string) =>
      messagingApi.createConversation({
        recipientUserId,
        body: "Hello! I'd like to get in touch.",
      }),
    onSuccess: async (res) => {
      setComposeOpen(false)
      const newId = (res.data as Conversation).id
      // Re-fetch to get conversation with participant data included
      const refreshed = await messagingApi.getConversations()
      const convList = (refreshed.data as unknown as Conversation[]) ?? []
      const found = convList.find((c) => c.id === newId) ?? (res.data as Conversation)
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      openChat(found)
      toast.success("Conversation started!")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to start conversation.")),
  })

  const conversations = convsData?.data ?? []

  // Build contact list from tenancies
  const contacts = (() => {
    const tenancies = tenanciesData?.data ?? []
    const seen = new Set<string>()
    return tenancies.flatMap((t) => {
      const contact = isLandlord ? t.tenant : t.landlord
      const contactId = isLandlord ? t.tenantUserId : t.landlordUserId
      if (!contact || !contactId || seen.has(contactId)) return []
      seen.add(contactId)
      return [{
        id: contactId,
        name: `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || "User",
        avatarUrl: contact.avatarUrl,
        role: isLandlord ? "Tenant" : "Landlord",
        property: t.property?.name ?? t.unit?.unitNumber ?? "",
      }]
    })
  })()

  const getOtherParticipant = (conv: Conversation) => {
    const uid = user?.id
    if (conv.landlord && conv.landlordUserId !== uid) return conv.landlord
    if (conv.tenant && conv.tenantUserId !== uid) return conv.tenant
    if (conv.agent && conv.agentUserId !== uid) return conv.agent
    return null
  }

  const doSend = () => {
    if (!inputText.trim() || !selected) return
    sendMutation.mutate()
  }

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    doSend()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="hidden sm:block text-slate-500 mt-1">Conversations with your landlord, tenants and agents</p>
      </div>

      {/* Phone: the list, or (when a chat is open) the chat full screen.
          Wider screens: list and chat side by side. */}
      <div className="flex h-[calc(100dvh-180px)] sm:h-[calc(100dvh-250px)] min-h-[420px] sm:min-h-[500px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Conversations list */}
        <div className={`${selected ? "hidden sm:flex" : "flex"} w-full sm:w-80 min-w-0 border-r border-slate-100 flex-col shrink-0`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Conversations</p>
            <button
              onClick={() => setComposeOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 mb-3">No conversations yet</p>
                <Button size="sm" variant="outline" onClick={() => setComposeOpen(true)} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Start one
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {conversations.map((conv) => {
                  const other = getOtherParticipant(conv)
                  const name = other
                    ? `${other.firstName ?? ""} ${other.lastName ?? ""}`.trim() || "User"
                    : "Unknown"

                  return (
                    <button
                      key={conv.id}
                      onClick={() => openChat(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors text-left ${
                        selected?.id === conv.id ? "bg-slate-50" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={other?.avatarUrl} />
                        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatRelativeTime(conv.updatedAt)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <p className="text-xs text-slate-500 truncate">{conv.lastMessage.body}</p>
                        )}
                      </div>
                      {(conv.unreadCount ?? 0) > 0 && (
                        <span className="bg-[#005AF1] text-white text-xs rounded-full px-1.5 py-0.5 shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Chat area: full screen on a phone */}
        <div
          className={`${
            selected
              ? "flex max-sm:fixed max-sm:inset-0 max-sm:z-50 max-sm:h-[100dvh] max-sm:bg-white max-sm:dark:bg-slate-900"
              : "hidden sm:flex"
          } flex-1 min-w-0 flex-col`}
        >
          {selected ? (
            <>
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 pb-2.5 sm:py-3 border-b border-slate-100 pt-[max(0.625rem,env(safe-area-inset-top))]">
                <button
                  type="button"
                  onClick={closeChat}
                  aria-label="Back to conversations"
                  className="sm:hidden -ml-0.5 p-2 rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {(() => {
                  const other = getOtherParticipant(selected)
                  const name = other
                    ? `${other.firstName ?? ""} ${other.lastName ?? ""}`.trim() || "User"
                    : "Unknown"
                  return (
                    <>
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={other?.avatarUrl} />
                        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{name}</p>
                        {selected.property && (
                          <p className="text-xs text-slate-500 truncate">{selected.property.name}</p>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 bg-slate-50/60 sm:bg-transparent">
                <div className="space-y-2.5 sm:space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.senderUserId === user?.id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[82%] sm:max-w-xs lg:max-w-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-[15px] sm:text-sm ${
                            isMe
                              ? "bg-[#00162E] text-white rounded-br-sm"
                              : "bg-slate-100 text-slate-900 rounded-bl-sm"
                          }`}
                        >
                          {/* Long links and words wrap instead of running off the screen. */}
                          <p className="leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{msg.body}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                            {formatRelativeTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-3 sm:px-4 pt-2.5 sm:pt-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:pb-3 border-t border-slate-100 bg-white dark:bg-slate-900"
              >
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  enterKeyHint="send"
                  className="flex-1 h-11 sm:h-10 rounded-full sm:rounded-xl bg-white text-slate-900 placeholder:text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend() }
                  }}
                />
                <Button type="submit" size="icon" aria-label="Send" className="h-11 w-11 sm:h-10 sm:w-10 rounded-full shrink-0" disabled={!inputText.trim() || sendMutation.isPending}>
                  {sendMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={MessageCircle}
                title="Select a conversation"
                description="Choose a conversation to start chatting."
              />
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {contacts.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  {isLandlord
                    ? "You have no active tenants to message. Invite a tenant first."
                    : "You have no active tenancy. Accept an invite or browse listings to get started."}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-3">Select who you want to message:</p>
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left border border-slate-100"
                    onClick={() => startMutation.mutate(contact.id)}
                    disabled={startMutation.isPending}
                  >
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={contact.avatarUrl} />
                      <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900">{contact.name}</p>
                      <p className="text-xs text-slate-400">
                        {contact.role}{contact.property ? ` · ${contact.property}` : ""}
                      </p>
                    </div>
                    {startMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
