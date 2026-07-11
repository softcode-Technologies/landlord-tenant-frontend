"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { listingsApi, UpdateListingData } from "@/lib/api/listings"
import { paymentsApi } from "@/lib/api/payments"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatNairaAmount, formatDate, extractApiError, rentCycleSuffix } from "@/lib/utils"
import { List, Plus, MapPin, Bed, Eye, Pencil, Trash2, Loader2, CheckCircle, Rocket } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import type { Listing } from "@/lib/types"

export default function LandlordListingsPage() {
  const queryClient = useQueryClient()
  const [editListing, setEditListing] = useState<Listing | null>(null)
  const [closingId, setClosingId] = useState<string | null>(null)
  const [boostingListing, setBoostingListing] = useState<Listing | null>(null)
  const [selectedTierDays, setSelectedTierDays] = useState<number | null>(null)

  const [title, setTitle] = useState("")
  const [rentInput, setRentInput] = useState("")

  const { data: boostTiers } = useQuery({
    queryKey: ["boost-tiers"],
    queryFn: () => paymentsApi.getBoostTiers().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })

  const boostMutation = useMutation({
    mutationFn: ({ listingId, tierDays }: { listingId: string; tierDays: number }) =>
      paymentsApi.boostListing(listingId, tierDays),
    onSuccess: (res) => {
      const url = res.data?.paymentUrl
      if (url) {
        window.location.href = url
      } else {
        toast.error("No payment URL returned. Please try again.")
      }
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to start boost payment")),
  })

  const { data, isLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingsApi.getLandlordListings(),
  })

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateListingData }) =>
      listingsApi.updateListing(id, payload),
    onSuccess: () => {
      toast.success("Listing updated")
      queryClient.invalidateQueries({ queryKey: ["my-listings"] })
      setEditListing(null)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to update listing")),
  })

  const closeMutation = useMutation({
    mutationFn: (id: string) => listingsApi.closeListing(id),
    onSuccess: () => {
      toast.success("Listing closed")
      queryClient.invalidateQueries({ queryKey: ["my-listings"] })
      setClosingId(null)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to close listing")),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => listingsApi.updateListing(id, { status: "active" }),
    onSuccess: () => {
      toast.success("Listing activated")
      queryClient.invalidateQueries({ queryKey: ["my-listings"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to activate listing")),
  })

  const openEdit = (listing: Listing) => {
    setEditListing(listing)
    setTitle(listing.title)
    setRentInput(String(listing.rentPerAnnum))
  }

  const handleEditSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editListing) return
    editMutation.mutate({
      id: editListing.id,
      payload: {
        title: title.trim() || undefined,
        rentPerAnnum: rentInput ? Number(rentInput) : undefined,
      },
    })
  }

  const listings: Listing[] = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listings</h1>
          <p className="text-slate-500 mt-1">Manage your active and inactive listings</p>
        </div>
        <Link href="/landlord/listings/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          icon={List}
          title="No listings yet"
          description="Create your first listing to start attracting tenants."
          actionLabel="Create Listing"
          actionHref="/landlord/listings/new"
        />
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <Card key={listing.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {listing.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-20 h-16 rounded-xl object-cover shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 truncate">
                          {listing.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {listing.city}, {listing.state}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={listing.isActive ? "default" : "outline"}
                          className="text-xs"
                        >
                          {listing.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {listing.isFeatured && (
                          <Badge variant="accent" className="text-xs">Featured</Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Bed className="h-3.5 w-3.5" />
                        {listing.bedrooms}bd / {listing.bathrooms}ba
                      </div>
                      <span className="text-sm font-bold text-[#1a3c5e]">
                        {formatNairaAmount(listing.rentPerAnnum)}{rentCycleSuffix(listing.rentCycle)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Created {formatDate(listing.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/listings/${listing.id}`}>
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => openEdit(listing)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    {!listing.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-green-600 border-green-200 hover:text-green-700"
                        onClick={() => activateMutation.mutate(listing.id)}
                        disabled={activateMutation.isPending}
                      >
                        {activateMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Activate
                      </Button>
                    )}
                    {listing.isActive && boostTiers?.enabled && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-orange-600 hover:text-orange-700 border-orange-200"
                        onClick={() => {
                          setBoostingListing(listing)
                          setSelectedTierDays(boostTiers.tiers[0]?.days ?? null)
                        }}
                      >
                        <Rocket className="h-3.5 w-3.5" />
                        Boost
                      </Button>
                    )}
                    {listing.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-red-500 hover:text-red-600 border-red-200"
                        onClick={() => setClosingId(listing.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editListing} onOpenChange={(o) => !o && setEditListing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Listing title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rent">Annual Rent (₦)</Label>
              <Input
                id="edit-rent"
                type="number"
                value={rentInput}
                onChange={(e) => setRentInput(e.target.value)}
                placeholder="e.g. 600000"
                min={0}
              />
              <p className="text-xs text-slate-400">Enter amount in Naira</p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditListing(null)}
                disabled={editMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editMutation.isPending}>
                {editMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Close Confirm Dialog */}
      <Dialog open={!!closingId} onOpenChange={(o) => !o && setClosingId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Close this listing?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">
            This will deactivate the listing and remove it from the marketplace. Tenants
            will no longer be able to find or contact you through it.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClosingId(null)}
              disabled={closeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => closingId && closeMutation.mutate(closingId)}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Close Listing"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boost Dialog */}
      <Dialog
        open={!!boostingListing}
        onOpenChange={(o) => {
          if (!o) {
            setBoostingListing(null)
            setSelectedTierDays(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-orange-500" />
              Boost listing
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-slate-600">
              Featured listings appear at the top of search results, so more tenants see them.
              {boostingListing?.isFeatured && boostingListing.featuredUntil && (
                <span className="block mt-1 text-xs text-orange-700">
                  Currently featured until {formatDate(boostingListing.featuredUntil)} — buying
                  another tier adds days on top.
                </span>
              )}
            </p>
            <div className="space-y-2">
              {boostTiers?.tiers.map((t) => (
                <button
                  key={t.days}
                  type="button"
                  onClick={() => setSelectedTierDays(t.days)}
                  className={`w-full text-left rounded-md border p-3 transition ${
                    selectedTierDays === t.days
                      ? "border-orange-500 bg-orange-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{t.days} days</span>
                    <span className="font-bold text-[#1a3c5e]">
                      {formatNairaAmount(t.priceKobo)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBoostingListing(null)
                setSelectedTierDays(null)
              }}
              disabled={boostMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (boostingListing && selectedTierDays) {
                  boostMutation.mutate({ listingId: boostingListing.id, tierDays: selectedTierDays })
                }
              }}
              disabled={!selectedTierDays || boostMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {boostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Pay & boost"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
