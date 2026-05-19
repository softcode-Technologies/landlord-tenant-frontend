import apiClient from "./client"
import type { AgentCommission } from "@/lib/types"

export interface CreateCommissionData {
  tenancyId: string
  commissionType: "percentage" | "flat"
  commissionValue: number
}

// Backend mounts the commission router under /agent/commissions
// (see src/modules/agent/agent.routes.ts → router.use('/commissions', ...)).
// All paths below MUST keep the /agent prefix — without it every call 404s.
export const commissionsApi = {
  getAgentCommissions: () => apiClient.get<AgentCommission[]>("/agent/commissions"),

  getLandlordCommissions: () =>
    apiClient.get<AgentCommission[]>("/agent/commissions/landlord"),

  createCommission: (data: CreateCommissionData) =>
    apiClient.post<AgentCommission>("/agent/commissions", data),

  markPaid: (id: string) => apiClient.patch(`/agent/commissions/${id}/pay`),

  waiveCommission: (id: string) =>
    apiClient.patch(`/agent/commissions/${id}/waive`),
}
