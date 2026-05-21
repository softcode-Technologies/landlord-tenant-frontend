"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { propertiesApi } from "@/lib/api/properties"
import { invitesApi } from "@/lib/api/invites"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { formatNairaAmount, extractApiError } from "@/lib/utils"
import { ArrowLeft, Building2, MapPin, Bed, Bath, Plus, Pencil, UserPlus, Loader2, DoorOpen } from "lucide-react"
import { toast } from "sonner"
import type { Unit } from "@/lib/types"

export default function AgentPropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [editOpen, setEditOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", address: "" })

  const [unitOpen, setUnitOpen] = useState(false)
  const [unit, setUnit] = useState({ unitNumber: "", bedrooms: "1", bathrooms: "1", rentPerAnnum: "" })

  const [inviteUnit, setInviteUnit] = useState<Unit | null>(null)
  const [invite, setInvite] = useState({ phone: "", firstName: "", rentAmount: "", startDate: "", endDate: "" })

  const { data, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => propertiesApi.getProperty(id),
  })
  const property = data?.data
  const units = property?.units ?? []

  const editMutation = useMutation({
    mutationFn: () => propertiesApi.updateProperty(id, {
      name: form.name.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
    }),
    onSuccess: () => {
      toast.success("Property updated")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
      setEditOpen(false)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to update property")),
  })

  const addUnitMutation = useMutation({
    mutationFn: () => propertiesApi.createUnit({
      propertyId: id,
      unitNumber: unit.unitNumber.trim(),
      bedrooms: Number(unit.bedrooms),
      bathrooms: Number(unit.bathrooms),
      rentPerAnnum: Number(unit.rentPerAnnum),
    }),
    onSuccess: () => {
      toast.success("Unit added")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
      setUnitOpen(false)
      setUnit({ unitNumber: "", bedrooms: "1", bathrooms: "1", rentPerAnnum: "" })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to add unit")),
  })

  const inviteMutation = useMutation({
    mutationFn: () => invitesApi.createInvite({
      unitId: inviteUnit!.id,
      invitedPhone: invite.phone.trim(),
      firstName: invite.firstName.trim(),
      rentAmount: Number(invite.rentAmount),
      startDate: invite.startDate,
      endDate: invite.endDate,
    }),
    onSuccess: () => {
      toast.success("Invite sent to tenant")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
      setInviteUnit(null)
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to send invite")),
  })

  const openEdit = () => {
    if (!property) return
    setForm({ name: property.name, description: property.description ?? "", address: property.address ?? "" })
    setEditOpen(true)
  }

  const openInvite = (u: Unit) => {
    setInvite({
      phone: "",
      firstName: "",
      rentAmount: String(u.rentPerAnnum ?? ""),
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    })
    setInviteUnit(u)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Property not found</p>
        <Link href="/agent/properties"><Button className="mt-4">Back</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link href="/agent/properties">
        <Button variant="ghost" size="sm" className="gap-1"><ArrowLeft className="h-4 w-4" />Properties</Button>
      </Link>

      {/* Property summary */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-[#1a3c5e]" />
                {property.name}
              </h1>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[property.address, property.city, property.state].filter(Boolean).join(", ") || "No address"}
              </p>
              {property.description && <p className="text-sm text-slate-600 mt-3 max-w-2xl">{property.description}</p>}
            </div>
            <Button variant="outline" size="sm" className="gap-1" onClick={openEdit}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Units */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Units</CardTitle>
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setUnitOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add unit
          </Button>
        </CardHeader>
        <CardContent>
          {units.length === 0 ? (
            <EmptyState icon={DoorOpen} title="No units yet" description="Add a unit to start inviting tenants." />
          ) : (
            <div className="space-y-2">
              {units.map((u) => (
                <div key={u.id} className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-medium text-sm text-slate-900">Unit {u.unitNumber}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1"><Bed className="h-3 w-3" />{u.bedrooms ?? 0}</span>
                      <span className="flex items-center gap-1"><Bath className="h-3 w-3" />{u.bathrooms ?? 0}</span>
                      {u.rentPerAnnum != null && <span>· {formatNairaAmount(u.rentPerAnnum)}/yr</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.status === "occupied" ? "success" : "outline"} className="text-xs capitalize">
                      {u.status ?? "vacant"}
                    </Badge>
                    {u.status !== "occupied" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openInvite(u)}>
                        <UserPlus className="h-3 w-3" /> Invite tenant
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit property dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Property</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1.5" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button disabled={!form.name.trim() || editMutation.isPending} onClick={() => editMutation.mutate()} className="gap-2">
              {editMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add unit dialog */}
      <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Unit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Unit label / number</Label><Input value={unit.unitNumber} onChange={(e) => setUnit((u) => ({ ...u, unitNumber: e.target.value }))} placeholder="e.g. Flat A" className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Bedrooms</Label><Input type="number" min={0} value={unit.bedrooms} onChange={(e) => setUnit((u) => ({ ...u, bedrooms: e.target.value }))} className="mt-1.5" /></div>
              <div><Label>Bathrooms</Label><Input type="number" min={0} value={unit.bathrooms} onChange={(e) => setUnit((u) => ({ ...u, bathrooms: e.target.value }))} className="mt-1.5" /></div>
            </div>
            <div><Label>Annual Rent (₦)</Label><Input type="number" min={0} value={unit.rentPerAnnum} onChange={(e) => setUnit((u) => ({ ...u, rentPerAnnum: e.target.value }))} placeholder="e.g. 600000" className="mt-1.5" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitOpen(false)}>Cancel</Button>
            <Button
              disabled={!unit.unitNumber.trim() || !unit.rentPerAnnum || addUnitMutation.isPending}
              onClick={() => addUnitMutation.mutate()}
              className="gap-2"
            >
              {addUnitMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Add unit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite tenant dialog */}
      <Dialog open={!!inviteUnit} onOpenChange={(o) => { if (!o) setInviteUnit(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Tenant</DialogTitle>
            <DialogDescription>
              Invite a tenant to Unit {inviteUnit?.unitNumber}. They&apos;ll get an SMS with a code to accept.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Tenant phone</Label><Input value={invite.phone} onChange={(e) => setInvite((i) => ({ ...i, phone: e.target.value }))} placeholder="08012345678" className="mt-1.5" /></div>
            <div><Label>Tenant first name</Label><Input value={invite.firstName} onChange={(e) => setInvite((i) => ({ ...i, firstName: e.target.value }))} className="mt-1.5" /></div>
            <div><Label>Annual Rent (₦)</Label><Input type="number" value={invite.rentAmount} onChange={(e) => setInvite((i) => ({ ...i, rentAmount: e.target.value }))} className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start date</Label><Input type="date" value={invite.startDate} onChange={(e) => setInvite((i) => ({ ...i, startDate: e.target.value }))} className="mt-1.5" /></div>
              <div><Label>End date</Label><Input type="date" value={invite.endDate} onChange={(e) => setInvite((i) => ({ ...i, endDate: e.target.value }))} className="mt-1.5" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteUnit(null)}>Cancel</Button>
            <Button
              disabled={!invite.phone.trim() || !invite.firstName.trim() || !invite.rentAmount || !invite.startDate || !invite.endDate || inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
              className="gap-2"
            >
              {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
