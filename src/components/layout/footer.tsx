import Link from "next/link"
import { Building2 } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#1a3c5e] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                Naija<span className="text-[#f97316]">Rental</span>
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
              Nigeria&apos;s most trusted PropTech rental platform. Connecting landlords,
              tenants, and agents across all states.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-300">
              Platform
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Browse Listings", href: "/listings" },
                { label: "Find Agents", href: "/agents" },
                { label: "For Landlords", href: "/landlord" },
                { label: "For Tenants", href: "/tenant" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-300">
              Support
            </h4>
            <ul className="space-y-2">
              {[
                { label: "Help Center", href: "#" },
                { label: "Privacy Policy", href: "#" },
                { label: "Terms of Service", href: "#" },
                { label: "Contact Us", href: "#" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} NaijaRental. All rights reserved.
          </p>
          <p className="text-xs text-slate-400">Made with in Nigeria</p>
        </div>
      </div>
    </footer>
  )
}
