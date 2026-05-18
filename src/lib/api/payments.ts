import apiClient from "./client"
import type { Payment, Wallet, WalletTransaction, BankAccount } from "@/lib/types"

export const paymentsApi = {
  getWallet: () => apiClient.get<Wallet>("/wallet"),

  // Backend paginates this endpoint — the response interceptor wraps it as
  // { data, pagination }. Unwrap here so callers always see a flat array.
  getWalletTransactions: async () => {
    const res = await apiClient.get<{ data: WalletTransaction[] } | WalletTransaction[]>(
      "/wallet/transactions"
    )
    const payload = res.data as { data?: WalletTransaction[] } | WalletTransaction[]
    const rows = Array.isArray(payload) ? payload : payload.data ?? []
    return { ...res, data: rows }
  },

  topupWallet: (amountKobo: number) =>
    apiClient.post<{ paymentUrl: string }>("/wallet/topup", { amountKobo }),

  withdraw: (data: { amountKobo: number; bankAccountId: string }) =>
    apiClient.post("/wallet/withdraw", data),

  getBankAccounts: () => apiClient.get<BankAccount[]>("/wallet/bank-accounts"),

  listBanks: () => apiClient.get<{ name: string; code: string; slug?: string }[]>("/wallet/banks"),

  resolveBankAccount: (data: { accountNumber: string; bankCode: string }) =>
    apiClient.post<{ accountName: string; isVerified: boolean }>(
      "/wallet/bank-accounts/resolve",
      data,
    ),

  addBankAccount: (data: {
    bankCode: string
    bankName: string
    accountNumber: string
    accountName?: string
  }) => apiClient.post<BankAccount>("/wallet/bank-accounts", data),

  setDefaultBankAccount: (id: string) =>
    apiClient.patch(`/wallet/bank-accounts/${id}/default`),

  removeBankAccount: (id: string) =>
    apiClient.delete(`/wallet/bank-accounts/${id}`),

  payRent: (tenancyId: string, amountKobo: number) =>
    apiClient.post<{ paymentUrl: string }>("/payments/rent", { tenancyId, amountKobo }),

  getPaymentHistory: () => apiClient.get<Payment[]>("/payments/history"),

  getReceipt: (paymentId: string) =>
    apiClient.get<{ receiptUrl: string }>(`/payments/${paymentId}/receipt`),

  getBoostTiers: () =>
    apiClient.get<{
      enabled: boolean
      tiers: { days: number; priceKobo: number; priceNaira: number }[]
    }>("/payments/listing-boost/tiers"),

  boostListing: (listingId: string, tierDays: number) =>
    apiClient.post<{ paymentUrl: string; reference: string; priceKobo: number; tierDays: number }>(
      "/payments/listing-boost",
      { listingId, tierDays },
    ),
}
