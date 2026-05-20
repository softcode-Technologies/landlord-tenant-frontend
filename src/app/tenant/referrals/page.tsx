"use client"

import { useQuery } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/store/auth"
import { referralApi, ReferralRecord } from "@/lib/api/referral"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Gift, Users, CheckCircle2, Copy, Share2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BRAND_NAME } from "@/lib/config/brand"

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Gift; label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#1a3c5e]/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-[#1a3c5e]" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
            {sub && <p className="text-xs text-slate-400">{sub}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReferralsPage() {
  const { user } = useAuthStore()

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["referral-stats"],
    queryFn: () => referralApi.getMyCode(),
  })

  const { data: listRes, isLoading: listLoading } = useQuery({
    queryKey: ["referral-list"],
    queryFn: () => referralApi.getMyReferrals(),
  })

  const stats = statsRes?.data
  const referrals = listRes?.data ?? []
  const code = stats?.referralCode ?? user?.referralCode ?? null

  const copyCode = () => {
    if (!code) return
    navigator.clipboard.writeText(code)
    toast.success("Referral code copied!")
  }

  const shareCode = () => {
    if (!code) return
    const text = `Join me on ${BRAND_NAME} — Nigeria's easiest way to find and manage rentals! Use my referral code ${code} when you sign up. 🏠`
    if (navigator.share) {
      navigator.share({ text }).catch(() => null)
    } else {
      navigator.clipboard.writeText(text)
      toast.success("Share message copied to clipboard!")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Refer & Earn</h1>
        <p className="text-slate-500 mt-1">
          Share your code with friends. Earn ₦5,000 in wallet credit when they pay their first rent.
        </p>
      </div>

      {/* Referral code card */}
      <Card className="bg-gradient-to-br from-[#1a3c5e] to-[#2d5a8e] text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-5 w-5 text-[#f97316]" />
            <p className="font-semibold text-white/90">Your Referral Code</p>
          </div>

          {statsLoading ? (
            <div className="flex items-center gap-2 mt-3">
              <Loader2 className="h-5 w-5 animate-spin text-white/60" />
              <span className="text-white/60">Loading...</span>
            </div>
          ) : code ? (
            <>
              <div className="mt-3 bg-white/10 rounded-2xl px-6 py-4 text-center">
                <p className="text-4xl font-mono font-extrabold tracking-[0.3em] text-white">
                  {code}
                </p>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={copyCode}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 transition-colors rounded-xl py-2.5 text-sm font-medium text-white"
                >
                  <Copy className="h-4 w-4" />
                  Copy Code
                </button>
                <button
                  onClick={shareCode}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#f97316] hover:bg-[#ea6c0a] transition-colors rounded-xl py-2.5 text-sm font-medium text-white"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </>
          ) : (
            <p className="text-white/60 text-sm mt-3">
              Complete your profile setup to get your referral code.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Friends Invited" value={stats?.totalReferred ?? 0} />
        <StatCard icon={CheckCircle2} label="Converted" value={stats?.totalRewarded ?? 0} sub="Paid first rent" />
        <StatCard
          icon={Gift}
          label="Total Earned"
          value={`₦${((stats?.totalEarnedKobo ?? 0) / 100).toLocaleString("en-NG")}`}
          sub="Added to wallet"
        />
      </div>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {[
              `Share your referral code with a friend who hasn't joined ${BRAND_NAME} yet.`,
              "They sign up and enter your code during onboarding.",
              "When they pay their first month's rent, ₦5,000 is added to your wallet.",
              "No limit — invite as many friends as you want!",
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="shrink-0 h-6 w-6 rounded-full bg-[#1a3c5e]/10 text-[#1a3c5e] text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Referral list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No referrals yet. Share your code to get started!</p>
            </div>
          ) : (
            <div className="divide-y">
              {referrals.map((r: ReferralRecord) => {
                const name = [r.referred?.firstName, r.referred?.lastName].filter(Boolean).join(" ") || "Anonymous"
                return (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={r.status === "rewarded" ? "success" : "secondary"}>
                        {r.status === "rewarded" ? "Rewarded" : "Pending"}
                      </Badge>
                      {r.status === "rewarded" && (
                        <p className="text-xs text-green-600 mt-0.5">
                          +₦{(r.rewardKobo / 100).toLocaleString("en-NG")}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
