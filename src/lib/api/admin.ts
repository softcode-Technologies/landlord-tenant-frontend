import apiClient from "./client"
import type { User, KycRecord, Tenancy, Payment } from "@/lib/types"

export const adminApi = {
  getUsers: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: User[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      "/admin/users",
      { params }
    ),

  banUser: (id: string) => apiClient.patch(`/admin/users/${id}/ban`),

  unbanUser: (id: string) => apiClient.patch(`/admin/users/${id}/unban`),

  getKycQueue: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: KycRecord[]; meta: { total: number } }>("/admin/kyc", {
      params,
    }),

  approveKyc: (userId: string) => apiClient.patch(`/admin/kyc/${userId}/approve`),

  rejectKyc: (userId: string, reason?: string) =>
    apiClient.patch(`/admin/kyc/${userId}/reject`, { reason }),

  getAllTenancies: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Tenancy[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      "/admin/tenancies",
      { params }
    ),

  getAllPayments: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Payment[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      "/admin/payments",
      { params }
    ),
}
