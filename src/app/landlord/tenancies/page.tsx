"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { tenanciesApi } from "@/lib/api/tenancies"
import { messagingApi } from "@/lib/api/messaging"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatNairaAmount, formatDate, getStatusVariant, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, ArrowRight, MessageCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function LandlordTenanciesPage() {
  const router = useRouter()

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-tenancies"],
    queryFn: () => tenanciesApi.getLandlordTenancies(),
  })

  const tenancies = data?.data ?? []

  const messageMutation = useMutation({
    mutationFn: (recipientUserId: string) =>
      messagingApi.createConversation({
        recipientUserId,
        body: "Hello! I'm reaching out regarding your tenancy.",
      }),
    onSuccess: () => {
      toast.success("Conversation started!")
      router.push("/landlord/messages")
    },
    onError: () => toast.error("Failed to start conversation."),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tenancies</h1>
        <p className="text-slate-500 mt-1">Manage all your tenant relationships</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : tenancies.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenancies yet"
          description="Send invites to your tenants to get them onboarded."
          actionLabel="Send Invite"
          actionHref="/landlord/invites"
        />
      ) : (
        <div className="space-y-4">
          {tenancies.map((tenancy) => {
            const tenantName =
              tenancy.tenant
                ? `${tenancy.tenant.firstName ?? ""} ${tenancy.tenant.lastName ?? ""}`.trim() || "Tenant"
                : "Unknown Tenant"

            return (
              <Card key={tenancy.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={tenancy.tenant?.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {getInitials(tenantName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-900">{tenantName}</h3>
                        <Badge
                          variant={getStatusVariant(tenancy.status)}
                          className="capitalize text-xs"
                        >
                          {tenancy.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {tenancy.property?.name ?? tenancy.unit?.unitNumber}
                        {tenancy.tenant?.phone && ` · ${tenancy.tenant.phone}`}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#1a3c5e]">
                        {formatNairaAmount(tenancy.rentAmount)}/yr
                      </p>
                      <p className="text-xs text-slate-400">
                        Until {formatDate(tenancy.endDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tenancy.tenantUserId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => messageMutation.mutate(tenancy.tenantUserId)}
                          disabled={messageMutation.isPending}
                        >
                          {messageMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageCircle className="h-3.5 w-3.5" />
                          )}
                          Message
                        </Button>
                      )}
                      <Link href={`/landlord/tenancies/${tenancy.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
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
