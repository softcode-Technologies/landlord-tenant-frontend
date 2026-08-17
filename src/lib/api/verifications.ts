import apiClient from "./client"

export type VerificationMethod =
  | "geotag"
  | "document"
  | "physical_visit"
  | "landlord_confirmation"

export type VerificationFlag =
  | "no_gps"
  | "gps_outside_nigeria"
  | "gps_low_accuracy"
  | "far_from_stated_pin"
  | "no_photos"
  | "few_photos"
  | "duplicate_address"
  | "agent_unverified"

export interface PropertyVerification {
  id: string
  propertyId: string
  method: VerificationMethod
  evidenceUrls: string[]
  capturedLat: number | null
  capturedLng: number | null
  gpsAccuracyM: number | null
  distanceFromStatedM: number | null
  autoScore: number
  autoFlags: VerificationFlag[]
  status: "pending" | "approved" | "rejected"
  reviewedAt: string | null
  rejectReason: string | null
  createdAt: string
  property?: {
    id: string
    name: string
    address: string
    city: string
    state: string
    sourceChannel: string
  }
}

/**
 * Three narrow badges rather than one broad "Verified" — each is something we
 * can actually stand behind.
 */
export interface PropertyBadges {
  addressConfirmed: boolean
  landlordConfirmed: boolean
  documentsSighted: boolean
}

export const verificationsApi = {
  /** Multipart: photo evidence plus the coordinates captured at the property. */
  submit: (propertyId: string, formData: FormData) =>
    apiClient.post<PropertyVerification>(`/verifications/properties/${propertyId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    }),

  getBadges: (propertyId: string) =>
    apiClient.get<PropertyBadges>(`/verifications/properties/${propertyId}/badges`),

  // ── Admin ────────────────────────────────────────────────────────────────
  queue: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<{
      verifications: PropertyVerification[]
      total: number
      limit: number
      offset: number
    }>("/verifications/queue", { params }),

  approve: (id: string) =>
    apiClient.patch<PropertyVerification>(`/verifications/${id}/approve`, {}),

  reject: (id: string, reason: string) =>
    apiClient.patch<PropertyVerification>(`/verifications/${id}/reject`, { reason }),
}

/** Human wording for each auto-scoring flag, for the reviewer and the agent. */
export const FLAG_LABEL: Record<VerificationFlag, string> = {
  no_gps: "No location captured",
  gps_outside_nigeria: "Location is outside Nigeria",
  gps_low_accuracy: "Location accuracy too poor to rely on",
  far_from_stated_pin: "Captured location is far from the property's own pin",
  no_photos: "No photos supplied",
  few_photos: "Fewer than three photos",
  duplicate_address: "Another property is already registered at this spot",
  agent_unverified: "Submitting agent has not passed ID verification",
}
