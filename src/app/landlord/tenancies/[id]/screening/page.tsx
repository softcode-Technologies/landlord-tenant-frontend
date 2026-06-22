"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, formatNairaAmount, formatDate } from "@/lib/utils"
import {
  ArrowLeft, ShieldCheck, ShieldAlert, ShieldQuestion, CheckCircle2, XCircle,
  Wallet, History, BadgeCheck, Briefcase, AlertCircle, Info,
} from "lucide-react"

// Map an on-platform credit score (0–850) to a risk band. New tenants default
// to 0 with no history — we show "Limited history" rather than a scary verdict.
function riskBand(score: number, hasHistory: boolean) {
  if (!hasHistory) {
    return { label: "Limited History", tone: "slate", icon: ShieldQuestion,
      blurb: "Not enough on-platform activity yet to judge reliability." }
  }
  if (score >= 700) return { label: "Low Risk", tone: "green", icon: ShieldCheck,
    blurb: "Strong payment track record on the platform." }
  if (score >= 500) return { label: "Moderate Risk", tone: "amber", icon: ShieldAlert,
    blurb: "Mixed signals — review the details before deciding." }
  return { label: "Needs Review", tone: "red", icon: ShieldAlert,
    blurb: "Weak or inconsistent payment history — proceed with caution." }
}

const TONE: Record<string, { bg: string; text: string; ring: string }> = {
  green: { bg: "bg-green-50", text: "text-green-700", ring: "ring-green-200" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  red:   { bg: "bg-red-50",   text: "text-red-700",   ring: "ring-red-200" },
  slate: { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-200" },
}

const KYC_BADGE: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  approved: { label: "Verified", variant: "success" },
  pending:  { label: "Under Review", variant: "warning" },
  rejected: { label: "Rejected", variant: "destructive" },
  none:     { label: "Not Verified", variant: "secondary" },
}

function VerifyRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-slate-300" />}
      <span className={ok ? "text-slate-700" : "text-slate-400"}>{label}</span>
    </div>
  )
}

export default function TenantScreeningPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const { data: tenancyRes } = useQuery({
    queryKey: ["tenancy", id],
    queryFn: () => tenanciesApi.getTenancy(id),
  })
  const tenantUserId = tenancyRes?.data?.tenantUserId

  const { data, isLoading, isError } = useQuery({
    queryKey: ["screening", tenantUserId],
    queryFn: () => tenanciesApi.screenTenant(tenantUserId as string),
    enabled: !!tenantUserId,
  })

  const report = data?.data
  const tenantName =
    report?.identity.fullName ||
    `${tenancyRes?.data?.tenant?.firstName ?? ""} ${tenancyRes?.data?.tenant?.lastName ?? ""}`.trim() ||
    "Tenant"

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Screening</h1>
          <p className="text-slate-500 text-sm">On-platform track record for {tenantName}</p>
        </div>
      </div>

      {isLoading || (!report && !isError) ? (
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </div>
      ) : isError || !report ? (
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            Could not load the screening report. The tenant may not have a profile yet.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Verdict hero */}
          {(() => {
            const hasHistory = report.totalRentPayments > 0 || report.creditScore > 0
            const band = riskBand(report.creditScore, hasHistory)
            const tone = TONE[band.tone]
            const Icon = band.icon
            return (
              <Card className={`${tone.bg} ring-1 ${tone.ring} border-0`}>
                <CardContent className="p-6 flex items-center gap-5">
                  <div className={`h-16 w-16 rounded-2xl bg-white flex items-center justify-center shrink-0`}>
                    <Icon className={`h-8 w-8 ${tone.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className={`text-xl font-bold ${tone.text}`}>{band.label}</h2>
                      {hasHistory && (
                        <span className="text-sm font-medium text-slate-500">
                          Score {report.creditScore}/850
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{band.blurb}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          <div className="grid md:grid-cols-2 gap-4">
            {/* Identity & Verification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BadgeCheck className="h-5 w-5 text-[#1a3c5e]" /> Identity & Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">KYC (Identity)</span>
                  <Badge variant={(KYC_BADGE[report.identity.kycStatus] ?? KYC_BADGE.none).variant}>
                    {(KYC_BADGE[report.identity.kycStatus] ?? KYC_BADGE.none).label}
                    {report.identity.kycMethod ? ` · ${report.identity.kycMethod.toUpperCase()}` : ""}
                  </Badge>
                </div>
                <VerifyRow ok={report.identity.isPhoneVerified} label="Phone number verified" />
                <VerifyRow ok={report.identity.isEmailVerified} label="Email address verified" />
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-sm text-slate-500">Member since</span>
                  <span className="text-sm font-medium">
                    {report.identity.memberSince ? formatDate(report.identity.memberSince) : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment reliability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className="h-5 w-5 text-[#1a3c5e]" /> Payment Reliability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {report.onTimeRate !== null ? `${report.onTimeRate}%` : "—"}
                  </span>
                  <span className="text-sm text-slate-500 mb-1">on-time</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 py-2">
                    <p className="text-lg font-bold text-slate-900">{report.totalRentPayments}</p>
                    <p className="text-xs text-slate-500">Payments</p>
                  </div>
                  <div className="rounded-lg bg-green-50 py-2">
                    <p className="text-lg font-bold text-green-700">{report.onTimePayments}</p>
                    <p className="text-xs text-slate-500">On time</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 py-2">
                    <p className="text-lg font-bold text-amber-700">{report.latePayments}</p>
                    <p className="text-xs text-slate-500">Late</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Affordability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-5 w-5 text-[#1a3c5e]" /> Affordability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Employment</span>
                  <span className="font-medium capitalize">{report.affordability.employmentStatus ?? "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Monthly income</span>
                  <span className="font-medium">
                    {report.affordability.monthlyIncome ? formatNairaAmount(report.affordability.monthlyIncome) : "Not provided"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Previous rentals</span>
                  <span className="font-medium">{report.affordability.previousRentals}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tenancy footprint */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-5 w-5 text-[#1a3c5e]" /> Tenancy Footprint
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg bg-slate-50 py-4">
                  <p className="text-2xl font-bold text-slate-900">{report.activeTenancies}</p>
                  <p className="text-xs text-slate-500">Active tenancies</p>
                </div>
                <div className="rounded-lg bg-slate-50 py-4">
                  <p className="text-2xl font-bold text-slate-900">{report.totalTenancies}</p>
                  <p className="text-xs text-slate-500">Total on platform</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Rent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {report.paymentHistory.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No rent payments recorded yet.</p>
              ) : (
                <div className="divide-y">
                  {report.paymentHistory.map((p) => {
                    const late = p.dueDate && p.paidAt
                      ? new Date(p.paidAt).setHours(0, 0, 0, 0) > new Date(p.dueDate).setHours(0, 0, 0, 0)
                      : null
                    return (
                      <div key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">{formatNaira(p.amount)}</p>
                          <p className="text-xs text-slate-400">
                            Paid {p.paidAt ? formatDate(p.paidAt) : "—"}
                            {p.dueDate ? ` · due ${formatDate(p.dueDate)}` : ""}
                          </p>
                        </div>
                        {late === null ? (
                          <Badge variant="secondary">Paid</Badge>
                        ) : late ? (
                          <Badge variant="warning">Late</Badge>
                        ) : (
                          <Badge variant="success">On time</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scope note */}
          <div className="flex items-start gap-2 text-xs text-slate-400 px-1">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              This report reflects the tenant&apos;s activity on this platform only. External credit
              bureau checks, bank-statement affordability analysis, and previous-landlord references
              are not yet included.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
