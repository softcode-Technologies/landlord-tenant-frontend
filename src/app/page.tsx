import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  Shield,
  Star,
  Users,
  Building,
  CheckCircle2,
  MapPin,
  Zap,
  TrendingUp,
  MessageCircle,
  ArrowRight,
  Home,
} from "lucide-react"

const FEATURED_LISTINGS = [
  {
    id: "1",
    title: "Modern 3-Bedroom Flat, Lekki Phase 1",
    location: "Lekki, Lagos",
    price: "₦2,400,000",
    beds: 3,
    baths: 2,
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop",
    rating: 4.8,
  },
  {
    id: "2",
    title: "Executive 2-Bedroom Apartment, Maitama",
    location: "Maitama, Abuja",
    price: "₦1,800,000",
    beds: 2,
    baths: 2,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    rating: 4.9,
  },
  {
    id: "3",
    title: "Luxury Penthouse, Victoria Island",
    location: "Victoria Island, Lagos",
    price: "₦5,000,000",
    beds: 4,
    baths: 3,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
    rating: 5.0,
  },
]

const STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Search & Filter",
    description:
      "Browse thousands of verified listings across Nigeria. Filter by location, price, bedrooms, and more.",
    color: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    step: "02",
    icon: Shield,
    title: "Book Inspection",
    description:
      "Pay a small fee to unlock landlord contact details and schedule an in-person property inspection.",
    color: "bg-orange-50",
    iconColor: "text-[#f97316]",
  },
  {
    step: "03",
    icon: CheckCircle2,
    title: "Move In",
    description:
      "Accept your tenancy invite, sign your digital agreement, and move into your new home.",
    color: "bg-green-50",
    iconColor: "text-green-600",
  },
]

const STATS = [
  { value: "12,000+", label: "Active Listings", icon: Building },
  { value: "5,400+", label: "Verified Landlords", icon: Users },
  { value: "28,000+", label: "Happy Tenants", icon: Home },
  { value: "36", label: "States Covered", icon: MapPin },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#1a3c5e] via-[#1e4a72] to-[#0f2d48] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-6 bg-[#f97316] text-white border-0 text-sm px-3 py-1">
              Nigeria&apos;s #1 Rental Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Find Your Perfect
              <span className="text-[#f97316] block">Home in Nigeria</span>
            </h1>
            <p className="text-lg text-slate-300 mb-10 leading-relaxed max-w-xl">
              Discover verified rental properties across Lagos, Abuja, Port Harcourt, and
              all 36 states. Transparent pricing, no hidden fees.
            </p>

            {/* Search bar */}
            <div className="bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row gap-2 max-w-2xl">
              <div className="flex-1 flex items-center gap-3 px-4 py-2">
                <MapPin className="h-5 w-5 text-[#1a3c5e] shrink-0" />
                <input
                  type="text"
                  placeholder="Search by city, state or address..."
                  className="flex-1 text-slate-900 text-sm outline-none placeholder:text-slate-400 bg-transparent"
                  readOnly
                />
              </div>
              <Link href="/listings">
                <Button className="sm:w-auto w-full h-12 px-6 text-sm bg-[#f97316] hover:bg-[#f97316]/90 text-white rounded-xl">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </Link>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2 mt-5">
              {["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"].map((city) => (
                <Link key={city} href={`/listings?city=${city}`}>
                  <span className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full cursor-pointer transition-colors inline-block">
                    {city}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" className="w-full" fill="none">
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="#f8fafc" />
          </svg>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#f8fafc] py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-6 w-6 text-[#f97316] mx-auto mb-2" />
                <p className="text-2xl font-bold text-[#1a3c5e]">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Featured Properties</h2>
              <p className="text-slate-500">Hand-picked premium listings across Nigeria</p>
            </div>
            <Link href="/listings" className="hidden sm:block">
              <Button variant="outline" className="gap-2">
                View All
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_LISTINGS.map((listing) => (
              <Link key={listing.id} href="/listings">
                <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-[#f97316] text-[#f97316]" />
                      <span className="text-xs font-bold text-slate-900">
                        {listing.rating}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-[#1a3c5e] transition-colors">
                      {listing.title}
                    </h3>
                    <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {listing.location}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-[#1a3c5e]">{listing.price}</span>
                      <span className="text-xs text-slate-400">
                        {listing.beds}bd &middot; {listing.baths}ba
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/listings">
              <Button variant="outline" className="gap-2">
                View All Listings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-[#1a3c5e] border-[#1a3c5e]">
              Simple Process
            </Badge>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              How NaijaRental Works
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              From search to move-in in three simple steps. No stress, no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.step} className="relative text-center">
                <div
                  className={`relative inline-flex items-center justify-center w-20 h-20 rounded-2xl ${step.color} mb-6`}
                >
                  <step.icon className={`h-9 w-9 ${step.iconColor}`} />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-[#1a3c5e] text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4 text-[#1a3c5e] border-[#1a3c5e]">
                Why NaijaRental
              </Badge>
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                Everything you need for a seamless rental experience
              </h2>
              <div className="space-y-4">
                {[
                  {
                    icon: Shield,
                    title: "Verified Listings",
                    desc: "All properties go through our KYC verification process.",
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    icon: Zap,
                    title: "Instant OTP Login",
                    desc: "No passwords needed — sign in with just your phone number.",
                    color: "text-[#f97316]",
                    bg: "bg-orange-50",
                  },
                  {
                    icon: MessageCircle,
                    title: "In-App Messaging",
                    desc: "Chat directly with landlords and agents in real-time.",
                    color: "text-green-600",
                    bg: "bg-green-50",
                  },
                  {
                    icon: TrendingUp,
                    title: "Credit Score Tracking",
                    desc: "Build your rental history and improve your tenant credit score.",
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                ].map((feature) => (
                  <div key={feature.title} className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${feature.bg} shrink-0`}>
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{feature.title}</h4>
                      <p className="text-sm text-slate-500">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] rounded-3xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Landlord Dashboard Preview</h3>
                <div className="space-y-3">
                  {[
                    { label: "Active Tenancies", value: "12", change: "+2 this month" },
                    { label: "Monthly Revenue", value: "₦4.2M", change: "+18% vs last month" },
                    { label: "Pending Maintenance", value: "3", change: "2 urgent" },
                    { label: "Avg. Credit Score", value: "742", change: "Tenants" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between bg-white/10 rounded-xl p-4"
                    >
                      <div>
                        <p className="text-sm text-slate-300">{item.label}</p>
                        <p className="text-xl font-bold">{item.value}</p>
                      </div>
                      <span className="text-xs text-slate-400 text-right">{item.change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#f97316] to-[#ea6b0e]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to find your next home?
          </h2>
          <p className="text-orange-100 text-lg mb-8 max-w-xl mx-auto">
            Join over 28,000 Nigerians who found their perfect rental through NaijaRental.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/listings">
              <Button
                size="lg"
                className="bg-white text-[#f97316] hover:bg-white/90 font-semibold px-8"
              >
                Browse Listings
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 font-semibold px-8"
              >
                Create Free Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
