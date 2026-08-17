"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Activity,
  Building2,
  UserCog,
  Wallet,
  ShieldCheck,
  FileText,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { transparencyApi, type FeedEntry } from "@/lib/api/transparency"

/**
 * The transparency feed.
 *
 * Everything an agent does on this landlord's properties, in plain language and
 * attributed. This is the reason a landlord logs in a second time, so it reads
 * as a story rather than an event log — the summary is written server-side for
 * a person, and only genuinely changed values are shown as before → after.
 */

const ACTION_ICON: Record<string, typeof Activity> = {
  property: Building2,
  unit: Building2,
  manager: UserCog,
  agent: UserCog,
  tenancy: FileText,
  claim: ShieldCheck,
  verification: ShieldCheck,
  escrow: Wallet,
}

function iconFor(action: string) {
  return ACTION_ICON[action.split(".")[0]] ?? Activity
}

const ROLE_STYLE: Record<string, string> = {
  agent: "bg-amber-100 text-amber-800",
  landlord: "bg-emerald-100 text-emerald-800",
  tenant: "bg-sky-100 text-sky-800",
  admin: "bg-violet-100 text-violet-800",
  system: "bg-slate-100 text-slate-700",
}

/**
 * Money units are NOT uniform in this schema, so each field is classified
 * explicitly rather than assumed. `rentPerAnnum` and `rentAmount` are stored in
 * naira (the rest of the app renders them with `formatNairaAmount`, which takes
 * naira); escrow and deposit amounts are stored in kobo. Guessing either way
 * misstates rent by 100×, which is exactly the number a landlord is here to check.
 */
const NAIRA_FIELDS = new Set(["rentPerAnnum", "rentAmount", "serviceCharge"])
const KOBO_FIELDS = new Set(["depositAmount", "amountEarnedKobo", "netAmountKobo", "grossAmountKobo"])

function formatValue(field: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"

  if (NAIRA_FIELDS.has(field) || KOBO_FIELDS.has(field)) {
    const n = Number(value)
    if (!Number.isFinite(n)) return String(value)
    const naira = KOBO_FIELDS.has(field) ? n / 100 : n
    return `₦${naira.toLocaleString("en-NG")}`
  }

  if (typeof value === "boolean") return value ? "Yes" : "No"
  return String(value)
}

/** camelCase field names are for developers, not landlords. */
function humanField(field: string): string {
  return field
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/Per Annum/i, "per year")
    .trim()
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
}

export default function LandlordActivityPage() {
  const [pages, setPages] = useState<string[]>([])
  const cursor = pages[pages.length - 1]

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["landlord-activity", cursor ?? "first"],
    queryFn: () => transparencyApi.getActivity({ limit: 30, before: cursor }),
    placeholderData: (prev) => prev,
  })

  const [accumulated, setAccumulated] = useState<FeedEntry[]>([])
  const entries = data?.data?.entries ?? []
  const nextCursor = data?.data?.nextCursor ?? null

  // Append rather than replace, so "Load more" grows one continuous timeline.
  const visible = cursor ? [...accumulated, ...entries] : entries

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
        <p className="text-slate-500 mt-1">
          Everything done on your properties, and who did it.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {!isLoading && visible.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-10">
              <div className="p-3 rounded-xl bg-slate-100 mb-4">
                <Activity className="h-6 w-6 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Nothing yet</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                When you or an agent make a change to a property, it will show up here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {visible.length > 0 && (
        <ol className="relative border-l border-slate-200 ml-3.5 space-y-1">
          {visible.map((entry) => {
            const Icon = iconFor(entry.action)
            const changed = entry.changes ? Object.entries(entry.changes) : []
            return (
              <li key={entry.id} className="relative pl-7 pb-5">
                <span className="absolute -left-[13px] top-0.5 h-6 w-6 rounded-full bg-white border border-slate-200 grid place-items-center">
                  <Icon className="h-3 w-3 text-slate-500" />
                </span>

                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-medium text-slate-900 text-sm">
                    {entry.actorName ?? "System"}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-[10px] px-1.5 py-0 font-medium ${ROLE_STYLE[entry.actorRole] ?? ROLE_STYLE.system}`}
                  >
                    {entry.actorRole}
                  </Badge>
                  <span className="text-xs text-slate-400">{relativeTime(entry.createdAt)}</span>
                </div>

                <p className="text-sm text-slate-700 leading-snug">{entry.summary}</p>

                {changed.length > 0 && (
                  <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 divide-y divide-slate-200">
                    {changed.map(([field, delta]) => (
                      <div key={field} className="flex flex-wrap items-baseline gap-x-2 px-2.5 py-1.5">
                        <span className="text-xs text-slate-500">{humanField(field)}</span>
                        <span className="text-xs text-slate-400 line-through tabular-nums">
                          {formatValue(field, delta.from)}
                        </span>
                        <span className="text-xs text-slate-400">→</span>
                        <span className="text-xs font-medium text-slate-900 tabular-nums">
                          {formatValue(field, delta.to)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => {
              setAccumulated(visible)
              setPages((p) => [...p, nextCursor])
            }}
          >
            {isFetching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
