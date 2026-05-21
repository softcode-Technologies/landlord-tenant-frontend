"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNaira, formatDate, getStatusVariant } from "@/lib/utils"
import { Home, Search } from "lucide-react"

export default function AdminTenanciesPage() {
  const [page, setPage] = useState(1)
  const [statusTab, setStatusTab] = useState("all")
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const params = {
    page,
    limit: 20,
    status: statusTab === "all" ? undefined : statusTab,
    search: search || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenancies", params],
    queryFn: () => adminApi.getAllTenancies(params),
  })

  const tenancies = data?.data?.data ?? []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Tenancies</h1>
        <p className="text-slate-500 mt-1">
          {pagination?.total
            ? `${pagination.total.toLocaleString()} tenancies on the platform`
            : "Active tenancies across the platform"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={statusTab} onValueChange={(v) => { setStatusTab(v); setPage(1) }}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="ended">Ended</TabsTrigger>
            <TabsTrigger value="terminated">Terminated</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 max-w-sm flex-1 min-w-[220px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tenant name or phone..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setSearch(searchInput); setPage(1) } }}
              className="pl-10"
            />
          </div>
          <Button onClick={() => { setSearch(searchInput); setPage(1) }} variant="outline">Search</Button>
          {search && (
            <Button variant="ghost" onClick={() => { setSearch(""); setSearchInput(""); setPage(1) }}>Clear</Button>
          )}
        </div>
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
                title="No tenancies found"
                description="Try adjusting the filters or search."
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

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>Previous</Button>
          <span className="flex items-center text-sm text-slate-600 px-2">{page} of {pagination.totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>Next</Button>
        </div>
      )}
    </div>
  )
}
