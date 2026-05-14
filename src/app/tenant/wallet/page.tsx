"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { paymentsApi } from "@/lib/api/payments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNaira, formatDate, getStatusVariant } from "@/lib/utils"
import { Wallet, Plus, ArrowUpRight, Loader2, TrendingUp } from "lucide-react"
import { toast } from "sonner"

export default function TenantWalletPage() {
  const [topupAmount, setTopupAmount] = useState("")

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => paymentsApi.getWallet(),
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["payment-history"],
    queryFn: () => paymentsApi.getPaymentHistory(),
  })

  const topupMutation = useMutation({
    mutationFn: () => paymentsApi.topupWallet(parseInt(topupAmount) * 100),
    onSuccess: (res) => {
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl
      }
    },
    onError: () => {
      toast.error("Failed to initiate topup")
    },
  })

  const balance = walletData?.data?.balance ?? 0
  const history = historyData?.data ?? []

  const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
        <p className="text-slate-500 mt-1">Manage your NaijaRental wallet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance & Topup */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-white/20">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="text-slate-300 text-sm">Available Balance</p>
              </div>
              {walletLoading ? (
                <Skeleton className="h-10 w-40 bg-white/20" />
              ) : (
                <p className="text-4xl font-bold">
                  {formatNaira(balance * 100)}
                </p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-slate-300">NaijaRental Wallet</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Up Wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Amount (₦)</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="mt-1.5"
                  min="100"
                />
              </div>

              {/* Quick amounts */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setTopupAmount(amount.toString())}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        topupAmount === amount.toString()
                          ? "bg-[#1a3c5e] text-white border-[#1a3c5e]"
                          : "border-slate-200 text-slate-600 hover:border-[#1a3c5e]"
                      }`}
                    >
                      ₦{(amount).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => topupMutation.mutate()}
                disabled={!topupAmount || parseInt(topupAmount) < 100 || topupMutation.isPending}
              >
                {topupMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Top Up with Paystack
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {history.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl ${
                            payment.type === "rent"
                              ? "bg-[#1a3c5e]/10"
                              : "bg-green-50"
                          }`}
                        >
                          <ArrowUpRight
                            className={`h-4 w-4 ${
                              payment.type === "rent"
                                ? "text-[#1a3c5e]"
                                : "text-green-600"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 capitalize">
                            {payment.type === "rent" ? "Rent Payment" : "Wallet Topup"}
                          </p>
                          <p className="text-xs text-slate-400">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {formatNaira(payment.amountKobo)}
                        </p>
                        <Badge
                          variant={getStatusVariant(payment.status)}
                          className="text-[10px] capitalize mt-0.5"
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
