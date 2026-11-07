"use client"

import { useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { payoutsApi, type AutoPayoutAccountOption } from "@/lib/api/payouts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { extractApiError, formatDateTime, formatNairaAmount } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

// Under the "bank-accounts" key so adding or removing an account refreshes it.
const KEY = ["bank-accounts", "auto-payout"]

const REASON: Record<NonNullable<AutoPayoutAccountOption["reason"]>, string> = {
  not_verified: "Not verified with the bank",
  name_mismatch: "Not in your name",
}

/** Lets a landlord have rent sent to their bank automatically. */
export function AutoPayoutCard() {
  const queryClient = useQueryClient()
  const [now] = useState(() => Date.now())
  const [choice, setChoice] = useState<string | null>(null)
  const { data, isLoading } = useQuery({ queryKey: KEY, queryFn: () => payoutsApi.getAuto() })
  const s = data?.data

  const save = useMutation({
    mutationFn: (enabled: boolean) => payoutsApi.setAuto(enabled, enabled ? choice ?? undefined : undefined),
    onSuccess: (res) => {
      toast.success(res.data?.enabled ? "Automatic payouts on" : "Automatic payouts off")
      queryClient.invalidateQueries({ queryKey: KEY })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not update automatic payouts")),
  })

  if (isLoading) return <Skeleton className="h-32 rounded-2xl" />
  if (!s?.available && !s?.enabled) return null

  const current = s.accounts.find((a) => a.id === s.bankAccountId)
  const eligible = s.accounts.filter((a) => a.eligible)
  const selected = choice ?? eligible[0]?.id ?? null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Automatic payouts</CardTitle>
        <Badge variant={s.enabled ? "default" : "outline"}>{s.enabled ? "On" : "Off"}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {s.enabled && current ? (
          <>
            <p className="text-slate-700">
              Rent in your wallet goes to <span className="font-medium">{current.bankName} ••{current.accountNumberLast4}</span> automatically, once it&apos;s over {formatNairaAmount(s.minNaira)}.
            </p>
            {new Date(current.usableFrom).getTime() > now && (
              <p className="text-amber-700">This account is new. Payouts to it start {formatDateTime(current.usableFrom)}.</p>
            )}
            {s.lastError && (
              <p className="text-red-700">The last transfer failed: {s.lastError}. We&apos;ll try again in a few hours.</p>
            )}
            <Button variant="outline" size="sm" disabled={save.isPending} onClick={() => save.mutate(false)} className="gap-2">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Turn off
            </Button>
          </>
        ) : !s.kycApproved ? (
          <p className="text-slate-600">
            Have rent sent to your bank without withdrawing it yourself. First,{" "}
            <Link href="/landlord/kyc" className="text-[#005AF1] hover:underline">verify your identity</Link>.
          </p>
        ) : s.accounts.length === 0 ? (
          <p className="text-slate-600">Have rent sent to your bank without withdrawing it yourself. Add a bank account below to start.</p>
        ) : (
          <>
            <p className="text-slate-600">Have rent sent to your bank without withdrawing it yourself. Choose an account in your own name:</p>
            <div className="space-y-2">
              {s.accounts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  disabled={!a.eligible}
                  onClick={() => setChoice(a.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                    selected === a.id && a.eligible ? "border-[#005AF1] bg-blue-50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="block font-medium text-slate-900">{a.bankName} ••{a.accountNumberLast4}</span>
                  <span className="block text-xs text-slate-500">
                    {a.accountName}
                    {a.reason ? ` · ${REASON[a.reason]}` : ""}
                  </span>
                </button>
              ))}
            </div>
            <Button disabled={!selected || save.isPending} onClick={() => save.mutate(true)} className="gap-2">
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Turn on
            </Button>
            <p className="text-xs text-slate-400">We text you whenever this changes. A newly added account waits 48 hours before payouts start.</p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
