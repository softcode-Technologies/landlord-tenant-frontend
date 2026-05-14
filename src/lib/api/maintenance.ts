import apiClient from "./client"
import type { MaintenanceRequest } from "@/lib/types"

export interface CreateMaintenanceData {
  tenancyId: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
}

export interface UpdateMaintenanceData {
  status?: "open" | "in_progress" | "resolved" | "closed"
  landlordNote?: string
  costKobo?: number
  contractorName?: string
  contractorPhone?: string
}

export const maintenanceApi = {
  getTenantRequests: () => apiClient.get<MaintenanceRequest[]>("/maintenance"),

  getLandlordRequests: () => apiClient.get<MaintenanceRequest[]>("/maintenance/landlord"),

  getRequest: (id: string) => apiClient.get<MaintenanceRequest>(`/maintenance/${id}`),

  createRequest: (data: CreateMaintenanceData) =>
    apiClient.post<MaintenanceRequest>("/maintenance", data),

  updateRequest: (id: string, data: UpdateMaintenanceData) =>
    apiClient.patch<MaintenanceRequest>(`/maintenance/${id}`, data),

  rateRequest: (id: string, data: { rating: number; note?: string }) =>
    apiClient.patch(`/maintenance/${id}/rate`, data),
}
