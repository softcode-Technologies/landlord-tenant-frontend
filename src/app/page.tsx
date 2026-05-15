import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import {
  Search, Shield, Star, Users, Building, CheckCircle2, MapPin,
  Zap, TrendingUp, MessageCircle, ArrowRight, Home, BadgeCheck,
  ChevronRight, PlayCircle, Wallet, FileText,
} from "lucide-react"

const STATS = [
  { value: "12,000+", label: "Active Listings", icon: Building },
  { value: "5,400+", label: "Verified Landlords", icon: BadgeCheck },
  { value: "28,000+", label: "Happy Tenants", icon: Users },
  { value: "36", label: "States Covered", icon: MapPin },
]

const STEPS = [
  {
    step: "01",
    icon: Search,
    title: "Search & Discover",
    description: "Browse thousands of verified listings filtered by location, price, bedrooms, and amenities across all 36 Nigerian states.",
    gradient: "from-blue-500 to-blue-600",
    glow: "shadow-blue-500/20",
  },
  {
    step: "02",
    icon: Shield,
    title: "Verify & Inspect",
    description: "Pay a small fee to unlock verified landlord contact details and schedule a physical inspection at your convenience.",
    gradient: "from-[#f97316] to-[#ea6b0e]",
    glow: "shadow-orange-500/20",
  },
  {
    step: "03",
    icon: CheckCircle2,
    title: "Move In Seamlessly",
    description: "Accept your tenancy invite, sign a legally-binding digital agreement, and move in. We track rent, maintenance, and more.",
    gradient: "from-emerald-500 to-emerald-600",
    glow: "shadow-emerald-500/20",
  },
]

