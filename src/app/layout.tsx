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
    default: "NaijaRental — Find Your Perfect Home in Nigeria",
    template: "%s | NaijaRental",
  },
  description:
    "Nigeria's most trusted PropTech rental platform. Find verified listings in Lagos, Abuja, Port Harcourt and beyond.",
  keywords: ["Nigeria rental", "Lagos property", "Abuja apartment", "PropTech Nigeria"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#f8fafc] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
