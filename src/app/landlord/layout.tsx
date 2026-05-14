"use client"

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { AuthGuard } from "@/components/layout/auth-guard"
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
  User,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/landlord", icon: LayoutDashboard },
  { label: "Properties", href: "/landlord/properties", icon: Building2 },
  { label: "Listings", href: "/landlord/listings", icon: List },
  { label: "Tenant Invites", href: "/landlord/invites", icon: UserPlus },
  { label: "Tenancies", href: "/landlord/tenancies", icon: Users },
  { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench },
  { label: "Inspections", href: "/landlord/inspections", icon: Calendar },
  { label: "Analytics", href: "/landlord/analytics", icon: BarChart3 },
  { label: "Messages", href: "/landlord/messages", icon: MessageCircle },
  { label: "Profile", href: "/landlord/profile", icon: User },
]

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <DashboardSidebar navItems={navItems} role="landlord" />
        <main className="flex-1 min-w-0 lg:ml-0 pt-14 lg:pt-0">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
