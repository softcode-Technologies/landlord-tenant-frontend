"use client"

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { AuthGuard } from "@/components/layout/auth-guard"
import { useAgentFullManagementEnabled } from "@/lib/hooks/use-app-config"
import {
  LayoutDashboard,
  Users,
  Shield,
  Home,
  Building2,
  CreditCard,
  Landmark,
  Gift,
  BarChart3,
  UserCircle,
  ShieldCheck,
  UserX,
  KeyRound,
  Scale,
  Banknote,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Incomplete Sign-ups", href: "/admin/signups", icon: UserX },
  { label: "Landlords", href: "/admin/landlords", icon: Building2 },
  { label: "KYC Queue", href: "/admin/kyc", icon: Shield },
  { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
  { label: "Tenancies", href: "/admin/tenancies", icon: Home },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Treasury", href: "/admin/treasury", icon: Landmark },
  { label: "Referrals", href: "/admin/referrals", icon: Gift },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Profile", href: "/admin/profile", icon: UserCircle },
]

function AdminSidebar() {
  const mandatesEnabled = useAgentFullManagementEnabled()
  const items = mandatesEnabled
    ? [
        ...navItems.slice(0, 6),
        { label: "Mandate reviews", href: "/admin/mandates", icon: KeyRound },
        { label: "Cash payments", href: "/admin/cash-payments", icon: Banknote },
        { label: "Rent disputes", href: "/admin/rent-disputes", icon: Scale },
        ...navItems.slice(6),
      ]
    : navItems
  return <DashboardSidebar navItems={items} role="admin" />
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <AdminSidebar />
        <main className="flex-1 min-w-0 lg:ml-0 pt-14 lg:pt-0">
          <div className="p-4 sm:p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
