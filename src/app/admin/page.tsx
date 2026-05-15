"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira } from "@/lib/utils"
import {
  Users, Building, Shield, TrendingUp, Home, CreditCard,
  BarChart3, ArrowRight, AlertCircle, CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.getStats(),
  })

  const { data: revenueData } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => adminApi.getRevenueBreakdown(),
  })

  const stats = statsData?.data
  const revenue = revenueData?.data

  const statCards = [
    {
      label: "Total Users",
      value: (stats?.totalUsers ?? 0).toLocaleString(),
      sub: `+${stats?.newUsersThisMonth ?? 0} this month`,
      icon: Users,
      color: "text-[#1a3c5e]",
      bg: "bg-[#1a3c5e]/10",
    },
    {
      label: "Properties",
      value: (stats?.totalProperties ?? 0).toLocaleString(),
      sub: "Listed on platform",
      icon: Building,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Active Tenancies",
      value: (stats?.totalActiveTenancies ?? 0).toLocaleString(),
      sub: "Ongoing agreements",
      icon: Home,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Platform Revenue",
      value: revenue ? formatNaira(revenue.platformCommission) : "₦—",
      sub: "Commission earned",
      icon: TrendingUp,
      color: "text-[#f97316]",
      bg: "bg-orange-50",
    },
  ]

  const navCards = [
    {
      title: "User Management",
      desc: "View users, wallet balances, ban/unban accounts",
      href: "/admin/users",
      icon: Users,
      urgent: false,
    },
    {
      title: "KYC Approvals",
      desc: "Review identity verifications pending approval",
      href: "/admin/kyc",
      icon: Shield,
      urgent: (stats?.pendingKyc ?? 0) > 0,
      badge: stats?.pendingKyc ?? 0,
    },
    {
      title: "Payments",
      desc: "Transactions, refunds, and revenue breakdown",
      href: "/admin/payments",
      icon: CreditCard,
      urgent: (revenue?.pendingCount ?? 0) > 0,
      badge: revenue?.pendingCount ?? 0,
    },
    {
      title: "Tenancies",
      desc: "All rental agreements across the platform",
      href: "/admin/tenancies",
      icon: Home,
      urgent: false,
    },
    {
      title: "Analytics",
      desc: "Platform performance and growth metrics",
      href: "/admin/analytics",
      icon: BarChart3,
      urgent: false,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 80% 50%, #f97316 0%, transparent 60%)"
        }} />
        <h1 className="text-2xl font-bold mb-1 relative">Admin Dashboard</h1>
        <p className="text-slate-300 text-sm relative">Full platform control and management</p>

        {(stats?.pendingKyc ?? 0) > 0 && (
          <div className="mt-4 inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-xl px-4 py-2 relative">
            <AlertCircle className="h-4 w-4 text-amber-300" />
            <span className="text-sm text-amber-200 font-medium">
              {stats?.pendingKyc} KYC verification{stats?.pendingKyc !== 1 ? "s" : ""} awaiting review
            </span>
            <Link href="/admin/kyc" className="text-amber-300 hover:text-white text-sm font-semibold ml-2">
              Review →
            </Link>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="border-slate-100">
              <CardContent className="p-5">
                <div className={`inline-flex p-2.5 rounded-xl ${card.bg} mb-3`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
                <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Revenue Breakdown Strip */}
      {revenue && (
        <Card className="border-slate-100">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Revenue Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Inspection Fees", value: revenue.inspection_fee, color: "text-purple-600" },
                { label: "Rent Payments", value: revenue.rent, color: "text-blue-600" },
                { label: "Wallet Topups", value: revenue.wallet_topup, color: "text-green-600" },
                { label: "Listing Boosts", value: revenue.listing_boost, color: "text-orange-600" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className={`text-lg font-bold mt-0.5 ${item.color}`}>{formatNaira(item.value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nav Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navCards.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className={`hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${item.urgent ? "border-amber-200 bg-amber-50/30" : "border-slate-100"}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl ${item.urgent ? "bg-amber-100" : "bg-[#1a3c5e]/10"}`}>
                    <item.icon className={`h-5 w-5 ${item.urgent ? "text-amber-600" : "text-[#1a3c5e]"}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge ? (
                      <Badge className="bg-red-500 text-white text-xs px-2">{item.badge}</Badge>
                    ) : (
                      item.urgent && <Badge className="bg-amber-500 text-white text-xs">Attention</Badge>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "KYC Pending", value: stats?.pendingKyc ?? 0, icon: Shield, alert: (stats?.pendingKyc ?? 0) > 0 },
          { label: "New Users/Month", value: stats?.newUsersThisMonth ?? 0, icon: Users, alert: false },
          { label: "Pending Payments", value: revenue?.pendingCount ?? 0, icon: CreditCard, alert: (revenue?.pendingCount ?? 0) > 0 },
        ].map((item) => (
          <div key={item.label} className={`rounded-xl p-4 border ${item.alert ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"}`}>
            <div className="flex items-center gap-2 mb-1">
              {item.alert
                ? <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                : <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
              }
              <span className="text-xs text-slate-500">{item.label}</span>
            </div>
            <p className={`text-xl font-bold ${item.alert ? "text-red-600" : "text-slate-700"}`}>
              {isLoading ? "—" : item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
