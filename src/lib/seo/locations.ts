import { NIGERIA_GEO_DATA } from "@/lib/data/nigeria-geo"
import { normalizeRawListing, type RawListing } from "@/lib/api/normalize-listing"
import type { Listing } from "@/lib/types"

// ─── Slugs ──────────────────────────────────────────────────────────────────

export function slugifyLocation(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

// A few states read better with a friendlier public label than their raw name.
const STATE_DISPLAY_OVERRIDES: Record<string, string> = {
  FCT: "Abuja (FCT)",
}

export function stateDisplayName(state: string): string {
  return STATE_DISPLAY_OVERRIDES[state] ?? state
}

// ─── Lookups (built once from the geo dataset) ────────────────────────────────

const STATE_BY_SLUG = new Map<string, string>()
const LGAS_BY_STATE_SLUG = new Map<string, Map<string, string>>() // stateSlug -> (lgaSlug -> lgaName)

for (const { state, lgas } of NIGERIA_GEO_DATA) {
  const sSlug = slugifyLocation(state)
  STATE_BY_SLUG.set(sSlug, state)
  const lgaMap = new Map<string, string>()
  for (const lga of lgas) lgaMap.set(slugifyLocation(lga), lga)
  LGAS_BY_STATE_SLUG.set(sSlug, lgaMap)
}

/** Canonical state name for a slug, or null if it isn't a real Nigerian state. */
export function resolveState(stateSlug: string): string | null {
  return STATE_BY_SLUG.get(stateSlug) ?? null
}

/** Canonical LGA name for a (stateSlug, lgaSlug) pair, or null. */
export function resolveLga(stateSlug: string, lgaSlug: string): string | null {
  return LGAS_BY_STATE_SLUG.get(stateSlug)?.get(lgaSlug) ?? null
}

export function getStateLgas(state: string): string[] {
  return NIGERIA_GEO_DATA.find((d) => d.state === state)?.lgas ?? []
}

export const ALL_STATES: string[] = NIGERIA_GEO_DATA.map((d) => d.state)

// ─── Hrefs ────────────────────────────────────────────────────────────────────

export function stateHref(state: string): string {
  return `/rent/${slugifyLocation(state)}`
}

export function lgaHref(state: string, lga: string): string {
  return `/rent/${slugifyLocation(state)}/${slugifyLocation(lga)}`
}

// ─── Priority markets ─────────────────────────────────────────────────────────
// High-demand areas we pre-render and surface in the sitemap / internal links.
// Validated against the geo dataset at module load so a typo is dropped rather
// than producing a dead page.

const RAW_PRIORITY: { state: string; lga: string }[] = [
  { state: "Lagos", lga: "Eti-Osa" },
  { state: "Lagos", lga: "Ibeju-Lekki" },
  { state: "Lagos", lga: "Ikeja" },
  { state: "Lagos", lga: "Lagos Mainland" },
  { state: "Lagos", lga: "Surulere" },
  { state: "Lagos", lga: "Kosofe" },
  { state: "Lagos", lga: "Lagos Island" },
  { state: "FCT", lga: "Municipal Area Council" },
  { state: "FCT", lga: "Bwari" },
  { state: "FCT", lga: "Gwagwalada" },
  { state: "Rivers", lga: "Port Harcourt" },
  { state: "Rivers", lga: "Obio/Akpor" },
]

export const PRIORITY_LOCATIONS = RAW_PRIORITY.filter(
  ({ state, lga }) => getStateLgas(state).includes(lga),
)

export const PRIORITY_STATES: string[] = [
  ...new Set(PRIORITY_LOCATIONS.map((l) => l.state)),
]

// ─── Server-side listing fetch ────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

export async function fetchLocationListings(opts: {
  state?: string
  lga?: string
  limit?: number
}): Promise<{ listings: Listing[]; total: number }> {
  // Hard cap the request so a slow/unreachable API at BUILD time can't hang the
  // static generation of these SEO pages past Next's 60s limit and fail the
  // whole deploy. On timeout/error we fall back to empty — the page (ISR,
  // revalidate=300) repopulates from the live API at runtime.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    const qs = new URLSearchParams()
    if (opts.state) qs.set("state", opts.state)
    if (opts.lga) qs.set("lga", opts.lga)
    qs.set("limit", String(opts.limit ?? 24))

    const res = await fetch(`${API_URL}/listings?${qs.toString()}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    })
    if (!res.ok) return { listings: [], total: 0 }

    const body = await res.json()
    const raw = (body?.data ?? []) as RawListing[]
    const total: number = body?.pagination?.total ?? raw.length
    return { listings: raw.map(normalizeRawListing), total }
  } catch {
    return { listings: [], total: 0 }
  } finally {
    clearTimeout(timeout)
  }
}
