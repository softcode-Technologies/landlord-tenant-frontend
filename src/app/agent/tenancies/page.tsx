"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { tenanciesApi, type ManagedTenancy } from "@/lib/api/tenancies"
import { rentRecordsApi, METHOD_LABEL, type OfflineRentMethod } from "@/lib/api/rent-records"
import { OfflineRentHistory } from "@/components/rent/offline-rent-history"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { extractApiError, formatDate, formatNairaAmount } from "@/lib/utils"
import { Home, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

type Action = "renew" | "rent" | "end"
type Dialogs = Action | "pay" | "history"

/**
 * Tenancies the agent runs — through a property assignment or a landlord's
 * authority. Each row only offers what the agent is allowed to do on it.
 */
export default function AgentTenanciesPage() {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const [search, setSearch] = useState("")
  const [action, setAction] = useState<{ kind: Dialogs; tenancy: ManagedTenancy } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["agent-tenancies"],
    queryFn: () => tenanciesApi.getManagedTenancies(),
    enabled,
  })
  const tenancies = data?.data ?? []
  const q = search.trim().toLowerCase()
  const shown = q
    ? tenancies.filter((t) =>
        [t.tenant?.firstName, t.tenant?.lastName, t.landlord?.firstName, t.landlord?.lastName, t.property?.name, t.unit?.unitNumber]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      )
    : tenancies

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return <EmptyState icon={Home} title="Not available yet" description="Managing tenancies is coming soon to your account." />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenancies</h1>
          <p className="text-slate-500 mt-1">Tenancies you manage for your landlords.</p>
        </div>
        {tenancies.length > 0 && (
          <div className="relative sm:w-64">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search" className="pl-9" />
          </div>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : tenancies.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No tenancies yet"
          description="Tenancies show here once a landlord gives you authority, or assigns you to a property with tenants."
          actionLabel="Landlord authority"
          actionHref="/agent/mandates"
        />
      ) : (
        <div className="space-y-3">
          {shown.map((t) => (
            <TenancyRow key={t.id} tenancy={t} onAction={(kind) => setAction({ kind, tenancy: t })} />
          ))}
          {shown.length === 0 && <p className="text-sm text-slate-500">No tenancy matches &ldquo;{search}&rdquo;.</p>}
        </div>
      )}

      {action?.kind === "pay" && <RecordPaymentDialog tenancy={action.tenancy} onClose={() => setAction(null)} />}
      {action?.kind === "history" && (
        <Dialog open onOpenChange={(o) => !o && setAction(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Cash and transfer payments</DialogTitle>
              <DialogDescription>Rent paid outside Krib on this tenancy.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <OfflineRentHistory tenancyId={action.tenancy.id} viewer="agent" />
            </div>
          </DialogContent>
        </Dialog>
      )}
      {action && action.kind !== "pay" && action.kind !== "history" && (
        <ActionDialog action={action.kind} tenancy={action.tenancy} onClose={() => setAction(null)} />
      )}
    </div>
  )
}

function personName(u?: { firstName?: string | null; lastName?: string | null } | null): string {
  return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "—"
}

