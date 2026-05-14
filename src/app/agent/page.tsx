"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { useAuthStore } from "@/lib/store/auth"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNaira } from "@/lib/utils"
import { Building2, DollarSign, Star, TrendingUp } from "lucide-react"

export default function AgentDashboard() {
  const { user } = useAuthStore()
  const firstName = user?.firstName ?? "Agent"

  const { data: analyticsData } = useQuery({
    queryKey: ["agent-analytics"],
    queryFn: () => analyticsApi.getAgentAnalytics(),
  })

  const analytics = analyticsData?.data
  const agentProfile = user?.agentProfile

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1a3c5e] to-[#1e4a72] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {firstName}!</h1>
        <p className="text-slate-300 text-sm">Your agent dashboard overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Managed Properties"
          value={agentProfile?.totalProperties ?? analytics?.managedProperties ?? 0}
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
          title="Average Rating"
          value={agentProfile?.rating != null ? Number(agentProfile.rating).toFixed(1) : analytics?.rating != null ? Number(analytics.rating).toFixed(1) : "N/A"}
          icon={Star}
          iconColor="text-[#f97316]"
          iconBg="bg-orange-50"
          subtitle="out of 5.0"
        />
        <StatCard
          title="Performance"
          value="On Track"
          icon={TrendingUp}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle="This month"
        />
      </div>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Profile Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {agentProfile ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "License Number", value: agentProfile.licenseNumber ?? "Not set" },
                { label: "Verified", value: agentProfile.isVerified ? "Yes" : "Pending" },
                { label: "Rating", value: `${agentProfile.rating != null ? Number(agentProfile.rating).toFixed(1) : "N/A"} / 5.0` },
                { label: "Properties", value: agentProfile.totalProperties ?? 0 },
              ].map((item) => (
                <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                  <p className="font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Profile information not available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
