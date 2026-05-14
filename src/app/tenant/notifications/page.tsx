"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { notificationsApi } from "@/lib/api/notifications"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatRelativeTime } from "@/lib/utils"
import { Bell, CheckCheck } from "lucide-react"
import { toast } from "sonner"

export default function TenantNotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      toast.success("All notifications marked as read")
    },
  })

  const notifications = data?.data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="You&apos;re all caught up! Notifications about your tenancies will appear here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-sm cursor-pointer ${
                !notification.isRead ? "border-[#1a3c5e]/20 bg-blue-50/30" : ""
              }`}
              onClick={() => {
                if (!notification.isRead) markReadMutation.mutate(notification.id)
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      notification.isRead ? "bg-slate-100" : "bg-[#1a3c5e]/10"
                    }`}
                  >
                    <Bell
                      className={`h-4 w-4 ${
                        notification.isRead ? "text-slate-400" : "text-[#1a3c5e]"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-sm font-medium truncate ${
                          notification.isRead ? "text-slate-700" : "text-slate-900"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 shrink-0">
                        {!notification.isRead && (
                          <Badge className="bg-[#1a3c5e] text-white text-[10px] px-1.5">
                            New
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
