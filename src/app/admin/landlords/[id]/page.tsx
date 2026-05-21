"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api/admin"
import type { LandlordOverviewProperty, LandlordOverviewUnit } from "@/lib/api/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { formatNaira, formatNairaAmount, formatDate, formatDateTime } from "@/lib/utils"
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, UserCheck, AlertTriangle,
  Home, DoorOpen, History, Receipt, ArrowUpRight,
} from "lucide-react"

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${accent ?? "text-slate-900"}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function UnitRow({ unit, onViewPayments }: { unit: LandlordOverviewUnit; onViewPayments: (tenancyId: string) => void }) {
  const t = unit.tenancy
  return (
    <div className={`rounded-xl border p-4 ${t?.overdue ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <DoorOpen className="h-4 w-4 text-slate-400" />
          <div>
            <p className="font-medium text-sm text-slate-900">
              Unit {unit.unitNumber ?? "—"}
            </p>
            <p className="text-xs text-slate-400">
              {unit.bedrooms ?? 0} bed · {unit.bathrooms ?? 0} bath
              {unit.rentPerAnnum != null && ` · ${formatNairaAmount(unit.rentPerAnnum)}/yr`}
            </p>
          </div>
        </div>
        {unit.occupied ? (
          <Badge variant="success" className="text-xs">Occupied</Badge>
        ) : (
          <Badge variant="outline" className="text-xs text-slate-500">Vacant</Badge>
        )}
      </div>

      {t && (
        <>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Tenant</p>
              <p className="font-medium text-slate-900">{t.tenantName}</p>
              {t.tenantPhone && <p className="text-xs text-slate-400">{t.tenantPhone}</p>}
            </div>
            <div>
              <p className="text-xs text-slate-400">Annual Rent</p>
              <p className="font-semibold text-[#1a3c5e]">{formatNairaAmount(t.rentAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Next Due</p>
              <p className={`font-medium ${t.overdue ? "text-red-600" : "text-slate-900"}`}>
                {formatDate(t.nextDueDate)}
                {t.overdue && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] gap-0.5">
                    <AlertTriangle className="h-2.5 w-2.5" />Overdue
                  </Badge>
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Last Payment</p>
              <p className="font-medium text-slate-900">{formatDate(t.lastPaidAt ?? t.lastPaymentDate)}</p>
              <p className="text-xs text-slate-400">Collected: {formatNaira(t.totalCollectedKobo)}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1"
              onClick={() => onViewPayments(t.id)}
            >
              <History className="h-3 w-3" />
              Payment history
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

function PropertyCard({ property, onViewPayments }: { property: LandlordOverviewProperty; onViewPayments: (tenancyId: string) => void }) {
  const occupied = property.units.filter((u) => u.occupied).length
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#1a3c5e]" />
              {property.name}
            </p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {[property.address, property.city, property.state].filter(Boolean).join(", ") || "No address"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {occupied}/{property.units.length} occupied
            </Badge>
            {property.assignedAgent && (
              <Badge variant="outline" className="text-xs gap-1 text-[#1a3c5e] border-[#1a3c5e]/30">
                <UserCheck className="h-3 w-3" />
                {property.assignedAgent.name}
              </Badge>
            )}
          </div>
        </div>

        {property.assignedAgent?.phone && (
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Phone className="h-3 w-3" /> Agent: {property.assignedAgent.phone}
            {property.assignedAgent.agencyName && ` · ${property.assignedAgent.agencyName}`}
          </p>
        )}

        {property.units.length === 0 ? (
          <p className="text-sm text-slate-400">No units added to this property.</p>
        ) : (
          <div className="space-y-2">
            {property.units.map((u) => <UnitRow key={u.id} unit={u} onViewPayments={onViewPayments} />)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function escrowVariant(status: string): "success" | "warning" | "destructive" | "outline" {
  if (status === "released") return "success"
  if (status === "held") return "warning"
  if (status === "refunded") return "destructive"
  return "outline"
}

function paymentVariant(status: string): "success" | "warning" | "destructive" | "outline" {
  if (status === "success") return "success"
  if (status === "pending") return "warning"
  if (status === "failed") return "destructive"
  return "outline"
}

function TenancyPaymentsDialog({ tenancyId, onClose }: { tenancyId: string | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-tenancy-payments", tenancyId],
    queryFn: () => adminApi.getTenancyPayments(tenancyId!),
    enabled: !!tenancyId,
  })
  const history = data?.data

  return (
    <Dialog open={!!tenancyId} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
          </div>
        ) : !history ? (
          <p className="text-sm text-slate-400 py-6 text-center">No data.</p>
        ) : (
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Tenant + tenancy header */}
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{history.tenant.name}</p>
              <p className="text-xs text-slate-400">
                {history.tenant.phone ?? "—"} · {history.tenancy.propertyName ?? "Property"}
                {history.tenancy.unitNumber && ` · Unit ${history.tenancy.unitNumber}`}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Annual Rent</p>
                  <p className="font-semibold text-[#1a3c5e]">{formatNairaAmount(history.tenancy.rentAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Next Due</p>
                  <p className="font-medium text-slate-900">{formatDate(history.tenancy.nextDueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Payments Made</p>
                  <p className="font-medium text-slate-900">{history.stats.paymentCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Paid</p>
                  <p className="font-semibold text-green-600">{formatNaira(history.stats.totalPaidKobo)}</p>
                </div>
              </div>
            </div>

            {/* Payments list */}
            <div className="overflow-y-auto flex-1" style={{ maxHeight: "45vh" }}>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Receipt className="h-3.5 w-3.5" /> Payments ({history.payments.length})
              </p>
              {history.payments.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No payments recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.payments.map((p) => (
                    <div key={p.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{formatNaira(p.amountKobo)}</p>
                          <p className="text-xs text-slate-400">
                            {formatDateTime(p.paidAt ?? p.createdAt)} · {p.provider}
                          </p>
                          <p className="text-[11px] text-slate-300 mt-0.5">Ref: {p.reference}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant={paymentVariant(p.status)} className="text-[10px] capitalize">{p.status}</Badge>
                          {p.escrow && (
                            <Badge variant={escrowVariant(p.escrow.status)} className="text-[10px] capitalize">
                              Escrow: {p.escrow.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {p.escrow && (
                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-500">
                          <span>Landlord net: <span className="font-medium text-slate-700">{formatNaira(p.escrow.netAmountKobo)}</span></span>
                          <span>Commission: {formatNaira(p.escrow.commissionKobo)}</span>
                          {p.escrow.releasedAt
                            ? <span>Released {formatDate(p.escrow.releasedAt)}</span>
                            : <span>Releases {formatDate(p.escrow.releaseAfter)}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Rent change log */}
              {history.rentChanges.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <ArrowUpRight className="h-3.5 w-3.5" /> Rent Changes ({history.rentChanges.length})
                  </p>
                  <div className="space-y-2">
                    {history.rentChanges.map((rc) => (
                      <div key={rc.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <div>
                          <p className="text-slate-700">
                            {formatNairaAmount(rc.previousAmount)} → <span className="font-semibold">{formatNairaAmount(rc.newAmount)}</span>
                          </p>
                          {rc.reason && <p className="text-xs text-slate-400">{rc.reason}</p>}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-[10px] capitalize">{rc.changeType}</Badge>
                          <p className="text-xs text-slate-400 mt-0.5">{formatDate(rc.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function AdminLandlordOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [paymentsTenancyId, setPaymentsTenancyId] = useState<string | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ["admin-landlord", id],
    queryFn: () => adminApi.getLandlordOverview(id),
  })

  const overview = data?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        {[1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    )
  }

  if (!overview) {
    return (
      <div className="space-y-6">
        <Link href="/admin/landlords">
          <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" />Back</Button>
        </Link>
        <EmptyState icon={Building2} title="Landlord not found" description="This landlord may have been removed." />
      </div>
    )
  }

  const { landlord, summary, properties } = overview

  return (
    <div className="space-y-6">
      <Link href="/admin/landlords">
        <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" />All landlords</Button>
      </Link>

      {/* Landlord header */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {landlord.name}
                {landlord.isBanned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                {landlord.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{landlord.phone}</span>}
                {landlord.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{landlord.email}</span>}
                <span>Joined {formatDate(landlord.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={landlord.kycStatus === "approved" ? "success" : landlord.kycStatus === "pending" ? "warning" : "outline"}
                className="text-xs capitalize"
              >
                KYC: {landlord.kycStatus}
              </Badge>
              {landlord.isVerified && <Badge variant="success" className="text-xs">Verified</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      {summary.overdueCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {summary.overdueCount} tenanc{summary.overdueCount === 1 ? "y is" : "ies are"} overdue on rent.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Properties" value={String(summary.properties)} sub={`${summary.units} units`} />
        <SummaryCard
          label="Occupancy"
          value={`${summary.occupiedUnits}/${summary.units}`}
          sub={`${summary.vacantUnits} vacant`}
        />
        <SummaryCard
          label="Expected Annual Rent"
          value={formatNairaAmount(summary.expectedAnnualRentNaira)}
          sub={`${summary.activeTenancies} active tenancies`}
          accent="text-[#1a3c5e]"
        />
        <SummaryCard
          label="Total Collected"
          value={formatNaira(summary.totalCollectedKobo)}
          sub="rent payments to date"
          accent="text-green-600"
        />
      </div>

      {/* Properties */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Home className="h-5 w-5 text-slate-400" />
          Properties &amp; Tenants
        </h2>
        {properties.length === 0 ? (
          <EmptyState icon={Building2} title="No properties yet" description="This landlord hasn't listed any properties." />
        ) : (
          properties.map((p) => (
            <PropertyCard key={p.id} property={p} onViewPayments={setPaymentsTenancyId} />
          ))
        )}
      </div>

      <TenancyPaymentsDialog tenancyId={paymentsTenancyId} onClose={() => setPaymentsTenancyId(null)} />
    </div>
  )
}
