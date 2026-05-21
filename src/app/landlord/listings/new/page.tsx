"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { propertiesApi } from "@/lib/api/properties"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import apiClient from "@/lib/api/client"
import { RentFeeBreakdown } from "@/components/shared/rent-fee-breakdown"

interface FormData {
  unitId: string
  title: string
  description: string
  rentPerAnnum: string
  availableFrom: string
}

const defaultForm: FormData = {
  unitId: "",
  title: "",
  description: "",
  rentPerAnnum: "",
  availableFrom: new Date().toISOString().slice(0, 10),
}

export default function NewListingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormData>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesApi.getProperties(),
  })

  const properties = propertiesData?.data ?? []
  const allUnits = properties.flatMap((p) =>
    p.units?.map((u) => ({ ...u, propertyName: p.name })) ?? []
  )
  const selectedUnit = allUnits.find((u) => u.id === form.unitId)

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.unitId) errs.unitId = "Please select a unit"
    if (form.title.length < 5) errs.title = "Title must be at least 5 characters"
    if (form.description.length < 20) errs.description = "Description must be at least 20 characters"
    if (!form.rentPerAnnum || Number(form.rentPerAnnum) < 1) errs.rentPerAnnum = "Rent amount required"
    if (!form.availableFrom) errs.availableFrom = "Available from date required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await apiClient.post("/listings", {
        unitId: form.unitId,
        title: form.title,
        description: form.description,
        rentPerAnnum: Number(form.rentPerAnnum),
        availableFrom: form.availableFrom,
      })
      toast.success("Listing created successfully!")
      // Mark the cached lists stale so the destination page refetches on mount
      // and the new listing shows immediately instead of after a manual refresh.
      queryClient.invalidateQueries({ queryKey: ["my-listings"] })
      queryClient.invalidateQueries({ queryKey: ["listings"] })
      queryClient.invalidateQueries({ queryKey: ["properties"] })
      router.push("/landlord/listings")
    } catch {
      toast.error("Failed to create listing. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/landlord/listings">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Listing</h1>
          <p className="text-slate-500 mt-0.5 text-sm">Fill in the details to list your property</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Unit Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Unit</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={form.unitId}
              onValueChange={(val) => {
                const unit = allUnits.find((u) => u.id === val)
                setForm((f) => ({
                  ...f,
                  unitId: val,
                  rentPerAnnum: unit?.rentPerAnnum ? String(unit.rentPerAnnum) : f.rentPerAnnum,
                }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a unit to list" />
              </SelectTrigger>
              <SelectContent>
                {allUnits.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No units available. Add a property first.
                  </SelectItem>
                ) : (
                  allUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.propertyName} — {unit.unitNumber}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.unitId && (
              <p className="text-xs text-red-500 mt-1">{errors.unitId}</p>
            )}
            {allUnits.length === 0 && (
              <p className="text-sm text-amber-600 mt-2">
                You need to add a property and units first.{" "}
                <Link href="/landlord/properties" className="font-semibold underline">
                  Add Property
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Listing Details */}
        <Card>
          <CardHeader>
            <CardTitle>Listing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Listing Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="e.g. Modern 3-Bedroom Flat in Lekki Phase 1"
                className="mt-1.5"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title}</p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe the property — amenities, nearby facilities, access, condition..."
                className="mt-1.5"
                rows={4}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Annual Rent (₦)
                  {selectedUnit?.rentPerAnnum && (
                    <span className="ml-2 text-xs font-normal text-green-600">
                      pre-filled from unit
                    </span>
                  )}
                </Label>
                <Input
                  type="number"
                  value={form.rentPerAnnum}
                  onChange={(e) => setField("rentPerAnnum", e.target.value)}
                  placeholder="e.g. 1200000"
                  className="mt-1.5"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Asking price shown to tenants — can differ from the unit&apos;s base rent
                </p>
                {errors.rentPerAnnum && (
                  <p className="text-xs text-red-500 mt-1">{errors.rentPerAnnum}</p>
                )}
              </div>
              <div>
                <Label>Available From</Label>
                <Input
                  type="date"
                  value={form.availableFrom}
                  onChange={(e) => setField("availableFrom", e.target.value)}
                  className="mt-1.5"
                />
                {errors.availableFrom && (
                  <p className="text-xs text-red-500 mt-1">{errors.availableFrom}</p>
                )}
              </div>
            </div>

            <RentFeeBreakdown rentNaira={Number(form.rentPerAnnum) || 0} />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/landlord/listings" className="flex-1">
            <Button variant="outline" className="w-full">Cancel</Button>
          </Link>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Publish Listing
          </Button>
        </div>
      </form>
    </div>
  )
}
