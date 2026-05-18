import type { Metadata } from "next"
import { Suspense } from "react"
import { ListingDetailClient } from "./listing-detail-client"
import type { Listing } from "@/lib/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1"

async function fetchListing(id: string): Promise<Listing | null> {
  try {
    const res = await fetch(`${API_URL}/listings/${id}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const body = await res.json()
    return body?.data ?? null
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
      description: "This listing could not be found on NaijaRental.",
    }
  }

  const location = [listing.area, listing.lga, listing.city, listing.state]
    .filter(Boolean)
    .join(", ")
  const title = `${listing.bedrooms} Bed ${listing.propertyType ?? "Property"} for Rent in ${location}`
  const price = `₦${Number(listing.rentPerAnnum).toLocaleString("en-NG")}/year`
  const extras = [
    listing.isFurnished && "Furnished",
    listing.isServiced && "Serviced",
  ].filter(Boolean).join(", ")
  const description = `${listing.bedrooms} bedroom ${listing.propertyType} for rent in ${location}. ${price}${extras ? ` · ${extras}` : ""}. Book a viewing on NaijaRental — Nigeria's trusted rental platform.`

  const ogImage = listing.images?.[0]

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "NaijaRental",
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
