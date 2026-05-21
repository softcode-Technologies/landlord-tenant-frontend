"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNaira, formatDate, getStatusVariant, extractApiError } from "@/lib/utils"
import { CreditCard, RefreshCw, TrendingUp, Wallet, Building, Eye, AlertCircle, Loader2 } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import type { Payment } from "@/lib/types"

const TYPE_LABELS: Record<string, string> = {
  inspection_fee: "Inspection Fee",
  rent: "Rent",
  wallet_topup: "Wallet Topup",
  listing_boost: "Listing Boost",
}

const TYPE_COLORS: Record<string, string> = {
  inspection_fee: "bg-purple-50 text-purple-700 border-purple-200",
  rent: "bg-blue-50 text-blue-700 border-blue-200",
  wallet_topup: "bg-green-50 text-green-700 border-green-200",
  listing_boost: "bg-orange-50 text-orange-700 border-orange-200",
}

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient()
  const [statusTab, setStatusTab] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null)
  const [walletTarget, setWalletTarget] = useState<Payment | null>(null)

  const params = {
    page,
    limit: 20,
    status: statusTab === "all" ? undefined : statusTab,
    type: typeFilter === "all" ? undefined : typeFilter,
  }

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => adminApi.getRevenueBreakdown(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", params],
    queryFn: () => adminApi.getAllPayments(params),
  })

  const refundMutation = useMutation({
    mutationFn: (paymentId: string) => adminApi.refundPayment(paymentId),
    onSuccess: () => {
      toast.success("Refund initiated successfully")
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] })
      queryClient.invalidateQueries({ queryKey: ["admin-revenue"] })
      setRefundTarget(null)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Refund failed")),
  })

  const revenue = revenueData?.data
  const payments = data?.data?.data ?? []
  const pagination = data?.data?.pagination

  const revenueCards = [
    { label: "Inspection Fees", value: revenue?.inspection_fee ?? 0, icon: Eye, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Rent Revenue", value: revenue?.rent ?? 0, icon: Building, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Platform Commission", value: revenue?.platformCommission ?? 0, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
    { label: "Wallet Topups", value: revenue?.wallet_topup ?? 0, icon: Wallet, color: "text-orange-600", bg: "bg-orange-50" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-500 mt-1">Monitor transactions, revenue, and refunds</p>
        </div>
        {(revenue?.pendingCount ?? 0) > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {revenue?.pendingCount} pending payment{revenue?.pendingCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {revenueCards.map((card) => (
          <Card key={card.label} className="border-slate-100">
            <CardContent className="p-5">
              {revenueLoading ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : (
                <>
                  <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                  <p className="text-xl font-bold text-slate-900">{formatNaira(card.value)}</p>
                  {card.label === "Inspection Fees" && revenue?.thisMonth?.inspection_fee ? (
                    <p className="text-xs text-green-600 mt-1">+{formatNaira(revenue.thisMonth.inspection_fee)} this month</p>
                  ) : null}
                  {card.label === "Rent Revenue" && revenue?.thisMonth?.rent ? (
                    <p className="text-xs text-green-600 mt-1">+{formatNaira(revenue.thisMonth.rent)} this month</p>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v); setPage(1) }}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="success">Success</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
            <TabsTrigger value="refunded">Refunded</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          {["all", "inspection_fee", "rent", "wallet_topup", "listing_boost"].map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1) }}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                typeFilter === t
                  ? "bg-[#1a3c5e] text-white border-[#1a3c5e]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#1a3c5e]"
              }`}
            >
              {t === "all" ? "All Types" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader className="pb-0 px-6 pt-4">
          <CardTitle className="text-sm font-medium text-slate-500">
            {pagination ? `${pagination.total.toLocaleString()} transactions` : "Loading..."}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8">
              <EmptyState icon={CreditCard} title="No transactions found" description="Adjust the filters to see more results." />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const user = (payment as unknown as { user?: { firstName?: string; lastName?: string; phone?: string } }).user
                  const name = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.phone || "—" : "—"
                  return (
                    <TableRow key={payment.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{name}</p>
                          {user?.phone && <p className="text-xs text-slate-400">{user.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${TYPE_COLORS[payment.type] ?? "bg-slate-50 text-slate-600 border-slate-200"}`}>
                          {TYPE_LABELS[payment.type] ?? payment.type}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-[#1a3c5e] text-sm">
                        {formatNaira(payment.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono">
                        {payment.reference?.slice(0, 20)}…
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(payment.status)} className="capitalize text-xs">
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {payment.status === "success" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:border-red-300"
                            onClick={() => setRefundTarget(payment)}
                          >
                            <RefreshCw className="h-3 w-3" />
                            Refund
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
            Previous
          </Button>
          <span className="flex items-center text-sm text-slate-600 px-2">{page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>
            Next
          </Button>
        </div>
      )}

      {/* Refund Dialog */}
      <Dialog open={!!refundTarget} onOpenChange={(open) => { if (!open) setRefundTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Refund</DialogTitle>
          </DialogHeader>
          {refundTarget && (
            <div className="py-3 space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-bold text-slate-900">{formatNaira(refundTarget.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Type</span>
                  <span className="text-slate-700">{TYPE_LABELS[refundTarget.type] ?? refundTarget.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-xs text-slate-600">{refundTarget.reference}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                This will initiate a full refund via Paystack. The payment status will be updated to <strong>refunded</strong>.
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={refundMutation.isPending}
              onClick={() => refundTarget && refundMutation.mutate(refundTarget.id)}
            >
              {refundMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
