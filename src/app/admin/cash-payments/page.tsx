"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { rentRecordsApi, type OfflineRentStatus } from "@/lib/api/rent-records"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { CashLedgerTotals, CashLedgerList } from "@/components/rent/cash-ledger"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/empty-state"
import { Banknote } from "lucide-react"

const FILTERS: { label: string; value: OfflineRentStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Recorded", value: "recorded" },
  { label: "Disputed", value: "disputed" },
  { label: "Cancelled", value: "voided" },
]

/**
 * Every rent payment recorded outside Krib, across all landlords and agents.
 * Krib didn't move this money; this is the record of who says they have it.
 */
export default function AdminCashPaymentsPage() {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const [status, setStatus] = useState<OfflineRentStatus | undefined>(undefined)
  const { data, isLoading } = useQuery({
    queryKey: ["admin-cash-payments", status ?? "all"],
    queryFn: () => rentRecordsApi.all(status),
    enabled,
  })
  const ledger = data?.data

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return <EmptyState icon={Banknote} title="Off" description="Set AGENT_FULL_MANAGEMENT_ENABLED=true on the backend to turn this on." />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cash payments</h1>
        <p className="text-slate-500 mt-1">
          Rent paid by cash, transfer or POS and recorded by landlords or agents. Krib didn&apos;t move this money.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.label}
            size="sm"
            variant={status === f.value ? "default" : "outline"}
            onClick={() => setStatus(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>
      {isLoading || !ledger ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <>
          <CashLedgerTotals totals={ledger.totals} viewer="admin" />
          <CashLedgerList records={ledger.records} viewer="admin" />
        </>
      )}
    </div>
  )
}
