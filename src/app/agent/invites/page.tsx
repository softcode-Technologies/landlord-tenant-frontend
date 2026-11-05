"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { invitesApi } from "@/lib/api/invites"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { InviteCard } from "@/components/invites/invite-card"
import { UserPlus } from "lucide-react"

type Filter = "pending" | "accepted" | "all"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "all", label: "All" },
]

/**
 * Every tenancy invite on the properties this agent manages — including ones
 * the landlord sent — so the agent can see what's outstanding, resend, or cancel.
 */
export default function AgentInvitesPage() {
  const [filter, setFilter] = useState<Filter>("pending")

  const { data, isLoading } = useQuery({
    queryKey: ["agent-invites"],
    queryFn: () => invitesApi.getInvites(),
  })

  const invites = useMemo(() => data?.data ?? [], [data])
  const counts = useMemo(
    () => ({
      // "Pending" includes lapsed ones: they still need action (resend or cancel).
      pending: invites.filter((i) => i.status === "pending").length,
      accepted: invites.filter((i) => i.status === "accepted").length,
      all: invites.length,
    }),
    [invites],
  )
  const shown = invites.filter((i) => filter === "all" || i.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tenant Invites</h1>
        <p className="text-slate-500 mt-1">
          Invites on the properties you manage. To invite a tenant, open a property and choose a vacant unit.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => setFilter(f.value)}
          >
            {f.label} ({counts[f.value]})
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title={filter === "pending" ? "No pending invites" : "No invites yet"}
          description="Invite a tenant from one of your properties' vacant units and it will show up here."
          actionLabel="Go to properties"
          actionHref="/agent/properties"
        />
      ) : (
        <div className="space-y-4">
          {shown.map((invite) => (
            <InviteCard key={invite.id} invite={invite} showSender />
          ))}
        </div>
      )}
    </div>
  )
}
