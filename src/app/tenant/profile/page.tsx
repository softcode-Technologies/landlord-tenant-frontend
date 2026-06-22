"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/store/auth"
import { userApi } from "@/lib/api/user"
import { authApi } from "@/lib/api/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileEditDialog } from "@/components/shared/profile-edit-dialog"
import { getInitials, formatDate, extractApiError } from "@/lib/utils"
import { User, AlertCircle, ShieldCheck, MessageCircle, Camera, Pencil } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function TenantProfilePage() {
  const { user, setUser } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)

  const whatsappMutation = useMutation({
    mutationFn: (optIn: boolean) => userApi.toggleWhatsappOptIn(optIn),
    onSuccess: async (res) => {
      const fresh = await authApi.me()
      setUser(fresh.data)
      toast.success(res.data.whatsappOptIn ? "WhatsApp reminders enabled." : "WhatsApp reminders disabled.")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to update WhatsApp preference.")),
  })

  if (!user) return null

  const fullName  = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User"
  const kycStatus = user.kycStatus ?? "none"

  const KYC_STATUS_CONFIG: Record<string, { label: string; icon: typeof AlertCircle; color: string; bg: string; badgeVariant: "warning" | "success" | "destructive" | "secondary" }> = {
    none:     { label: "Not Verified",   icon: AlertCircle,   color: "text-slate-500",  bg: "bg-slate-50",   badgeVariant: "secondary"   },
    pending:  { label: "Under Review",   icon: AlertCircle,   color: "text-orange-600", bg: "bg-orange-50",  badgeVariant: "warning"     },
    approved: { label: "ID Verified",    icon: ShieldCheck,   color: "text-green-600",  bg: "bg-green-50",   badgeVariant: "success"     },
    rejected: { label: "Rejected",       icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-50",     badgeVariant: "destructive" },
  }

  const kycConfig = KYC_STATUS_CONFIG[kycStatus] ?? KYC_STATUS_CONFIG["none"]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and verification</p>
        </div>
        <Button variant="outline" className="gap-2 shrink-0" onClick={() => setEditOpen(true)}>
          <Pencil className="h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="relative inline-block mb-4 group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Change profile picture"
              >
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-xl">{getInitials(fullName)}</AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </span>
              </button>
              <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
              <p className="text-sm text-slate-500 mb-3">{user.phone}</p>

              <Badge variant={kycConfig.badgeVariant} className="mb-2">
                {kycConfig.label}
              </Badge>

              {kycStatus !== "approved" && (
                <div className="mb-4">
                  <Link
                    href="/tenant/kyc"
                    className="text-xs text-[#1a3c5e] underline underline-offset-2 hover:text-[#f97316] transition-colors"
                  >
                    Manage verification →
                  </Link>
                </div>
              )}

              <div className="w-full border-t pt-4 space-y-2 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Member since</span>
                  <span className="font-medium">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Verified</span>
                  <span className={user.isVerified ? "text-green-600 font-medium" : "text-slate-400"}>
                    {user.isVerified ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium capitalize">Tenant</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-[#1a3c5e]" />
                <CardTitle>Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-500">First Name</Label>
                  <p className="font-medium text-slate-900 mt-1">
                    {user.firstName ?? "Not set"}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Last Name</Label>
                  <p className="font-medium text-slate-900 mt-1">
                    {user.lastName ?? "Not set"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-slate-500">Phone Number</Label>
                <p className="font-medium text-slate-900 mt-1">{user.phone}</p>
              </div>

              {user.email && (
                <div>
                  <Label className="text-xs text-slate-500">Email</Label>
                  <p className="font-medium text-slate-900 mt-1">{user.email}</p>
                </div>
              )}

              {user.tenantProfile?.occupation && (
                <div>
                  <Label className="text-xs text-slate-500">Occupation</Label>
                  <p className="font-medium text-slate-900 mt-1">
                    {user.tenantProfile.occupation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
                <CardTitle>WhatsApp Notifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">Rent & maintenance alerts</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Receive reminders for upcoming rent, payment confirmations, and maintenance updates on WhatsApp.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={user.whatsappOptIn ?? false}
                  onClick={() => whatsappMutation.mutate(!(user.whatsappOptIn ?? false))}
                  disabled={whatsappMutation.isPending}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    user.whatsappOptIn ? "bg-[#25D366]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      user.whatsappOptIn ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
