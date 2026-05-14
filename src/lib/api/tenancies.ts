import apiClient from "./client"
import type { Tenancy, CreditScore } from "@/lib/types"

export const tenanciesApi = {
  getLandlordTenancies: () => apiClient.get<Tenancy[]>("/tenancies/landlord"),

  getTenantTenancies: () => apiClient.get<Tenancy[]>("/tenancies/tenant"),

  getTenancy: (id: string) => apiClient.get<Tenancy>(`/tenancies/${id}`),

  getCreditScore: () => apiClient.get<CreditScore>("/tenancies/credit-score"),

  screenTenant: (tenantUserId: string) =>
    apiClient.get(`/tenancies/screening/${tenantUserId}`),

  renewTenancy: (id: string, data: { newEndDate: string; newRentAmount?: number }) =>
    apiClient.post(`/tenancies/${id}/renew`, data),

  recordDeposit: (
    id: string,
    data: { depositAmount: number; depositPaidAt: string; note?: string }
  ) => apiClient.post(`/tenancies/${id}/deposit`, data),

  returnDeposit: (id: string, data: { depositReturnedAt: string; note?: string }) =>
    apiClient.post(`/tenancies/${id}/deposit/return`, data),

  getDeposit: (id: string) => apiClient.get(`/tenancies/${id}/deposit`),

  terminateTenancy: (id: string) => apiClient.delete(`/tenancies/${id}/terminate`),
}
