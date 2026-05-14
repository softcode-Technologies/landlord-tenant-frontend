import apiClient from "./client"
import type { AgentDirectoryItem } from "@/lib/types"

export const agentsApi = {
  getDirectory: (params?: { city?: string; state?: string; page?: number; limit?: number }) =>
    apiClient.get<{
      data: AgentDirectoryItem[]
      pagination: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPrevPage: boolean }
    }>("/agent/directory", { params }),

  assignAgent: (propertyId: string, agentId: string) =>
    apiClient.put(`/agent/assign/${propertyId}`, { agentId }),

  removeAgent: (propertyId: string) =>
    apiClient.delete(`/agent/assign/${propertyId}`),
}
