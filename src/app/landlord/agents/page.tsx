"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserCog, Building2, Home, TrendingUp, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { transparencyApi, type AgentScorecard } from "@/lib/api/transparency"
import { extractApiError } from "@/lib/utils"
import { toast } from "sonner"

/**
 * Who manages what, on what terms — and the button that ends it.
 *
 * The scorecard is what makes removal an informed decision rather than a
 * frustrated one, and the credible threat of removal is what makes the rest of
 * the transparency actually bite.
 */

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  revoked: "bg-slate-100 text-slate-600",
  rejected: "bg-red-100 text-red-700",
}

const STATUS_LABEL: Record<string, string> = {
  active: "Managing",
  pending: "Awaiting your confirmation",
  revoked: "Removed",
  rejected: "Reported",
}

export default function LandlordAgentsPage() {
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<AgentScorecard | null>(null)
  const [reason, setReason] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-agents"],
    queryFn: () => transparencyApi.getAgents(),
  })
  const agents = data?.data ?? []

  const revoke = useMutation({
    mutationFn: (agent: AgentScorecard) =>
      transparencyApi.revokeAgent(agent.agentProfileId, { reason: reason.trim() || undefined }),
    onSuccess: (res) => {
      const n = res.data?.propertiesAffected ?? 0
      toast.success(
        `Removed. They no longer have access to ${n} propert${n === 1 ? "y" : "ies"}.`,
      )
      setTarget(null)
      setReason("")
      void queryClient.invalidateQueries({ queryKey: ["landlord-agents"] })
      void queryClient.invalidateQueries({ queryKey: ["landlord-activity"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not remove this agent")),
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My agents</h1>
        <p className="text-slate-500 mt-1">
          How each agent is performing on your properties. You can remove any of them at any time.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      )}

      {!isLoading && agents.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-10">
              <div className="p-3 rounded-xl bg-slate-100 mb-4">
                <UserCog className="h-6 w-6 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">No agents yet</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                When you assign an agent to a property — or confirm one who added a property for
                you — they will appear here with their performance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {agents.map((agent) => (
          <Card key={agent.agentProfileId}>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-slate-900">{agent.name}</h2>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${STATUS_STYLE[agent.status] ?? STATUS_STYLE.revoked}`}
                    >
                      {STATUS_LABEL[agent.status] ?? agent.status}
                    </Badge>
                  </div>
                  {agent.agencyName && (
                    <p className="text-sm text-slate-500 mt-0.5">{agent.agencyName}</p>
                  )}
                </div>

                {(agent.status === "active" || agent.status === "pending") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
                    onClick={() => setTarget(agent)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat icon={Building2} label="Properties" value={String(agent.propertyCount)} />
                <Stat
                  icon={Home}
                  label="Occupancy"
                  value={agent.unitsListed > 0 ? `${agent.occupancyRate}%` : "—"}
                  hint={agent.unitsListed > 0 ? `${agent.unitsOccupied} of ${agent.unitsListed} units` : "No units yet"}
                />
                <Stat icon={TrendingUp} label="Rent collected" value={naira(agent.rentCollectedKobo)} />
                <Stat
                  icon={UserCog}
                  label="They earned"
                  value={naira(agent.commissionEarnedKobo)}
                  hint="Commission on your properties"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Remove {target?.name}?
            </DialogTitle>
            <DialogDescription>
              They immediately lose access to all {target?.propertyCount ?? 0} of your properties and
              can no longer act on your behalf. Your tenants and records are unaffected.
            </DialogDescription>
          </DialogHeader>

          <div>
            <Label htmlFor="reason" className="text-sm">
              Reason <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Helps us improve agent quality"
              className="mt-1.5"
              rows={3}
              maxLength={1000}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={revoke.isPending}
              onClick={() => target && revoke.mutate(target)}
            >
              {revoke.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Building2
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="font-semibold text-slate-900 tabular-nums text-sm">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  )
}
