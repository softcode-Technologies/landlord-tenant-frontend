"use client"

import { useState, use } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { BrandLogo } from "@/components/layout/brand-logo"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { rentRecordsApi, METHOD_LABEL } from "@/lib/api/rent-records"
import { BRAND_NAME } from "@/lib/config/brand"
import { extractApiError, formatDate, formatNaira } from "@/lib/utils"
import { toast } from "sonner"

/**
 * Reached from the SMS a landlord gets when their agent records rent paid
 * outside Krib. No sign-in: the link only goes to the landlord's phone.
 * Reporting freezes the record for Krib to review.
 */

type Reason = "not_paid" | "wrong_amount" | "other"
const REASONS: { value: Reason; label: string; hint: string }[] = [
  { value: "not_paid", label: "I was not paid this", hint: "I haven't received this money." },
  { value: "wrong_amount", label: "The amount or date is wrong", hint: "Something was paid, but not this." },
  { value: "other", label: "Something else", hint: "Tell us below." },
]

export default function RentRecordRespondPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [reason, setReason] = useState<Reason | null>(null)
  const [note, setNote] = useState("")
  const [done, setDone] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ["rent-record-respond", token],
    queryFn: () => rentRecordsApi.preview(token),
    retry: false,
  })
  const p = data?.data

  const dispute = useMutation({
    mutationFn: () => rentRecordsApi.dispute(token, reason!, note.trim() || undefined),
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

  if (error || !p) {
    return (
      <Shell>
        <Centered icon={<AlertTriangle className="h-6 w-6 text-amber-600" />} tone="bg-amber-100" title="This link isn't valid">
          {extractApiError(error, "Please check the link in your SMS, or contact us.")}
        </Centered>
      </Shell>
    )
  }

  if (done) {
    return (
      <Shell>
        <Centered icon={<CheckCircle2 className="h-6 w-6 text-emerald-700" />} tone="bg-emerald-100" title="Thank you. We'll look into it">
          Our team will review this payment record and contact you.
        </Centered>
      </Shell>
    )
  }

  if (!p.canDispute) {
    return (
      <Shell>
        <Centered icon={<ShieldCheck className="h-6 w-6 text-slate-700" />} tone="bg-slate-100" title="Already handled">
          {p.status === "disputed" ? "You've already reported this. Our team is reviewing it." : "This record has been cancelled."}
        </Centered>
      </Shell>
    )
  }

  return (
    <Shell>
      <h1 className="text-xl font-semibold text-slate-900 leading-snug mb-4">
        {p.recordedByName} recorded a rent payment for you.
      </h1>
      <dl className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm mb-5">
        <Row label="Amount" value={formatNaira(p.amountKobo)} />
        <Row label="From" value={p.tenantName} />
        {p.propertyName && <Row label="Property" value={p.propertyName} />}
        <Row label="Paid" value={`${formatDate(p.paidOn)} · ${METHOD_LABEL[p.method]}`} />
        <Row label="Money is with" value={p.receivedBy === "agent" ? p.recordedByName : "You"} />
      </dl>
      <p className="text-slate-600 text-sm mb-3">Is something wrong?</p>

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
        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" maxLength={1000} rows={3} />
      </div>

      <Button variant="destructive" disabled={!reason || dispute.isPending} onClick={() => dispute.mutate()} className="w-full h-11">
        {dispute.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Report this
      </Button>
      <p className="text-slate-400 text-xs text-center mt-4">If this is right, you don&apos;t need to do anything.</p>
    </Shell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 px-3.5 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-900 font-medium text-right">{value}</dd>
    </div>
  )
}

function Centered({ icon, tone, title, children }: { icon: React.ReactNode; tone: string; title: string; children: React.ReactNode }) {
  return (
    <div className="text-center py-6">
      <div className={`mx-auto mb-4 h-12 w-12 rounded-full ${tone} grid place-items-center`}>{icon}</div>
      <h1 className="text-xl font-semibold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-600 text-sm max-w-sm mx-auto">{children}</p>
    </div>
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
