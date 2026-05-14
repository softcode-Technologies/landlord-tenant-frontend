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
import { ScrollArea } from "@/components/ui/scroll-area"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { getInitials, formatRelativeTime } from "@/lib/utils"
import type { Message, Conversation } from "@/lib/types"
import { MessageCircle, Send, Loader2, Plus } from "lucide-react"
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

    socket.on("new_message", (msg: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev
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
      setMessages(res.data ?? [])
    })
    socketRef.current?.emit("join_conversation", selected.id)
    return () => { socketRef.current?.emit("leave_conversation", selected.id) }
  }, [selected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
    onSuccess: (res) => {
      setComposeOpen(false)
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
      setSelected(res.data)
      toast.success("Conversation started!")
    },
    onError: () => toast.error("Failed to start conversation."),
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

  const getOtherParticipant = (conv: Conversation) =>
    conv.participants?.find((p) => p.id !== user?.id) ?? conv.participants?.[0]

  const doSend = () => {
    if (!inputText.trim() || !selected) return
    sendMutation.mutate()
  }

  const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    doSend()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-slate-500 mt-1">Real-time conversations with landlords and agents</p>
      </div>

      <div className="flex gap-0 h-[calc(100vh-250px)] min-h-[500px] bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Conversations list */}
        <div className="w-full sm:w-80 border-r border-slate-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Conversations</p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={() => setComposeOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          </div>

          <ScrollArea className="flex-1">
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
                      onClick={() => setSelected(conv)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left ${
                        selected?.id === conv.id ? "bg-slate-50" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={other?.avatarUrl} />
                        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
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
                        <span className="bg-[#f97316] text-white text-xs rounded-full px-1.5 py-0.5 shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selected ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
                {(() => {
                  const other = getOtherParticipant(selected)
                  const name = other
                    ? `${other.firstName ?? ""} ${other.lastName ?? ""}`.trim() || "User"
                    : "Unknown"
                  return (
                    <>
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={other?.avatarUrl} />
                        <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm text-slate-900">{name}</p>
                        {selected.property && (
                          <p className="text-xs text-slate-500">{selected.property.name}</p>
                        )}
                      </div>
                    </>
                  )
                })()}
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.senderUserId === user?.id
                    return (
                      <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                            isMe
                              ? "bg-[#1a3c5e] text-white rounded-br-sm"
                              : "bg-slate-100 text-slate-900 rounded-bl-sm"
                          }`}
                        >
                          <p className="leading-relaxed">{msg.body}</p>
                          <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-slate-400"}`}>
                            {formatRelativeTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-4 py-3 border-t border-slate-100"
              >
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend() }
                  }}
                />
                <Button type="submit" size="icon" disabled={!inputText.trim() || sendMutation.isPending}>
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
                description="Choose a conversation from the left to start chatting."
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
