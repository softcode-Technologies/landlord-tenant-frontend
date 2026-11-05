import apiClient from "./client"

export type OfflineRentMethod = "cash" | "bank_transfer" | "pos" | "other"
export type OfflineRentStatus = "recorded" | "disputed" | "voided"

/** Rent paid outside Krib, recorded by the landlord or a full-management agent. */
export interface OfflineRentRecord {
  id: string
  tenancyId: string
  amountKobo: number
  method: OfflineRentMethod
  receivedBy: "landlord" | "agent"
  paidOn: string
  reference: string | null
  note: string | null
  /** False for a part payment, which doesn't move the lease dates. */
  advancedLease: boolean
  newEndDate: string
  status: OfflineRentStatus
  disputeReason: string | null
  disputeNote: string | null
  voidReason: string | null
  datesRestored: boolean | null
  receiptUrl: string | null
  recordedBy: { name: string; isAgent: boolean }
  createdAt: string
}

export interface RecordOfflineRentData {
  tenancyId: string
  /** Whole naira. */
  amount: number
  method: OfflineRentMethod
  receivedBy?: "landlord" | "agent"
  /** YYYY-MM-DD */
  paidOn: string
  reference?: string
  note?: string
}

export interface OfflineRentPreview {
  recordedByName: string
  tenantName: string
  propertyName: string | null
  amountKobo: number
  paidOn: string
  method: OfflineRentMethod
  receivedBy: "landlord" | "agent"
  status: OfflineRentStatus
  canDispute: boolean
}

export const rentRecordsApi = {
  record: (data: RecordOfflineRentData) => apiClient.post<OfflineRentRecord>("/rent-records", data),
  forTenancy: (tenancyId: string) => apiClient.get<OfflineRentRecord[]>(`/rent-records/tenancy/${tenancyId}`),
  void: (id: string, reason: string) => apiClient.post<OfflineRentRecord>(`/rent-records/${id}/void`, { reason }),

  // Admin
  disputed: () => apiClient.get<(OfflineRentRecord & { landlordProfileId: string })[]>("/rent-records/disputed"),
  uphold: (id: string, note?: string) => apiClient.post<OfflineRentRecord>(`/rent-records/${id}/uphold`, { note }),

  // Public "this is wrong" link
  preview: (token: string) => apiClient.get<OfflineRentPreview>(`/rent-records/respond/${token}`),
  dispute: (token: string, reason: "not_paid" | "wrong_amount" | "other", note?: string) =>
    apiClient.post<{ status: OfflineRentStatus }>(`/rent-records/respond/${token}`, { reason, note }),
}

export const METHOD_LABEL: Record<OfflineRentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  pos: "POS",
  other: "Other",
}

export const RECORD_STATUS_LABEL: Record<OfflineRentStatus, string> = {
  recorded: "Recorded",
  disputed: "Disputed",
  voided: "Cancelled",
}
