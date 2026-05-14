"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { commissionsApi } from "@/lib/api/commission"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, formatDate } from "@/lib/utils"
import { DollarSign } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"

export default function AgentCommissionsPage() {
  const { data: analyticsData } = useQuery({
    queryKey: ["agent-analytics"],
    queryFn: () => analyticsApi.getAgentAnalytics(),
  })

  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ["agent-commissions"],
    queryFn: () => commissionsApi.getAgentCommissions(),
  })

  const analytics = analyticsData?.data
  const commissions = commissionsData?.data ?? []

  const pendingTotal = commissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + c.amountEarnedKobo, 0)

  const thisMonthTotal = commissions
    .filter((c) => {
      if (!c.paidAt) return false
      const paid = new Date(c.paidAt)
      const now = new Date()
      return paid.getMonth() === now.getMonth() && paid.getFullYear() === now.getFullYear()
    })
    .reduce((sum, c) => sum + c.amountEarnedKobo, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Commissions</h1>
        <p className="text-slate-500 mt-1">Track your earnings from managed properties</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-[#1a3c5e]">
              {analytics ? formatNaira(analytics.totalCommissions) : "₦0"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">This Month</p>
            <p className="text-2xl font-bold text-green-600">
              {formatNaira(thisMonthTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">
              {formatNaira(pendingTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : commissions.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No commissions yet"
              description="Your commission history will appear here once you manage properties."
            />
          ) : (
            <div className="space-y-2">
              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {commission.property?.name ?? "Property Commission"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {commission.commissionType === "percentage"
                        ? `${commission.commissionValue}%`
                        : "Flat fee"}{" "}
                      &middot;{" "}
                      {commission.paidAt ? formatDate(commission.paidAt) : "Pending"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-slate-900">
                      {formatNaira(commission.amountEarnedKobo)}
                    </p>
                    <Badge
                      variant={
                        commission.status === "paid"
                          ? "success"
                          : commission.status === "waived"
                          ? "outline"
                          : "secondary"
                      }
                      className="text-xs capitalize"
                    >
                      {commission.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
