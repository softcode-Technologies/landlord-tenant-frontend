"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNaira } from "@/lib/utils"
import { Building2, DollarSign, Star, TrendingUp } from "lucide-react"

export default function AgentAnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["agent-analytics"],
    queryFn: () => analyticsApi.getAgentAnalytics(),
  })

  const analytics = data?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Your performance metrics</p>
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
          title="Total Commissions"
          value={analytics ? formatNaira(analytics.totalCommissions) : "₦0"}
          icon={DollarSign}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Rating"
          value={analytics?.rating != null ? Number(analytics.rating).toFixed(1) : "N/A"}
          icon={Star}
          iconColor="text-[#f97316]"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Growth"
          value="—"
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Analytics data coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
