"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { maintenanceApi, type UpdateMaintenanceData } from "@/lib/api/maintenance"
import { useAgentFullManagementEnabled, useAppConfig } from "@/lib/hooks/use-app-config"
import type { MaintenanceRequest } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/empty-state"
import { extractApiError, formatDate, formatNaira } from "@/lib/utils"
import { Loader2, Wrench } from "lucide-react"
import { toast } from "sonner"

type Status = MaintenanceRequest["status"]
const STATUS_LABEL: Record<Status, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved", closed: "Closed" }
const PRIORITY_VARIANT: Record<MaintenanceRequest["priority"], "destructive" | "secondary" | "outline"> = {
  urgent: "destructive", high: "destructive", medium: "secondary", low: "outline",
}

type ManagedRequest = MaintenanceRequest & {
  tenancy?: MaintenanceRequest["tenancy"] & { unit?: { unitNumber?: string; property?: { name?: string } } }
}

/** Repair requests on the properties the agent manages. */
export default function AgentMaintenancePage() {
  const enabled = useAgentFullManagementEnabled()
  const { isLoading: configLoading } = useAppConfig()
  const [filter, setFilter] = useState<"open" | "all">("open")
  const [editing, setEditing] = useState<ManagedRequest | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["agent-maintenance"],
    queryFn: () => maintenanceApi.getManagedRequests(),
    enabled,
  })
  const requests = (data?.data ?? []) as ManagedRequest[]
  const shown = filter === "open" ? requests.filter((r) => r.status === "open" || r.status === "in_progress") : requests

  if (configLoading) return <Skeleton className="h-40 rounded-2xl" />
  if (!enabled) {
    return <EmptyState icon={Wrench} title="Not available yet" description="Handling repairs is coming soon to your account." />
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance</h1>
          <p className="text-slate-500 mt-1">Repair requests from tenants in the properties you manage.</p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "open" | "all")}>
          <TabsList>
            <TabsTrigger value="open">Open</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={filter === "open" ? "No open requests" : "No requests yet"}
          description="Repair requests from tenants will show here."
        />
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-5 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{r.title}</h3>
                      <Badge variant={PRIORITY_VARIANT[r.priority]} className="capitalize">{r.priority}</Badge>
                      <Badge variant="outline">{STATUS_LABEL[r.status]}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {r.tenancy?.unit?.property?.name ?? "Property"}
                      {r.tenancy?.unit?.unitNumber ? ` · Unit ${r.tenancy.unit.unitNumber}` : ""} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Update</Button>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-line">{r.description}</p>
                {(r.landlordNote || r.costKobo != null || r.contractorName) && (
                  <p className="text-xs text-slate-500">
                    {r.landlordNote && <>Note: {r.landlordNote}. </>}
                    {r.contractorName && <>Contractor: {r.contractorName}{r.contractorPhone ? ` (${r.contractorPhone})` : ""}. </>}
                    {r.costKobo != null && <>Cost: {formatNaira(r.costKobo)}.</>}
                  </p>
                )}
                {(r.images ?? []).length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-1">
                    {(r.images ?? []).map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {editing && <UpdateDialog request={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function UpdateDialog({ request: r, onClose }: { request: ManagedRequest; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>(r.status)
  const [note, setNote] = useState(r.landlordNote ?? "")
  const [cost, setCost] = useState(r.costKobo != null ? String(r.costKobo / 100) : "")
  const [contractorName, setContractorName] = useState(r.contractorName ?? "")
  const [contractorPhone, setContractorPhone] = useState(r.contractorPhone ?? "")

  const costNum = Number(cost)
  const costOk = cost.trim() === "" || (Number.isFinite(costNum) && costNum >= 0)

  const save = useMutation({
    mutationFn: () => {
      const data: UpdateMaintenanceData = {}
      if (status !== r.status) data.status = status
      if (note.trim() !== (r.landlordNote ?? "")) data.landlordNote = note.trim()
      if (cost.trim() !== "") data.costKobo = Math.round(costNum * 100)
      if (contractorName.trim()) data.contractorName = contractorName.trim()
      if (contractorPhone.trim()) data.contractorPhone = contractorPhone.trim()
      return maintenanceApi.updateRequest(r.id, data)
    },
    onSuccess: () => {
      toast.success("Request updated")
      queryClient.invalidateQueries({ queryKey: ["agent-maintenance"] })
      onClose()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Could not update the request")),
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update request</DialogTitle>
          <DialogDescription>{r.title}. The tenant is told when the status changes.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Note for the tenant</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={1000} className="mt-1.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Contractor</Label>
              <Input value={contractorName} onChange={(e) => setContractorName(e.target.value)} maxLength={200} className="mt-1.5" />
            </div>
            <div>
              <Label>Contractor phone</Label>
              <Input value={contractorPhone} onChange={(e) => setContractorPhone(e.target.value)} maxLength={20} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label>Cost (₦)</Label>
            <Input type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} className="mt-1.5" />
            {!costOk && <p className="text-xs text-red-500 mt-1">Enter a valid amount.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!costOk || save.isPending} onClick={() => save.mutate()} className="gap-2">
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
