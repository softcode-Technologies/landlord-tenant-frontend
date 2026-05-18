"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { escrowApi, type RentEscrow } from "@/lib/api/escrow"
import { formatNaira, extractApiError } from "@/lib/utils"
import {
  Shield, KeyRound, Clock, CheckCircle2, Loader2, ArrowRight, AlertCircle,
} from "lucide-react"
import { toast } from "sonner"
import { useState, useEffect } from "react"

type Side = "tenant" | "landlord"

interface EscrowPanelProps {
  side: Side
  /** If true, also renders a "history" section with released/refunded escrows. */
  showHistory?: boolean
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "Releasing shortly"
  const totalMin = Math.floor(ms / 60000)
  const hours = Math.floor(totalMin / 60)
  const minutes = totalMin % 60
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remHours = hours % 24
    return `${days}d ${remHours}h`
  }
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function useCountdown(target: string): number {
  const [remaining, setRemaining] = useState(() => new Date(target).getTime() - Date.now())
  useEffect(() => {
    const tick = () => setRemaining(new Date(target).getTime() - Date.now())
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [target])
  return remaining
}

function EscrowRow({
  escrow,
  side,
  busy,
  onConfirm,
}: {
  escrow: RentEscrow
  side: Side
  busy: boolean
  onConfirm?: () => void
}) {
  const remaining = useCountdown(escrow.releaseAfter)
  const propertyLabel = escrow.tenancy?.unit?.property?.name ?? "Property"
  const unitLabel = escrow.tenancy?.unit?.unitNumber
    ? `Unit ${escrow.tenancy.unit.unitNumber}`
    : null

  const amountToShow = side === "tenant" ? escrow.grossAmountKobo : escrow.netAmountKobo
  const amountLabel = side === "tenant" ? "Your payment" : "Net to you"

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 sm:p-4 space-y-3">
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {propertyLabel}
            {unitLabel && <span className="text-slate-500 font-normal"> · {unitLabel}</span>}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <Shield className="h-3 w-3 text-amber-600 shrink-0" />
            Held in escrow
          </p>
        </div>
        <Badge variant="warning" className="gap-1 shrink-0 whitespace-nowrap">
          <Clock className="h-3 w-3" />
          {formatRemaining(remaining)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-white rounded-lg p-2.5 border border-slate-100 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">{amountLabel}</p>
          <p className="text-base font-bold text-[#1a3c5e] mt-0.5 truncate">
            {formatNaira(amountToShow)}
          </p>
        </div>
        <div className="bg-white rounded-lg p-2.5 border border-slate-100 min-w-0">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide">
            {side === "tenant" ? "Auto-releases" : "Funds available"}
          </p>
          <p className="text-xs font-semibold text-slate-700 mt-1 truncate">
            {new Date(escrow.releaseAfter).toLocaleString("en-NG", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      {side === "tenant" && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs text-amber-900 bg-amber-100/60 rounded-lg p-2.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <p>
              Confirm you&apos;ve received keys to release the rent immediately.
              Don&apos;t confirm yet if anything is off — contact support.
            </p>
          </div>
          <Button
            size="sm"
            className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <KeyRound className="h-3.5 w-3.5" />
            )}
            I&apos;ve moved in — release rent
          </Button>
        </div>
      )}
    </div>
  )
}

export function EscrowPanel({ side, showHistory = false }: EscrowPanelProps) {
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["my-escrows"],
    queryFn: () => escrowApi.listMine(),
    refetchInterval: 60_000,
  })

  const all = side === "tenant" ? data?.data?.asTenant ?? [] : data?.data?.asLandlord ?? []
  const pending = all.filter((e) => e.status === "holding")
  const history = all.filter((e) => e.status !== "holding")

  const confirmMutation = useMutation({
    mutationFn: (id: string) => escrowApi.confirm(id),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      toast.success("Rent released to landlord")
      queryClient.invalidateQueries({ queryKey: ["my-escrows"] })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
      queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] })
    },
    onError: (err) => toast.error(extractApiError(err, "Failed to release escrow")),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-amber-600" />
            Rent in escrow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  if (pending.length === 0 && (!showHistory || history.length === 0)) {
    return null
  }

  const heldTotal = pending.reduce(
    (sum, e) => sum + (side === "tenant" ? e.grossAmountKobo : e.netAmountKobo),
    0,
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-base min-w-0">
            <Shield className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Rent in escrow</span>
            {pending.length > 0 && (
              <Badge variant="warning" className="ml-1">{pending.length}</Badge>
            )}
          </CardTitle>
          {pending.length > 0 && (
            <p className="text-sm font-semibold text-slate-900 whitespace-nowrap">{formatNaira(heldTotal)}</p>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {side === "tenant"
            ? "Your rent is being held for a short window. Confirm receipt of keys to release it early."
            : "Funds are held briefly after each rent payment to protect the tenant. They release automatically after the hold window."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((esc) => (
          <EscrowRow
            key={esc.id}
            escrow={esc}
            side={side}
            busy={busyId === esc.id && confirmMutation.isPending}
            onConfirm={() => confirmMutation.mutate(esc.id)}
          />
        ))}

        {showHistory && history.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Recent
            </p>
            {history.slice(0, 5).map((esc) => (
              <div
                key={esc.id}
                className="flex items-center justify-between gap-2 text-xs px-2 py-2 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {esc.status === "released" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className="text-slate-700 truncate">
                    {esc.tenancy?.unit?.property?.name ?? "Property"}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
                  <span className="text-slate-500 capitalize hidden sm:inline">{esc.status}</span>
                  <span className="font-semibold text-slate-900">
                    {formatNaira(side === "tenant" ? esc.grossAmountKobo : esc.netAmountKobo)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
