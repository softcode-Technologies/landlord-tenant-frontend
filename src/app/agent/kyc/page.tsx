"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth"
import { userApi } from "@/lib/api/user"
import { authApi } from "@/lib/api/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { extractApiError } from "@/lib/utils"
import { compressImage } from "@/lib/image"
import {
  ShieldCheck, AlertCircle, Clock, ShieldX, ShieldAlert, Loader2, CheckCircle2, ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"

type KycMethod = "nin" | "bvn" | "document"

export default function AgentKycPage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [kycMethod, setKycMethod] = useState<KycMethod>("nin")
  const [ninValue, setNinValue] = useState("")
  const [bvnValue, setBvnValue] = useState("")
  const [kycFile, setKycFile] = useState<File | null>(null)

  const kycMutation = useMutation({
    mutationFn: async () => {
      if (kycMethod === "nin") return userApi.submitKyc({ method: "nin", nin: ninValue })
      if (kycMethod === "bvn") return userApi.submitKyc({ method: "bvn", bvn: bvnValue })
      const file = kycFile!.type.startsWith("image/")
        ? await compressImage(kycFile!)
        : kycFile!
      return userApi.uploadKycDocument(file)
    },
    onSuccess: async (res) => {
      const status = res.data?.kycStatus
      if (status === "approved") {
        toast.success("Identity verified! Your account is now fully verified.")
      } else if (status === "rejected") {
        toast.error(res.data?.reason ?? "Verification failed. Please try again.")
      } else {
        toast.success("KYC submitted. We'll review it within 24 hours.")
      }
      const fresh = await authApi.me()
      setUser(fresh.data)
      setNinValue("")
      setBvnValue("")
      setKycFile(null)
    },
    onError: (err: unknown) =>
      toast.error(extractApiError(err, "Failed to submit KYC. Please try again.")),
  })

  if (!user) return null

  const kycStatus = user.kycStatus ?? "none"

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1a3c5e] transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Identity Verification</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Verify your identity to earn client trust and unlock all platform features
        </p>
      </div>

      {kycStatus === "approved" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-900">Identity Verified</h2>
              <p className="text-sm text-green-700 mt-1">
                Your profile displays a verified agent badge.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {kycStatus === "pending" && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">Verification Under Review</p>
            <p className="text-xs text-blue-700 mt-0.5">
              We received your submission and will notify you within 24 hours.
            </p>
          </div>
        </div>
      )}

      {kycStatus === "rejected" && (
        <div className="rounded-xl border-l-4 border-red-500 bg-red-50 p-4 flex items-start gap-3">
          <ShieldX className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-900 text-sm">Verification Rejected</p>
            <p className="text-xs text-red-700 mt-0.5">
              {user.kycRejectReason ?? "Please resubmit your identity documents."}
            </p>
          </div>
        </div>
      )}

      {kycStatus === "none" && (
        <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-900 text-sm">Verify Your Identity</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Verified agents receive a trust badge, get higher visibility, and can manage more properties.
            </p>
          </div>
        </div>
      )}

      {(kycStatus === "none" || kycStatus === "rejected") && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#1a3c5e]" />
              <CardTitle>Submit Verification</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-xs text-slate-500 mb-2 block">Verification method</Label>
              <div className="flex gap-2">
                {(["nin", "bvn", "document"] as KycMethod[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setKycMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      kycMethod === m
                        ? "bg-[#1a3c5e] text-white border-[#1a3c5e]"
                        : "bg-white text-slate-600 border-slate-200 hover:border-[#1a3c5e]"
                    }`}
                  >
                    {m === "nin" ? "NIN" : m === "bvn" ? "BVN" : "Document"}
                  </button>
                ))}
              </div>
            </div>

            {kycMethod === "nin" && (
              <div className="space-y-1.5">
                <Label htmlFor="nin-input">National Identification Number</Label>
                <Input
                  id="nin-input"
                  value={ninValue}
                  onChange={(e) => setNinValue(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="12345678901"
                  maxLength={11}
                  autoComplete="off"
                />
                <p className="text-xs text-slate-400">
                  11-digit number on your NIN slip, voter card, or national ID
                </p>
                <p className="text-xs text-slate-400 italic">
                  Your number is encrypted and never shared with clients or third parties.
                </p>
              </div>
            )}

            {kycMethod === "bvn" && (
              <div className="space-y-1.5">
                <Label htmlFor="bvn-input">Bank Verification Number</Label>
                <Input
                  id="bvn-input"
                  value={bvnValue}
                  onChange={(e) => setBvnValue(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="12345678901"
                  maxLength={11}
                  autoComplete="off"
                />
                <p className="text-xs text-slate-400">Dial *565*0# on any network to retrieve your BVN</p>
                <p className="text-xs text-slate-400 italic">
                  Your number is encrypted and never shared with clients or third parties.
                </p>
              </div>
            )}

            {kycMethod === "document" && (
              <div className="space-y-1.5">
                <Label htmlFor="doc-input">Government ID document</Label>
                <label
                  htmlFor="doc-input"
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-6 text-center hover:border-[#1a3c5e]"
                >
                  {kycFile ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium text-slate-700">{kycFile.name}</span>
                      <span className="text-xs text-slate-400">Tap to choose a different file</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-6 w-6 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">
                        Upload a photo or PDF of your ID
                      </span>
                      <span className="text-xs text-slate-400">
                        NIN slip, driver&apos;s licence, or passport
                      </span>
                    </>
                  )}
                  <input
                    id="doc-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}

            <Button
              onClick={() => kycMutation.mutate()}
              disabled={
                kycMutation.isPending ||
                (kycMethod === "nin" && ninValue.length !== 11) ||
                (kycMethod === "bvn" && bvnValue.length !== 11) ||
                (kycMethod === "document" && !kycFile)
              }
              className="w-full gap-2"
            >
              {kycMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {kycMethod === "document" ? "Submit for Review" : "Verify Identity"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
