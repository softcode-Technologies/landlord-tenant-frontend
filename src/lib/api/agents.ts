import apiClient from "./client"
import type { AgentDirectoryItem, Property } from "@/lib/types"

export interface AgentLookupResult {
  found: boolean
  isAgent: boolean
  agent?: {
    agentProfileId?: string
    firstName: string | null
    lastName: string | null
    phone: string
    agencyName?: string | null
    isVerified?: boolean
  }
}

export interface AgentManagedLandlord {
  landlordProfileId: string
  userId: string
  firstName: string | null
  lastName: string | null
  phone: string
  propertyCount: number
}

export interface CreatePropertyAsAgentData {
  landlordProfileId: string
  name: string
  description?: string
  address: string
  city: string
  state: string
  lga?: string
  area?: string
  propertyType: string
  isPublic?: boolean
}

export const agentsApi = {
  getDirectory: (params?: { city?: string; state?: string; page?: number; limit?: number; all?: boolean }) =>
    apiClient.get<{
      data: AgentDirectoryItem[]
      pagination: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean }
    }>("/agent/directory", { params }),

  // agentProfileId comes from the directory item's `id`.
  assignAgent: (propertyId: string, agentProfileId: string, commissionPercent?: number) =>
    apiClient.put(`/agent/assign/${propertyId}`, { agentProfileId, commissionPercent }),

  // Phone-first: check whether a number already belongs to an agent.
  lookupByPhone: (phone: string) =>
    apiClient.get<AgentLookupResult>("/agent/lookup", { params: { phone } }),

  // Assign an existing user as agent (by phone) or SMS-invite a new one.
  inviteToProperty: (data: { propertyId: string; phone: string; firstName?: string; commissionPercent?: number }) =>
    apiClient.post<{ status: "assigned" | "invited"; agentProfileId?: string }>("/agent/invite", data),

  removeAgent: (propertyId: string) =>
    apiClient.delete(`/agent/assign/${propertyId}`),

  // Properties this agent currently manages (assigned + agent-created).
  getMyProperties: () => apiClient.get<Property[]>("/agent/properties"),

  // Landlords this agent already has a relationship with — used as the picker
  // when an agent adds a new property.
  getMyLandlords: () => apiClient.get<AgentManagedLandlord[]>("/agent/landlords"),

  // Agent creates a property on behalf of one of their landlords. Requires
  // an existing landlord/agent relationship (enforced server-side).
  createPropertyAsAgent: (data: CreatePropertyAsAgentData) =>
    apiClient.post<Property>("/properties/agent", data),
}
