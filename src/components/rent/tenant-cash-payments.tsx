"use client"

import { useQuery } from "@tanstack/react-query"
import { rentRecordsApi } from "@/lib/api/rent-records"
import { useAgentFullManagementEnabled } from "@/lib/hooks/use-app-config"
import { CashLedgerList } from "@/components/rent/cash-ledger"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Rent this tenant paid by cash, transfer or POS on one tenancy, as recorded by
 * the landlord or agent. Hidden when there are none, so most tenants never see it.
 */
export function TenantCashPayments({ tenancyId }: { tenancyId: string }) {
  const enabled = useAgentFullManagementEnabled()
  const { data } = useQuery({
    queryKey: ["cash-ledger", "tenant"],
    queryFn: () => rentRecordsApi.mine("tenant"),
    enabled,
  })
  const records = (data?.data?.records ?? []).filter((r) => r.tenancyId === tenancyId)
  if (!enabled || records.length === 0) return null
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash and transfer payments</CardTitle>
      </CardHeader>
      <CardContent>
        <CashLedgerList records={records} viewer="tenant" />
      </CardContent>
    </Card>
  )
}
