"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { notificationsApi } from "@/lib/api/notifications"
import type { Notification, NotificationType } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatRelativeTime } from "@/lib/utils"
import {
  Bell, CheckCheck, Calendar, CheckCircle2, AlertTriangle,
  Mail, Wrench, Megaphone, Unlock, XCircle, ExternalLink,
} from "lucide-react"
import { toast } from "sonner"
import type { LucideIcon } from "lucide-react"

type NotifType = NotificationType

interface NotifConfig {
  icon: LucideIcon
  color: string
  bg: string
  label: string
  href: (meta: Record<string, unknown>, role: "tenant" | "landlord") => string | null
}

const NOTIF_CONFIG: Record<NotifType, NotifConfig> = {
  rent_reminder: {
    icon: Calendar,
    color: "text-orange-600",
    bg: "bg-orange-50",
    label: "Rent Due",
    href: (_, role) => (role === "tenant" ? "/tenant/wallet" : "/landlord/tenancies"),
  },
  payment_confirmed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Payment",
    href: (_, role) => (role === "tenant" ? "/tenant/wallet" : "/landlord/analytics"),
  },
  tenancy_expiring: {
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Tenancy",
    href: (_, role) => `/${role}/tenancies`,
  },
  invite_received: {
    icon: Mail,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Invite",
    href: () => "/tenant/tenancies",
  },
  inspection_unlocked: {
    icon: Unlock,
    color: "text-purple-600",
    bg: "bg-purple-50",
    label: "Inspection",
    href: (_, role) => `/${role}/inspections`,
  },
  inspection_scheduled: {
    icon: Calendar,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Inspection",
    href: (_, role) => `/${role}/inspections`,
  },
  inspection_confirmed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Inspection",
    href: (_, role) => `/${role}/inspections`,
  },
  inspection_cancelled: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Inspection",
    href: (_, role) => `/${role}/inspections`,
  },
  inspection_completed: {
    icon: CheckCircle2,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "Inspection",
    href: (_, role) => `/${role}/inspections`,
  },
  maintenance_update: {
    icon: Wrench,
    color: "text-slate-600",
    bg: "bg-slate-50",
    label: "Maintenance",
    href: (_, role) => `/${role}/maintenance`,
  },
  broadcast: {
    icon: Megaphone,
    color: "text-[#1a3c5e]",
    bg: "bg-[#1a3c5e]/5",
    label: "Announcement",
    href: () => null,
  },
}

interface Props {
  role: "tenant" | "landlord"
}

export function NotificationsCenter({ role }: Props) {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<"all" | "unread">("all")

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: () => notificationsApi.getNotifications({ unreadOnly: filter === "unread" }),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] })
      toast.success("All notifications marked as read")
    },
  })

  const notifications = data?.data?.data ?? []
  const total = data?.data?.pagination?.total ?? 0
  const unreadCount = filter === "all"
    ? notifications.filter((n) => !n.isRead).length
    : notifications.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f
                ? "bg-[#1a3c5e] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {f === "all" ? `All (${total})` : "Unread"}
          </button>
        ))}
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
          description={
            filter === "unread"
              ? "No unread notifications. You're all caught up!"
              : "Notifications about your activity will appear here."
          }
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const config = NOTIF_CONFIG[notification.type] ?? NOTIF_CONFIG.broadcast
            const Icon = config.icon
            const actionHref = config.href(notification.metadata ?? notification.data ?? {}, role)

            const cardContent = (
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${notification.isRead ? "bg-slate-100" : config.bg}`}>
                    <Icon className={`h-4 w-4 ${notification.isRead ? "text-slate-400" : config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm font-semibold ${notification.isRead ? "text-slate-700" : "text-slate-900"}`}>
                            {notification.title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-1.5 py-0 ${notification.isRead ? "" : `${config.bg} ${config.color} border-0`}`}
                          >
                            {config.label}
                          </Badge>
                          {!notification.isRead && (
                            <span className="h-2 w-2 rounded-full bg-[#1a3c5e] shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                        {actionHref && (
                          <ExternalLink className="h-3 w-3 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )

            const handleRead = () => {
              if (!notification.isRead) markReadMutation.mutate(notification.id)
            }

            return actionHref ? (
              <Link key={notification.id} href={actionHref} onClick={handleRead}>
                <Card className={`transition-all hover:shadow-md cursor-pointer ${!notification.isRead ? "border-[#1a3c5e]/20 bg-blue-50/20" : ""}`}>
                  {cardContent}
                </Card>
              </Link>
            ) : (
              <Card
                key={notification.id}
                onClick={handleRead}
                className={`transition-all hover:shadow-sm cursor-pointer ${!notification.isRead ? "border-[#1a3c5e]/20 bg-blue-50/20" : ""}`}
              >
                {cardContent}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
