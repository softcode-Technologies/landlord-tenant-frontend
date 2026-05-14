"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Bed, Bath, Heart, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatNairaAmount } from "@/lib/utils"
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

  const imageUrl = listing.images?.[0] ?? "/placeholder-property.jpg"

  return (
    <Link href={`/listings/${listing.id}`}>
      <div className="group rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-slate-100">
          <Image
            src={imageUrl}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop"
            }}
          />
          {listing.isFeatured && (
            <Badge className="absolute top-3 left-3 bg-[#f97316] text-white">
              Featured
            </Badge>
          )}
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
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-bold text-[#1a3c5e]">
                {formatNairaAmount(listing.rentPerAnnum)}
              </span>
              <span className="text-xs text-slate-400">/year</span>
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
