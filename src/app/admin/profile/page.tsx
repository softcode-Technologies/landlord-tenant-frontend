"use client"

import { useState } from "react"
import { useAuthStore } from "@/lib/store/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileEditDialog } from "@/components/shared/profile-edit-dialog"
import { getInitials, formatDate } from "@/lib/utils"
import { User, ShieldCheck, Camera, Pencil } from "lucide-react"

export default function AdminProfilePage() {
  const { user } = useAuthStore()
  const [editOpen, setEditOpen] = useState(false)

  if (!user) return null

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Admin"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information</p>
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

              <Badge variant="success" className="gap-1">
                <ShieldCheck className="h-3 w-3" />
                Administrator
              </Badge>

              <div className="w-full border-t pt-4 mt-4 space-y-2 text-left">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Member since</span>
                  <span className="font-medium">{formatDate(user.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Role</span>
                  <span className="font-medium">Admin</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal Info */}
        <div className="lg:col-span-2">
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
                  <p className="font-medium text-slate-900 mt-1">{user.firstName ?? "Not set"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Last Name</Label>
                  <p className="font-medium text-slate-900 mt-1">{user.lastName ?? "Not set"}</p>
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
            </CardContent>
          </Card>
        </div>
      </div>

      <ProfileEditDialog open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
