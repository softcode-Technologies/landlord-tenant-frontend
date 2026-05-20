"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore, getRoleDashboardPath, getAvailableRoles } from "@/lib/store/auth"
import { authApi } from "@/lib/api/auth"
import { getInitials } from "@/lib/utils"
import { Building2, LogOut, User, LayoutDashboard, Menu, X, Repeat, ShieldCheck, Home, Briefcase, Key } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { BrandWordmark } from "./brand-wordmark"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    document.cookie = "naijarental-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    toast.success("Logged out successfully")
    router.push("/")
  }

  const dashboardPath = getRoleDashboardPath(user)
  const availableRoles = getAvailableRoles(user)
  const isMultiRole = availableRoles.length > 1
  const fullName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User" : ""

  const roleIcon = {
    admin: ShieldCheck,
    landlord: Home,
    agent: Briefcase,
    tenant: Key,
  } as const

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 border-b ${
      scrolled
        ? "bg-white dark:bg-[#0a0f1e]/95 backdrop-blur-xl shadow-sm border-slate-200 dark:border-white/5"
        : "bg-white dark:bg-[#0a0f1e]/80 backdrop-blur-md border-slate-100 dark:border-white/5"
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] flex items-center justify-center shadow-md">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <BrandWordmark className="text-xl font-bold text-[#1a3c5e] dark:text-white" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: "Browse Listings", href: "/listings" },
              { label: "Find Agents", href: "/agents" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-[#1a3c5e] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                <Link href={dashboardPath}>
                  <Button variant="ghost" size="sm" className="gap-2 text-slate-800 dark:text-slate-300 hover:text-[#1a3c5e] dark:hover:text-white dark:hover:bg-white/10">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-colors ring-2 ring-transparent hover:ring-[#f97316]/30">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-xs bg-[#1a3c5e] text-white">{getInitials(fullName)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>
                      <div>
                        <p className="font-medium">{fullName}</p>
                        <p className="text-xs text-slate-500 font-normal">{user.phone}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={dashboardPath} className="cursor-pointer">
                        <LayoutDashboard className="h-4 w-4 mr-2" />Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${dashboardPath}/profile`} className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />Profile
                      </Link>
                    </DropdownMenuItem>
                    {isMultiRole && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                          <Repeat className="h-3 w-3" /> Switch role
                        </DropdownMenuLabel>
                        {availableRoles.map((r) => {
                          const Icon = roleIcon[r.role]
                          const isActive = dashboardPath === r.path
                          return (
                            <DropdownMenuItem key={r.role} asChild>
                              <Link
                                href={r.path}
                                className={`cursor-pointer ${isActive ? "bg-slate-50 font-semibold" : ""}`}
                              >
                                <Icon className="h-4 w-4 mr-2" />
                                {r.label}
                                {isActive && (
                                  <span className="ml-auto text-[10px] text-[#f97316]">Current</span>
                                )}
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-slate-800 dark:text-slate-300 hover:text-[#1a3c5e] dark:hover:text-white dark:hover:bg-white/10">
                    Log in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="bg-[#f97316] hover:bg-[#ea6b0e] text-white rounded-xl shadow-md shadow-orange-500/20">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: menu */}
          <div className="md:hidden flex items-center gap-2">
            <button
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 dark:border-white/10 space-y-1">
            {[
              { label: "Browse Listings", href: "/listings" },
              { label: "Find Agents", href: "/agents" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-300 hover:text-[#1a3c5e] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardPath}
                  className="block px-3 py-2.5 text-sm font-medium text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                {isMultiRole && (
                  <div className="pt-2 mt-1 border-t border-slate-100 dark:border-white/10">
                    <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                      <Repeat className="h-3 w-3" /> Switch role
                    </p>
                    {availableRoles.map((r) => {
                      const Icon = roleIcon[r.role]
                      const isActive = dashboardPath === r.path
                      return (
                        <Link
                          key={r.role}
                          href={r.path}
                          onClick={() => setMobileOpen(false)}
                          className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg ${
                            isActive
                              ? "bg-slate-100 dark:bg-white/10 font-semibold text-slate-900 dark:text-white"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {r.label}
                          {isActive && (
                            <span className="ml-auto text-[10px] text-[#f97316]">Current</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="px-3 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-[#f97316] hover:bg-[#ea6b0e] text-white">
                    Log in / Sign up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
