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
import { useAuthStore, getRoleDashboardPath } from "@/lib/store/auth"
import { authApi } from "@/lib/api/auth"
import { getInitials } from "@/lib/utils"
import { Building2, LogOut, User, LayoutDashboard, Bell, Menu, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore
    }
    logout()
    document.cookie = "naijarental-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    toast.success("Logged out successfully")
    router.push("/")
  }

  const dashboardPath = getRoleDashboardPath(user)
  const fullName = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User" : ""

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1a3c5e] flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#1a3c5e]">
              Naija<span className="text-[#f97316]">Rental</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/listings"
              className="text-sm font-medium text-slate-600 hover:text-[#1a3c5e] transition-colors"
            >
              Browse Listings
            </Link>
            <Link
              href="/agents"
              className="text-sm font-medium text-slate-600 hover:text-[#1a3c5e] transition-colors"
            >
              Find Agents
            </Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link href={dashboardPath}>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-xs">{getInitials(fullName)}</AvatarFallback>
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
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${dashboardPath}/profile`} className="cursor-pointer">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600 cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="bg-[#f97316] hover:bg-[#f97316]/90 text-white">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-2">
            <Link
              href="/listings"
              className="block px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#1a3c5e] hover:bg-slate-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Browse Listings
            </Link>
            <Link
              href="/agents"
              className="block px-3 py-2 text-sm font-medium text-slate-600 hover:text-[#1a3c5e] hover:bg-slate-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Find Agents
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href={dashboardPath}
                  className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block px-3 py-2 text-sm font-medium text-[#1a3c5e] hover:bg-slate-50 rounded-lg"
                onClick={() => setMobileOpen(false)}
              >
                Log in / Sign up
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
