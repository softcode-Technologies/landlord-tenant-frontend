"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNaira, formatDate, extractApiError } from "@/lib/utils"
import { Gift, Users, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { toast } from "sonner"

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Gift; label: string; value: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent ?? "bg-slate-100"}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminReferralsPage() {
  const queryClient = useQueryClient()
  const [statusTab, setStatusTab] = useState("all")
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-referrals", page, statusTab],
    queryFn: () => adminApi.getReferrals({ page, limit: 20, status: statusTab === "all" ? undefined : statusTab }),
  })

  const rewardMutation = useMutation({
    mutationFn: (id: string) => adminApi.rewardReferral(id),
    onSuccess: () => {
      toast.success("Referrer credited")
      queryClient.invalidateQueries({ queryKey: ["admin-referrals"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to credit referrer")),
  })

  const referrals = data?.data?.referrals ?? []
  const pagination = data?.data?.pagination
  const summary = data?.data?.summary

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Refer &amp; Earn</h1>
        <p className="text-slate-500 mt-1">
          Tenants earn {summary ? formatNaira(summary.rewardPerReferralKobo) : "₦5,000"} when someone they
          referred pays their first rent. Rewards are credited automatically — use this page to monitor and
          to manually credit edge cases.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Clock}
          label="Pending"
          value={String(summary?.pendingCount ?? 0)}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Rewarded"
          value={String(summary?.rewardedCount ?? 0)}
          accent="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Gift}
          label="Total Paid Out"
          value={formatNaira(summary?.totalPaidKobo ?? 0)}
          accent="bg-[#1a3c5e]/10 text-[#1a3c5e]"
        />
      </div>

      {/* Filters */}
      <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v); setPage(1) }}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="rewarded">Rewarded</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : referrals.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Users} title="No referrals yet" description="Referrals will appear here as tenants invite friends." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Referrer (earns)</TableHead>
                  <TableHead>Referred friend</TableHead>
                  <TableHead>Reward</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <p className="font-medium text-sm text-slate-900">{r.referrer?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-400">{r.referrer?.phone ?? r.referrer?.email ?? ""}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm text-slate-900">{r.referred?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-400">{r.referred?.phone ?? r.referred?.email ?? ""}</p>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-[#1a3c5e]">
                      {r.status === "rewarded" ? formatNaira(r.rewardKobo) : "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {r.status === "rewarded" && r.rewardedAt ? formatDate(r.rewardedAt) : formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "rewarded" ? "success" : "warning"} className="capitalize text-xs">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === "pending" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1"
                          onClick={() => rewardMutation.mutate(r.id)}
                          disabled={rewardMutation.isPending}
                        >
                          {rewardMutation.isPending && rewardMutation.variables === r.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Gift className="h-3 w-3" />
                          )}
                          Credit ₦ now
                        </Button>
                      ) : (
                        <span className="text-xs text-green-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</Button>
          <span className="flex items-center text-sm text-slate-600 px-2">{page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
        </div>
      )}
    </div>
  )
}
