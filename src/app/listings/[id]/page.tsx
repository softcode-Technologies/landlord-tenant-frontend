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
import { formatNairaAmount, formatDate, getInitials } from "@/lib/utils"
import {
  MapPin, Bed, Bath, Star, Heart, Share2, Calendar, Phone,
  CheckCircle2, ArrowLeft, User, Loader2, Eye
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function ListingDetailPage() {
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

  // Returns a datetime-local string in local timezone with an optional offset in minutes
  const localDateTimeString = (offsetMinutes = 0) => {
    const d = new Date(Date.now() + offsetMinutes * 60000)
    d.setSeconds(0, 0)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const { data, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => listingsApi.getListing(id),
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

  const unlockMutation = useMutation({
    mutationFn: () => inspectionsApi.unlockListing(id),
    onSuccess: (res) => {
      window.location.href = res.data.paymentUrl
    },
    onError: () => {
      toast.error("Failed to initiate payment. Please try again.")
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
      toast.success("Inspection scheduled successfully!")
      setScheduleOpen(false)
      setScheduledAt("")
      setScheduleNote("")
    },
    onError: () => {
      toast.error("Failed to schedule inspection. Please try again.")
    },
  })

  const handleSave = async () => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
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

  const handleBookInspection = () => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/listings/" + id)
      return
    }
    // Default to tomorrow at 10:00 local time
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const pad = (n: number) => String(n).padStart(2, "0")
    const defaultVal = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T10:00`
    setScheduledAt(defaultVal)
    setScheduleOpen(true)
  }

  const handleUnlock = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/listings/${id}`)
      return
    }
    unlockMutation.mutate()
  }

  const handleMessage = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/listings/${id}`)
      return
    }
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

  const images =
    listing.images?.length > 0
      ? listing.images
      : ["https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=500&fit=crop"]

  const listerName =
    listing.lister
      ? `${listing.lister.firstName ?? ""} ${listing.lister.lastName ?? ""}`.trim() || "Landlord"
      : "Landlord"

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Back */}
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="relative h-80 sm:h-[500px] rounded-2xl overflow-hidden mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeImage]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            {listing.isFeatured && (
              <Badge className="absolute top-4 left-4 bg-[#f97316] text-white border-0">
                Featured
              </Badge>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(index)}
                  className={`w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${
                    activeImage === index ? "border-[#1a3c5e]" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Actions */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{listing.title}</h1>
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">
                    {listing.address}, {listing.city}, {listing.state}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSave}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Heart className={`h-4 w-4 ${saved ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                </button>
                <button className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <Share2 className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Status & views */}
            <div className="flex items-center gap-3 flex-wrap">
              {listing.status === "active" && (
                <Badge className="bg-green-100 text-green-700 border-green-200 border">
                  Vacant
                </Badge>
              )}
              {listing.status === "paused" && (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border">
                  Paused
                </Badge>
              )}
              {listing.status === "closed" && (
                <Badge className="bg-slate-100 text-slate-600 border-slate-200 border">
                  Rented
                </Badge>
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
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl">
                <Bed className="h-4 w-4 text-[#1a3c5e]" />
                <span className="text-sm font-medium">{listing.bedrooms} Bedrooms</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl">
                <Bath className="h-4 w-4 text-[#1a3c5e]" />
                <span className="text-sm font-medium">{listing.bathrooms} Bathrooms</span>
              </div>
              {listing.isFurnished && (
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Furnished</span>
                </div>
              )}
              {listing.isServiced && (
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Serviced</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl">
                <span className="text-sm font-medium capitalize">{listing.propertyType}</span>
              </div>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this property</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 leading-relaxed">
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
                            <p className="text-sm font-medium text-slate-900">
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
                          <p className="text-sm text-slate-600 ml-11">{review.comment}</p>
                        )}
                        {review.reply && (
                          <div className="ml-11 mt-2 bg-slate-50 rounded-xl p-3">
                            <p className="text-xs font-medium text-slate-700 mb-1">
                              Landlord response:
                            </p>
                            <p className="text-sm text-slate-600">{review.reply}</p>
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
            {/* Price Card */}
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="mb-4">
                  <span className="text-3xl font-bold text-[#1a3c5e]">
                    {formatNairaAmount(listing.rentPerAnnum)}
                  </span>
                  <span className="text-slate-400 text-sm">/year</span>
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
                    <Button
                      onClick={handleBookInspection}
                      className="w-full h-12 bg-[#f97316] hover:bg-[#f97316]/90 text-white"
                    >
                      <Calendar className="h-4 w-4" />
                      Book Inspection
                    </Button>
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
                      Unlock Contact
                    </Button>
                    <p className="text-xs text-slate-400 text-center">
                      Pay ₦1,500 to unlock landlord contact details, then book an inspection
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Lister Info */}
            {listing.lister && (
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={listing.lister.avatarUrl} />
                      <AvatarFallback>{getInitials(listerName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm text-slate-900">{listerName}</p>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        <span className="text-xs text-slate-500">Landlord</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full text-sm"
                    onClick={handleMessage}
                    disabled={messageMutation.isPending}
                  >
                    {messageMutation.isPending && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setScheduleOpen(false)}
            >
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
              {scheduleMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Confirm Inspection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
