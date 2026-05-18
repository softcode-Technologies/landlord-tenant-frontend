"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { agentsApi } from "@/lib/api/agents"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building2, ArrowLeft, Info, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { extractApiError } from "@/lib/utils"
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
  landlordProfileId: z.string().min(1, "Pick a landlord"),
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

export default function AgentNewPropertyPage() {
  const router = useRouter()

  const { data: landlordsData, isLoading: landlordsLoading } = useQuery({
    queryKey: ["agent-landlords"],
    queryFn: () => agentsApi.getMyLandlords(),
  })
  const landlords = landlordsData?.data ?? []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const watchState = watch("state")
  const lgas = getLGAs(watchState ?? "")

  const createMutation = useMutation({
    mutationFn: (form: FormData) => agentsApi.createPropertyAsAgent(form),
    onSuccess: () => {
      toast.success("Property added. The landlord has been notified.")
      router.push("/agent/properties")
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to add property")),
  })

  const noLandlords = !landlordsLoading && landlords.length === 0

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/agent/properties">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add a property</h1>
        <p className="text-slate-500 mt-1">
          Create a property on behalf of a landlord who has already assigned you to one of their properties.
        </p>
      </div>

      {noLandlords && (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center py-8">
              <div className="p-3 rounded-xl bg-amber-100 mb-4">
                <UserPlus className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">No landlord relationship yet</h3>
              <p className="text-sm text-slate-500 max-w-md mb-5">
                You can only add properties for landlords you already manage for.
                A landlord must first assign you to one of their existing properties using your registered phone number.
              </p>
              <Link href="/agent">
                <Button variant="outline" size="sm">
                  Back to dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {!noLandlords && (
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Landlord</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Add this property under</Label>
                {landlordsLoading ? (
                  <Skeleton className="h-10 w-full mt-1.5" />
                ) : (
                  <Select onValueChange={(v) => setValue("landlordProfileId", v, { shouldValidate: true })}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Choose a landlord you manage for" />
                    </SelectTrigger>
                    <SelectContent>
                      {landlords.map((l) => {
                        const name =
                          `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || l.phone
                        return (
                          <SelectItem key={l.landlordProfileId} value={l.landlordProfileId}>
                            {name} · {l.propertyCount} propert{l.propertyCount === 1 ? "y" : "ies"}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                )}
                {errors.landlordProfileId && (
                  <p className="text-xs text-red-600 mt-1">{errors.landlordProfileId.message}</p>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 flex gap-2.5 text-xs text-blue-900">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  The landlord will be notified that you added a property under their name. They can remove
                  you or archive the property at any time from their dashboard.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Property details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Property name</Label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Sunrise Apartments, Lekki"
                  className="mt-1.5"
                />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <Label>Property type</Label>
                <Select onValueChange={(v) => setValue("propertyType", v, { shouldValidate: true })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-500" />
                          {t.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyType && (
                  <p className="text-xs text-red-600 mt-1">{errors.propertyType.message}</p>
                )}
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  {...register("address")}
                  placeholder="House number and street"
                  className="mt-1.5"
                />
                {errors.address && (
                  <p className="text-xs text-red-600 mt-1">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>State</Label>
                  <Select
                    onValueChange={(v) => {
                      setValue("state", v, { shouldValidate: true })
                      setValue("lga", "")
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {NIGERIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.state && (
                    <p className="text-xs text-red-600 mt-1">{errors.state.message}</p>
                  )}
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    {...register("city")}
                    placeholder="e.g. Lagos"
                    className="mt-1.5"
                  />
                  {errors.city && (
                    <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>
                  )}
                </div>
              </div>

              {lgas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>LGA (optional)</Label>
                    <Select
                      onValueChange={(v) => setValue("lga", v)}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Select LGA" />
                      </SelectTrigger>
                      <SelectContent>
                        {lgas.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Area (optional)</Label>
                    <Input
                      {...register("area")}
                      placeholder="Neighbourhood / estate"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label>Description (optional)</Label>
                <Textarea
                  {...register("description")}
                  placeholder="Anything you want the landlord to know about this listing"
                  className="mt-1.5"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link href="/agent/properties" className="sm:w-auto">
              <Button variant="ghost" type="button" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2 w-full sm:w-auto">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add property
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
