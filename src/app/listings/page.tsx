"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { ListingCard } from "@/components/shared/listing-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { listingsApi } from "@/lib/api/listings"
import { SlidersHorizontal, Search, ChevronLeft, ChevronRight } from "lucide-react"

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
]

function ListingsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [filters, setFilters] = useState({
    city: searchParams.get("city") ?? "",
    state: searchParams.get("state") ?? "",
    minRent: searchParams.get("minRent") ?? "",
    maxRent: searchParams.get("maxRent") ?? "",
    page: parseInt(searchParams.get("page") ?? "1"),
  })
  const [showFilters, setShowFilters] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ["listings", filters],
    queryFn: () =>
      listingsApi.getListings({
        city: filters.city || undefined,
        state: filters.state || undefined,
        minRent: filters.minRent ? parseInt(filters.minRent) * 100 : undefined,
        maxRent: filters.maxRent ? parseInt(filters.maxRent) * 100 : undefined,
        page: filters.page,
        limit: 12,
      }),
  })

  const listings = data?.data?.data ?? []
  const pagination = data?.data?.pagination

  const handleSearch = () => {
    setFilters((f) => ({ ...f, page: 1 }))
  }

  const handlePageChange = (newPage: number) => {
    setFilters((f) => ({ ...f, page: newPage }))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="bg-[#1a3c5e] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Browse Listings</h1>
          <p className="text-slate-300">
            {pagination?.total ? `${pagination.total.toLocaleString()} properties available` : "Find your perfect rental"}
          </p>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-72 shrink-0`}>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">Filters</h3>
                <button
                  onClick={() => setFilters({ city: "", state: "", minRent: "", maxRent: "", page: 1 })}
                  className="text-xs text-[#f97316] hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block">City</Label>
                  <Input
                    placeholder="e.g. Lekki, Maitama"
                    value={filters.city}
                    onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">State</Label>
                  <Select
                    value={filters.state}
                    onValueChange={(val) => setFilters((f) => ({ ...f, state: val === "all" ? "" : val }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      {NIGERIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2 block">Min Rent (₦/year)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 500000"
                    value={filters.minRent}
                    onChange={(e) => setFilters((f) => ({ ...f, minRent: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Max Rent (₦/year)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 3000000"
                    value={filters.maxRent}
                    onChange={(e) => setFilters((f) => ({ ...f, maxRent: e.target.value }))}
                  />
                </div>

                <Button onClick={handleSearch} className="w-full">
                  <Search className="h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-slate-200">
                    <Skeleton className="h-52 w-full rounded-none" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-16">
                <div className="p-4 rounded-2xl bg-slate-100 inline-block mb-4">
                  <Search className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No listings found</h3>
                <p className="text-slate-500 text-sm">
                  Try adjusting your filters or search in a different area.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(filters.page - 1)}
                      disabled={filters.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    {Array.from({ length: Math.min(pagination.totalPages, 7) }).map((_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === filters.page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-9 h-9"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(filters.page + 1)}
                      disabled={filters.page >= pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <ListingsContent />
    </Suspense>
  )
}
