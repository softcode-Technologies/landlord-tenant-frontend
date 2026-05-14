"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { inspectionsApi } from "@/lib/api/inspections"
import { propertiesApi } from "@/lib/api/properties"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDateTime, getStatusVariant, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, CheckCircle2, X, AlertCircle, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import type { InspectionSchedule } from "@/lib/types"

export default function LandlordInspectionsPage() {
  const queryClient = useQueryClient()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteListingId, setInviteListingId] = useState("")
  const [invitePhone, setInvitePhone] = useState("")

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesApi.getProperties(),
  })

  const properties = propertiesData?.data ?? []
  const allListings = properties.flatMap((p) =>
    p.units?.filter((u) => u.listing).map((u) => ({
      id: u.listing!.id,
      title: u.listing!.title ?? u.label,
    })) ?? []
  )
  const allListingIds = allListings.map((l) => l.id)

  const { data: schedulesRaw, isLoading: schedulesLoading } = useQuery({
    queryKey: ["lister-schedules-all", allListingIds],
    queryFn: async () => {
      const results = await Promise.all(
        allListingIds.map((listingId) => inspectionsApi.getListerSchedules(listingId))
      )
      return results.flatMap((r) => (r.data ?? []) as InspectionSchedule[])
    },
    enabled: !propertiesLoading && allListingIds.length > 0,
  })

  const isLoading = propertiesLoading || schedulesLoading
  const schedules: InspectionSchedule[] = schedulesRaw ?? []

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["lister-schedules-all"] })

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

  const inviteMutation = useMutation({
    mutationFn: () =>
      inspectionsApi.sendInspectionInvite(inviteListingId, invitePhone.trim()),
    onSuccess: () => {
      toast.success("Inspection invite sent!")
      setInviteOpen(false)
      setInviteListingId("")
      setInvitePhone("")
    },
    onError: () => toast.error("Failed to send invite"),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inspection Schedules</h1>
          <p className="text-slate-500 mt-1">Manage inspection requests for your listings</p>
        </div>
        <Button className="gap-2" onClick={() => setInviteOpen(true)} disabled={allListings.length === 0}>
          <Send className="h-4 w-4" />
          Send Invite
        </Button>
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
          title="No inspection requests"
          description="Tenants who are interested in your listings will request inspections here."
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
                        <AvatarFallback className="text-xs">
                          {getInitials(tenantName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900">{tenantName}</h3>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateTime(schedule.scheduledAt)}
                        </div>
                        {schedule.note && (
                          <p className="text-xs text-slate-400 mt-1">{schedule.note}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={getStatusVariant(schedule.status)}
                        className="capitalize"
                      >
                        {schedule.status}
                      </Badge>

                      {schedule.status === "pending" && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => confirmMutation.mutate(schedule.id)}
                            disabled={confirmMutation.isPending}
                          >
                            {confirmMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3 w-3" />
                            )}
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-red-500"
                            onClick={() => cancelMutation.mutate(schedule.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </Button>
                        </div>
                      )}

                      {schedule.status === "confirmed" && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => completeMutation.mutate(schedule.id)}
                            disabled={completeMutation.isPending}
                          >
                            {completeMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : "Complete"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-orange-500"
                            onClick={() => noShowMutation.mutate(schedule.id)}
                            disabled={noShowMutation.isPending}
                          >
                            <AlertCircle className="h-3 w-3" />
                            No Show
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

      {/* Send Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Inspection Invite</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Select Listing</Label>
              <Select value={inviteListingId} onValueChange={setInviteListingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a listing..." />
                </SelectTrigger>
                <SelectContent>
                  {allListings.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-phone">Tenant Phone Number</Label>
              <Input
                id="invite-phone"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="+2348012345678"
              />
              <p className="text-xs text-slate-400">
                The tenant will receive an SMS with an inspection invite link.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteOpen(false)}
              disabled={inviteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={!inviteListingId || !invitePhone.trim() || inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
              className="gap-2"
            >
              {inviteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
