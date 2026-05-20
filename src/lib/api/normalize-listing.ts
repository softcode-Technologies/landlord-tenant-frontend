import type { Listing } from "@/lib/types"

// Shape the backend actually returns for a listing. Bedrooms/bathrooms live
// under `unit`, and location/images/propertyType under `property`, so a raw
// listing must be flattened before the UI (and SSR metadata) can read it.
export interface RawListing {
  id: string
  unitId: string
  propertyId: string
  title: string
  description?: string | null
  rentPerAnnum: number
  availableFrom?: string
  status: string
  viewCount?: number
  isFeatured: boolean
  featuredUntil?: string | null
  createdAt: string
  updatedAt: string
  unit?: {
    id: string
    unitNumber?: string
    bedrooms: number
    bathrooms: number
    toilets: number
    sizeM2?: number | null
    amenities?: string[]
    status?: string
  }
  property?: {
    id: string
    name?: string
    slug?: string
    city: string
    state: string
    lga?: string
    area?: string
    propertyType: string
    images?: string[]
    latitude?: number | null
    longitude?: number | null
    landlordProfile?: { isVerified?: boolean }
  }
  lister?: {
    id: string
    firstName?: string
    lastName?: string
    avatarUrl?: string
    phone?: string
  }
  averageRating?: number
  reviewCount?: number
  isSaved?: boolean
}

export function normalizeRawListing(raw: RawListing): Listing {
  const amenities = raw.unit?.amenities ?? []
  return {
    id: raw.id,
    unitId: raw.unitId,
    propertyId: raw.propertyId,
    title: raw.title,
    description: raw.description ?? "",
    rentPerAnnum: raw.rentPerAnnum,
    city: raw.property?.city ?? "",
    state: raw.property?.state ?? "",
    lga: raw.property?.lga,
    area: raw.property?.area,
    isListerVerified: raw.property?.landlordProfile?.isVerified ?? false,
    viewCount: raw.viewCount ?? 0,
    address: raw.property
      ? `${raw.property.name ?? ""}, ${raw.property.area ?? raw.property.lga ?? raw.property.city}`.replace(/^, /, "")
      : "",
    bedrooms: raw.unit?.bedrooms ?? 0,
    bathrooms: raw.unit?.bathrooms ?? 0,
    toilets: raw.unit?.toilets,
    isFurnished: amenities.some((a) => a.toLowerCase().includes("furnished")),
    isServiced: amenities.some((a) => a.toLowerCase().includes("serviced")),
    propertyType: raw.property?.propertyType ?? "",
    images: raw.property?.images ?? [],
    isFeatured: raw.isFeatured,
    isActive: raw.status === "active",
    status: raw.status as Listing["status"],
    createdAt: raw.createdAt?.toString() ?? "",
    updatedAt: raw.updatedAt?.toString() ?? "",
    landlordUserId: undefined,
    lister: raw.lister,
    averageRating: raw.averageRating,
    reviewCount: raw.reviewCount,
    isSaved: raw.isSaved,
  }
}
