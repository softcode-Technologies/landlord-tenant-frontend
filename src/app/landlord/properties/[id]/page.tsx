"use client"

import { useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { propertiesApi } from "@/lib/api/properties"
import type { CreateUnitData } from "@/lib/api/properties"
import { agentsApi, type AgentLookupResult } from "@/lib/api/agents"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { formatNairaAmount, extractApiError, rentCycleSuffix } from "@/lib/utils"
import { compressImage } from "@/lib/image"
import { ArrowLeft, Building2, Bed, Bath, MapPin, Plus, Loader2, Image, Upload, X as XIcon, UserCheck, UserMinus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { RentFeeBreakdown } from "@/components/shared/rent-fee-breakdown"

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [showAddUnit, setShowAddUnit] = useState(false)
  const [unitLabel, setUnitLabel] = useState("")
  const [unitBeds, setUnitBeds] = useState("")
  const [unitBaths, setUnitBaths] = useState("")
  const [unitToilets, setUnitToilets] = useState("")
  const [unitRent, setUnitRent] = useState("")
  const [unitCycle, setUnitCycle] = useState<"monthly" | "yearly">("yearly")
  const [imagesUnitId, setImagesUnitId] = useState<string | null>(null)
  const [unitFiles, setUnitFiles] = useState<File[]>([])
  const unitFileRef = useRef<HTMLInputElement>(null)
  const [agentOpen, setAgentOpen] = useState(false)
  const [agentPhone, setAgentPhone] = useState("")
  const [lookup, setLookup] = useState<AgentLookupResult | null>(null)
  const [agentCommission, setAgentCommission] = useState("10")

  const { data, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: () => propertiesApi.getProperty(id),
  })

  const addUnitMutation = useMutation({
    mutationFn: (payload: CreateUnitData) => propertiesApi.createUnit(payload),
    onSuccess: () => {
      toast.success("Unit added successfully")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
      closeUnitDialog()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to add unit")),
  })

  const uploadUnitImagesMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData()
      const compressed = await Promise.all(unitFiles.map((f) => compressImage(f)))
      compressed.forEach((f) => formData.append("images", f))
      return propertiesApi.uploadUnitImages(imagesUnitId!, formData)
    },
    onSuccess: () => {
      toast.success("Photos uploaded")
      setUnitFiles([])
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to upload photos")),
    // Always re-sync with the server — if a slow upload actually completed, the
    // gallery updates instead of tempting a duplicate re-upload.
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["property", id] }),
  })

  const removeUnitImageMutation = useMutation({
    mutationFn: (url: string) => propertiesApi.removeUnitImage(imagesUnitId!, url),
    onSuccess: () => {
      toast.success("Image removed")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to remove image")),
  })

  const closeAgentDialog = () => {
    setAgentOpen(false)
    setAgentPhone("")
    setLookup(null)
    setAgentCommission("10")
  }

  const lookupMutation = useMutation({
    mutationFn: (phone: string) => agentsApi.lookupByPhone(phone),
    onSuccess: (res) => setLookup(res.data),
    onError: (err: unknown) => toast.error(extractApiError(err, "Lookup failed")),
  })

  const commissionNum = () => {
    const n = parseInt(agentCommission)
    return Number.isFinite(n) && n >= 0 ? n : 0
  }

  const assignMutation = useMutation({
    mutationFn: (agentProfileId: string) => agentsApi.assignAgent(id, agentProfileId, commissionNum()),
    onSuccess: () => {
      toast.success("Agent assigned successfully")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
      closeAgentDialog()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to assign agent")),
  })

  const inviteMutation = useMutation({
    mutationFn: () => agentsApi.inviteToProperty({ propertyId: id, phone: agentPhone.trim(), commissionPercent: commissionNum() }),
    onSuccess: (res) => {
      toast.success(
        res.data.status === "assigned" ? "Agent assigned successfully" : "Invite sent to agent",
      )
      queryClient.invalidateQueries({ queryKey: ["property", id] })
      closeAgentDialog()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to invite agent")),
  })

  const removeAgentMutation = useMutation({
    mutationFn: () => agentsApi.removeAgent(id),
    onSuccess: () => {
      toast.success("Agent removed")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to remove agent")),
  })

  const closeUnitDialog = () => {
    setShowAddUnit(false)
    setUnitLabel("")
    setUnitBeds("")
    setUnitBaths("")
    setUnitToilets("")
    setUnitRent("")
  }

  const property = data?.data
  // Shops/commercial units have no bedrooms/bathrooms and rent monthly.
  const isCommercial = property?.propertyType === "commercial"

  // Open the add-unit dialog with the cycle defaulted from the property type
  // (monthly for shops, yearly for homes); the landlord can still change it.
  const openAddUnit = () => {
    setUnitCycle(isCommercial ? "monthly" : "yearly")
    setShowAddUnit(true)
  }

  const handleAddUnit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Bedrooms/bathrooms are only required for residential units.
    if (!unitLabel.trim() || !unitRent || (!isCommercial && (!unitBeds || !unitBaths))) {
      toast.error("Please fill in all required fields")
      return
    }
    addUnitMutation.mutate({
      propertyId: id,
      unitNumber: unitLabel.trim(),
      bedrooms: isCommercial ? 0 : Number(unitBeds),
      bathrooms: isCommercial ? 0 : Number(unitBaths),
      toilets: isCommercial ? undefined : (unitToilets ? Number(unitToilets) : undefined),
      rentPerAnnum: Number(unitRent),
      rentCycle: unitCycle,
    })
  }
  const imagesUnit = property?.units?.find((u) => u.id === imagesUnitId) ?? null

  const closeImagesDialog = () => {
    setImagesUnitId(null)
    setUnitFiles([])
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Property not found</p>
        <Link href="/landlord/properties">
          <Button className="mt-4">Back to Properties</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header — stacks vertically on phones (<sm), goes side-by-side on tablet+.
          Was previously one wide horizontal flex row that blew past 360px screens. */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Link href="/landlord/properties" className="shrink-0">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {property.name}
            </h1>
            <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {[property.area, property.lga, property.city, property.state]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {property.assignedAgent ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-500">
                Agent:{" "}
                <span className="font-medium text-slate-900">
                  {property.assignedAgent.firstName} {property.assignedAgent.lastName}
                </span>
              </span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 text-red-500 border-red-200"
                onClick={() => removeAgentMutation.mutate()}
                disabled={removeAgentMutation.isPending}
              >
                {removeAgentMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UserMinus className="h-3.5 w-3.5" />
                )}
                Remove Agent
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setAgentOpen(true)}
            >
              <UserCheck className="h-4 w-4" />
              Assign Agent
            </Button>
          )}
          <Link href="/landlord/listings/new">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Units", value: property.units?.length ?? 0 },
          { label: "Occupied", value: property.units?.filter((u) => u.tenancy?.status === "active").length ?? 0 },
          { label: "Vacant", value: (property.units?.length ?? 0) - (property.units?.filter((u) => u.tenancy?.status === "active").length ?? 0) },
          { label: "Listed", value: property.units?.filter((u) => u.listing?.isActive).length ?? 0 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[#1a3c5e]">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Units */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Units</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={openAddUnit}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!property.units || property.units.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No units added yet</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-1"
                onClick={openAddUnit}
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Unit
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {property.units.map((unit) => {
                const cover = unit.images?.[0]
                const imageCount = unit.images?.length ?? 0
                return (
                  <div
                    key={unit.id}
                    className="border border-slate-200 rounded-2xl overflow-hidden hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    {/* Cover image */}
                    <button
                      type="button"
                      onClick={() => setImagesUnitId(unit.id)}
                      className="relative block w-full h-36 bg-slate-100 group"
                    >
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={unit.unitNumber} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                          <Image className="h-7 w-7 mb-1" />
                          <span className="text-xs">Add photos</span>
                        </div>
                      )}
                      <span className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      {imageCount > 1 && (
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                          {imageCount} photos
                        </span>
                      )}
                    </button>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900 truncate">{unit.unitNumber}</h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {unit.tenancy?.status === "active" ? (
                            <Badge variant="default" className="text-xs">Occupied</Badge>
                          ) : unit.listing?.isActive ? (
                            <Badge variant="secondary" className="text-xs">Listed</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Vacant</Badge>
                          )}
                          {!unit.isActive && (
                            <Badge variant="destructive" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                        <div className="flex items-center gap-1">
                          <Bed className="h-3.5 w-3.5" />
                          {unit.bedrooms}bd
                        </div>
                        <div className="flex items-center gap-1">
                          <Bath className="h-3.5 w-3.5" />
                          {unit.bathrooms}ba
                        </div>
                      </div>

                      <p className="text-base font-bold text-[#1a3c5e]">
                        {formatNairaAmount(unit.rentPerAnnum)}{rentCycleSuffix(unit.rentCycle)}
                      </p>

                      {unit.tenancy?.tenant && (
                        <p className="text-xs text-slate-500 mt-2">
                          Tenant: {unit.tenancy.tenant.firstName} {unit.tenancy.tenant.lastName}
                        </p>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 gap-1.5"
                        onClick={() => setImagesUnitId(unit.id)}
                      >
                        <Image className="h-3.5 w-3.5" />
                        {imageCount > 0 ? "Manage photos" : "Add photos"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Unit Dialog */}
      <Dialog open={showAddUnit} onOpenChange={(o) => !o && closeUnitDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Unit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUnit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="unit-label">
                Unit Label <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit-label"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="e.g. Flat A, Room 1, Top Floor"
                autoFocus
              />
            </div>

            {!isCommercial && (
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="unit-beds">
                    Bedrooms <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unit-beds"
                    type="number"
                    min={0}
                    value={unitBeds}
                    onChange={(e) => setUnitBeds(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-baths">
                    Bathrooms <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unit-baths"
                    type="number"
                    min={0}
                    value={unitBaths}
                    onChange={(e) => setUnitBaths(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-toilets">Toilets</Label>
                  <Input
                    id="unit-toilets"
                    type="number"
                    min={0}
                    value={unitToilets}
                    onChange={(e) => setUnitToilets(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            )}

            {isCommercial && (
              <div className="space-y-2">
                <Label htmlFor="unit-cycle">Rent cycle</Label>
                <select
                  id="unit-cycle"
                  value={unitCycle}
                  onChange={(e) => setUnitCycle(e.target.value as "monthly" | "yearly")}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3c5e]/30"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="unit-rent">
                {unitCycle === "monthly" ? "Monthly" : "Annual"} Rent (₦) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="unit-rent"
                type="number"
                min={0}
                value={unitRent}
                onChange={(e) => setUnitRent(e.target.value)}
                placeholder="e.g. 600000"
              />
              <p className="text-xs text-slate-400">Enter amount in Naira</p>
            </div>

            <RentFeeBreakdown rentNaira={Number(unitRent) || 0} />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeUnitDialog}
                disabled={addUnitMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addUnitMutation.isPending}>
                {addUnitMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Add Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Agent Dialog — phone-first */}
      <Dialog open={agentOpen} onOpenChange={(open) => (open ? setAgentOpen(true) : closeAgentDialog())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Agent</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label htmlFor="agent-phone">Agent phone number</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="agent-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="e.g. 08012345678"
                  value={agentPhone}
                  onChange={(e) => {
                    setAgentPhone(e.target.value)
                    setLookup(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && agentPhone.trim()) lookupMutation.mutate(agentPhone.trim())
                  }}
                />
                <Button
                  variant="outline"
                  className="shrink-0 gap-2"
                  disabled={!agentPhone.trim() || lookupMutation.isPending}
                  onClick={() => lookupMutation.mutate(agentPhone.trim())}
                >
                  {lookupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Check
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                We&apos;ll check if the agent already has an account.
              </p>
            </div>

            {/* Result */}
            {lookup?.found && lookup.isAgent && lookup.agent?.agentProfileId && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm text-slate-900">
                    {`${lookup.agent.firstName ?? ""} ${lookup.agent.lastName ?? ""}`.trim() || "Agent"}
                  </p>
                  {lookup.agent.isVerified && (
                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px]">
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lookup.agent.agencyName || lookup.agent.phone} · Existing agent
                </p>
              </div>
            )}

            {lookup?.found && !lookup.isAgent && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-800">
                {`${lookup.agent?.firstName ?? "This user"} ${lookup.agent?.lastName ?? ""}`.trim()} has an account but
                isn&apos;t an agent yet. Assigning will make them your agent for this property.
              </div>
            )}

            {lookup && !lookup.found && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                No account found for this number. We&apos;ll send an SMS inviting them to join as an
                agent for this property.
              </div>
            )}

            {lookup && (
              <div>
                <Label htmlFor="agent-commission">Agent commission (%)</Label>
                <Input
                  id="agent-commission"
                  type="number"
                  min={0}
                  max={50}
                  value={agentCommission}
                  onChange={(e) => setAgentCommission(e.target.value)}
                  className="mt-1.5"
                  placeholder="e.g. 10"
                />
                <p className="text-xs text-slate-400 mt-1.5">
                  One-time letting fee, charged on the tenant&apos;s first rent. Paid from your wallet
                  to the agent — set 0 for none.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeAgentDialog} disabled={assignMutation.isPending || inviteMutation.isPending}>
              Cancel
            </Button>
            {lookup?.found && lookup.isAgent && lookup.agent?.agentProfileId ? (
              <Button
                className="gap-2"
                disabled={assignMutation.isPending}
                onClick={() => assignMutation.mutate(lookup.agent!.agentProfileId!)}
              >
                {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                Assign
              </Button>
            ) : lookup ? (
              <Button
                className="gap-2"
                disabled={inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
              >
                {inviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                {lookup.found ? "Assign as agent" : "Send invite"}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Unit Photos Dialog */}
      <Dialog open={!!imagesUnitId} onOpenChange={(o) => !o && closeImagesDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{imagesUnit ? `Photos · ${imagesUnit.unitNumber}` : "Unit photos"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            <input
              ref={unitFileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                setUnitFiles((prev) => [...prev, ...files])
                e.target.value = ""
              }}
            />

            {imagesUnit?.images && imagesUnit.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {imagesUnit.images.map((url, i) => (
                  <div key={url} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Unit photo ${i + 1}`} className="w-full h-24 object-cover rounded-xl" />
                    <button
                      onClick={() => removeUnitImageMutation.mutate(url)}
                      disabled={removeUnitImageMutation.isPending}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      aria-label="Remove photo"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
                <Image className="h-9 w-9 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No photos yet for this unit</p>
              </div>
            )}

            {unitFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium">Ready to upload:</p>
                <div className="grid grid-cols-3 gap-2">
                  {unitFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-24 object-cover rounded-xl" />
                      <button
                        onClick={() => setUnitFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-1.5" onClick={() => unitFileRef.current?.click()}>
                <Upload className="h-4 w-4" /> Choose photos
              </Button>
              {unitFiles.length > 0 && (
                <Button
                  className="flex-1 gap-1.5"
                  onClick={() => uploadUnitImagesMutation.mutate()}
                  disabled={uploadUnitImagesMutation.isPending}
                >
                  {uploadUnitImagesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload {unitFiles.length}
                </Button>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeImagesDialog}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
