"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { userApi } from "@/lib/api/user"
import { FileText, ExternalLink, Send, PenLine } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, formatNairaAmount, formatDate, getStatusVariant, getInitials, extractApiError } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, DollarSign, Shield, Trash2, RefreshCw, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function LandlordTenancyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [agreementOpen, setAgreementOpen] = useState(false)
  const [docUrl, setDocUrl] = useState("")
  const [renewOpen, setRenewOpen] = useState(false)
  const [depositOpen, setDepositOpen] = useState(false)
  const [terminateOpen, setTerminateOpen] = useState(false)
  const [newEndDate, setNewEndDate] = useState("")
  const [depositAmount, setDepositAmount] = useState("")
  const [depositDate, setDepositDate] = useState("")
  const [depositNote, setDepositNote] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["tenancy", id],
    queryFn: () => tenanciesApi.getTenancy(id),
  })

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

  const createAgreementMutation = useMutation({
    mutationFn: () =>
      userApi.createAgreement({ tenancyId: id, documentUrl: docUrl.trim() }),
    onSuccess: () => {
      toast.success("Agreement created and saved")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
      setAgreementOpen(false)
      setDocUrl("")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to create agreement")),
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
    mutationFn: () => userApi.signAgreement(agreement!.id),
    onSuccess: () => {
      toast.success("Agreement countersigned successfully!")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
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
                  { label: "Annual Rent", value: formatNairaAmount(tenancy.rentAmount) },
                  { label: "Start Date", value: formatDate(tenancy.startDate) },
                  { label: "End Date", value: formatDate(tenancy.endDate) },
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
                <CardTitle>Security Deposit</CardTitle>
                {!tenancy.depositAmount && (
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
              {tenancy.depositAmount ? (
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
                      className="flex items-center gap-2 text-sm text-[#1a3c5e] hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Document
                    </a>
                  )}

                  {agreement.tenantSignedAt && (
                    <div className="flex justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-sm text-green-700">Tenant Signed</span>
                      <span className="text-sm font-medium text-green-800">
                        {formatDate(agreement.tenantSignedAt)}
                      </span>
                    </div>
                  )}

                  {agreement.landlordSignedAt && (
                    <div className="flex justify-between p-3 bg-blue-50 rounded-xl">
                      <span className="text-sm text-blue-700">Your Signature</span>
                      <span className="text-sm font-medium text-blue-800">
                        {formatDate(agreement.landlordSignedAt)}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
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
                    {agreement.status === "signed_tenant" && !agreement.landlordSignedAt && (
                      <Button
                        className="flex-1 gap-2"
                        size="sm"
                        onClick={() => signAgreementMutation.mutate()}
                        disabled={signAgreementMutation.isPending}
                      >
                        {signAgreementMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <PenLine className="h-3.5 w-3.5" />
                        )}
                        Countersign
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
      <Dialog open={agreementOpen} onOpenChange={setAgreementOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Tenancy Agreement</DialogTitle>
            <DialogDescription>
              Paste the URL of your agreement document (Google Drive, Dropbox, etc.)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="doc-url">Document URL</Label>
              <Input
                id="doc-url"
                value={docUrl}
                onChange={(e) => setDocUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                autoFocus
              />
              <p className="text-xs text-slate-400">
                Make sure the link is publicly accessible or shared with the tenant.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setAgreementOpen(false)}
              disabled={createAgreementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={!docUrl.trim() || createAgreementMutation.isPending}
              onClick={() => createAgreementMutation.mutate()}
            >
              {createAgreementMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Save Agreement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
