import { BRAND_NAME } from "@/lib/config/brand"

// Renders the brand wordmark. The default "NaijaRental" keeps its two-tone
// styling; a custom brand name (set via NEXT_PUBLIC_BRAND_NAME) renders plainly
// since we can't know where to split an arbitrary name.
export function BrandWordmark({ className }: { className?: string }) {
  if (BRAND_NAME === "NaijaRental") {
    return (
      <span className={className}>
        Naija<span className="text-[#f97316]">Rental</span>
      </span>
    )
  }
  return <span className={className}>{BRAND_NAME}</span>
}
