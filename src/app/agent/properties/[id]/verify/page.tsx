"use client"

import { useState, useRef, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import {
  MapPin,
  Camera,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { verificationsApi, FLAG_LABEL, type VerificationFlag } from "@/lib/api/verifications"
import { extractApiError } from "@/lib/utils"
import { toast } from "sonner"

/**
 * Confirm a property's address by standing at it.
 *
 * The point of this screen is that the evidence is captured *on site* — the
 * coordinates come from the device, not from a form field, and the photos are
 * taken through the camera. That is the whole difference between "an agent
 * typed an address" and "someone was there".
 */

type Fix = { lat: number; lng: number; accuracy: number }

const MAX_PHOTOS = 8
/** Matches the server's threshold: worse than this isn't evidence of anything. */
const POOR_ACCURACY_M = 100
/** Good enough to stop refining — well inside the server's threshold. */
const GOOD_ACCURACY_M = 30
/** How long to let GPS improve on its first, coarse reading. */
const REFINE_WINDOW_MS = 20000

export default function VerifyPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = use(params)
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)

  const [fix, setFix] = useState<Fix | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [photos, setPhotos] = useState<File[]>([])
  const [result, setResult] = useState<{ status: string; flags: VerificationFlag[] } | null>(null)

  // A geolocation watch keeps running after unmount unless it is cleared, which
  // holds the GPS awake and drains the agent's battery in the background.
  const watchRef = useRef<number | null>(null)
  useEffect(() => {
    return () => {
      if (watchRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchRef.current)
      }
    }
  }, [])

  /**
   * Watch rather than take a single reading.
   *
   * The first fix a phone returns is usually network-derived and coarse — often
   * hundreds of metres — and GPS then refines it to within ten or so over the
   * next few seconds. `getCurrentPosition` would hand back that first coarse
   * reading, which sits the wrong side of the 100m threshold and sends an
   * otherwise good submission into the manual review queue for no reason.
   *
   * So: keep the best reading seen, stop early once it is good enough, and give
   * up after a bounded window with whatever we managed to get.
   */
  function captureLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("This device can't share its location. Try on a phone at the property.")
      return
    }

    setLocating(true)
    setLocationError(null)
    let best: Fix | null = null
    let settled = false

    const finish = (error?: string) => {
      if (settled) return
      settled = true
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current)
        watchRef.current = null
      }
      clearTimeout(timer)
      setLocating(false)
      if (error && !best) setLocationError(error)
    }

    // Bounded so a device that never gets a good fix still returns its best.
    const timer = setTimeout(
      () => finish("Couldn't get a location fix. Step outside, away from walls, and try again."),
      REFINE_WINDOW_MS,
    )

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const candidate: Fix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }
        // Only ever move to a more accurate reading.
        if (!best || candidate.accuracy < best.accuracy) {
          best = candidate
          setFix(candidate)
        }
        if (best.accuracy <= GOOD_ACCURACY_M) finish()
      },
      (err) => {
        // A permission refusal is final — stop waiting on the window.
        if (err.code === err.PERMISSION_DENIED) {
          finish("Location permission was blocked. Allow it in your browser settings, then try again.")
          return
        }
        if (!best) {
          finish("Couldn't get a location fix. Step outside, away from walls, and try again.")
        }
      },
      // No cached fix: a stale position defeats the point of standing there.
      { enableHighAccuracy: true, timeout: REFINE_WINDOW_MS, maximumAge: 0 },
    )
  }

  function addPhotos(files: FileList | null) {
    if (!files) return
    const next = [...photos, ...Array.from(files)].slice(0, MAX_PHOTOS)
    setPhotos(next)
  }

  const submit = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append("method", "geotag")
      if (fix) {
        form.append("capturedLat", String(fix.lat))
        form.append("capturedLng", String(fix.lng))
        form.append("gpsAccuracyM", String(fix.accuracy))
      }
      // Field name must be `images` — that's what the upload middleware reads.
      photos.forEach((p) => form.append("images", p))
      return verificationsApi.submit(propertyId, form)
    },
    onSuccess: (res) => {
      const v = res.data
      setResult({ status: v?.status ?? "pending", flags: v?.autoFlags ?? [] })
      toast.success(
        v?.status === "approved"
          ? "Address confirmed — this property can now be listed."
          : "Submitted. Our team will review it shortly.",
      )
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not submit verification")),
  })

  // ── Done ───────────────────────────────────────────────────────────────────
  if (result) {
    const approved = result.status === "approved"
    return (
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-6">
              <div className={`p-3 rounded-xl mb-4 ${approved ? "bg-emerald-100" : "bg-amber-100"}`}>
                {approved ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-700" />
                ) : (
                  <ShieldCheck className="h-6 w-6 text-amber-700" />
                )}
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">
                {approved ? "Address confirmed" : "Sent for review"}
              </h1>
              <p className="text-sm text-slate-500 max-w-sm mb-5">
                {approved
                  ? "This property can now be listed, once the landlord has confirmed their account."
                  : "A person will look at this. We do that whenever anything needs a judgement call."}
              </p>

              {result.flags.length > 0 && (
                <div className="w-full text-left rounded-lg border border-amber-200 bg-amber-50 p-3.5 mb-5">
                  <p className="text-xs font-medium text-amber-900 mb-2">What slowed it down</p>
                  <ul className="space-y-1">
                    {result.flags.map((f) => (
                      <li key={f} className="text-sm text-amber-900 flex gap-2">
                        <span className="text-amber-600">•</span>
                        {FLAG_LABEL[f] ?? f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={() => router.push(`/agent/properties/${propertyId}`)}>
                Back to property
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const poorFix = fix !== null && fix.accuracy > POOR_ACCURACY_M

  return (
    <div className="max-w-2xl space-y-6">
      <Link href={`/agent/properties/${propertyId}`}>
        <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Confirm this address</h1>
        <p className="text-slate-500 mt-1">
          Do this standing at the property. It&apos;s what lets the listing go live.
        </p>
      </div>

      {/* Step 1 — location */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-7 w-7 rounded-full border border-slate-300 grid place-items-center shrink-0 text-xs font-medium text-slate-600">
              1
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">Capture your location</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Taken from your device, so it can&apos;t be typed in from the office.
              </p>
            </div>
          </div>

          {fix ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  <span className="text-sm text-slate-900 tabular-nums">
                    {fix.lat.toFixed(5)}, {fix.lng.toFixed(5)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {locating && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      improving…
                    </span>
                  )}
                  <Badge
                    variant="secondary"
                    className={`text-[10px] ${poorFix ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}
                  >
                    ±{fix.accuracy}m
                  </Badge>
                </div>
              </div>
              {poorFix && !locating && (
                <p className="text-xs text-amber-700 mt-2">
                  That&apos;s not accurate enough to rely on. Step outside, away from walls, and
                  capture again — otherwise this will need manual review.
                </p>
              )}
              <Button variant="outline" size="sm" className="mt-3" onClick={captureLocation} disabled={locating}>
                {locating && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Capture again
              </Button>
            </div>
          ) : (
            <Button onClick={captureLocation} disabled={locating} className="w-full sm:w-auto gap-2">
              {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {locating ? "Getting your location…" : "Capture location"}
            </Button>
          )}

          {locationError && (
            <div className="flex gap-2 mt-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2 — photos */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="h-7 w-7 rounded-full border border-slate-300 grid place-items-center shrink-0 text-xs font-medium text-slate-600">
              2
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-slate-900">Take at least three photos</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                The building front, the gate or street number, and the compound.
              </p>
            </div>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => addPhotos(e.target.files)}
          />

          {photos.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-md overflow-hidden border border-slate-200">
                  {/* Object URLs preview the local file without uploading first. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={URL.createObjectURL(p)} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white grid place-items-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => fileInput.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
            className="gap-2"
          >
            <Camera className="h-4 w-4" />
            {photos.length === 0 ? "Add photos" : `Add more (${photos.length}/${MAX_PHOTOS})`}
          </Button>

          {photos.length > 0 && photos.length < 3 && (
            <p className="text-xs text-amber-700 mt-2">
              Fewer than three photos will slow this down — it&apos;ll need a person to review it.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Link href={`/agent/properties/${propertyId}`}>
          <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
        </Link>
        <Button
          onClick={() => submit.mutate()}
          disabled={!fix || submit.isPending}
          className="w-full sm:w-auto"
        >
          {submit.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Submit for verification
        </Button>
      </div>

      {!fix && (
        <p className="text-xs text-slate-400 text-center">
          Capture your location to continue.
        </p>
      )}
    </div>
  )
}
