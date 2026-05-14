import apiClient from "./client"
import type { TenantAnalytics, LandlordAnalytics, AgentAnalytics, AdminStats } from "@/lib/types"

export const analyticsApi = {
  getTenantAnalytics: () => apiClient.get<TenantAnalytics>("/analytics/tenant"),

  getAgentAnalytics: () => apiClient.get<AgentAnalytics>("/analytics/agent"),

  getLandlordAnalytics: () => apiClient.get<LandlordAnalytics>("/analytics/landlord"),

  getAdminStats: () => apiClient.get<AdminStats>("/admin/stats"),

  getAdminAnalytics: () => apiClient.get<unknown>("/admin/analytics"),
}
