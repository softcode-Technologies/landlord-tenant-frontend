"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { collectionsApi, type RemittanceMethod, type StatementTotals as Totals } from "@/lib/api/collections"
import { METHOD_LABEL } from "@/lib/api/rent-records"
import { useAgentRentCollectionEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import { StatementTotals, StatementDetail } from "@/components/collections/statement-view"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { extractApiError, formatNaira } from "@/lib/utils"
import { ArrowLeft, HandCoins, Loader2 } from "lucide-react"
import { toast } from "sonner"

/**
 * Rent Krib paid to the agent for their landlords, and what they've passed on.
 * The agent records each payment to a landlord here; the landlord gets an SMS.
 */
export default function AgentCollectionsPage() {
  const enabled = useAgentRentCollectionEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const [openId, setOpenId] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ["agent-collections"],
    queryFn: () => collectionsApi.agentStatements(),
    enabled,
  })
  const rows = data?.data ?? []

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return <EmptyState icon={HandCoins} title="Not available yet" description="Collecting rent for landlords isn't switched on yet." />
  }
  if (openId) return <LandlordStatement landlordProfileId={openId} onBack={() => setOpenId(null)} />

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Collected rent</h1>
        <p className="text-slate-500 mt-1">Rent paid to you for your landlords, and what you still owe each one.</p>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title="No collected rent yet"
          description="When a landlord gives you authority to collect rent, rent tenants pay through Krib comes to your wallet and shows here."
        />
      ) : (
        <div className="space-y-3">
          {rows.map((s) => (
            <LandlordRow key={s.landlordProfileId} s={s} onOpen={() => setOpenId(s.landlordProfileId)} />
          ))}
        </div>
      )}
    </div>
  )
}

function LandlordRow({ s, onOpen }: { s: Totals; onOpen: () => void }) {
  return (
    <Card className="cursor-pointer hover:border-slate-300 transition-colors" onClick={onOpen}>
      <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{s.landlordName}</p>
          <p className="text-sm text-slate-500">Collected {formatNaira(s.collectedKobo)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">You owe</p>
          <p className={`font-semibold ${s.outstandingKobo > 0 ? "text-amber-700" : "text-emerald-700"}`}>
            {formatNaira(Math.max(0, s.outstandingKobo))}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function LandlordStatement({ landlordProfileId, onBack }: { landlordProfileId: string; onBack: () => void }) {
  const [recording, setRecording] = useState(false)
  const queryKey = ["agent-collection", landlordProfileId]
  const { data, isLoading } = useQuery({ queryKey, queryFn: () => collectionsApi.agentStatement(landlordProfileId) })
  const s = data?.data

  return (
    <div className="space-y-5 max-w-4xl">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> All landlords
      </button>
      {isLoading || !s ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{s.landlordName}</h1>
            <Button onClick={() => setRecording(true)} disabled={s.outstandingKobo <= 0}>Record payment to landlord</Button>
          </div>
          <StatementTotals s={s} viewer="agent" />
          <StatementDetail s={s} viewer="agent" queryKey={queryKey} />
          {recording && <RecordRemittanceDialog landlordProfileId={landlordProfileId} outstandingKobo={s.outstandingKobo} onClose={() => setRecording(false)} />}
        </>
      )}
    </div>
  )
}

function RecordRemittanceDialog({ landlordProfileId, outstandingKobo, onClose }: { landlordProfileId: string; outstandingKobo: number; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [today] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" }))
  const maxNaira = Math.floor(outstandingKobo / 100)
  const [amount, setAmount] = useState(String(maxNaira))
  const [method, setMethod] = useState<RemittanceMethod>("bank_transfer")
  const [paidOn, setPaidOn] = useState(today)
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")

  const amountNum = Number(amount)
  const amountOk = Number.isInteger(amountNum) && amountNum > 0 && amountNum <= maxNaira

  const save = useMutation({
    mutationFn: () =>
      collectionsApi.recordRemittance({
        landlordProfileId,
        amount: amountNum,
        method,
        paidOn,
        ...(reference.trim() ? { reference: reference.trim() } : {}),
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: () => {
      toast.success("Recorded. The landlord gets an SMS.")
      queryClient.invalidateQueries({ queryKey: ["agent-collection", landlordProfileId] })
      queryClient.invalidateQueries({ queryKey: ["agent-collections"] })
      onClose()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not record the payment")),
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record payment to landlord</DialogTitle>
          <DialogDescription>
            Money you sent the landlord from rent you collected. They get an SMS and can tell us if it didn&apos;t arrive.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Amount (₦)</Label>
            <Input type="number" min={1} max={maxNaira} value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1.5" />
            <p className="text-xs text-slate-500 mt-1">You owe {formatNaira(outstandingKobo)}.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>How you paid</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as RemittanceMethod)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(METHOD_LABEL) as RemittanceMethod[]).map((m) => (
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
            <Label>Reference <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} maxLength={100} placeholder="Bank transfer reference" className="mt-1.5" />
          </div>
          <div>
            <Label>Note <span className="text-slate-400 font-normal">(optional)</span></Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className="mt-1.5" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!amountOk || !paidOn || paidOn > today || save.isPending} onClick={() => save.mutate()} className="gap-2">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
