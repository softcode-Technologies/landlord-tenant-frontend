import Link from "next/link"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import {
  ArrowRight, ChevronRight, ShieldCheck, BadgeCheck, Building2, Users,
  Bell, Wallet, MessageSquare, Wrench, LineChart, KeyRound,
  CalendarClock, UserPlus, Send, CheckCircle2, Sparkles, Lock, Zap,
  Receipt, Layers, Globe,
} from "lucide-react"

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

const TRUST_METRICS = [
  { value: "5,400+", label: "Landlords on platform" },
  { value: "28,000+", label: "Tenancies managed" },
  { value: "₦2.1B+", label: "Rent processed" },
  { value: "100%", label: "KYC-verified listings" },
]

const LANDLORD_FEATURES = [
  { icon: Users, title: "Manage tenants from one dashboard", desc: "See every lease, payment status, and renewal date across all your properties at a glance." },
  { icon: CalendarClock, title: "Never miss a rent expiry", desc: "Automated reminders for you and your tenants — 60, 30, and 7 days before expiry." },
  { icon: UserPlus, title: "Onboard existing tenants", desc: "Already have tenants? Add them in minutes. The platform takes over the management lifecycle." },
  { icon: Building2, title: "Track vacant units in real time", desc: "Know which units are empty, occupied, or due for turnover — across every property you own." },
  { icon: Send, title: "Send announcements at scale", desc: "Notify a single unit, one property, or every tenant — instantly, in-app and via SMS." },
  { icon: ShieldCheck, title: "Reduce agent abuse", desc: "Every listing, every rent figure, every transaction — recorded. Agents work transparently or not at all." },
]

const TENANT_FEATURES = [
  { icon: BadgeCheck, title: "Verified properties only", desc: "Every landlord and listing goes through KYC. No ghost agents. No phantom apartments." },
  { icon: Receipt, title: "Transparent pricing", desc: "See the real rent, agency fee, and service charge upfront — before you ever pick up a phone." },
  { icon: Bell, title: "Rent reminders that actually help", desc: "Stay ahead of your rent cycle with smart notifications and a clear payment timeline." },
  { icon: Wallet, title: "Permanent payment history", desc: "Every receipt, every transfer, every rent cycle — saved and downloadable, forever." },
  { icon: MessageSquare, title: "Talk to your landlord directly", desc: "No more lost WhatsApp threads. All communication lives in one place, tied to your tenancy." },
  { icon: Wrench, title: "Request maintenance in one tap", desc: "Log issues, track resolution, and keep a paper trail your landlord can't ignore." },
]

const FLOWS = [
  {
    step: "01",
    icon: Building2,
    tag: "For Landlords",
    title: "List or import your property",
    desc: "Create a listing in minutes, or skip the marketplace entirely and onboard properties you already own.",
  },
  {
    step: "02",
    icon: KeyRound,
    tag: "Tenancy begins",
    title: "Add a new or existing tenant",
    desc: "Discover a tenant through the marketplace, or invite your current tenant straight into their dashboard.",
  },
  {
    step: "03",
    icon: LineChart,
    tag: "Ongoing",
    title: "Run the rental relationship",
    desc: "Rent reminders, payments, receipts, maintenance, and communication — all in one operating system.",
  },
]

