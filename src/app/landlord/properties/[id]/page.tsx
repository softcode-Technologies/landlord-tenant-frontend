"use client"

import { useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { propertiesApi } from "@/lib/api/properties"
import type { CreateUnitData } from "@/lib/api/properties"
import { agentsApi } from "@/lib/api/agents"
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
import { formatNairaAmount, extractApiError } from "@/lib/utils"
import { ArrowLeft, Building2, Bed, Bath, MapPin, Plus, Loader2, Image, Upload, X as XIcon, UserCheck, UserMinus } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [showAddUnit, setShowAddUnit] = useState(false)
  const [unitLabel, setUnitLabel] = useState("")
  const [unitBeds, setUnitBeds] = useState("")
  const [unitBaths, setUnitBaths] = useState("")
  const [unitToilets, setUnitToilets] = useState("")
  const [unitRent, setUnitRent] = useState("")
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [agentOpen, setAgentOpen] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState("")

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

  const uploadImagesMutation = useMutation({
    mutationFn: () => {
      const formData = new FormData()
      imageFiles.forEach((f) => formData.append("images", f))
      return propertiesApi.uploadImages(id, formData)
    },
    onSuccess: () => {
      toast.success("Images uploaded successfully")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
      setImageFiles([])
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to upload images")),
  })

  const { data: agentsData } = useQuery({
    queryKey: ["agent-directory"],
    queryFn: () => agentsApi.getDirectory({ limit: 50 }),
    enabled: agentOpen,
  })
  const agentList = agentsData?.data?.data ?? []

  const assignMutation = useMutation({
    mutationFn: () => agentsApi.assignAgent(id, selectedAgentId),
    onSuccess: () => {
      toast.success("Agent assigned successfully")
      queryClient.invalidateQueries({ queryKey: ["property", id] })
      setAgentOpen(false)
      setSelectedAgentId("")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to assign agent")),
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

  const handleAddUnit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!unitLabel.trim() || !unitBeds || !unitBaths || !unitRent) {
      toast.error("Please fill in all required fields")
      return
    }
    addUnitMutation.mutate({
      propertyId: id,
      unitNumber: unitLabel.trim(),
      bedrooms: Number(unitBeds),
      bathrooms: Number(unitBaths),
      toilets: unitToilets ? Number(unitToilets) : undefined,
      rentPerAnnum: Number(unitRent),
    })
  }

  const property = data?.data

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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/landlord/properties">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{property.name}</h1>
          <div className="flex items-center gap-1 text-sm text-slate-500 mt-0.5">
            <MapPin className="h-3.5 w-3.5" />
            {[property.area, property.lga, property.city, property.state].filter(Boolean).join(", ")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {property.assignedAgent ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">
                Agent: <span className="font-medium text-slate-900">
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
            <Button variant="outline" className="gap-2" onClick={() => setAgentOpen(true)}>
              <UserCheck className="h-4 w-4" />
              Assign Agent
            </Button>
          )}
          <Link href="/landlord/listings/new">
            <Button className="gap-2">
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
              onClick={() => setShowAddUnit(true)}
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
                onClick={() => setShowAddUnit(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Unit
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {property.units.map((unit) => (
                <div
                  key={unit.id}
                  className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">{unit.unitNumber}</h4>
                    <div className="flex items-center gap-1.5">
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

                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
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
                    {formatNairaAmount(unit.rentPerAnnum)}/yr
                  </p>

                  {unit.tenancy?.tenant && (
                    <p className="text-xs text-slate-500 mt-2">
                      Tenant: {unit.tenancy.tenant.firstName} {unit.tenancy.tenant.lastName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Property Images</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Add Images
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              setImageFiles((prev) => [...prev, ...files])
              e.target.value = ""
            }}
          />

          {property.images && property.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {property.images.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`Property image ${i + 1}`}
                  className="w-full h-24 object-cover rounded-xl"
                />
              ))}
            </div>
          )}

          {imageFiles.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">Ready to upload:</p>
              <div className="grid grid-cols-3 gap-2">
                {imageFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-xl"
                    />
                    <button
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setImageFiles((prev) => prev.filter((_, j) => j !== i))}
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => uploadImagesMutation.mutate()}
                disabled={uploadImagesMutation.isPending}
              >
                {uploadImagesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload {imageFiles.length} Image{imageFiles.length !== 1 ? "s" : ""}
              </Button>
            </div>
          )}

          {(!property.images || property.images.length === 0) && imageFiles.length === 0 && (
            <div className="text-center py-6">
              <Image className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400 mb-3">No images uploaded yet</p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Images
              </Button>
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

            <div className="space-y-2">
              <Label htmlFor="unit-rent">
                Annual Rent (₦) <span className="text-red-500">*</span>
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

      {/* Assign Agent Dialog */}
      <Dialog open={agentOpen} onOpenChange={setAgentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Agent</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {agentList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Loading agents...</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {agentList.map((agent) => {
                  const name = `${agent.user?.firstName ?? ""} ${agent.user?.lastName ?? ""}`.trim() || "Agent"
                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.userId)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                        selectedAgentId === agent.userId
                          ? "border-[#1a3c5e] bg-[#1a3c5e]/5"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <p className="font-medium text-sm text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{agent.city}, {agent.state}</p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAgentOpen(false)} disabled={assignMutation.isPending}>
              Cancel
            </Button>
            <Button
              disabled={!selectedAgentId || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
              className="gap-2"
            >
              {assignMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
