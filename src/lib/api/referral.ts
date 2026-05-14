import apiClient from "./client"

export interface ReferralStats {
  referralCode: string | null
  totalReferred: number
  totalRewarded: number
  totalEarnedKobo: number
}

export interface ReferralRecord {
  id: string
  referredUserId: string
  status: "pending" | "rewarded"
  rewardKobo: number
  rewardedAt: string | null
  createdAt: string
  referred?: {
    firstName?: string
    lastName?: string
    createdAt?: string
  }
}

export const referralApi = {
  getMyCode: () => apiClient.get<ReferralStats>("/referrals/my-code"),
  getMyReferrals: () => apiClient.get<ReferralRecord[]>("/referrals/my-referrals"),
}
