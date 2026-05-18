"use client"

import { useEffect } from "react"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { AuthGuard } from "@/components/layout/auth-guard"
import { useAuthStore } from "@/lib/store/auth"
import { authApi } from "@/lib/api/auth"
import { LayoutDashboard, DollarSign, BarChart3, MessageCircle, User, ShieldCheck, Building2 } from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/agent", icon: LayoutDashboard },
  { label: "Properties", href: "/agent/properties", icon: Building2 },
  { label: "Commissions", href: "/agent/commissions", icon: DollarSign },
  { label: "Analytics", href: "/agent/analytics", icon: BarChart3 },
  { label: "Messages", href: "/agent/messages", icon: MessageCircle },
  { label: "Verification", href: "/agent/kyc", icon: ShieldCheck },
  { label: "Profile", href: "/agent/profile", icon: User },
]

function AgentNav({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore()

  useEffect(() => {
    authApi.me().then((res) => setUser(res.data)).catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <DashboardSidebar navItems={navItems} role="agent" />
      <main className="flex-1 min-w-0 lg:ml-0 pt-14 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AgentNav>{children}</AgentNav>
    </AuthGuard>
  )
}
