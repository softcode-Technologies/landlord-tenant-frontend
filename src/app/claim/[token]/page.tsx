"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import {
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Eye,
  Wallet,
  BellRing,
  CheckCircle2,
  Building2,
} from "lucide-react"
import { BrandLogo } from "@/components/layout/brand-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { claimsApi, type ClaimRejectReason } from "@/lib/api/claims"
import { useAuthStore } from "@/lib/store/auth"
import { BRAND_NAME } from "@/lib/config/brand"
import { extractApiError } from "@/lib/utils"
import { toast } from "sonner"

/**
 * The landlord's first-ever screen.
 *
 * Someone who never signed up is being told a named agent listed their
 * property. The page has about eight seconds to be believable, so it leads
 * with who is making the claim and what it means, and it makes saying "no" as
 * easy as saying "yes" — refusing is the fraud tripwire and the way a person
 * who never asked to be here gets removed.
 */

const REJECT_REASONS: { value: ClaimRejectReason; label: string; hint: string }[] = [
  {
    value: "not_my_agent",
    label: "This isn't my agent",
    hint: "I own this property, but I did not authorise this person to manage it.",
  },
  {
    value: "not_my_property",
    label: "This isn't my property",
    hint: "I have no connection to this address.",
  },
  {
    value: "never_heard_of_them",
    label: "I've never heard of them",
    hint: "I don't know this person or agency at all.",
  },
  {
    value: "not_me",
    label: "This isn't me — remove my details",
    hint: "You have the wrong person. Delete the account created in my name.",
  },
]

