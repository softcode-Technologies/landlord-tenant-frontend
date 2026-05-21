import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { safeRedirectPath } from "@/lib/safe-redirect"

const COOKIE = "naijarental-token"
const PROTECTED_PREFIXES = ["/tenant", "/landlord", "/agent", "/admin"]
const AUTH_ROUTES = ["/login"]

// Validate the token's expiry instead of trusting its mere presence. A stale or
// expired cookie (common after a backend restart or DB reset) used to count as
// "logged in" — which bounced /login back to / and left protected pages stuck
// on 401s, forcing users to clear cookies by hand. Treating an invalid token as
// no token (and deleting it) lets the session self-heal.
function isTokenValid(token: string | undefined): boolean {
  if (!token) return false
  try {
    const payload = token.split(".")[1]
    if (!payload) return false
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    const decoded = JSON.parse(atob(padded)) as { exp?: number }
    if (typeof decoded.exp !== "number") return false
    // Small skew so a token about to expire isn't treated as still valid.
    return decoded.exp * 1000 > Date.now() + 5000
  } catch {
    return false
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get(COOKIE)?.value
  const hasValidToken = isTokenValid(token)

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))

  if (isProtected && !hasValidToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    const res = NextResponse.redirect(loginUrl)
    if (token) res.cookies.delete(COOKIE) // drop the stale cookie
    return res
  }

  // Only bounce away from /login when the session is genuinely valid.
  if (isAuthRoute && hasValidToken) {
    // Only honor internal paths so ?redirect= can't bounce to an external host.
    const redirectTo = safeRedirectPath(request.nextUrl.searchParams.get("redirect"), "/")
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Stale token on a public page — clear it so it can't cause trouble later.
  if (token && !hasValidToken) {
    const res = NextResponse.next()
    res.cookies.delete(COOKIE)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
