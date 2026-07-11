"use client"

import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { tenanciesApi, type AddExistingTenantResult } from "@/lib/api/tenancies"
import { propertiesApi } from "@/lib/api/properties"
import { messagingApi } from "@/lib/api/messaging"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { formatNairaAmount, formatDate, getStatusVariant, getInitials, extractApiError, rentCycleSuffix } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, ArrowRight, MessageCircle, Loader2, UserPlus, ShieldCheck, Copy, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const inputClass =
  "flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/30 disabled:opacity-50"

export default function LandlordTenanciesPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-tenancies"],
    queryFn: () => tenanciesApi.getLandlordTenancies(),
  })
  const tenancies = data?.data ?? []

  // ─── Add existing tenant ──────────────────────────────────────────────────
  const [open, setOpen] = useState(false)
  const [propertyId, setPropertyId] = useState("")
  const [unitId, setUnitId] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [rent, setRent] = useState("")
  const [rentCycle, setRentCycle] = useState<"monthly" | "yearly">("yearly")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [deposit, setDeposit] = useState("")
  const [showMore, setShowMore] = useState(false)
  const [result, setResult] = useState<AddExistingTenantResult | null>(null)

  const { data: propertiesData } = useQuery({
    queryKey: ["landlord-properties"],
    queryFn: () => propertiesApi.getProperties(),
    enabled: open,
  })
  const properties = useMemo(() => propertiesData?.data ?? [], [propertiesData])
  const vacantUnits = useMemo(() => {
    const p = properties.find((x) => x.id === propertyId)
    return (p?.units ?? []).filter((u) => u.status !== "occupied")
  }, [properties, propertyId])

  const reset = () => {
    setPropertyId(""); setUnitId(""); setFirstName(""); setLastName("")
    setPhone(""); setEmail(""); setRent(""); setStartDate(""); setEndDate(""); setDeposit("")
    setRentCycle("yearly")
    setShowMore(false)
    setResult(null)
  }

  const addMutation = useMutation({
    mutationFn: () =>
      tenanciesApi.addExistingTenant({
        unitId,
        phone: phone.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        rentAmount: parseInt(rent, 10),
        rentCycle,
        startDate,
        endDate: endDate || undefined,
        depositAmount: deposit ? parseInt(deposit, 10) * 100 : undefined,
      }),
    onSuccess: (res) => {
      toast.success(res.data.tenantIsNew ? "Tenant added — account created" : "Tenant added")
      setResult(res.data)
      queryClient.invalidateQueries({ queryKey: ["landlord-tenancies"] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to add tenant")),
  })

  const messageMutation = useMutation({
    mutationFn: (recipientUserId: string) =>
      messagingApi.createConversation({
        recipientUserId,
        body: "Hello! I'm reaching out regarding your tenancy.",
      }),
    onSuccess: () => {
      toast.success("Conversation started!")
      router.push("/landlord/messages")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to start conversation.")),
  })

  const canSubmit = unitId && firstName.trim() && phone.trim() && rent && startDate

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenancies</h1>
          <p className="text-slate-500 mt-1">Manage all your tenant relationships</p>
        </div>
        <Button className="gap-2 shrink-0" onClick={() => { reset(); setOpen(true) }}>
          <UserPlus className="h-4 w-4" />
          Add existing tenant
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : tenancies.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenancies yet"
          description="Already have tenants? Add them to start tracking rent, receipts and renewals — they don't need to sign up first."
          actionLabel="Add existing tenant"
          onAction={() => { reset(); setOpen(true) }}
        />
      ) : (
        <div className="space-y-4">
          {tenancies.map((tenancy) => {
            const tenantName =
              tenancy.tenant
                ? `${tenancy.tenant.firstName ?? ""} ${tenancy.tenant.lastName ?? ""}`.trim() || "Tenant"
                : "Unknown Tenant"

            return (
              <Card key={tenancy.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={tenancy.tenant?.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {getInitials(tenantName)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-slate-900">{tenantName}</h3>
                        <Badge
                          variant={getStatusVariant(tenancy.status)}
                          className="capitalize text-xs"
                        >
                          {tenancy.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {tenancy.property?.name ?? tenancy.unit?.unitNumber}
                        {tenancy.tenant?.phone && ` · ${tenancy.tenant.phone}`}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-[#1a3c5e]">
                        {formatNairaAmount(tenancy.rentAmount)}{rentCycleSuffix(tenancy.rentCycle)}
                      </p>
                      <p className="text-xs text-slate-400">
                        Until {formatDate(tenancy.endDate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {tenancy.tenantUserId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => messageMutation.mutate(tenancy.tenantUserId)}
                          disabled={messageMutation.isPending}
                        >
                          {messageMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MessageCircle className="h-3.5 w-3.5" />
                          )}
                          Message
                        </Button>
                      )}
                      <Link href={`/landlord/tenancies/${tenancy.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          Details
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add existing tenant dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {result ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" /> Tenant added
                </DialogTitle>
                <DialogDescription>
                  {result.tenantIsNew
                    ? "We created an account for them. Share this so they can log in and see their tenancy — no sign-up needed first."
                    : "They already have an account. We've also notified them in-app."}
                </DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-[#1a3c5e]/15 bg-[#1a3c5e]/[0.04] p-3 text-sm text-slate-700">
                {result.claimMessage}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    void navigator.clipboard?.writeText(result.claimMessage)
                    toast.success("Message copied")
                  }}
                >
                  <Copy className="h-4 w-4" /> Copy message
                </Button>
                <Button onClick={() => { setOpen(false); reset() }}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Add an existing tenant</DialogTitle>
                <DialogDescription>
                  Already have someone living in your unit? Add them to manage rent, receipts and
                  renewals now. They claim their account later by logging in with their phone.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Property</Label>
                    <select
                      className={inputClass}
                      value={propertyId}
                      onChange={(e) => { setPropertyId(e.target.value); setUnitId(""); setRent("") }}
                    >
                      <option value="">Select property</option>
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Unit</Label>
                    <select
                      className={inputClass}
                      value={unitId}
                      disabled={!propertyId}
                      onChange={(e) => {
                        setUnitId(e.target.value)
                        const u = vacantUnits.find((x) => x.id === e.target.value)
                        if (u?.rentPerAnnum) setRent(String(u.rentPerAnnum))
                      }}
                    >
                      <option value="">{propertyId ? "Select unit" : "Pick a property first"}</option>
                      {vacantUnits.map((u) => (
                        <option key={u.id} value={u.id}>{u.unitNumber}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="fn">Tenant first name</Label>
                    <Input id="fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ada" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ph">Phone</Label>
                    <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="rent">{rentCycle === "monthly" ? "Monthly rent (₦)" : "Annual rent (₦)"}</Label>
                    <Input id="rent" inputMode="numeric" value={rent} onChange={(e) => setRent(e.target.value.replace(/\D/g, ""))} placeholder={rentCycle === "monthly" ? "150000" : "1200000"} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rent cycle</Label>
                    <select
                      className={inputClass}
                      value={rentCycle}
                      onChange={(e) => setRentCycle(e.target.value as "monthly" | "yearly")}
                    >
                      <option value="yearly">Yearly (homes)</option>
                      <option value="monthly">Monthly (shops)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sd">Lease start date</Label>
                  <Input id="sd" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                {/* Optional details collapsed by default — keep the core form short */}
                {!showMore ? (
                  <button
                    type="button"
                    onClick={() => setShowMore(true)}
                    className="text-sm font-medium text-[#1a3c5e] hover:underline"
                  >
                    + Add more details (last name, email, deposit, end date)
                  </button>
                ) : (
                  <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="ln">Last name</Label>
                        <Input id="ln" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Okeke" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="em">Email</Label>
                        <Input id="em" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ada@email.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="dep">Deposit already paid (₦)</Label>
                        <Input id="dep" inputMode="numeric" value={deposit} onChange={(e) => setDeposit(e.target.value.replace(/\D/g, ""))} placeholder="600000" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="ed">Lease end date</Label>
                        <Input id="ed" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Leave end date blank for a standard one-year lease from the start date.
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-[#1a3c5e]/15 bg-[#1a3c5e]/[0.04] p-3 flex items-start gap-2 text-xs text-[#1a3c5e]">
                  <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Your tenant doesn&apos;t need to sign up first. They&apos;ll get a message to log in
                    with this phone number and the tenancy will already be there.
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
                <Button
                  className="gap-2"
                  disabled={!canSubmit || addMutation.isPending}
                  onClick={() => addMutation.mutate()}
                >
                  {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Add tenant
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
