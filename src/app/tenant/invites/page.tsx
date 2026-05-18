"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { invitesApi } from "@/lib/api/invites"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatNairaAmount, formatDate, extractApiError } from "@/lib/utils"
import { Home, Calendar, KeyRound, ArrowRight, Loader2, Clock, MapPin } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

export default function TenantInvitesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [busyCode, setBusyCode] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["my-invites"],
    queryFn: () => invitesApi.getMyInvites(),
  })
  const invites = data?.data ?? []

  const acceptMutation = useMutation({
    mutationFn: (code: string) => invitesApi.acceptInvite(code),
    onMutate: (code) => setBusyCode(code),
    onSettled: () => setBusyCode(null),
    onSuccess: () => {
      toast.success("Tenancy invite accepted! Welcome home.")
      queryClient.invalidateQueries({ queryKey: ["my-invites"] })
      queryClient.invalidateQueries({ queryKey: ["tenant-tenancies"] })
      router.push("/tenant/tenancies")
    },
    onError: (err) => toast.error(extractApiError(err, "Failed to accept invite")),
  })

  const pending = invites.filter((i) => i.status === "pending")
  const history = invites.filter((i) => i.status !== "pending")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tenancy invites</h1>
        <p className="text-slate-500 mt-1">
          Invites a landlord has sent you to move into one of their units.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={KeyRound}
              title="No tenancy invites yet"
              description="When a landlord invites you to move in, it will appear here. You can also paste an invite code below."
              actionLabel="Browse listings"
              actionHref="/listings"
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Pending — {pending.length}
              </p>
              {pending.map((inv) => {
                const propertyName = inv.unit?.unitNumber
                  ? `Unit ${inv.unit.unitNumber}`
                  : "A unit"
                const isBusy = busyCode === inv.inviteCode
                const expires = inv.expiresAt ? new Date(inv.expiresAt) : null
                const daysLeft = expires
                  ? Math.max(0, Math.ceil((expires.getTime() - Date.now()) / 86400000))
                  : null

                return (
                  <Card key={inv.id} className="overflow-hidden">
                    <CardHeader className="bg-gradient-to-br from-[#1a3c5e]/5 to-[#f97316]/5 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Home className="h-4 w-4 text-[#1a3c5e]" />
                            Tenancy invite
                          </CardTitle>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {propertyName}
                          </p>
                        </div>
                        <Badge variant="secondary" className="capitalize gap-1">
                          <Clock className="h-3 w-3" />
                          {daysLeft !== null ? `Expires in ${daysLeft}d` : "Pending"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                        <div className="bg-slate-50 rounded-lg p-3 min-w-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Rent / year</p>
                          <p className="text-sm font-bold text-[#1a3c5e] mt-0.5 truncate">
                            {formatNairaAmount(inv.rentAmount)}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 min-w-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Start</p>
                          <p className="text-sm font-semibold mt-0.5 flex items-center gap-1 min-w-0">
                            <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                            <span className="truncate">{formatDate(inv.startDate)}</span>
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3 col-span-2 sm:col-span-1 min-w-0">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wide">Invite code</p>
                          <p className="text-sm font-mono font-semibold mt-0.5 break-all">
                            {inv.inviteCode}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                        <Link href={`/invite/${inv.inviteCode}`} className="w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="gap-1.5 w-full sm:w-auto">
                            View details
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="gap-1.5 bg-[#f97316] hover:bg-[#ea6b0e] w-full sm:w-auto"
                          onClick={() => acceptMutation.mutate(inv.inviteCode)}
                          disabled={isBusy}
                        >
                          {isBusy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <KeyRound className="h-3.5 w-3.5" />
                          )}
                          Accept invite
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {history.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                History
              </p>
              {history.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-slate-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {inv.unit?.unitNumber ? `Unit ${inv.unit.unitNumber}` : "Tenancy invite"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {formatNairaAmount(inv.rentAmount)} / year · {formatDate(inv.createdAt)}
                    </p>
                  </div>
                  <Badge
                    variant={inv.status === "accepted" ? "success" : "outline"}
                    className="capitalize shrink-0"
                  >
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
