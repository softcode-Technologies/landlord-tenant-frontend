import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/shared/listing-card"
import { BRAND_NAME } from "@/lib/config/brand"
import type { Listing } from "@/lib/types"
import {
  ALL_STATES,
  PRIORITY_LOCATIONS,
  getStateLgas,
  lgaHref,
  stateHref,
  stateDisplayName,
} from "@/lib/seo/locations"
import { ChevronRight, MapPin, Search, Building2 } from "lucide-react"

interface Props {
  state: string
  lga?: string
  listings: Listing[]
  total: number
}

export function LocationListings({ state, lga, listings, total }: Props) {
  const stateLabel = stateDisplayName(state)
  const locationLabel = lga ? `${lga}, ${stateLabel}` : stateLabel
  const h1 = `Property for Rent in ${locationLabel}`

  // Funnel into the interactive, filterable search for this location.
  const browseHref = `/listings?state=${encodeURIComponent(state)}${
    lga ? `&lga=${encodeURIComponent(lga)}` : ""
  }`

  // Internal links: sibling areas for an LGA page, or the state's areas for a
  // state page — plus a curated set of other popular markets.
  const siblingLgas = getStateLgas(state).filter((l) => l !== lga)
  const otherLocations = PRIORITY_LOCATIONS.filter(
    (l) => !(l.state === state && l.lga === lga),
  ).slice(0, 8)
  const otherStates = ALL_STATES.filter((s) => s !== state).slice(0, 12)

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0f1e]">
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#0a1e33] via-[#0f2d48] to-[#1a3c5e] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-300 mb-5 flex-wrap">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="h-3 w-3 text-slate-500" />
            <Link href="/listings" className="hover:text-white">Rentals</Link>
            <ChevronRight className="h-3 w-3 text-slate-500" />
            {lga ? (
              <>
                <Link href={stateHref(state)} className="hover:text-white">{stateLabel}</Link>
                <ChevronRight className="h-3 w-3 text-slate-500" />
                <span className="text-white font-medium">{lga}</span>
              </>
            ) : (
              <span className="text-white font-medium">{stateLabel}</span>
            )}
          </nav>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{h1}</h1>
          <p className="text-slate-300/90 text-[15px] leading-relaxed max-w-2xl mb-6">
            Find verified rental properties for rent in {locationLabel}. Every listing on{" "}
            {BRAND_NAME} comes from a KYC-verified landlord or agent, with the real rent,
            agency fee, and service charge shown upfront — so you can rent in {lga ?? stateLabel}{" "}
            with confidence and zero scams.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={browseHref}>
              <Button className="h-11 px-6 bg-[#f97316] hover:bg-[#ea6b0e] text-white font-semibold rounded-xl gap-2">
                <Search className="h-4 w-4" />
                Browse &amp; filter homes in {lga ?? stateLabel}
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="outline"
                className="h-11 px-6 bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08] hover:text-white rounded-xl font-semibold"
              >
                List your property
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-4 w-4 text-[#f97316]" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {total > 0
              ? `${total.toLocaleString()} verified ${total === 1 ? "rental" : "rentals"} in ${locationLabel}`
              : `No live listings in ${locationLabel} yet`}
          </p>
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No verified listings in {locationLabel} just yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              New homes are added every week. Browse nearby areas, or if you own property here,
              list it free and reach verified tenants in {lga ?? stateLabel}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/listings">
                <Button variant="outline" className="rounded-xl">Browse all rentals</Button>
              </Link>
              <Link href="/login">
                <Button className="rounded-xl bg-[#f97316] hover:bg-[#ea6b0e] text-white">
                  List your property free
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Internal links */}
        <div className="mt-14 border-t border-slate-200 dark:border-slate-800 pt-10 space-y-8">
          {siblingLgas.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                {lga ? `Other areas in ${stateLabel}` : `Popular areas in ${stateLabel}`}
              </h2>
              <div className="flex flex-wrap gap-2">
                {siblingLgas.map((l) => (
                  <Link
                    key={l}
                    href={lgaHref(state, l)}
                    className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#f97316]/40 hover:text-[#f97316] transition-colors"
                  >
                    Rent in {l}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Popular rental markets
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherLocations.map((l) => (
                <Link
                  key={`${l.state}-${l.lga}`}
                  href={lgaHref(l.state, l.lga)}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#f97316]/40 hover:text-[#f97316] transition-colors"
                >
                  {l.lga}, {stateDisplayName(l.state)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Browse rentals by state
            </h2>
            <div className="flex flex-wrap gap-2">
              {otherStates.map((s) => (
                <Link
                  key={s}
                  href={stateHref(s)}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#f97316]/40 hover:text-[#f97316] transition-colors"
                >
                  {stateDisplayName(s)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
