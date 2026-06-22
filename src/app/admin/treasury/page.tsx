"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import type {
  TreasuryTransaction,
  TreasurySettlement,
  TreasuryTransfer,
  TreasuryCapabilities,
} from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatNaira, formatDateTime, extractApiError } from "@/lib/utils"
import {
  Landmark, Send, Wallet, ArrowDownToLine, ArrowUpRight, RefreshCw,
  Loader2, CheckCircle2, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

function statusBadge(status: string): "success" | "warning" | "destructive" | "outline" {
  const s = status.toLowerCase()
  if (["success", "completed", "paid", "settled"].includes(s)) return "success"
  if (["pending", "processing", "ongoing", "received"].includes(s)) return "warning"
  if (["failed", "reversed", "abandoned"].includes(s)) return "destructive"
  return "outline"
}

type TreasuryTab = "transactions" | "settlements" | "transfers"

const TAB_DEFS: { key: TreasuryTab; label: string; icon: typeof ArrowDownToLine; cap: keyof TreasuryCapabilities }[] = [
  { key: "transactions", label: "Transactions", icon: ArrowDownToLine, cap: "transactions" },
  { key: "settlements", label: "Settlements", icon: Landmark, cap: "settlements" },
  { key: "transfers", label: "Transfers", icon: ArrowUpRight, cap: "transfers" },
]

export default function AdminTreasuryPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<TreasuryTab>("transactions")
  const [page, setPage] = useState(1)
  const [payoutOpen, setPayoutOpen] = useState(false)

  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ["treasury-overview"],
    queryFn: () => adminApi.getTreasuryOverview(),
  })
  const overview = overviewData?.data
  const caps = overview?.capabilities
  const configured = !!overview?.configured

  // Provider label for all copy (e.g. "Paystack", "Korapay") — never hardcoded.
  const providerLabel = overview?.provider
    ? overview.provider.charAt(0).toUpperCase() + overview.provider.slice(1)
    : "Gateway"

  // Only show tabs the active gateway can actually serve, and keep the active tab
  // valid when switching gateways changes what's available.
  const availableTabs = TAB_DEFS.filter((t) => caps?.[t.cap])
  const effectiveTab: TreasuryTab =
    caps && !caps[TAB_DEFS.find((t) => t.key === tab)!.cap] && availableTabs.length > 0
      ? availableTabs[0].key
      : tab

  const txQuery = useQuery({
    queryKey: ["treasury-transactions", page],
    queryFn: () => adminApi.getTreasuryTransactions({ page }),
    enabled: effectiveTab === "transactions" && configured && !!caps?.transactions,
  })
  const settleQuery = useQuery({
    queryKey: ["treasury-settlements", page],
    queryFn: () => adminApi.getTreasurySettlements({ page }),
    enabled: effectiveTab === "settlements" && configured && !!caps?.settlements,
  })
  const transferQuery = useQuery({
    queryKey: ["treasury-transfers", page],
    queryFn: () => adminApi.getTreasuryTransfers({ page }),
    enabled: effectiveTab === "transfers" && configured && !!caps?.transfers,
  })

  const activeQuery =
    effectiveTab === "transactions" ? txQuery : effectiveTab === "settlements" ? settleQuery : transferQuery
  const meta = activeQuery.data?.data?.meta

  const ngnBalance = overview?.balance?.find((b) => b.currency === "NGN")

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["treasury-overview"] })
    queryClient.invalidateQueries({ queryKey: ["treasury-transactions"] })
    queryClient.invalidateQueries({ queryKey: ["treasury-settlements"] })
    queryClient.invalidateQueries({ queryKey: ["treasury-transfers"] })
  }

  const switchTab = (v: string) => { setTab(v as TreasuryTab); setPage(1) }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-[#1a3c5e]" />
            Treasury
          </h1>
          <p className="text-slate-500 mt-1">Your live {providerLabel} money — balance, transactions, settlements &amp; payouts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button
            size="sm"
            className="gap-1 bg-[#1a3c5e] hover:bg-[#0f2d48]"
            onClick={() => setPayoutOpen(true)}
            disabled={!configured || !caps?.manualPayout}
          >
            <Send className="h-4 w-4" /> Send payout
          </Button>
        </div>
      </div>

      {!overviewLoading && overview && !configured && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4" />
          {overview.configHint}
        </div>
      )}

      {overview?.testMode && (
        <div className="flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3 text-sm text-purple-700">
          <AlertCircle className="h-4 w-4" />
          Test mode — these are {providerLabel} test figures, not real money.
        </div>
      )}

      {/* Balance hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1 bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <Wallet className="h-4 w-4" /> Available Balance
            </div>
            {overviewLoading ? (
              <Skeleton className="h-9 w-40 mt-3 bg-white/20" />
            ) : (
              <p className="text-3xl font-bold mt-2">
                {ngnBalance ? formatNaira(ngnBalance.balanceKobo) : "₦0"}
              </p>
            )}
            <p className="text-xs text-white/60 mt-1">
              {ngnBalance?.pendingKobo
                ? `${formatNaira(ngnBalance.pendingKobo)} pending · settled in your ${providerLabel} account`
                : `Settled funds in your ${providerLabel} account`}
            </p>
          </CardContent>
        </Card>

        {/* Other-currency balances if any */}
        {(overview?.balance ?? []).filter((b) => b.currency !== "NGN").map((b) => (
          <Card key={b.currency}>
            <CardContent className="p-5">
              <p className="text-xs text-slate-500">{b.currency} Balance</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {(b.balanceKobo / 100).toLocaleString()} {b.currency}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs — only the ones this gateway supports */}
      {availableTabs.length > 0 && (
        <Tabs value={effectiveTab} onValueChange={switchTab}>
          <TabsList className="bg-slate-100">
            {availableTabs.map((t) => (
              <TabsTrigger key={t.key} value={t.key} className="gap-1">
                <t.icon className="h-3.5 w-3.5" />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      <Card>
        <CardContent className="p-0">
          {!configured && !overviewLoading ? (
            <div className="p-8">
              <EmptyState icon={Landmark} title={`${providerLabel} not connected`} description={overview?.configHint ?? "Configure your payment gateway to view treasury data."} />
            </div>
          ) : activeQuery.isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : activeQuery.isError ? (
            <div className="p-8">
              <EmptyState icon={AlertCircle} title={`Couldn't load from ${providerLabel}`} description={extractApiError(activeQuery.error, "Try refreshing.")} />
            </div>
          ) : (
            <>
              {effectiveTab === "transactions" && <TransactionsTable rows={txQuery.data?.data?.data ?? []} />}
              {effectiveTab === "settlements" && <SettlementsTable rows={settleQuery.data?.data?.data ?? []} />}
              {effectiveTab === "transfers" && <TransfersTable rows={transferQuery.data?.data?.data ?? []} />}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {meta && meta.pageCount > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</Button>
          <span className="flex items-center text-sm text-slate-600 px-2">{page} of {meta.pageCount}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= meta.pageCount}>Next</Button>
        </div>
      )}

      <PayoutDialog
        open={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        balanceKobo={ngnBalance?.balanceKobo ?? 0}
        providerLabel={providerLabel}
        onDone={refreshAll}
      />
    </div>
  )
}

function TransactionsTable({ rows }: { rows: TreasuryTransaction[] }) {
  if (rows.length === 0) return <Empty label="No transactions" />
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead>Detail</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Channel</TableHead>
          <TableHead>Reference</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((t) => (
          <TableRow key={t.id}>
            <TableCell className="text-sm text-slate-700">{t.label}</TableCell>
            <TableCell className={`font-semibold text-sm ${t.direction === "debit" ? "text-red-600" : "text-[#1a3c5e]"}`}>
              {t.direction === "debit" ? "−" : ""}{formatNaira(t.amountKobo)}
            </TableCell>
            <TableCell className="text-xs text-slate-500 capitalize">{t.channel ?? "—"}</TableCell>
            <TableCell className="text-xs text-slate-400 font-mono">{t.reference ? `${t.reference.slice(0, 18)}…` : "—"}</TableCell>
            <TableCell className="text-sm text-slate-500">{t.date ? formatDateTime(t.date) : "—"}</TableCell>
            <TableCell><Badge variant={statusBadge(t.status)} className="capitalize text-xs">{t.status}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function SettlementsTable({ rows }: { rows: TreasurySettlement[] }) {
  if (rows.length === 0) return <Empty label="No settlements" />
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead>Settlement</TableHead>
          <TableHead>Net Amount</TableHead>
          <TableHead>Fees</TableHead>
          <TableHead>Settlement Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="text-xs text-slate-400 font-mono">#{s.id}</TableCell>
            <TableCell className="font-semibold text-[#1a3c5e] text-sm">{formatNaira(s.netKobo)}</TableCell>
            <TableCell className="text-sm text-slate-500">{s.feesKobo != null ? formatNaira(s.feesKobo) : "—"}</TableCell>
            <TableCell className="text-sm text-slate-500">{s.date ? formatDateTime(s.date) : "—"}</TableCell>
            <TableCell><Badge variant={statusBadge(s.status)} className="capitalize text-xs">{s.status}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function TransfersTable({ rows }: { rows: TreasuryTransfer[] }) {
  if (rows.length === 0) return <Empty label="No transfers" />
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50">
          <TableHead>Recipient</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((t) => (
          <TableRow key={t.id}>
            <TableCell>
              <p className="text-sm font-medium text-slate-900">{t.recipientName}</p>
              {t.recipientDetail && <p className="text-xs text-slate-400">{t.recipientDetail}</p>}
            </TableCell>
            <TableCell className="font-semibold text-[#1a3c5e] text-sm">{formatNaira(t.amountKobo)}</TableCell>
            <TableCell className="text-sm text-slate-500">{t.reason ?? "—"}</TableCell>
            <TableCell className="text-sm text-slate-500">{t.date ? formatDateTime(t.date) : "—"}</TableCell>
            <TableCell><Badge variant={statusBadge(t.status)} className="capitalize text-xs">{t.status}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function Empty({ label }: { label: string }) {
  return <div className="p-8"><EmptyState icon={Wallet} title={label} description="Nothing here yet." /></div>
}

function PayoutDialog({
  open, onClose, balanceKobo, providerLabel, onDone,
}: { open: boolean; onClose: () => void; balanceKobo: number; providerLabel: string; onDone: () => void }) {
  const [bankCode, setBankCode] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")

  const { data: banksData } = useQuery({
    queryKey: ["treasury-banks"],
    queryFn: () => adminApi.getTreasuryBanks(),
    enabled: open,
    staleTime: 1000 * 60 * 60,
  })
  // Dedupe by code so Select values/keys stay unique.
  const banks = Array.from(
    new Map((banksData?.data ?? []).map((b) => [b.code, b])).values()
  )

  const resolveMutation = useMutation({
    mutationFn: () => adminApi.resolveTreasuryAccount(accountNumber, bankCode),
    onSuccess: (res) => setAccountName(res.data.accountName),
    onError: (err: unknown) => { setAccountName(""); toast.error(extractApiError(err, "Could not resolve account")) },
  })

  const transferMutation = useMutation({
    mutationFn: () => adminApi.treasuryTransfer({
      accountNumber,
      bankCode,
      accountName,
      amountKobo: Math.round(parseFloat(amount) * 100),
      reason: reason.trim() || undefined,
    }),
    onSuccess: () => {
      toast.success("Payout initiated successfully")
      reset()
      onDone()
      onClose()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Transfer failed")),
  })

  const reset = () => {
    setBankCode(""); setAccountNumber(""); setAccountName(""); setAmount(""); setReason("")
  }

  const amountKobo = Math.round((parseFloat(amount) || 0) * 100)
  const insufficient = amountKobo > balanceKobo
  const canResolve = accountNumber.length >= 10 && !!bankCode
  const canSend = !!accountName && amountKobo > 0 && !insufficient

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose() } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Send className="h-4 w-4" />Send Payout</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Available balance: <span className="font-semibold text-slate-700">{formatNaira(balanceKobo)}</span>
            <span className="text-slate-400"> · via {providerLabel}</span>
          </div>

          <div className="space-y-2">
            <Label>Bank</Label>
            <Select value={bankCode} onValueChange={(v) => { setBankCode(v); setAccountName("") }}>
              <SelectTrigger><SelectValue placeholder="Select bank" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {banks.map((b) => (
                  <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acct">Account Number</Label>
            <div className="flex gap-2">
              <Input
                id="acct"
                inputMode="numeric"
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "")); setAccountName("") }}
                maxLength={10}
              />
              <Button
                type="button"
                variant="outline"
                disabled={!canResolve || resolveMutation.isPending}
                onClick={() => resolveMutation.mutate()}
              >
                {resolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
              </Button>
            </div>
            {accountName && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />{accountName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amt">Amount (₦)</Label>
            <Input
              id="amt"
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {insufficient && <p className="text-xs text-red-500">Amount exceeds available balance.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" placeholder="e.g. Rent payout to landlord" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { reset(); onClose() }}>Cancel</Button>
          <Button
            className="bg-[#1a3c5e] hover:bg-[#0f2d48] gap-1"
            disabled={!canSend || transferMutation.isPending}
            onClick={() => transferMutation.mutate()}
          >
            {transferMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Send {amountKobo > 0 ? formatNaira(amountKobo) : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
