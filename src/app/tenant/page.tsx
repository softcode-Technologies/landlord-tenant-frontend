"use client"

import { useQuery } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { paymentsApi } from "@/lib/api/payments"
import { analyticsApi } from "@/lib/api/analytics"
import { savingsApi } from "@/lib/api/savings"
import { useAuthStore } from "@/lib/store/auth"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, formatNairaAmount, formatDate } from "@/lib/utils"
import {
  Home, Wallet, Wrench, Calendar, ArrowRight, TrendingUp, ShieldAlert, Clock, ShieldX,
  PiggyBank, AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

function CreditGauge({ score }: { score: number }) {
  const pct = (score / 850) * 100
  const color =
    score >= 700 ? "#16a34a" : score >= 600 ? "#f97316" : "#ef4444"
  const label =
    score >= 750 ? "Excellent" :
    score >= 700 ? "Good" :
    score >= 650 ? "Fair" : "Poor"

  return (
    <div className="text-center">
      <div
        className="relative w-32 h-32 mx-auto mb-3"
        style={{
          background: `conic-gradient(${color} ${pct}%, #e2e8f0 0%)`,
          borderRadius: "50%",
        }}
      >
        <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900">{score}</span>
          <span className="text-xs text-slate-500">{label}</span>
        </div>
      </div>
      <p className="text-sm text-slate-500">Credit Score</p>
    </div>
  )
}

export default function TenantDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const firstName = user?.firstName ?? "Tenant"
  const kycStatus = user?.kycStatus ?? "none"

  const { data: tenanciesData, isLoading: tenananciesLoading } = useQuery({
    queryKey: ["tenant-tenancies"],
    queryFn: () => tenanciesApi.getTenantTenancies(),
  })

  const { data: creditData } = useQuery({
    queryKey: ["credit-score"],
    queryFn: () => tenanciesApi.getCreditScore(),
  })

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => paymentsApi.getWallet(),
  })

  const { data: analyticsData } = useQuery({
    queryKey: ["tenant-analytics"],
    queryFn: () => analyticsApi.getTenantAnalytics(),
  })

  const { data: savingsData } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: () => savingsApi.getGoals(),
  })

  const tenancies = tenanciesData?.data ?? []
  const savingsGoals = savingsData?.data ?? []
  const topSavingsGoal =
    savingsGoals.find((g) => g.status === "active" || g.status === "needs_method") ?? savingsGoals[0]
  const activeTenancy = tenancies.find((t) => t.status === "active")
  const creditScore = creditData?.data?.score ?? 0
  const walletBalance = walletData?.data?.balance ?? 0
  const analytics = analyticsData?.data

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-[#1a3c5e] to-[#1e4a72] rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-1">Welcome back, {firstName}! 👋</h1>
        <p className="text-slate-300 text-sm">
          Here&apos;s an overview of your rental dashboard
        </p>
      </div>

      {/* KYC Banner */}
      {kycStatus !== "approved" && (
        <>
          {kycStatus === "none" && (
            <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-900 text-sm">Verify Your Identity</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Complete identity verification to unlock rent payments, tenancy agreements, and full platform access.
                </p>
              </div>
              <button
                onClick={() => router.push("/tenant/kyc")}
                className="shrink-0 text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
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
                  {user?.kycRejectReason ?? "Please resubmit your identity documents."}
                </p>
              </div>
              <button
                onClick={() => router.push("/tenant/kyc")}
                className="shrink-0 text-xs font-semibold text-red-700 underline underline-offset-2 hover:text-red-900 transition-colors"
              >
                Retry Verification →
              </button>
            </div>
          )}
        </>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Tenancies"
          value={tenancies.filter((t) => t.status === "active").length}
          icon={Home}
          iconColor="text-[#1a3c5e]"
          iconBg="bg-[#1a3c5e]/10"
        />
        <StatCard
          title="Wallet Balance"
          value={formatNaira(walletBalance)}
          icon={Wallet}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Credit Score"
          value={creditScore || "N/A"}
          icon={TrendingUp}
          iconColor="text-[#f97316]"
          iconBg="bg-orange-50"
          subtitle="out of 850"
        />
        <StatCard
          title="Total Paid"
          value={formatNaira(analytics?.totalRentPaidKobo ?? 0)}
          icon={Wrench}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          subtitle="All time"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tenancy */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Tenancy</CardTitle>
              <Link href="/tenant/tenancies">
                <Button variant="ghost" size="sm" className="gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {tenananciesLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : activeTenancy ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {activeTenancy.property?.name ??
                          activeTenancy.unit?.unitNumber ??
                          "Your Property"}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {activeTenancy.property?.city}, {activeTenancy.property?.state}
                      </p>
                    </div>
                    <Badge variant="success">Active</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Annual Rent</p>
                      <p className="text-lg font-bold text-[#1a3c5e]">
                        {formatNairaAmount(activeTenancy.rentAmount)}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500">Lease Ends</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(activeTenancy.endDate)}
                      </p>
                    </div>
                  </div>

                  {/* Lease progress */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                      <span>Lease Progress</span>
                      <span>
                        {Math.round(
                          ((Date.now() - new Date(activeTenancy.startDate).getTime()) /
                            (new Date(activeTenancy.endDate).getTime() -
                              new Date(activeTenancy.startDate).getTime())) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={Math.round(
                        ((Date.now() - new Date(activeTenancy.startDate).getTime()) /
                          (new Date(activeTenancy.endDate).getTime() -
                            new Date(activeTenancy.startDate).getTime())) *
                          100
                      )}
                      className="h-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/tenant/tenancies/${activeTenancy.id}`} className="flex-1">
                      <Button className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link href="/tenant/maintenance" className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Wrench className="h-3.5 w-3.5" />
                        Maintenance
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No active tenancy</p>
                  <Link href="/listings" className="mt-3 inline-block">
                    <Button size="sm">Find a Home</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Credit Score */}
        <div className="space-y-4">
          {/* Rent Savings widget */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-[#f97316]" /> Rent Savings
              </CardTitle>
              {topSavingsGoal && (
                <Link href={`/tenant/savings/${topSavingsGoal.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    Manage <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </CardHeader>
            <CardContent>
              {topSavingsGoal ? (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold text-slate-900">
                      {formatNaira(topSavingsGoal.savedAmount)}
                    </span>
                    <span className="text-xs text-slate-500">
                      of {formatNaira(topSavingsGoal.targetAmount)}
                    </span>
                  </div>
                  <Progress value={topSavingsGoal.progressPercent} className="h-2" />
                  {topSavingsGoal.status === "needs_method" ? (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-700">
                        Card stopped working — your money is safe. Add a card or transfer to keep saving.
                      </p>
                    </div>
                  ) : topSavingsGoal.status === "active" && topSavingsGoal.nextChargeDate ? (
                    <p className="text-xs text-slate-500">
                      Next auto-save: {formatNaira(topSavingsGoal.monthlyAmount)} on {formatDate(topSavingsGoal.nextChargeDate)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 capitalize">{topSavingsGoal.status}</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-slate-600 font-medium">Never scramble for rent again</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Save monthly toward your annual rent — we auto-save from your card.
                  </p>
                  <Link href="/tenant/savings" className="mt-3 inline-block">
                    <Button size="sm">Start saving</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credit Score</CardTitle>
            </CardHeader>
            <CardContent>
              {creditScore ? (
                <div>
                  <CreditGauge score={creditScore} />
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Payment History</span>
                      <span className="font-medium">
                        {creditData?.data?.breakdown?.paymentHistory ?? 0}%
                      </span>
                    </div>
                    <Progress
                      value={creditData?.data?.breakdown?.paymentHistory ?? 0}
                      className="h-1.5"
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Tenancy Length</span>
                      <span className="font-medium">
                        {creditData?.data?.breakdown?.tenancyLength ?? 0}%
                      </span>
                    </div>
                    <Progress
                      value={creditData?.data?.breakdown?.tenancyLength ?? 0}
                      className="h-1.5"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-slate-400 text-sm">
                    Start renting to build your credit score
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Top Up Wallet", href: "/tenant/wallet", icon: Wallet },
                { label: "Submit Maintenance", href: "/tenant/maintenance", icon: Wrench },
                { label: "My Inspections", href: "/tenant/inspections", icon: Calendar },
                { label: "Browse Listings", href: "/listings", icon: Home },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left">
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

      {/* Upcoming Payments */}
      {analytics?.upcomingPayments && analytics.upcomingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.upcomingPayments.map((payment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-900">Rent Due</p>
                    <p className="text-xs text-amber-600">{formatDate(payment.dueDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-900">{formatNaira(payment.amountKobo)}</p>
                    <Link href={`/tenant/tenancies/${payment.tenancyId}`}>
                      <Button size="sm" className="h-7 text-xs mt-1">
                        Pay Now
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
