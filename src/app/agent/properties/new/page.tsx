"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { agentsApi } from "@/lib/api/agents"
import { claimsApi } from "@/lib/api/claims"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Info, Loader2, UserPlus, Users, ShieldCheck } from "lucide-react"
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

const RELATIONSHIPS = [
  { value: "owner", label: "Owner" },
  { value: "caretaker", label: "Caretaker" },
  { value: "family_representative", label: "Family representative" },
  { value: "company", label: "Company" },
]

const propertyFields = {
  name: z.string().min(3, "Name required"),
  address: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  lga: z.string().optional(),
  area: z.string().optional(),
  propertyType: z.string().min(1, "Property type required"),
  description: z.string().optional(),
}

/** Existing landlord on the platform — the original flow. */
const existingSchema = z.object({ landlordProfileId: z.string().min(1, "Pick a landlord"), ...propertyFields })

/** New landlord — the agent supplies their details and we invite them. */
const newLandlordSchema = z.object({
  landlordFirstName: z.string().min(2, "First name required"),
  landlordLastName: z.string().optional(),
  landlordPhone: z.string().min(7, "Phone number required"),
  landlordEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  relationship: z.string().min(1, "Select their relationship to the property"),
  companyName: z.string().optional(),
  // Kept as a string so the schema's input and output types stay identical —
  // z.coerce makes them diverge, which breaks the resolver's typing. Converted
  // on submit instead.
  commissionPercent: z
    .string()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 50), {
      message: "Enter a whole number between 0 and 50",
    }),
  ...propertyFields,
})

type ExistingForm = z.infer<typeof existingSchema>
type NewForm = z.infer<typeof newLandlordSchema>

