import apiClient from "./client"

export interface FeedEntry {
  id: string
  actorRole: "landlord" | "agent" | "tenant" | "admin" | "system"
  actorName: string | null
  propertyId: string | null
  action: string
  summary: string
  changes: Record<string, { from: unknown; to: unknown }> | null
  createdAt: string
}

/** One rent payment, decomposed — what the tenant paid through to what you got. */
export interface MoneyTrailRow {
  escrowId: string
  propertyName: string | null
  tenantPaidKobo: number
  platformFeeKobo: number
  platformFeePercent: number
  agentCommissionKobo: number
  landlordNetKobo: number
  status: string
  paidAt: string
  releasedAt: string | null
}

export interface AgentScorecard {
  agentProfileId: string
  name: string
  agencyName: string | null
  status: "pending" | "active" | "revoked" | "rejected"
  propertyCount: number
  unitsListed: number
  unitsOccupied: number
  occupancyRate: number
  rentCollectedKobo: number
  commissionEarnedKobo: number
  startedAt: string | null
}

export interface TransparencySummary {
  activeAgents: number
  propertiesManaged: number
  heldInEscrowKobo: number
  lifetimeReceivedKobo: number
}

export const transparencyApi = {
  getSummary: () => apiClient.get<TransparencySummary>("/transparency/summary"),

  getActivity: (params?: { limit?: number; before?: string; propertyId?: string }) =>
    apiClient.get<{ entries: FeedEntry[]; nextCursor: string | null }>("/transparency/activity", {
      params,
    }),

  getMoneyTrail: (params?: { limit?: number; offset?: number }) =>
    apiClient.get<{
      rows: MoneyTrailRow[]
      totals: {
        tenantPaidKobo: number
        platformFeeKobo: number
        agentCommissionKobo: number
        landlordNetKobo: number
      }
    }>("/transparency/money-trail", { params }),

  getAgents: () => apiClient.get<AgentScorecard[]>("/transparency/agents"),

  revokeAgent: (agentProfileId: string, body?: { propertyId?: string; reason?: string }) =>
    apiClient.post<{ propertiesAffected: number }>(
      `/transparency/agents/${agentProfileId}/revoke`,
      body ?? {},
    ),
}
