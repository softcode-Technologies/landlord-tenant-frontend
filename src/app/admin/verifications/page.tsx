"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Building2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  verificationsApi,
  FLAG_LABEL,
  type PropertyVerification,
} from "@/lib/api/verifications"
import { extractApiError } from "@/lib/utils"
import { toast } from "sonner"

/**
 * The human half of verification.
 *
 * Anything the scorer couldn't clear outright lands here, oldest first. The
 * reviewer needs to see the evidence and the reasons together, so the flags are
 * spelled out in plain language beside the photos and the map pin rather than
 * left as a score.
 */
export default function AdminVerificationsPage() {
  const queryClient = useQueryClient()
  const [rejecting, setRejecting] = useState<PropertyVerification | null>(null)
  const [reason, setReason] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["verification-queue"],
    queryFn: () => verificationsApi.queue({ limit: 50 }),
  })

  const items = data?.data?.verifications ?? []
  const total = data?.data?.total ?? 0

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["verification-queue"] })
  }

  const approve = useMutation({
    mutationFn: (id: string) => verificationsApi.approve(id),
    onSuccess: () => {
      toast.success("Approved — the address badge is now on this property.")
      refresh()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not approve")),
  })

  const reject = useMutation({
    mutationFn: (v: PropertyVerification) => verificationsApi.reject(v.id, reason.trim()),
    onSuccess: () => {
      toast.success("Rejected. The property stays off the marketplace.")
      setRejecting(null)
      setReason("")
      refresh()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not reject")),
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Verification queue</h1>
        <p className="text-slate-500 mt-1">
          Submissions the automatic checks couldn&apos;t clear. Oldest first.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1].map((i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-10">
              <div className="p-3 rounded-xl bg-emerald-100 mb-4">
                <ShieldCheck className="h-6 w-6 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Queue is empty</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Everything submitted has either passed the automatic checks or been reviewed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {items.length > 0 && (
        <p className="text-sm text-slate-500">
          {total} awaiting review
        </p>
      )}

      <div className="space-y-4">
        {items.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="font-semibold text-slate-900">
                      {v.property?.name ?? "Property"}
                    </span>
                    <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">
                      {v.property?.sourceChannel === "agent_onboarded" ? "Agent-onboarded" : "Landlord-direct"}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {[v.property?.address, v.property?.city, v.property?.state].filter(Boolean).join(", ")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">Auto score</p>
                  <p
                    className={`text-lg font-bold tabular-nums ${
                      v.autoScore >= 80 ? "text-emerald-700" : v.autoScore >= 50 ? "text-amber-700" : "text-red-700"
                    }`}
                  >
                    {v.autoScore}
                  </p>
                </div>
              </div>

              {/* Why it needs a person */}
              {v.autoFlags.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-900 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Why this needs a look
                  </p>
                  <ul className="space-y-1">
                    {v.autoFlags.map((f) => (
                      <li key={f} className="text-sm text-amber-900">• {FLAG_LABEL[f] ?? f}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Where they stood */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                {v.capturedLat !== null && v.capturedLng !== null ? (
                  <a
                    href={`https://www.google.com/maps?q=${v.capturedLat},${v.capturedLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 underline underline-offset-2"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="tabular-nums">
                      {Number(v.capturedLat).toFixed(5)}, {Number(v.capturedLng).toFixed(5)}
                    </span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">No location captured</span>
                )}
                {v.gpsAccuracyM !== null && (
                  <span className="text-slate-500 tabular-nums">±{v.gpsAccuracyM}m</span>
                )}
                {v.distanceFromStatedM !== null && (
                  <span className="text-slate-500 tabular-nums">
                    {v.distanceFromStatedM}m from the stated pin
                  </span>
                )}
              </div>

              {/* Evidence */}
              {v.evidenceUrls.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {v.evidenceUrls.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                       className="aspect-square rounded-md overflow-hidden border border-slate-200 block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="Evidence" className="h-full w-full object-cover" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No photos submitted</p>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
                  onClick={() => setRejecting(v)}
                >
                  Reject
                </Button>
                <Button onClick={() => approve.mutate(v.id)} disabled={approve.isPending}>
                  {approve.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Approve address
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={rejecting !== null} onOpenChange={(open) => !open && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject this verification</DialogTitle>
            <DialogDescription>
              The property stays off the marketplace. The reason is recorded and shown to whoever
              submitted it, so make it something they can act on.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="reason" className="text-sm">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Photos don't show the street number, and the pin is 2km from the stated address"
              className="mt-1.5"
              rows={3}
              maxLength={1000}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={reason.trim().length < 3 || reject.isPending}
              onClick={() => rejecting && reject.mutate(rejecting)}
            >
              {reject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
