import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BRAND_NAME, BRAND_LOGO_URL } from "@/lib/config/brand"

// The single source of truth for the brand logo MARK (the icon-in-a-box).
//
// By default it renders the built-in Building2 glyph. The day a real logo is
// uploaded, set NEXT_PUBLIC_BRAND_LOGO_URL (see brand.ts) and every logo across
// the app swaps to that image automatically — no per-screen edits.
//
// `className` styles the container (size / rounding / background) and is kept
// identical to the old inline markup at each call site, so the icon path looks
// exactly as before. `iconClassName` sizes/colours the fallback glyph. When a
// logo image is set it fills the same container footprint (object-contain).
export function BrandLogo({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  return (
    <div className={cn("flex items-center justify-center overflow-hidden", className)}>
      {BRAND_LOGO_URL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={BRAND_LOGO_URL}
          alt={`${BRAND_NAME} logo`}
          className="h-full w-full object-contain"
        />
      ) : (
        <Building2 className={iconClassName} />
      )}
    </div>
  )
}
