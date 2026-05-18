"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { agentsApi } from "@/lib/api/agents"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { Building2, Plus, MapPin, ArrowRight } from "lucide-react"

export default function AgentPropertiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agent-properties"],
    queryFn: () => agentsApi.getMyProperties(),
  })

  const properties = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">Properties assigned to you and ones you&apos;ve added for your landlords</p>
        </div>
        <Link href="/agent/properties/new" className="shrink-0">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Add property
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              icon={Building2}
              title="No properties yet"
              description="Add a property for a landlord you already manage, or wait to be assigned to one."
              actionLabel="Add property"
              actionHref="/agent/properties/new"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <Card
              key={p.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="h-32 bg-gradient-to-br from-[#1a3c5e] to-[#0f2d48] flex items-center justify-center">
                {p.images && p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="h-10 w-10 text-white/40" />
                )}
              </div>
              <CardContent className="p-4">
                <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{[p.area, p.city, p.state].filter(Boolean).join(", ")}</span>
                </p>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>{p.units?.length ?? 0} unit{(p.units?.length ?? 0) === 1 ? "" : "s"}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
