"use client"
import { extractApiError } from "@/lib/utils"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { propertiesApi } from "@/lib/api/properties"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { Building2, Plus, MapPin, Home, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { NIGERIAN_STATES, getLGAs } from "@/lib/data/nigeria-geo"

const PROPERTY_TYPES = [
  { value: "flat", label: "Flat / Apartment" },
  { value: "duplex", label: "Duplex" },
  { value: "bungalow", label: "Bungalow" },
  { value: "self_contain", label: "Self Contain" },
  { value: "room_and_parlour", label: "Room & Parlour" },
  { value: "commercial", label: "Commercial" },
  { value: "land", label: "Land" },
]

const schema = z.object({
  name: z.string().min(3, "Name required"),
  address: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  lga: z.string().optional(),
  area: z.string().optional(),
  propertyType: z.string().min(1, "Property type required"),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function LandlordPropertiesPage() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesApi.getProperties(),
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchState = watch("state")
  const lgas = getLGAs(watchState ?? "")

  const createMutation = useMutation({
    mutationFn: (data: FormData) => propertiesApi.createProperty(data),
    onSuccess: () => {
      toast.success("Property created!")
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      setOpen(false)
      reset()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to create property")),
  })

  const properties = data?.data ?? []

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* Stacks on phones so the Add Property button doesn't get pushed off-screen. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">
            Manage your property portfolio
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Add Property
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first property to start managing tenants and listings."
          actionLabel="Add Property"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-[#1a3c5e]/10">
                    <Building2 className="h-5 w-5 text-[#1a3c5e]" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {property.units?.length ?? 0} units
                  </Badge>
                </div>

                <h3 className="font-semibold text-slate-900 mb-1">{property.name}</h3>

                <div className="flex items-center gap-1 text-sm text-slate-500 mb-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {[property.area, property.lga, property.city, property.state]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Home className="h-3.5 w-3.5" />
                    {property.units?.filter((u) => u.tenancy?.status === "active").length ?? 0}/
                    {property.units?.length ?? 0} occupied
                  </div>
                </div>

                <Link href={`/landlord/properties/${property.id}`} className="block">
                  <Button variant="outline" className="w-full gap-2 text-sm">
                    Manage
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Property Dialog */}
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((d) => createMutation.mutate(d))}
            className="space-y-4 pt-2"
          >
            <div>
              <Label>Property Name</Label>
              <Input
                {...register("name")}
                placeholder="e.g. Adeola Court"
                className="mt-1.5"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* State */}
            <div>
              <Label>State</Label>
              <Select
                onValueChange={(val) => {
                  setValue("state", val)
                  setValue("lga", "")
                  setValue("city", val)
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {NIGERIAN_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>
              )}
            </div>

            {/* LGA — cascades from state */}
            <div>
              <Label>Local Government Area (LGA)</Label>
              <Select
                disabled={!watchState || lgas.length === 0}
                onValueChange={(val) => setValue("lga", val)}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder={watchState ? "Select LGA" : "Select state first"} />
                </SelectTrigger>
                <SelectContent>
                  {lgas.map((lga) => (
                    <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area / Neighbourhood */}
            <div>
              <Label>Area / Neighbourhood <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Input
                {...register("area")}
                placeholder="e.g. Lekki Phase 1, GRA, Maitama"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">Specific area within the LGA</p>
            </div>

            {/* Street Address */}
            <div>
              <Label>Street Address</Label>
              <Input
                {...register("address")}
                placeholder="e.g. 14 Admiralty Way"
                className="mt-1.5"
              />
              <p className="text-xs text-slate-400 mt-1">Street address — only shown to approved tenants</p>
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>

            {/* Property Type */}
            <div>
              <Label>Property Type</Label>
              <Select onValueChange={(val) => setValue("propertyType", val)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.propertyType && (
                <p className="text-xs text-red-500 mt-1">{errors.propertyType.message}</p>
              )}
            </div>

            <div>
              <Label>Description <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea
                {...register("description")}
                placeholder="Brief description of the property..."
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Property
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
