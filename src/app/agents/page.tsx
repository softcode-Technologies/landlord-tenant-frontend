"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { agentsApi } from "@/lib/api/agents"
import { messagingApi } from "@/lib/api/messaging"
import { useAuthStore } from "@/lib/store/auth"
import { getInitials } from "@/lib/utils"
import { Star, Building, MapPin, Phone, CheckCircle2, Search, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AgentsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [contactingId, setContactingId] = useState<string | null>(null)
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ["agents", page],
    queryFn: () => agentsApi.getDirectory({ page, limit: 12 }),
  })

  const messageMutation = useMutation({
    mutationFn: (recipientUserId: string) =>
      messagingApi.createConversation({
        recipientUserId,
        body: "Hi, I'd like to inquire about your available properties.",
      }),
    onSuccess: () => {
      const role = user?.tenantProfile
        ? "tenant"
        : user?.landlordProfile
        ? "landlord"
        : user?.agentProfile
        ? "agent"
        : "tenant"
      router.push(`/${role}/messages`)
    },
    onError: () => {
      toast.error("Failed to start conversation.")
      setContactingId(null)
    },
  })

  const handleContactAgent = (agentUserId: string) => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    setContactingId(agentUserId)
    messageMutation.mutate(agentUserId)
  }

  const agents = data?.data?.data ?? []
  const meta = data?.data?.pagination

  const filtered = search
    ? agents.filter((a) => {
        const name = `${a.user?.firstName ?? ""} ${a.user?.lastName ?? ""}`.toLowerCase()
        return name.includes(search.toLowerCase())
      })
    : agents

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-[#1a3c5e] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Find an Agent</h1>
          <p className="text-slate-300">
            Connect with verified property agents across Nigeria
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search */}
        <div className="max-w-md mb-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search agents by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500">No agents found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((agent) => {
              const name =
                `${agent.user?.firstName ?? ""} ${agent.user?.lastName ?? ""}`.trim() ||
                "Agent"
              return (
                <Card
                  key={agent.id}
                  className="hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={agent.user?.avatarUrl} />
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-semibold text-slate-900 text-sm truncate">
                            {name}
                          </h3>
                          {agent.isVerified && (
                            <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <Badge variant="secondary" className="text-[10px] mt-0.5">
                          Verified Agent
                        </Badge>
                      </div>
                    </div>

                    {agent.bio && (
                      <p className="text-xs text-slate-500 mb-4 line-clamp-2">{agent.bio}</p>
                    )}

                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-[#f97316] text-[#f97316]" />
                          <span className="text-sm font-bold text-slate-900">
                            {agent.rating != null ? Number(agent.rating).toFixed(1) : "N/A"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Rating</p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Building className="h-3.5 w-3.5 text-[#1a3c5e]" />
                          <span className="text-sm font-bold text-slate-900">
                            {agent.totalProperties ?? 0}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Properties</p>
                      </div>
                    </div>

                    {(agent.city || agent.state) && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-4">
                        <MapPin className="h-3 w-3" />
                        {[agent.city, agent.state].filter(Boolean).join(", ")}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full text-sm h-9"
                      onClick={() => handleContactAgent(agent.userId)}
                      disabled={messageMutation.isPending && contactingId === agent.userId}
                    >
                      {messageMutation.isPending && contactingId === agent.userId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Phone className="h-3.5 w-3.5" />
                      )}
                      Contact Agent
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-slate-600">
              Page {page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= meta.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
