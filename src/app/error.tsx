"use client"

import { useEffect } from "react"
import { Building2, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-6">
          <Building2 className="h-8 w-8 text-white" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h1>
        <p className="text-slate-500 mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button className="gap-2 w-full sm:w-auto" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
