"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { maintenanceApi } from "@/lib/api/maintenance"
import { tenanciesApi } from "@/lib/api/tenancies"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { formatDate, getStatusVariant } from "@/lib/utils"
import { Wrench, Plus, Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const schema = z.object({
  tenancyId: z.string().min(1, "Please select a tenancy"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
})

type FormData = z.infer<typeof schema>

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-green-600 bg-green-50",
  medium: "text-yellow-600 bg-yellow-50",
  high: "text-orange-600 bg-orange-50",
  urgent: "text-red-600 bg-red-50",
}

export default function TenantMaintenancePage() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: () => maintenanceApi.getTenantRequests(),
  })

  const { data: tenanciesData } = useQuery({
    queryKey: ["tenant-tenancies"],
    queryFn: () => tenanciesApi.getTenantTenancies(),
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium" },
  })

  const createMutation = useMutation({
    mutationFn: (data: FormData) => maintenanceApi.createRequest(data),
    onSuccess: () => {
      toast.success("Maintenance request submitted!")
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] })
      setOpen(false)
      reset()
    },
    onError: () => {
      toast.error("Failed to submit request")
    },
  })

  const requests = requestsData?.data ?? []
  const tenancies = tenanciesData?.data ?? []
  const activeTenancies = tenancies.filter((t) => t.status === "active")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Requests</h1>
          <p className="text-slate-500 mt-1">Submit and track repair requests</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Request
        </Button>
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
          description="Submit a request when something needs fixing in your property."
          actionLabel="Submit Request"
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{req.title}</h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                          PRIORITY_COLORS[req.priority] ?? "text-slate-600 bg-slate-100"
                        }`}
                      >
                        {req.priority}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                      {req.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{formatDate(req.createdAt)}</span>
                      {req.landlordNote && (
                        <span className="text-[#1a3c5e]">Landlord note added</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getStatusVariant(req.status)} className="capitalize">
                      {req.status.replace("_", " ")}
                    </Badge>
                    {req.status === "resolved" && !req.rating && (
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Rate
                      </Button>
                    )}
                  </div>
                </div>

                {req.landlordNote && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs font-medium text-blue-700 mb-1">Landlord Note:</p>
                    <p className="text-xs text-blue-600">{req.landlordNote}</p>
                  </div>
                )}

                {req.contractorName && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                    <p className="text-xs font-medium text-slate-600 mb-1">Contractor:</p>
                    <p className="text-xs text-slate-700">
                      {req.contractorName}
                      {req.contractorPhone && ` · ${req.contractorPhone}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Maintenance Request</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4 pt-2">
            <div>
              <Label>Property / Tenancy</Label>
              <Select onValueChange={(val) => setValue("tenancyId", val)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select tenancy" />
                </SelectTrigger>
                <SelectContent>
                  {activeTenancies.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.property?.name ?? t.unit?.unitNumber ?? t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tenancyId && (
                <p className="text-xs text-red-500 mt-1">{errors.tenancyId.message}</p>
              )}
            </div>

            <div>
              <Label>Title</Label>
              <Input
                {...register("title")}
                placeholder="e.g. Leaking pipe in bathroom"
                className="mt-1.5"
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Describe the issue in detail..."
                className="mt-1.5"
                rows={3}
              />
              {errors.description && (
                <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                defaultValue="medium"
                onValueChange={(val) =>
                  setValue("priority", val as "low" | "medium" | "high" | "urgent")
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low — Not urgent</SelectItem>
                  <SelectItem value="medium">Medium — Needs attention</SelectItem>
                  <SelectItem value="high">High — Urgent</SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Urgent — Emergency
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
