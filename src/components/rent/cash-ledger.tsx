"use client"

import { METHOD_LABEL, RECORD_STATUS_LABEL, type CashLedger, type CashLedgerRow } from "@/lib/api/rent-records"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatNaira } from "@/lib/utils"
import { FileText } from "lucide-react"

type Viewer = "landlord" | "agent" | "tenant" | "admin"

/** The headline numbers for rent paid outside Krib. */
export function CashLedgerTotals({ totals, viewer }: { totals: CashLedger["totals"]; viewer: Viewer }) {
  const items: [string, number, string?][] = [
    [viewer === "tenant" ? "You paid (recorded)" : "Recorded payments", totals.recordedKobo],
    [
      viewer === "agent" ? "Held by you" : viewer === "landlord" ? "Held by your agent" : "Held by agents",
      totals.heldByAgentKobo,
      totals.heldByAgentKobo > 0 ? "text-amber-700" : undefined,
    ],
    ["Under review", totals.disputedKobo, totals.disputedKobo > 0 ? "text-red-700" : undefined],
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {items.map(([label, kobo, tone]) => (
        <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">{label}</p>
          <p className={`mt-1 font-semibold ${tone ?? "text-slate-900"}`}>{formatNaira(kobo)}</p>
        </div>
      ))}
    </div>
  )
}

/** Every cash, transfer or POS rent payment, newest first. */
export function CashLedgerList({ records, viewer }: { records: CashLedgerRow[]; viewer: Viewer }) {
  if (records.length === 0) {
    return <p className="text-sm text-slate-500">No cash or transfer payments recorded yet.</p>
  }
  return (
    <ul className="space-y-2">
      {records.map((r) => {
        const voided = r.status === "voided"
        const place = [r.propertyName, r.unitNumber].filter(Boolean).join(" · ")
        return (
          <li key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`font-medium ${voided ? "text-slate-400 line-through" : "text-slate-900"}`}>
                  {formatNaira(r.amountKobo)}
                </span>
                {r.status !== "recorded" && (
                  <Badge variant={r.status === "disputed" ? "destructive" : "outline"}>{RECORD_STATUS_LABEL[r.status]}</Badge>
                )}
                {!voided && r.receivedBy === "agent" && <Badge variant="secondary">Held by the agent</Badge>}
                {!voided && !r.advancedLease && <Badge variant="outline">Part payment</Badge>}
              </div>
              {r.receiptUrl && (
                <a
                  href={r.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#005AF1] hover:underline"
                >
                  <FileText className="h-3.5 w-3.5" /> Receipt
                </a>
              )}
            </div>
            <p className="text-slate-700 mt-1">
              {place || "Property"}
              {viewer !== "tenant" && r.tenantName ? ` · ${r.tenantName}` : ""}
              {(viewer === "admin" || viewer === "agent") && r.landlordName ? (
                <span className="text-slate-400"> · landlord {r.landlordName}</span>
              ) : null}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {METHOD_LABEL[r.method]} · paid {formatDate(r.paidOn)} ·{" "}
              {r.receivedBy === "agent" ? "the agent received it" : "paid to the landlord"} · recorded by {r.recordedBy.name}
              {r.reference ? ` · ref ${r.reference}` : ""}
            </p>
            {r.status === "disputed" && <p className="text-xs text-red-500 mt-1">The landlord said this is wrong. Krib is reviewing it.</p>}
            {voided && r.voidReason && <p className="text-xs text-slate-400 mt-1">Cancelled: {r.voidReason}</p>}
          </li>
        )
      })}
    </ul>
  )
}
