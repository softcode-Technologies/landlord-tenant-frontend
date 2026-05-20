import apiClient from "./client"
import type { Listing, ListingFilters } from "@/lib/types"
import { normalizeRawListing, type RawListing } from "./normalize-listing"

export interface UpdateListingData {
  title?: string
  description?: string
  rentPerAnnum?: number
  status?: string
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

const normalizeListing = normalizeRawListing

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
