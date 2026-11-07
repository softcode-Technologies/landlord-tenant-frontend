import apiClient from "./client"

export type RemittanceMethod = "cash" | "bank_transfer" | "pos" | "other"
export type RemittanceStatus = "recorded" | "disputed" | "voided"

/** One rent payment Krib released to the agent for the landlord. */
export interface CollectedRentLine {
  escrowId: string
  releasedAt: string | null
  propertyName: string | null
  unitNumber: string | null
  grossAmountKobo: number
  agentAmountKobo: number
  managementFeeKobo: number
  /** What the agent owes the landlord from this payment. */
  owedKobo: number
}

/** Money the agent says they passed on to the landlord. */
export interface Remittance {
  id: string
  agentProfileId: string
  landlordProfileId: string
  amountKobo: number
  method: RemittanceMethod
  paidOn: string
  reference: string | null
  note: string | null
  status: RemittanceStatus
  disputedAt: string | null
  disputeNote: string | null
  voidedAt: string | null
  voidReason: string | null
  createdAt: string
  canVoid: boolean
}

export interface StatementTotals {
  agentProfileId: string
  agentName: string
  landlordProfileId: string
  landlordName: string
  collectedKobo: number
  managementFeeKobo: number
  owedKobo: number
  remittedKobo: number
  disputedKobo: number
  outstandingKobo: number
}

export interface Statement extends StatementTotals {
  collected: CollectedRentLine[]
  remittances: Remittance[]
}

export interface RecordRemittanceData {
  landlordProfileId: string
  /** Whole naira. */
  amount: number
  method: RemittanceMethod
  /** YYYY-MM-DD */
  paidOn: string
  reference?: string
  note?: string
}

export interface RemittancePreview {
  agentName: string
  amountKobo: number
  method: RemittanceMethod
  paidOn: string
  status: RemittanceStatus
  canDispute: boolean
}

export const collectionsApi = {
  // Agent
  agentStatements: () => apiClient.get<StatementTotals[]>("/collections/agent/statements"),
  agentStatement: (landlordProfileId: string) =>
    apiClient.get<Statement>(`/collections/agent/statements/${landlordProfileId}`),
  recordRemittance: (data: RecordRemittanceData) => apiClient.post<Remittance>("/collections/remittances", data),
  voidRemittance: (id: string, reason: string) =>
    apiClient.post<Remittance>(`/collections/remittances/${id}/void`, { reason }),

  // Landlord
  landlordStatements: () => apiClient.get<Statement[]>("/collections/landlord/statements"),

  // Admin
  disputed: () =>
    apiClient.get<(Remittance & { agentName: string; landlordName: string })[]>("/collections/remittances/disputed"),
  uphold: (id: string, note?: string) => apiClient.post<Remittance>(`/collections/remittances/${id}/uphold`, { note }),

  // Public "I didn't get this" link
  preview: (token: string) => apiClient.get<RemittancePreview>(`/collections/respond/${token}`),
  dispute: (token: string, note?: string) =>
    apiClient.post<{ status: RemittanceStatus }>(`/collections/respond/${token}`, { note }),
}

export const REMITTANCE_STATUS_LABEL: Record<RemittanceStatus, string> = {
  recorded: "Recorded",
  disputed: "Landlord says not received",
  voided: "Cancelled",
}
