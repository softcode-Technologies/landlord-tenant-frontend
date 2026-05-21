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

export interface UpdateLandlordProfileData {
  companyName?: string
  bio?: string
  bankName?: string
  bankCode?: string
  bankAccountNumber?: string
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
  referredByCode?: string
}

export const userApi = {
  getProfile: () => apiClient.get<User>("/user/profile"),

  updateProfile: (data: UpdateProfileData) =>
    apiClient.patch<User>("/user/profile", data),

  updateLandlordProfile: (data: UpdateLandlordProfileData) =>
    apiClient.patch<User>("/user/landlord-profile", data),

  onboard: async (data: OnboardData) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await apiClient.post<any>("/user/onboard", data)
    return { ...res, data: normalizeUser(res.data) }
  },

  toggleWhatsappOptIn: (optIn: boolean) =>
    apiClient.patch<{ whatsappOptIn: boolean }>("/user/whatsapp-optin", { optIn }),

  submitKyc: (
    data:
      | { method: "nin"; nin: string }
      | { method: "bvn"; bvn: string }
      | { method: "document"; kycDocumentUrl: string }
  ) => apiClient.post<{ kycStatus?: string; reason?: string }>("/user/kyc", data),

  getAgreement: (tenancyId: string) =>
    apiClient.get<TenancyAgreement>(`/agreements/${tenancyId}`),

  createAgreement: (data: { tenancyId: string; documentUrl: string }) =>
    apiClient.post<TenancyAgreement>("/agreements", data),

  uploadAgreement: (formData: FormData) =>
    apiClient.post<TenancyAgreement>("/agreements/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    }),

  sendAgreement: (id: string) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/send`),

  signAgreement: (id: string, signatureName: string) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/sign`, { signatureName }),

  rejectAgreement: (id: string) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/reject`),

  updateAgreementDocument: (id: string, documentUrl: string) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/document`, { documentUrl }),

  replaceAgreementDocumentFile: (id: string, formData: FormData) =>
    apiClient.patch<TenancyAgreement>(`/agreements/${id}/document/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    }),
}
