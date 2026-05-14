"use client"

import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"
import { LayoutDashboard, DollarSign, BarChart3, MessageCircle, User } from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/agent", icon: LayoutDashboard },
  { label: "Commissions", href: "/agent/commissions", icon: DollarSign },
  { label: "Analytics", href: "/agent/analytics", icon: BarChart3 },
  { label: "Messages", href: "/agent/messages", icon: MessageCircle },
  { label: "Profile", href: "/agent/profile", icon: User },
]

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <DashboardSidebar navItems={navItems} role="agent" />
      <main className="flex-1 min-w-0 lg:ml-0 pt-14 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
