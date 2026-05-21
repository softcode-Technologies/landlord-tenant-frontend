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

export interface PaystackBalance {
  currency: string
  balanceKobo: number
}

export interface PaystackOverview {
  configured: boolean
  testMode: boolean
  balance: PaystackBalance[]
}

export interface PaystackPageMeta {
  total: number
  perPage: number
  page: number
  pageCount: number
}

export interface PaystackListResult<T> {
  data: T[]
  meta: PaystackPageMeta | null
}

export interface PaystackTransaction {
  id: number
  reference: string
  amount: number
  status: string
  channel: string | null
  currency: string
  paid_at: string | null
  created_at: string
  customer?: { email?: string }
}

export interface PaystackSettlement {
  id: number
  status: string
  currency: string
  total_amount: number
  effective_amount?: number
  total_fees?: number
  settlement_date?: string
  createdAt?: string
  created_at?: string
}

export interface PaystackTransfer {
  id: number
  amount: number
  status: string
  reference: string | null
  reason: string | null
  transfer_code: string
  createdAt?: string
  created_at?: string
  recipient?: {
    name?: string
    details?: { account_number?: string; bank_name?: string; account_name?: string }
  }
}

export interface PaystackBank {
  name: string
  code: string
}

export interface ReferralParty {
  id: string
  name: string
  phone: string | null
  email: string | null
}

export interface AdminReferral {
  id: string
  status: "pending" | "rewarded"
  rewardKobo: number
  rewardedAt: string | null
  createdAt: string
  referrer: ReferralParty | null
  referred: ReferralParty | null
}

export interface ReferralsResponse {
  referrals: AdminReferral[]
  pagination: { total: number; page: number; limit: number; totalPages: number }
  summary: {
    pendingCount: number
    rewardedCount: number
    totalPaidKobo: number
    rewardPerReferralKobo: number
  }
}

export interface AnalyticsOverview {
  kpis: {
    totalUsers: number
    newUsersThisMonth: number
    totalProperties: number
    activeTenancies: number
    pendingKyc: number
    pendingPayments: number
  }
  money: {
    collectedToday: number
    collected7Days: number
    collectedThisMonth: number
    collectedAllTime: number
    platformEarningsAllTime: number
    platformEarningsThisMonth: number
    commissionPercent: number
  }
  breakdown: {
    inspection_fee: number
    rent: number
    wallet_topup: number
    listing_boost: number
  }
  daily: {
    date: string
    label: string
    totalKobo: number
    rentKobo: number
    inspectionKobo: number
    topupKobo: number
    boostKobo: number
  }[]
  monthly: { month: string; totalKobo: number; earningsKobo: number }[]
}

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface LandlordListItem {
  landlordProfileId: string
  userId: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  email: string | null
  kycStatus: string
  isVerified: boolean
  isBanned: boolean
  createdAt: string | null
  propertyCount: number
  activeTenancies: number
  expectedAnnualRentNaira: number
  overdueCount: number
}

export interface LandlordOverviewTenancy {
  id: string
  tenantName: string
  tenantPhone: string | null
  tenantUserId: string | null
  rentAmount: number
  status: string
  startDate: string | null
  endDate: string | null
  nextDueDate: string | null
  lastPaymentDate: string | null
  lastPaidAt: string | null
  totalCollectedKobo: number
  overdue: boolean
}

export interface LandlordOverviewUnit {
  id: string
  unitNumber: string | null
  bedrooms: number | null
  bathrooms: number | null
  rentPerAnnum: number | null
  occupied: boolean
  tenancy: LandlordOverviewTenancy | null
}

export interface LandlordOverviewProperty {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  assignedAgent: { name: string; phone: string | null; agencyName: string | null } | null
  units: LandlordOverviewUnit[]
}

export interface TenancyPaymentEscrow {
  status: string
  netAmountKobo: number
  commissionKobo: number
  releaseAfter: string | null
  releasedAt: string | null
  releaseReason: string | null
}

export interface TenancyPayment {
  id: string
  reference: string
  provider: string
  amountKobo: number
  status: string
  paidAt: string | null
  createdAt: string
  receiptUrl: string | null
  escrow: TenancyPaymentEscrow | null
}

export interface TenancyRentChange {
  id: string
  previousAmount: number
  newAmount: number
  changeType: string
  reason: string | null
  createdAt: string
}

