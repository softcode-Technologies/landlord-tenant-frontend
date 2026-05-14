"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDate, getInitials } from "@/lib/utils"
import { Shield, CheckCircle2, X, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminKycPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kyc"],
    queryFn: () => adminApi.getKycQueue({ page: 1, limit: 20 }),
  })

  const approveMutation = useMutation({
    mutationFn: (userId: string) => adminApi.approveKyc(userId),
    onSuccess: () => {
      toast.success("KYC approved!")
      queryClient.invalidateQueries({ queryKey: ["admin-kyc"] })
    },
    onError: () => toast.error("Failed to approve"),
  })

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => adminApi.rejectKyc(userId),
    onSuccess: () => {
      toast.success("KYC rejected")
      queryClient.invalidateQueries({ queryKey: ["admin-kyc"] })
    },
    onError: () => toast.error("Failed to reject"),
  })

  const kyc = data?.data?.data ?? []
  const pendingKyc = kyc.filter((k) => k.status === "pending")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC Verification Queue</h1>
        <p className="text-slate-500 mt-1">
          {pendingKyc.length} pending verification{pendingKyc.length !== 1 ? "s" : ""}
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
          title="No KYC submissions"
          description="User identity verifications will appear here for review."
        />
      ) : (
        <div className="space-y-4">
          {kyc.map((record) => {
            const name = record.user
              ? `${record.user.firstName ?? ""} ${record.user.lastName ?? ""}`.trim() || "User"
              : "User"

            return (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={record.user?.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-900">{name}</h3>
                        <Badge
                          variant={
                            record.status === "approved"
                              ? "success"
                              : record.status === "rejected"
                              ? "destructive"
                              : "secondary"
                          }
                          className="capitalize text-xs"
                        >
                          {record.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">{record.user?.phone}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Submitted {formatDate(record.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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

                      {record.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="gap-1 bg-green-600 hover:bg-green-700"
                            onClick={() => approveMutation.mutate(record.userId)}
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
                            onClick={() => rejectMutation.mutate(record.userId)}
                            disabled={rejectMutation.isPending}
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
    </div>
  )
}
