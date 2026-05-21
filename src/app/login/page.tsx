"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Building2, Phone, ArrowLeft, Loader2, Shield, ShieldCheck, Receipt, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi } from "@/lib/api/auth"
import { useAuthStore, getRoleDashboardPath } from "@/lib/store/auth"
import { toast } from "sonner"
import { BrandWordmark } from "@/components/layout/brand-wordmark"
import { BRAND_NAME } from "@/lib/config/brand"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")
  const { setAuth, setAccessToken } = useAuthStore()

  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const formatPhone = (value: string) => {
    // Strip non-digits
    const digits = value.replace(/\D/g, "")
    // Nigerian number: starts with 0 or +234
    return digits
  }

  // Dev only: the backend echoes the generated OTP so we can prefill the boxes.
  // In production devOtp is undefined and this is a no-op.
  const prefillDevOtp = (devOtp?: string) => {
    if (!devOtp) return
    const code = devOtp.replace(/\D/g, "").slice(0, 6)
    setOtp(Array.from({ length: 6 }, (_, i) => code[i] ?? ""))
    toast.info(`Dev mode: code ${code} prefilled`)
  }

  const handlePhoneSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const digits = formatPhone(phone)
    if (digits.length < 10) {
      toast.error("Please enter a valid phone number")
      return
    }

    setLoading(true)
    try {
      // Normalize to +234 format
      let normalizedPhone = digits
      if (digits.startsWith("0")) {
        normalizedPhone = "234" + digits.slice(1)
      }
      const res = await authApi.requestOtp(normalizedPhone)
      toast.success("OTP sent to your phone!")
      setPhone(normalizedPhone)
      setStep("otp")
      setCountdown(60)
      prefillDevOtp(res.data?.devOtp)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string }; message?: string } } }
      toast.error(error.response?.data?.error?.message ?? error.response?.data?.message ?? "Failed to send OTP. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedDigits = value.replace(/\D/g, "").slice(0, 6)
      const newOtp = [...otp]
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pastedDigits[i] ?? ""
      }
      setOtp(newOtp)
      const lastFilledIndex = Math.min(pastedDigits.length - 1, 5)
      otpRefs.current[lastFilledIndex]?.focus()
      return
    }

    const digit = value.replace(/\D/g, "")
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const otpString = otp.join("")
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP")
      return
    }

    setLoading(true)
    try {
      const response = await authApi.verifyOtp(phone, otpString)
      const { accessToken, refreshToken, isNew } = response.data

      // Store the token first so the request interceptor includes it in /auth/me
      setAccessToken(accessToken)

      // Get full user profile (includes landlord/tenant/agent profiles)
      const userResponse = await authApi.me()
      const user = userResponse.data

      // Store auth (sets the proxy cookie with the JWT's actual expiry)
      setAuth(user, accessToken, refreshToken)

      toast.success(isNew ? "Account created! Let's set up your profile." : `Welcome back${user.firstName ? `, ${user.firstName}` : ""}!`)

      // New users go to onboarding; existing users go to their dashboard (or the requested redirect)
      if (isNew) {
        router.push("/onboarding")
      } else if (redirect) {
        router.push(redirect)
      } else {
        router.push(getRoleDashboardPath(user))
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string }; message?: string } } }
      toast.error(error.response?.data?.error?.message ?? error.response?.data?.message ?? "Invalid OTP. Please try again.")
      setOtp(["", "", "", "", "", ""])
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setLoading(true)
    try {
      const res = await authApi.requestOtp(phone)
      toast.success("New OTP sent!")
      setCountdown(60)
      setOtp(["", "", "", "", "", ""])
      otpRefs.current[0]?.focus()
      prefillDevOtp(res.data?.devOtp)
    } catch {
      toast.error("Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a3c5e] via-[#1e4a72] to-[#0f2d48] flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <BrandWordmark className="text-2xl font-bold text-white" />
        </Link>

        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your home in Nigeria,<br />
            <span className="text-[#f97316]">found with ease.</span>
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Find verified homes and manage your rentals — all in one place.
            Across Lagos, Abuja, Port Harcourt and beyond.
          </p>

          <div className="space-y-3">
            {[
              { icon: ShieldCheck, text: "KYC-verified landlords & listings" },
              { icon: Receipt, text: "Secure rent payments with receipts" },
              { icon: Bell, text: "Smart rent reminders" },
            ].map((f) => (
              <div
                key={f.text}
                className="flex items-center gap-3 bg-white/[0.06] backdrop-blur rounded-xl px-4 py-3 border border-white/10"
              >
                <div className="w-9 h-9 rounded-lg bg-[#f97316]/20 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-[#fb923c]" />
                </div>
                <span className="text-sm font-medium text-slate-100">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} {BRAND_NAME}. Trusted across Nigeria.
        </p>
      </div>

      {/* Right: Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1a3c5e] flex items-center justify-center">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <BrandWordmark className="text-xl font-bold text-[#1a3c5e]" />
            </Link>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                step === "phone" ? "bg-[#1a3c5e]" : "bg-[#f97316]"
              }`}
            />
            <div
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                step === "otp" ? "bg-[#f97316]" : "bg-slate-200"
              }`}
            />
          </div>

          {step === "phone" ? (
            <div>
              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#1a3c5e]/10 flex items-center justify-center mb-4">
                  <Phone className="h-6 w-6 text-[#1a3c5e]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Welcome to {BRAND_NAME}
                </h1>
                <p className="text-slate-500">
                  Enter your phone number to get started. We&apos;ll send you a verification code.
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <span className="text-sm text-slate-500">🇳🇬</span>
                      <span className="text-sm text-slate-400">|</span>
                    </div>
                    <Input
                      type="tel"
                      placeholder="08012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-14 h-12 text-base"
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Enter your Nigerian phone number (e.g. 08012345678)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-6">
                By continuing, you agree to our{" "}
                <Link href="#" className="text-[#1a3c5e] hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="text-[#1a3c5e] hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          ) : (
            <div>
              <button
                onClick={() => {
                  setStep("phone")
                  setOtp(["", "", "", "", "", ""])
                }}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#f97316]/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#f97316]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Verify your number
                </h1>
                <p className="text-slate-500">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-slate-900">
                    +{phone}
                  </span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* OTP Input boxes */}
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-3">
                    Verification Code
                  </label>
                  <div className="flex gap-3 justify-center">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 text-center text-xl font-bold text-slate-900 border-2 rounded-xl transition-all duration-150 focus:outline-none focus:border-[#1a3c5e] bg-white shadow-sm"
                        style={{
                          borderColor: digit ? "#1a3c5e" : "#e2e8f0",
                        }}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={loading || otp.join("").length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
              </form>

              <div className="text-center mt-6">
                <p className="text-sm text-slate-500">
                  Didn&apos;t receive the code?{" "}
                  {countdown > 0 ? (
                    <span className="text-slate-400">Resend in {countdown}s</span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className="text-[#1a3c5e] font-semibold hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
