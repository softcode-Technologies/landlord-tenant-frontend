"use client"

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { AuthGuard } from "@/components/layout/auth-guard"
import {
  LayoutDashboard,
  Users,
  Shield,
  Home,
  CreditCard,
  BarChart3,
} from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "KYC Queue", href: "/admin/kyc", icon: Shield },
  { label: "Tenancies", href: "/admin/tenancies", icon: Home },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#f8fafc]">
        <DashboardSidebar navItems={navItems} role="admin" />
        <main className="flex-1 min-w-0 lg:ml-0 pt-14 lg:pt-0">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
