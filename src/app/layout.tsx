import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://naijarental.com"
const TITLE = "NaijaRental — The Rental Operating System for Nigeria"
const DESCRIPTION =
  "List, lease, and manage your rentals from one platform. Built for Nigerian landlords, agents, and tenants — covering listings, tenancies, payments, maintenance, and communication."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | NaijaRental",
  },
  description: DESCRIPTION,
  keywords: [
    "Nigeria rental management",
    "landlord platform Nigeria",
    "tenant management",
    "rent reminders Nigeria",
    "PropTech Nigeria",
    "property management software",
  ],
  openGraph: {
    type: "website",
    siteName: "NaijaRental",
    locale: "en_NG",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
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
