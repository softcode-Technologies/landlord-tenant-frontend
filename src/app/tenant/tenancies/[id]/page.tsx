"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { paymentsApi } from "@/lib/api/payments"
import { userApi } from "@/lib/api/user"
import { reviewsApi } from "@/lib/api/reviews"
import { escrowApi } from "@/lib/api/escrow"
import { configApi } from "@/lib/api/config"
import { useAuthStore } from "@/lib/store/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { formatNairaAmount, formatNaira, formatDate, getStatusVariant, extractApiError, rentAmountLabel } from "@/lib/utils"
import { ArrowLeft, MapPin, Calendar, Wallet, Wrench, FileText, Loader2, ExternalLink, PenLine, Star, CheckCircle2, ShieldCheck, Clock } from "lucide-react"
import { RentHistoryCard } from "@/components/shared/rent-history-card"
import Link from "next/link"
import { toast } from "sonner"

export default function TenantTenancyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const currentUser = useAuthStore((s) => s.user)
  const [signOpen, setSignOpen] = useState(false)
  const [signatureName, setSignatureName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [stars, setStars] = useState(0)
  const [reviewComment, setReviewComment] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["tenancy", id],
    queryFn: () => tenanciesApi.getTenancy(id),
  })

  const { data: agreementData } = useQuery({
    queryKey: ["agreement", id],
    queryFn: () => userApi.getAgreement(id),
    retry: false,
  })

  const payRentMutation = useMutation({
    // Full rent payment — backend charges the full amount; no kobo math here.
    mutationFn: () => paymentsApi.payRent(id),
    onSuccess: (res) => {
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl
      }
    },
    onError: () => {
      toast.error("Failed to initiate payment")
    },
  })

  const { data: configData } = useQuery({
    queryKey: ["app-config"],
    queryFn: () => configApi.getConfig(),
    staleTime: 5 * 60 * 1000,
  })
  const depositEscrowEnabled = configData?.data?.features?.depositEscrowEnabled ?? false

  // The tenant's deposit escrow for this tenancy, if any. Drives the deposit card.
  const { data: depositEscrowsData } = useQuery({
    queryKey: ["my-deposit-escrows"],
    queryFn: () => escrowApi.listMyDeposits(),
    enabled: depositEscrowEnabled,
  })
  const depositEscrow = (depositEscrowsData?.data?.asTenant ?? []).find((e) => e.tenancyId === id)

  const payDepositMutation = useMutation({
    mutationFn: () => paymentsApi.payDeposit(id),
    onSuccess: (res) => {
      if (res.data.paymentUrl) window.location.href = res.data.paymentUrl
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to start deposit payment")),
  })

  const confirmMoveInMutation = useMutation({
    mutationFn: () => escrowApi.confirmMoveIn(depositEscrow!.id),
    onSuccess: () => {
      toast.success("Move-in confirmed — your deposit is secured")
      queryClient.invalidateQueries({ queryKey: ["my-deposit-escrows"] })
      queryClient.invalidateQueries({ queryKey: ["tenancy", id] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to confirm move-in")),
  })

  const signMutation = useMutation({
    mutationFn: () => userApi.signAgreement(agreement!.id, signatureName.trim()),
    onSuccess: () => {
      toast.success("Agreement signed successfully!")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
      setSignOpen(false)
      setSignatureName("")
      setAgreed(false)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to sign agreement")),
  })

  const rejectMutation = useMutation({
    mutationFn: () => userApi.rejectAgreement(agreement!.id),
    onSuccess: () => {
      toast.success("Agreement rejected")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to reject agreement")),
  })

  const tenancy = data?.data
  const agreement = agreementData?.data
  const agentId = tenancy?.agent?.id ?? null
  const agentName = tenancy?.agent
    ? [tenancy.agent.user?.firstName, tenancy.agent.user?.lastName].filter(Boolean).join(" ") ||
      tenancy.agent.agencyName ||
      "your agent"
    : null

  const { data: agentReviewsData } = useQuery({
    queryKey: ["agent-reviews", agentId],
    queryFn: () => reviewsApi.getReviewsBySubject("agent", agentId!),
    enabled: !!agentId,
  })
  const alreadyReviewedAgent = (agentReviewsData?.data?.reviews ?? []).some(
    (r) => r.reviewerUserId === currentUser?.id,
  )

  const reviewAgentMutation = useMutation({
    mutationFn: () =>
      reviewsApi.createReview({
        tenancyId: id,
        subjectType: "agent",
        subjectId: agentId!,
        rating: stars,
        comment: reviewComment.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Thanks for rating your agent!")
      setStars(0)
      setReviewComment("")
      queryClient.invalidateQueries({ queryKey: ["agent-reviews", agentId] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to submit review")),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!tenancy) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Tenancy not found</p>
        <Link href="/tenant/tenancies">
          <Button className="mt-4">Back to Tenancies</Button>
        </Link>
      </div>
    )
  }

  // Next annual rent due: the recorded date, or a projection one year after the
  // start date if no payment has set it yet.
  const nextRentDue = (() => {
    if (tenancy.nextDueDate) return formatDate(tenancy.nextDueDate)
    const d = new Date(tenancy.startDate)
    d.setFullYear(d.getFullYear() + 1)
    return formatDate(d.toISOString())
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tenant/tenancies">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenancy Details</h1>
          <p className="text-slate-500 text-sm">ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Property Information</CardTitle>
                <Badge variant={getStatusVariant(tenancy.status)} className="capitalize">
                  {tenancy.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenancy.property && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {tenancy.property.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {tenancy.property.address}, {tenancy.property.city},{" "}
                      {tenancy.property.state}
                    </div>
                  </div>
                </>
              )}

              {tenancy.unit && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Unit</p>
                  <p className="font-semibold text-slate-900">{tenancy.unit.unitNumber}</p>
                  <p className="text-sm text-slate-500">
                    {tenancy.unit.bedrooms} bed &middot; {tenancy.unit.bathrooms} bath
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Start Date</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-sm">{formatDate(tenancy.startDate)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">End Date</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-sm">{formatDate(tenancy.endDate)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{rentAmountLabel(tenancy.rentCycle)}</span>
                  <span className="text-xl font-bold text-[#1a3c5e]">
                    {formatNairaAmount(tenancy.rentAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Next Rent Due</span>
                  <span className="text-sm font-medium text-slate-900">{nextRentDue}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rent History */}
          <RentHistoryCard tenancyId={id} />

          {/* Deposit Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Security Deposit
                {depositEscrow && (depositEscrow.status === "holding" || depositEscrow.status === "secured") && (
                  <Badge variant="outline" className="gap-1 text-[#1a3c5e] border-[#1a3c5e]/30">
                    <ShieldCheck className="h-3 w-3" /> In escrow
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {depositEscrow ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600">Deposit Amount</span>
                    <span className="font-bold text-slate-900">
                      {formatNaira(depositEscrow.amountKobo)}
                    </span>
                  </div>

                  {depositEscrow.status === "holding" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-3">
                      <div className="flex items-start gap-2 text-sm text-amber-800">
                        <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>
                          Your deposit is held safely in escrow. Confirm move-in once you have the
                          keys to secure it. If you don&apos;t move in by{" "}
                          <strong>{formatDate(depositEscrow.refundAfter)}</strong>, it&apos;s
                          automatically refunded to your wallet.
                        </span>
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={() => confirmMoveInMutation.mutate()}
                        disabled={confirmMoveInMutation.isPending}
                      >
                        {confirmMoveInMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        I&apos;ve moved in — confirm
                      </Button>
                    </div>
                  )}

                  {depositEscrow.status === "secured" && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-start gap-2 text-sm text-green-700">
                      <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Move-in confirmed{depositEscrow.securedAt ? ` on ${formatDate(depositEscrow.securedAt)}` : ""}.
                        Your deposit is held for your tenancy and refunded to you at move-out.
                      </span>
                    </div>
                  )}

                  {depositEscrow.status === "refunded" && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-start gap-2 text-sm text-blue-700">
                      <Wallet className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Refunded to your wallet{depositEscrow.refundedAt ? ` on ${formatDate(depositEscrow.refundedAt)}` : ""}
                        {depositEscrow.refundReason === "auto_no_confirmation"
                          ? " — move-in wasn't confirmed in time."
                          : depositEscrow.refundReason === "moveout_return"
                            ? " — returned at the end of your tenancy."
                            : "."}
                      </span>
                    </div>
                  )}
                </div>
              ) : depositEscrowEnabled && tenancy.status === "active" && tenancy.depositAmount && tenancy.depositStatus !== "held" ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600">Deposit Amount</span>
                    <span className="font-bold text-slate-900">
                      {formatNaira(tenancy.depositAmount)}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[#1a3c5e]/20 bg-[#1a3c5e]/5 p-3 flex items-start gap-2 text-sm text-[#1a3c5e]">
                    <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Pay your deposit into escrow. We hold it until you confirm move-in — so you
                      can&apos;t lose it to a no-show.
                    </span>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => payDepositMutation.mutate()}
                    disabled={payDepositMutation.isPending}
                  >
                    {payDepositMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Pay deposit into escrow
                  </Button>
                </div>
              ) : tenancy.depositAmount ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600">Deposit Amount</span>
                    <span className="font-bold text-slate-900">
                      {formatNaira(tenancy.depositAmount)}
                    </span>
                  </div>
                  {tenancy.depositPaidAt && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-sm text-green-700">Paid On</span>
                      <span className="text-sm font-medium text-green-800">
                        {formatDate(tenancy.depositPaidAt)}
                      </span>
                    </div>
                  )}
                  {tenancy.depositReturnedAt && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <span className="text-sm text-blue-700">Returned On</span>
                      <span className="text-sm font-medium text-blue-800">
                        {formatDate(tenancy.depositReturnedAt)}
                      </span>
                    </div>
                  )}
                  {tenancy.depositNote && (
                    <p className="text-xs text-slate-500">{tenancy.depositNote}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No deposit information recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Agreement */}
          {agreement && (
            <Card>
              <CardHeader>
                <CardTitle>Tenancy Agreement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Status</span>
                  <Badge
                    variant={getStatusVariant(agreement.status)}
                    className="capitalize"
                  >
                    {agreement.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                {agreement.documentUrl && (
                  <a
                    href={agreement.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-[#1a3c5e] hover:bg-slate-50"
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">{agreement.documentName ?? "View Agreement Document"}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                )}

                {agreement.status === "signed_both" && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
                    <PenLine className="h-4 w-4" /> Fully executed by both parties.
                  </div>
                )}

                {agreement.status === "signed_tenant" && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    You&apos;ve signed. Waiting for the landlord to countersign.
                  </div>
                )}

                {agreement.tenantSignedAt && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="text-sm text-green-700">
                      Signed by you{agreement.tenantSignatureName ? ` — ${agreement.tenantSignatureName}` : ""}
                    </span>
                    <span className="text-sm font-medium text-green-800">
                      {formatDate(agreement.tenantSignedAt)}
                    </span>
                  </div>
                )}

                {agreement.landlordSignedAt && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <span className="text-sm text-blue-700">
                      Landlord signed{agreement.landlordSignatureName ? ` — ${agreement.landlordSignatureName}` : ""}
                    </span>
                    <span className="text-sm font-medium text-blue-800">
                      {formatDate(agreement.landlordSignedAt)}
                    </span>
                  </div>
                )}

                {agreement.status === "sent" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => { setSignatureName(""); setAgreed(false); setSignOpen(true) }}
                    >
                      <PenLine className="h-4 w-4" />
                      Review & Sign
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 text-red-500 border-red-200"
                      onClick={() => rejectMutation.mutate()}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rate your agent */}
          {agentId && (
            <Card>
              <CardHeader>
                <CardTitle>Rate your agent</CardTitle>
              </CardHeader>
              <CardContent>
                {alreadyReviewedAgent ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Thanks — you&apos;ve rated {agentName}.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-500">
                      How was your experience with {agentName}, who set up this tenancy?
                    </p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setStars(n)}
                          aria-label={`${n} star${n === 1 ? "" : "s"}`}
                          className="p-0.5"
                        >
                          <Star
                            className={`h-7 w-7 transition-colors ${
                              n <= stars ? "fill-[#f97316] text-[#f97316]" : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <Textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Optional: share a few words about your experience"
                      rows={2}
                    />
                    <Button
                      className="w-full gap-2"
                      disabled={stars < 1 || reviewAgentMutation.isPending}
                      onClick={() => reviewAgentMutation.mutate()}
                    >
                      {reviewAgentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                      Submit rating
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          {tenancy.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2"
                  onClick={() => payRentMutation.mutate()}
                  disabled={payRentMutation.isPending}
                >
                  {payRentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Pay Rent
                </Button>

                <Link href="/tenant/maintenance" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Wrench className="h-4 w-4" />
                    Submit Maintenance
                  </Button>
                </Link>

                {!agreement && (
                  <Button variant="outline" className="w-full gap-2" disabled>
                    <FileText className="h-4 w-4" />
                    No Agreement Yet
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Landlord Info */}
          {tenancy.landlord && (
            <Card>
              <CardHeader>
                <CardTitle>Landlord</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-slate-900">
                  {tenancy.landlord.firstName} {tenancy.landlord.lastName}
                </p>
                <p className="text-sm text-slate-500">{tenancy.landlord.phone}</p>
                <Link href="/tenant/messages" className="mt-3 block">
                  <Button variant="outline" className="w-full text-sm" size="sm">
                    Send Message
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sign Agreement Dialog */}
      <Dialog open={signOpen} onOpenChange={(o) => { if (!o) { setSignOpen(false); setSignatureName(""); setAgreed(false) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign Tenancy Agreement</DialogTitle>
            <DialogDescription>
              Review the document, then type your full legal name to sign it online.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {agreement?.documentUrl && (
              <a
                href={agreement.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-sm text-[#1a3c5e] hover:bg-slate-50"
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{agreement.documentName ?? "Open the agreement document"}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            )}
            <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300"
              />
              <span>I have read and agree to the terms of this tenancy agreement.</span>
            </label>
            <div className="space-y-2">
              <Label htmlFor="signature">Your full name</Label>
              <Input
                id="signature"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g. Ada Okeke"
                autoFocus
              />
              <p className="text-xs text-slate-400">Typing your name acts as your legal signature.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setSignOpen(false); setSignatureName(""); setAgreed(false) }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={!agreed || !signatureName.trim() || signMutation.isPending}
              onClick={() => signMutation.mutate()}
            >
              {signMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              Sign Agreement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
