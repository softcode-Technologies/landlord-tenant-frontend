"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatNaira, formatDate, getStatusVariant } from "@/lib/utils"
import { Home } from "lucide-react"

export default function AdminTenanciesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenancies"],
    queryFn: () => adminApi.getAllTenancies(),
  })

  const tenancies = data?.data?.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Tenancies</h1>
        <p className="text-slate-500 mt-1">{tenancies.length} total tenancies on the platform</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : tenancies.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Home}
                title="No tenancies yet"
                description="Active tenancies will appear here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Annual Rent</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenancies.map((tenancy) => (
                  <TableRow key={tenancy.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-slate-900">
                          {tenancy.tenant?.firstName} {tenancy.tenant?.lastName}
                        </p>
                        <p className="text-xs text-slate-400">{tenancy.tenant?.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {tenancy.property?.name ?? tenancy.unit?.unitNumber ?? "N/A"}
                    </TableCell>
                    <TableCell className="font-semibold text-[#1a3c5e] text-sm">
                      {formatNaira(tenancy.rentAmount)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(tenancy.startDate)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatDate(tenancy.endDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(tenancy.status)}
                        className="capitalize text-xs"
                      >
                        {tenancy.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
