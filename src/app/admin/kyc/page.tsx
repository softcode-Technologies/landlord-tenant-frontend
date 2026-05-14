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
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatDate, getInitials, extractApiError } from "@/lib/utils"
import { Shield, CheckCircle2, X, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { KycRecord } from "@/lib/types"

const METHOD_LABELS: Record<string, string> = {
  nin: "NIN",
  bvn: "BVN",
  document: "Document",
}

export default function AdminKycPage() {
  const queryClient = useQueryClient()
  const [rejectTarget, setRejectTarget] = useState<KycRecord | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kyc"],
    queryFn: () => adminApi.getKycQueue({ page: 1, limit: 50 }),
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

  // Backend returns User rows directly — cast to KycRecord
  const kyc: KycRecord[] = (data?.data?.data ?? []) as unknown as KycRecord[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC Verification Queue</h1>
        <p className="text-slate-500 mt-1">
          {kyc.length} pending verification{kyc.length !== 1 ? "s" : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : kyc.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No pending KYC submissions"
          description="User identity verifications will appear here for review."
        />
      ) : (
        <div className="space-y-4">
          {kyc.map((record) => {
            const name = `${record.firstName ?? ""} ${record.lastName ?? ""}`.trim() || "User"
            const method = record.kycMethod

            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={record.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">{getInitials(name)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h3 className="font-semibold text-slate-900">{name}</h3>
                        {method && (
                          <Badge variant="secondary" className="text-xs">
                            {METHOD_LABELS[method] ?? method}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            record.kycStatus === "approved"
                              ? "success"
                              : record.kycStatus === "rejected"
                              ? "destructive"
                              : "warning"
                          }
                          className="capitalize text-xs"
                        >
                          {record.kycStatus}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{record.phone}</p>
                      {method === "nin" || method === "bvn" ? (
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          {METHOD_LABELS[method]}: •••••••
                          {record.kycIdentifier?.slice(-4) ?? "????"}
                        </p>
                      ) : null}
                      <p className="text-xs text-slate-400 mt-0.5">
                        Submitted {formatDate(record.kycSubmittedAt ?? record.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {method === "document" && record.kycDocumentUrl && (
                        <a
                          href={record.kycDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" className="gap-1">
                            <ExternalLink className="h-3.5 w-3.5" />
                            View Doc
                          </Button>
                        </a>
                      )}

                      {record.kycStatus === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate(record.id)}
                            disabled={approveMutation.isPending}
                          >
                            {approveMutation.isPending ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-500 hover:text-red-600"
                            onClick={() => { setRejectTarget(record); setRejectReason("") }}
                          >
                            <X className="h-3.5 w-3.5" />
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

      {/* Reject reason dialog */}
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
            <p className="text-xs text-slate-400">This message will be shown to the user so they can resubmit correctly.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectReason("") }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => {
                if (!rejectTarget) return
                rejectMutation.mutate({ userId: rejectTarget.id, reason: rejectReason.trim() || undefined as unknown as string })
              }}
            >
              {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
