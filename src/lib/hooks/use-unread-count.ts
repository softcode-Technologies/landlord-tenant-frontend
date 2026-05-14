import { useQuery } from "@tanstack/react-query"
import { notificationsApi } from "@/lib/api/notifications"
import { useAuthStore } from "@/lib/store/auth"

export function useUnreadCount(): number {
  const { user } = useAuthStore()

  const { data } = useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30_000,
    enabled: !!user,
  })

  return data?.data?.count ?? 0
}
