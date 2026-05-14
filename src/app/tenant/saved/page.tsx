"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { listingsApi } from "@/lib/api/listings"
import { ListingCard } from "@/components/shared/listing-card"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { Heart } from "lucide-react"

export default function TenantSavedPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["saved-listings"],
    queryFn: () => listingsApi.getSavedListings(),
  })

  const listings = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Saved Listings</h1>
        <p className="text-slate-500 mt-1">Properties you&apos;ve bookmarked</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved listings"
          description="Save properties you like by clicking the heart icon on any listing."
          actionLabel="Browse Listings"
          actionHref="/listings"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={{ ...listing, isSaved: true }}
              onSaveToggle={() =>
                queryClient.invalidateQueries({ queryKey: ["saved-listings"] })
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