export interface TenancyPaymentHistory {
  tenancy: {
    id: string
    rentAmount: number
    status: string
    startDate: string | null
    endDate: string | null
    nextDueDate: string | null
    lastPaymentDate: string | null
    unitNumber: string | null
    propertyName: string | null
  }
  tenant: { name: string; phone: string | null }
  stats: { paymentCount: number; totalPaidKobo: number }
  payments: TenancyPayment[]
  rentChanges: TenancyRentChange[]
}

export interface LandlordOverview {
  landlord: {
    userId: string
    name: string
    phone: string | null
    email: string | null
    kycStatus: string
    isVerified: boolean
    isBanned: boolean
    createdAt: string | null
  }
  summary: {
    properties: number
    units: number
    occupiedUnits: number
    vacantUnits: number
    activeTenancies: number
    expectedAnnualRentNaira: number
    totalCollectedKobo: number
    overdueCount: number
  }
  properties: LandlordOverviewProperty[]
}

export const adminApi = {
  // ── Stats ────────────────────────────────────────────────────────────────────
  getStats: () =>
    apiClient.get<{ totalUsers: number; totalProperties: number; totalActiveTenancies: number; totalRevenueKobo: number; pendingKyc: number; newUsersThisMonth: number }>(
      "/admin/stats"
    ),

  // ── Users ────────────────────────────────────────────────────────────────────
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: User[]; pagination: PaginationMeta }>(
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
  getAllTenancies: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    apiClient.get<{ data: Tenancy[]; pagination: PaginationMeta }>(
      "/admin/tenancies",
      { params }
    ),

  // ── Payments ─────────────────────────────────────────────────────────────────
  getAllPayments: (params?: { page?: number; limit?: number; type?: string; status?: string; userId?: string }) =>
    apiClient.get<{ data: Payment[]; pagination: PaginationMeta }>(
      "/admin/payments",
      { params }
    ),

  getRevenueBreakdown: () =>
    apiClient.get<RevenueBreakdown>("/admin/payments/revenue"),

  getAnalyticsOverview: () =>
    apiClient.get<AnalyticsOverview>("/admin/analytics/overview"),

  refundPayment: (paymentId: string, amountKobo?: number) =>
    apiClient.post(`/admin/payments/${paymentId}/refund`, { amountKobo }),

  // ── Landlord oversight ────────────────────────────────────────────────────────
  getLandlords: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get<{ data: LandlordListItem[]; pagination: PaginationMeta }>(
      "/admin/landlords",
      { params }
    ),

  getLandlordOverview: (userId: string) =>
    apiClient.get<LandlordOverview>(`/admin/landlords/${userId}`),

  getTenancyPayments: (tenancyId: string) =>
    apiClient.get<TenancyPaymentHistory>(`/admin/tenancies/${tenancyId}/payments`),

  // ── Paystack treasury ─────────────────────────────────────────────────────────
  getPaystackOverview: () =>
    apiClient.get<PaystackOverview>("/admin/paystack/overview"),

  getPaystackTransactions: (params?: { page?: number; status?: string }) =>
    apiClient.get<PaystackListResult<PaystackTransaction>>("/admin/paystack/transactions", { params }),

  getPaystackSettlements: (params?: { page?: number }) =>
    apiClient.get<PaystackListResult<PaystackSettlement>>("/admin/paystack/settlements", { params }),

  getPaystackTransfers: (params?: { page?: number }) =>
    apiClient.get<PaystackListResult<PaystackTransfer>>("/admin/paystack/transfers", { params }),

  getPaystackBanks: () =>
    apiClient.get<PaystackBank[]>("/admin/paystack/banks"),

  resolvePaystackAccount: (accountNumber: string, bankCode: string) =>
    apiClient.get<{ accountName: string; accountNumber: string }>("/admin/paystack/resolve-account", {
      params: { accountNumber, bankCode },
    }),

  paystackTransfer: (data: {
    accountNumber: string
    bankCode: string
    accountName: string
    amountKobo: number
    reason?: string
  }) => apiClient.post<{ reference: string; transferCode: string; status: string }>("/admin/paystack/transfer", data),

  // ── Refer & Earn ──────────────────────────────────────────────────────────────
  getReferrals: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<ReferralsResponse>("/admin/referrals", { params }),

  rewardReferral: (id: string) =>
    apiClient.post<{ id: string; status: string; rewardKobo: number }>(`/admin/referrals/${id}/reward`),
}
