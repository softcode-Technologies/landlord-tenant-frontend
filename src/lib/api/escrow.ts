import apiClient from "./client"

export type EscrowStatus = "holding" | "released" | "refunded"

export interface RentEscrow {
  id: string
  paymentId: string
  tenancyId: string
  tenantUserId: string
  landlordUserId: string
  grossAmountKobo: number
  commissionKobo: number
  netAmountKobo: number
  status: EscrowStatus
  releaseAfter: string
  confirmedAt?: string | null
  releasedAt?: string | null
  releaseReason?: "tenant_confirmed" | "auto_release" | "admin_release" | null
  refundedAt?: string | null
  refundReason?: string | null
  createdAt: string
  updatedAt: string
  tenancy?: {
    id: string
    unitId: string
    unit?: {
      id: string
      unitNumber?: string
      property?: {
        id: string
        name?: string
        address?: string
        city?: string
        state?: string
      }
    }
  }
}

export interface MyEscrows {
  asTenant: RentEscrow[]
  asLandlord: RentEscrow[]
}

export const escrowApi = {
  listMine: () => apiClient.get<MyEscrows>("/escrow"),

  confirm: (id: string) => apiClient.post<RentEscrow>(`/escrow/${id}/confirm`),

  // Admin-only at the backend; surfaced here for the admin UI later.
  refund: (id: string, reason: string) =>
    apiClient.post<RentEscrow>(`/escrow/${id}/refund`, { reason }),
}
