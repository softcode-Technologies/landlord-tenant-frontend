"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { mandatesApi, LEVEL_LABEL, PAYOUT_LABEL, DOCUMENT_LABEL, type Mandate } from "@/lib/api/mandates"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { extractApiError, formatDateTime } from "@/lib/utils"
import { ExternalLink, FileText, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

/**
 * Mandates sent by the documents route: the agent couldn't get the landlord to
 * confirm by phone, so a person checks the paperwork. Approve only when the ID
 * matches the owner on the proof of ownership and the authority is signed.
 */
export default function AdminMandatesPage() {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const { data, isLoading } = useQuery({
    queryKey: ["admin-mandate-queue"],
    queryFn: () => mandatesApi.reviewQueue(),
    enabled,
  })
  const queue = data?.data?.mandates ?? []

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Mandates are off"
        description="Set AGENT_FULL_MANAGEMENT_ENABLED=true on the backend to turn them on."
      />
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mandate reviews</h1>
        <p className="text-slate-500 mt-1">
          Agents asking for authority with documents. Check the ID matches the owner, and the authority is signed.
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : queue.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Nothing to review" description="New document submissions will show here." />
      ) : (
        <div className="space-y-4">
          {queue.map((m) => (
            <ReviewCard key={m.id} mandate={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewCard({ mandate: m }: { mandate: Mandate }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<"approve" | "reject" | null>(null)
  const [text, setText] = useState("")

  const act = useMutation({
    mutationFn: () => (mode === "approve" ? mandatesApi.approve(m.id, text.trim() || undefined) : mandatesApi.reject(m.id, text.trim())),
    onSuccess: () => {
      toast.success(mode === "approve" ? "Approved" : "Rejected")
      setMode(null)
      setText("")
      queryClient.invalidateQueries({ queryKey: ["admin-mandate-queue"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not update this")),
  })

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Agent</p>
            <p className="font-medium text-slate-900">{m.agent?.name}</p>
            {m.agent?.agencyName && <p className="text-slate-500">{m.agent.agencyName}</p>}
            {m.agent?.phone && <p className="text-slate-500">{m.agent.phone}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Landlord</p>
            <p className="font-medium text-slate-900">{m.landlord?.name}</p>
            {m.landlord?.phone && <p className="text-slate-500">{m.landlord.phone}</p>}
          </div>
        </div>

        <p className="text-sm text-slate-600">
          {LEVEL_LABEL[m.level]} · {PAYOUT_LABEL[m.payoutDestination]}
          {m.managementFeePercent != null && ` · ${m.managementFeePercent}% fee`}
          <span className="text-slate-400"> · Requested {formatDateTime(m.createdAt)}</span>
        </p>

        <ul className="space-y-1.5">
          {(m.documents ?? []).map((d) => (
            <li key={d.id}>
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="truncate flex-1">{DOCUMENT_LABEL[d.kind]}{d.fileName ? ` · ${d.fileName}` : ""}</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => setMode("approve")}>Approve</Button>
          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => setMode("reject")}>
            Reject
          </Button>
        </div>
      </CardContent>

      <Dialog open={mode !== null} onOpenChange={(o) => { if (!o) { setMode(null); setText("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "approve" ? "Approve this mandate?" : "Reject this mandate?"}</DialogTitle>
            <DialogDescription>
              {mode === "approve"
                ? "It becomes active straight away. The landlord gets an SMS with a link to stop it."
                : "The agent sees your reason."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor={`note-${m.id}`}>{mode === "approve" ? "Note (optional)" : "Reason"}</Label>
            <Textarea
              id={`note-${m.id}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={1000}
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)}>Cancel</Button>
            <Button
              variant={mode === "approve" ? "default" : "destructive"}
              disabled={act.isPending || (mode === "reject" && text.trim().length < 3)}
              onClick={() => act.mutate()}
              className="gap-2"
            >
              {act.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
