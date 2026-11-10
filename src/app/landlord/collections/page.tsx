"use client"

import { useQuery } from "@tanstack/react-query"
import { collectionsApi } from "@/lib/api/collections"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { StatementTotals, StatementDetail } from "@/components/collections/statement-view"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { HandCoins } from "lucide-react"

/** Rent an agent holds for this landlord (through Krib or in cash), and what they've passed on. */
export default function LandlordCollectionsPage() {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const queryKey = ["landlord-collections"]
  const { data, isLoading } = useQuery({ queryKey, queryFn: () => collectionsApi.landlordStatements(), enabled })
  const rows = data?.data ?? []

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return <EmptyState icon={HandCoins} title="Not available yet" description="Agents managing rent for you isn't switched on yet." />
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rent from agents</h1>
        <p className="text-slate-500 mt-1">Rent your agent received for you, through Krib or in cash, and what they&apos;ve paid you.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No agent holds rent for you"
          description="When your agent receives rent for you, what they hold and pay you shows here."
        />
      ) : (
        rows.map((s) => (
          <section key={s.agentProfileId} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">{s.agentName}</h2>
            <StatementTotals s={s} viewer="landlord" />
            <StatementDetail s={s} viewer="landlord" queryKey={queryKey} />
          </section>
        ))
      )}
    </div>
  )
}
