"use client"

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

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara"
]

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
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => propertiesApi.createProperty(data),
    onSuccess: () => {
      toast.success("Property created!")
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      setOpen(false)
      reset()
    },
    onError: () => toast.error("Failed to create property"),
  })

  const properties = data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
          <p className="text-slate-500 mt-1">Manage your property portfolio</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
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

                <div className="flex items-center gap-1 text-sm text-slate-500 mb-4">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="truncate">
                    {property.address}, {property.city}, {property.state}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Home className="h-3.5 w-3.5" />
                    {property.units?.filter((u) => u.tenancy?.status === "active").length ?? 0}/
                    {property.units?.length ?? 0} occupied
                  </div>
                </div>

                <Link href={`/landlord/properties/${property.id}`} className="mt-4 block">
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
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
                placeholder="e.g. Adeola Court Lekki"
                className="mt-1.5"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label>Address</Label>
              <Input
                {...register("address")}
                placeholder="e.g. 14 Admiralty Road"
                className="mt-1.5"
              />
              {errors.address && (
                <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>City</Label>
                <Input
                  {...register("city")}
                  placeholder="e.g. Lekki"
                  className="mt-1.5"
                />
                {errors.city && (
                  <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>
                )}
              </div>
              <div>
                <Label>State</Label>
                <Select onValueChange={(val) => setValue("state", val)}>
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
            </div>

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
              <Label>Description (optional)</Label>
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
                onClick={() => { setOpen(false); reset() }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Property
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
