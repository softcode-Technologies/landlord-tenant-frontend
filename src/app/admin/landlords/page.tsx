"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatNairaAmount, getInitials } from "@/lib/utils"
import { Search, Building2, ChevronRight, AlertTriangle } from "lucide-react"

export default function AdminLandlordsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-landlords", page, search],
    queryFn: () => adminApi.getLandlords({ page, limit: 20, search: search || undefined }),
  })

  const landlords = data?.data?.data ?? []
  const pagination = data?.data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Landlords</h1>
        <p className="text-slate-500 mt-1">
          {pagination?.total
            ? `${pagination.total.toLocaleString()} landlords on the platform`
            : "Monitor every landlord, their properties, and tenants"}
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-3 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Name, phone, or email..."
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

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : landlords.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-slate-100 rounded-full">
                <Building2 className="h-8 w-8 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No landlords found</p>
              <p className="text-sm text-slate-400">Try adjusting your search</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Landlord</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Active Tenants</TableHead>
                  <TableHead>Expected Annual Rent</TableHead>
                  <TableHead>Overdue</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landlords.map((lord) => {
                  const name = `${lord.firstName ?? ""} ${lord.lastName ?? ""}`.trim() || "Landlord"
                  return (
                    <TableRow key={lord.landlordProfileId} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-[#1a3c5e]/10 text-[#1a3c5e]">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-slate-900 flex items-center gap-1.5">
                              {name}
                              {lord.isBanned && (
                                <Badge variant="destructive" className="text-[10px]">Banned</Badge>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{lord.phone ?? lord.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-700">{lord.propertyCount}</TableCell>
                      <TableCell className="text-sm font-medium text-slate-700">{lord.activeTenancies}</TableCell>
                      <TableCell className="text-sm font-semibold text-[#1a3c5e]">
                        {formatNairaAmount(lord.expectedAnnualRentNaira)}
                      </TableCell>
                      <TableCell>
                        {lord.overdueCount > 0 ? (
                          <Badge variant="destructive" className="text-xs gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {lord.overdueCount}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lord.kycStatus === "approved" ? "success"
                            : lord.kycStatus === "pending" ? "warning"
                            : lord.kycStatus === "rejected" ? "destructive"
                            : "outline"
                          }
                          className="text-xs capitalize"
                        >
                          {lord.kycStatus ?? "none"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/landlords/${lord.userId}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            View
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
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
