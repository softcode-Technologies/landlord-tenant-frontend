import apiClient from "./client"

export type MandateLevel = "managing" | "full"
export type MandatePayoutDestination = "landlord" | "agent" | "split"
export type MandateStatus =
  | "pending_landlord"
  | "pending_review"
  | "active"
  | "rejected"
  | "revoked"
  | "cancelled"
export type MandateAuthorityMethod = "landlord_code" | "landlord_in_app" | "documents"
export type MandateDocumentKind =
  | "management_agreement"
  | "letter_of_authority"
  | "landlord_id"
  | "proof_of_ownership"
  | "other"
export type MandateObjectionReason = "not_me" | "do_not_know_agent" | "changed_my_mind" | "other"

export interface Mandate {
  id: string
  level: MandateLevel
  payoutDestination: MandatePayoutDestination
  managementFeePercent: number | null
  status: MandateStatus
  /** Active and not past its end date. */
  isEffective: boolean
  authorityMethod: MandateAuthorityMethod | null
  startsAt: string | null
  endsAt: string | null
  confirmedAt: string | null
  reviewedAt: string | null
  reviewNote: string | null
  endedAt: string | null
  endReason: string | null
  createdAt: string
  agent: { id: string; name: string; agencyName: string | null; phone?: string | null } | null
  landlord: { id: string; name: string; phone: string | null } | null
  documents?: { id: string; kind: MandateDocumentKind; url: string; fileName: string | null; createdAt: string }[]
}

export interface CreateMandateData {
  landlordProfileId: string
  level: MandateLevel
  payoutDestination: MandatePayoutDestination
  managementFeePercent?: number
  /** YYYY-MM-DD */
  endsAt?: string
}

export interface MandatePreview {
  agentName: string
  level: MandateLevel
  payoutDestination: MandatePayoutDestination
  managementFeePercent: number | null
  status: MandateStatus
  canObject: boolean
}

export const mandatesApi = {
  // ── Agent ──
  mine: () => apiClient.get<Mandate[]>("/mandates/mine"),
  create: (data: CreateMandateData) => apiClient.post<Mandate>("/mandates", data),
  sendCode: (id: string) => apiClient.post<{ sentTo: string; expiresAt: string }>(`/mandates/${id}/send-code`),
  confirmCode: (id: string, code: string) => apiClient.post<Mandate>(`/mandates/${id}/confirm-code`, { code }),
  addDocument: (id: string, kind: MandateDocumentKind, file: File) => {
    const form = new FormData()
    form.append("kind", kind)
    form.append("document", file)
    return apiClient.post<Mandate>(`/mandates/${id}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    })
  },
  removeDocument: (id: string, documentId: string) =>
    apiClient.delete<Mandate>(`/mandates/${id}/documents/${documentId}`),
  submitReview: (id: string) => apiClient.post<Mandate>(`/mandates/${id}/submit-review`),
  endByAgent: (id: string, reason?: string) => apiClient.post<Mandate>(`/mandates/${id}/end`, { reason }),

  // ── Landlord ──
  forMe: () => apiClient.get<Mandate[]>("/mandates/for-me"),
  accept: (id: string) => apiClient.post<Mandate>(`/mandates/${id}/accept`),
  decline: (id: string, reason?: string) => apiClient.post<Mandate>(`/mandates/${id}/decline`, { reason }),
  revoke: (id: string, reason?: string) => apiClient.post<Mandate>(`/mandates/${id}/revoke`, { reason }),

  // ── Admin ──
  reviewQueue: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<{ mandates: Mandate[]; total: number; limit: number; offset: number }>("/mandates/review-queue", {
      params,
    }),
  approve: (id: string, note?: string) => apiClient.patch<Mandate>(`/mandates/${id}/approve`, { note }),
  reject: (id: string, reason: string) => apiClient.patch<Mandate>(`/mandates/${id}/reject`, { reason }),

  // ── Public stop link ──
  preview: (token: string) => apiClient.get<MandatePreview>(`/mandates/respond/${token}`),
  object: (token: string, reason: MandateObjectionReason, note?: string) =>
    apiClient.post<{ status: MandateStatus; agentSuspended: boolean }>(`/mandates/respond/${token}`, { reason, note }),
}

// ── Plain-language labels, shared by every mandate screen ──

export const LEVEL_LABEL: Record<MandateLevel, string> = {
  managing: "Managing agent",
  full: "Full management",
}

export const LEVEL_HINT: Record<MandateLevel, string> = {
  managing: "Runs day-to-day work. The landlord stays involved.",
  full: "Runs everything for a landlord who is absent or offline.",
}

export const PAYOUT_LABEL: Record<MandatePayoutDestination, string> = {
  landlord: "Rent goes to the landlord",
  agent: "Agent collects the rent",
  split: "Split: landlord's share to them, fee to the agent",
}

export const STATUS_LABEL: Record<MandateStatus, string> = {
  pending_landlord: "Waiting for landlord",
  pending_review: "Krib is reviewing",
  active: "Active",
  rejected: "Not approved",
  revoked: "Ended",
  cancelled: "Withdrawn",
}

export const DOCUMENT_LABEL: Record<MandateDocumentKind, string> = {
  management_agreement: "Signed management agreement",
  letter_of_authority: "Letter of authority",
  landlord_id: "Landlord's ID",
  proof_of_ownership: "Proof of ownership (C of O, deed, receipt)",
  other: "Other",
}

export function mandateStatusVariant(status: MandateStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "default"
  if (status === "pending_landlord" || status === "pending_review") return "secondary"
  if (status === "rejected") return "destructive"
  return "outline"
}

/** What the documents route still needs, in the backend's own rule. */
export function missingDocuments(docs: Mandate["documents"]): string[] {
  const kinds = new Set((docs ?? []).map((d) => d.kind))
  const missing: string[] = []
  if (!kinds.has("management_agreement") && !kinds.has("letter_of_authority")) {
    missing.push("Management agreement or letter of authority")
  }
  if (!kinds.has("landlord_id")) missing.push("Landlord's ID")
  if (!kinds.has("proof_of_ownership")) missing.push("Proof of ownership")
  return missing
}
