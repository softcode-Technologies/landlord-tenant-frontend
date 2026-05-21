import apiClient from "./client"

export interface AppConfig {
  features: {
    listingBoostEnabled: boolean
    kycMode: "manual" | "automatic"
    whatsappOptInDefault: boolean
  }
  providers: { payment: string }
  pricing: {
    inspectionFeeKobo: number
    platformCommissionPercent: number
    referralRewardKobo: number
    escrowHoldHours: number
    listingBoostTiers: { days: number; priceKobo: number }[]
  }
  links: {
    frontendUrl: string
    iosStoreUrl: string | null
    androidStoreUrl: string | null
  }
}

export const configApi = {
  getConfig: () => apiClient.get<AppConfig>("/app/config"),
}
