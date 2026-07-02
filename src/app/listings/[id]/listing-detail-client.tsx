"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { listingsApi } from "@/lib/api/listings"
import { inspectionsApi } from "@/lib/api/inspections"
import { reviewsApi } from "@/lib/api/reviews"
import { messagingApi } from "@/lib/api/messaging"
import { useAuthStore } from "@/lib/store/auth"
import { formatNairaAmount, formatDate, getInitials, rentCycleSuffix, rentCycleWord } from "@/lib/utils"
import type { Listing } from "@/lib/types"
import {
  MapPin, Bed, Bath, Star, Heart, Share2, Calendar, Phone,
  CheckCircle2, ArrowLeft, User, Loader2, Eye, ChevronLeft, ChevronRight,
  BadgeCheck, Clock,
} from "lucide-react"

const PLACEHOLDER_IMAGE = "/placeholder-property.svg"

// Self-contained gallery image: holds a skeleton until the real bytes decode,
// then fades in — so a stale/cached or wrong image never flashes before the
// correct one. Falls back to a placeholder if the URL is broken.
function GalleryImage({
  src,
  alt,
  priority,
}: {
  src: string
  alt: string
  priority?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)
  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={errored ? PLACEHOLDER_IMAGE : src}
        alt={alt}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => {
          setErrored(true)
          setLoaded(true)
        }}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </>
  )
}
import Link from "next/link"
import { toast } from "sonner"
import { BRAND_NAME } from "@/lib/config/brand"

interface Props {
  initialListing?: Listing | null
}

