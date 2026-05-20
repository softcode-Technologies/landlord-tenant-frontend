import type { Metadata } from "next"
import { Suspense } from "react"
import { ListingsContent } from "./listings-content"
import { BRAND_NAME } from "@/lib/config/brand"

export const metadata: Metadata = {
  title: "Browse Rental Listings in Nigeria",
  description: `Find verified rental properties across Nigeria — Lagos, Abuja, Port Harcourt, and all 36 states. Filter by location, price, and property type on ${BRAND_NAME}.`,
  openGraph: {
    title: `Browse Rental Listings in Nigeria | ${BRAND_NAME}`,
    description:
      "Find verified rental properties across Nigeria — Lagos, Abuja, Port Harcourt, and all 36 states.",
    type: "website",
    siteName: BRAND_NAME,
  },
  twitter: {
    card: "summary",
    title: `Browse Rental Listings in Nigeria | ${BRAND_NAME}`,
    description:
      "Find verified rental properties across Nigeria — Lagos, Abuja, Port Harcourt, and all 36 states.",
  },
}

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1e]" />}>
      <ListingsContent />
    </Suspense>
  )
}
