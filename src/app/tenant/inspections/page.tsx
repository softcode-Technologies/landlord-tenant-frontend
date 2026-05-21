"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { inspectionsApi } from "@/lib/api/inspections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatDateTime, getStatusVariant, extractApiError } from "@/lib/utils"
import { Calendar, MapPin, Loader2, X } from "lucide-react"
import { toast } from "sonner"

export default function TenantInspectionsPage() {
  const queryClient = useQueryClient()
  const [cancelId, setCancelId] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["my-schedules"],
    queryFn: () => inspectionsApi.getMySchedules(),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => inspectionsApi.cancelSchedule(id),
    onSuccess: () => {
      toast.success("Inspection cancelled")
      queryClient.invalidateQueries({ queryKey: ["my-schedules"] })
      setCancelId(null)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to cancel inspection")),
  })

  const schedules = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Inspections</h1>
        <p className="text-slate-500 mt-1">Track your property inspection schedules</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No inspections scheduled"
          description="Browse listings and book an inspection to view a property."
          actionLabel="Browse Listings"
          actionHref="/listings"
        />
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const canCancel = schedule.status === "pending" || schedule.status === "confirmed"
            return (
              <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">
                        {schedule.listing?.title ?? "Property Inspection"}
                      </h3>
                      {schedule.listing?.property && (
                        <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                          <MapPin className="h-3.5 w-3.5" />
                          {schedule.listing.property.city}, {schedule.listing.property.state}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-[#1a3c5e]" />
                        <span>{formatDateTime(schedule.scheduledAt)}</span>
                      </div>
                      {schedule.note && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg px-3 py-2">
                          {schedule.note}
                        </p>
                      )}
                      {schedule.listerNote && (
                        <div className="mt-2 bg-blue-50 rounded-xl p-2.5">
                          <p className="text-xs font-medium text-blue-700 mb-0.5">
                            Landlord note:
                          </p>
                          <p className="text-xs text-blue-600">{schedule.listerNote}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge variant={getStatusVariant(schedule.status)} className="capitalize">
                        {schedule.status}
                      </Badge>
                      {canCancel && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => setCancelId(schedule.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel inspection?</DialogTitle>
            <DialogDescription>
              This frees you to book a new inspection for this listing. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)} disabled={cancelMutation.isPending}>
              Keep it
            </Button>
            <Button
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              disabled={cancelMutation.isPending}
              onClick={() => cancelId && cancelMutation.mutate(cancelId)}
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cancel inspection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
