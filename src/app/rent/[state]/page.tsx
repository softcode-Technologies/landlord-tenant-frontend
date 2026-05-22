import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LocationListings } from "@/components/seo/location-listings"
import { BRAND_NAME, BRAND_URL } from "@/lib/config/brand"
import {
  ALL_STATES,
  fetchLocationListings,
  resolveState,
  slugifyLocation,
  stateDisplayName,
  stateHref,
} from "@/lib/seo/locations"

export const revalidate = 300
export const dynamicParams = true

export function generateStaticParams() {
  return ALL_STATES.map((s) => ({ state: slugifyLocation(s) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>
}): Promise<Metadata> {
  const { state: stateSlug } = await params
  const state = resolveState(stateSlug)
  if (!state) return { title: "Location not found" }

  const label = stateDisplayName(state)
  const { total } = await fetchLocationListings({ state, limit: 1 })
  const title = `Property & Houses for Rent in ${label}`
  const description = `Browse ${total > 0 ? `${total} ` : ""}verified rental properties for rent in ${label}, Nigeria. Real prices, KYC-verified landlords, no scams — on ${BRAND_NAME}.`

  return {
    title,
    description,
    alternates: { canonical: stateHref(state) },
    // Don't let Google index a location page until it has real inventory.
    robots: total > 0 ? undefined : { index: false, follow: true },
    openGraph: { title, description, type: "website", siteName: BRAND_NAME },
  }
}

export default async function StateRentPage({
  params,
}: {
  params: Promise<{ state: string }>
}) {
  const { state: stateSlug } = await params
  const state = resolveState(stateSlug)
  if (!state) notFound()

  const { listings, total } = await fetchLocationListings({ state })
  const label = stateDisplayName(state)

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BRAND_URL },
      { "@type": "ListItem", position: 2, name: "Rentals", item: `${BRAND_URL}/listings` },
      { "@type": "ListItem", position: 3, name: label, item: `${BRAND_URL}${stateHref(state)}` },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <LocationListings state={state} listings={listings} total={total} />
    </>
  )
}
