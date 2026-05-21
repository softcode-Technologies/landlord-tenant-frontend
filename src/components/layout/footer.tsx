import Link from "next/link"
import { Building2 } from "lucide-react"
import { BrandWordmark } from "./brand-wordmark"
import { BRAND_LEGAL_NAME, brandEmail } from "@/lib/config/brand"

const PLATFORM_LINKS = [
  { label: "Browse Listings", href: "/listings" },
  { label: "For Landlords", href: "/landlord" },
  { label: "For Tenants", href: "/tenant" },
]

const SUPPORT_LINKS = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: `mailto:${brandEmail("hello")}` },
]

const SOCIALS = [
  { label: "X", href: "#", char: "𝕏" },
  { label: "IG", href: "#", char: "📷" },
  { label: "Li", href: "#", char: "in" },
]

export function Footer() {
  return (
    <footer className="bg-[#0a1628] dark:bg-[#050c18] text-white mt-auto border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand — spans 2 cols */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] border border-white/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <BrandWordmark className="text-xl font-bold" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              Nigeria&apos;s most trusted PropTech rental platform. Connecting landlords,
              tenants, and agents across all 36 states.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#f97316] border border-white/10 hover:border-[#f97316] flex items-center justify-center transition-all duration-200 text-xs font-bold text-slate-400 hover:text-white"
                >
                  {s.char}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-widest text-slate-400">Platform</h4>
            <ul className="space-y-3">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-widest text-slate-400">Support</h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} {BRAND_LEGAL_NAME}. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {[
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
                {item.label}
              </Link>
            ))}
            <span className="text-xs text-slate-600">🇳🇬 Made in Nigeria</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
