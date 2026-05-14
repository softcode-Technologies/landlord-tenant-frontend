import apiClient from "./client"
import type { Payment, Wallet, WalletTransaction, BankAccount } from "@/lib/types"

export const paymentsApi = {
  getWallet: () => apiClient.get<Wallet>("/wallet"),

  getWalletTransactions: () => apiClient.get<WalletTransaction[]>("/wallet/transactions"),

  topupWallet: (amountKobo: number) =>
    apiClient.post<{ paymentUrl: string }>("/wallet/topup", { amountKobo }),

  withdraw: (data: { amountKobo: number; bankAccountId: string }) =>
    apiClient.post("/wallet/withdraw", data),

  getBankAccounts: () => apiClient.get<BankAccount[]>("/wallet/bank-accounts"),

  addBankAccount: (data: {
    bankCode: string
    bankName: string
    accountNumber: string
    accountName: string
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
}
