"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn, getInitials } from "@/lib/utils"
import { useAuthStore } from "@/lib/store/auth"
import { authApi } from "@/lib/api/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogOut, X, Menu, Lock } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { BrandLogo } from "@/components/layout/brand-logo"
import { useState } from "react"
import { BrandWordmark } from "./brand-wordmark"
import { toast } from "sonner"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
  // When locked, the item is shown but not navigable — a padlock appears and
  // hovering it reveals `lockedHint` (e.g. "Coming soon").
  locked?: boolean
  lockedHint?: string
  // Optional group label. A small heading is shown above the first item of each
  // new section so the nav reads as a few clusters instead of one long list.
  section?: string
}

interface DashboardSidebarProps {
  navItems: NavItem[]
  role: string
}

export function DashboardSidebar({ navItems, role }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    logout()
    document.cookie = "naijarental-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    toast.success("Logged out")
    router.push("/")
  }

  const fullName =
    user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User" : ""

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo className="w-8 h-8 rounded-lg bg-[#1a3c5e]" iconClassName="h-5 w-5 text-white" />
          <BrandWordmark className="text-lg font-bold text-[#1a3c5e]" />
        </Link>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback className="text-xs">{getInitials(fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{fullName}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item, i) => {
          // Show a section heading above the first item that carries a new
          // `section` label, turning the flat list into scannable clusters.
          const showSection =
            item.section && item.section !== navItems[i - 1]?.section
          const sectionHeader = showSection ? (
            <p
              key={`sec-${item.section}`}
              className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 first:pt-1"
            >
              {item.section}
            </p>
          ) : null

          if (item.locked) {
            return (
              <div key={`wrap-${item.href}`}>
                {sectionHeader}
                <div
                  className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 cursor-not-allowed select-none"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {/* Padlock + hover tooltip */}
                  <span className="relative flex items-center">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute right-0 bottom-full mb-2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 z-50"
                    >
                      {item.lockedHint ?? "Coming soon"}
                    </span>
                  </span>
                </div>
              </div>
            )
          }
          const isActive =
            pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== `/${role}`)
          return (
            <div key={`wrap-${item.href}`}>
              {sectionHeader}
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-[#1a3c5e] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="bg-[#f97316] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            </div>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 h-screen sticky top-0 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 h-14 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo className="w-7 h-7 rounded-lg bg-[#1a3c5e]" iconClassName="h-4 w-4 text-white" />
          <BrandWordmark className="text-base font-bold text-[#1a3c5e]" />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg hover:bg-slate-100"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
