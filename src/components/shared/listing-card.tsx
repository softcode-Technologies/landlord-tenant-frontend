"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Bed, Bath, Heart, Star, BadgeCheck, Eye, Building2, Store } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNairaAmount, rentCycleWord } from "@/lib/utils"
import type { Listing } from "@/lib/types"
import { useState } from "react"
import { listingsApi } from "@/lib/api/listings"
import { toast } from "sonner"

interface ListingCardProps {
  listing: Listing
  onSaveToggle?: () => void
}

export function ListingCard({ listing, onSaveToggle }: ListingCardProps) {
  const [saved, setSaved] = useState(listing.isSaved ?? false)
  const [saving, setSaving] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSaving(true)
    try {
      if (saved) {
        await listingsApi.unsaveListing(listing.id)
        setSaved(false)
        toast.success("Removed from saved")
      } else {
        await listingsApi.saveListing(listing.id)
        setSaved(true)
        toast.success("Saved to your list")
      }
      onSaveToggle?.()
    } catch {
      toast.error("Please log in to save listings")
    } finally {
      setSaving(false)
    }
  }

  const imageUrl = listing.images?.[0]
  const showImage = Boolean(imageUrl) && !imgError

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-slate-100">
          {showImage ? (
            <Image
              src={imageUrl as string}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0a1e33] via-[#0f2d48] to-[#1a3c5e]">
              <Building2 className="h-10 w-10 text-[#f97316]/80" />
              <span className="text-xs font-medium text-slate-300">No photo available</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-1.5">
            {listing.isFeatured && (
              <Badge className="bg-[#f97316] text-white">Featured</Badge>
            )}
            {listing.isListerVerified && (
              <Badge className="bg-[#1a3c5e] text-white gap-1 px-2">
                <BadgeCheck className="h-3 w-3" />
                Verified
              </Badge>
            )}
          </div>

          {/* View count */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            <Eye className="h-3 w-3" />
            <span>{(listing.viewCount ?? 0).toLocaleString()}</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${saved ? "fill-red-500 text-red-500" : "text-slate-400"}`}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-slate-900 text-sm leading-tight line-clamp-1 group-hover:text-[#1a3c5e] transition-colors">
              {listing.title}
            </h3>
            {listing.averageRating ? (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="h-3.5 w-3.5 fill-[#f97316] text-[#f97316]" />
                <span className="text-xs font-medium text-slate-600">
                  {listing.averageRating.toFixed(1)}
                </span>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-1 text-slate-500 mb-3">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs truncate">
              {[listing.area, listing.lga, listing.state].filter(Boolean).join(", ")}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
            {listing.propertyType === "commercial" ? (
              <div className="flex items-center gap-1">
                <Store className="h-3.5 w-3.5" />
                <span>Shop / commercial space</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <Bed className="h-3.5 w-3.5" />
                  <span>{listing.bedrooms} bed{listing.bedrooms !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bath className="h-3.5 w-3.5" />
                  <span>{listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}</span>
                </div>
                {listing.isFurnished && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Furnished
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-[#1a3c5e]">
                {formatNairaAmount(listing.rentPerAnnum)}
              </span>
              <span className="text-xs text-slate-400">/{rentCycleWord(listing.rentCycle)}</span>
            </div>
            <Button size="sm" variant="outline" className="text-xs h-7 px-3">
              View
            </Button>
          </div>
        </div>
      </div>
    </Link>
  )
}
