"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { tenanciesApi } from "@/lib/api/tenancies"
import { propertiesApi } from "@/lib/api/properties"
import { maintenanceApi } from "@/lib/api/maintenance"
import { useAuthStore } from "@/lib/store/auth"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, formatNairaAmount, formatDate, getStatusVariant } from "@/lib/utils"
import {
  Building2, Users, Wrench, TrendingUp, ArrowRight, DollarSign, Plus
} from "lucide-react"
import Link from "next/link"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts"

export default function LandlordDashboard() {
  const { user } = useAuthStore()
  const firstName = user?.firstName ?? "Landlord"

  const { data: analyticsData } = useQuery({
    queryKey: ["landlord-analytics"],
    queryFn: () => analyticsApi.getLandlordAnalytics(),
  })

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesApi.getProperties(),
  })

  const { data: tenanciesData, isLoading: tenanciesLoading } = useQuery({
    queryKey: ["landlord-tenancies"],
    queryFn: () => tenanciesApi.getLandlordTenancies(),
  })

  const { data: maintenanceData } = useQuery({
    queryKey: ["landlord-maintenance"],
    queryFn: () => maintenanceApi.getLandlordRequests(),
  })

  const analytics = analyticsData?.data
  const properties = propertiesData?.data ?? []
  const tenancies = tenanciesData?.data ?? []
  const maintenanceRequests = maintenanceData?.data ?? []

  const activeTenancies = tenancies.filter((t) => t.status === "active")
  const pendingMaintenance = maintenanceRequests.filter(
    (r) => r.status === "open" || r.status === "in_progress"
  )

  const chartData = analytics?.monthlyRevenue?.map((m) => ({
    month: m.month,
    revenue: m.amountKobo / 100,
  })) ?? []

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#1a3c5e] to-[#1e4a72] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Welcome back, {firstName}!</h1>
            <p className="text-slate-300 text-sm">
              Here&apos;s your property portfolio overview
            </p>
          </div>
          <Link href="/landlord/listings/new">
            <Button className="bg-[#f97316] hover:bg-[#f97316]/90 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Properties"
          value={properties.length}
          icon={Building2}
          iconColor="text-[#1a3c5e]"
          iconBg="bg-[#1a3c5e]/10"
        />
        <StatCard
          title="Active Tenancies"
          value={activeTenancies.length}
          icon={Users}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Monthly Revenue"
          value={analytics ? formatNaira(analytics.totalRevenue / 12) : "₦0"}
          icon={DollarSign}
          iconColor="text-[#f97316]"
          iconBg="bg-orange-50"
          change="From active tenancies"
          changeType="neutral"
        />
        <StatCard
          title="Pending Maintenance"
          value={pendingMaintenance.length}
          icon={Wrench}
          iconColor={pendingMaintenance.length > 0 ? "text-red-500" : "text-slate-400"}
          iconBg={pendingMaintenance.length > 0 ? "bg-red-50" : "bg-slate-100"}
          subtitle={pendingMaintenance.length > 0 ? "Needs attention" : "All clear"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Revenue Overview</CardTitle>
                <Link href="/landlord/analytics">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View all <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a3c5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1a3c5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => [`₦${Number(value).toLocaleString()}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1a3c5e"
                      fill="url(#revGrad)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-52 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No revenue data yet</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Add Property", href: "/landlord/properties", icon: Building2 },
                { label: "Create Listing", href: "/landlord/listings/new", icon: Plus },
                { label: "Send Invite", href: "/landlord/invites", icon: Users },
                { label: "View Maintenance", href: "/landlord/maintenance", icon: Wrench },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="p-1.5 rounded-lg bg-[#1a3c5e]/10">
                      <action.icon className="h-4 w-4 text-[#1a3c5e]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{action.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 ml-auto" />
                  </button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Tenancies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Tenancies</CardTitle>
          <Link href="/landlord/tenancies">
            <Button variant="ghost" size="sm" className="gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {tenanciesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : tenancies.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No tenancies yet</p>
          ) : (
            <div className="space-y-2">
              {tenancies.slice(0, 5).map((tenancy) => (
                <div
                  key={tenancy.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {tenancy.tenant?.firstName} {tenancy.tenant?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tenancy.property?.name ?? tenancy.unit?.unitNumber}
                      {" · "}
                      {formatDate(tenancy.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatNairaAmount(tenancy.rentAmount)}
                    </span>
                    <Badge
                      variant={getStatusVariant(tenancy.status)}
                      className="capitalize text-xs"
                    >
                      {tenancy.status}
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
