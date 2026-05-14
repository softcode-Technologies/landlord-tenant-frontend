"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/store/auth"
import { userApi } from "@/lib/api/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatDate } from "@/lib/utils"
import { User, Shield, CheckCircle2, AlertCircle, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

export default function TenantProfilePage() {
  const { user } = useAuthStore()
  const [kycUrl, setKycUrl] = useState("")

  const kycMutation = useMutation({
    mutationFn: () => userApi.submitKyc(kycUrl),
    onSuccess: () => {
      toast.success("KYC submitted successfully! We'll review it shortly.")
      setKycUrl("")
    },
    onError: () => {
      toast.error("Failed to submit KYC. Please try again.")
    },
  })

  if (!user) return null

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User"
  const kycStatus = (user as { kycStatus?: string }).kycStatus ?? "none"

  const KYC_STATUS_CONFIG: Record<string, { label: string; icon: typeof AlertCircle; color: string; bg: string; badgeVariant: "warning" | "success" | "destructive" | "secondary" }> = {
    none:     { label: "Not Submitted", icon: AlertCircle,   color: "text-slate-500",  bg: "bg-slate-50",   badgeVariant: "secondary"    },
    pending:  { label: "Pending Review", icon: AlertCircle,  color: "text-orange-600", bg: "bg-orange-50",  badgeVariant: "warning"      },
    approved: { label: "KYC Approved",   icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",   badgeVariant: "success"      },
    rejected: { label: "KYC Rejected",   icon: AlertCircle,  color: "text-red-600",    bg: "bg-red-50",     badgeVariant: "destructive"  },
  }

  const kycConfig = KYC_STATUS_CONFIG[kycStatus] ?? KYC_STATUS_CONFIG["none"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-xl">{getInitials(fullName)}</AvatarFallback>
                </Avatar>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{fullName}</h2>
              <p className="text-sm text-slate-500 mb-3">{user.phone}</p>

              <Badge variant={kycConfig.badgeVariant} className="mb-4">
                {kycConfig.label}
              </Badge>

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

          {/* KYC Verification */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#1a3c5e]" />
                <CardTitle>KYC Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-start gap-3 p-4 rounded-xl ${kycConfig.bg}`}>
                <kycConfig.icon className={`h-5 w-5 mt-0.5 ${kycConfig.color}`} />
                <div>
                  <p className={`font-semibold text-sm ${kycConfig.color}`}>
                    {kycConfig.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {kycStatus === "approved"
                      ? "Your identity has been verified. You have full access to the platform."
                      : kycStatus === "rejected"
                      ? "Your KYC was rejected. Please resubmit with clear, valid documents."
                      : "Submit a government-issued ID to verify your identity and access all features."}
                  </p>
                </div>
              </div>

              {kycStatus !== "approved" && (
                <div className="space-y-3">
                  <div>
                    <Label>KYC Document URL</Label>
                    <p className="text-xs text-slate-400 mt-0.5 mb-2">
                      Upload your document to a cloud service (Google Drive, Dropbox) and paste the link here
                    </p>
                    <Input
                      value={kycUrl}
                      onChange={(e) => setKycUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="mt-1"
                    />
                  </div>

                  <Button
                    onClick={() => kycMutation.mutate()}
                    disabled={!kycUrl || kycMutation.isPending}
                    className="gap-2"
                  >
                    {kycMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Submit for Verification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
