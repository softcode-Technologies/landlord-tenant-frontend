import apiClient from "./client"

export interface OnboardLandlordData {
  landlord: {
    firstName: string
    lastName?: string
    phone: string
    email?: string
    relationship: "owner" | "caretaker" | "family_representative" | "company"
    companyName?: string
  }
  property: {
    name: string
    description?: string
    address: string
    city: string
    state: string
    lga?: string
    area?: string
    latitude?: number
    longitude?: number
    propertyType: string
    isPublic?: boolean
  }
  commissionPercent?: number
}

export interface OnboardResult {
  landlordProfileId: string
  landlordUserId: string
  landlordIsNew: boolean
  propertyId: string
  claimId: string
  channelsSent: string[]
  provisional: true
}

/** Deliberately thin — this is served on an unauthenticated route. */
export interface ClaimPreview {
  agentName: string
  agencyName: string | null
  landlordFirstName: string | null
  propertyName: string | null
  propertyArea: string | null
  expiresAt: string
  status: string
}

export type ClaimRejectReason =
  | "not_my_agent"
  | "not_my_property"
  | "never_heard_of_them"
  | "not_me"

export const claimsApi = {
  /** Agent adds a property and names its landlord. */
  onboard: (data: OnboardLandlordData) =>
    apiClient.post<OnboardResult>("/claims/onboard", data),

  /** What the landlord sees before logging in. */
  preview: (token: string) => apiClient.get<ClaimPreview>(`/claims/${token}`),

  /** Requires an authenticated session belonging to the landlord. */
  accept: (token: string) =>
    apiClient.post<{ landlordProfileId: string }>(`/claims/${token}/accept`, {}),

  /** Intentionally available without logging in. */
  reject: (token: string, reason: ClaimRejectReason, note?: string) =>
    apiClient.post<{ agentSuspended: boolean }>(`/claims/${token}/reject`, { reason, note }),
}
