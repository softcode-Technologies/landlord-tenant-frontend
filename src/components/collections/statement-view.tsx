"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { collectionsApi, REMITTANCE_STATUS_LABEL, type Statement, type Remittance } from "@/lib/api/collections"
import { METHOD_LABEL } from "@/lib/api/rent-records"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { extractApiError, formatDate, formatNaira } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

/** The four numbers that matter, in plain words. */
export function StatementTotals({ s, viewer }: { s: Statement | Omit<Statement, "collected" | "remittances">; viewer: "agent" | "landlord" }) {
  const items: [string, number, string?][] = [
    [viewer === "agent" ? "Rent you collected" : "Rent your agent collected", s.collectedKobo],
    [viewer === "agent" ? "Your fee" : "Agent's fee", s.managementFeeKobo],
    [viewer === "agent" ? "Paid to landlord" : "Paid to you", s.remittedKobo],
    [viewer === "agent" ? "You still owe" : "Still owed to you", Math.max(0, s.outstandingKobo), s.outstandingKobo > 0 ? "text-amber-700" : "text-emerald-700"],
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map(([label, kobo, tone]) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">{label}</p>
          <p className={`mt-1 font-semibold ${tone ?? "text-slate-900"}`}>{formatNaira(kobo)}</p>
        </div>
      ))}
      {s.disputedKobo > 0 && (
        <p className="col-span-2 sm:col-span-4 text-sm text-red-700">
          {formatNaira(s.disputedKobo)} is under review: {viewer === "agent" ? "the landlord says they didn't receive it." : "you said you didn't receive it."}
        </p>
      )}
    </div>
  )
}

/** Collected rent and payments to the landlord, newest first. */
export function StatementDetail({ s, viewer, queryKey }: { s: Statement; viewer: "agent" | "landlord"; queryKey: unknown[] }) {
  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">Rent collected through Krib</h3>
          {s.collected.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.collected.map((c) => (
                <li key={c.escrowId} className="py-2.5 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="text-slate-700">
                    {c.propertyName ?? "Property"}
                    {c.unitNumber ? ` · ${c.unitNumber}` : ""}
                    <span className="text-slate-400"> · {c.releasedAt ? formatDate(c.releasedAt) : ""}</span>
                  </span>
                  <span className="text-slate-900">
                    {formatNaira(c.agentAmountKobo)} <span className="text-slate-400">− fee {formatNaira(c.managementFeeKobo)} =</span>{" "}
                    <span className="font-medium">{formatNaira(c.owedKobo)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-slate-900 mb-3">{viewer === "agent" ? "Payments to the landlord" : "Payments to you"}</h3>
          {s.remittances.length === 0 ? (
            <p className="text-sm text-slate-500">None recorded yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {s.remittances.map((r) => (
                <RemittanceRow key={r.id} r={r} queryKey={queryKey} />
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-400 mt-3">
            Payments are recorded by the agent. Krib didn&apos;t move this money{viewer === "landlord" ? "; the SMS we sent you has a link to report one you didn't get" : ""}.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function RemittanceRow({ r, queryKey }: { r: Remittance; queryKey: unknown[] }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const cancel = useMutation({
    mutationFn: () => collectionsApi.voidRemittance(r.id, reason.trim()),
    onSuccess: () => {
      toast.success("Record cancelled")
      setOpen(false)
      queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not cancel")),
  })
  return (
    <li className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className={r.status === "voided" ? "text-slate-400 line-through" : "text-slate-700"}>
        {formatNaira(r.amountKobo)} · {METHOD_LABEL[r.method]} · {formatDate(r.paidOn)}
        {r.reference ? <span className="text-slate-400"> · ref {r.reference}</span> : null}
      </span>
      <span className="flex items-center gap-2">
        {r.status !== "recorded" && (
          <Badge variant={r.status === "disputed" ? "destructive" : "outline"}>{REMITTANCE_STATUS_LABEL[r.status]}</Badge>
        )}
        {r.canVoid && (
          <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Cancel</Button>
        )}
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this record?</DialogTitle>
            <DialogDescription>Use this to fix a mistake. The amount goes back to what you owe.</DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor={`v-${r.id}`}>Reason</Label>
            <Textarea id={`v-${r.id}`} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} className="mt-1.5" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Back</Button>
            <Button variant="destructive" disabled={reason.trim().length < 3 || cancel.isPending} onClick={() => cancel.mutate()} className="gap-2">
              {cancel.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancel record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}
