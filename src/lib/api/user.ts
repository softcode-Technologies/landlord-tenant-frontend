import apiClient from "./client"
import type { User, TenancyAgreement } from "@/lib/types"
import { normalizeUser } from "./auth"

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  email?: string
  bio?: string
  occupation?: string
  companyName?: string
  licenseNumber?: string
}

export interface OnboardData {
  firstName: string
  lastName?: string
  email?: string
  bio?: string
  role: "tenant" | "landlord" | "agent"
  occupation?: string
  companyName?: string
  licenseNumber?: string
}

export const userApi = {
  getProfile: () => apiClient.get<User>("/user/profile"),

  updateProfile: (data: UpdateProfileData) =>
    apiClient.patch<User>("/user/profile", data),

  onboard: async (data: OnboardData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.post<any>("/user/onboard", data)
    return { ...res, data: normalizeUser(res.data) }
  },

  submitKyc: (kycDocumentUrl: string) =>
    apiClient.post("/user/kyc", { kycDocumentUrl }),

  getAgreement: (tenancyId: string) =>
    apiClient.get<TenancyAgreement>(`/agreements/${tenancyId}`),

  createAgreement: (data: { tenancyId: string; documentUrl: string }) =>
    apiClient.post<TenancyAgreement>("/agreements", data),

  sendAgreement: (id: string) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/send`),

  signAgreement: (id: string) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/sign`),

  rejectAgreement: (id: string) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/reject`),

  updateAgreementDocument: (id: string, documentUrl: string) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/document`, { documentUrl }),
}
