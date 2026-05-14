"use client"

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { AuthGuard } from "@/components/layout/auth-guard"
import {
  LayoutDashboard,
  Home,
  Wrench,
  Calendar,
  Wallet,
  Heart,
  MessageCircle,
  Bell,
  User,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/tenant", icon: LayoutDashboard },
  { label: "My Tenancies", href: "/tenant/tenancies", icon: Home },
  { label: "Maintenance", href: "/tenant/maintenance", icon: Wrench },
  { label: "Inspections", href: "/tenant/inspections", icon: Calendar },
  { label: "Wallet", href: "/tenant/wallet", icon: Wallet },
  { label: "Saved Listings", href: "/tenant/saved", icon: Heart },
  { label: "Messages", href: "/tenant/messages", icon: MessageCircle },
  { label: "Notifications", href: "/tenant/notifications", icon: Bell },
  { label: "Profile", href: "/tenant/profile", icon: User },
]

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <DashboardSidebar navItems={navItems} role="tenant" />
        <main className="flex-1 min-w-0 lg:ml-0 pt-14 lg:pt-0">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
