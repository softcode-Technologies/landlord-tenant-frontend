import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { LocationListings } from "@/components/seo/location-listings"
import { BRAND_NAME, BRAND_URL } from "@/lib/config/brand"
import {
  PRIORITY_LOCATIONS,
  fetchLocationListings,
  lgaHref,
  resolveLga,
  resolveState,
  slugifyLocation,
  stateDisplayName,
  stateHref,
} from "@/lib/seo/locations"

export const revalidate = 300
export const dynamicParams = true

export function generateStaticParams() {
  return PRIORITY_LOCATIONS.map(({ state, lga }) => ({
    state: slugifyLocation(state),
    lga: slugifyLocation(lga),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; lga: string }>
}): Promise<Metadata> {
  const { state: stateSlug, lga: lgaSlug } = await params
  const state = resolveState(stateSlug)
  const lga = state ? resolveLga(stateSlug, lgaSlug) : null
  if (!state || !lga) return { title: "Location not found" }

  const label = `${lga}, ${stateDisplayName(state)}`
  const { total } = await fetchLocationListings({ state, lga, limit: 1 })
  const title = `Property & Houses for Rent in ${label}`
  const description = `Browse ${total > 0 ? `${total} ` : ""}verified rental properties for rent in ${label}. Real prices, KYC-verified landlords, no scams — on ${BRAND_NAME}.`

  return {
    title,
    description,
    alternates: { canonical: lgaHref(state, lga) },
    robots: total > 0 ? undefined : { index: false, follow: true },
    openGraph: { title, description, type: "website", siteName: BRAND_NAME },
  }
}

export default async function LgaRentPage({
  params,
}: {
  params: Promise<{ state: string; lga: string }>
}) {
  const { state: stateSlug, lga: lgaSlug } = await params
  const state = resolveState(stateSlug)
  const lga = state ? resolveLga(stateSlug, lgaSlug) : null
  if (!state || !lga) notFound()

  const { listings, total } = await fetchLocationListings({ state, lga })
  const label = `${lga}, ${stateDisplayName(state)}`

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BRAND_URL },
      { "@type": "ListItem", position: 2, name: "Rentals", item: `${BRAND_URL}/listings` },
      { "@type": "ListItem", position: 3, name: stateDisplayName(state), item: `${BRAND_URL}${stateHref(state)}` },
      { "@type": "ListItem", position: 4, name: lga, item: `${BRAND_URL}${lgaHref(state, lga)}` },
    ],
  }

  const itemList =
    listings.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Properties for rent in ${label}`,
          numberOfItems: total,
          itemListElement: listings.map((l, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "RealEstateListing",
              name: l.title,
              url: `${BRAND_URL}/listings/${l.id}`,
              image: l.images ?? [],
              numberOfRooms: l.bedrooms,
              offers: {
                "@type": "Offer",
                price: l.rentPerAnnum,
                priceCurrency: "NGN",
                priceSpecification: {
                  "@type": "UnitPriceSpecification",
                  price: l.rentPerAnnum,
                  priceCurrency: "NGN",
                  unitText: "YEAR",
                },
              },
            },
          })),
        }
      : null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumb).replace(/</g, "\\u003c"),
        }}
      />
      {itemList && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemList).replace(/</g, "\\u003c"),
          }}
        />
      )}
      <LocationListings state={state} lga={lga} listings={listings} total={total} />
    </>
  )
}
