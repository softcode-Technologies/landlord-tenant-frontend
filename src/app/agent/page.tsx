"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { useAuthStore } from "@/lib/store/auth"
import { useRouter } from "next/navigation"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatNaira } from "@/lib/utils"
import { Building2, DollarSign, Star, TrendingUp, ShieldAlert, ShieldX, Clock } from "lucide-react"

export default function AgentDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const firstName = user?.firstName ?? "Agent"
  const kycStatus = user?.kycStatus ?? "none"

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

      {/* KYC banner */}
      {kycStatus === "none" && (
        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">Verify Your Identity</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Complete identity verification to get a verified agent badge and unlock full platform access.
            </p>
          </div>
          <button
            onClick={() => router.push("/agent/kyc")}
            className="shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Verify Now →
          </button>
        </div>
      )}

      {kycStatus === "pending" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">Verification Under Review</p>
            <p className="text-xs text-blue-700 mt-0.5">
              We received your submission and will notify you within 24 hours.
            </p>
          </div>
        </div>
      )}

      {kycStatus === "rejected" && (
        <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4 flex items-start gap-3">
          <ShieldX className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-red-900 text-sm">Verification Rejected</p>
            <p className="text-xs text-red-700 mt-0.5">
              {user?.kycRejectReason ?? "Your submission was rejected. Please resubmit."}
            </p>
          </div>
          <button
            onClick={() => router.push("/agent/kyc")}
            className="shrink-0 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Resubmit →
          </button>
        </div>
      )}

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
