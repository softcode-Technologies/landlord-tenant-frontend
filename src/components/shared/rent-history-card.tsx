"use client"

import { useQuery } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatNairaAmount, formatDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, Wrench } from "lucide-react"

// Shared rent-change history. Landlord and tenant both see the same audit
// trail; renders nothing until there's at least one change.
export function RentHistoryCard({ tenancyId }: { tenancyId: string }) {
  const { data } = useQuery({
    queryKey: ["rent-changes", tenancyId],
    queryFn: () => tenanciesApi.getRentChanges(tenancyId),
  })
  const changes = data?.data ?? []
  if (changes.length === 0) return null

  const increases = changes.filter((c) => c.changeType === "increase").length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rent History</CardTitle>
          {increases > 0 && (
            <Badge className="bg-amber-100 text-amber-700 border border-amber-200">
              Increased {increases} time{increases !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {changes.map((c) => {
            const Icon =
              c.changeType === "increase" ? TrendingUp : c.changeType === "decrease" ? TrendingDown : Wrench
            const tone =
              c.changeType === "increase"
                ? "text-red-600 bg-red-50"
                : c.changeType === "decrease"
                ? "text-green-600 bg-green-50"
                : "text-slate-600 bg-slate-100"
            const by = c.changedBy
              ? `${c.changedBy.firstName ?? ""} ${c.changedBy.lastName ?? ""}`.trim()
              : ""
            return (
              <div
                key={c.id}
                className="flex items-start gap-3 border-b border-slate-100 last:border-0 pb-3 last:pb-0"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">
                    {formatNairaAmount(c.previousAmount)} → {formatNairaAmount(c.newAmount)}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {c.changeType} · {formatDate(c.createdAt)}
                    {by ? ` · by ${by}` : ""}
                  </p>
                  {c.reason && (
                    <p className="text-xs text-slate-500 mt-1 bg-slate-50 rounded-lg px-2.5 py-1.5">
                      {c.reason}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