const FEATURES = [
  { icon: Shield, title: "KYC-Verified Listings", desc: "Every landlord and property goes through our identity verification before going live.", color: "text-blue-500", bg: "bg-blue-500/10" },
  { icon: Zap, title: "Instant OTP Login", desc: "No passwords, no friction. Sign in with just your Nigerian phone number.", color: "text-[#f97316]", bg: "bg-orange-500/10" },
  { icon: MessageCircle, title: "In-App Messaging", desc: "Chat with landlords and agents in real-time — all within one platform.", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { icon: TrendingUp, title: "Tenant Credit Scores", desc: "Build your rental track record and unlock better properties with a strong credit score.", color: "text-purple-500", bg: "bg-purple-500/10" },
  { icon: Wallet, title: "Integrated Payments", desc: "Pay rent securely through the platform. Landlords receive funds directly to their wallets.", color: "text-rose-500", bg: "bg-rose-500/10" },
  { icon: FileText, title: "Digital Agreements", desc: "Legally binding tenancy agreements created, signed, and stored entirely digitally.", color: "text-amber-500", bg: "bg-amber-500/10" },
]

const TESTIMONIALS = [
  {
    name: "Amaka Okonkwo",
    role: "Tenant · Lagos",
    avatar: "AO",
    quote: "I found my flat in Lekki within 3 days. The KYC verification gave me confidence the landlord was legit. No wahala at all!",
    rating: 5,
  },
  {
    name: "Chukwuemeka Adeyemi",
    role: "Landlord · Abuja",
    avatar: "CA",
    quote: "Managing 8 units has never been easier. I can see rent payments, send invites, and handle maintenance all from my phone.",
    rating: 5,
  },
  {
    name: "Fatima Suleiman",
    role: "Tenant · Port Harcourt",
    avatar: "FS",
    quote: "The credit score feature motivated me to pay my rent on time every month. Landlords trust me because of my NaijaRental score.",
    rating: 5,
  },
]

const FEATURED_LISTINGS = [
  {
    title: "Modern 3-Bedroom Flat, Lekki Phase 1",
    location: "Lekki, Lagos",
    price: "₦2,400,000",
    beds: 3, baths: 2,
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop",
    rating: 4.8,
    tag: "Featured",
  },
  {
    title: "Executive 2-Bedroom Apartment, Maitama",
    location: "Maitama, Abuja",
    price: "₦1,800,000",
    beds: 2, baths: 2,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    rating: 4.9,
    tag: "Verified",
  },
  {
    title: "Luxury Penthouse, Victoria Island",
    location: "Victoria Island, Lagos",
    price: "₦5,000,000",
    beds: 4, baths: 3,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop",
    rating: 5.0,
    tag: "Premium",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0f1e]">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2d48] via-[#1a3c5e] to-[#1e4a72] text-white min-h-[92vh] flex items-center">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        {/* Blobs */}
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-[#f97316]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
                <span className="w-2 h-2 bg-[#f97316] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-slate-200">Nigeria&apos;s #1 Rental Platform</span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-6xl font-bold leading-[1.05] mb-6 tracking-tight">
                Find Your Perfect
                <span className="block mt-1 bg-gradient-to-r from-[#f97316] to-[#fbbf24] bg-clip-text text-transparent">
                  Home in Nigeria
                </span>
              </h1>

              <p className="text-lg text-slate-300 mb-10 leading-relaxed">
                Discover verified rental properties across Lagos, Abuja, Port Harcourt, and all 36 states.
                Transparent pricing. Zero hidden fees.
              </p>

              {/* Search bar */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/30 flex flex-col sm:flex-row gap-2 max-w-lg">
                <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
                  <MapPin className="h-4.5 w-4.5 text-[#1a3c5e] dark:text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-400 dark:text-slate-500 select-none">Search by city, state or area…</span>
                </div>
                <Link href="/listings">
                  <Button className="sm:w-auto w-full h-11 px-6 text-sm bg-[#f97316] hover:bg-[#ea6b0e] text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 gap-2">
                    <Search className="h-4 w-4" />Search
                  </Button>
                </Link>
              </div>

              {/* Quick city pills */}
              <div className="flex flex-wrap gap-2 mt-5">
                <span className="text-xs text-slate-400 self-center mr-1">Popular:</span>
                {["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Kano"].map((city) => (
                  <Link key={city} href={`/listings?city=${city}`}>
                    <span className="text-xs bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-slate-200 px-3 py-1.5 rounded-full cursor-pointer transition-all duration-200 inline-block">
                      {city}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right — floating property cards */}
            <div className="relative hidden lg:block h-[480px]">
              {/* Card 1 — back */}
              <div className="absolute top-16 right-0 w-72 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden rotate-3 shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=220&fit=crop" alt="" className="w-full h-36 object-cover opacity-80" />
                <div className="p-4">
                  <p className="text-sm font-semibold text-white/90">Penthouse, V.I Lagos</p>
                  <p className="text-xs text-slate-400 mt-0.5">Victoria Island · 4 bed</p>
                  <p className="text-lg font-bold text-[#f97316] mt-2">₦5,000,000<span className="text-xs text-slate-400">/yr</span></p>
                </div>
              </div>

              {/* Card 2 — front */}
              <div className="absolute top-4 right-16 w-72 bg-white dark:bg-slate-800 rounded-2xl overflow-hidden -rotate-2 shadow-2xl z-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=220&fit=crop" alt="" className="w-full h-36 object-cover" />
                <div className="absolute top-3 left-3 bg-[#f97316] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">FEATURED</div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Flat, Lekki Phase 1</p>
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-[#f97316] text-[#f97316]" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">4.8</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="h-3 w-3" />Lekki, Lagos · 3 bed</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-lg font-bold text-[#1a3c5e] dark:text-white">₦2,400,000<span className="text-xs text-slate-400 font-normal">/yr</span></p>
                    <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <BadgeCheck className="h-3 w-3" />Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating stat chips */}
              <div className="absolute bottom-24 right-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 z-20">
                <p className="text-xs text-slate-300">New listings today</p>
                <p className="text-2xl font-bold text-white">240+</p>
              </div>
              <div className="absolute bottom-8 right-48 bg-[#f97316] rounded-xl px-4 py-2.5 z-20 shadow-lg">
                <p className="text-xs text-orange-100">Avg. time to rent</p>
                <p className="text-xl font-bold text-white">3.2 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 72" fill="none" className="w-full">
            <path d="M0,36 C240,72 480,0 720,36 C960,72 1200,0 1440,36 L1440,72 L0,72 Z" className="fill-white dark:fill-[#0a0f1e]" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────────── */}
      <section className="bg-white dark:bg-[#0a0f1e] py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-slate-100 dark:divide-slate-800">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex items-center justify-center gap-3 md:px-6 py-2">
                <div className="w-8 h-8 rounded-lg bg-[#f97316]/10 flex items-center justify-center shrink-0">
                  <stat.icon className="h-4 w-4 text-[#f97316]" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#1a3c5e] dark:text-white leading-tight">{stat.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED LISTINGS ─────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-sm font-semibold text-[#f97316] uppercase tracking-wider mb-2">Hand-Picked</p>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Featured Properties</h2>
              <p className="text-slate-500 dark:text-slate-400 mt-2">Premium verified listings across Nigeria</p>
            </div>
            <Link href="/listings" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#1a3c5e] dark:text-[#f97316] hover:gap-2 transition-all">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_LISTINGS.map((listing) => (
              <Link key={listing.title} href="/listings">
                <div className="group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1.5">
                  <div className="relative h-52 overflow-hidden bg-slate-100 dark:bg-slate-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={listing.image}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        listing.tag === "Featured" ? "bg-[#f97316] text-white"
                        : listing.tag === "Premium" ? "bg-[#1a3c5e] text-white"
                        : "bg-green-500 text-white"
                      }`}>{listing.tag}</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-lg px-2.5 py-1 flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-[#f97316] text-[#f97316]" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{listing.rating}</span>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs">
                      <MapPin className="h-3 w-3" />{listing.location}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 line-clamp-1 group-hover:text-[#1a3c5e] dark:group-hover:text-[#f97316] transition-colors">
                      {listing.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-[#1a3c5e] dark:text-white">{listing.price}</span>
                        <span className="text-xs text-slate-400 ml-1">/year</span>
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-50 dark:bg-slate-700 px-2.5 py-1.5 rounded-lg">
                        {listing.beds}bd · {listing.baths}ba
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/listings">
              <Button variant="outline" className="gap-2 dark:border-slate-600 dark:text-slate-300">
                View All Listings <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white dark:bg-[#0a0f1e]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-[#f97316] uppercase tracking-wider mb-2">Simple Process</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">How NaijaRental Works</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
              From search to move-in in three simple steps. No stress, no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-9 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-blue-500 via-[#f97316] to-emerald-500 opacity-30" />

            {STEPS.map((step, i) => (
              <div key={step.step} className="relative flex flex-col items-center text-center group">
                <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-4 shadow-lg ${step.glow} group-hover:scale-105 transition-transform duration-300`}>
                  <step.icon className="h-7 w-7 text-white" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md border-2 border-slate-100 dark:border-slate-700">
                    <span className="text-[10px] font-black text-[#1a3c5e] dark:text-white">{i + 1}</span>
                  </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-[220px]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left */}
            <div>
              <p className="text-sm font-semibold text-[#f97316] uppercase tracking-wider mb-3">Why NaijaRental</p>
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4 leading-tight">
                Everything you need for a seamless rental experience
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg">
                Built specifically for Nigeria, by people who understand the rental market.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FEATURES.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 hover:border-[#f97316]/30 dark:hover:border-[#f97316]/30 transition-colors group">
                    <div className={`p-2.5 rounded-xl ${feature.bg} shrink-0 group-hover:scale-110 transition-transform`}>
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{feature.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard mockup */}
            <div className="relative">
              {/* Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a3c5e]/20 to-[#f97316]/10 rounded-3xl blur-3xl" />
              <div className="relative bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] rounded-3xl p-8 shadow-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Landlord Dashboard</p>
                    <p className="text-xs text-slate-400">Live platform preview</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Live</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Active Tenancies", value: "12", change: "+2 this month", color: "text-blue-400" },
                    { label: "Monthly Revenue", value: "₦4.2M", change: "+18% vs last", color: "text-green-400" },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className={`text-2xl font-bold text-white mt-0.5`}>{item.value}</p>
                      <p className={`text-xs mt-1 ${item.color}`}>{item.change}</p>
                    </div>
                  ))}
                </div>

                {[
                  { label: "Pending Maintenance", value: "3", sub: "2 urgent", icon: "⚡" },
                  { label: "Avg. Tenant Credit", value: "742", sub: "Excellent", icon: "📈" },
                  { label: "Wallet Balance", value: "₦8.4M", sub: "Available", icon: "💳" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl p-4 mb-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-xs text-slate-400">{item.label}</p>
                        <p className="text-sm font-bold text-white">{item.value}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{item.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR LANDLORDS ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-gradient-to-br from-[#0f2d48] via-[#1a3c5e] to-[#1e4a72] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f97316]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-[#f97316] uppercase tracking-wider mb-3">For Landlords & Agents</p>
              <h2 className="text-4xl font-bold mb-6 leading-tight">
                List, manage and grow — all in one place
              </h2>
              <p className="text-slate-300 text-lg mb-10 leading-relaxed">
                Create verified listings, manage tenancies, collect rent, handle maintenance requests, and track revenue — on any device.
              </p>
              <div className="space-y-4 mb-10">
                {[
                  "Unlimited property and unit listings",
                  "Digital tenancy agreements & e-signatures",
                  "Automated rent reminders to tenants",
                  "Maintenance request tracking",
                  "Real-time revenue dashboard",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#f97316] flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-slate-200 text-sm">{item}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <Link href="/login">
                  <Button className="bg-[#f97316] hover:bg-[#ea6b0e] text-white font-semibold px-6 shadow-lg shadow-orange-500/30 gap-2">
                    Start for Free <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2">
                  <PlayCircle className="h-4 w-4" />See Demo
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Home, title: "Properties", value: "5,400+", desc: "Active landlords" },
                { icon: Users, title: "Tenancies", value: "28K+", desc: "Managed agreements" },
                { icon: TrendingUp, title: "Revenue", value: "₦2.1B+", desc: "Processed to landlords" },
                { icon: Star, title: "Satisfaction", value: "4.9/5", desc: "Landlord rating" },
              ].map((item) => (
                <div key={item.title} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/15 transition-colors">
                  <item.icon className="h-6 w-6 text-[#f97316] mb-3" />
                  <p className="text-xs text-slate-400 mb-1">{item.title}</p>
                  <p className="text-2xl font-bold text-white">{item.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-[#f97316] uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">What our users say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 hover:border-[#f97316]/30 dark:hover:border-[#f97316]/30 transition-colors">
                <div className="flex items-center gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#f97316] text-[#f97316]" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 italic">
                  &quot;{t.quote}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3c5e] to-[#f97316] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f97316] via-[#f97316] to-[#ea6b0e]" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 border border-white/30 rounded-full px-3 py-1 mb-4">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white">Join 28,000+ Nigerians</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            Ready to find your next home?
          </h2>
          <p className="text-orange-100 text-sm mb-7 max-w-md mx-auto">
            Nigeria&apos;s most trusted rental platform. Verified listings, transparent pricing, zero hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/listings">
              <Button size="lg" className="bg-white text-[#f97316] hover:bg-white/95 font-bold px-8 h-11 text-sm shadow-xl shadow-black/20 rounded-xl gap-2">
                <Search className="h-4 w-4" />Browse Listings
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-2 border-white/50 text-white hover:bg-white/10 font-bold px-8 h-11 text-sm rounded-xl gap-2">
                Create Free Account <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
