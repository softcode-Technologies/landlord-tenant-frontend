"use client"

import { useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  mandatesApi,
  LEVEL_LABEL,
  LEVEL_HINT,
  PAYOUT_LABEL,
  STATUS_LABEL,
  DOCUMENT_LABEL,
  mandateStatusVariant,
  missingDocuments,
  type Mandate,
  type MandateDocumentKind,
  type MandateLevel,
  type MandatePayoutDestination,
} from "@/lib/api/mandates"
import { agentsApi } from "@/lib/api/agents"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/empty-state"
import { extractApiError, formatDate } from "@/lib/utils"
import { FileCheck2, FileText, KeyRound, Loader2, Plus, ShieldCheck, Smartphone, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"

const REQUIRED_KINDS: MandateDocumentKind[] = ["letter_of_authority", "management_agreement", "landlord_id", "proof_of_ownership", "other"]

/**
 * Landlord authority ("mandates"). The agent asks a landlord for authority to
 * manage — or fully run — their properties, then proves the landlord agreed:
 * either the landlord reads back a code sent to their own phone, or the agent
 * sends documents for Krib to review.
 */
export default function AgentMandatesPage() {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const [requestOpen, setRequestOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["agent-mandates"],
    queryFn: () => mandatesApi.mine(),
    enabled,
  })
  const mandates = data?.data ?? []

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Not available yet"
        description="Landlord authority is coming soon to your account."
      />
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Landlord authority</h1>
          <p className="text-slate-500 mt-1">
            Get a landlord&apos;s permission to manage their properties for them, or run everything if they&apos;re away.
          </p>
        </div>
        <Button onClick={() => setRequestOpen(true)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Request authority
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : mandates.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No authority yet"
          description="Ask one of your landlords for authority to manage their properties."
          actionLabel="Request authority"
          onAction={() => setRequestOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {mandates.map((m) => (
            <MandateCard key={m.id} mandate={m} />
          ))}
        </div>
      )}

      <RequestDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </div>
  )
}

// ─── Request ──────────────────────────────────────────────────────────────────

function RequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient()
  const [landlordProfileId, setLandlordProfileId] = useState("")
  const [level, setLevel] = useState<MandateLevel>("full")
  const [payout, setPayout] = useState<MandatePayoutDestination>("agent")
  const [fee, setFee] = useState("")
  const [endsAt, setEndsAt] = useState("")
  // Tomorrow, worked out once: the backend requires an end date in the future.
  const [minEndDate] = useState(() => new Date(Date.now() + 86_400_000).toISOString().split("T")[0])

  const { data: landlordsData } = useQuery({
    queryKey: ["agent-landlords"],
    queryFn: () => agentsApi.getMyLandlords(),
    enabled: open,
  })
  const landlords = (landlordsData?.data ?? []).filter((l) => l.status === "active" || l.status === "pending")

  const reset = () => {
    setLandlordProfileId("")
    setLevel("full")
    setPayout("agent")
    setFee("")
    setEndsAt("")
  }

  const create = useMutation({
    mutationFn: () =>
      mandatesApi.create({
        landlordProfileId,
        level,
        // Only full management can include collecting rent.
        payoutDestination: level === "full" ? payout : "landlord",
        ...(fee.trim() !== "" ? { managementFeePercent: Number(fee) } : {}),
        ...(endsAt ? { endsAt } : {}),
      }),
    onSuccess: () => {
      toast.success("Requested. Now confirm it with the landlord.")
      queryClient.invalidateQueries({ queryKey: ["agent-mandates"] })
      onOpenChange(false)
      reset()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not request authority")),
  })

  const feeNumber = Number(fee)
  const feeValid = fee.trim() === "" || (Number.isInteger(feeNumber) && feeNumber >= 0 && feeNumber <= 30)

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request authority</DialogTitle>
          <DialogDescription>The landlord must agree before this takes effect.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Landlord</Label>
            <Select value={landlordProfileId} onValueChange={setLandlordProfileId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder={landlords.length ? "Choose a landlord" : "No landlords yet"} />
              </SelectTrigger>
              <SelectContent>
                {landlords.map((l) => (
                  <SelectItem key={l.landlordProfileId} value={l.landlordProfileId}>
                    {[l.firstName, l.lastName].filter(Boolean).join(" ") || l.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>What you&apos;ll do</Label>
            <div className="grid gap-2 mt-1.5">
              {(["full", "managing"] as MandateLevel[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`text-left rounded-xl border p-3 transition-colors ${level === l ? "border-[#005AF1] bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <p className="text-sm font-medium text-slate-900">{LEVEL_LABEL[l]}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{LEVEL_HINT[l]}</p>
                </button>
              ))}
            </div>
          </div>

          {level === "full" && (
            <div>
              <Label>Rent</Label>
              <Select value={payout} onValueChange={(v) => setPayout(v as MandatePayoutDestination)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["agent", "landlord", "split"] as MandatePayoutDestination[]).map((p) => (
                    <SelectItem key={p} value={p}>{PAYOUT_LABEL[p]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {payout !== "landlord" && (
                <p className="text-xs text-slate-400 mt-1.5">
                  Rent collection switches on in a later update. Until then, rent keeps going to the landlord.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Management fee (%)</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="Optional"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Ends on</Label>
              <Input
                type="date"
                value={endsAt}
                min={minEndDate}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>
          {!feeValid && <p className="text-xs text-red-500">Fee must be a whole number from 0 to 30.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!landlordProfileId || !feeValid || create.isPending}
            onClick={() => create.mutate()}
            className="gap-2"
          >
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── One mandate ──────────────────────────────────────────────────────────────

function MandateCard({ mandate: m }: { mandate: Mandate }) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["agent-mandates"] })
  const [endOpen, setEndOpen] = useState(false)

  const end = useMutation({
    mutationFn: () => mandatesApi.endByAgent(m.id),
    onSuccess: () => {
      toast.success(m.status === "active" ? "Authority ended" : "Request withdrawn")
      setEndOpen(false)
      refresh()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not end this")),
  })

  const live = m.status === "pending_landlord" || m.status === "pending_review" || m.status === "active"

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">{m.landlord?.name ?? "Landlord"}</h3>
              <Badge variant={mandateStatusVariant(m.status)}>{STATUS_LABEL[m.status]}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {LEVEL_LABEL[m.level]} · {PAYOUT_LABEL[m.payoutDestination]}
              {m.managementFeePercent != null && ` · ${m.managementFeePercent}% fee`}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {m.landlord?.phone}
              {m.endsAt && ` · Ends ${formatDate(m.endsAt)}`}
              {m.startsAt && ` · Since ${formatDate(m.startsAt)}`}
            </p>
          </div>
          {live && (
            <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => setEndOpen(true)}>
              {m.status === "active" ? "End" : "Withdraw"}
            </Button>
          )}
        </div>

        {m.status === "pending_landlord" && <ConfirmPanel mandate={m} onChange={refresh} />}

        {m.status === "pending_review" && (
          <p className="text-sm text-slate-600 rounded-xl bg-slate-50 p-3">
            Krib is checking the documents you sent. We&apos;ll let you know once it&apos;s done. The landlord was told by SMS and can stop it.
          </p>
        )}

        {(m.status === "rejected" || m.status === "revoked" || m.status === "cancelled") && m.endReason && (
          <p className="text-sm text-slate-500 rounded-xl bg-slate-50 p-3">{m.endReason}</p>
        )}
      </CardContent>

      <Dialog open={endOpen} onOpenChange={setEndOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{m.status === "active" ? "End this authority?" : "Withdraw this request?"}</DialogTitle>
            <DialogDescription>
              {m.status === "active"
                ? "You'll no longer manage these properties for this landlord. They'll be told."
                : "You can request again later."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEndOpen(false)}>Keep it</Button>
            <Button variant="destructive" disabled={end.isPending} onClick={() => end.mutate()} className="gap-2">
              {end.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {m.status === "active" ? "End authority" : "Withdraw"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

// ─── Proving the landlord agreed ──────────────────────────────────────────────

function ConfirmPanel({ mandate: m, onChange }: { mandate: Mandate; onChange: () => void }) {
  return (
    <Tabs defaultValue="code" className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="code" className="gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Landlord is with me</TabsTrigger>
        <TabsTrigger value="docs" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Use documents</TabsTrigger>
      </TabsList>
      <TabsContent value="code"><CodeConfirm mandate={m} onChange={onChange} /></TabsContent>
      <TabsContent value="docs"><DocumentsConfirm mandate={m} onChange={onChange} /></TabsContent>
    </Tabs>
  )
}

function CodeConfirm({ mandate: m, onChange }: { mandate: Mandate; onChange: () => void }) {
  const [code, setCode] = useState("")
  const [sentTo, setSentTo] = useState<string | null>(null)

  const send = useMutation({
    mutationFn: () => mandatesApi.sendCode(m.id),
    onSuccess: (res) => {
      setSentTo(res.data?.sentTo ?? null)
      toast.success("Code sent to the landlord's phone")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not send the code")),
  })

  const confirm = useMutation({
    mutationFn: () => mandatesApi.confirmCode(m.id, code),
    onSuccess: () => {
      toast.success("Confirmed. Your authority is now active.")
      setCode("")
      onChange()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not confirm")),
  })

  return (
    <div className="space-y-3 pt-3">
      <p className="text-sm text-slate-600">
        We&apos;ll text a code to the landlord&apos;s own phone. If they agree, they read it to you and you enter it here.
      </p>
      <Button variant="outline" size="sm" disabled={send.isPending} onClick={() => send.mutate()} className="gap-2">
        {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
        {sentTo ? "Send a new code" : "Send code to landlord"}
      </Button>
      {sentTo && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">Sent to {sentTo}. It works for 10 minutes.</p>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className="max-w-[160px] tracking-widest"
            />
            <Button disabled={code.length !== 6 || confirm.isPending} onClick={() => confirm.mutate()} className="gap-2">
              {confirm.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function DocumentsConfirm({ mandate: m, onChange }: { mandate: Mandate; onChange: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [kind, setKind] = useState<MandateDocumentKind>("letter_of_authority")
  const missing = missingDocuments(m.documents)

  const upload = useMutation({
    mutationFn: (file: File) => mandatesApi.addDocument(m.id, kind, file),
    onSuccess: () => {
      toast.success("Document added")
      onChange()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Upload failed")),
  })

  const remove = useMutation({
    mutationFn: (documentId: string) => mandatesApi.removeDocument(m.id, documentId),
    onSuccess: () => onChange(),
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not remove it")),
  })

  const submit = useMutation({
    mutationFn: () => mandatesApi.submitReview(m.id),
    onSuccess: () => {
      toast.success("Sent to Krib for review")
      onChange()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not submit")),
  })

  return (
    <div className="space-y-3 pt-3">
      <p className="text-sm text-slate-600">
        For a landlord who can&apos;t confirm by phone. Krib checks the documents, and the landlord is told by SMS.
      </p>

      {(m.documents ?? []).length > 0 && (
        <ul className="space-y-1.5">
          {(m.documents ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 text-slate-700 hover:underline">
                <FileCheck2 className="h-4 w-4 text-green-600 shrink-0" />
                <span className="truncate">{DOCUMENT_LABEL[d.kind]}{d.fileName ? ` · ${d.fileName}` : ""}</span>
              </a>
              <button
                type="button"
                aria-label="Remove document"
                className="text-slate-400 hover:text-red-500"
                disabled={remove.isPending}
                onClick={() => remove.mutate(d.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={kind} onValueChange={(v) => setKind(v as MandateDocumentKind)}>
          <SelectTrigger className="sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REQUIRED_KINDS.map((k) => (
              <SelectItem key={k} value={k}>{DOCUMENT_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload.mutate(f)
            e.target.value = ""
          }}
        />
        <Button variant="outline" disabled={upload.isPending} onClick={() => fileRef.current?.click()} className="gap-2">
          {upload.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Add document
        </Button>
      </div>

      {missing.length > 0 ? (
        <p className="text-xs text-slate-500">Still needed: {missing.join(", ")}.</p>
      ) : (
        <Button disabled={submit.isPending} onClick={() => submit.mutate()} className="gap-2">
          {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Send to Krib for review
        </Button>
      )}
    </div>
  )
}
