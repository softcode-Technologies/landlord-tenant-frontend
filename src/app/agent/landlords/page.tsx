"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Clock,
  Phone,
  Building2,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { agentPipelineApi, type AwaitingLandlord } from "@/lib/api/agents"

/**
 * The agent's pipeline.
 *
 * One number leads: how much of their own commission is waiting on landlords
 * who haven't confirmed. Everything else on the page exists to help them clear
 * it — longest-waiting first, with the phone number one tap away.
 */

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`

const TIER_LABEL: Record<string, string> = {
  unverified: "Unverified",
  id_verified: "ID verified",
  established: "Established",
  partner: "Partner",
}

export default function AgentLandlordsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-pipeline"],
    queryFn: () => agentPipelineApi.get(),
  })
  const pipeline = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  const awaiting = pipeline?.awaiting ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My landlords</h1>
        <p className="text-slate-500 mt-1">
          Landlords you&apos;ve brought on, and what&apos;s waiting on them.
        </p>
      </div>

      {pipeline?.suspended && (
        <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5">
          <AlertTriangle className="h-4 w-4 text-red-700 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-900">Your account is under review</p>
            <p className="text-sm text-red-800 mt-0.5">
              You can&apos;t add new landlords while we look into reports from landlords you added.
            </p>
          </div>
        </div>
      )}

      {/* The headline. This number is the whole point of the page. */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="p-5">
          <p className="text-sm text-emerald-900 mb-1">Waiting on landlords to confirm</p>
          <p className="text-3xl font-bold text-emerald-950 tabular-nums">
            {naira(pipeline?.heldCommissionKobo ?? 0)}
          </p>
          <p className="text-sm text-emerald-800 mt-1.5">
            {pipeline?.awaitingCount === 0
              ? "Nothing outstanding — every landlord you added has confirmed."
              : `Across ${pipeline?.awaitingCount} landlord${pipeline?.awaitingCount === 1 ? "" : "s"}. Your commission is released as soon as they confirm.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat
          icon={ShieldCheck}
          label="Your tier"
          value={TIER_LABEL[pipeline?.trustTier ?? "unverified"]}
          hint={
            pipeline?.unclaimedRemaining === null
              ? "No limit"
              : `${pipeline?.unclaimedRemaining ?? 0} of ${pipeline?.unclaimedLimit ?? 0} slots free`
          }
        />
        <Stat icon={UserPlus} label="Landlords added" value={String(pipeline?.onboardedLandlordCount ?? 0)} />
        <Stat icon={ShieldCheck} label="Confirmed" value={String(pipeline?.claimedLandlordCount ?? 0)} />
        <Stat
          icon={TrendingUp}
          label="Confirmation rate"
          value={`${pipeline?.claimRatePercent ?? 0}%`}
          hint="Higher rates raise your tier"
        />
      </div>

      <div>
        <h2 className="font-semibold text-slate-900 mb-3">
          Awaiting confirmation
          {awaiting.length > 0 && <span className="text-slate-400 font-normal"> · {awaiting.length}</span>}
        </h2>

        {awaiting.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center py-8">
                <div className="p-3 rounded-xl bg-emerald-100 mb-4">
                  <ShieldCheck className="h-6 w-6 text-emerald-700" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">All caught up</h3>
                <p className="text-sm text-slate-500 max-w-sm mb-5">
                  Every landlord you&apos;ve added has confirmed. Add another property to keep growing.
                </p>
                <Link href="/agent/properties/new">
                  <Button size="sm">Add a property</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {awaiting.map((l) => (
              <AwaitingRow key={l.landlordProfileId} landlord={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AwaitingRow({ landlord }: { landlord: AwaitingLandlord }) {
  // Longest-waiting are the ones at risk of expiring, so they get flagged.
  const stale = landlord.daysWaiting >= 14

  return (
    <Card className={stale ? "border-amber-200" : undefined}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-900">{landlord.name}</span>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 ${
                  landlord.claimStatus === "invited"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {landlord.claimStatus === "invited" ? "Invited" : "Not yet invited"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {landlord.propertyCount} propert{landlord.propertyCount === 1 ? "y" : "ies"}
              </span>
              <span className={`flex items-center gap-1.5 ${stale ? "text-amber-700" : ""}`}>
                <Clock className="h-3.5 w-3.5" />
                {landlord.daysWaiting === 0 ? "Invited today" : `${landlord.daysWaiting} days waiting`}
              </span>
            </div>

            {stale && (
              <p className="text-xs text-amber-700 mt-1.5">
                Give them a call — invitations expire, and the listing goes dark after 30 days.
              </p>
            )}
          </div>

          <div className="text-right shrink-0">
            <p className="font-semibold text-slate-900 tabular-nums">
              {naira(landlord.heldCommissionKobo)}
            </p>
            <p className="text-xs text-slate-400 mb-2">held</p>
            <a href={`tel:${landlord.phone}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                Call
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Building2
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <p className="font-semibold text-slate-900 text-sm">{value}</p>
      {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  )
}
