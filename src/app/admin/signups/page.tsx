"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi, type SignupLeadStage } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateTime, formatRelativeTime, extractApiError } from "@/lib/utils"
import { UserX, ShieldQuestion, UserPlus, Phone, MessageCircle, Check, Loader2, Search } from "lucide-react"
import { toast } from "sonner"

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof UserX; label: string; value: number; accent: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// wa.me wants the full international number, digits only.
const whatsappLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`

export default function AdminSignupsPage() {
  const queryClient = useQueryClient()
  const [stage, setStage] = useState<SignupLeadStage>("unverified")
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-signup-leads", stage, page, search],
    queryFn: () => adminApi.getSignupLeads({ stage, page, limit: 20, search: search || undefined }),
  })

  const contactedMutation = useMutation({
    mutationFn: (phone: string) => adminApi.markSignupLeadContacted(phone),
    onSuccess: () => {
      toast.success("Marked as contacted")
      queryClient.invalidateQueries({ queryKey: ["admin-signup-leads"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to update")),
  })

  const leads = data?.data?.leads ?? []
  const pagination = data?.data?.pagination
  const summary = data?.data?.summary

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Incomplete Sign-ups</h1>
        <p className="text-slate-500 mt-1">
          People who entered their phone number but didn&apos;t finish creating an account. Reach out to help
          them complete sign-up, then mark them as contacted so nobody follows up twice.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={ShieldQuestion}
          label="Didn't verify OTP"
          value={summary?.unverifiedCount ?? 0}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          icon={UserX}
          label="Verified, didn't finish"
          value={summary?.notOnboardedCount ?? 0}
          accent="bg-red-50 text-red-600"
        />
        <StatCard
          icon={UserPlus}
          label="New numbers (last 7 days)"
          value={summary?.newNumbersLast7Days ?? 0}
          accent="bg-[#00162E]/10 text-[#00162E]"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Tabs value={stage} onValueChange={(v) => { setStage(v as SignupLeadStage); setPage(1) }}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="unverified">Didn&apos;t verify</TabsTrigger>
            <TabsTrigger value="not_onboarded">Didn&apos;t finish profile</TabsTrigger>
          </TabsList>
        </Tabs>
        <form
          className="relative sm:w-64"
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1) }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search phone number"
            className="pl-9"
          />
        </form>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : leads.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={UserX}
                title={search ? "No matches" : "Nobody here yet"}
                description={
                  stage === "unverified"
                    ? "Numbers that request an OTP but never verify will appear here."
                    : "People who verify their number but don't finish their profile will appear here."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Phone</TableHead>
                    <TableHead>OTP requests</TableHead>
                    <TableHead>First seen</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead>Contacted</TableHead>
                    <TableHead className="text-right">Reach out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.phone} className="hover:bg-slate-50/50">
                      <TableCell>
                        <p className="font-medium text-sm text-slate-900">{lead.phone}</p>
                        {lead.name && <p className="text-xs text-slate-400">{lead.name}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{lead.otpRequestCount ?? "—"}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDateTime(lead.firstSeenAt)}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatRelativeTime(lead.lastSeenAt)}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {lead.lastContactedAt ? (
                          <span className="inline-flex items-center gap-1 text-green-600">
                            <Check className="h-3.5 w-3.5" /> {formatRelativeTime(lead.lastContactedAt)}
                          </span>
                        ) : (
                          "Not yet"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button asChild size="sm" variant="outline" className="h-7 px-2" title="Call">
                            <a href={`tel:${lead.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                          </Button>
                          <Button asChild size="sm" variant="outline" className="h-7 px-2" title="WhatsApp">
                            <a href={whatsappLink(lead.phone)} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => contactedMutation.mutate(lead.phone)}
                            disabled={contactedMutation.isPending}
                          >
                            {contactedMutation.isPending && contactedMutation.variables === lead.phone ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                            Contacted
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
