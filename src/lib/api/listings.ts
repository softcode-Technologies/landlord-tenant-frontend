import apiClient from "./client"
import type { Listing, ListingFilters } from "@/lib/types"

export interface UpdateListingData {
  title?: string
  description?: string
  rentPerAnnum?: number
  status?: string
}

// Shape the backend actually returns for a listing
interface RawListing {
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

export interface BackendPagination {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface PaginatedListings {
  data: Listing[]
  pagination: BackendPagination
}

function normalizeListing(raw: RawListing): Listing {
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
    createdAt: raw.createdAt?.toString() ?? "",
    updatedAt: raw.updatedAt?.toString() ?? "",
    landlordUserId: undefined,
    lister: raw.lister,
    averageRating: raw.averageRating,
    reviewCount: raw.reviewCount,
    isSaved: raw.isSaved,
  }
}

export const listingsApi = {
  getListings: async (filters?: ListingFilters) => {
    const res = await apiClient.get<{ data: RawListing[]; pagination: BackendPagination }>(
      "/listings",
      { params: filters }
    )
    return {
      ...res,
      data: {
        data: res.data.data.map(normalizeListing),
        pagination: res.data.pagination,
      },
    }
  },

  getListing: async (id: string) => {
    const res = await apiClient.get<RawListing>(`/listings/${id}`)
    return { ...res, data: normalizeListing(res.data) }
  },

  updateListing: (id: string, data: UpdateListingData) =>
    apiClient.patch<Listing>(`/listings/${id}`, data),

  closeListing: (id: string) => apiClient.delete(`/listings/${id}`),

  getLandlordListings: async () => {
    const res = await apiClient.get<RawListing[]>("/listings/mine")
    return { ...res, data: Array.isArray(res.data) ? res.data.map(normalizeListing) : [] }
  },

  saveListing: (id: string) => apiClient.post(`/listings/${id}/save`),

  unsaveListing: (id: string) => apiClient.delete(`/listings/${id}/save`),

  getSavedListings: async () => {
    const res = await apiClient.get<RawListing[]>("/listings/saved")
    return { ...res, data: Array.isArray(res.data) ? res.data.map(normalizeListing) : [] }
  },
}
