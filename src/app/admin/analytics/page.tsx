"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira } from "@/lib/utils"
import {
  Users, Building, TrendingUp, Shield, Home, CreditCard,
} from "lucide-react"

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats(),
  })

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => adminApi.getRevenueBreakdown(),
  })

  const stats = statsData?.data
  const revenue = revenueData?.data
  const isLoading = statsLoading || revenueLoading

  const revenueBreakdown = revenue ? [
    { label: "Inspection Fees", value: revenue.inspection_fee, color: "bg-purple-500", monthValue: revenue.thisMonth.inspection_fee },
    { label: "Rent Revenue", value: revenue.rent, color: "bg-blue-500", monthValue: revenue.thisMonth.rent },
    { label: "Wallet Topups", value: revenue.wallet_topup, color: "bg-green-500", monthValue: 0 },
    { label: "Listing Boosts", value: revenue.listing_boost, color: "bg-orange-500", monthValue: 0 },
  ] : []

  const maxRevenue = Math.max(...revenueBreakdown.map((r) => r.value), 1)

  const platformStats = [
    { label: "Total Users", value: (stats?.totalUsers ?? 0).toLocaleString(), icon: Users, color: "text-[#1a3c5e]", bg: "bg-[#1a3c5e]/10" },
    { label: "Properties Listed", value: (stats?.totalProperties ?? 0).toLocaleString(), icon: Building, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Tenancies", value: (stats?.totalActiveTenancies ?? 0).toLocaleString(), icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "New Users (Month)", value: (stats?.newUsersThisMonth ?? 0).toLocaleString(), icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Pending KYC", value: (stats?.pendingKyc ?? 0).toLocaleString(), icon: Shield, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pending Payments", value: (revenue?.pendingCount ?? 0).toLocaleString(), icon: CreditCard, color: "text-red-500", bg: "bg-red-50" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Platform performance and revenue overview</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {platformStats.map((stat) => (
            <Card key={stat.label} className="border-slate-100">
              <CardContent className="p-5">
                <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Revenue Breakdown */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle className="text-base">Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {revenueLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-[#1a3c5e]/5 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Total Revenue Processed</p>
                  <p className="text-2xl font-bold text-[#1a3c5e]">{formatNaira(revenue?.total ?? 0)}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Platform Commission Earned</p>
                  <p className="text-2xl font-bold text-green-700">{formatNaira(revenue?.platformCommission ?? 0)}</p>
                </div>
              </div>

              <div className="space-y-4">
                {revenueBreakdown.map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{formatNaira(item.value)}</span>
                        {item.monthValue > 0 && (
                          <span className="text-xs text-green-600 ml-2">+{formatNaira(item.monthValue)} this month</span>
                        )}
                      </div>
                    </div>
                    <MiniBar value={item.value} max={maxRevenue} color={item.color} />
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for future charts */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle className="text-base">Growth Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center rounded-xl bg-slate-50">
            <div className="text-center">
              <TrendingUp className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Monthly trend charts coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