export default function AgentNewPropertyPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"new" | "existing">("new")

  const { data: landlordsData, isLoading: landlordsLoading } = useQuery({
    queryKey: ["agent-landlords"],
    queryFn: () => agentsApi.getMyLandlords(),
  })
  const landlords = landlordsData?.data ?? []
  const hasLandlords = !landlordsLoading && landlords.length > 0

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
          Add a property you manage. We&apos;ll invite the landlord to confirm it.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <TabButton active={tab === "new"} onClick={() => setTab("new")} icon={UserPlus}>
          New landlord
        </TabButton>
        <TabButton active={tab === "existing"} onClick={() => setTab("existing")} icon={Users}>
          Landlord already on here
          {hasLandlords && <span className="ml-1.5 text-xs text-slate-400">({landlords.length})</span>}
        </TabButton>
      </div>

      {tab === "new" ? (
        <NewLandlordForm onDone={() => router.push("/agent/properties")} />
      ) : (
        <ExistingLandlordForm
          landlords={landlords}
          loading={landlordsLoading}
          onDone={() => router.push("/agent/properties")}
          onSwitch={() => setTab("new")}
        />
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Users
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-1 pb-2.5 -mb-px border-b-2 text-sm font-medium transition-colors ${
        active
          ? "border-slate-900 text-slate-900"
          : "border-transparent text-slate-500 hover:text-slate-700"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

// ─── New landlord ─────────────────────────────────────────────────────────────

function NewLandlordForm({ onDone }: { onDone: () => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<NewForm>({
    resolver: zodResolver(newLandlordSchema),
  })
  const watchState = watch("state")
  const lgas = getLGAs(watchState ?? "")

  const mutation = useMutation({
    mutationFn: (f: NewForm) =>
      claimsApi.onboard({
        landlord: {
          firstName: f.landlordFirstName,
          lastName: f.landlordLastName || undefined,
          phone: f.landlordPhone,
          email: f.landlordEmail || undefined,
          relationship: f.relationship as "owner",
          companyName: f.companyName || undefined,
        },
        property: {
          name: f.name,
          description: f.description || undefined,
          address: f.address,
          city: f.city,
          state: f.state,
          lga: f.lga || undefined,
          area: f.area || undefined,
          propertyType: f.propertyType,
          isPublic: false,
        },
        commissionPercent: f.commissionPercent ? Number(f.commissionPercent) : undefined,
      }),
    onSuccess: (res) => {
      const channels = res.data?.channelsSent ?? []
      toast.success(
        channels.length > 0
          ? `Property added. We've asked the landlord to confirm by ${channels.join(" and ")}.`
          : "Property added. We couldn't reach the landlord — please check their contact details.",
      )
      onDone()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not add the property")),
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
      <div className="flex gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5">
        <ShieldCheck className="h-4 w-4 text-emerald-700 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-900 leading-snug">
          We&apos;ll create the landlord&apos;s account and send them a confirmation link. You can manage the
          property straight away — your commission is released once they confirm.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">The landlord</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First name" error={errors.landlordFirstName?.message}>
              <Input {...register("landlordFirstName")} placeholder="Bola" />
            </Field>
            <Field label="Last name" optional>
              <Input {...register("landlordLastName")} placeholder="Adekunle" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field
              label="Phone number"
              error={errors.landlordPhone?.message}
              hint="This is how they'll confirm — make sure it's theirs, not yours."
            >
              <Input {...register("landlordPhone")} placeholder="08012345678" inputMode="tel" />
            </Field>
            <Field label="Email" optional error={errors.landlordEmail?.message}>
              <Input {...register("landlordEmail")} placeholder="bola@example.com" inputMode="email" />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Their relationship to the property" error={errors.relationship?.message}>
              <Select onValueChange={(v) => setValue("relationship", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Your commission (%)" optional hint="Your letting fee on this property.">
              <Input {...register("commissionPercent")} placeholder="10" inputMode="numeric" />
            </Field>
          </div>
        </CardContent>
      </Card>

      <PropertyFieldsCard register={register} errors={errors} setValue={setValue} lgas={lgas} />

      <div className="flex justify-end gap-2">
        <Link href="/agent/properties">
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add property & invite landlord
        </Button>
      </div>
    </form>
  )
}

// ─── Existing landlord ────────────────────────────────────────────────────────

function ExistingLandlordForm({
  landlords,
  loading,
  onDone,
  onSwitch,
}: {
  landlords: { landlordProfileId: string; firstName: string | null; lastName: string | null; phone: string; propertyCount: number }[]
  loading: boolean
  onDone: () => void
  onSwitch: () => void
}) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ExistingForm>({
    resolver: zodResolver(existingSchema),
  })
  const watchState = watch("state")
  const lgas = getLGAs(watchState ?? "")

  const mutation = useMutation({
    mutationFn: (f: ExistingForm) => agentsApi.createPropertyAsAgent(f),
    onSuccess: () => {
      toast.success("Property added. The landlord has been notified.")
      onDone()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to add property")),
  })

  if (!loading && landlords.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center text-center py-8">
            <div className="p-3 rounded-xl bg-slate-100 mb-4">
              <UserPlus className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">No confirmed landlords yet</h3>
            <p className="text-sm text-slate-500 max-w-md mb-5">
              This list fills up as landlords confirm you. To add a property for someone new, enter their
              details and we&apos;ll invite them.
            </p>
            <Button onClick={onSwitch} size="sm">Add a new landlord</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Landlord</CardTitle></CardHeader>
        <CardContent>
          <Field label="Which landlord?" error={errors.landlordProfileId?.message}>
            <Select onValueChange={(v) => setValue("landlordProfileId", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder={loading ? "Loading…" : "Select a landlord"} /></SelectTrigger>
              <SelectContent>
                {landlords.map((l) => (
                  <SelectItem key={l.landlordProfileId} value={l.landlordProfileId}>
                    {[l.firstName, l.lastName].filter(Boolean).join(" ") || l.phone}
                    {l.propertyCount > 0 && ` · ${l.propertyCount} propert${l.propertyCount === 1 ? "y" : "ies"}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <PropertyFieldsCard register={register} errors={errors} setValue={setValue} lgas={lgas} />

      <div className="flex justify-end gap-2">
        <Link href="/agent/properties">
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add property
        </Button>
      </div>
    </form>
  )
}

// ─── Shared property fields ───────────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function PropertyFieldsCard({
  register,
  errors,
  setValue,
  lgas,
}: {
  register: any
  errors: any
  setValue: any
  lgas: string[]
}) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">The property</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field label="Property name" error={errors.name?.message}>
          <Input {...register("name")} placeholder="Awolowo Heights" />
        </Field>
        <Field label="Street address" error={errors.address?.message} hint="Only shown to tenants after an inspection is unlocked.">
          <Input {...register("address")} placeholder="14 Awolowo Road" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="State" error={errors.state?.message}>
            <Select onValueChange={(v) => { setValue("state", v, { shouldValidate: true }); setValue("lga", "") }}>
              <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="City" error={errors.city?.message}>
            <Input {...register("city")} placeholder="Ikeja" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="LGA" optional>
            <Select onValueChange={(v) => setValue("lga", v)}>
              <SelectTrigger><SelectValue placeholder={lgas.length ? "Select LGA" : "Pick a state first"} /></SelectTrigger>
              <SelectContent>
                {lgas.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Area / neighbourhood" optional>
            <Input {...register("area")} placeholder="Lekki Phase 1" />
          </Field>
        </div>
        <Field label="Property type" error={errors.propertyType?.message}>
          <Select onValueChange={(v) => setValue("propertyType", v, { shouldValidate: true })}>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Description" optional>
          <Textarea {...register("description")} rows={3} placeholder="Anything a tenant should know" />
        </Field>
      </CardContent>
    </Card>
  )
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function Field({
  label,
  children,
  error,
  hint,
  optional,
}: {
  label: string
  children: React.ReactNode
  error?: string
  hint?: string
  optional?: boolean
}) {
  return (
    <div>
      <Label className="text-sm">
        {label}
        {optional && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && (
        <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
          <Info className="h-3 w-3 mt-0.5 shrink-0" />
          {hint}
        </p>
      )}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
