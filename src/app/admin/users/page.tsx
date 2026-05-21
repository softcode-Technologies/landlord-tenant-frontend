"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { formatDate, formatNaira, getInitials, extractApiError } from "@/lib/utils"
import {
  Search, Ban, CheckCircle2, Loader2, Wallet, ArrowUpRight, ArrowDownLeft,
  PlusCircle, Users,
} from "lucide-react"
import { toast } from "sonner"
import type { User, WalletTransaction } from "@/lib/types"

type UserWithWallet = User & {
  wallet?: { balance: number; lockedBalance: number }
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [walletUser, setWalletUser] = useState<UserWithWallet | null>(null)
  const [creditUser, setCreditUser] = useState<UserWithWallet | null>(null)
  const [creditAmount, setCreditAmount] = useState("")
  const [creditNote, setCreditNote] = useState("")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search],
    queryFn: () => adminApi.getUsers({ page, limit: 20, search: search || undefined }),
  })

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["admin-user-wallet", walletUser?.id],
    queryFn: () => adminApi.getUserWallet(walletUser!.id),
    enabled: !!walletUser,
  })

  const banMutation = useMutation({
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: () => { toast.success("User banned"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }) },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to ban user")),
  })

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => { toast.success("User unbanned"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }) },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to unban user")),
  })

  const creditMutation = useMutation({
    mutationFn: ({ userId, amountKobo, description }: { userId: string; amountKobo: number; description: string }) =>
      adminApi.creditUserWallet(userId, { amountKobo, description }),
    onSuccess: () => {
      toast.success("Wallet credited successfully")
      queryClient.invalidateQueries({ queryKey: ["admin-user-wallet"] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setCreditUser(null)
      setCreditAmount("")
      setCreditNote("")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to credit wallet")),
  })

  const users = (data?.data?.data ?? []) as UserWithWallet[]
  const pagination = data?.data?.pagination

  const getUserRoles = (user: UserWithWallet): string[] => {
    if (user.isAdmin) return ["admin"]
    const roles: string[] = []
    if (user.landlordProfile) roles.push("landlord")
    if (user.agentProfile) roles.push("agent")
    if (user.tenantProfile) roles.push("tenant")
    return roles.length ? roles : ["user"]
  }

  const roleBadgeClass = (role: string) => {
    switch (role) {
      case "admin": return "bg-[#1a3c5e] text-white border-transparent"
      case "landlord": return "bg-blue-50 text-blue-700 border-blue-200"
      case "agent": return "bg-purple-50 text-purple-700 border-purple-200"
      case "tenant": return "bg-green-50 text-green-700 border-green-200"
      default: return "text-slate-600 border-slate-200"
    }
  }

  const handleCredit = () => {
    if (!creditUser) return
    const kobo = Math.round(parseFloat(creditAmount) * 100)
    if (!kobo || kobo <= 0) { toast.error("Enter a valid amount in Naira"); return }
    creditMutation.mutate({ userId: creditUser.id, amountKobo: kobo, description: creditNote.trim() || "Admin manual credit" })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">
            {pagination?.total ? `${pagination.total.toLocaleString()} total users` : "Manage platform users"}
          </p>
        </div>
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
          ) : users.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-slate-100 rounded-full">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700">No users found</p>
              <p className="text-sm text-slate-400">Try adjusting your search</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>KYC</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User"
                  const roles = getUserRoles(user)
                  return (
                    <TableRow key={user.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="text-xs bg-[#1a3c5e]/10 text-[#1a3c5e]">
                              {getInitials(name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-slate-900">{name}</p>
                            <p className="text-xs text-slate-400">{user.phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {roles.map((role) => (
                            <Badge
                              key={role}
                              variant="outline"
                              className={`capitalize text-xs ${roleBadgeClass(role)}`}
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {formatNaira(user.wallet?.balance ?? 0)}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-slate-400 hover:text-[#1a3c5e]"
                            onClick={() => setWalletUser(user)}
                          >
                            <Wallet className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.kycStatus === "approved" ? "success"
                            : user.kycStatus === "pending" ? "warning"
                            : user.kycStatus === "rejected" ? "destructive"
                            : "outline"
                          }
                          className="text-xs capitalize"
                        >
                          {user.kycStatus ?? "none"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Badge variant="destructive" className="text-xs">Banned</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-green-600 border-green-200">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 text-green-600 hover:border-green-300"
                            onClick={() => setCreditUser(user)}
                          >
                            <PlusCircle className="h-3 w-3" />
                            Credit
                          </Button>
                          {!user.isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-7 text-xs gap-1 ${
                                user.isBanned
                                  ? "text-green-600 hover:text-green-700"
                                  : "text-red-500 hover:text-red-600 hover:border-red-300"
                              }`}
                              onClick={() => user.isBanned ? unbanMutation.mutate(user.id) : banMutation.mutate(user.id)}
                              disabled={banMutation.isPending || unbanMutation.isPending}
                            >
                              {user.isBanned ? (
                                <><CheckCircle2 className="h-3 w-3" />Unban</>
                              ) : (
                                <><Ban className="h-3 w-3" />Ban</>
                              )}
                            </Button>
                          )}
                        </div>
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

      {/* Wallet Transactions Modal */}
      <Dialog open={!!walletUser} onOpenChange={(open) => { if (!open) setWalletUser(null) }}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Wallet — {walletUser ? `${walletUser.firstName ?? ""} ${walletUser.lastName ?? ""}`.trim() || walletUser.phone : ""}
            </DialogTitle>
          </DialogHeader>
          {walletLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-4 overflow-hidden">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a3c5e]/5 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-[#1a3c5e]">
                    {formatNaira(walletData?.data?.wallet?.balance ?? 0)}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">Locked (Pending Transfer)</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {formatNaira(walletData?.data?.wallet?.lockedBalance ?? 0)}
                  </p>
                </div>
              </div>
              <div className="overflow-y-auto flex-1" style={{ maxHeight: "40vh" }}>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Transactions ({walletData?.data?.total ?? 0})
                </p>
                {(walletData?.data?.transactions ?? []).length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {(walletData?.data?.transactions ?? []).map((txn: WalletTransaction) => (
                      <div key={txn.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                        <div className={`p-2 rounded-full ${txn.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                          {txn.type === "credit"
                            ? <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />
                            : <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{txn.description}</p>
                          <p className="text-xs text-slate-400">{formatDate(txn.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${txn.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                            {txn.type === "credit" ? "+" : "-"}{formatNaira(txn.amount)}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">{txn.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-2 border-t">
                <Button
                  onClick={() => { setWalletUser(null); setCreditUser(walletUser) }}
                  className="gap-2 bg-[#1a3c5e] hover:bg-[#0f2d48]"
                >
                  <PlusCircle className="h-4 w-4" />
                  Credit Wallet
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit Wallet Modal */}
      <Dialog open={!!creditUser} onOpenChange={(open) => { if (!open) { setCreditUser(null); setCreditAmount(""); setCreditNote("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Credit Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {creditUser && (
              <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-[#1a3c5e]/10 text-[#1a3c5e]">
                    {getInitials(`${creditUser.firstName ?? ""} ${creditUser.lastName ?? ""}`.trim() || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {`${creditUser.firstName ?? ""} ${creditUser.lastName ?? ""}`.trim() || creditUser.phone}
                  </p>
                  <p className="text-xs text-slate-400">Current: {formatNaira(creditUser.wallet?.balance ?? 0)}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="credit-amount">Amount (₦)</Label>
              <Input
                id="credit-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="e.g. 5000"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
              />
              <p className="text-xs text-slate-400">Enter amount in Naira — e.g. 5000 = ₦5,000</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="credit-note">Note (optional)</Label>
              <Input
                id="credit-note"
                placeholder="e.g. Compensation for inspection issue"
                value={creditNote}
                onChange={(e) => setCreditNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCreditUser(null); setCreditAmount(""); setCreditNote("") }}>
              Cancel
            </Button>
            <Button
              className="bg-[#1a3c5e] hover:bg-[#0f2d48] gap-2"
              disabled={creditMutation.isPending || !creditAmount}
              onClick={handleCredit}
            >
              {creditMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Credit Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
