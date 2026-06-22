"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { formatDate, getInitials, extractApiError } from "@/lib/utils"
import {
  Shield, CheckCircle2, X, ExternalLink, Loader2, Building, UserCheck, FileText,
  Phone, Mail, Calendar, CreditCard,
} from "lucide-react"
import { toast } from "sonner"
import type { KycRecord } from "@/lib/types"

const METHOD_LABELS: Record<string, string> = {
  nin: "NIN",
  bvn: "BVN",
  document: "Document Upload",
}

const METHOD_ICONS: Record<string, React.ElementType> = {
  nin: CreditCard,
  bvn: Building,
  document: FileText,
}

type KycUser = KycRecord & {
  email?: string
  landlordProfile?: { id: string; companyName?: string; isVerified?: boolean } | null
  tenantProfile?: { id: string } | null
  agentProfile?: { id: string; licenseNumber?: string; isVerified?: boolean } | null
}

export default function AdminKycPage() {
  const queryClient = useQueryClient()
  const [statusTab, setStatusTab] = useState("pending")
  const [page, setPage] = useState(1)
  const [rejectTarget, setRejectTarget] = useState<KycUser | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [detailTarget, setDetailTarget] = useState<KycUser | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kyc", statusTab, page],
    queryFn: () => adminApi.getKycQueue({ page, limit: 20, status: statusTab }),
  })

  const approveMutation = useMutation({
    mutationFn: (userId: string) => adminApi.approveKyc(userId),
    onSuccess: () => {
      toast.success("KYC approved!")
      queryClient.invalidateQueries({ queryKey: ["admin-kyc"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to approve")),
  })

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminApi.rejectKyc(userId, reason),
    onSuccess: () => {
      toast.success("KYC rejected")
      queryClient.invalidateQueries({ queryKey: ["admin-kyc"] })
      setRejectTarget(null)
      setRejectReason("")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to reject")),
  })

  const kyc = (data?.data?.data ?? []) as unknown as KycUser[]
  const meta = data?.data?.meta

  const getUserRole = (record: KycUser) => {
    if (record.landlordProfile) return "Landlord"
    if (record.agentProfile) return "Agent"
    if (record.tenantProfile) return "Tenant"
    return "User"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC Verification</h1>
        <p className="text-slate-500 mt-1">Review and manage user identity verifications</p>
      </div>

      <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v); setPage(1) }}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="pending" className="gap-2">
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
      ) : kyc.length === 0 ? (
        <EmptyState
          icon={Shield}
          title={`No ${statusTab === "all" ? "" : statusTab} KYC submissions`}
          description="User identity verifications will appear here."
        />
      ) : (
        <div className="space-y-3">
          {kyc.map((record) => {
            const name = `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim() || "User"
            const method = record.kycMethod
            const MethodIcon = method ? (METHOD_ICONS[method] ?? FileText) : FileText
            const role = getUserRole(record)

            return (
              <Card key={record.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-11 w-11 shrink-0">
                      <AvatarImage src={record.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-sm bg-[#1a3c5e]/10 text-[#1a3c5e]">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{name}</h3>
                        <Badge variant="outline" className="text-xs">{role}</Badge>
                        {method && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <MethodIcon className="h-3 w-3" />
                            {METHOD_LABELS[method] ?? method}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            record.kycStatus === "approved" ? "success"
                            : record.kycStatus === "rejected" ? "destructive"
                            : "warning"
                          }
                          className="capitalize text-xs"
                        >
                          {record.kycStatus}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3" />{record.phone}
                        </span>
                        {record.kycSubmittedAt && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />Submitted {formatDate(record.kycSubmittedAt)}
                          </span>
                        )}
                        {(method === "nin" || method === "bvn") && record.kycIdentifier && (
                          <span className="flex items-center gap-1 text-xs text-slate-700 font-mono font-medium">
                            <CreditCard className="h-3 w-3" />
                            {METHOD_LABELS[method]}: {record.kycIdentifier}
                          </span>
                        )}
                        {record.landlordProfile?.companyName && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Building className="h-3 w-3" />{record.landlordProfile.companyName}
                          </span>
                        )}
                        {record.agentProfile?.licenseNumber && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <UserCheck className="h-3 w-3" />License: {record.agentProfile.licenseNumber}
                          </span>
                        )}
                      </div>

                      {record.kycStatus === "rejected" && record.kycRejectReason && (
                        <div className="mt-2 text-xs bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-red-600">
                          Rejection reason: {record.kycRejectReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-[#1a3c5e]"
                        onClick={() => setDetailTarget(record)}
                      >
                        Details
                      </Button>

                      {method === "document" && record.kycDocumentUrl && (
                        <a href={record.kycDocumentUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
                            <ExternalLink className="h-3 w-3" />
                            Doc
                          </Button>
                        </a>
                      )}

                      {record.kycStatus === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="gap-1 bg-green-600 hover:bg-green-700 h-8 text-xs"
                            onClick={() => approveMutation.mutate(record.id)}
                            disabled={approveMutation.isPending}
                          >
                            {approveMutation.isPending
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <CheckCircle2 className="h-3 w-3" />
                            }
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-500 hover:text-red-600 hover:border-red-300 h-8 text-xs"
                            onClick={() => { setRejectTarget(record); setRejectReason("") }}
                          >
                            <X className="h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {meta && (meta.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</Button>
          <span className="flex items-center text-sm text-slate-600 px-2">{page} of {meta.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= (meta.totalPages ?? 1)}>Next</Button>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject KYC Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Reason for rejection</Label>
            <Input
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. ID image is blurry, NIN not found in database"
            />
            <p className="text-xs text-slate-400">
              This message is shown to the user so they can resubmit correctly.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason("") }}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (!rejectTarget) return
                rejectMutation.mutate({ userId: rejectTarget.id, reason: rejectReason.trim() || "" })
              }}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={(open) => { if (!open) setDetailTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {detailTarget && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={detailTarget.avatarUrl ?? undefined} />
                  <AvatarFallback className="text-lg bg-[#1a3c5e]/10 text-[#1a3c5e]">
                    {getInitials(`${detailTarget.firstName ?? ""} ${detailTarget.lastName ?? ""}`)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {`${detailTarget.firstName ?? ""} ${detailTarget.lastName ?? ""}`.trim() || "—"}
                  </h3>
                  <p className="text-sm text-slate-500">{getUserRole(detailTarget)}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { icon: Phone, label: "Phone", value: detailTarget.phone },
                  { icon: Mail, label: "Email", value: detailTarget.email ?? "—" },
                  { icon: Calendar, label: "Joined", value: formatDate(detailTarget.createdAt) },
                  { icon: Shield, label: "KYC Method", value: detailTarget.kycMethod ? METHOD_LABELS[detailTarget.kycMethod] : "—" },
                  ...((detailTarget.kycMethod === "nin" || detailTarget.kycMethod === "bvn")
                    ? [{ icon: CreditCard, label: `${METHOD_LABELS[detailTarget.kycMethod]} Number`, value: detailTarget.kycIdentifier || "—" }]
                    : []),
                  { icon: Calendar, label: "Submitted", value: detailTarget.kycSubmittedAt ? formatDate(detailTarget.kycSubmittedAt) : "—" },
                  ...(detailTarget.landlordProfile?.companyName ? [{ icon: Building, label: "Company", value: detailTarget.landlordProfile.companyName }] : []),
                  ...(detailTarget.agentProfile?.licenseNumber ? [{ icon: UserCheck, label: "License No.", value: detailTarget.agentProfile.licenseNumber }] : []),
                  ...(detailTarget.kycRejectReason ? [{ icon: X, label: "Reject Reason", value: detailTarget.kycRejectReason }] : []),
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 py-1.5 border-b border-slate-50">
                    <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-slate-500 w-28 shrink-0">{label}</span>
                    <span className="text-slate-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>
              {detailTarget.kycMethod === "document" && detailTarget.kycDocumentUrl && (
                <a href={detailTarget.kycDocumentUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />View Uploaded Document
                  </Button>
                </a>
              )}
              {detailTarget.kycStatus === "pending" && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => { approveMutation.mutate(detailTarget.id); setDetailTarget(null) }}
                  >
                    <CheckCircle2 className="h-4 w-4" />Approve
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    variant="outline"
                    onClick={() => { setDetailTarget(null); setRejectTarget(detailTarget); setRejectReason("") }}
                  >
                    <X className="h-4 w-4" />Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
