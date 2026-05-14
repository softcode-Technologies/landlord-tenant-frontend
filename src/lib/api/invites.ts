import apiClient from "./client"
import type { Invite } from "@/lib/types"

export interface CreateInviteData {
  unitId: string
  invitedPhone: string
  firstName: string
  rentAmount: number
  startDate: string
  endDate: string
}

export const invitesApi = {
  createInvite: (data: CreateInviteData) => apiClient.post<Invite>("/invites", data),

  getInvites: () => apiClient.get<Invite[]>("/invites"),

  getInviteByCode: (code: string) => apiClient.get<Invite>(`/invites/${code}`),

  acceptInvite: (code: string) => apiClient.post(`/invites/${code}/accept`),

  cancelInvite: (id: string) => apiClient.delete(`/invites/${id}/cancel`),
}
