import type { MetadataRoute } from "next"
import { BRAND_URL } from "@/lib/config/brand"
import { ALL_STATES, PRIORITY_LOCATIONS, lgaHref, stateHref } from "@/lib/seo/locations"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const url = (path: string) => `${BRAND_URL}${path}`

  const core: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url("/listings"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: url("/landlord"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/tenant"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: url("/terms"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ]

  const states: MetadataRoute.Sitemap = ALL_STATES.map((s) => ({
    url: url(stateHref(s)),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const priorityAreas: MetadataRoute.Sitemap = PRIORITY_LOCATIONS.map(({ state, lga }) => ({
    url: url(lgaHref(state, lga)),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }))

  return [...core, ...states, ...priorityAreas]
}
