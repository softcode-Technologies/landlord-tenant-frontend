"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { commissionsApi } from "@/lib/api/commission"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatNaira, formatDate } from "@/lib/utils"
import { DollarSign, CheckCircle2, XCircle, Loader2, Filter } from "lucide-react"
import { toast } from "sonner"

type FilterValue = "all" | "pending" | "paid" | "waived"

export default function LandlordCommissionsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterValue>("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ["landlord-commissions"],
    queryFn: () => commissionsApi.getLandlordCommissions(),
  })

  const commissions = commissionsData?.data ?? []

  const totals = commissions.reduce(
    (acc, c) => {
      acc.all += c.amountEarnedKobo
      if (c.status === "pending") acc.pending += c.amountEarnedKobo
      if (c.status === "paid") acc.paid += c.amountEarnedKobo
      if (c.status === "waived") acc.waived += c.amountEarnedKobo
      return acc
    },
    { all: 0, pending: 0, paid: 0, waived: 0 },
  )

  const filtered = filter === "all" ? commissions : commissions.filter((c) => c.status === filter)

  const payMutation = useMutation({
    mutationFn: (id: string) => commissionsApi.markPaid(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      toast.success("Commission marked as paid")
      queryClient.invalidateQueries({ queryKey: ["landlord-commissions"] })
    },
    onError: () => toast.error("Failed to mark as paid"),
  })

  const waiveMutation = useMutation({
    mutationFn: (id: string) => commissionsApi.waiveCommission(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      toast.success("Commission waived")
      queryClient.invalidateQueries({ queryKey: ["landlord-commissions"] })
    },
    onError: () => toast.error("Failed to waive commission"),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agent commissions</h1>
        <p className="text-slate-500 mt-1">Track and settle commissions owed to your agents</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Total recorded</p>
            <p className="text-2xl font-bold text-[#1a3c5e]">{formatNaira(totals.all)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{formatNaira(totals.pending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Paid</p>
            <p className="text-2xl font-bold text-emerald-600">{formatNaira(totals.paid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-slate-500 mb-1">Waived</p>
            <p className="text-2xl font-bold text-slate-500">{formatNaira(totals.waived)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle>Commission history</CardTitle>
          <div className="flex items-center gap-2 -mx-1 px-1 overflow-x-auto sm:overflow-visible">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <div className="flex bg-slate-100 rounded-lg p-1 text-xs">
              {(["all", "pending", "paid", "waived"] as FilterValue[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors whitespace-nowrap ${
                    filter === f
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title={filter === "all" ? "No commissions yet" : `No ${filter} commissions`}
              description={
                filter === "all"
                  ? "Commissions get recorded when you assign an agent to a property and a tenancy is created."
                  : "Try switching to a different filter."
              }
            />
          ) : (
            <div className="space-y-2">
              {filtered.map((c) => {
                const isPending = c.status === "pending"
                const isBusy = busyId === c.id
                return (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {c.property?.name ?? "Property commission"}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {c.commissionType === "percentage"
                          ? `${c.commissionValue}% commission`
                          : "Flat fee"}{" "}
                        · Created {formatDate(c.createdAt)}
                        {c.paidAt ? ` · Paid ${formatDate(c.paidAt)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:shrink-0 w-full sm:w-auto">
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2">
                        <p className="font-bold text-slate-900 whitespace-nowrap">
                          {formatNaira(c.amountEarnedKobo)}
                        </p>
                        <Badge
                          variant={
                            c.status === "paid"
                              ? "success"
                              : c.status === "waived"
                              ? "outline"
                              : "secondary"
                          }
                          className="text-[10px] capitalize"
                        >
                          {c.status}
                        </Badge>
                      </div>
                      {isPending && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-initial"
                            onClick={() => payMutation.mutate(c.id)}
                            disabled={isBusy}
                          >
                            {isBusy && payMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            Mark paid
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 text-slate-600 flex-1 sm:flex-initial"
                            onClick={() => waiveMutation.mutate(c.id)}
                            disabled={isBusy}
                          >
                            {isBusy && waiveMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            Waive
                          </Button>
                        </div>
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
