"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira } from "@/lib/utils"
import {
  Users, Building, Home, Shield, CreditCard, UserPlus,
  Wallet, CalendarDays, CalendarRange, Coins, TrendingUp,
} from "lucide-react"
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from "recharts"

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

const nairaTick = (v: number) =>
  v >= 1_000_000 ? `₦${(v / 1_000_000).toFixed(1)}m` : v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics-overview"],
    queryFn: () => adminApi.getAnalyticsOverview(),
  })

  const a = data?.data
  const money = a?.money
  const kpis = a?.kpis

  const moneyCards = [
    { label: "Collected Today", value: money?.collectedToday ?? 0, icon: CalendarDays, grad: "from-[#1a3c5e] to-[#0f2d48]" },
    { label: "This Week", value: money?.collected7Days ?? 0, icon: CalendarRange, grad: "from-[#1f4e79] to-[#16385a]" },
    { label: "This Month", value: money?.collectedThisMonth ?? 0, icon: TrendingUp, grad: "from-[#2563eb] to-[#1e40af]" },
    { label: "All-Time Collected", value: money?.collectedAllTime ?? 0, icon: Coins, grad: "from-emerald-600 to-emerald-800" },
  ]

  const kpiCards = [
    { label: "Total Users", value: kpis?.totalUsers ?? 0, icon: Users, color: "text-[#1a3c5e]", bg: "bg-[#1a3c5e]/10" },
    { label: "New Users (Month)", value: kpis?.newUsersThisMonth ?? 0, icon: UserPlus, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Properties Listed", value: kpis?.totalProperties ?? 0, icon: Building, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Tenancies", value: kpis?.activeTenancies ?? 0, icon: Home, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Pending KYC", value: kpis?.pendingKyc ?? 0, icon: Shield, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Pending Payments", value: kpis?.pendingPayments ?? 0, icon: CreditCard, color: "text-red-500", bg: "bg-red-50" },
  ]

  const dailyChart = (a?.daily ?? []).map((d) => ({ label: d.label, collected: d.totalKobo / 100 }))
  const monthlyChart = (a?.monthly ?? []).map((m) => ({
    month: m.month,
    collected: m.totalKobo / 100,
    earnings: m.earningsKobo / 100,
  }))

  const breakdown = a?.breakdown
  const breakdownRows = breakdown
    ? [
        { label: "Rent Revenue", value: breakdown.rent, color: "bg-blue-500" },
        { label: "Inspection Fees", value: breakdown.inspection_fee, color: "bg-purple-500" },
        { label: "Wallet Topups", value: breakdown.wallet_topup, color: "bg-green-500" },
        { label: "Listing Boosts", value: breakdown.listing_boost, color: "bg-orange-500" },
      ]
    : []
  const maxBreakdown = Math.max(...breakdownRows.map((r) => r.value), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 mt-1">Money collected, platform earnings, and platform health</p>
      </div>

      {/* Money collected — time windows */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {moneyCards.map((c) => (
            <Card key={c.label} className={`border-0 text-white bg-gradient-to-br ${c.grad}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-white/70 text-xs">
                  <c.icon className="h-4 w-4" /> {c.label}
                </div>
                <p className="text-2xl font-bold mt-2">{formatNaira(c.value)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Platform earnings strip */}
      {!isLoading && money && (
        <Card className="border-green-100 bg-green-50/50">
          <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100">
                <Wallet className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Platform Earnings (our cut — {money.commissionPercent}% on rent + fees)</p>
                <p className="text-2xl font-bold text-green-700">{formatNaira(money.platformEarningsAllTime)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">This month</p>
              <p className="text-lg font-bold text-green-700">+{formatNaira(money.platformEarningsThisMonth)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily collections */}
      <Card className="border-slate-100">
        <CardHeader>
          <CardTitle className="text-base">Money Collected — Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : dailyChart.some((d) => d.collected > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyChart} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a3c5e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1a3c5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={nairaTick} width={52} />
                <Tooltip formatter={(v) => [`₦${Number(v).toLocaleString()}`, "Collected"]} />
                <Area type="monotone" dataKey="collected" stroke="#1a3c5e" fill="url(#dayGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <Coins className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No money collected in the last 30 days yet</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monthly trend + revenue breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100">
          <CardHeader>
            <CardTitle className="text-base">6-Month Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyChart} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={nairaTick} width={52} />
                  <Tooltip formatter={(v, n) => [`₦${Number(v).toLocaleString()}`, n === "collected" ? "Collected" : "Our earnings"]} />
                  <Legend formatter={(v) => (v === "collected" ? "Collected" : "Our earnings")} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="collected" fill="#1a3c5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="earnings" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-100">
          <CardHeader>
            <CardTitle className="text-base">Revenue by Type (All-Time)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
              </div>
            ) : (
              breakdownRows.map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                    <span className="text-sm font-bold text-slate-900">{formatNaira(item.value)}</span>
                  </div>
                  <MiniBar value={item.value} max={maxBreakdown} color={item.color} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform health KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map((stat) => (
            <Card key={stat.label} className="border-slate-100">
              <CardContent className="p-5">
                <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
