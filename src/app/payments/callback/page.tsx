"use client"

import { useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api/client"
import { Suspense } from "react"

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get("reference") ?? searchParams.get("trxref") ?? ""

  const { data, isError, isSuccess } = useQuery({
    queryKey: ["payment-verify", reference],
    queryFn: () =>
      apiClient.get<{ redirectUrl: string }>(`/payments/callback?reference=${reference}`),
    enabled: !!reference,
    retry: false,
  })

  useEffect(() => {
    if (isSuccess && data?.data?.redirectUrl) {
      // Backend returns a redirect URL — follow it on the frontend
      const url = new URL(data.data.redirectUrl)
      router.replace(url.pathname + url.search)
    } else if (isSuccess && !data?.data?.redirectUrl) {
      router.replace("/")
    }
  }, [isSuccess, data, router])

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-semibold text-slate-800">Payment could not be verified</p>
        <button
          className="text-sm text-[#1a3c5e] underline"
          onClick={() => router.replace("/")}
        >
          Go home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-[#1a3c5e]" />
      <p className="text-slate-600 text-sm">Verifying your payment…</p>
    </div>
  )
}

export default function PaymentsCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  )
}
