"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { rentRecordsApi, METHOD_LABEL, type OfflineRentRecord } from "@/lib/api/rent-records"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { extractApiError, formatDate, formatDateTime, formatNaira } from "@/lib/utils"
import { FileText, Loader2, Scale } from "lucide-react"
import { toast } from "sonner"

const REASON_LABEL: Record<string, string> = {
  not_paid: "Landlord says they were not paid",
  wrong_amount: "Landlord says the amount or date is wrong",
  other: "Landlord reported a problem",
}

/**
 * Cash/transfer rent records a landlord reported as wrong. Keep one when the
 * tenant or agent shows proof; cancel it (which puts the tenancy dates back)
 * when it doesn't hold up.
 */
export default function AdminRentDisputesPage() {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const { data, isLoading } = useQuery({
    queryKey: ["admin-rent-disputes"],
    queryFn: () => rentRecordsApi.disputed(),
    enabled,
  })
  const rows = data?.data ?? []

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return <EmptyState icon={Scale} title="Off" description="Set AGENT_FULL_MANAGEMENT_ENABLED=true on the backend to turn this on." />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rent disputes</h1>
        <p className="text-slate-500 mt-1">Cash and transfer payments a landlord reported as wrong.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Scale} title="No disputes" description="Reported payments will show here." />
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <DisputeCard key={r.id} record={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function DisputeCard({ record: r }: { record: OfflineRentRecord }) {
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<"keep" | "cancel" | null>(null)
  const [text, setText] = useState("")

  const act = useMutation({
    mutationFn: () => (mode === "keep" ? rentRecordsApi.uphold(r.id, text.trim() || undefined) : rentRecordsApi.void(r.id, text.trim())),
    onSuccess: (res) => {
      toast.success(
        mode === "keep"
          ? "Record kept"
          : res.data?.datesRestored === false
            ? "Cancelled. The tenancy dates changed since. Check them by hand."
            : "Cancelled and tenancy dates restored",
      )
      setMode(null)
      setText("")
      queryClient.invalidateQueries({ queryKey: ["admin-rent-disputes"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not update this")),
  })

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">{formatNaira(r.amountKobo)} · {METHOD_LABEL[r.method]}</p>
            <p className="text-sm text-slate-600 mt-0.5">
              Paid {formatDate(r.paidOn)} · {r.receivedBy === "agent" ? "agent says they hold it" : "said to be paid to the landlord"} · recorded by {r.recordedBy.name}
              {r.recordedBy.isAgent ? " (agent)" : ""}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Recorded {formatDateTime(r.createdAt)} · tenancy {r.tenancyId.slice(0, 8)}
              {r.reference ? ` · ref ${r.reference}` : ""}
            </p>
          </div>
          {r.receiptUrl && (
            <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#005AF1] hover:underline">
              <FileText className="h-4 w-4" /> Receipt
            </a>
          )}
        </div>
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {REASON_LABEL[r.disputeReason ?? "other"] ?? REASON_LABEL.other}
          {r.disputeNote ? `: “${r.disputeNote}”` : "."}
        </div>
        {r.note && <p className="text-sm text-slate-500">Recorder&apos;s note: “{r.note}”</p>}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setMode("keep")}>Keep record</Button>
          <Button size="sm" variant="destructive" onClick={() => setMode("cancel")}>Cancel record</Button>
        </div>
      </CardContent>

      <Dialog open={mode !== null} onOpenChange={(o) => { if (!o) { setMode(null); setText("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{mode === "keep" ? "Keep this record?" : "Cancel this record?"}</DialogTitle>
            <DialogDescription>
              {mode === "keep"
                ? "Use this when there's proof the tenant paid. The dispute no longer counts against the agent."
                : "The tenancy goes back to its earlier dates if nothing changed them since. The landlord sees this in their activity."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor={`t-${r.id}`}>{mode === "keep" ? "Note (optional)" : "Reason"}</Label>
            <Textarea id={`t-${r.id}`} value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={1000} className="mt-1.5" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMode(null)}>Back</Button>
            <Button
              variant={mode === "keep" ? "default" : "destructive"}
              disabled={act.isPending || (mode === "cancel" && text.trim().length < 3)}
              onClick={() => act.mutate()}
              className="gap-2"
            >
              {act.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "keep" ? "Keep record" : "Cancel record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
