import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { BRAND_NAME, BRAND_LOGO_URL } from "@/lib/config/brand"
import { BrandWordmark } from "./brand-wordmark"

// The single source of truth for the brand logo.
//
// By default it renders the built-in Building2 glyph. When NEXT_PUBLIC_BRAND_LOGO_URL
// is set, it displays the uploaded logo image instead.
//
// `variant` can be "full" (logo with text) or "icon" (just icon/mark)
// `size` controls the height: "sm" (32px), "md" (48px), "lg" (64px), or custom class
export function BrandLogo({
  className,
  iconClassName,
  variant = "icon",
  size = "md",
}: {
  className?: string
  iconClassName?: string
  variant?: "full" | "icon"
  size?: "sm" | "md" | "lg" | "xl"
}) {
  // Map size to Tailwind height classes
  const sizeClasses = {
    sm: "h-8",   // 32px
    md: "h-12",  // 48px  
    lg: "h-16",  // 64px
    xl: "h-20",  // 80px
  }

  // Full logo variant - displays the complete logo image that includes text
  if (variant === "full") {
    return (
      <div className="flex items-center">
        {BRAND_LOGO_URL ? (
          // Full logo image with text included - displays at a good readable size
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={BRAND_LOGO_URL}
            alt={`${BRAND_NAME} logo`}
            className={cn(sizeClasses[size], "w-auto object-contain")}
          />
        ) : (
          // Fallback: icon + wordmark
          <>
            <div className={cn("flex items-center justify-center overflow-hidden", className)}>
              <Building2 className={iconClassName} />
            </div>
            <BrandWordmark className="ml-2 text-xl font-bold text-[#1a3c5e]" />
          </>
        )}
      </div>
    )
  }

  // Icon-only variant - just the square icon/mark
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
