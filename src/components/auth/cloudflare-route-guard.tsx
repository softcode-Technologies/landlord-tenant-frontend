"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

// Client-side mirror of src/proxy.ts, used ONLY on the Cloudflare (OpenNext)
// deployment — Next.js 16's Node-runtime proxy can't run there. On Vercel the
// real proxy handles route protection and NEXT_PUBLIC_DEPLOY_TARGET is unset,
// so the effect below returns immediately and this component does nothing.
//
// It reads the JWT straight from the cookie (not the zustand store) to avoid any
// hydration race that could bounce a logged-in user. API-level JWT auth is the
// real protection; this only handles the pre-emptive redirect UX.
const COOKIE = "naijarental-token"
const PROTECTED_PREFIXES = ["/tenant", "/landlord", "/agent", "/admin"]

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : undefined
}

function isTokenValid(token: string | undefined): boolean {
  if (!token) return false
  try {
    const payload = token.split(".")[1]
    if (!payload) return false
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    const decoded = JSON.parse(atob(padded)) as { exp?: number }
    if (typeof decoded.exp !== "number") return false
    return decoded.exp * 1000 > Date.now() + 5000
  } catch {
    return false
  }
}

export function CloudflareRouteGuard() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // No-op on Vercel (and anywhere the flag isn't set): the real proxy runs.
    if (process.env.NEXT_PUBLIC_DEPLOY_TARGET !== "cloudflare") return
    if (!pathname) return

    const hasValidToken = isTokenValid(readCookie(COOKIE))
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

    if (isProtected && !hasValidToken) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
      return
    }
    // /login is not bounced on the cookie (see src/proxy.ts); the login page
    // redirects signed-in users itself.
  }, [pathname, router])

  return null
}
