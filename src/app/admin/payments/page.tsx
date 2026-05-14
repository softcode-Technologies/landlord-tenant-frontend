"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatNaira, formatDate, getStatusVariant } from "@/lib/utils"
import { CreditCard } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"

export default function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => adminApi.getAllPayments(),
  })

  const payments = data?.data?.data ?? []
  const totalRevenue = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Payments</h1>
        <p className="text-slate-500 mt-1">
          Total revenue: <span className="font-bold text-[#1a3c5e]">{formatNaira(totalRevenue)}</span>
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={CreditCard}
                title="No payments yet"
                description="Payment transactions will appear here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paystack Ref</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="capitalize text-sm font-medium text-slate-900">
                      {payment.type === "rent" ? "Rent Payment" : "Wallet Topup"}
                    </TableCell>
                    <TableCell className="font-bold text-[#1a3c5e] text-sm">
                      {formatNaira(payment.amount)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-400 font-mono">
                      {payment.reference ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(payment.status)}
                        className="capitalize text-xs"
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