export default function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const [mode, setMode] = useState<"decide" | "rejecting" | "accepted" | "rejected">("decide")
  const [reason, setReason] = useState<ClaimRejectReason | null>(null)
  const [note, setNote] = useState("")

  const { data, isLoading, error } = useQuery({
    queryKey: ["claim", token],
    queryFn: () => claimsApi.preview(token),
    retry: false,
  })
  const claim = data?.data

  const acceptMutation = useMutation({
    mutationFn: () => claimsApi.accept(token),
    onSuccess: () => setMode("accepted"),
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not confirm. Please try again.")),
  })

  const rejectMutation = useMutation({
    mutationFn: () => claimsApi.reject(token, reason!, note.trim() || undefined),
    onSuccess: () => setMode("rejected"),
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not submit. Please try again.")),
  })

  function handleConfirm() {
    // Confirming needs a session proving they are the landlord — the link alone
    // arrived by SMS or email and could have been forwarded.
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(`/claim/${token}`)}`)
      return
    }
    acceptMutation.mutate()
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Shell>
        <Skeleton className="h-7 w-2/3 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-11 w-full" />
      </Shell>
    )
  }

  // ── Bad / used / expired link ──────────────────────────────────────────────
  if (error || !claim) {
    return (
      <Shell>
        <div className="text-center py-6">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 grid place-items-center">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">This link isn&apos;t valid</h1>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            {extractApiError(error, "It may have expired or already been used. Ask the agent to send a new one.")}
          </p>
        </div>
      </Shell>
    )
  }

  // ── Confirmed ──────────────────────────────────────────────────────────────
  if (mode === "accepted") {
    return (
      <Shell>
        <div className="text-center py-4">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-100 grid place-items-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">You&apos;re all set</h1>
          <p className="text-slate-600 text-sm mb-6 max-w-sm mx-auto">
            {claim.propertyName ? `${claim.propertyName} is` : "Your property is"} now under your account. You can see
            everything {claim.agentName} does with it, and rent is paid to you.
          </p>
          <Button onClick={() => router.push("/landlord")} className="w-full sm:w-auto">
            Go to my dashboard
          </Button>
        </div>
      </Shell>
    )
  }

  // ── Rejected ───────────────────────────────────────────────────────────────
  if (mode === "rejected") {
    return (
      <Shell>
        <div className="text-center py-4">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 grid place-items-center">
            <ShieldCheck className="h-6 w-6 text-slate-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Thank you — we&apos;ve stopped it</h1>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            The property has been frozen and this agent has been reported to our team. No money can move, and you
            won&apos;t be contacted about it again.
          </p>
        </div>
      </Shell>
    )
  }

  // ── Rejection reasons ──────────────────────────────────────────────────────
  if (mode === "rejecting") {
    return (
      <Shell>
        <h1 className="text-xl font-semibold text-slate-900 mb-1">What&apos;s wrong?</h1>
        <p className="text-slate-600 text-sm mb-5">
          This helps us act on it properly. Nothing will be paid to anyone in the meantime.
        </p>

        <div className="space-y-2 mb-5">
          {REJECT_REASONS.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setReason(r.value)}
              className={`w-full text-left rounded-lg border p-3.5 transition-colors ${
                reason === r.value
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="block font-medium text-slate-900 text-sm">{r.label}</span>
              <span className="block text-slate-500 text-xs mt-0.5">{r.hint}</span>
            </button>
          ))}
        </div>

        <div className="mb-5">
          <Label htmlFor="note" className="text-sm">
            Anything else? <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tell us what happened"
            className="mt-1.5"
            maxLength={1000}
            rows={3}
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={() => setMode("decide")} className="sm:flex-1">
            Back
          </Button>
          <Button
            variant="destructive"
            disabled={!reason || rejectMutation.isPending}
            onClick={() => rejectMutation.mutate()}
            className="sm:flex-1"
          >
            {rejectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Report this
          </Button>
        </div>
      </Shell>
    )
  }

  // ── The decision ───────────────────────────────────────────────────────────
  const agentLabel = claim.agencyName ? `${claim.agentName} of ${claim.agencyName}` : claim.agentName

  return (
    <Shell>
      <p className="text-slate-600 text-sm mb-1">
        {claim.landlordFirstName ? `Hi ${claim.landlordFirstName},` : "Hello,"}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900 leading-snug mb-4">
        <span className="text-slate-900">{agentLabel}</span> says they manage your property.
      </h1>

      <Card className="mb-5">
        <CardContent className="p-4 flex gap-3">
          <div className="h-9 w-9 rounded-lg bg-slate-100 grid place-items-center shrink-0">
            <Building2 className="h-4.5 w-4.5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-slate-900 text-sm truncate">
              {claim.propertyName ?? "A property"}
            </p>
            {claim.propertyArea && <p className="text-slate-500 text-sm">{claim.propertyArea}</p>}
          </div>
        </CardContent>
      </Card>

      <p className="text-slate-600 text-sm mb-3">
        They set it up on {BRAND_NAME} in your name. We made you an account so that:
      </p>
      <ul className="space-y-2.5 mb-6">
        <Benefit icon={Eye} text="You see everything they do — every tenant, every rent change." />
        <Benefit icon={Wallet} text="Rent is paid to you, not to them. Nothing moves until you confirm." />
        <Benefit icon={BellRing} text="You can remove them at any time, in one tap." />
      </ul>

      <div className="space-y-2.5">
        <Button onClick={handleConfirm} disabled={acceptMutation.isPending} className="w-full h-11">
          {acceptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Yes, confirm this
        </Button>
        <Button variant="ghost" onClick={() => setMode("rejecting")} className="w-full h-11 text-red-700 hover:text-red-800 hover:bg-red-50">
          No — I don&apos;t know them, or this isn&apos;t mine
        </Button>
      </div>

      {!isAuthenticated && (
        <p className="text-slate-400 text-xs text-center mt-4">
          Confirming asks you to sign in with this phone number, so we know it&apos;s really you.
        </p>
      )}
    </Shell>
  )
}

function Benefit({ icon: Icon, text }: { icon: typeof Eye; text: string }) {
  return (
    <li className="flex gap-2.5 items-start">
      <Icon className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
      <span className="text-slate-700 text-sm leading-snug">{text}</span>
    </li>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <div className="flex justify-center mb-7">
          <BrandLogo />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-7">{children}</div>
        <p className="text-center text-slate-400 text-xs mt-5">
          Sent by {BRAND_NAME}. If you weren&apos;t expecting this, use the report option — we&apos;ll remove your details.
        </p>
      </div>
    </main>
  )
}
