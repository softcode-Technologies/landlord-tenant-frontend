"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import Link from "next/link"
import {
  Building2,
  Home,
  Briefcase,
  User,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { userApi, OnboardData } from "@/lib/api/user"
import { extractApiError } from "@/lib/utils"
import { authApi } from "@/lib/api/auth"
import { useAuthStore, getRoleDashboardPath } from "@/lib/store/auth"
import { toast } from "sonner"
import { BrandWordmark } from "@/components/layout/brand-wordmark"
import { BrandLogo } from "@/components/layout/brand-logo"
import { BRAND_NAME } from "@/lib/config/brand"
import { safeRedirectPath } from "@/lib/safe-redirect"

type OnboardingRole = "tenant" | "landlord" | "agent"

const ROLE_CARDS: {
  role: OnboardingRole
  label: string
  description: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}[] = [
  {
    role: "tenant",
    label: "Tenant",
    description: "I'm looking for a place to rent",
    icon: Home,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    role: "landlord",
    label: "Landlord",
    description: "I own property and want to rent it out",
    icon: Building2,
    color: "text-[#1a3c5e]",
    bg: "bg-[#1a3c5e]/5",
    border: "border-[#1a3c5e]/20",
  },
  {
    role: "agent",
    label: "Agent",
    description: "I'm a real estate professional managing properties",
    icon: Briefcase,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
]

const STEP_TITLES = [
  "Tell us about yourself",
  "What's your role?",
  "A few more details",
]

const STEP_COUNT = 3

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Where to land after onboarding — e.g. the listing a first-timer was unlocking
  // when they were prompted to sign up. Falls back to the role dashboard.
  const redirect = safeRedirectPath(searchParams.get("redirect"), "")
  const { user, setUser } = useAuthStore()

  const [step, setStep] = useState(1)
  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [lastName, setLastName] = useState(user?.lastName ?? "")
  const [email, setEmail] = useState(user?.email ?? "")
  const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null)

  // Role-specific fields
  const [occupation, setOccupation] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [bio, setBio] = useState("")
  const [referredByCode, setReferredByCode] = useState("")

  const progressValue = (step / STEP_COUNT) * 100

  const updateMutation = useMutation({
    mutationFn: (data: OnboardData) => userApi.onboard(data),
    onSuccess: async () => {
      try {
        const freshRes = await authApi.me()
        setUser(freshRes.data)
        toast.success(`Profile saved! Welcome to ${BRAND_NAME}.`)
        // Resume where they started (e.g. the listing they were unlocking),
        // otherwise drop them on their role dashboard.
        router.push(redirect || getRoleDashboardPath(freshRes.data))
      } catch {
        toast.error("Setup saved but failed to load your profile. Please log in.")
        router.push("/login")
      }
    },
    onError: (err: unknown) => {
      toast.error(extractApiError(err, "Failed to save your profile. Please try again."))
    },
  })

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim()) {
      toast.error("First name is required")
      return
    }
    if (!email.trim()) {
      toast.error("Email address is required")
      return
    }
    // Basic shape check; the backend validates strictly.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address")
      return
    }
    setStep(2)
  }

  const handleStep2Next = () => {
    if (!selectedRole) {
      toast.error("Please select a role to continue")
      return
    }
    setStep(3)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return

    const data: OnboardData = {
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      email: email.trim(),
      bio: bio.trim() || undefined,
      role: selectedRole,
      referredByCode: referredByCode.trim().toUpperCase() || undefined,
    }

    if (selectedRole === "tenant") {
      data.occupation = occupation.trim() || undefined
    } else if (selectedRole === "landlord") {
      data.companyName = companyName.trim() || undefined
    } else if (selectedRole === "agent") {
      data.licenseNumber = licenseNumber.trim() || undefined
    }

    updateMutation.mutate(data)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo className="w-8 h-8 rounded-lg bg-[#1a3c5e]" iconClassName="h-4 w-4 text-white" />
          <BrandWordmark className="text-xl font-bold text-[#1a3c5e]" />
        </Link>
        <span className="text-sm text-slate-500">
          Step {step} of {STEP_COUNT}
        </span>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b px-6 pb-4">
        <Progress value={progressValue} className="h-2" />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Step indicator dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`transition-all duration-300 rounded-full ${
                  s === step
                    ? "w-8 h-3 bg-[#1a3c5e]"
                    : s < step
                    ? "w-3 h-3 bg-[#f97316]"
                    : "w-3 h-3 bg-slate-200"
                }`}
              />
            ))}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">{STEP_TITLES[step - 1]}</h1>
            {step === 1 && (
              <p className="text-slate-500 mt-2">
                Let&apos;s get your profile set up so you can make the most of {BRAND_NAME}.
              </p>
            )}
            {step === 2 && (
              <p className="text-slate-500 mt-2">
                Choose the role that best describes you on the platform.
              </p>
            )}
            {step === 3 && selectedRole && (
              <p className="text-slate-500 mt-2">
                Just a bit more info to personalize your{" "}
                <span className="font-semibold capitalize">{selectedRole}</span> experience.
              </p>
            )}
          </div>

          {/* ---- STEP 1: Personal Info ---- */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="e.g. Chidi"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="e.g. Okafor"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-400">
                  We&apos;ll send your login codes here from now on.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referredByCode">
                  Referral Code <span className="text-slate-400 text-xs">(optional)</span>
                </Label>
                <Input
                  id="referredByCode"
                  placeholder="e.g. ABC12345"
                  value={referredByCode}
                  onChange={(e) => setReferredByCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                  maxLength={8}
                />
                <p className="text-xs text-slate-400">
                  Enter a friend&apos;s referral code to connect your accounts.
                </p>
              </div>

              <Button type="submit" className="w-full h-12 text-base gap-2">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          {/* ---- STEP 2: Role Selection ---- */}
          {step === 2 && (
            <div className="space-y-4">
              {ROLE_CARDS.map(({ role, label, description, icon: Icon, color, bg, border }) => {
                const isSelected = selectedRole === role
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 group ${
                      isSelected
                        ? `${border} ${bg} shadow-md ring-2 ring-offset-1 ring-[#1a3c5e]/30`
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isSelected ? bg : "bg-slate-100 group-hover:bg-slate-200"
                      } transition-colors`}
                    >
                      <Icon className={`h-6 w-6 ${isSelected ? color : "text-slate-500"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold text-base ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                          {label}
                        </p>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-[#1a3c5e] flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm mt-0.5 ${isSelected ? "text-slate-600" : "text-slate-500"}`}>
                        {description}
                      </p>
                    </div>
                  </button>
                )
              })}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={handleStep2Next}
                  disabled={!selectedRole}
                  className="flex-1 h-12 gap-2"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ---- STEP 3: Role-Specific Details ---- */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {selectedRole === "tenant" && (
                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    placeholder="e.g. Software Engineer, Teacher, Business Owner"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">
                    Helps landlords assess your tenancy application.
                  </p>
                </div>
              )}

              {selectedRole === "landlord" && (
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company / Business Name</Label>
                  <Input
                    id="companyName"
                    placeholder="e.g. Okafor Properties Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">
                    Optional — leave blank if you manage properties privately.
                  </p>
                </div>
              )}

              {selectedRole === "agent" && (
                <div className="space-y-2">
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    placeholder="e.g. ERCL-2024-00123"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    autoFocus
                  />
                  <p className="text-xs text-slate-400">
                    Your ESVARBON or NIESV registration number.
                  </p>
                </div>
              )}

              {/* Bio is universal for step 3 */}
              <div className="space-y-2">
                <Label htmlFor="bio">
                  Short Bio <span className="text-slate-400 text-xs">(optional)</span>
                </Label>
                <textarea
                  id="bio"
                  rows={3}
                  placeholder="Tell us a little about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 gap-2"
                  disabled={updateMutation.isPending}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 gap-2"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4" />
                      Complete Setup
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">Loading...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
