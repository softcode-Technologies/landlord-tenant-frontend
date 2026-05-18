"use client"

import { useEffect } from "react"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { AuthGuard } from "@/components/layout/auth-guard"
import { useUnreadCount } from "@/lib/hooks/use-unread-count"
import { useAuthStore } from "@/lib/store/auth"
import { authApi } from "@/lib/api/auth"
import {
  LayoutDashboard,
  Building2,
  List,
  UserPlus,
  Users,
  Wrench,
  BarChart3,
  MessageCircle,
  Calendar,
  Bell,
  User,
  ShieldCheck,
  Wallet,
  DollarSign,
} from "lucide-react"

function LandlordNav({ children }: { children: React.ReactNode }) {
  const unreadCount = useUnreadCount()
  const { setUser } = useAuthStore()

  useEffect(() => {
    authApi.me().then((res) => setUser(res.data)).catch(() => {})
  }, [])

  const navItems = [
    { label: "Dashboard", href: "/landlord", icon: LayoutDashboard },
    { label: "Properties", href: "/landlord/properties", icon: Building2 },
    { label: "Listings", href: "/landlord/listings", icon: List },
    { label: "Tenancy Invites", href: "/landlord/invites", icon: UserPlus },
    { label: "Tenancies", href: "/landlord/tenancies", icon: Users },
    { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench },
    { label: "Inspections", href: "/landlord/inspections", icon: Calendar },
    { label: "Wallet", href: "/landlord/wallet", icon: Wallet },
    { label: "Commissions", href: "/landlord/commissions", icon: DollarSign },
    { label: "Analytics", href: "/landlord/analytics", icon: BarChart3 },
    { label: "Messages", href: "/landlord/messages", icon: MessageCircle },
    {
      label: "Notifications",
      href: "/landlord/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { label: "Verification", href: "/landlord/kyc", icon: ShieldCheck },
    { label: "Profile", href: "/landlord/profile", icon: User },
  ]

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <DashboardSidebar navItems={navItems} role="landlord" />
      <main className="flex-1 min-w-0 lg:ml-0 pt-14 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <LandlordNav>{children}</LandlordNav>
    </AuthGuard>
  )
}
