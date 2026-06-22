import apiClient from "./client"

export interface SavingsMethod {
  id: string
  kind: "card" | "dva"
  status: "active" | "expired" | "failing" | "revoked"
  priority?: number
  display: {
    last4?: string
    cardType?: string
    bank?: string
    expMonth?: string
    expYear?: string
    accountNumber?: string
    bankName?: string
    accountName?: string
  }
  expiresAt?: string | null
}

export interface SavingsContribution {
  id: string
  type: "contribution" | "withdrawal" | "rent_settlement"
  amount: number
  status: "pending" | "success" | "failed"
  source: "auto" | "manual" | "system"
  reference: string
  createdAt: string
}

export interface SavingsGoal {
  id: string
  tenancyId: string | null
  name: string
  targetAmount: number
  savedAmount: number
  remainingAmount: number
  monthlyAmount: number
  payDayOfMonth: number
  targetDate: string | null
  status: "active" | "paused" | "completed" | "cancelled" | "needs_method"
  progressPercent: number
  onTrack: boolean
  suggestedMonthly: number
  nextChargeDate: string | null
  lastChargeStatus: "success" | "failed" | "retrying" | null
  autoPayRent: boolean
  activeMethod: SavingsMethod | null
  contributions?: SavingsContribution[]
}

export interface CreateGoalPayload {
  tenancyId?: string
  name?: string
  targetAmountKobo?: number
  monthlyAmountKobo: number
  payDayOfMonth?: number
  targetDate?: string
  autoPayRent?: boolean
  callbackScheme?: string
}

export const savingsApi = {
  getGoals: () => apiClient.get<SavingsGoal[]>("/savings/goals"),

  getGoal: (id: string) => apiClient.get<SavingsGoal>(`/savings/goals/${id}`),

  createGoal: (payload: CreateGoalPayload) =>
    apiClient.post<{ paymentUrl: string; reference: string; goalId: string }>("/savings/goals", payload),

  updateGoal: (
    id: string,
    payload: { monthlyAmountKobo?: number; payDayOfMonth?: number; autoPayRent?: boolean },
  ) => apiClient.patch(`/savings/goals/${id}`, payload),

  topup: (id: string, amountKobo: number) =>
    apiClient.post<{ paymentUrl: string; reference: string }>(`/savings/goals/${id}/topup`, { amountKobo }),

  addCard: (id: string) =>
    apiClient.post<{ paymentUrl: string; reference: string }>(`/savings/goals/${id}/add-card`, {}),

  withdraw: (id: string, amountKobo: number) =>
    apiClient.post<{ amountKobo: number }>(`/savings/goals/${id}/withdraw`, { amountKobo }),

  payRent: (id: string) =>
    apiClient.post<{ appliedKobo: number; shortfallKobo: number }>(`/savings/goals/${id}/pay-rent`, {}),

  pause: (id: string) => apiClient.post(`/savings/goals/${id}/pause`, {}),

  resume: (id: string) => apiClient.post(`/savings/goals/${id}/resume`, {}),

  cancel: (id: string) => apiClient.delete<{ refundedToWallet: number }>(`/savings/goals/${id}`),

  getDedicatedAccount: (id: string) =>
    apiClient.post<SavingsMethod>(`/savings/goals/${id}/dedicated-account`, {}),

  listMethods: () => apiClient.get<SavingsMethod[]>("/savings/methods"),

  setPrimaryMethod: (id: string) => apiClient.patch(`/savings/methods/${id}/primary`),

  removeMethod: (id: string) => apiClient.delete(`/savings/methods/${id}`),
}
