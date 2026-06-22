import Link from "next/link"
import { Home, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/layout/brand-logo"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <BrandLogo className="w-16 h-16 rounded-2xl bg-[#1a3c5e] mx-auto mb-6" iconClassName="h-8 w-8 text-white" />

        <h1 className="text-6xl font-black text-[#1a3c5e] mb-3">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h2>
        <p className="text-slate-500 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button className="gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </Link>
          <Link href="/listings">
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Browse Listings
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
