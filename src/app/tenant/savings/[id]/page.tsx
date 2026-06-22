"use client"

import { useState, useEffect, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { savingsApi, type SavingsContribution } from "@/lib/api/savings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog"
import { formatNaira, formatDate } from "@/lib/utils"
import { SavingsRing } from "../page"
import {
  ArrowLeft, CreditCard, Building2, Plus, Pause, Play, Loader2, Banknote,
  AlertTriangle, Copy, Trash2, Star, CheckCircle2, Home,
} from "lucide-react"
import { toast } from "sonner"

function errMsg(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
}

function SavingsDetailContent() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()

  const [topupAmount, setTopupAmount] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [topupOpen, setTopupOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)

  useEffect(() => {
    if (searchParams.get("saved") === "true") {
      toast.success("Payment received — your savings are updated")
      router.replace(`/tenant/savings/${id}`)
    }
  }, [searchParams, id, router])

  const { data, isLoading } = useQuery({
    queryKey: ["savings-goal", id],
    queryFn: () => savingsApi.getGoal(id),
  })
  const { data: methodsData } = useQuery({
    queryKey: ["savings-methods"],
    queryFn: () => savingsApi.listMethods(),
  })

  const goal = data?.data
  const methods = methodsData?.data ?? []
  const contributions = goal?.contributions ?? []

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["savings-goal", id] })
    queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
    queryClient.invalidateQueries({ queryKey: ["savings-methods"] })
  }

  const goToCheckout = (res: { data?: { paymentUrl?: string } }) => {
    const url = res.data?.paymentUrl
    if (url) window.location.href = url
  }

  const topupMutation = useMutation({
    mutationFn: (kobo: number) => savingsApi.topup(id, kobo),
    onSuccess: goToCheckout,
    onError: (e) => toast.error(errMsg(e, "Top-up failed")),
  })
  const addCardMutation = useMutation({
    mutationFn: () => savingsApi.addCard(id),
    onSuccess: goToCheckout,
    onError: (e) => toast.error(errMsg(e, "Could not start add-card")),
  })
  const withdrawMutation = useMutation({
    mutationFn: (kobo: number) => savingsApi.withdraw(id, kobo),
    onSuccess: () => { toast.success("Moved to your wallet"); setWithdrawOpen(false); setWithdrawAmount(""); invalidate() },
    onError: (e) => toast.error(errMsg(e, "Withdrawal failed")),
  })
  const pauseMutation = useMutation({
    mutationFn: () => savingsApi.pause(id),
    onSuccess: () => { toast.success("Auto-save paused"); invalidate() },
    onError: (e) => toast.error(errMsg(e, "Could not pause")),
  })
  const resumeMutation = useMutation({
    mutationFn: () => savingsApi.resume(id),
    onSuccess: () => { toast.success("Auto-save resumed"); invalidate() },
    onError: (e) => toast.error(errMsg(e, "Could not resume")),
  })
  const payRentMutation = useMutation({
    mutationFn: () => savingsApi.payRent(id),
    onSuccess: (res) => {
      const shortfall = res.data?.shortfallKobo ?? 0
      toast.success(shortfall > 0 ? `Applied to rent — ${formatNaira(shortfall)} left to pay` : "Your rent is fully paid from savings 🎉")
      invalidate()
    },
    onError: (e) => toast.error(errMsg(e, "Could not apply savings to rent")),
  })
  const cancelMutation = useMutation({
    mutationFn: () => savingsApi.cancel(id),
    onSuccess: (res) => {
      const refunded = res.data?.refundedToWallet ?? 0
      toast.success(refunded > 0 ? `Cancelled — ${formatNaira(refunded)} returned to your wallet` : "Goal cancelled")
      router.push("/tenant/savings")
    },
    onError: (e) => toast.error(errMsg(e, "Could not cancel")),
  })
  const setPrimaryMutation = useMutation({
    mutationFn: (mid: string) => savingsApi.setPrimaryMethod(mid),
    onSuccess: () => { toast.success("Primary card updated"); invalidate() },
    onError: (e) => toast.error(errMsg(e, "Could not update")),
  })
  const removeMethodMutation = useMutation({
    mutationFn: (mid: string) => savingsApi.removeMethod(mid),
    onSuccess: () => { toast.success("Card removed"); invalidate() },
    onError: (e) => toast.error(errMsg(e, "Could not remove")),
  })
  const dvaMutation = useMutation({
    mutationFn: () => savingsApi.getDedicatedAccount(id),
    onSuccess: () => { toast.success("Transfer account ready"); invalidate() },
    onError: (e) => toast.error(errMsg(e, "Bank-transfer funding isn't available yet")),
  })

  if (isLoading) return <Skeleton className="h-96 w-full rounded-2xl" />
  if (!goal) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Savings goal not found.</p>
        <Link href="/tenant/savings"><Button variant="outline" className="mt-4">Back to savings</Button></Link>
      </div>
    )
  }

  const dva = methods.find((m) => m.kind === "dva")
  const cards = methods.filter((m) => m.kind === "card")

  return (
    <div className="space-y-6">
      <Link href="/tenant/savings" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Back to savings
      </Link>

      {/* needs_method banner — the card-failure answer, front and centre */}
      {goal.status === "needs_method" && (
        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900 text-sm">Your card stopped working — your money is safe</p>
            <p className="text-xs text-amber-700 mt-0.5">
              We couldn&apos;t auto-charge your card, so auto-save is paused. Your{" "}
              <b>{formatNaira(goal.savedAmount)}</b> is untouched. Add a new card or fund by
              transfer to keep going.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button size="sm" onClick={() => addCardMutation.mutate()} disabled={addCardMutation.isPending}>
                {addCardMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                Add a card
              </Button>
              {!dva && (
                <Button size="sm" variant="outline" onClick={() => dvaMutation.mutate()} disabled={dvaMutation.isPending}>
                  {dvaMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Building2 className="h-3.5 w-3.5" />}
                  Fund by transfer
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <Card>
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <SavingsRing percent={goal.progressPercent} />
            <div className="flex-1 w-full space-y-3 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl font-bold text-slate-900">{goal.name}</h1>
                {goal.onTrack ? (
                  <Badge variant="success">On track 🎯</Badge>
                ) : (
                  <Badge variant="warning">Save {formatNaira(goal.suggestedMonthly)}/mo</Badge>
                )}
              </div>
              <p className="text-slate-600">
                <span className="text-2xl font-bold text-slate-900">{formatNaira(goal.savedAmount)}</span>
                <span className="text-slate-500"> of {formatNaira(goal.targetAmount)}</span>
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-x-6 gap-y-1 text-sm text-slate-500">
                {goal.targetDate && <span>Rent due <b className="text-slate-700">{formatDate(goal.targetDate)}</b></span>}
                {goal.status === "active" && goal.nextChargeDate && (
                  <span>Next auto-save <b className="text-slate-700">{formatNaira(goal.monthlyAmount)} on {formatDate(goal.nextChargeDate)}</b></span>
                )}
                {goal.activeMethod?.kind === "card" && (
                  <span>{goal.activeMethod.display.cardType ?? "Card"} •••• {goal.activeMethod.display.last4}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-3.5 w-3.5" /> Top up</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add to your vault</DialogTitle></DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="topup">Amount (₦)</Label>
                      <Input id="topup" type="number" inputMode="numeric" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} placeholder="e.g. 50000" />
                    </div>
                    <DialogFooter>
                      <Button
                        className="w-full"
                        disabled={topupMutation.isPending}
                        onClick={() => {
                          const kobo = Math.round(parseFloat(topupAmount) * 100)
                          if (!kobo || kobo <= 0) return toast.error("Enter a valid amount")
                          topupMutation.mutate(kobo)
                        }}
                      >
                        {topupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to payment"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {goal.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
                    <Pause className="h-3.5 w-3.5" /> Pause
                  </Button>
                )}
                {goal.status === "paused" && (
                  <Button size="sm" variant="outline" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending}>
                    <Play className="h-3.5 w-3.5" /> Resume
                  </Button>
                )}

                {goal.savedAmount > 0 && goal.tenancyId && goal.status !== "completed" && (
                  <Button size="sm" variant="outline" onClick={() => payRentMutation.mutate()} disabled={payRentMutation.isPending}>
                    {payRentMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Home className="h-3.5 w-3.5" />}
                    Pay rent from savings
                  </Button>
                )}

                {goal.savedAmount > 0 && (
                  <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline"><Banknote className="h-3.5 w-3.5" /> Withdraw</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Withdraw to wallet</DialogTitle></DialogHeader>
                      <p className="text-sm text-slate-500">This moves money out of your locked vault and sets your goal back. Available: {formatNaira(goal.savedAmount)}.</p>
                      <div className="space-y-2 mt-2">
                        <Label htmlFor="wd">Amount (₦)</Label>
                        <Input id="wd" type="number" inputMode="numeric" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <Button
                          className="w-full"
                          disabled={withdrawMutation.isPending}
                          onClick={() => {
                            const kobo = Math.round(parseFloat(withdrawAmount) * 100)
                            if (!kobo || kobo <= 0) return toast.error("Enter a valid amount")
                            withdrawMutation.mutate(kobo)
                          }}
                        >
                          {withdrawMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Withdraw"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Funding methods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Funding methods</CardTitle>
          <Button size="sm" variant="ghost" onClick={() => addCardMutation.mutate()} disabled={addCardMutation.isPending}>
            <Plus className="h-3.5 w-3.5" /> Add card
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {cards.length === 0 && !dva && (
            <p className="text-sm text-slate-500">No saved cards yet. Your first payment adds one automatically.</p>
          )}
          {cards.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
              <CreditCard className="h-4 w-4 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <span>{m.display.cardType ?? "Card"} •••• {m.display.last4}</span>
                  {m.priority === 1 && <Badge variant="secondary">Primary</Badge>}
                  {m.status !== "active" && <Badge variant="warning">{m.status}</Badge>}
                </div>
                <p className="text-xs text-slate-500">Expires {m.display.expMonth}/{m.display.expYear}</p>
              </div>
              {m.status === "active" && m.priority !== 1 && (
                <button className="text-slate-400 hover:text-[#f97316]" title="Make primary" onClick={() => setPrimaryMutation.mutate(m.id)}>
                  <Star className="h-4 w-4" />
                </button>
              )}
              <button className="text-slate-400 hover:text-red-600" title="Remove" onClick={() => removeMethodMutation.mutate(m.id)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {dva && (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
              <Building2 className="h-4 w-4 text-slate-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900">Transfer to {dva.display.bankName}</p>
                <p className="text-xs text-slate-500">{dva.display.accountNumber} · {dva.display.accountName}</p>
              </div>
              <button
                className="text-slate-400 hover:text-[#1a3c5e]"
                title="Copy account number"
                onClick={() => { if (dva.display.accountNumber) { navigator.clipboard.writeText(dva.display.accountNumber); toast.success("Account number copied") } }}
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ledger */}
      <Card>
        <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
        <CardContent>
          {contributions.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <div className="space-y-2">
              {contributions.map((c: SavingsContribution) => {
                const out = c.type !== "contribution"
                return (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${out ? "bg-slate-100" : "bg-green-50"}`}>
                        {out ? <Banknote className="h-3.5 w-3.5 text-slate-500" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 capitalize">
                          {c.type === "rent_settlement" ? "Applied to rent" : c.type === "withdrawal" ? "Withdrawal" : c.source === "auto" ? "Auto-save" : "Top-up"}
                        </p>
                        <p className="text-xs text-slate-400">{formatDate(c.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${out ? "text-slate-600" : "text-green-600"}`}>
                        {out ? "−" : "+"}{formatNaira(c.amount)}
                      </p>
                      {c.status !== "success" && <Badge variant={c.status === "failed" ? "destructive" : "secondary"}>{c.status}</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      {goal.status !== "cancelled" && goal.status !== "completed" && (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => { if (confirm("Cancel this goal? Any saved money returns to your wallet.")) cancelMutation.mutate() }}
            disabled={cancelMutation.isPending}
          >
            Cancel goal
          </Button>
        </div>
      )}
    </div>
  )
}

export default function SavingsDetailPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
      <SavingsDetailContent />
    </Suspense>
  )
}
