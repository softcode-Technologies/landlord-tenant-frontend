"use client"

import { ShieldCheck, UserCheck, Wallet } from "lucide-react"
import { formatNaira } from "@/lib/utils"
import { usePlatformCommissionPercent } from "@/lib/hooks/use-app-config"

// What the platform fee buys — shown so the fee reads as a service, not a cut.
const FEE_INCLUDES = [
  { icon: ShieldCheck, label: "Escrow protection" },
  { icon: UserCheck, label: "Tenant screening" },
  { icon: Wallet, label: "Automated rent collection" },
]

interface RentFeeBreakdownProps {
  // Annual rent in NAIRA (as entered by the landlord). 0/empty hides the split.
  rentNaira: number
  className?: string
}

// Shows the landlord exactly how the platform fee applies to a rent amount:
// what the tenant pays, what we deduct, and what lands in their wallet. Pulls
// the live commission % from /app/config so it never drifts from the backend.
export function RentFeeBreakdown({ rentNaira, className }: RentFeeBreakdownProps) {
  const percent = usePlatformCommissionPercent()

  const grossKobo = Math.round((rentNaira || 0) * 100)
  const commissionKobo = Math.round((grossKobo * percent) / 100)
  const netKobo = grossKobo - commissionKobo
  const hasAmount = grossKobo > 0

  return (
    <div className={`rounded-xl border border-[#1a3c5e]/15 bg-[#1a3c5e]/[0.04] p-3.5 ${className ?? ""}`}>
      <div className="flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-[#1a3c5e] mt-0.5 shrink-0" />
        <p className="text-xs text-slate-600 leading-relaxed">
          We only earn when you get paid — a <span className="font-semibold text-[#1a3c5e]">{percent}% platform fee</span>{" "}
          is taken from each rent payment we collect. No upfront cost, no monthly charge.
        </p>
      </div>

      {/* What the fee includes — reads as a service, not a deduction */}
      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 pl-6">
        {FEE_INCLUDES.map(({ icon: Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <Icon className="h-3 w-3 text-green-600" />
            {label}
          </span>
        ))}
      </div>

      {hasAmount && (
        <div className="mt-3 space-y-1.5 border-t border-[#1a3c5e]/10 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Tenant pays</span>
            <span className="font-medium text-slate-700">{formatNaira(grossKobo)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Platform fee ({percent}%)</span>
            <span className="font-medium text-red-600">−{formatNaira(commissionKobo)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-[#1a3c5e]/10 pt-1.5">
            <span className="text-sm font-semibold text-slate-700">You receive</span>
            <span className="text-sm font-bold text-green-600">{formatNaira(netKobo)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
