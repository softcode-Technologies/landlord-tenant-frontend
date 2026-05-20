import type { Metadata } from "next"
import { Suspense } from "react"
import { ListingDetailClient } from "./listing-detail-client"
import type { Listing } from "@/lib/types"
import { normalizeRawListing, type RawListing } from "@/lib/api/normalize-listing"
import { BRAND_NAME } from "@/lib/config/brand"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

// The backend returns a *raw* listing (bedrooms under `unit`, images under
// `property`). It must be normalized here too — otherwise SSR metadata reads
// `undefined` and the client's react-query initialData lacks images, causing a
// placeholder image to flash before the real one loads.
async function fetchListing(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${API_URL}/listings/${id}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const body = await res.json()
    const raw = (body?.data ?? body) as RawListing | null
    return raw ? normalizeRawListing(raw) : null
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await fetchListing(id)

  if (!listing) {
    return {
      title: "Listing Not Found",
      description: `This listing could not be found on ${BRAND_NAME}.`,
    }
  }

  const location = [listing.area, listing.lga, listing.city, listing.state]
    .filter(Boolean)
    .join(", ")
  const propertyType = listing.propertyType
    ? listing.propertyType.charAt(0).toUpperCase() + listing.propertyType.slice(1)
    : "Property"
  const bedPrefix = listing.bedrooms ? `${listing.bedrooms} Bed ` : ""
  const title = `${bedPrefix}${propertyType} for Rent${location ? ` in ${location}` : ""}`
  const price = `₦${Number(listing.rentPerAnnum).toLocaleString("en-NG")}/year`
  const extras = [
    listing.isFurnished && "Furnished",
    listing.isServiced && "Serviced",
  ].filter(Boolean).join(", ")
  const description = `${listing.bedrooms} bedroom ${listing.propertyType} for rent in ${location}. ${price}${extras ? ` · ${extras}` : ""}. Book a viewing on ${BRAND_NAME} — Nigeria's trusted rental platform.`

  const ogImage = listing.images?.[0]

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: BRAND_NAME,
      images: ogImage
        ? [{ url: ogImage, width: 1200, height: 630, alt: title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
    },
    alternates: {
      canonical: `/listings/${id}`,
    },
  }
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await fetchListing(id)

  // JSON-LD structured data for Google rich results
  const jsonLd = listing
    ? {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: listing.title,
        description: listing.description,
        url: `/listings/${id}`,
        image: listing.images ?? [],
        address: {
          "@type": "PostalAddress",
          addressLocality: listing.city,
          addressRegion: listing.state,
          addressCountry: "NG",
        },
        numberOfRooms: listing.bedrooms,
        floorSize: undefined,
        offers: {
          "@type": "Offer",
          price: listing.rentPerAnnum,
          priceCurrency: "NGN",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: listing.rentPerAnnum,
            priceCurrency: "NGN",
            unitText: "YEAR",
          },
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1e]" />}>
        <ListingDetailClient initialListing={listing} />
      </Suspense>
    </>
  )
}
