import apiClient from "./client"

export interface AutoPayoutAccountOption {
  id: string
  bankName: string
  accountNumberLast4: string
  accountName: string
  eligible: boolean
  reason: "not_verified" | "name_mismatch" | null
  /** When a newly added account can start receiving automatic payouts. */
  usableFrom: string
}

export interface AutoPayoutSettings {
  available: boolean
  enabled: boolean
  bankAccountId: string | null
  kycApproved: boolean
  accounts: AutoPayoutAccountOption[]
  lastAttemptAt: string | null
  lastError: string | null
  minNaira: number
}

export const payoutsApi = {
  getAuto: () => apiClient.get<AutoPayoutSettings>("/payouts/auto"),
  setAuto: (enabled: boolean, bankAccountId?: string) =>
    apiClient.put<AutoPayoutSettings>("/payouts/auto", { enabled, ...(bankAccountId ? { bankAccountId } : {}) }),
}
