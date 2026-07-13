import { BRAND_NAME } from "@/lib/config/brand"

// Renders the brand wordmark from NEXT_PUBLIC_BRAND_NAME. Rendered plainly — we
// can't know where to split an arbitrary name into a two-tone treatment.
export function BrandWordmark({ className }: { className?: string }) {
  return <span className={className}>{BRAND_NAME}</span>
}
