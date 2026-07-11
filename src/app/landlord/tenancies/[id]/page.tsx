"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { userApi } from "@/lib/api/user"
import { escrowApi } from "@/lib/api/escrow"
import { configApi } from "@/lib/api/config"
import { FileText, ExternalLink, Send, PenLine, ShieldCheck, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, formatNairaAmount, formatDate, getStatusVariant, getInitials, extractApiError, rentAmountLabel } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, DollarSign, Shield, Trash2, RefreshCw, Loader2, Pencil } from "lucide-react"
import { RentHistoryCard } from "@/components/shared/rent-history-card"
import { RentFeeBreakdown } from "@/components/shared/rent-fee-breakdown"
import Link from "next/link"
import { toast } from "sonner"

export default function LandlordTenancyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [agreementOpen, setAgreementOpen] = useState(false)
  const [docUrl, setDocUrl] = useState("")
  const [agreementFile, setAgreementFile] = useState<File | null>(null)
  const [useUrlMode, setUseUrlMode] = useState(false)
  const [countersignOpen, setCountersignOpen] = useState(false)
  const [signatureName, setSignatureName] = useState("")
  const [renewOpen, setRenewOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [terminateOpen, setTerminateOpen] = useState(false)
  const [newEndDate, setNewEndDate] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [depositDate, setDepositDate] = useState("")
  const [depositNote, setDepositNote] = useState("")
  const [editRentOpen, setEditRentOpen] = useState(false)
  const [newRent, setNewRent] = useState("")
  const [isCorrection, setIsCorrection] = useState(false)
  const [rentReason, setRentReason] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["tenancy", id],
    queryFn: () => tenanciesApi.getTenancy(id),
  })

  const { data: configData } = useQuery({
    queryKey: ["app-config"],
    queryFn: () => configApi.getConfig(),
    staleTime: 5 * 60 * 1000,
  })
  const depositEscrowEnabled = configData?.data?.features?.depositEscrowEnabled ?? false

  const { data: depositEscrowsData } = useQuery({
    queryKey: ["my-deposit-escrows"],
    queryFn: () => escrowApi.listMyDeposits(),
    enabled: depositEscrowEnabled,
  })
  const depositEscrow = (depositEscrowsData?.data?.asLandlord ?? []).find((e) => e.tenancyId === id)

  const editRentMutation = useMutation({
    mutationFn: () =>
      tenanciesApi.updateRent(id, {
        newRentAmount: parseInt(newRent),
        changeType: isCorrection ? "correction" : undefined,
        reason: rentReason.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Rent updated")
      queryClient.invalidateQueries({ queryKey: ["tenancy", id] })
      queryClient.invalidateQueries({ queryKey: ["rent-changes", id] })
      setEditRentOpen(false)
      setNewRent("")
      setIsCorrection(false)
      setRentReason("")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to update rent")),
  })

  const openEditRent = (currentRent: number) => {
    setNewRent(String(currentRent))
    setIsCorrection(false)
    setRentReason("")
    setEditRentOpen(true)
  }

  const renewMutation = useMutation({
    mutationFn: () => tenanciesApi.renewTenancy(id, { newEndDate }),
    onSuccess: () => {
      toast.success("Tenancy renewed!")
      queryClient.invalidateQueries({ queryKey: ["tenancy", id] })
      setRenewOpen(false)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to renew tenancy")),
  })

  const depositMutation = useMutation({
    mutationFn: () =>
      tenanciesApi.recordDeposit(id, {
        depositAmount: parseInt(depositAmount) * 100,
        depositPaidAt: depositDate,
        note: depositNote,
      }),
    onSuccess: () => {
      toast.success("Deposit recorded!")
      queryClient.invalidateQueries({ queryKey: ["tenancy", id] })
      setDepositOpen(false)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to record deposit")),
  })

  const terminateMutation = useMutation({
    mutationFn: () => tenanciesApi.terminateTenancy(id),
    onSuccess: () => {
      toast.success("Tenancy terminated")
      router.push("/landlord/tenancies")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to terminate tenancy")),
  })

  const { data: agreementData, isLoading: agreementLoading } = useQuery({
    queryKey: ["agreement", id],
    queryFn: () => userApi.getAgreement(id),
    retry: false,
  })

  const closeAgreementModal = () => {
    setAgreementOpen(false)
    setDocUrl("")
    setAgreementFile(null)
    setUseUrlMode(false)
  }

  // Upload a file OR replace an existing draft/rejected doc OR (fallback) save a URL.
  const saveAgreementMutation = useMutation({
    mutationFn: async () => {
      if (useUrlMode) {
        if (agreement) return userApi.updateAgreementDocument(agreement.id, docUrl.trim())
        return userApi.createAgreement({ tenancyId: id, documentUrl: docUrl.trim() })
      }
      const formData = new FormData()
      formData.append("document", agreementFile as File)
      if (agreement) return userApi.replaceAgreementDocumentFile(agreement.id, formData)
      formData.append("tenancyId", id)
      return userApi.uploadAgreement(formData)
    },
    onSuccess: () => {
      toast.success(agreement ? "Agreement document updated" : "Agreement uploaded")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
      closeAgreementModal()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to save agreement")),
  })

  const sendAgreementMutation = useMutation({
    mutationFn: () => userApi.sendAgreement(agreement!.id),
    onSuccess: () => {
      toast.success("Agreement sent to tenant for signing")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to send agreement")),
  })

  const signAgreementMutation = useMutation({
    mutationFn: () => userApi.signAgreement(agreement!.id, signatureName.trim()),
    onSuccess: () => {
      toast.success("Agreement countersigned successfully!")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
      setCountersignOpen(false)
      setSignatureName("")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to sign agreement")),
  })

  const tenancy = data?.data
  const agreement = agreementData?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!tenancy) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Tenancy not found</p>
        <Link href="/landlord/tenancies">
          <Button className="mt-4">Back</Button>
        </Link>
      </div>
    )
  }

  const tenantName =
    tenancy.tenant
      ? `${tenancy.tenant.firstName ?? ""} ${tenancy.tenant.lastName ?? ""}`.trim() || "Tenant"
      : "Unknown Tenant"

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
        <Link href="/landlord/tenancies">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenancy Details</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tenant Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tenant Information</CardTitle>
                <Badge variant={getStatusVariant(tenancy.status)} className="capitalize">
                  {tenancy.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={tenancy.tenant?.avatarUrl} />
                  <AvatarFallback>{getInitials(tenantName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg">{tenantName}</h3>
                  <p className="text-sm text-slate-500">{tenancy.tenant?.phone}</p>
                </div>
                <Link href={`/landlord/tenancies/${id}/screening`} className="ml-auto">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    Screen Tenant
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: rentAmountLabel(tenancy.rentCycle), value: formatNairaAmount(tenancy.rentAmount) },
                  { label: "Start Date", value: formatDate(tenancy.startDate) },
                  { label: "End Date", value: formatDate(tenancy.endDate) },
                  { label: "Next Rent Due", value: nextRentDue },
                  {
                    label: "Property",
                    value: tenancy.property?.name ?? tenancy.unit?.unitNumber ?? "N/A",
                  },
                ].map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                    <p className="font-semibold text-slate-900 text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deposit */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Security Deposit
                  {depositEscrow && (depositEscrow.status === "holding" || depositEscrow.status === "secured") && (
                    <Badge variant="outline" className="gap-1 text-[#1a3c5e] border-[#1a3c5e]/30">
                      <ShieldCheck className="h-3 w-3" /> In escrow
                    </Badge>
                  )}
                </CardTitle>
                {!tenancy.depositAmount && !depositEscrow && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDepositOpen(true)}
                  >
                    Record Deposit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {depositEscrow ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="font-bold text-slate-900">
                      {formatNaira(depositEscrow.amountKobo)}
                    </span>
                  </div>

                  {depositEscrow.status === "holding" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2 text-sm text-amber-800">
                      <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Held in escrow. It secures as the deposit once the tenant confirms move-in,
                        and auto-refunds to them by <strong>{formatDate(depositEscrow.refundAfter)}</strong>{" "}
                        if they don&apos;t.
                      </span>
                    </div>
                  )}

                  {depositEscrow.status === "secured" && (
                    <>
                      <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-start gap-2 text-sm text-green-700">
                        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>
                          Tenant moved in{depositEscrow.securedAt ? ` on ${formatDate(depositEscrow.securedAt)}` : ""}.
                          Deposit is held for the tenancy. Returning it refunds the tenant&apos;s wallet.
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          tenanciesApi.returnDeposit(id, {
                            depositReturnedAt: new Date().toISOString(),
                          }).then(() => {
                            toast.success("Deposit refunded to tenant")
                            queryClient.invalidateQueries({ queryKey: ["tenancy", id] })
                            queryClient.invalidateQueries({ queryKey: ["my-deposit-escrows"] })
                          }).catch((err: unknown) => toast.error(extractApiError(err, "Failed to return deposit")))
                        }
                      >
                        Return deposit
                      </Button>
                    </>
                  )}

                  {depositEscrow.status === "refunded" && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 flex items-start gap-2 text-sm text-blue-700">
                      <DollarSign className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Refunded to tenant{depositEscrow.refundedAt ? ` on ${formatDate(depositEscrow.refundedAt)}` : ""}
                        {depositEscrow.refundReason === "auto_no_confirmation"
                          ? " — move-in wasn't confirmed in time."
                          : depositEscrow.refundReason === "moveout_return"
                            ? " — returned at end of tenancy."
                            : "."}
                      </span>
                    </div>
                  )}
                </div>
              ) : tenancy.depositAmount ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600">Amount</span>
                    <span className="font-bold text-slate-900">
                      {formatNaira(tenancy.depositAmount)}
                    </span>
                  </div>
                  {tenancy.depositPaidAt && (
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                      <span className="text-sm text-green-700">Paid On</span>
                      <span className="text-sm font-medium">{formatDate(tenancy.depositPaidAt)}</span>
                    </div>
                  )}
                  {tenancy.depositReturnedAt ? (
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                      <span className="text-sm text-blue-700">Returned On</span>
                      <span className="text-sm font-medium">{formatDate(tenancy.depositReturnedAt)}</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        tenanciesApi.returnDeposit(id, {
                          depositReturnedAt: new Date().toISOString(),
                        }).then(() => {
                          toast.success("Deposit return recorded")
                          queryClient.invalidateQueries({ queryKey: ["tenancy", id] })
                        })
                      }
                    >
                      Mark as Returned
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No deposit recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Rent History */}
          <RentHistoryCard tenancyId={id} />

          {/* Agreement */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tenancy Agreement</CardTitle>
                {!agreement && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setAgreementOpen(true)}>
                    <FileText className="h-3.5 w-3.5" />
                    Upload Agreement
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {agreementLoading ? (
                <Skeleton className="h-12 rounded-xl" />
              ) : agreement ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Status</span>
                    <Badge variant={getStatusVariant(agreement.status)} className="capitalize">
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
                      <span className="truncate flex-1">{agreement.documentName ?? "View Document"}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  )}

                  {agreement.status === "signed_both" && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700 flex items-center gap-2">
                      <PenLine className="h-4 w-4" /> Fully executed by both parties.
                    </div>
                  )}

                  {agreement.tenantSignedAt && (
                    <div className="flex justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-sm text-green-700">
                        Tenant Signed{agreement.tenantSignatureName ? ` — ${agreement.tenantSignatureName}` : ""}
                      </span>
                      <span className="text-sm font-medium text-green-800">
                        {formatDate(agreement.tenantSignedAt)}
                      </span>
                    </div>
                  )}

                  {agreement.landlordSignedAt && (
                    <div className="flex justify-between p-3 bg-blue-50 rounded-xl">
                      <span className="text-sm text-blue-700">
                        Your Signature{agreement.landlordSignatureName ? ` — ${agreement.landlordSignatureName}` : ""}
                      </span>
                      <span className="text-sm font-medium text-blue-800">
                        {formatDate(agreement.landlordSignedAt)}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {(agreement.status === "draft" || agreement.status === "rejected") && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => { setUseUrlMode(false); setAgreementOpen(true) }}
                      >
                        <FileText className="h-3.5 w-3.5" />
                        Replace Document
                      </Button>
                    )}
                    {agreement.status === "draft" && (
                      <Button
                        className="flex-1 gap-2"
                        size="sm"
                        onClick={() => sendAgreementMutation.mutate()}
                        disabled={sendAgreementMutation.isPending}
                      >
                        {sendAgreementMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        Send to Tenant
                      </Button>
                    )}
                    {agreement.status === "sent" && (
                      <div className="w-full rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                        Waiting for the tenant to review and sign.
                      </div>
                    )}
                    {agreement.status === "signed_tenant" && !agreement.landlordSignedAt && (
                      <Button
                        className="flex-1 gap-2"
                        size="sm"
                        onClick={() => { setSignatureName(""); setCountersignOpen(true) }}
                      >
                        <PenLine className="h-3.5 w-3.5" />
                        Review & Countersign
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FileText className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 mb-3">No agreement uploaded yet</p>
                  <Button size="sm" variant="outline" onClick={() => setAgreementOpen(true)}>
                    Upload Agreement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {tenancy.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => setRenewOpen(true)}
                >
                  <RefreshCw className="h-4 w-4" />
                  Renew Tenancy
                </Button>

                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => openEditRent(tenancy.rentAmount)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Rent
                </Button>

                <Button
                  className="w-full gap-2"
                  variant="outline"
                  onClick={() => setDepositOpen(true)}
                >
                  <DollarSign className="h-4 w-4" />
                  Record Deposit
                </Button>

                <Button
                  variant="outline"
                  className="w-full text-red-500 hover:text-red-600 gap-2"
                  onClick={() => setTerminateOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Terminate
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Renew Dialog */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew Tenancy</DialogTitle>
            <DialogDescription>Set a new end date for this tenancy</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New End Date</Label>
              <Input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="mt-1.5"
                min={tenancy.endDate}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRenewOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!newEndDate || renewMutation.isPending}
              onClick={() => renewMutation.mutate()}
            >
              {renewMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Renew
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Rent Dialog */}
      <Dialog open={editRentOpen} onOpenChange={setEditRentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Annual Rent</DialogTitle>
            <DialogDescription>
              The tenant is notified and every change is recorded in the rent history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Annual Rent (₦)</Label>
              <Input
                type="number"
                value={newRent}
                onChange={(e) => setNewRent(e.target.value)}
                placeholder="e.g. 1200000"
                className="mt-1.5"
              />
            </div>
            <RentFeeBreakdown rentNaira={Number(newRent) || 0} />
            <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isCorrection}
                onChange={(e) => setIsCorrection(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#1a3c5e]"
              />
              <span>
                This is a correction (fixing a data-entry mistake), not a rent change.
                Corrections aren&apos;t counted as increases.
              </span>
            </label>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={rentReason}
                onChange={(e) => setRentReason(e.target.value)}
                placeholder={isCorrection ? "e.g. Entered the wrong figure" : "e.g. Annual review"}
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setEditRentOpen(false)} disabled={editRentMutation.isPending}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={!newRent || parseInt(newRent) <= 0 || editRentMutation.isPending}
              onClick={() => editRentMutation.mutate()}
            >
              {editRentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Security Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Amount (₦)</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="e.g. 600000"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Date Paid</Label>
              <Input
                type="date"
                value={depositDate}
                onChange={(e) => setDepositDate(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                value={depositNote}
                onChange={(e) => setDepositNote(e.target.value)}
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDepositOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!depositAmount || !depositDate || depositMutation.isPending}
              onClick={() => depositMutation.mutate()}
            >
              {depositMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terminate Dialog */}
      <Dialog open={terminateOpen} onOpenChange={setTerminateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terminate Tenancy</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The tenant will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setTerminateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={terminateMutation.isPending}
              onClick={() => terminateMutation.mutate()}
            >
              {terminateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Terminate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Agreement Dialog */}
      <Dialog open={agreementOpen} onOpenChange={(o) => { if (!o) closeAgreementModal() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{agreement ? "Replace Agreement Document" : "Upload Tenancy Agreement"}</DialogTitle>
            <DialogDescription>
              Upload the signed/blank agreement (PDF, Word, or image). The tenant will review and sign it online.
            </DialogDescription>
          </DialogHeader>

          {!useUrlMode ? (
            <div className="space-y-3 py-2">
              <label
                htmlFor="agreement-file"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 text-center cursor-pointer hover:border-[#1a3c5e]/40 hover:bg-slate-50 transition-colors"
              >
                <FileText className="h-8 w-8 text-slate-300" />
                {agreementFile ? (
                  <span className="text-sm font-medium text-slate-700 break-all">{agreementFile.name}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium text-slate-600">Click to choose a file</span>
                    <span className="text-xs text-slate-400">PDF, Word or image · up to 15MB</span>
                  </>
                )}
                <input
                  id="agreement-file"
                  type="file"
                  accept=".pdf,.doc,.docx,image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setAgreementFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-[#1a3c5e] underline"
                onClick={() => { setUseUrlMode(true); setAgreementFile(null) }}
              >
                Or paste a link instead
              </button>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="space-y-2">
                <Label htmlFor="doc-url">Document URL</Label>
                <Input
                  id="doc-url"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  autoFocus
                />
                <p className="text-xs text-slate-400">Make sure the link is shared with the tenant.</p>
              </div>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-[#1a3c5e] underline"
                onClick={() => { setUseUrlMode(false); setDocUrl("") }}
              >
                Or upload a file instead
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={closeAgreementModal}
              disabled={saveAgreementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={
                saveAgreementMutation.isPending ||
                (useUrlMode ? !docUrl.trim() : !agreementFile)
              }
              onClick={() => saveAgreementMutation.mutate()}
            >
              {saveAgreementMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {agreement ? "Update Document" : "Save Agreement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Countersign Dialog */}
      <Dialog open={countersignOpen} onOpenChange={(o) => { if (!o) { setCountersignOpen(false); setSignatureName("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Countersign Agreement</DialogTitle>
            <DialogDescription>
              The tenant has signed. Type your full legal name to countersign and fully execute this agreement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {agreement?.documentUrl && (
              <a
                href={agreement.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#1a3c5e] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Review the document first
              </a>
            )}
            <div className="space-y-2">
              <Label htmlFor="ll-signature">Your full name</Label>
              <Input
                id="ll-signature"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="e.g. John Adewale"
                autoFocus
              />
              <p className="text-xs text-slate-400">Typing your name acts as your legal signature.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setCountersignOpen(false); setSignatureName("") }}>
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={!signatureName.trim() || signAgreementMutation.isPending}
              onClick={() => signAgreementMutation.mutate()}
            >
              {signAgreementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              Countersign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
