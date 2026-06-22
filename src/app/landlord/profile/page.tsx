"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store/auth"
import { userApi } from "@/lib/api/user"
import { authApi } from "@/lib/api/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileEditDialog } from "@/components/shared/profile-edit-dialog"
import { getInitials, extractApiError } from "@/lib/utils"
import {
  User, Building2, Banknote, Shield, CheckCircle2, Loader2, MessageCircle, Camera,
} from "lucide-react"
import { toast } from "sonner"

export default function LandlordProfilePage() {
  const router = useRouter()
  const { user, setUser } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)
  const lp = user?.landlordProfile

  const [firstName, setFirstName]           = useState(user?.firstName ?? "")
  const [lastName, setLastName]             = useState(user?.lastName ?? "")
  const [email, setEmail]                   = useState(user?.email ?? "")
  const [companyName, setCompanyName]       = useState(lp?.companyName ?? "")
  const [bio, setBio]                       = useState(lp?.bio ?? "")
  const [bankName, setBankName]             = useState(lp?.bankName ?? "")
  const [bankAccountNumber, setBankAccountNumber] = useState(lp?.bankAccountNumber ?? "")

  const profileMutation = useMutation({
    mutationFn: () => userApi.updateProfile({ firstName, lastName, email }),
    onSuccess: async () => {
      const fresh = await authApi.me()
      setUser(fresh.data)
      toast.success("Personal info updated.")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to update profile.")),
  })

  const landlordMutation = useMutation({
    mutationFn: () => userApi.updateLandlordProfile({ companyName, bio, bankName, bankAccountNumber }),
    onSuccess: async () => {
      const fresh = await authApi.me()
      setUser(fresh.data)
      toast.success("Business & bank details saved.")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to save business details.")),
  })

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

  const fullName  = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Landlord"
  const kycStatus = user.kycStatus ?? "none"

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
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="relative inline-block mb-4 group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Change profile picture"
              >
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback className="text-2xl font-bold bg-[#1a3c5e]/10 text-[#1a3c5e]">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                </span>
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="text-xs text-[#1a3c5e] underline underline-offset-2 hover:text-[#f97316] transition-colors"
                >
                  Edit photo & details
                </button>
              </div>
              <p className="font-bold text-slate-900 text-lg mt-2">{fullName}</p>
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

          {/* KYC shortcut */}
          {kycStatus !== "approved" && (
            <button
              onClick={() => router.push("/landlord/kyc")}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#1a3c5e] hover:bg-[#1a3c5e]/5 transition-colors text-left"
            >
              <Shield className="h-5 w-5 text-[#1a3c5e] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">Identity Verification</p>
                <p className="text-xs text-slate-500 truncate">
                  {kycStatus === "pending"
                    ? "Under review — we'll notify you shortly"
                    : kycStatus === "rejected"
                    ? "Rejected — tap to resubmit"
                    : "Not verified — tap to get started"}
                </p>
              </div>
              <span className="text-xs text-[#1a3c5e] font-medium shrink-0">Manage →</span>
            </button>
          )}
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
                  <p className="text-sm font-medium text-slate-900">Maintenance & KYC alerts</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Receive KYC decisions and platform updates directly on WhatsApp.
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

      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
