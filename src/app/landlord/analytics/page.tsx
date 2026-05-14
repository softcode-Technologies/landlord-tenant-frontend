"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { paymentsApi } from "@/lib/api/payments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, formatDate, getStatusVariant } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, DollarSign, Users, Building } from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar
} from "recharts"

export default function LandlordAnalyticsPage() {
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["landlord-analytics"],
    queryFn: () => analyticsApi.getLandlordAnalytics(),
  })

  const { data: paymentsData } = useQuery({
    queryKey: ["payment-history"],
    queryFn: () => paymentsApi.getPaymentHistory(),
  })

  const analytics = analyticsData?.data
  const payments = paymentsData?.data ?? []

  const revenueData = analytics?.monthlyRevenue?.map((m) => ({
    month: m.month,
    revenue: m.amountKobo / 100,
  })) ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Insights into your rental business</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: analytics ? formatNaira(analytics.totalRevenue) : "₦0",
            icon: DollarSign,
            color: "text-[#1a3c5e]",
            bg: "bg-[#1a3c5e]/10",
          },
          {
            label: "Active Tenancies",
            value: analytics?.activetenancies ?? 0,
            icon: Users,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Properties",
            value: analytics?.totalProperties ?? 0,
            icon: Building,
            color: "text-[#f97316]",
            bg: "bg-orange-50",
          },
          {
            label: "Pending Maintenance",
            value: analytics?.pendingMaintenance ?? 0,
            icon: TrendingUp,
            color: "text-red-500",
            bg: "bg-red-50",
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a3c5e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1a3c5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [
                    `₦${Number(value).toLocaleString()}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1a3c5e"
                  fill="url(#revGrad2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">
                  No revenue data available yet
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No payments yet</p>
          ) : (
            <div className="space-y-2">
              {payments.slice(0, 10).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900 capitalize">
                      {payment.type === "rent" ? "Rent Payment" : "Wallet Topup"}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(payment.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      {formatNaira(payment.amountKobo)}
                    </p>
                    <Badge
                      variant={getStatusVariant(payment.status)}
                      className="text-[10px] capitalize"
                    >
                      {payment.status}
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
