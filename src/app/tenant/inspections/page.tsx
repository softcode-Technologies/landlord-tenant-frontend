"use client"

import { useQuery } from "@tanstack/react-query"
import { inspectionsApi } from "@/lib/api/inspections"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDateTime, getStatusVariant } from "@/lib/utils"
import { Calendar, MapPin } from "lucide-react"

export default function TenantInspectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-schedules"],
    queryFn: () => inspectionsApi.getMySchedules(),
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
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">
                      {schedule.listing?.title ?? "Property Inspection"}
                    </h3>
                    {schedule.listing && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {schedule.listing.city}, {schedule.listing.state}
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
                  <Badge
                    variant={getStatusVariant(schedule.status)}
                    className="capitalize shrink-0"
                  >
                    {schedule.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
