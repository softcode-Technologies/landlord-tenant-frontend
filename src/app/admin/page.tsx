"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api/analytics"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira } from "@/lib/utils"
import { Users, Building, DollarSign, Shield, TrendingUp, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminDashboard() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => analyticsApi.getAdminStats(),
  })

  const stats = statsData?.data

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1a3c5e] to-[#0f2d48] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-slate-300 text-sm">Platform overview and management</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            title="Pending KYC"
            value={stats?.pendingKyc ?? 0}
            icon={Shield}
            iconColor={stats?.pendingKyc ? "text-red-500" : "text-slate-400"}
            iconBg={stats?.pendingKyc ? "bg-red-50" : "bg-slate-100"}
            subtitle="Needs review"
          />
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            title: "User Management",
            desc: "Ban, unban, and manage user accounts",
            href: "/admin/users",
            icon: Users,
          },
          {
            title: "KYC Approvals",
            desc: "Review and approve identity verifications",
            href: "/admin/kyc",
            icon: Shield,
            urgent: (stats?.pendingKyc ?? 0) > 0,
          },
          {
            title: "All Tenancies",
            desc: "Overview of all rental agreements",
            href: "/admin/tenancies",
            icon: Building,
          },
          {
            title: "All Payments",
            desc: "Monitor transactions and revenue",
            href: "/admin/payments",
            icon: DollarSign,
          },
          {
            title: "Analytics",
            desc: "Detailed platform performance metrics",
            href: "/admin/analytics",
            icon: TrendingUp,
          },
        ].map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer ${item.urgent ? "border-red-200 bg-red-50/30" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${item.urgent ? "bg-red-100" : "bg-[#1a3c5e]/10"}`}>
                    <item.icon className={`h-5 w-5 ${item.urgent ? "text-red-600" : "text-[#1a3c5e]"}`} />
                  </div>
                  {item.urgent && (
                    <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      Needs attention
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
