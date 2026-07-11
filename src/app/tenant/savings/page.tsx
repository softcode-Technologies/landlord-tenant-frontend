"use client"

import { useState, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { savingsApi, type SavingsGoal, type CreateGoalPayload } from "@/lib/api/savings"
import { tenanciesApi } from "@/lib/api/tenancies"
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
import { PiggyBank, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

export function SavingsRing({ percent, size = 132 }: { percent: number; size?: number }) {
  const color = percent >= 100 ? "#16a34a" : "#f97316"
  return (
    <div
      className="relative mx-auto"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${percent}%, #e2e8f0 0%)`,
        borderRadius: "50%",
      }}
    >
      <div className="absolute inset-[10px] bg-white rounded-full flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{percent}%</span>
        <span className="text-xs text-slate-500">saved</span>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: SavingsGoal["status"] }) {
  const map: Record<SavingsGoal["status"], { label: string; variant: "success" | "warning" | "secondary" | "destructive" }> = {
    active: { label: "Active", variant: "success" },
    paused: { label: "Paused", variant: "secondary" },
    completed: { label: "Completed", variant: "success" },
    cancelled: { label: "Cancelled", variant: "secondary" },
    needs_method: { label: "Action needed", variant: "warning" },
  }
  const m = map[status]
  return <Badge variant={m.variant}>{m.label}</Badge>
}

function CreateGoalDialog() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [tenancyId, setTenancyId] = useState("")
  const [monthly, setMonthly] = useState("")
  const [payDay, setPayDay] = useState("")

  const { data: tenanciesData } = useQuery({
    queryKey: ["tenant-tenancies"],
    queryFn: () => tenanciesApi.getTenantTenancies(),
  })
  // Any non-terminated ANNUAL tenancy has an upcoming yearly rent worth saving
  // toward — including one that just expired but is being renewed. Monthly
  // (shop/commercial) leases are paid as you go, so there's nothing to save up
  // for — exclude them from the vault picker.
  const tenancies = (tenanciesData?.data ?? []).filter(
    (t) => t.status !== "terminated" && t.rentCycle !== "monthly",
  )
  const selected = tenancies.find((t) => t.id === tenancyId)

  const createMutation = useMutation({
    mutationFn: (payload: CreateGoalPayload) => savingsApi.createGoal(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      const url = res.data?.paymentUrl
      if (url) {
        toast.success("Goal created — opening secure checkout to start your first save")
        window.location.href = url
      }
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? "Could not create the savings goal")
    },
  })

  const submit = () => {
    const monthlyKobo = Math.round(parseFloat(monthly) * 100)
    if (!tenancyId) return toast.error("Choose which tenancy you're saving for")
    if (!monthlyKobo || monthlyKobo <= 0) return toast.error("Enter a valid monthly amount")
    createMutation.mutate({
      tenancyId,
      monthlyAmountKobo: monthlyKobo,
      payDayOfMonth: payDay ? Math.min(parseInt(payDay), 28) : undefined,
    })
  }

  const suggested = selected ? Math.ceil((selected.rentAmount * 100) / 12) : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PiggyBank className="h-4 w-4" /> Start saving
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a Rent Vault</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Which tenancy?</Label>
            {tenancies.length === 0 ? (
              <div className="mt-1 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-700">
                You don&apos;t have a tenancy to save toward yet. Once you have an active
                tenancy it&apos;ll appear here.{" "}
                <Link href="/listings" className="font-medium underline">Browse listings</Link>
              </div>
            ) : (
              <select
                value={tenancyId}
                onChange={(e) => setTenancyId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">Select a tenancy…</option>
                {tenancies.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.property?.name ?? t.unit?.unitNumber ?? "Tenancy"} — {formatNaira(t.rentAmount * 100)}/yr
                    {t.status !== "active" ? ` (${t.status})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selected && (
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
              Annual rent <b>{formatNaira(selected.rentAmount * 100)}</b>. Saving{" "}
              <b>{formatNaira(suggested)}/month</b> covers it in 12 months.
            </div>
          )}

          <div>
            <Label htmlFor="monthly">Monthly amount (₦)</Label>
            <Input
              id="monthly"
              type="number"
              inputMode="numeric"
              placeholder={suggested ? String(Math.round(suggested / 100)) : "e.g. 100000"}
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
            />
            {suggested > 0 && (
              <button
                type="button"
                className="mt-1 text-xs text-[#f97316] font-medium"
                onClick={() => setMonthly(String(Math.round(suggested / 100)))}
              >
                Use suggested {formatNaira(suggested)}
              </button>
            )}
          </div>

          <div>
            <Label htmlFor="payday">Auto-save day of month (1–28, optional)</Label>
            <Input
              id="payday"
              type="number"
              inputMode="numeric"
              placeholder="e.g. 25 (your salary day)"
              value={payDay}
              onChange={(e) => setPayDay(e.target.value)}
            />
          </div>

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            Your first payment sets up secure auto-save. We charge the same card each
            month — and if a card ever stops working, your saved money stays safe.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to first payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SavingsContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["savings-goals"],
    queryFn: () => savingsApi.getGoals(),
  })
  const goals = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1a3c5e] to-[#1e4a72] rounded-2xl p-6 text-white flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <PiggyBank className="h-6 w-6" /> Rent Savings
          </h1>
          <p className="text-slate-300 text-sm">
            Lock money away every month so next year&apos;s rent is sorted.
          </p>
        </div>
        {goals.length > 0 && <CreateGoalDialog />}
      </div>

      {goals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-[#f97316]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Turn one big rent into twelve small ones</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Save a little each month toward your annual rent. We auto-save from your
              card, you watch the progress fill — and never scramble for rent again.
            </p>
            <div className="mt-5">
              <CreateGoalDialog />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => (
            <Link key={goal.id} href={`/tenant/savings/${goal.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{goal.name}</CardTitle>
                  <StatusBadge status={goal.status} />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-5">
                    <SavingsRing percent={goal.progressPercent} size={104} />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm">
                        <b className="text-slate-900">{formatNaira(goal.savedAmount)}</b>
                        <span className="text-slate-500"> of {formatNaira(goal.targetAmount)}</span>
                      </p>
                      {goal.targetDate && (
                        <p className="text-xs text-slate-500">Due {formatDate(goal.targetDate)}</p>
                      )}
                      {goal.status === "needs_method" ? (
                        <Badge variant="warning">Add a card or transfer</Badge>
                      ) : goal.status === "active" && goal.nextChargeDate ? (
                        <p className="text-xs text-slate-500">
                          Next: {formatNaira(goal.monthlyAmount)} on {formatDate(goal.nextChargeDate)}
                        </p>
                      ) : null}
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1a3c5e]">
                        Manage <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SavingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
      <SavingsContent />
    </Suspense>
  )
}
