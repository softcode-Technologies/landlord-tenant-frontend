import apiClient from "./client"
import type { Notification } from "@/lib/types"
import type { PaginatedResponse } from "@/lib/types"

export const notificationsApi = {
  getNotifications: () =>
    apiClient.get<PaginatedResponse<Notification>>("/notifications"),

  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () => apiClient.patch("/notifications/read-all"),
}
