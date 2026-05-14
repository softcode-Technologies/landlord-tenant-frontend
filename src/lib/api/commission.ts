import apiClient from "./client"
import type { AgentCommission } from "@/lib/types"

export interface CreateCommissionData {
  tenancyId: string
  commissionType: "percentage" | "flat"
  commissionValue: number
}

export const commissionsApi = {
  getAgentCommissions: () => apiClient.get<AgentCommission[]>("/commissions"),

  getLandlordCommissions: () => apiClient.get<AgentCommission[]>("/commissions/landlord"),

  createCommission: (data: CreateCommissionData) =>
    apiClient.post<AgentCommission>("/commissions", data),

  markPaid: (id: string) => apiClient.patch(`/commissions/${id}/pay`),

  waiveCommission: (id: string) => apiClient.patch(`/commissions/${id}/waive`),
}
