"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { adminApi } from "@/lib/api/admin"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira } from "@/lib/utils"
import { Users, Building, DollarSign, Shield, TrendingUp } from "lucide-react"

export default function AdminAnalyticsPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => analyticsApi.getAdminStats(),
  })

  const { data: analyticsData } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => analyticsApi.getAdminAnalytics(),
  })

  const stats = statsData?.data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
        <p className="text-slate-500 mt-1">Comprehensive platform performance overview</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Users"
            value={(stats?.totalUsers ?? 0).toLocaleString()}
            change={`+${stats?.newUsersThisMonth ?? 0} this month`}
            changeType="positive"
            icon={Users}
            iconColor="text-[#1a3c5e]"
            iconBg="bg-[#1a3c5e]/10"
          />
          <StatCard
            title="Total Properties"
            value={(stats?.totalProperties ?? 0).toLocaleString()}
            icon={Building}
            iconColor="text-green-600"
            iconBg="bg-green-50"
          />
          <StatCard
            title="Total Revenue"
            value={stats ? formatNaira(stats.totalRevenue) : "₦0"}
            icon={DollarSign}
            iconColor="text-[#f97316]"
            iconBg="bg-orange-50"
          />
          <StatCard
            title="Active Tenancies"
            value={(stats?.activetenancies ?? 0).toLocaleString()}
            icon={TrendingUp}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
          />
          <StatCard
            title="New Users (Month)"
            value={(stats?.newUsersThisMonth ?? 0).toLocaleString()}
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />
          <StatCard
            title="Pending KYC"
            value={stats?.pendingKyc ?? 0}
            icon={Shield}
            iconColor="text-red-500"
            iconBg="bg-red-50"
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Platform Growth Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Detailed analytics charts coming soon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
