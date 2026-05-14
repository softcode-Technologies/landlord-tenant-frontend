"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { formatDate, getInitials, extractApiError } from "@/lib/utils"
import { Search, Ban, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page],
    queryFn: () => adminApi.getUsers({ page, limit: 20 }),
  })

  const banMutation = useMutation({
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: () => {
      toast.success("User banned")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to ban user")),
  })

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => {
      toast.success("User unbanned")
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to unban user")),
  })

  const users = data?.data?.data ?? []
  const meta = data?.data?.meta

  const filtered = search
    ? users.filter((u) => {
        const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.toLowerCase()
        return name.includes(search.toLowerCase()) || u.phone.includes(search)
      })
    : users

  const getUserRole = (user: typeof users[0]) => {
    if (user.isAdmin) return "admin"
    if (user.agentProfile) return "agent"
    if (user.landlordProfile) return "landlord"
    if (user.tenantProfile) return "tenant"
    return "user"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-500 mt-1">
          {meta?.total ? `${meta.total.toLocaleString()} total users` : "Manage platform users"}
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => {
                  const name =
                    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User"
                  const role = getUserRole(user)
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{name}</p>
                            {user.email && (
                              <p className="text-xs text-slate-400">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={role === "admin" ? "default" : "outline"}
                          className="capitalize text-xs"
                        >
                          {role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{user.phone}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Badge variant="destructive" className="text-xs">Banned</Badge>
                        ) : user.isVerified ? (
                          <Badge variant="success" className="text-xs">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!user.isAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`gap-1 h-7 text-xs ${
                              user.isBanned
                                ? "text-green-600 hover:text-green-700"
                                : "text-red-500 hover:text-red-600"
                            }`}
                            onClick={() =>
                              user.isBanned
                                ? unbanMutation.mutate(user.id)
                                : banMutation.mutate(user.id)
                            }
                            disabled={banMutation.isPending || unbanMutation.isPending}
                          >
                            {user.isBanned ? (
                              <>
                                <CheckCircle2 className="h-3 w-3" />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3" />
                                Ban
                              </>
                            )}
                          </Button>
                        )}
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
      {meta && meta.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-slate-600 px-2">
            {page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
