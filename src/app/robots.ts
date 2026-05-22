import type { MetadataRoute } from "next"
import { BRAND_URL } from "@/lib/config/brand"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private/authenticated and transactional routes — no SEO value.
      disallow: ["/admin", "/agent", "/api", "/login", "/onboarding", "/payments", "/invite"],
    },
    sitemap: `${BRAND_URL}/sitemap.xml`,
    host: BRAND_URL,
  }
}
