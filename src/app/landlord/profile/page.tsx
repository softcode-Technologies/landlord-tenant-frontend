"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/store/auth"
import { userApi } from "@/lib/api/user"
import { authApi } from "@/lib/api/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import {
  User, Building2, Banknote, Shield, CheckCircle2, AlertCircle, Loader2, Upload,
} from "lucide-react"
import { toast } from "sonner"

export default function LandlordProfilePage() {
  const { user, setUser } = useAuthStore()
  const lp = user?.landlordProfile

  const [firstName, setFirstName]           = useState(user?.firstName ?? "")
  const [lastName, setLastName]             = useState(user?.lastName ?? "")
  const [email, setEmail]                   = useState(user?.email ?? "")
  const [companyName, setCompanyName]       = useState(lp?.companyName ?? "")
  const [bio, setBio]                       = useState(lp?.bio ?? "")
  const [bankName, setBankName]             = useState(lp?.bankName ?? "")
  const [bankAccountNumber, setBankAccountNumber] = useState(lp?.bankAccountNumber ?? "")
  const [kycUrl, setKycUrl]                 = useState("")

  const profileMutation = useMutation({
    mutationFn: () => userApi.updateProfile({ firstName, lastName, email }),
    onSuccess: async () => {
      const fresh = await authApi.me()
      setUser(fresh.data)
      toast.success("Personal info updated.")
    },
    onError: () => toast.error("Failed to update profile."),
  })

  const landlordMutation = useMutation({
    mutationFn: () => userApi.updateLandlordProfile({ companyName, bio, bankName, bankAccountNumber }),
    onSuccess: async () => {
      const fresh = await authApi.me()
      setUser(fresh.data)
      toast.success("Business & bank details saved.")
    },
    onError: () => toast.error("Failed to save business details."),
  })

  const kycMutation = useMutation({
    mutationFn: () => userApi.submitKyc(kycUrl),
    onSuccess: () => {
      toast.success("KYC submitted! We'll review it shortly.")
      setKycUrl("")
    },
    onError: () => toast.error("Failed to submit KYC."),
  })

  if (!user) return null

  const fullName   = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Landlord"
  const kycStatus  = (user as { kycStatus?: string }).kycStatus ?? "none"

  const KYC_CONFIG: Record<string, {
    label: string; icon: typeof AlertCircle; color: string; bg: string
    badgeVariant: "warning" | "success" | "destructive" | "secondary"
  }> = {
    none:     { label: "Not Submitted",  icon: AlertCircle,   color: "text-slate-500",  bg: "bg-slate-50",  badgeVariant: "secondary"   },
    pending:  { label: "Pending Review", icon: AlertCircle,   color: "text-orange-600", bg: "bg-orange-50", badgeVariant: "warning"     },
    approved: { label: "KYC Approved",   icon: CheckCircle2,  color: "text-green-600",  bg: "bg-green-50",  badgeVariant: "success"     },
    rejected: { label: "KYC Rejected",   icon: AlertCircle,   color: "text-red-600",    bg: "bg-red-50",    badgeVariant: "destructive" },
  }
  const kycConfig = KYC_CONFIG[kycStatus] ?? KYC_CONFIG["none"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile & Settings</h1>
        <p className="text-slate-500 mt-1">Manage your personal info, business details, and bank account</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="h-20 w-20 mx-auto mb-4">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-2xl font-bold bg-[#1a3c5e]/10 text-[#1a3c5e]">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <p className="font-bold text-slate-900 text-lg">{fullName}</p>
              <Badge variant="secondary" className="mt-1">Landlord</Badge>
              {lp?.isVerified && (
                <div className="flex items-center justify-center gap-1 mt-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified Landlord
                </div>
              )}
              <div className="mt-4 text-left space-y-2">
                <div>
                  <p className="text-xs text-slate-400">Phone</p>
                  <p className="text-sm font-medium text-slate-700">{user.phone}</p>
                </div>
                {user.email && (
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-medium text-slate-700">{user.email}</p>
                  </div>
                )}
                {lp?.companyName && (
                  <div>
                    <p className="text-xs text-slate-400">Company</p>
                    <p className="text-sm font-medium text-slate-700">{lp.companyName}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* KYC */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#1a3c5e]" />
                <CardTitle>KYC Verification</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`flex items-start gap-3 p-3 rounded-xl ${kycConfig.bg}`}>
                <kycConfig.icon className={`h-5 w-5 mt-0.5 shrink-0 ${kycConfig.color}`} />
                <div>
                  <p className={`font-semibold text-sm ${kycConfig.color}`}>{kycConfig.label}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {kycStatus === "approved"
                      ? "Your identity is verified."
                      : kycStatus === "rejected"
                      ? "Please resubmit with clearer documents."
                      : "Submit a government-issued ID to get verified."}
                  </p>
                </div>
              </div>
              {kycStatus !== "approved" && (
                <div className="space-y-2">
                  <Label>Document URL</Label>
                  <Input
                    value={kycUrl}
                    onChange={(e) => setKycUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                  />
                  <Button
                    className="w-full gap-2"
                    onClick={() => kycMutation.mutate()}
                    disabled={!kycUrl || kycMutation.isPending}
                  >
                    {kycMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Submit KYC
                  </Button>
                </div>
              )}
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
                <div className="space-y-1.5">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last Name</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button
                onClick={() => profileMutation.mutate()}
                disabled={profileMutation.isPending}
                className="gap-2"
              >
                {profileMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Personal Info
              </Button>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#1a3c5e]" />
                <CardTitle>Business Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Company / Business Name</Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Simeon Properties Ltd"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell tenants about yourself..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Bank Account */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-[#1a3c5e]" />
                <CardTitle>Bank Account</CardTitle>
              </div>
              <p className="text-sm text-slate-500">
                This account receives rent payments from your tenants.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Bank Name</Label>
                <Input
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. First Bank, GTBank, Access Bank"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Account Number</Label>
                <Input
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="10-digit account number"
                  maxLength={10}
                />
              </div>
              {lp?.bankName && lp?.bankAccountNumber && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                  <p className="font-medium text-green-800">Current account on file</p>
                  <p className="text-green-600 mt-0.5">{lp.bankName} · {lp.bankAccountNumber}</p>
                </div>
              )}
              <Button
                onClick={() => landlordMutation.mutate()}
                disabled={landlordMutation.isPending}
                className="gap-2"
              >
                {landlordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Business & Bank Details
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
