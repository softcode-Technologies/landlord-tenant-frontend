"use client"

import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation } from "@tanstack/react-query"
import { invitesApi } from "@/lib/api/invites"
import { useAuthStore } from "@/lib/store/auth"
import type { AxiosError } from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNairaAmount, formatDate } from "@/lib/utils"
import { Building2, Calendar, CheckCircle2, MapPin, Loader2, Home } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function InvitePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ["invite", code],
    queryFn: () => invitesApi.getInviteByCode(code),
    enabled: !!code,
    retry: false,
  })

  const acceptMutation = useMutation({
    mutationFn: () => invitesApi.acceptInvite(code),
    onSuccess: () => {
      toast.success("Invite accepted! Welcome to your new home.")
      router.push("/tenant/tenancies")
    },
    onError: () => {
      toast.error("Failed to accept invite. Please try again.")
    },
  })

  const handleAccept = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/invite/${code}`)
      return
    }
    acceptMutation.mutate()
  }

  const invite = data?.data

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !invite) {
    const axiosError = error as AxiosError<{ error: { message: string } }> | null
    const backendMessage = axiosError?.response?.data?.error?.message
    const errorMessage =
      backendMessage ??
      (error ? "Unable to load invite. Please try again." : "This invite link is invalid, expired, or has already been used.")

    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invite Not Found</h2>
          <p className="text-slate-500 mb-6">{errorMessage}</p>
          <Link href="/listings">
            <Button>Browse Listings</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isExpired =
    invite.status !== "pending" ||
    (invite.expiresAt && new Date(invite.expiresAt) < new Date())

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#1a3c5e] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1a3c5e]">
              Naija<span className="text-[#f97316]">Rental</span>
            </span>
          </Link>
        </div>

        <Card className="overflow-hidden">
          {/* Top gradient */}
          <div className="h-2 bg-gradient-to-r from-[#1a3c5e] to-[#f97316]" />

          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
              <Home className="h-7 w-7 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Tenancy Invite</CardTitle>
            <p className="text-slate-500 text-sm mt-1">
              You&apos;ve been invited to become a tenant!
            </p>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            {/* Status */}
            <div className="flex justify-center">
              <Badge
                variant={invite.status === "pending" ? "default" : "secondary"}
                className="capitalize"
              >
                {invite.status}
              </Badge>
            </div>

            {/* Invite Details */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">For</span>
                <span className="text-sm font-semibold text-slate-900">
                  {invite.firstName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Annual Rent</span>
                <span className="text-lg font-bold text-[#1a3c5e]">
                  {formatNairaAmount(invite.rentAmount)}
                </span>
              </div>

              {invite.unit && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Unit</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {invite.unit.unitNumber}
                  </span>
                </div>
              )}

              {invite.unit?.property && (
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-slate-500 shrink-0">Property</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {invite.unit.property.name}
                    </p>
                    <div className="flex items-center gap-1 justify-end text-xs text-slate-400 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {invite.unit.property.city}, {invite.unit.property.state}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  Start Date
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatDate(invite.startDate)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  End Date
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {formatDate(invite.endDate)}
                </span>
              </div>
            </div>

            {invite.status === "accepted" ? (
              <div className="flex items-center gap-2 justify-center text-green-600 bg-green-50 rounded-xl p-3">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Invite already accepted</span>
              </div>
            ) : isExpired ? (
              <div className="text-center text-slate-500 bg-slate-50 rounded-xl p-3">
                <p className="font-medium">This invite has expired or been cancelled</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full h-12 text-base"
                  onClick={handleAccept}
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5" />
                  )}
                  Accept Invite
                </Button>
                {!isAuthenticated && (
                  <p className="text-xs text-slate-400 text-center">
                    You&apos;ll be prompted to log in first
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
