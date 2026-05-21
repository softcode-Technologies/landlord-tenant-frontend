"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { inspectionsApi } from "@/lib/api/inspections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDateTime, getStatusVariant, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, CheckCircle2, X, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { InspectionSchedule } from "@/lib/types"

export default function AgentInspectionsPage() {
  const queryClient = useQueryClient()

  const { data: schedulesRaw, isLoading } = useQuery({
    queryKey: ["lister-schedules-all"],
    queryFn: () => inspectionsApi.getAllListerSchedules(),
  })

  const schedules: InspectionSchedule[] = schedulesRaw?.data ?? []
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["lister-schedules-all"] })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => inspectionsApi.confirmSchedule(id),
    onSuccess: () => { toast.success("Inspection confirmed!"); invalidate() },
  })
  const cancelMutation = useMutation({
    mutationFn: (id: string) => inspectionsApi.cancelSchedule(id),
    onSuccess: () => { toast.success("Inspection cancelled"); invalidate() },
  })
  const completeMutation = useMutation({
    mutationFn: (id: string) => inspectionsApi.completeSchedule(id),
    onSuccess: () => { toast.success("Marked as completed"); invalidate() },
  })
  const noShowMutation = useMutation({
    mutationFn: (id: string) => inspectionsApi.markNoShow(id),
    onSuccess: () => { toast.success("Marked as no-show"); invalidate() },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inspection Schedules</h1>
        <p className="text-slate-500 mt-1">Manage inspection requests for properties you manage</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No inspection requests"
          description="Inspection requests for your managed listings will appear here."
        />
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const tenantName = schedule.tenant
              ? `${schedule.tenant.firstName ?? ""} ${schedule.tenant.lastName ?? ""}`.trim() || "Tenant"
              : "Tenant"
            return (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="text-xs">{getInitials(tenantName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{tenantName}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateTime(schedule.scheduledAt)}
                        </div>
                        {schedule.note && <p className="text-xs text-slate-400 mt-1">{schedule.note}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusVariant(schedule.status)} className="capitalize">
                        {schedule.status}
                      </Badge>
                      {schedule.status === "pending" && (
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => confirmMutation.mutate(schedule.id)} disabled={confirmMutation.isPending}>
                            {confirmMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Confirm
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500" onClick={() => cancelMutation.mutate(schedule.id)} disabled={cancelMutation.isPending}>
                            <X className="h-3 w-3" /> Cancel
                          </Button>
                        </div>
                      )}
                      {schedule.status === "confirmed" && (
                        <div className="flex gap-1.5">
                          <Button size="sm" className="h-7 text-xs" onClick={() => completeMutation.mutate(schedule.id)} disabled={completeMutation.isPending}>
                            {completeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Complete"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-orange-500" onClick={() => noShowMutation.mutate(schedule.id)} disabled={noShowMutation.isPending}>
                            <AlertCircle className="h-3 w-3" /> No Show
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