export function ListingDetailClient({ initialListing }: Props) {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  const queryClient = useQueryClient()

  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("paid") === "true") {
      toast.success("Payment successful! Contact details are now unlocked.")
      queryClient.invalidateQueries({ queryKey: ["listing-contact", id] })
      router.replace(`/listings/${id}`, { scroll: false })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [activeImage, setActiveImage] = useState(0)
  const [saved, setSaved] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [scheduledAt, setScheduledAt] = useState("")
  const [scheduleNote, setScheduleNote] = useState("")

  const localDateTimeString = (offsetMinutes = 0) => {
    const d = new Date(Date.now() + offsetMinutes * 60000)
    d.setSeconds(0, 0)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.getListing(id),
    initialData: initialListing ? ({ data: initialListing } as never) : undefined,
  })

  const propertyId = data?.data?.propertyId
  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", "property", propertyId],
    queryFn: () => reviewsApi.getReviewsBySubject("property", propertyId!),
    enabled: !!propertyId,
  })

  const listing = data?.data
  const reviews = reviewsData?.data?.reviews ?? []

  const { data: contactData } = useQuery({
    queryKey: ["listing-contact", id],
    queryFn: () => inspectionsApi.getListingContact(id),
    enabled: isAuthenticated,
    retry: false,
    refetchOnMount: true,
  })
  const contact = contactData?.data

  // The tenant's inspection requests (used to reflect a booked inspection on the
  // CTA). Only relevant once the contact is unlocked, since that's when booking
  // is possible.
  const { data: mySchedulesData } = useQuery({
    queryKey: ["my-schedules"],
    queryFn: () => inspectionsApi.getMySchedules(),
    enabled: isAuthenticated && !!contact,
  })

  // An inspection for THIS listing that should block re-booking. A request only
  // blocks while it's still upcoming and unresolved (pending/confirmed). Once the
  // scheduled time passes with no landlord response — or the landlord
  // cancelled/closed it — the tenant is free to book again.
  const activeInspection = (mySchedulesData?.data ?? [])
    .filter(
      (s) =>
        s.listingId === id &&
        (s.status === "pending" || s.status === "confirmed") &&
        new Date(s.scheduledAt).getTime() > Date.now(),
    )
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0]

  const formatInspectionSlot = (iso: string) =>
    new Date(iso).toLocaleString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    })

  // Drives the unlock copy. Default to "paid" until config loads so we never
  // wrongly promise a free unlock.
  const { data: unlockConfigData } = useQuery({
    queryKey: ["unlock-config"],
    queryFn: () => inspectionsApi.getUnlockConfig(),
    staleTime: 5 * 60 * 1000,
  })
  const feeEnabled = unlockConfigData?.data?.feeEnabled ?? true
  const feeKobo = unlockConfigData?.data?.feeKobo ?? 150000
  const feeNaira = `₦${(feeKobo / 100).toLocaleString("en-NG")}`
  const firstUnlockFreePolicy = unlockConfigData?.data?.firstUnlockFree ?? false

  // Per-user: is THIS user's first unlock still free? Only queried when signed in.
  const { data: unlockStatusData } = useQuery({
    queryKey: ["unlock-status"],
    queryFn: () => inspectionsApi.getUnlockStatus(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  })
  const firstUnlockAvailable = unlockStatusData?.data?.firstUnlockAvailable ?? false

  // The fee applies, but this unlock will be free: a signed-in user with their
  // first unlock still available, or a signed-out viewer while the promo is on
  // (they have no account yet, so their first unlock will be free).
  const firstFree = feeEnabled && (isAuthenticated ? firstUnlockAvailable : firstUnlockFreePolicy)
  const willBeFree = !feeEnabled || firstFree

  const unlockMutation = useMutation({
    mutationFn: () => inspectionsApi.unlockListing(id),
    onSuccess: (res) => {
      if (res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl
        return
      }
      // Free unlock (promo or first-unlock-free) — access granted immediately.
      queryClient.invalidateQueries({ queryKey: ["listing-contact", id] })
      queryClient.invalidateQueries({ queryKey: ["unlock-status"] })
      toast.success(res.data.reason === "first_unlock_free" ? "Your first unlock is on us 🎉" : "Contact unlocked!")
    },
    onError: () => {
      toast.error("Failed to unlock contact. Please try again.")
    },
  })

  const messageMutation = useMutation({
    mutationFn: () => {
      if (!listing?.lister?.id) throw new Error("Lister not available")
      return messagingApi.createConversation({
        recipientUserId: listing.lister.id,
        body: `Hi, I'm interested in your listing: ${listing.title}`,
      })
    },
    onSuccess: () => {
      const role = user?.tenantProfile
        ? "tenant"
        : user?.landlordProfile
        ? "landlord"
        : user?.agentProfile
        ? "agent"
        : "tenant"
      router.push(`/${role}/messages`)
    },
    onError: () => {
      toast.error("Failed to start conversation.")
    },
  })

  const scheduleMutation = useMutation({
    mutationFn: () =>
      inspectionsApi.scheduleInspection(id, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        note: scheduleNote,
      }),
    onSuccess: () => {
      toast.success("Inspection request sent! You'll be notified when the landlord responds.")
      setScheduleOpen(false)
      setScheduledAt("")
      setScheduleNote("")
      // Reflect the new request on the CTA right away.
      queryClient.invalidateQueries({ queryKey: ["my-schedules"] })
    },
    onError: () => {
      toast.error("Failed to schedule inspection. Please try again.")
    },
  })

  const handleSave = async () => {
    if (!isAuthenticated) { router.push("/login"); return }
    try {
      if (saved) {
        await listingsApi.unsaveListing(id)
        setSaved(false)
        toast.success("Removed from saved")
      } else {
        await listingsApi.saveListing(id)
        setSaved(true)
        toast.success("Saved!")
      }
    } catch {
      toast.error("Failed to save listing")
    }
  }

  const handleShare = () => {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: listing?.title ?? `${BRAND_NAME} Listing`, url })
    } else {
      navigator.clipboard.writeText(url)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleWhatsApp = () => {
    if (!listing) return
    const location = [listing.area, listing.city, listing.state].filter(Boolean).join(", ")
    const text = `Check out this ${listing.bedrooms} bed ${listing.propertyType} in ${location} for ₦${Number(listing.rentPerAnnum).toLocaleString("en-NG")}/${rentCycleWord(listing.rentCycle)} on ${BRAND_NAME}:\n${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const handleBookInspection = () => {
    if (!isAuthenticated) { router.push("/login?redirect=/listings/" + id); return }
    // An upcoming, unresolved inspection already exists — don't allow a duplicate.
    if (activeInspection) {
      toast.info("You already have an inspection request for this listing.")
      return
    }
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const pad = (n: number) => String(n).padStart(2, "0")
    const defaultVal = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`
    setScheduledAt(defaultVal)
    setScheduleOpen(true)
  }

  const handleUnlock = () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${id}`); return }
    unlockMutation.mutate()
  }

  const handleMessage = () => {
    if (!isAuthenticated) { router.push(`/login?redirect=/listings/${id}`); return }
    messageMutation.mutate()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <Skeleton className="h-96 w-full rounded-2xl mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Listing not found</h2>
            <Link href="/listings"><Button>Back to Listings</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const validImages = Array.from(
    new Set(
      (listing.images ?? []).filter(
        (u): u is string => typeof u === "string" && /^https?:\/\//.test(u),
      ),
    ),
  )
  const images = validImages.length > 0 ? validImages : [PLACEHOLDER_IMAGE]
  const safeIndex = Math.min(activeImage, images.length - 1)
  const goPrev = () => setActiveImage((i) => (i - 1 + images.length) % images.length)
  const goNext = () => setActiveImage((i) => (i + 1) % images.length)

  const listerName =
    listing.lister
      ? `${listing.lister.firstName ?? ""} ${listing.lister.lastName ?? ""}`.trim() || "Landlord"
      : "Landlord"

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 lg:pb-8 w-full">
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="group relative h-72 sm:h-[460px] lg:h-[520px] rounded-2xl overflow-hidden mb-3 bg-slate-100 dark:bg-slate-800">
            <GalleryImage
              key={images[safeIndex]}
              src={images[safeIndex]}
              alt={listing.title}
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {listing.isFeatured && (
              <Badge className="absolute top-4 left-4 bg-[#f97316] text-white border-0 shadow-lg">
                Featured
              </Badge>
            )}

            {images.length > 1 && (
              <>
                <div className="absolute bottom-4 right-4 bg-black/55 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {safeIndex + 1} / {images.length}
                </div>
                <button
                  onClick={goPrev}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goNext}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/85 hover:bg-white text-slate-800 flex items-center justify-center shadow-md transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`relative w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                    safeIndex === index
                      ? "border-[#f97316] ring-2 ring-[#f97316]/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{listing.title}</h1>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="text-sm">
                    {[listing.area, listing.lga, listing.city, listing.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
                {listing.isListerVerified && (
                  <div className="inline-flex items-center gap-1.5 mt-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    KYC-verified landlord
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSave}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  aria-label="Save listing"
                >
                  <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                  aria-label="Share listing"
                >
                  <Share2 className="h-4 w-4 text-slate-400" />
                </button>
                {/* WhatsApp share — big in Nigeria */}
                <button
                  onClick={handleWhatsApp}
                  className="p-2.5 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Status & views */}
            <div className="flex items-center gap-3 flex-wrap">
              {listing.status === "active" && (
                <Badge className="bg-green-100 text-green-700 border-green-200 border">Vacant</Badge>
              )}
              {listing.status === "paused" && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border">Paused</Badge>
              )}
              {listing.status === "closed" && (
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 border">Rented</Badge>
              )}
              {typeof listing.viewCount === "number" && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{listing.viewCount.toLocaleString()} views</span>
                </div>
              )}
            </div>

            {/* Property Details */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl">
                <Bed className="h-4 w-4 text-[#1a3c5e] dark:text-blue-400" />
                <span className="text-sm font-medium">{listing.bedrooms} Bedrooms</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl">
                <Bath className="h-4 w-4 text-[#1a3c5e] dark:text-blue-400" />
                <span className="text-sm font-medium">{listing.bathrooms} Bathrooms</span>
              </div>
              {listing.isFurnished && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Furnished</span>
                </div>
              )}
              {listing.isServiced && (
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Serviced</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl">
                <span className="text-sm font-medium capitalize">{listing.propertyType}</span>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {listing.description}
                </p>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Reviews</CardTitle>
                  {listing.averageRating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-[#f97316] text-[#f97316]" />
                      <span className="font-semibold">{listing.averageRating.toFixed(1)}</span>
                      <span className="text-slate-400 text-sm">({listing.reviewCount})</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-slate-400 text-sm">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-slate-100 pb-4 last:border-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={review.author?.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {getInitials(
                                `${review.author?.firstName ?? ""} ${review.author?.lastName ?? ""}`
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              {review.author?.firstName} {review.author?.lastName}
                            </p>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "fill-[#f97316] text-[#f97316]"
                                      : "text-slate-200"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-slate-400 ml-auto">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 ml-11">{review.comment}</p>
                        )}
                        {review.reply && (
                          <div className="ml-11 mt-2 bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                              Landlord response:
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{review.reply}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#1a3c5e] dark:text-blue-400">
                    {formatNairaAmount(listing.rentPerAnnum)}
                  </span>
                  <span className="text-slate-400 text-sm">{rentCycleSuffix(listing.rentCycle)}</span>
                </div>

                {contact ? (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Contact Unlocked
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-2 text-sm text-slate-900">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          {contact.lister?.name}
                        </div>
                        <a
                          href={`tel:${contact.lister?.phone}`}
                          className="flex items-center gap-2 text-sm text-[#1a3c5e] font-medium hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {contact.lister?.phone}
                        </a>
                      </div>
                    </div>
                    {activeInspection ? (
                      <div>
                        <div
                          className={`w-full h-12 rounded-md flex items-center justify-center gap-2 px-3 text-sm font-medium ${
                            activeInspection.status === "confirmed"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {activeInspection.status === "confirmed" ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          {activeInspection.status === "confirmed"
                            ? "Inspection confirmed"
                            : "Inspection requested"}
                        </div>
                        <p className="text-xs text-slate-400 text-center mt-1.5">
                          {formatInspectionSlot(activeInspection.scheduledAt)}
                          {activeInspection.status === "pending"
                            ? " · awaiting landlord confirmation"
                            : ""}
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={handleBookInspection}
                        className="w-full h-12 bg-[#f97316] hover:bg-[#f97316]/90 text-white"
                      >
                        <Calendar className="h-4 w-4" />
                        Book Inspection
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleUnlock}
                      className="w-full mb-3 h-12 bg-[#f97316] hover:bg-[#f97316]/90 text-white"
                      disabled={unlockMutation.isPending}
                    >
                      {unlockMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                      {willBeFree ? "Unlock Contact — Free" : "Unlock Contact"}
                    </Button>
                    <p className="text-xs text-slate-400 text-center">
                      {!feeEnabled
                        ? "Unlock the verified landlord's contact for free, then book an inspection"
                        : firstFree
                          ? `Your first unlock is on us — then ${feeNaira} each. Unlock the verified landlord's contact, then book an inspection.`
                          : `Pay ${feeNaira} to unlock verified landlord contact details, then book an inspection`}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {listing.lister && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={listing.lister.avatarUrl} />
                      <AvatarFallback>{getInitials(listerName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{listerName}</p>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">Landlord</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleMessage}
                    disabled={messageMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {messageMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Send Message
                  </button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky action bar — sidebar CTA is far down on phones */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-[#0a0f1e] border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="min-w-0">
          <p className="text-lg font-bold text-[#1a3c5e] dark:text-blue-400 leading-tight">
            {formatNairaAmount(listing.rentPerAnnum)}
            <span className="text-xs font-normal text-slate-400">{rentCycleSuffix(listing.rentCycle)}</span>
          </p>
        </div>
        {contact ? (
          activeInspection ? (
            <div
              className={`flex-1 h-11 rounded-md flex items-center justify-center gap-2 px-3 text-sm font-medium ${
                activeInspection.status === "confirmed"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {activeInspection.status === "confirmed" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {activeInspection.status === "confirmed" ? "Inspection confirmed" : "Inspection requested"}
            </div>
          ) : (
            <Button
              onClick={handleBookInspection}
              className="flex-1 h-11 bg-[#f97316] hover:bg-[#f97316]/90 text-white gap-2"
            >
              <Calendar className="h-4 w-4" />
              Book Inspection
            </Button>
          )
        ) : (
          <Button
            onClick={handleUnlock}
            disabled={unlockMutation.isPending}
            className="flex-1 h-11 bg-[#f97316] hover:bg-[#f97316]/90 text-white gap-2"
          >
            {unlockMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            {willBeFree ? "Unlock Contact — Free" : "Unlock Contact"}
          </Button>
        )}
      </div>

      {/* Schedule Inspection Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule an Inspection</DialogTitle>
            <DialogDescription>
              Pick a date and time to visit this property.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Preferred Date & Time</Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1.5"
                min={localDateTimeString(60)}
              />
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Any specific questions or requirements?"
                value={scheduleNote}
                onChange={(e) => setScheduleNote(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!scheduledAt || scheduleMutation.isPending}
              onClick={() => {
                if (new Date(scheduledAt) <= new Date()) {
                  toast.error("Please select a future date and time.")
                  return
                }
                scheduleMutation.mutate()
              }}
            >
              {scheduleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm Inspection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
