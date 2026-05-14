import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { User, UserRole } from "@/lib/types"

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  getRole: () => UserRole | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false })
      },

      setUser: (user) => {
        set({ user })
      },

      setAccessToken: (token) => {
        set({ accessToken: token })
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        })
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

/** Get role-based dashboard path */
export function getRoleDashboardPath(user: User | null): string {
  if (!user) return "/login"
  if (user.isAdmin) return "/admin"
  if (user.agentProfile) return "/agent"
  if (user.landlordProfile) return "/landlord"
  if (user.tenantProfile) return "/tenant"
  return "/tenant"
}