function TenancyRow({ tenancy: t, onAction }: { tenancy: ManagedTenancy; onAction: (a: Dialogs) => void }) {
  const active = t.status === "active"
  const canRenew = t.access.renewTenancies && (t.status === "active" || t.status === "expired")
  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{personName(t.tenant)}</h3>
              <Badge variant={active ? "default" : "outline"} className="capitalize">{t.status}</Badge>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {t.property?.name ?? "Property"}
              {t.unit?.unitNumber ? ` · Unit ${t.unit.unitNumber}` : ""} · Landlord: {personName(t.landlord)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {formatNairaAmount(t.rentAmount)} / {t.rentCycle === "monthly" ? "month" : "year"} · Ends {formatDate(t.endDate)}
              {t.nextDueDate ? ` · Next due ${formatDate(t.nextDueDate)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {t.access.manageMaintenance && (
            <Button asChild size="sm" variant="outline">
              <Link href="/agent/maintenance">Repairs</Link>
            </Button>
          )}
          {t.access.recordPayments && (t.status === "active" || t.status === "expired") && (
            <Button size="sm" onClick={() => onAction("pay")}>Record payment</Button>
          )}
          {t.access.manageTenancies && (
            <Button size="sm" variant="outline" onClick={() => onAction("history")}>Payments</Button>
          )}
          {canRenew && <Button size="sm" variant="outline" onClick={() => onAction("renew")}>Renew</Button>}
          {t.access.changeRent && active && (
            <Button size="sm" variant="outline" onClick={() => onAction("rent")}>Change rent</Button>
          )}
          {t.access.endTenancies && active && (
            <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => onAction("end")}>
              End tenancy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ActionDialog({ action, tenancy: t, onClose }: { action: Action; tenancy: ManagedTenancy; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [endDate, setEndDate] = useState("")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const tenant = personName(t.tenant)

  const run = useMutation({
    mutationFn: () => {
      if (action === "renew") {
        return tenanciesApi.renewTenancy(t.id, {
          newEndDate: endDate,
          ...(amount.trim() ? { newRentAmount: Number(amount) } : {}),
        })
      }
      if (action === "rent") {
        return tenanciesApi.updateRent(t.id, { newRentAmount: Number(amount), ...(reason.trim() ? { reason: reason.trim() } : {}) })
      }
      return tenanciesApi.terminateTenancy(t.id)
    },
    onSuccess: () => {
      toast.success(action === "renew" ? "Tenancy renewed" : action === "rent" ? "Rent updated" : "Tenancy ended")
      queryClient.invalidateQueries({ queryKey: ["agent-tenancies"] })
      onClose()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not save that")),
  })

  const amountNum = Number(amount)
  const amountOk = amount.trim() === "" ? action === "renew" : Number.isInteger(amountNum) && amountNum > 0
  const valid =
    action === "renew" ? endDate > t.endDate && amountOk : action === "rent" ? amountOk && amountNum !== t.rentAmount : true

  const title = action === "renew" ? `Renew ${tenant}'s tenancy` : action === "rent" ? `Change ${tenant}'s rent` : `End ${tenant}'s tenancy?`

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {action === "end"
              ? "The tenancy will be marked as ended. The landlord sees this in their activity."
              : "The tenant is told, and the landlord sees this in their activity."}
          </DialogDescription>
        </DialogHeader>

        {action === "renew" && (
          <div className="space-y-4">
            <div>
              <Label>New end date</Label>
              <Input type="date" min={t.endDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1.5" />
              <p className="text-xs text-slate-400 mt-1">Currently ends {formatDate(t.endDate)}.</p>
            </div>
            <div>
              <Label>New rent (₦) <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(t.rentAmount)} className="mt-1.5" />
            </div>
          </div>
        )}

        {action === "rent" && (
          <div className="space-y-4">
            <div>
              <Label>New rent (₦ per {t.rentCycle === "monthly" ? "month" : "year"})</Label>
              <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" />
              <p className="text-xs text-slate-400 mt-1">Currently {formatNairaAmount(t.rentAmount)}.</p>
            </div>
            <div>
              <Label>Reason <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={1000} className="mt-1.5" />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant={action === "end" ? "destructive" : "default"}
            disabled={!valid || run.isPending}
            onClick={() => run.mutate()}
            className="gap-2"
          >
            {run.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {action === "renew" ? "Renew" : action === "rent" ? "Save rent" : "End tenancy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RecordPaymentDialog({ tenancy: t, onClose }: { tenancy: ManagedTenancy; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [today] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }))
  const [amount, setAmount] = useState(String(t.rentAmount))
  const [method, setMethod] = useState<OfflineRentMethod>("cash")
  const [receivedBy, setReceivedBy] = useState<"agent" | "landlord">("agent")
  const [paidOn, setPaidOn] = useState(today)
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")

  const amountNum = Number(amount)
  const amountOk = Number.isInteger(amountNum) && amountNum > 0 && amountNum <= 20_000_000
  const isPart = amountOk && amountNum < t.rentAmount

  const save = useMutation({
    mutationFn: () =>
      rentRecordsApi.record({
        tenancyId: t.id,
        amount: amountNum,
        method,
        receivedBy,
        paidOn,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: (res) => {
      toast.success(
        res.data?.advancedLease
          ? `Recorded. Paid up to ${formatDate(res.data.newEndDate)}.`
          : "Part payment recorded",
      )
      queryClient.invalidateQueries({ queryKey: ["agent-tenancies"] })
      queryClient.invalidateQueries({ queryKey: ["offline-rent", t.id] })
      onClose()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not record the payment")),
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            Rent {personName(t.tenant)} paid outside Krib. The tenant gets a receipt, and the landlord gets an SMS.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Amount (₦)</Label>
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" />
            {isPart && (
              <p className="text-xs text-amber-600 mt-1">
                Less than the full rent ({formatNairaAmount(t.rentAmount)}). It is recorded as a part payment, and the lease dates don&apos;t move.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>How it was paid</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as OfflineRentMethod)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(METHOD_LABEL) as OfflineRentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Paid on</Label>
              <Input type="date" max={today} value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Who has the money now?</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {(["agent", "landlord"] as const).map((who) => (
                <button
                  key={who}
                  type="button"
                  onClick={() => setReceivedBy(who)}
                  className={`rounded-xl border p-2.5 text-sm transition-colors ${receivedBy === who ? "border-[#005AF1] bg-blue-50 text-slate-900" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >
                  {who === "agent" ? "I have it" : "Paid to the landlord"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Reference <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} placeholder="Bank or POS reference" className="mt-1.5" />
          </div>
          <div>
            <Label>Note <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!amountOk || !paidOn || paidOn > today || save.isPending} onClick={() => save.mutate()} className="gap-2">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
