"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { maintenanceApi } from "@/lib/api/maintenance"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDate, formatNaira, getStatusVariant } from "@/lib/utils"
import { Wrench, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { MaintenanceRequest } from "@/lib/types"

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  high: "text-orange-600 bg-orange-50",
  urgent: "text-red-600 bg-red-50",
}

export default function LandlordMaintenancePage() {
  const [selected, setSelected] = useState<MaintenanceRequest | null>(null)
  const [landlordNote, setLandlordNote] = useState("")
  const [costAmount, setCostAmount] = useState("")
  const [contractorName, setContractorName] = useState("")
  const [contractorPhone, setContractorPhone] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["landlord-maintenance"],
    queryFn: () => maintenanceApi.getLandlordRequests(),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      maintenanceApi.updateRequest(selected!.id, {
        status: newStatus as "open" | "in_progress" | "resolved" | "closed",
        landlordNote: landlordNote || undefined,
        costKobo: costAmount ? parseInt(costAmount) * 100 : undefined,
        contractorName: contractorName || undefined,
        contractorPhone: contractorPhone || undefined,
      }),
    onSuccess: () => {
      toast.success("Request updated!")
      queryClient.invalidateQueries({ queryKey: ["landlord-maintenance"] })
      setSelected(null)
    },
    onError: () => toast.error("Failed to update"),
  })

  const requests = data?.data ?? []

  const openRequest = (req: MaintenanceRequest) => {
    setSelected(req)
    setLandlordNote(req.landlordNote ?? "")
    setCostAmount(req.costKobo ? (req.costKobo / 100).toString() : "")
    setContractorName(req.contractorName ?? "")
    setContractorPhone(req.contractorPhone ?? "")
    setNewStatus(req.status)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
        <p className="text-slate-500 mt-1">Manage repair requests from your tenants</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["all", "open", "in_progress", "resolved", "closed"].map((status) => (
          <Badge
            key={status}
            variant={status === "all" ? "default" : "outline"}
            className="cursor-pointer capitalize text-sm px-3 py-1"
          >
            {status.replace("_", " ")}
            <span className="ml-1.5 text-xs">
              ({status === "all"
                ? requests.length
                : requests.filter((r) => r.status === status).length})
            </span>
          </Badge>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance requests"
          description="Your tenants haven't submitted any maintenance requests yet."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card
              key={req.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openRequest(req)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{req.title}</h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          PRIORITY_COLORS[req.priority] ?? ""
                        }`}
                      >
                        {req.priority}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-1 mb-2">
                      {req.description}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>
                        {req.tenant?.firstName} {req.tenant?.lastName}
                      </span>
                      <span>{req.tenancy?.property?.name ?? req.tenancy?.unit?.unitNumber}</span>
                      <span>{formatDate(req.createdAt)}</span>
                    </div>

                    {req.costKobo && (
                      <p className="text-xs text-slate-500 mt-1">
                        Cost: {formatNaira(req.costKobo)}
                      </p>
                    )}
                  </div>

                  <Badge variant={getStatusVariant(req.status)} className="capitalize shrink-0">
                    {req.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Update Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-sm text-slate-600">{selected.description}</p>
              </div>

              <div>
                <Label>Update Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Note to Tenant</Label>
                <Textarea
                  value={landlordNote}
                  onChange={(e) => setLandlordNote(e.target.value)}
                  placeholder="Add a note for the tenant..."
                  className="mt-1.5"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Repair Cost (₦)</Label>
                  <Input
                    type="number"
                    value={costAmount}
                    onChange={(e) => setCostAmount(e.target.value)}
                    placeholder="e.g. 15000"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Contractor Name</Label>
                  <Input
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    placeholder="e.g. Emeka Plumbing"
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label>Contractor Phone</Label>
                <Input
                  value={contractorPhone}
                  onChange={(e) => setContractorPhone(e.target.value)}
                  placeholder="e.g. 08012345678"
                  className="mt-1.5"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelected(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                >
                  {updateMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
