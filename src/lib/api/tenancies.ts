import apiClient from "./client"
import type { Tenancy, CreditScore, RentChange, ScreeningReport } from "@/lib/types"

export interface AddExistingTenantData {
  unitId: string
  phone: string
  firstName: string
  lastName?: string
  email?: string
  rentAmount: number
  rentCycle?: "monthly" | "yearly"
  startDate: string
  endDate?: string
  paymentDayOfMonth?: number
  depositAmount?: number
}

export interface AddExistingTenantResult {
  tenancyId: string
  tenantUserId: string
  tenantIsNew: boolean
  claimMessage: string
}

export const tenanciesApi = {
  getLandlordTenancies: () => apiClient.get<Tenancy[]>("/tenancies/landlord"),

  // Onboard a tenant already living in a unit — creates a managed tenancy now,
  // and an unclaimed phone-keyed account if they're not on the platform yet.
  addExistingTenant: (data: AddExistingTenantData) =>
    apiClient.post<AddExistingTenantResult>("/tenancies", data),

  getTenantTenancies: () => apiClient.get<Tenancy[]>("/tenancies/tenant"),

  getTenancy: (id: string) => apiClient.get<Tenancy>(`/tenancies/${id}`),

  getCreditScore: () => apiClient.get<CreditScore>("/tenancies/credit-score"),

  screenTenant: (tenantUserId: string) =>
    apiClient.get<ScreeningReport>(`/tenancies/screening/${tenantUserId}`),

  renewTenancy: (id: string, data: { newEndDate: string; newRentAmount?: number }) =>
    apiClient.post(`/tenancies/${id}/renew`, data),

  recordDeposit: (
    id: string,
    data: { depositAmount: number; depositPaidAt: string; note?: string }
  ) => apiClient.post(`/tenancies/${id}/deposit`, data),

  returnDeposit: (id: string, data: { depositReturnedAt: string; note?: string }) =>
    apiClient.post(`/tenancies/${id}/deposit/return`, data),

  getDeposit: (id: string) => apiClient.get(`/tenancies/${id}/deposit`),

  // Edit/increase the annual rent (naira). changeType defaults to increase/decrease
  // by direction; pass 'correction' for fixing a mistake.
  updateRent: (
    id: string,
    data: { newRentAmount: number; changeType?: "increase" | "decrease" | "correction"; reason?: string }
  ) => apiClient.patch<RentChange>(`/tenancies/${id}/rent`, data),

  getRentChanges: (id: string) =>
    apiClient.get<RentChange[]>(`/tenancies/${id}/rent-changes`),

  terminateTenancy: (id: string) => apiClient.delete(`/tenancies/${id}/terminate`),
}
