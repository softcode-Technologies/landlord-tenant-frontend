import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "NaijaRental — The Rental Operating System for Nigeria",
    template: "%s | NaijaRental",
  },
  description:
    "List, lease, and manage your rentals from one platform. Built for Nigerian landlords, agents, and tenants — covering listings, tenancies, payments, maintenance, and communication.",
  keywords: [
    "Nigeria rental management",
    "landlord platform Nigeria",
    "tenant management",
    "rent reminders Nigeria",
    "PropTech Nigeria",
    "property management software",
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1e] antialiased transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
