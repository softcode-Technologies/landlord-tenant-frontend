"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { invitesApi } from "@/lib/api/invites"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatNairaAmount, formatDate, getStatusVariant } from "@/lib/utils"
import { Home, MapPin, ArrowRight, Mail, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function TenantTenanciesPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["tenant-tenancies"],
    queryFn: () => tenanciesApi.getTenantTenancies(),
  })

  const { data: invitesData, isLoading: invitesLoading } = useQuery({
    queryKey: ["my-invites"],
    queryFn: () => invitesApi.getMyInvites(),
  })

  const acceptMutation = useMutation({
    mutationFn: (code: string) => invitesApi.acceptInvite(code),
    onSuccess: () => {
      toast.success("Invite accepted! Welcome to your new home.")
      queryClient.invalidateQueries({ queryKey: ["my-invites"] })
      queryClient.invalidateQueries({ queryKey: ["tenant-tenancies"] })
    },
    onError: () => {
      toast.error("Failed to accept invite. Please try again.")
    },
  })

  const tenancies = data?.data ?? []
  const pendingInvites = invitesData?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tenancies</h1>
        <p className="text-slate-500 mt-1">All your rental agreements</p>
      </div>

      {/* Pending Invites */}
      {!invitesLoading && pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#f97316]" />
            Pending Invites
          </h2>
          {pendingInvites.map((invite) => (
            <Card key={invite.id} className="border-orange-200 bg-orange-50">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">
                        {invite.unit?.property?.name ?? "Property Invite"}
                      </h3>
                      <Badge variant="warning" className="capitalize">Pending</Badge>
                    </div>

                    {invite.unit?.property && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mb-2">
                        <MapPin className="h-3.5 w-3.5" />
                        {invite.unit.property.city}, {invite.unit.property.state}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 mt-2">
                      {invite.unit && (
                        <div>
                          <p className="text-xs text-slate-400">Unit</p>
                          <p className="text-sm font-medium text-slate-700">{invite.unit.unitNumber}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-slate-400">Annual Rent</p>
                        <p className="text-base font-bold text-[#1a3c5e]">
                          {formatNairaAmount(invite.rentAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Start</p>
                        <p className="text-sm font-medium text-slate-700">{formatDate(invite.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">End</p>
                        <p className="text-sm font-medium text-slate-700">{formatDate(invite.endDate)}</p>
                      </div>
                      {invite.expiresAt && (
                        <div>
                          <p className="text-xs text-slate-400">Invite Expires</p>
                          <p className="text-sm font-medium text-orange-600">{formatDate(invite.expiresAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="gap-1.5 shrink-0 bg-[#1a3c5e] hover:bg-[#1a3c5e]/90"
                    onClick={() => acceptMutation.mutate(invite.inviteCode)}
                    disabled={acceptMutation.isPending}
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Accept
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tenancies */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tenancies.length === 0 && pendingInvites.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No tenancies yet"
          description="You haven't rented any properties yet. Browse our listings to find your perfect home."
          actionLabel="Browse Listings"
          actionHref="/listings"
        />
      ) : tenancies.length === 0 ? null : (
        <div className="space-y-4">
          {tenancies.map((tenancy) => (
            <Card key={tenancy.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {tenancy.property?.name ?? tenancy.unit?.unitNumber ?? "Property"}
                      </h3>
                      <Badge variant={getStatusVariant(tenancy.status)} className="capitalize">
                        {tenancy.status}
                      </Badge>
                    </div>

                    {tenancy.property && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                        <MapPin className="h-3.5 w-3.5" />
                        {tenancy.property.address}, {tenancy.property.city},{" "}
                        {tenancy.property.state}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Annual Rent</p>
                        <p className="text-base font-bold text-[#1a3c5e]">
                          {formatNairaAmount(tenancy.rentAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Start</p>
                        <p className="text-sm font-medium text-slate-700">
                          {formatDate(tenancy.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">End</p>
                        <p className="text-sm font-medium text-slate-700">
                          {formatDate(tenancy.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link href={`/tenant/tenancies/${tenancy.id}`}>
                    <Button variant="outline" size="sm" className="gap-1 shrink-0">
                      Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
