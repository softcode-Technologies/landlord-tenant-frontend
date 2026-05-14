"use client"

import { useQuery } from "@tanstack/react-query"
import { tenanciesApi } from "@/lib/api/tenancies"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatNairaAmount, formatDate, getStatusVariant } from "@/lib/utils"
import { Home, MapPin, Calendar, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function TenantTenanciesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["tenant-tenancies"],
    queryFn: () => tenanciesApi.getTenantTenancies(),
  })

  const tenancies = data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Tenancies</h1>
        <p className="text-slate-500 mt-1">All your rental agreements</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tenancies.length === 0 ? (
        <EmptyState
          icon={Home}
          title="No tenancies yet"
          description="You haven't rented any properties yet. Browse our listings to find your perfect home."
          actionLabel="Browse Listings"
          actionHref="/listings"
        />
      ) : (
        <div className="space-y-4">
          {tenancies.map((tenancy) => (
            <Card key={tenancy.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {tenancy.property?.name ?? tenancy.unit?.unitNumber ?? "Property"}
                      </h3>
                      <Badge variant={getStatusVariant(tenancy.status)} className="capitalize">
                        {tenancy.status}
                      </Badge>
                    </div>

                    {tenancy.property && (
                      <div className="flex items-center gap-1 text-sm text-slate-500 mb-3">
                        <MapPin className="h-3.5 w-3.5" />
                        {tenancy.property.address}, {tenancy.property.city},{" "}
                        {tenancy.property.state}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Annual Rent</p>
                        <p className="text-base font-bold text-[#1a3c5e]">
                          {formatNairaAmount(tenancy.rentAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Start</p>
                        <p className="text-sm font-medium text-slate-700">
                          {formatDate(tenancy.startDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">End</p>
                        <p className="text-sm font-medium text-slate-700">
                          {formatDate(tenancy.endDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link href={`/tenant/tenancies/${tenancy.id}`}>
                    <Button variant="outline" size="sm" className="gap-1 shrink-0">
                      Details
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
