import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract a human-readable message from an Axios API error response */
export function extractApiError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = err as {
    response?: {
      data?: {
        error?: { message?: string; details?: Array<{ message?: string }> }
        message?: string
      }
    }
    message?: string
  }
  return (
    e?.response?.data?.error?.details?.[0]?.message ??
    e?.response?.data?.error?.message ??
    e?.response?.data?.message ??
    fallback
  )
}

/** Convert kobo to naira and format as ₦ */
export function formatNaira(kobo: number | null | undefined): string {
  const naira = (kobo ?? 0) / 100
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(isNaN(naira) ? 0 : naira)
}

/** Format naira amount (already in naira not kobo) */
export function formatNairaAmount(naira: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira)
}

export type RentCycle = "monthly" | "yearly"

// Rent display helpers. Default to yearly when the cycle is absent, so existing
// residential data keeps showing "/yr" / "Annual" exactly as before — only
// monthly (shop) leases render differently.
export function rentCycleSuffix(cycle?: RentCycle | null): string {
  return cycle === "monthly" ? "/mo" : "/yr"
}

export function rentCycleWord(cycle?: RentCycle | null): string {
  return cycle === "monthly" ? "month" : "year"
}

// "Monthly rent" | "Annual rent" — for labels.
export function rentAmountLabel(cycle?: RentCycle | null): string {
  return cycle === "monthly" ? "Monthly rent" : "Annual rent"
}

/** Convert naira to kobo */
export function toKobo(naira: number): number {
  return Math.round(naira * 100)
}

/** Format date */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d)
}

/** Format date with time */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—"
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "—"
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d)
}

/** Format relative time */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(d)
}

/** Get initials from name */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/** Nigerian phone number formatter */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("234")) {
    const local = cleaned.slice(3)
    return `+234 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  if (cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

/** Truncate text */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

/** Get status badge variant */
export function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    active: "default",
    approved: "default",
    confirmed: "default",
    completed: "default",
    verified: "default",
    pending: "secondary",
    in_progress: "secondary",
    open: "secondary",
    terminated: "destructive",
    rejected: "destructive",
    banned: "destructive",
    cancelled: "destructive",
    closed: "outline",
    resolved: "outline",
    inactive: "outline",
  }
  return map[status?.toLowerCase()] ?? "outline"
}
