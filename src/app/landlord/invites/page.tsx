"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { invitesApi } from "@/lib/api/invites"
import { propertiesApi } from "@/lib/api/properties"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { extractApiError, rentAmountLabel, rentCycleWord } from "@/lib/utils"
import { UserPlus, Plus, Loader2 } from "lucide-react"
import { InviteCard } from "@/components/invites/invite-card"
import { toast } from "sonner"
import { RentFeeBreakdown } from "@/components/shared/rent-fee-breakdown"

interface InviteFormData {
  unitId: string
  invitedPhone: string
  firstName: string
  rentAmount: string
  rentCycle: "monthly" | "yearly"
  startDate: string
  endDate: string
}

export default function LandlordInvitesPage() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: invitesData, isLoading } = useQuery({
    queryKey: ["landlord-invites"],
    queryFn: () => invitesApi.getInvites(),
  })

  const { data: propertiesData } = useQuery({
    queryKey: ["properties"],
    queryFn: () => propertiesApi.getProperties(),
  })

  const [form, setForm] = useState<InviteFormData>({
    unitId: "",
    invitedPhone: "",
    firstName: "",
    rentAmount: "",
    rentCycle: "yearly",
    startDate: "",
    endDate: "",
  })

  const setField = (key: keyof InviteFormData, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const resetForm = () =>
    setForm({ unitId: "", invitedPhone: "", firstName: "", rentAmount: "", rentCycle: "yearly", startDate: "", endDate: "" })

  const createMutation = useMutation({
    mutationFn: () =>
      invitesApi.createInvite({
        unitId: form.unitId,
        invitedPhone: form.invitedPhone,
        firstName: form.firstName,
        // rentAmount is stored in naira (matches unit.rentPerAnnum and the
        // payment service). The form value is already naira — do NOT ×100.
        rentAmount: parseInt(form.rentAmount),
        rentCycle: form.rentCycle,
        startDate: form.startDate,
        endDate: form.endDate,
      }),
    onSuccess: () => {
      toast.success("Invite sent!")
      queryClient.invalidateQueries({ queryKey: ["landlord-invites"] })
      setOpen(false)
      resetForm()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to send invite")),
  })

  const invites = invitesData?.data ?? []
  const properties = propertiesData?.data ?? []
  const allUnits = properties.flatMap((p) =>
    p.units?.map((u) => ({ ...u, propertyName: p.name })) ?? []
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenant Invites</h1>
          <p className="text-slate-500 mt-1">Send invitations to prospective tenants</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Send Invite
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : invites.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No invites sent"
          description="Send your first invite to a prospective tenant to get them onboarded."
          actionLabel="Send Invite"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {invites.map((invite) => (
            <InviteCard key={invite.id} invite={invite} showSender />
          ))}
        </div>
      )}

      {/* Create Invite Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Tenant Invite</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              createMutation.mutate()
            }}
            className="space-y-4 pt-2"
          >
            <div>
              <Label>Unit</Label>
              <Select
                value={form.unitId}
                onValueChange={(val) => {
                  // Rent is defined on the unit — prefill it so the landlord
                  // doesn't override what they set there.
                  const unit = allUnits.find((u) => u.id === val)
                  setForm((f) => ({
                    ...f,
                    unitId: val,
                    rentAmount: unit?.rentPerAnnum != null ? String(unit.rentPerAnnum) : f.rentAmount,
                    rentCycle: unit?.rentCycle ?? f.rentCycle,
                  }))
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {allUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.propertyName} — {unit.unitNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tenant First Name</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  placeholder="e.g. Emeka"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={form.invitedPhone}
                  onChange={(e) => setField("invitedPhone", e.target.value)}
                  placeholder="08012345678"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label>{rentAmountLabel(form.rentCycle)} (₦)</Label>
              <Input
                type="number"
                value={form.rentAmount}
                readOnly
                placeholder="Select a unit"
                className="mt-1.5 bg-slate-50 text-slate-700 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Set from the selected unit ({rentCycleWord(form.rentCycle)}ly). Edit the unit to change its rent.
              </p>
              {Number(form.rentAmount) > 0 && (
                <RentFeeBreakdown rentNaira={Number(form.rentAmount)} className="mt-2.5" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  className="mt-1.5"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => { setOpen(false); resetForm() }}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Invite
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
