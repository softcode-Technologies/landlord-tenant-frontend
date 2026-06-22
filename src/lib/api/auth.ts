import apiClient from "./client"
import type { AuthResponse, User } from "@/lib/types"

// Backend /auth/me returns a different shape than the frontend User type.
// This normalizes it so the rest of the app works consistently.
interface RawUser {
  id: string
  phone: string
  email?: string | null
  firstName?: string | null
  lastName?: string | null
  avatar?: string | null        // backend field; frontend expects avatarUrl
  avatarUrl?: string | null
  isPhoneVerified?: boolean
  isEmailVerified?: boolean
  roles?: string[]              // backend field; frontend uses isAdmin boolean
  isAdmin?: boolean
  isVerified?: boolean
  isBanned?: boolean
  landlordProfile?: User["landlordProfile"]
  tenantProfile?: User["tenantProfile"]
  agentProfile?: User["agentProfile"]
  createdAt?: string
  kycStatus?: User["kycStatus"]
  kycMethod?: User["kycMethod"]
  kycRejectReason?: string | null
  whatsappOptIn?: boolean
  referralCode?: string | null
}

export function normalizeUser(raw: RawUser): User {
  const roles = raw.roles ?? []
  return {
    id: raw.id,
    phone: raw.phone,
    email: raw.email ?? undefined,
    firstName: raw.firstName ?? undefined,
    lastName: raw.lastName ?? undefined,
    avatarUrl: raw.avatarUrl ?? raw.avatar ?? undefined,
    isAdmin: raw.isAdmin ?? roles.includes("admin"),
    isVerified: raw.isVerified ?? raw.isPhoneVerified ?? false,
    isBanned: raw.isBanned ?? false,
    createdAt: raw.createdAt ?? "",
    landlordProfile: raw.landlordProfile,
    tenantProfile: raw.tenantProfile,
    agentProfile: raw.agentProfile,
    kycStatus: raw.kycStatus ?? "none",
    kycMethod: raw.kycMethod ?? null,
    kycRejectReason: raw.kycRejectReason ?? null,
    whatsappOptIn: raw.whatsappOptIn ?? false,
    referralCode: raw.referralCode ?? null,
  }
}

export const authApi = {
  // devOtp is only present in development (backend echoes the code so the
  // login form can prefill it). It is never returned in production.
  // `channel` tells the client where the code went: SMS for first-time users,
  // email for returning users who completed onboarding. `destination` is a
  // masked hint (e.g. "ja***@gmail.com" or "+234809***5678").
  requestOtp: (phone: string) =>
    apiClient.post<{
      phone: string
      channel: "sms" | "email"
      destination: string
      devOtp?: string
    }>("/auth/request-otp", { phone }),

  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<AuthResponse>("/auth/verify-otp", { phone, otp }),

  me: async () => {
    const res = await apiClient.get<RawUser>("/auth/me")
    return { ...res, data: normalizeUser(res.data) }
  },

  // Refresh token rides in the httpOnly cookie (sent via withCredentials).
  refresh: () => apiClient.post<{ accessToken: string }>("/auth/refresh", {}),

  logout: () => apiClient.post("/auth/logout"),
}
