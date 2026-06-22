"use client"

import { useState, useEffect, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { paymentsApi } from "@/lib/api/payments"
import { useAuthStore } from "@/lib/store/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatNaira, formatDate, getStatusVariant } from "@/lib/utils"
import {
  Wallet, Plus, ArrowUpRight, ArrowDownLeft, Loader2, TrendingUp, Download,
  Building2, Star, Trash2, Banknote, ShieldAlert, CheckCircle2, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { EscrowPanel } from "@/components/shared/escrow-panel"

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000, 100000]

function WalletContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const kycApproved = user?.kycStatus === "approved"

  const [topupAmount, setTopupAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [selectedBankId, setSelectedBankId] = useState("")

  const [addOpen, setAddOpen] = useState(false)
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [resolvedName, setResolvedName] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => paymentsApi.getWallet(),
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => paymentsApi.getWalletTransactions(),
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["payment-history"],
    queryFn: () => paymentsApi.getPaymentHistory(),
  })

  const { data: banksData, isLoading: banksLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => paymentsApi.getBankAccounts(),
  })

  const { data: bankListData, isLoading: bankListLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: () => paymentsApi.listBanks(),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: addOpen,
  })

  // Show success toast and refetch after the payment-gateway top-up redirect
  useEffect(() => {
    if (searchParams.get("topup") === "success") {
      toast.success("Wallet topped up successfully!")
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] })
      queryClient.invalidateQueries({ queryKey: ["payment-history"] })
      router.replace("/tenant/wallet")
    }
  }, [searchParams, queryClient, router])

  const balance = walletData?.data?.balance ?? 0
  const transactions = txData?.data ?? []
  const history = historyData?.data ?? []
  const banks = banksData?.data ?? []
  const allBanks = bankListData?.data ?? []
  const selectedBank = allBanks.find((b) => b.code === bankCode)

  const defaultBank = banks.find((b) => b.isDefault) ?? banks[0]
  const activeBankId = selectedBankId || defaultBank?.id || ""

  const topupMutation = useMutation({
    mutationFn: () => paymentsApi.topupWallet(parseInt(topupAmount) * 100),
    onSuccess: (res) => {
      if (res.data.paymentUrl) window.location.href = res.data.paymentUrl
    },
    onError: () => toast.error("Failed to initiate top-up. Please try again."),
  })

  const withdrawMutation = useMutation({
    mutationFn: () =>
      paymentsApi.withdraw({ amountKobo: parseInt(withdrawAmount) * 100, bankAccountId: activeBankId }),
    onSuccess: () => {
      toast.success("Withdrawal initiated. Funds typically arrive within 24 hours.")
      setWithdrawAmount("")
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string }; message?: string } } }
      toast.error(e.response?.data?.error?.message ?? e.response?.data?.message ?? "Withdrawal failed")
    },
  })

  // Auto-resolve account name once bank + 10-digit account number are entered.
  useEffect(() => {
    setResolvedName(null)
    setResolveError(null)
    if (!bankCode || accountNumber.length !== 10) return

    let cancelled = false
    const timer = setTimeout(async () => {
      setResolving(true)
      try {
        const res = await paymentsApi.resolveBankAccount({ accountNumber, bankCode })
        if (!cancelled) setResolvedName(res.data.accountName)
      } catch (err: unknown) {
        if (cancelled) return
        const e = err as { response?: { data?: { error?: { message?: string }; message?: string } } }
        setResolveError(e.response?.data?.error?.message ?? e.response?.data?.message ?? "Could not verify this account.")
      } finally {
        if (!cancelled) setResolving(false)
      }
    }, 400)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [bankCode, accountNumber])

  const resetAddForm = () => {
    setAddOpen(false)
    setBankCode("")
    setAccountNumber("")
    setResolvedName(null)
    setResolveError(null)
  }

  const addBankMutation = useMutation({
    mutationFn: () =>
      paymentsApi.addBankAccount({
        bankCode,
        bankName: selectedBank?.name ?? "",
        accountNumber,
        accountName: resolvedName ?? undefined,
      }),
    onSuccess: () => {
      toast.success("Bank account added")
      resetAddForm()
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { error?: { message?: string }; message?: string } } }
      toast.error(e.response?.data?.error?.message ?? e.response?.data?.message ?? "Failed to add bank account")
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.setDefaultBankAccount(id),
    onSuccess: () => {
      toast.success("Default account updated")
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
    },
  })

  const removeBankMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.removeBankAccount(id),
    onSuccess: () => {
      toast.success("Bank account removed")
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] })
    },
  })

  const amountValid = withdrawAmount && parseInt(withdrawAmount) >= 1000
  const balanceSufficient = amountValid && parseInt(withdrawAmount) * 100 <= balance

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
        <p className="text-slate-500 mt-1">Top up, withdraw your earnings, and track activity</p>
      </div>

      {!kycApproved && (
        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">Verification required to withdraw</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Complete identity verification to withdraw your wallet balance (including referral rewards) to your bank.
              </p>
            </div>
          </div>
          <Link
            href="/tenant/kyc"
            className="self-start sm:self-auto shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Verify →
          </Link>
        </div>
      )}

      <EscrowPanel side="tenant" showHistory={false} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance + actions */}
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
                <p className="text-4xl font-bold">{formatNaira(balance)}</p>
              )}
              <div className="mt-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-400" />
                <span className="text-xs text-slate-300">Referral rewards & top-ups land here</span>
              </div>
            </CardContent>
          </Card>

          {/* Top up */}
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
                      ₦{amount.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => topupMutation.mutate()}
                disabled={!topupAmount || parseInt(topupAmount) < 100 || topupMutation.isPending}
              >
                {topupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Top Up Wallet
              </Button>
            </CardContent>
          </Card>

          {/* Withdraw */}
          <Card>
            <CardHeader>
              <CardTitle>Withdraw to bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Amount (₦)</Label>
                <Input
                  type="number"
                  placeholder="Minimum ₦1,000"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="mt-1.5"
                  min="1000"
                  disabled={!kycApproved || banks.length === 0}
                />
                {withdrawAmount && !balanceSufficient && (
                  <p className="text-xs text-red-600 mt-1.5">Amount exceeds available balance or below ₦1,000 minimum</p>
                )}
              </div>
              <div>
                <Label>Destination account</Label>
                {banksLoading ? (
                  <Skeleton className="h-10 w-full mt-1.5" />
                ) : banks.length === 0 ? (
                  <p className="text-xs text-slate-500 mt-1.5">Add a bank account below to enable withdrawals.</p>
                ) : (
                  <select
                    value={activeBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                    disabled={!kycApproved}
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.bankName} · ****{b.accountNumber.slice(-4)} ({b.accountName})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => withdrawMutation.mutate()}
                disabled={!kycApproved || !activeBankId || !balanceSufficient || withdrawMutation.isPending}
              >
                {withdrawMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
                Withdraw funds
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Activity + banks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Wallet activity (credits like referral rewards, debits like withdrawals) */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState icon={Wallet} title="No wallet activity yet" description="Referral rewards, top-ups and withdrawals appear here." />
              ) : (
                <div className="space-y-1">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === "credit"
                    return (
                      <div key={tx.id} className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl ${isCredit ? "bg-emerald-50" : "bg-slate-100"}`}>
                            {isCredit ? (
                              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                            <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-semibold ${isCredit ? "text-emerald-700" : "text-slate-900"}`}>
                            {isCredit ? "+" : "−"}{formatNaira(tx.amount)}
                          </p>
                          <Badge
                            variant={tx.status === "completed" ? "success" : tx.status === "pending" ? "secondary" : "destructive"}
                            className="text-[10px] capitalize mt-0.5"
                          >
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bank accounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Bank accounts</CardTitle>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setAddOpen(!addOpen)}>
                <Plus className="h-3.5 w-3.5" />
                Add account
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {addOpen && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Bank</Label>
                      <select
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        className="mt-1.5 w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900"
                        disabled={bankListLoading}
                      >
                        <option value="">{bankListLoading ? "Loading banks…" : "Select your bank"}</option>
                        {allBanks.map((b, i) => (
                          <option key={`${b.code}-${i}`} value={b.code}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Account number</Label>
                      <Input
                        placeholder="10-digit NUBAN"
                        inputMode="numeric"
                        maxLength={10}
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  {bankCode && accountNumber.length === 10 && (
                    <div
                      className={`rounded-lg px-3 py-2.5 flex items-center gap-2.5 text-sm border ${
                        resolving
                          ? "bg-slate-100 border-slate-200 text-slate-600"
                          : resolvedName
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : resolveError
                          ? "bg-red-50 border-red-200 text-red-800"
                          : "bg-slate-100 border-slate-200"
                      }`}
                    >
                      {resolving ? (
                        <><Loader2 className="h-4 w-4 animate-spin shrink-0" /><span>Verifying account…</span></>
                      ) : resolvedName ? (
                        <><CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /><span className="font-medium truncate">{resolvedName}</span></>
                      ) : resolveError ? (
                        <><AlertCircle className="h-4 w-4 text-red-600 shrink-0" /><span className="text-xs">{resolveError}</span></>
                      ) : null}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={resetAddForm}>Cancel</Button>
                    <Button size="sm" onClick={() => addBankMutation.mutate()} disabled={!resolvedName || addBankMutation.isPending}>
                      {addBankMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                      Save account
                    </Button>
                  </div>
                </div>
              )}

              {banksLoading ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : banks.length === 0 ? (
                <EmptyState icon={Banknote} title="No bank accounts yet" description="Add a Nigerian bank account to receive withdrawals." />
              ) : (
                banks.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-[#1a3c5e]/10 shrink-0">
                        <Building2 className="h-4 w-4 text-[#1a3c5e]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {bank.bankName} · ****{bank.accountNumber.slice(-4)}
                          {bank.isDefault && (
                            <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                              <Star className="h-2.5 w-2.5 fill-current" /> Default
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{bank.accountName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!bank.isDefault && (
                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setDefaultMutation.mutate(bank.id)} disabled={setDefaultMutation.isPending}>
                          Set default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeBankMutation.mutate(bank.id)}
                        disabled={removeBankMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Payment history (rent, top-ups, inspections) */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No payments yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {history.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${payment.type === "rent" ? "bg-[#1a3c5e]/10" : "bg-green-50"}`}>
                          <ArrowUpRight className={`h-4 w-4 ${payment.type === "rent" ? "text-[#1a3c5e]" : "text-green-600"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 capitalize">
                            {payment.type === "rent" ? "Rent Payment" : payment.type === "wallet_topup" ? "Wallet Top-Up" : payment.type === "inspection_fee" ? "Inspection Fee" : "Payment"}
                          </p>
                          <p className="text-xs text-slate-400">{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {payment.type === "rent" && payment.status === "success" && payment.receiptUrl && (
                          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="h-7 px-2 gap-1 text-[10px]">
                              <Download className="h-3 w-3" />
                              Receipt
                            </Button>
                          </a>
                        )}
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{formatNaira(payment.amount)}</p>
                          <Badge variant={getStatusVariant(payment.status)} className="text-[10px] capitalize mt-0.5">
                            {payment.status}
                          </Badge>
                        </div>
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

export default function TenantWalletPage() {
  return (
    <Suspense>
      <WalletContent />
    </Suspense>
  )
}
