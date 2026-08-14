"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  /** Optional: redirect here instead of /login */
  redirectTo?: string
}

/**
 * Hard ceiling on the hydration wait. Hydration is synchronous-ish in practice,
 * so anything past this means it will never arrive (blocked storage, a throw in
 * the persist layer). Bailing to /login is recoverable; spinning forever is the
 * blank page users kept reporting.
 */
const HYDRATION_TIMEOUT_MS = 3000

export function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()
  const [gaveUpWaiting, setGaveUpWaiting] = useState(false)

  useEffect(() => {
    if (_hasHydrated) return
    const timer = setTimeout(() => setGaveUpWaiting(true), HYDRATION_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [_hasHydrated])

  const settled = _hasHydrated || gaveUpWaiting

  useEffect(() => {
    if (settled && !isAuthenticated) {
      router.replace(redirectTo)
    }
  }, [settled, isAuthenticated, redirectTo, router])

  if (!settled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a3c5e]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
