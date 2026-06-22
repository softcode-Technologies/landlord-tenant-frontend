"use client"

import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Camera, Loader2 } from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/lib/store/auth"
import { userApi, UpdateProfileData } from "@/lib/api/user"
import { authApi } from "@/lib/api/auth"
import { getInitials, extractApiError } from "@/lib/utils"
import { toast } from "sonner"

interface ProfileEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // keep in sync with the backend

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { user, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [lastName, setLastName] = useState(user?.lastName ?? "")
  const [phone, setPhone] = useState(user?.phone ?? "")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const fullName = `${firstName} ${lastName}`.trim() || "User"

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1) Upload the new avatar first (if one was picked).
      if (avatarFile) {
        await userApi.uploadAvatar(avatarFile)
      }

      // 2) Patch only the fields that actually changed.
      const patch: UpdateProfileData = {}
      if (firstName.trim() && firstName.trim() !== (user?.firstName ?? "")) patch.firstName = firstName.trim()
      if (lastName.trim() !== (user?.lastName ?? "")) patch.lastName = lastName.trim()
      if (phone.trim() && phone.trim() !== (user?.phone ?? "")) patch.phone = phone.trim()
      if (Object.keys(patch).length > 0) {
        await userApi.updateProfile(patch)
      }

      // 3) Re-fetch the canonical user so the whole app reflects the change.
      const fresh = await authApi.me()
      return fresh.data
    },
    onSuccess: (fresh) => {
      setUser(fresh)
      toast.success("Profile updated")
      onOpenChange(false)
      setAvatarFile(null)
      setAvatarPreview(null)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not update your profile.")),
  })

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please choose a JPEG, PNG, or WebP image.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be under 5MB.")
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  if (!user) return null

  const nothingChanged =
    !avatarFile &&
    firstName.trim() === (user.firstName ?? "") &&
    lastName.trim() === (user.lastName ?? "") &&
    phone.trim() === (user.phone ?? "")

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saveMutation.isPending) onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Change profile picture"
            >
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview ?? user.avatarUrl} />
                <AvatarFallback className="text-2xl">{getInitials(fullName)}</AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-[#1a3c5e] underline underline-offset-2 hover:text-[#f97316] transition-colors"
            >
              Change photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onPickFile}
            />
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pe-first">First Name</Label>
              <Input id="pe-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="e.g. Chidi" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pe-last">Last Name</Label>
              <Input id="pe-last" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="e.g. Okafor" />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="pe-phone">Phone Number</Label>
            <Input
              id="pe-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+2348012345678"
            />
            <p className="text-xs text-slate-400">
              This is also your login number — make sure you can receive codes on it.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || nothingChanged}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
