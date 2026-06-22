"use client"

import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuthStore } from "@/lib/store/auth"
import { userApi } from "@/lib/api/user"
import type { UpdateProfileData } from "@/lib/api/user"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProfileEditDialog } from "@/components/shared/profile-edit-dialog"
import { getInitials, formatDate, extractApiError } from "@/lib/utils"
import { CheckCircle2, Star, Pencil, Loader2, X, Camera } from "lucide-react"
import { toast } from "sonner"

export default function AgentProfilePage() {
  const { user, setUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [lastName, setLastName] = useState(user?.lastName ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [licenseNumber, setLicenseNumber] = useState(
    user?.agentProfile?.licenseNumber ?? ""
  )

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data),
    onSuccess: (res) => {
      setUser(res.data)
      setEditing(false)
      toast.success("Profile updated successfully")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to update profile")),
  })

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    updateMutation.mutate({
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      email: email.trim() || undefined,
      licenseNumber: licenseNumber.trim() || undefined,
    })
  }

  const cancelEdit = () => {
    setFirstName(user?.firstName ?? "")
    setLastName(user?.lastName ?? "")
    setEmail(user?.email ?? "")
    setLicenseNumber(user?.agentProfile?.licenseNumber ?? "")
    setEditing(false)
  }

  if (!user) return null

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Agent"
  const agentProfile = user.agentProfile

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Agent Profile</h1>
          <p className="text-slate-500 mt-1">Your public agent information</p>
        </div>
        {!editing && (
          <Button variant="outline" className="gap-2" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <p className="text-sm text-slate-500 mb-1">{user.phone}</p>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="text-xs text-[#1a3c5e] underline underline-offset-2 hover:text-[#f97316] transition-colors mb-3"
            >
              Edit photo & details
            </button>
            {agentProfile?.isVerified && (
              <Badge className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified Agent
              </Badge>
            )}
            {agentProfile?.rating && (
              <div className="flex items-center justify-center gap-1 mt-3">
                <Star className="h-4 w-4 fill-[#f97316] text-[#f97316]" />
                <span className="font-semibold text-slate-900">
                  {Number(agentProfile.rating).toFixed(1)}
                </span>
                <span className="text-sm text-slate-400">/ 5.0</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">License Number</Label>
                    <Input
                      id="licenseNumber"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="ERCL-2024-00123"
                    />
                    <p className="text-xs text-slate-400">
                      Your ESVARBON or NIESV registration number
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={cancelEdit}
                      disabled={updateMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Profile Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Member Since", value: formatDate(user.createdAt) },
                    { label: "Phone", value: user.phone },
                    {
                      label: "Email",
                      value: user.email ?? "Not provided",
                    },
                    {
                      label: "Rating",
                      value: agentProfile?.rating
                        ? `${Number(agentProfile.rating).toFixed(1)} / 5.0`
                        : "No ratings yet",
                    },
                    {
                      label: "Properties Managed",
                      value: agentProfile?.totalProperties ?? 0,
                    },
                    {
                      label: "License Number",
                      value: agentProfile?.licenseNumber ?? "Not provided",
                    },
                    {
                      label: "Verification Status",
                      value: agentProfile?.isVerified ? "Verified" : "Pending Verification",
                    },
                  ].map((item) => (
                    <div key={item.label} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                      <p className="font-semibold text-slate-900 text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>

                {agentProfile?.bio && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Bio</p>
                    <p className="text-sm text-slate-700">{agentProfile.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