const FEATURE_CARDS = [
  { icon: Bell, title: "Smart Rent Reminders", desc: "Tenants and landlords get notified weeks before expiry. No more awkward conversations." },
  { icon: Users, title: "Tenant Management", desc: "A single dashboard for every tenancy, lease term, and renewal across your portfolio." },
  { icon: Building2, title: "Property & Unit Listings", desc: "Publish to the marketplace or keep listings private — your call, your control." },
  { icon: Receipt, title: "Payment Records", desc: "Every transaction, signed and timestamped. Built to settle disputes before they start." },
  { icon: Wrench, title: "Maintenance Requests", desc: "Tenants log it. Landlords resolve it. Everyone has a record of what happened." },
  { icon: MessageSquare, title: "Built-in Messaging", desc: "Stop hunting WhatsApp threads. Every conversation is tied to the right tenancy." },
  { icon: LineChart, title: "Portfolio Analytics", desc: "Occupancy, revenue, renewals, vacancies — your rental P&L in one view." },
  { icon: Layers, title: "Vacancy Management", desc: "See empty units the day they open up. List them again with one click." },
]

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Transparency, by default",
    desc: "Every figure, every payment, every change is logged. Landlords see what agents do. Tenants see what landlords charge.",
  },
  {
    icon: Layers,
    title: "Centralized, not scattered",
    desc: "One platform for listings, payments, maintenance, and communication. Stop running your rentals across five WhatsApp groups.",
  },
  {
    icon: Globe,
    title: "Built for Nigeria",
    desc: "Naira-native, designed around how Nigerian landlords, agents, and tenants actually transact — not a foreign template.",
  },
  {
    icon: Zap,
    title: "Stress out, control in",
    desc: "Automated reminders, structured records, and self-serve workflows. Less chasing, more renting.",
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a0f1e]">
      <Navbar />

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a1e33] via-[#0f2d48] to-[#1a3c5e] text-white">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="absolute top-1/3 -right-32 w-[640px] h-[640px] bg-[#f97316]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-[420px] h-[420px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-28 pb-24 lg:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
            {/* Copy */}
            <div className="lg:col-span-6 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-full px-3.5 py-1.5 mb-7">
                <Sparkles className="h-3.5 w-3.5 text-[#f97316]" />
                <span className="text-xs font-medium text-slate-200 tracking-wide">
                  The rental operating system for Nigeria
                </span>
              </div>

              <h1 className="text-[2.7rem] sm:text-5xl lg:text-[3.6rem] font-bold leading-[1.05] tracking-tight mb-6">
                Run your rentals
                <span className="block mt-1.5 bg-gradient-to-r from-[#f97316] via-[#fb923c] to-[#fbbf24] bg-clip-text text-transparent">
                  like a business.
                </span>
              </h1>

              <p className="text-lg text-slate-300/90 mb-9 leading-relaxed">
                NaijaRental is a complete platform for landlords, agents, and tenants —
                covering listings, tenancies, payments, maintenance, and communication.
                Whether you&apos;re renting out a new unit or managing tenants you already have,
                this is the system that holds it all together.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link href="/login">
                  <Button className="h-12 px-6 bg-[#f97316] hover:bg-[#ea6b0e] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 gap-2 text-[15px]">
                    Start managing free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/listings">
                  <Button
                    variant="outline"
                    className="h-12 px-6 bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08] hover:text-white rounded-xl font-semibold gap-2 text-[15px]"
                  >
                    Browse marketplace
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                  KYC-verified landlords
                </div>
                <div className="flex items-center gap-1.5">
                  <Receipt className="h-3.5 w-3.5 text-emerald-400" />
                  Naira-native
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  Setup in minutes
                </div>
              </div>
            </div>

            {/* Dashboard mockup */}
            <div className="lg:col-span-6 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#f97316]/20 via-transparent to-blue-500/10 rounded-[2rem] blur-3xl" />

              <div className="relative bg-gradient-to-br from-[#0f2d48]/90 to-[#0a1e33]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
                    </div>
                    <span className="ml-3 text-xs text-slate-400">naijarental.com/landlord</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[10px] text-green-400 font-medium">Live</span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs text-slate-400">Good morning, Chukwuemeka</p>
                      <p className="text-base font-semibold text-white">Portfolio Overview</p>
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-[#f97316]/15 border border-[#f97316]/20 text-[10px] font-semibold text-[#f97316]">
                      3 properties
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { label: "Active leases", value: "12", trend: "+2", trendColor: "text-emerald-400" },
                      { label: "Vacant units", value: "3", trend: "1 new", trendColor: "text-amber-400" },
                      { label: "Monthly inflow", value: "₦4.2M", trend: "+18%", trendColor: "text-emerald-400" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white/[0.04] border border-white/5 rounded-xl px-3 py-3">
                        <p className="text-[10px] text-slate-400">{kpi.label}</p>
                        <p className="text-xl font-bold text-white mt-0.5">{kpi.value}</p>
                        <p className={`text-[10px] mt-0.5 ${kpi.trendColor}`}>{kpi.trend}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    {[
                      { icon: Bell, label: "Rent expires in 14 days", sub: "Flat 3B · Lekki", accent: "bg-amber-500/15 text-amber-400" },
                      { icon: Wrench, label: "Maintenance request", sub: "Plumbing · Unit 2A", accent: "bg-blue-500/15 text-blue-400" },
                      { icon: CheckCircle2, label: "Rent paid · ₦450,000", sub: "Amaka O. · Today", accent: "bg-emerald-500/15 text-emerald-400" },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] transition-colors rounded-lg px-3 py-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${row.accent}`}>
                          <row.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{row.label}</p>
                          <p className="text-[10px] text-slate-400 truncate">{row.sub}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating chip */}
              <div className="hidden sm:flex absolute -bottom-5 -left-4 items-center gap-2.5 bg-white text-[#0f2d48] rounded-xl px-3.5 py-2.5 shadow-xl shadow-black/20 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                  <BadgeCheck className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 leading-tight">All tenants</p>
                  <p className="text-xs font-bold leading-tight">KYC verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-slate-200 dark:divide-slate-800">
            {TRUST_METRICS.map((m) => (
              <div key={m.label} className="text-center md:px-6">
                <p className="text-2xl sm:text-3xl font-bold text-[#0f2d48] dark:text-white tracking-tight">
                  {m.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR LANDLORDS ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <p className="text-xs font-semibold text-[#f97316] uppercase tracking-[0.18em] mb-3">For Landlords & Agents</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-[1.15] tracking-tight mb-5">
                Stop chasing rent.
                <br />
                <span className="text-[#1a3c5e] dark:text-[#fbbf24]">Start running it.</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed mb-7">
                Every property, every tenant, every payment — in one place. Built so landlords
                spend less time on the phone and more time growing their portfolio.
              </p>

              <div className="rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 mb-7">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  You don&apos;t need new tenants to use this platform.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Already manage occupied properties? Bring your existing tenants on board and
                  let the system handle reminders, receipts, and renewals from day one.
                </p>
              </div>

              <Link href="/login">
                <Button className="h-11 px-6 bg-[#1a3c5e] hover:bg-[#0f2d48] text-white font-semibold rounded-xl gap-2">
                  Open landlord dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LANDLORD_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-5 hover:border-[#f97316]/40 hover:shadow-lg hover:shadow-slate-200/60 dark:hover:shadow-black/30 transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f97316]/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <f.icon className="h-5 w-5 text-[#f97316]" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR TENANTS ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 lg:order-1 order-2">
              {TENANT_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 p-5 hover:border-[#1a3c5e]/30 dark:hover:border-[#fbbf24]/30 hover:shadow-lg transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1a3c5e]/10 dark:bg-[#fbbf24]/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <f.icon className="h-5 w-5 text-[#1a3c5e] dark:text-[#fbbf24]" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-5 lg:sticky lg:top-24 lg:order-2 order-1">
              <p className="text-xs font-semibold text-[#1a3c5e] dark:text-[#fbbf24] uppercase tracking-[0.18em] mb-3">For Tenants</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-[1.15] tracking-tight mb-5">
                Rent with proof,
                <br />
                <span className="text-[#f97316]">not guesswork.</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-[15px] leading-relaxed mb-7">
                Find verified homes from real landlords. Pay through a system that keeps every
                receipt. Talk to your landlord in one place — and walk in knowing exactly what
                you&apos;re paying for, before you sign.
              </p>

              <Link href="/listings">
                <Button className="h-11 px-6 bg-[#f97316] hover:bg-[#ea6b0e] text-white font-semibold rounded-xl shadow-lg shadow-orange-500/20 gap-2">
                  Browse verified homes <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-[#f97316] uppercase tracking-[0.18em] mb-3">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              One platform. Two starting points. The same outcome.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-[15px] leading-relaxed">
              Whether you&apos;re onboarding a brand-new tenancy or formalizing one that&apos;s
              already running — the system takes it from there.
            </p>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-[#f97316]/0 via-[#f97316]/40 to-[#f97316]/0" />
            {FLOWS.map((f) => (
              <div
                key={f.step}
                className="relative rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] flex items-center justify-center text-white shadow-lg">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <span className="text-3xl font-black text-slate-200 dark:text-slate-700 tracking-tighter">
                    {f.step}
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-[#f97316] uppercase tracking-wider mb-2">{f.tag}</p>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── EXISTING TENANT ONBOARDING ⭐ ─────────────────────────────────── */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#0a1e33] via-[#0f2d48] to-[#1a3c5e] text-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#f97316]/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#f97316]/15 border border-[#f97316]/25 rounded-full px-3.5 py-1.5 mb-6">
                <Sparkles className="h-3.5 w-3.5 text-[#f97316]" />
                <span className="text-xs font-semibold text-[#fbbf24] tracking-wide">
                  Already have tenants?
                </span>
              </div>

              <h2 className="text-3xl sm:text-[2.6rem] font-bold leading-[1.1] tracking-tight mb-6">
                Bring your existing tenants on board in minutes.
              </h2>
              <p className="text-slate-300/90 text-[15px] leading-relaxed mb-8">
                You don&apos;t need to be looking for new tenants to get value from NaijaRental.
                If your properties are already occupied, add your tenants directly and let the
                platform manage rent reminders, payments, communication, and renewals from day
                one — without disrupting anything you already have in place.
              </p>

              <div className="space-y-4 mb-9">
                {[
                  { n: "1", t: "Add your property and units", d: "Enter what you already own — no listing required if you don't want one." },
                  { n: "2", t: "Invite your current tenant", d: "Send them an invite by phone. They confirm with one tap." },
                  { n: "3", t: "We take over the lifecycle", d: "Rent reminders, receipts, renewals, and communication — handled automatically." },
                ].map((step) => (
                  <div key={step.n} className="flex gap-4">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-[#f97316] flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-orange-500/30">
                      {step.n}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{step.t}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/login">
                <Button className="h-12 px-7 bg-[#f97316] hover:bg-[#ea6b0e] text-white font-semibold rounded-xl shadow-xl shadow-orange-500/30 gap-2">
                  Onboard existing tenants <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Invite mock */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f97316]/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative bg-white text-[#0f2d48] rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#1a3c5e] flex items-center justify-center">
                      <UserPlus className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-sm font-semibold">Invite tenant</p>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-1 rounded-full">
                    Step 2 of 3
                  </span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1.5">Property</p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <Building2 className="h-4 w-4 text-[#1a3c5e]" />
                      <p className="text-sm font-medium">Sunrise Apartments · Unit 3B</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] text-slate-500 mb-1.5">Tenant phone</p>
                    <div className="p-3 rounded-lg border border-slate-200 text-sm font-medium">
                      +234 803 555 0142
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1.5">Rent</p>
                      <div className="p-3 rounded-lg border border-slate-200 text-sm font-semibold">₦1,200,000/yr</div>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500 mb-1.5">Expires</p>
                      <div className="p-3 rounded-lg border border-slate-200 text-sm font-semibold">12 Mar 2027</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#f97316]/10 border border-[#f97316]/20">
                    <Send className="h-4 w-4 text-[#f97316] shrink-0" />
                    <p className="text-xs text-[#0f2d48]">
                      Tenant will receive an SMS invite and confirm with one tap.
                    </p>
                  </div>

                  <div className="h-10 rounded-xl bg-[#0f2d48] flex items-center justify-center text-white text-sm font-semibold">
                    Send invite
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-white dark:bg-[#0a0f1e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-[#f97316] uppercase tracking-[0.18em] mb-3">Everything in the box</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              The full rental stack, out of the box.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-[15px] leading-relaxed">
              Every feature is designed to replace one of the half-broken tools you&apos;re
              currently duct-taping together.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURE_CARDS.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 p-6 hover:border-[#f97316]/40 hover:bg-white dark:hover:bg-slate-800/80 hover:shadow-lg transition-all duration-200"
              >
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-4 group-hover:border-[#f97316]/30 transition-colors">
                  <f.icon className="h-5 w-5 text-[#1a3c5e] dark:text-[#fbbf24] group-hover:text-[#f97316] transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─────────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 max-w-2xl mx-auto">
            <p className="text-xs font-semibold text-[#f97316] uppercase tracking-[0.18em] mb-3">Why NaijaRental</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
              We&apos;re not another listings site.
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 text-[15px] leading-relaxed">
              We&apos;re the infrastructure that makes Nigerian rentals work like they should
              have all along — accountable, automated, and on the record.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-7 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] flex items-center justify-center text-white shadow-md">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5">{p.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1e33] via-[#0f2d48] to-[#1a3c5e]" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#f97316]/15 rounded-full blur-[140px]" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-semibold text-[#fbbf24] uppercase tracking-[0.18em] mb-4">Get started</p>
              <h2 className="text-3xl sm:text-[2.4rem] font-bold text-white leading-[1.1] tracking-tight mb-4">
                Your rental business deserves better than spreadsheets.
              </h2>
              <p className="text-slate-300/90 text-[15px] leading-relaxed">
                Sign up free in 60 seconds. List a property, invite an existing tenant, or
                browse the marketplace — all from the same account.
              </p>
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <Link href="/login" className="w-full lg:w-auto">
                <Button className="w-full h-12 px-7 bg-[#f97316] hover:bg-[#ea6b0e] text-white font-semibold rounded-xl shadow-xl shadow-orange-500/30 gap-2">
                  I&apos;m a landlord — start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/listings" className="w-full lg:w-auto">
                <Button
                  variant="outline"
                  className="w-full h-12 px-7 bg-white/[0.04] border-white/15 text-white hover:bg-white/[0.08] hover:text-white rounded-xl font-semibold gap-2"
                >
                  I&apos;m a tenant — browse homes <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-[11px] text-slate-400 lg:text-right mt-1">
                No card required · Free to start · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
