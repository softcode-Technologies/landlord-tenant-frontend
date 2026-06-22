import Link from "next/link"
import { BrandWordmark } from "./brand-wordmark"
import { BrandLogo } from "./brand-logo"
import { BRAND_NAME, BRAND_LEGAL_NAME, brandEmail } from "@/lib/config/brand"

// Support WhatsApp line — all customer chats route here.
const WHATSAPP_NUMBER = "2348165275980"
const WHATSAPP_DISPLAY = "+234 816 527 5980"
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  `Hi ${BRAND_NAME}, I have a question about `,
)}`

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

const PLATFORM_LINKS = [
  { label: "Browse Listings", href: "/listings" },
  { label: "For Landlords", href: "/landlord" },
  { label: "For Tenants", href: "/tenant" },
]

const SUPPORT_LINKS = [
  { label: "Chat on WhatsApp", href: WHATSAPP_URL, external: true },
  { label: "Email Us", href: `mailto:${brandEmail("hello")}`, external: true },
  { label: "Privacy Policy", href: "/privacy", external: false },
  { label: "Terms of Service", href: "/terms", external: false },
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
              <BrandLogo
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] border border-white/10"
                iconClassName="h-5 w-5 text-white"
              />
              <BrandWordmark className="text-xl font-bold" />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-5">
              The operating system for Nigerian rentals — connecting landlords, tenants,
              and agents with KYC verification, secure payments, and a record of everything.
            </p>

            {/* WhatsApp contact — primary support channel */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 mb-6 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/15 border border-[#25D366]/25 px-3.5 py-2.5 transition-colors group"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#25D366] text-white">
                <WhatsAppIcon className="h-4 w-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] text-slate-400">Chat with us on WhatsApp</span>
                <span className="block text-sm font-semibold text-white group-hover:text-[#25D366] transition-colors">
                  {WHATSAPP_DISPLAY}
                </span>
              </span>
            </a>

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
              {SUPPORT_LINKS.map((link) =>
                link.external ? (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ) : (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-xs text-slate-500">
              &copy; {new Date().getFullYear()} {BRAND_LEGAL_NAME}. All rights reserved.
            </p>
            <p className="text-xs text-slate-600 mt-1">
              Designed &amp; managed by Softcode Tech &amp; Cyber Ltd · RC 9090184
            </p>
          </div>
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
