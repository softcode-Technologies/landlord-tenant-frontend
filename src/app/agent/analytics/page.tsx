"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNaira } from "@/lib/utils"
import { Building2, Wallet, Clock, Handshake, Star } from "lucide-react"

export default function AgentAnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["agent-analytics"],
    queryFn: () => analyticsApi.getAgentAnalytics(),
  })

  const analytics = data?.data
  const paid = analytics?.paidCommissions
  const pending = analytics?.pendingCommissions

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Your performance and earnings</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Managed Properties"
          value={analytics?.managedProperties ?? 0}
          icon={Building2}
          iconColor="text-[#1a3c5e]"
          iconBg="bg-[#1a3c5e]/10"
        />
        <StatCard
          title="Total Earned"
          value={formatNaira(paid?.totalKobo ?? 0)}
          icon={Wallet}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Pending Payout"
          value={formatNaira(pending?.totalKobo ?? 0)}
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
        <StatCard
          title="Deals Closed"
          value={analytics?.totalDeals ?? 0}
          icon={Handshake}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commission Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-green-800">Paid</p>
                <p className="text-xs text-green-600">{paid?.count ?? 0} commission{(paid?.count ?? 0) === 1 ? "" : "s"}</p>
              </div>
              <p className="text-lg font-bold text-green-700">{formatNaira(paid?.totalKobo ?? 0)}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-amber-800">Pending</p>
                <p className="text-xs text-amber-600">{pending?.count ?? 0} commission{(pending?.count ?? 0) === 1 ? "" : "s"}</p>
              </div>
              <p className="text-lg font-bold text-amber-700">{formatNaira(pending?.totalKobo ?? 0)}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-700">Total commissions recorded</p>
              <p className="text-lg font-bold text-slate-900">{analytics?.totalCommissions ?? 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reputation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex items-center gap-1 text-[#f97316]">
                <Star className="h-7 w-7 fill-current" />
                <span className="text-4xl font-bold text-slate-900">
                  {analytics?.rating != null && Number(analytics.rating) > 0 ? Number(analytics.rating).toFixed(1) : "—"}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                {analytics?.rating != null && Number(analytics.rating) > 0
                  ? "Average rating from tenants"
                  : "No ratings yet — ratings appear after completed deals."}
              </p>
              <p className="text-xs text-slate-400 mt-1">{analytics?.totalDeals ?? 0} deals closed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
