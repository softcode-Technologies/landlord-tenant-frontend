"use client"

import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { paymentsApi } from "@/lib/api/payments"
import { userApi } from "@/lib/api/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNairaAmount, formatDate, getStatusVariant, extractApiError } from "@/lib/utils"
import { ArrowLeft, MapPin, Calendar, Wallet, Wrench, FileText, Loader2, ExternalLink } from "lucide-react"
import { RentHistoryCard } from "@/components/shared/rent-history-card"
import Link from "next/link"
import { toast } from "sonner"

export default function TenantTenancyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["tenancy", id],
    queryFn: () => tenanciesApi.getTenancy(id),
  })

  const { data: agreementData } = useQuery({
    queryKey: ["agreement", id],
    queryFn: () => userApi.getAgreement(id),
    retry: false,
  })

  const payRentMutation = useMutation({
    // Full rent payment — backend charges the full amount; no kobo math here.
    mutationFn: () => paymentsApi.payRent(id),
    onSuccess: (res) => {
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl
      }
    },
    onError: () => {
      toast.error("Failed to initiate payment")
    },
  })

  const signMutation = useMutation({
    mutationFn: () => userApi.signAgreement(agreement!.id),
    onSuccess: () => {
      toast.success("Agreement signed successfully!")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to sign agreement")),
  })

  const rejectMutation = useMutation({
    mutationFn: () => userApi.rejectAgreement(agreement!.id),
    onSuccess: () => {
      toast.success("Agreement rejected")
      queryClient.invalidateQueries({ queryKey: ["agreement", id] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to reject agreement")),
  })

  const tenancy = data?.data
  const agreement = agreementData?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
          </div>
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!tenancy) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Tenancy not found</p>
        <Link href="/tenant/tenancies">
          <Button className="mt-4">Back to Tenancies</Button>
        </Link>
      </div>
    )
  }

  // Next annual rent due: the recorded date, or a projection one year after the
  // start date if no payment has set it yet.
  const nextRentDue = (() => {
    if (tenancy.nextDueDate) return formatDate(tenancy.nextDueDate)
    const d = new Date(tenancy.startDate)
    d.setFullYear(d.getFullYear() + 1)
    return formatDate(d.toISOString())
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/tenant/tenancies">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenancy Details</h1>
          <p className="text-slate-500 text-sm">ID: {id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Property Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Property Information</CardTitle>
                <Badge variant={getStatusVariant(tenancy.status)} className="capitalize">
                  {tenancy.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenancy.property && (
                <>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {tenancy.property.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {tenancy.property.address}, {tenancy.property.city},{" "}
                      {tenancy.property.state}
                    </div>
                  </div>
                </>
              )}

              {tenancy.unit && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-1">Unit</p>
                  <p className="font-semibold text-slate-900">{tenancy.unit.unitNumber}</p>
                  <p className="text-sm text-slate-500">
                    {tenancy.unit.bedrooms} bed &middot; {tenancy.unit.bathrooms} bath
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Start Date</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-sm">{formatDate(tenancy.startDate)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">End Date</p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-sm">{formatDate(tenancy.endDate)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Annual Rent</span>
                  <span className="text-xl font-bold text-[#1a3c5e]">
                    {formatNairaAmount(tenancy.rentAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Next Rent Due</span>
                  <span className="text-sm font-medium text-slate-900">{nextRentDue}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rent History */}
          <RentHistoryCard tenancyId={id} />

          {/* Deposit Info */}
          <Card>
            <CardHeader>
              <CardTitle>Security Deposit</CardTitle>
            </CardHeader>
            <CardContent>
              {tenancy.depositAmount ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <span className="text-sm text-slate-600">Deposit Amount</span>
                    <span className="font-bold text-slate-900">
                      {formatNairaAmount(tenancy.depositAmount)}
                    </span>
                  </div>
                  {tenancy.depositPaidAt && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <span className="text-sm text-green-700">Paid On</span>
                      <span className="text-sm font-medium text-green-800">
                        {formatDate(tenancy.depositPaidAt)}
                      </span>
                    </div>
                  )}
                  {tenancy.depositReturnedAt && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                      <span className="text-sm text-blue-700">Returned On</span>
                      <span className="text-sm font-medium text-blue-800">
                        {formatDate(tenancy.depositReturnedAt)}
                      </span>
                    </div>
                  )}
                  {tenancy.depositNote && (
                    <p className="text-xs text-slate-500">{tenancy.depositNote}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">No deposit information recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Agreement */}
          {agreement && (
            <Card>
              <CardHeader>
                <CardTitle>Tenancy Agreement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Status</span>
                  <Badge
                    variant={getStatusVariant(agreement.status)}
                    className="capitalize"
                  >
                    {agreement.status.replace(/_/g, " ")}
                  </Badge>
                </div>

                {agreement.documentUrl && (
                  <a
                    href={agreement.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#1a3c5e] hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    View Agreement Document
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}

                {agreement.tenantSignedAt && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="text-sm text-green-700">Signed by you</span>
                    <span className="text-sm font-medium text-green-800">
                      {formatDate(agreement.tenantSignedAt)}
                    </span>
                  </div>
                )}

                {agreement.status === "sent" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => signMutation.mutate()}
                      disabled={signMutation.isPending}
                    >
                      {signMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sign Agreement"
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2 text-red-500 border-red-200"
                      onClick={() => rejectMutation.mutate()}
                      disabled={rejectMutation.isPending}
                    >
                      {rejectMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Actions sidebar */}
        <div className="space-y-4">
          {tenancy.status === "active" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full gap-2"
                  onClick={() => payRentMutation.mutate()}
                  disabled={payRentMutation.isPending}
                >
                  {payRentMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  Pay Rent
                </Button>

                <Link href="/tenant/maintenance" className="block">
                  <Button variant="outline" className="w-full gap-2">
                    <Wrench className="h-4 w-4" />
                    Submit Maintenance
                  </Button>
                </Link>

                {!agreement && (
                  <Button variant="outline" className="w-full gap-2" disabled>
                    <FileText className="h-4 w-4" />
                    No Agreement Yet
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Landlord Info */}
          {tenancy.landlord && (
            <Card>
              <CardHeader>
                <CardTitle>Landlord</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-slate-900">
                  {tenancy.landlord.firstName} {tenancy.landlord.lastName}
                </p>
                <p className="text-sm text-slate-500">{tenancy.landlord.phone}</p>
                <Link href="/tenant/messages" className="mt-3 block">
                  <Button variant="outline" className="w-full text-sm" size="sm">
                    Send Message
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
