import apiClient from "./client"
import type { InspectionSchedule } from "@/lib/types"

export const inspectionsApi = {
  // When the unlock fee is enabled, returns a paymentUrl to redirect to. When
  // disabled (launch promo), access is granted immediately and `free` is true.
  unlockListing: (listingId: string) =>
    apiClient.post<{ free: boolean; paymentUrl?: string; feeKobo: number }>(
      `/inspections/listings/${listingId}/unlock`,
    ),

  getUnlockConfig: () =>
    apiClient.get<{ feeEnabled: boolean; feeKobo: number }>("/inspections/unlock-config"),

  getListingContact: (listingId: string) =>
    apiClient.get<{
      listing: { id: string; title: string; rentPerAnnum: number }
      property: { name: string; address: string; city: string; state: string }
      lister: { type: string; name: string; phone: string; email: string | null; isVerified: boolean; agencyName?: string }
      access: { source: string; expiresAt: string | null; accessedAt: string }
    }>(
      `/inspections/listings/${listingId}/contact`
    ),

  sendInspectionInvite: (listingId: string, inviteePhone: string) =>
    apiClient.post(`/inspections/listings/${listingId}/invite`, { inviteePhone }),

  acceptInspectionInvite: (token: string) =>
    apiClient.post(`/invite/${token}/accept`),

  scheduleInspection: (
    listingId: string,
    data: { scheduledAt: string; note?: string }
  ) => apiClient.post(`/inspections/listings/${listingId}/schedule`, data),

  getAllListerSchedules: () =>
    apiClient.get<InspectionSchedule[]>("/inspections/lister/schedules"),

  getListerSchedules: (listingId: string) =>
    apiClient.get<InspectionSchedule[]>(
      `/inspections/listings/${listingId}/schedules`
    ),

  getMySchedules: () =>
    apiClient.get<InspectionSchedule[]>("/inspections/my-schedules"),

  confirmSchedule: (id: string, listerNote?: string) =>
    apiClient.patch(`/inspections/schedules/${id}/confirm`, { listerNote }),

  cancelSchedule: (id: string, note?: string) =>
    apiClient.patch(`/inspections/schedules/${id}/cancel`, { note }),

  completeSchedule: (id: string) =>
    apiClient.patch(`/inspections/schedules/${id}/complete`),

  markNoShow: (id: string) =>
    apiClient.patch(`/inspections/schedules/${id}/no-show`),

  revokeInvite: (inviteId: string) =>
    apiClient.delete(`/inspections/invite/${inviteId}`),
}
