import apiClient from "./client"
import type { MaintenanceRequest } from "@/lib/types"

export interface CreateMaintenanceData {
  tenancyId: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  /** Optional photos of the issue — sent as multipart when present. */
  photos?: File[]
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

  createRequest: ({ photos, ...data }: CreateMaintenanceData) => {
    if (photos && photos.length > 0) {
      const formData = new FormData()
      formData.append("tenancyId", data.tenancyId)
      formData.append("title", data.title)
      formData.append("description", data.description)
      formData.append("priority", data.priority)
      photos.forEach((file) => formData.append("images", file))
      return apiClient.post<MaintenanceRequest>("/maintenance", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    }
    return apiClient.post<MaintenanceRequest>("/maintenance", data)
  },

  updateRequest: (id: string, data: UpdateMaintenanceData) =>
    apiClient.patch<MaintenanceRequest>(`/maintenance/${id}`, data),

  rateRequest: (id: string, data: { rating: number; note?: string }) =>
    apiClient.patch(`/maintenance/${id}/rate`, data),
}
