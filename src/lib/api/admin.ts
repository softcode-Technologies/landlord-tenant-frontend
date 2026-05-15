import apiClient from "./client"
import type { User, KycRecord, Tenancy, Payment, WalletTransaction } from "@/lib/types"

export interface AdminWalletData {
  wallet: { balance: number; lockedBalance: number; currency: string }
  transactions: WalletTransaction[]
  total: number
  page: number
  totalPages: number
}

export interface RevenueBreakdown {
  inspection_fee: number
  rent: number
  platformCommission: number
  wallet_topup: number
  listing_boost: number
  total: number
  thisMonth: { inspection_fee: number; rent: number }
  pendingCount: number
}

export const adminApi = {
  // ── Stats ────────────────────────────────────────────────────────────────────
  getStats: () =>
    apiClient.get<{ totalUsers: number; totalProperties: number; totalActiveTenancies: number; totalRevenueKobo: number; pendingKyc: number; newUsersThisMonth: number }>(
      "/admin/stats"
    ),

  // ── Users ────────────────────────────────────────────────────────────────────
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: User[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      "/admin/users",
      { params }
    ),

  getUser: (id: string) =>
    apiClient.get<User>(`/admin/users/${id}`),

  banUser: (id: string) => apiClient.patch(`/admin/users/${id}/ban`),

  unbanUser: (id: string) => apiClient.patch(`/admin/users/${id}/unban`),

  // ── Wallet ───────────────────────────────────────────────────────────────────
  getUserWallet: (userId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get<AdminWalletData>(`/admin/users/${userId}/wallet`, { params }),

  creditUserWallet: (userId: string, data: { amountKobo: number; description?: string }) =>
    apiClient.post(`/admin/users/${userId}/wallet/credit`, data),

  // ── KYC ─────────────────────────────────────────────────────────────────────
  getKycQueue: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ data: KycRecord[]; meta: { total: number; totalPages: number } }>("/admin/kyc", { params }),

  approveKyc: (userId: string) => apiClient.patch(`/admin/kyc/${userId}/approve`),

  rejectKyc: (userId: string, reason?: string) =>
    apiClient.patch(`/admin/kyc/${userId}/reject`, { reason }),

  // ── Tenancies ────────────────────────────────────────────────────────────────
  getAllTenancies: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ data: Tenancy[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      "/admin/tenancies",
      { params }
    ),

  // ── Payments ─────────────────────────────────────────────────────────────────
  getAllPayments: (params?: { page?: number; limit?: number; type?: string; status?: string; userId?: string }) =>
    apiClient.get<{ data: Payment[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
      "/admin/payments",
      { params }
    ),

  getRevenueBreakdown: () =>
    apiClient.get<RevenueBreakdown>("/admin/payments/revenue"),

  refundPayment: (paymentId: string, amountKobo?: number) =>
    apiClient.post(`/admin/payments/${paymentId}/refund`, { amountKobo }),
}
