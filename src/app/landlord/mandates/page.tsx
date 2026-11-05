"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  mandatesApi,
  LEVEL_LABEL,
  LEVEL_HINT,
  PAYOUT_LABEL,
  STATUS_LABEL,
  mandateStatusVariant,
  type Mandate,
} from "@/lib/api/mandates"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { extractApiError, formatDate } from "@/lib/utils"
import { Loader2, Phone, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

/**
 * The landlord's view of the authority agents hold (or have asked for) over
 * their properties. Accept, decline, or end it in one tap.
 */
export default function LandlordMandatesPage() {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const { data, isLoading } = useQuery({
    queryKey: ["landlord-mandates"],
    queryFn: () => mandatesApi.forMe(),
    enabled,
  })
  const mandates = data?.data ?? []

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return <EmptyState icon={ShieldCheck} title="Not available yet" description="Agent authority is coming soon." />
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agent authority</h1>
        <p className="text-slate-500 mt-1">
          Agents you&apos;ve allowed to manage your properties for you. You can end it at any time.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : mandates.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No agent authority"
          description="When an agent asks to manage your properties for you, it will show here."
        />
      ) : (
        <div className="space-y-4">
          {mandates.map((m) => (
            <LandlordMandateCard key={m.id} mandate={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function LandlordMandateCard({ mandate: m }: { mandate: Mandate }) {
  const queryClient = useQueryClient()
  const [confirm, setConfirm] = useState<"accept" | "decline" | "revoke" | null>(null)
  const pending = m.status === "pending_landlord" || m.status === "pending_review"

  const act = useMutation({
    mutationFn: (kind: "accept" | "decline" | "revoke") =>
      kind === "accept" ? mandatesApi.accept(m.id) : kind === "decline" ? mandatesApi.decline(m.id) : mandatesApi.revoke(m.id),
    onSuccess: (_res, kind) => {
      toast.success(kind === "accept" ? "Confirmed" : kind === "decline" ? "Request declined" : "Authority ended")
      setConfirm(null)
      queryClient.invalidateQueries({ queryKey: ["landlord-mandates"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not update this")),
  })

  const agentName = m.agent?.name ?? "Your agent"
  const copy = {
    accept: {
      title: `Give ${agentName} this authority?`,
      body: `${LEVEL_HINT[m.level]} ${PAYOUT_LABEL[m.payoutDestination]}.${m.managementFeePercent != null ? ` Their fee: ${m.managementFeePercent}%.` : ""} You can end it at any time.`,
      cta: "Yes, confirm",
    },
    decline: { title: "Decline this request?", body: `${agentName} will be told.`, cta: "Decline" },
    revoke: { title: `End ${agentName}'s authority?`, body: `${agentName} will be told straight away.`, cta: "End authority" },
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                {agentName}
                {m.agent?.agencyName && <span className="font-normal text-slate-500"> · {m.agent.agencyName}</span>}
              </h3>
              <Badge variant={mandateStatusVariant(m.status)}>{STATUS_LABEL[m.status]}</Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {LEVEL_LABEL[m.level]} · {PAYOUT_LABEL[m.payoutDestination]}
              {m.managementFeePercent != null && ` · ${m.managementFeePercent}% fee`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {m.startsAt ? `Since ${formatDate(m.startsAt)}` : `Asked on ${formatDate(m.createdAt)}`}
              {m.endsAt && ` · Ends ${formatDate(m.endsAt)}`}
            </p>
          </div>
          {m.agent?.phone && (
            <a href={`tel:${m.agent.phone}`} className="inline-flex items-center gap-1.5 text-sm text-[#005AF1] hover:underline">
              <Phone className="h-3.5 w-3.5" /> Call
            </a>
          )}
        </div>

        {pending && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setConfirm("accept")}>Confirm</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirm("decline")}>Decline</Button>
          </div>
        )}
        {m.status === "active" && (
          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => setConfirm("revoke")}>
            End authority
          </Button>
        )}
        {!pending && m.status !== "active" && m.endReason && (
          <p className="text-sm text-slate-500 rounded-xl bg-slate-50 p-3">{m.endReason}</p>
        )}
      </CardContent>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        {confirm && (
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{copy[confirm].title}</DialogTitle>
              <DialogDescription>{copy[confirm].body}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button
                variant={confirm === "accept" ? "default" : "destructive"}
                disabled={act.isPending}
                onClick={() => act.mutate(confirm)}
                className="gap-2"
              >
                {act.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {copy[confirm].cta}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  )
}
