"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { AuthGuard } from "@/components/layout/auth-guard"
import { useUnreadCount } from "@/lib/hooks/use-unread-count"
import { useAuthStore } from "@/lib/store/auth"
import { authApi } from "@/lib/api/auth"
import { commissionsApi } from "@/lib/api/commission"
import { propertiesApi } from "@/lib/api/properties"
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

  // Only landlords who actually work with agents need the Commissions tab. Show
  // it when they have commission records OR a property with an assigned agent;
  // hide it for the self-managing majority. (The /landlord/commissions route
  // still works by direct URL, so a wrong hide is never a lockout.) Shares the
  // ["properties"] query key with the dashboard, so it's not an extra fetch.
  const { data: commissionsData } = useQuery({
    queryKey: ["landlord-commissions"],
    queryFn: () => commissionsApi.getLandlordCommissions(),
  })
  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesApi.getProperties(),
  })
  const usesAgents =
    (commissionsData?.data?.length ?? 0) > 0 ||
    (propertiesData?.data ?? []).some((p) => p.assignedAgent)

  const navItems = [
    { label: "Dashboard", href: "/landlord", icon: LayoutDashboard },

    { label: "Properties", href: "/landlord/properties", icon: Building2, section: "Properties" },
    { label: "Listings", href: "/landlord/listings", icon: List, section: "Properties" },
    { label: "Inspections", href: "/landlord/inspections", icon: Calendar, section: "Properties" },

    { label: "Tenancies", href: "/landlord/tenancies", icon: Users, section: "Tenants" },
    { label: "Invites", href: "/landlord/invites", icon: UserPlus, section: "Tenants" },
    { label: "Maintenance", href: "/landlord/maintenance", icon: Wrench, section: "Tenants" },

    { label: "Wallet", href: "/landlord/wallet", icon: Wallet, section: "Money" },
    ...(usesAgents
      ? [{ label: "Commissions", href: "/landlord/commissions", icon: DollarSign, section: "Money" }]
      : []),
    { label: "Analytics", href: "/landlord/analytics", icon: BarChart3, section: "Money" },

    { label: "Messages", href: "/landlord/messages", icon: MessageCircle, section: "Account" },
    {
      label: "Notifications",
      href: "/landlord/notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      section: "Account",
    },
    { label: "Verification", href: "/landlord/kyc", icon: ShieldCheck, section: "Account" },
    { label: "Profile", href: "/landlord/profile", icon: User, section: "Account" },
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
