"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { paymentsApi } from "@/lib/api/payments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatNaira, formatDate } from "@/lib/utils"
import {
  Wallet, ArrowDownLeft, ArrowUpRight, Loader2, Plus, Building2,
  Star, Trash2, Banknote, ShieldAlert, CheckCircle2, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useAuthStore } from "@/lib/store/auth"
import { EscrowPanel } from "@/components/shared/escrow-panel"

export default function LandlordWalletPage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const kycApproved = user?.kycStatus === "approved"

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [selectedBankId, setSelectedBankId] = useState<string>("")

  const [addOpen, setAddOpen] = useState(false)
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [resolvedName, setResolvedName] = useState<string | null>(null)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [resolving, setResolving] = useState(false)

  const { data: bankListData, isLoading: bankListLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: () => paymentsApi.listBanks(),
    staleTime: 24 * 60 * 60 * 1000,
    enabled: addOpen,
  })
  const allBanks = bankListData?.data ?? []
  const selectedBank = allBanks.find((b) => b.code === bankCode)

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => paymentsApi.getWallet(),
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => paymentsApi.getWalletTransactions(),
  })

  const { data: banksData, isLoading: banksLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => paymentsApi.getBankAccounts(),
  })

  const banks = banksData?.data ?? []
  const transactions = txData?.data ?? []
  const balance = walletData?.data?.balance ?? 0

  // The destination dropdown shows the default bank without firing onChange, so
  // fall back to it when the user hasn't explicitly picked one — otherwise the
  // withdraw submits an empty bankAccountId and fails validation.
  const defaultBank = banks.find((b) => b.isDefault) ?? banks[0]
  const activeBankId = selectedBankId || defaultBank?.id || ""

  const withdrawMutation = useMutation({
    mutationFn: () =>
      paymentsApi.withdraw({
        amountKobo: parseInt(withdrawAmount) * 100,
        bankAccountId: activeBankId,
      }),
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

  // Auto-resolve account name once both bank and a 10-digit account number are entered.
  // Debounced so we don't hammer the provider while the user is typing.
  useEffect(() => {
    setResolvedName(null)
    setResolveError(null)
    if (!bankCode || accountNumber.length !== 10) return

    let cancelled = false
    const timer = setTimeout(async () => {
      setResolving(true)
      try {
        const res = await paymentsApi.resolveBankAccount({ accountNumber, bankCode })
        if (cancelled) return
        setResolvedName(res.data.accountName)
      } catch (err: unknown) {
        if (cancelled) return
        const e = err as { response?: { data?: { error?: { message?: string }; message?: string } } }
        setResolveError(
          e.response?.data?.error?.message ??
            e.response?.data?.message ??
            "Could not verify this account.",
        )
      } finally {
        if (!cancelled) setResolving(false)
      }
    }, 400)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
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
        <p className="text-slate-500 mt-1">Rent inflows, withdrawals, and bank accounts</p>
      </div>

      {!kycApproved && (
        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">Verification required to withdraw</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Withdrawals are gated on identity verification. Complete KYC to enable payouts.
              </p>
            </div>
          </div>
          <Link
            href="/landlord/kyc"
            className="self-start sm:self-auto shrink-0 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Verify →
          </Link>
        </div>
      )}

      <EscrowPanel side="landlord" showHistory={false} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance + Withdraw */}
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
              <p className="text-xs text-slate-300 mt-3">
                Rent payments land here automatically, net of platform commission.
              </p>
            </CardContent>
          </Card>

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
                  <p className="text-xs text-red-600 mt-1.5">Amount exceeds available balance</p>
                )}
              </div>

              <div>
                <Label>Destination account</Label>
                {banksLoading ? (
                  <Skeleton className="h-10 w-full mt-1.5" />
                ) : banks.length === 0 ? (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Add a bank account below to enable withdrawals.
                  </p>
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
                disabled={
                  !kycApproved ||
                  !activeBankId ||
                  !balanceSufficient ||
                  withdrawMutation.isPending
                }
              >
                {withdrawMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" />
                )}
                Withdraw funds
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transaction history</CardTitle>
            </CardHeader>
            <CardContent>
              {txLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-14 rounded-xl" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No transactions yet"
                  description="Rent payments and withdrawals will appear here."
                />
              ) : (
                <div className="space-y-1">
                  {transactions.map((tx) => {
                    const isCredit = tx.type === "credit"
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between px-3 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl ${
                              isCredit ? "bg-emerald-50" : "bg-slate-100"
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {tx.description}
                            </p>
                            <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`font-semibold ${
                              isCredit ? "text-emerald-700" : "text-slate-900"
                            }`}
                          >
                            {isCredit ? "+" : "−"}
                            {formatNaira(tx.amount)}
                          </p>
                          <Badge
                            variant={
                              tx.status === "completed"
                                ? "success"
                                : tx.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
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
                        <option value="">
                          {bankListLoading ? "Loading banks…" : "Select your bank"}
                        </option>
                        {allBanks.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name}
                          </option>
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

                  {/* Verification panel */}
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
                        <>
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                          <span>Verifying account…</span>
                        </>
                      ) : resolvedName ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-medium truncate">{resolvedName}</span>
                        </>
                      ) : resolveError ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                          <span className="text-xs">{resolveError}</span>
                        </>
                      ) : null}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={resetAddForm}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addBankMutation.mutate()}
                      disabled={!resolvedName || addBankMutation.isPending}
                    >
                      {addBankMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                      Save account
                    </Button>
                  </div>
                </div>
              )}

              {banksLoading ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : banks.length === 0 ? (
                <EmptyState
                  icon={Banknote}
                  title="No bank accounts yet"
                  description="Add a Nigerian bank account to receive withdrawals."
                />
              ) : (
                banks.map((bank) => (
                  <div
                    key={bank.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                  >
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs"
                          onClick={() => setDefaultMutation.mutate(bank.id)}
                          disabled={setDefaultMutation.isPending}
                        >
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
        </div>
      </div>
    </div>
  )
}
