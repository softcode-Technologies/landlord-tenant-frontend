"use client"

import { useState, use } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { BrandLogo } from "@/components/layout/brand-logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { mandatesApi, type MandateObjectionReason } from "@/lib/api/mandates"
import { BRAND_NAME } from "@/lib/config/brand"
import { extractApiError } from "@/lib/utils"
import { toast } from "sonner"

/**
 * The landlord's "stop this" page, reached from the SMS we send whenever an
 * agent asks for — or gets — authority over their properties. No sign-in:
 * the link only ever goes to the landlord's own phone, and a landlord who
 * doesn't use apps must still be able to stop it in one tap.
 */

const REASONS: { value: MandateObjectionReason; label: string; hint: string }[] = [
  { value: "not_me", label: "I never agreed to this", hint: "I did not give this agent authority." },
  { value: "do_not_know_agent", label: "I don't know this agent", hint: "I've never heard of this person or agency." },
  { value: "changed_my_mind", label: "I've changed my mind", hint: "I agreed before, but I want to stop it now." },
  { value: "other", label: "Something else", hint: "Tell us below." },
]

function describe(level: "managing" | "full", payout: "landlord" | "agent" | "split"): string {
  if (level === "managing") return "manage your properties"
  return payout === "landlord" ? "fully manage your properties" : "fully manage your properties and collect your rent"
}

export default function MandateRespondPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [reason, setReason] = useState<MandateObjectionReason | null>(null)
  const [note, setNote] = useState("")
  const [done, setDone] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["mandate-respond", token],
    queryFn: () => mandatesApi.preview(token),
    retry: false,
  })
  const preview = data?.data

  const object = useMutation({
    mutationFn: () => mandatesApi.object(token, reason!, note.trim() || undefined),
    onSuccess: () => setDone(true),
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not submit. Please try again.")),
  })

  if (isLoading) {
    return (
      <Shell>
        <Skeleton className="h-7 w-2/3 mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
        <Skeleton className="h-11 w-full" />
      </Shell>
    )
  }

  if (error || !preview) {
    return (
      <Shell>
        <div className="text-center py-6">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 grid place-items-center">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">This link isn&apos;t valid</h1>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            {extractApiError(error, "Please check the link in your SMS, or contact us.")}
          </p>
        </div>
      </Shell>
    )
  }

  if (done) {
    return (
      <Shell>
        <div className="text-center py-4">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-100 grid place-items-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Done. We&apos;ve stopped it</h1>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            {preview.agentName} no longer has this authority, and our team has been told.
          </p>
        </div>
      </Shell>
    )
  }

  if (!preview.canObject) {
    return (
      <Shell>
        <div className="text-center py-6">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-slate-100 grid place-items-center">
            <ShieldCheck className="h-6 w-6 text-slate-700" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Nothing to stop</h1>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            This request has already ended. {preview.agentName} has no authority from it.
          </p>
        </div>
      </Shell>
    )
  }

  const active = preview.status === "active"

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-slate-900 leading-snug mb-2">
        {active
          ? `${preview.agentName} can ${describe(preview.level, preview.payoutDestination)} on ${BRAND_NAME}.`
          : `${preview.agentName} asked to ${describe(preview.level, preview.payoutDestination)} on ${BRAND_NAME}.`}
      </h1>
      <p className="text-slate-600 text-sm mb-5">
        {preview.managementFeePercent != null && `Their fee: ${preview.managementFeePercent}%. `}
        If you didn&apos;t agree to this, or want it to stop, choose a reason below.
      </p>

      <div className="space-y-2 mb-5">
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setReason(r.value)}
            className={`w-full text-left rounded-lg border p-3.5 transition-colors ${
              reason === r.value ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-300"
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

      <Button
        variant="destructive"
        disabled={!reason || object.isPending}
        onClick={() => object.mutate()}
        className="w-full h-11"
      >
        {object.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {active ? "Stop this agent's authority" : "Stop this request"}
      </Button>
      <p className="text-slate-400 text-xs text-center mt-4">
        If you did agree, you don&apos;t need to do anything.
      </p>
    </Shell>
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
        <p className="text-center text-slate-400 text-xs mt-5">Sent by {BRAND_NAME} to the phone number on your account.</p>
      </div>
    </main>
  )
}
