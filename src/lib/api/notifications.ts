import apiClient from "./client"
import type { Notification } from "@/lib/types"
import type { PaginatedResponse } from "@/lib/types"

export const notificationsApi = {
  getNotifications: (params?: { page?: number; unreadOnly?: boolean }) =>
    apiClient.get<PaginatedResponse<Notification>>("/notifications", { params }),

  getUnreadCount: () =>
    apiClient.get<{ count: number }>("/notifications/unread-count"),

  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () => apiClient.patch("/notifications/read-all"),
}
