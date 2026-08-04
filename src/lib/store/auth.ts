import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User, UserRole } from "@/lib/types"

const PROXY_COOKIE = "naijarental-token"
const FALLBACK_COOKIE_MAX_AGE = 7 * 24 * 60 * 60

// Read the JWT `exp` claim so the cookie dies with the token. Avoids the
// proxy trusting a cookie for a token the API has already rejected.
function jwtSecondsUntilExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    const decoded = JSON.parse(atob(padded)) as { exp?: number }
    if (typeof decoded.exp !== "number") return null
    return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000))
  } catch {
    return null
  }
}

function writeProxyCookie(token: string) {
  if (typeof document === "undefined") return
  const maxAge = jwtSecondsUntilExpiry(token) ?? FALLBACK_COOKIE_MAX_AGE
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${PROXY_COOKIE}=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`
}

function clearProxyCookie() {
  if (typeof document === "undefined") return
  document.cookie = `${PROXY_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// Touching `localStorage` THROWS (SecurityError) when site data is blocked —
// in-app browsers (Facebook/Instagram/WhatsApp), "block all cookies", raw
// Android WebView, some private modes. zustand's createJSONStorage swallows
// that and returns undefined, and persist then bails out *before* ever calling
// onRehydrateStorage — so `_hasHydrated` stayed false forever and AuthGuard
// rendered its spinner for eternity (users reported a blank page).
// Falling back to an in-memory store keeps the app usable; the session just
// doesn't survive a reload, which beats an unusable app.
function createMemoryStorage(): Storage {
  const mem = new Map<string, string>()
  return {
    getItem: (key) => mem.get(key) ?? null,
    setItem: (key, value) => void mem.set(key, value),
    removeItem: (key) => void mem.delete(key),
    clear: () => mem.clear(),
    key: (index) => Array.from(mem.keys())[index] ?? null,
    get length() {
      return mem.size
    },
  } as Storage
}

function getSafeStorage(): Storage {
  if (typeof window === "undefined") return createMemoryStorage()
  try {
    // Probe with a real write — merely reading the property isn't enough, some
    // browsers expose localStorage but throw on setItem (quota-locked private mode).
    const probe = "__krib_storage_probe__"
    window.localStorage.setItem(probe, probe)
    window.localStorage.removeItem(probe)
    return window.localStorage
  } catch {
    return createMemoryStorage()
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  _hasHydrated: boolean

  // Actions
  // The refresh token is never held in JS — it lives in an httpOnly cookie set
  // by the backend. Only the (short-lived) access token is kept client-side.
  setAuth: (user: User, accessToken: string) => void
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  getRole: () => UserRole | null
  setHasHydrated: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,

      setHasHydrated: (value) => set({ _hasHydrated: value }),

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true, isLoading: false })
        writeProxyCookie(accessToken)
      },

      setUser: (user) => {
        set({ user })
      },

      setAccessToken: (token) => {
        set({ accessToken: token })
        writeProxyCookie(token)
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
        clearProxyCookie()
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      getRole: (): UserRole | null => {
        const { user } = get()
        if (!user) return null
        if (user.isAdmin) return "admin"
        if (user.agentProfile) return "agent"
        if (user.landlordProfile) return "landlord"
        if (user.tenantProfile) return "tenant"
        return null
      },
    }),
    {
      name: "naijarental-auth",
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      // On a rehydrate error `state` is undefined, so calling setHasHydrated on
      // it would silently no-op and hang the guard. Fall back to the store
      // itself so the flag is ALWAYS set exactly once, success or failure.
      onRehydrateStorage: () => (state, error) => {
        if (error) console.warn("[auth] rehydrate failed, continuing unauthenticated", error)
        if (state) state.setHasHydrated(true)
        else useAuthStore.getState().setHasHydrated(true)
      },
    }
  )
)

/** Get role-based dashboard path (default landing role) */
export function getRoleDashboardPath(user: User | null): string {
  if (!user) return "/login"
  if (user.isAdmin) return "/admin"
  if (user.agentProfile) return "/agent"
  if (user.landlordProfile) return "/landlord"
  if (user.tenantProfile) return "/tenant"
  return "/tenant"
}

export interface AvailableRole {
  role: UserRole
  label: string
  path: string
}

/** Returns every role this user is enrolled in, in display order. */
export function getAvailableRoles(user: User | null): AvailableRole[] {
  if (!user) return []
  const roles: AvailableRole[] = []
  if (user.isAdmin) roles.push({ role: "admin", label: "Admin", path: "/admin" })
  if (user.landlordProfile) roles.push({ role: "landlord", label: "Landlord", path: "/landlord" })
  if (user.agentProfile) roles.push({ role: "agent", label: "Agent", path: "/agent" })
  if (user.tenantProfile) roles.push({ role: "tenant", label: "Tenant", path: "/tenant" })
  return roles
}
