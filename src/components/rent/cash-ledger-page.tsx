"use client"

import { useQuery } from "@tanstack/react-query"
import { rentRecordsApi, type CashLedgerViewer } from "@/lib/api/rent-records"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { CashLedgerTotals, CashLedgerList } from "@/components/rent/cash-ledger"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { Banknote } from "lucide-react"

const COPY: Record<CashLedgerViewer, { title: string; intro: string }> = {
  landlord: {
    title: "Cash payments",
    intro: "Rent your tenants paid by cash, transfer or POS, recorded by you or your agent. Krib didn't move this money.",
  },
  agent: {
    title: "Cash payments",
    intro: "Rent you recorded for your landlords. Cash you said you're holding is owed to the landlord until you record handing it over under \"Rent you hold\".",
  },
  tenant: {
    title: "Cash payments",
    intro: "Rent you paid by cash, transfer or POS that your landlord or agent recorded.",
  },
}

/** A landlord's, agent's or tenant's full list of rent paid outside Krib. */
export function CashLedgerPage({ as }: { as: CashLedgerViewer }) {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const { data, isLoading } = useQuery({
    queryKey: ["cash-ledger", as],
    queryFn: () => rentRecordsApi.mine(as),
    enabled,
  })
  const ledger = data?.data

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return <EmptyState icon={Banknote} title="Not available yet" description="Recording cash payments isn't switched on yet." />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{COPY[as].title}</h1>
        <p className="text-slate-500 mt-1">{COPY[as].intro}</p>
      </div>
      {isLoading || !ledger ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <>
          <CashLedgerTotals totals={ledger.totals} viewer={as} />
          <CashLedgerList records={ledger.records} viewer={as} />
        </>
      )}
    </div>
  )
}
