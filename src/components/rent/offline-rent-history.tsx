"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { rentRecordsApi, METHOD_LABEL, RECORD_STATUS_LABEL, type OfflineRentRecord } from "@/lib/api/rent-records"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { extractApiError, formatDate, formatNaira } from "@/lib/utils"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Rent paid outside Krib on one tenancy. The landlord can cancel any record;
 * the person who recorded one can cancel it within 24 hours.
 */
export function OfflineRentHistory({ tenancyId, viewer }: { tenancyId: string; viewer: "landlord" | "agent" }) {
  const queryClient = useQueryClient()
  const [voiding, setVoiding] = useState<OfflineRentRecord | null>(null)
  const [reason, setReason] = useState("")
  // Fixed at mount: only decides whether to show the Cancel button.
  const [now] = useState(() => Date.now())

  const { data, isLoading } = useQuery({
    queryKey: ["offline-rent", tenancyId],
    queryFn: () => rentRecordsApi.forTenancy(tenancyId),
  })
  const records = data?.data ?? []

  const cancel = useMutation({
    mutationFn: () => rentRecordsApi.void(voiding!.id, reason.trim()),
    onSuccess: (res) => {
      toast.success(
        res.data?.datesRestored === false
          ? "Cancelled. The tenancy dates changed since, so check them."
          : "Record cancelled",
      )
      setVoiding(null)
      setReason("")
      queryClient.invalidateQueries({ queryKey: ["offline-rent", tenancyId] })
      queryClient.invalidateQueries({ queryKey: ["agent-tenancies"] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", tenancyId] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not cancel the record")),
  })

  if (isLoading) return <Skeleton className="h-16 rounded-xl" />
  if (records.length === 0) {
    return <p className="text-sm text-slate-500">No cash or transfer payments recorded yet.</p>
  }

  // Only one agent can hold full management of a landlord, so an agent's own
  // records are the agent-recorded ones. The server makes the real decision.
  const canCancel = (r: OfflineRentRecord) =>
    r.status !== "voided" &&
    (viewer === "landlord" ||
      (r.recordedBy.isAgent && r.status === "recorded" && now - new Date(r.createdAt).getTime() < DAY_MS))

  return (
    <>
      <ul className="space-y-2">
        {records.map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-200 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">{formatNaira(r.amountKobo)}</span>
                <Badge variant={r.status === "recorded" ? "secondary" : r.status === "disputed" ? "destructive" : "outline"}>
                  {RECORD_STATUS_LABEL[r.status]}
                </Badge>
                {!r.advancedLease && r.status !== "voided" && <Badge variant="outline">Part payment</Badge>}
              </div>
              <div className="flex items-center gap-2">
                {r.receiptUrl && (
                  <a href={r.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#005AF1] hover:underline">
                    <FileText className="h-3.5 w-3.5" /> Receipt
                  </a>
                )}
                {canCancel(r) && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:text-red-600" onClick={() => setVoiding(r)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {METHOD_LABEL[r.method]} · paid {formatDate(r.paidOn)} · {r.receivedBy === "agent" ? "held by the agent" : "paid to the landlord"} · recorded by {r.recordedBy.name}
              {r.advancedLease && r.status !== "voided" && ` · paid up to ${formatDate(r.newEndDate)}`}
            </p>
            {r.note && <p className="text-xs text-slate-500 mt-1">“{r.note}”</p>}
            {r.status === "disputed" && <p className="text-xs text-red-500 mt-1">The landlord said this is wrong. Krib is reviewing it.</p>}
            {r.status === "voided" && r.voidReason && <p className="text-xs text-slate-400 mt-1">Cancelled: {r.voidReason}</p>}
          </li>
        ))}
      </ul>

      <Dialog open={voiding !== null} onOpenChange={(o) => { if (!o) { setVoiding(null); setReason("") } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this record?</DialogTitle>
            <DialogDescription>
              {voiding?.advancedLease
                ? "The tenancy goes back to its previous dates, if nothing else changed them since."
                : "The record will be marked as cancelled."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="void-reason">Reason</Label>
            <Textarea id="void-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} className="mt-1.5" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoiding(null)}>Keep it</Button>
            <Button variant="destructive" disabled={reason.trim().length < 3 || cancel.isPending} onClick={() => cancel.mutate()} className="gap-2">
              {cancel.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Cancel record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
