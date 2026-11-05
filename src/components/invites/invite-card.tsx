"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { invitesApi } from "@/lib/api/invites"
import type { Invite } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  formatNairaAmount,
  formatDate,
  formatRelativeTime,
  getStatusVariant,
  extractApiError,
  rentCycleSuffix,
} from "@/lib/utils"
import { Copy, Loader2, RotateCw, Trash2, UserCheck } from "lucide-react"
import { toast } from "sonner"

/** A pending invite past its expiry date can't be accepted until it's resent. */
export function isInviteLapsed(invite: Invite): boolean {
  return invite.status === "pending" && !!invite.expiresAt && new Date(invite.expiresAt) < new Date()
}

/** Status shown to people: a lapsed pending invite reads as "expired". */
export function inviteDisplayStatus(invite: Invite): Invite["status"] {
  return isInviteLapsed(invite) ? "expired" : invite.status
}

/** "Sent by Ada Obi (Prime Homes)", or null for invites the landlord sent. */
export function inviteSenderLabel(invite: Invite): string | null {
  const agent = invite.invitedByAgent
  if (!invite.invitedByAgentProfileId && !agent) return null
  const name = [agent?.user?.firstName, agent?.user?.lastName].filter(Boolean).join(" ").trim()
  const agency = agent?.agencyName?.trim()
  if (name && agency) return `${name} (${agency})`
  return name || agency || "your agent"
}

/**
 * Resend / cancel for an invite, refreshing every invite list on success.
 * Errors show the server's reason (e.g. "wait a minute before resending").
 */
export function useInviteActions() {
  const queryClient = useQueryClient()
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["landlord-invites"] })
    queryClient.invalidateQueries({ queryKey: ["agent-invites"] })
  }

  const resend = useMutation({
    mutationFn: (id: string) => invitesApi.resendInvite(id),
    onSuccess: () => {
      toast.success("Invite resent to the tenant")
      refresh()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to resend invite")),
  })

  const cancel = useMutation({
    mutationFn: (id: string) => invitesApi.cancelInvite(id),
    onSuccess: () => {
      toast.success("Invite cancelled")
      refresh()
    },
    onError: (err: unknown) => toast.error(extractApiError(err, "Failed to cancel invite")),
  })

  return { resend, cancel }
}

export function copyInviteLink(code: string) {
  const link = `${window.location.origin}/invite/${code}`
  navigator.clipboard.writeText(link)
  toast.success("Invite link copied!")
}

interface InviteCardProps {
  invite: Invite
  /** Show "Sent by …" when an agent sent it (landlord view). */
  showSender?: boolean
}

export function InviteCard({ invite, showSender = false }: InviteCardProps) {
  const { resend, cancel } = useInviteActions()
  const status = inviteDisplayStatus(invite)
  const sender = showSender ? inviteSenderLabel(invite) : null
  const isPending = invite.status === "pending"
  const resending = resend.isPending && resend.variables === invite.id
  const cancelling = cancel.isPending && cancel.variables === invite.id

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-semibold text-slate-900">{invite.firstName}</h3>
              <span className="text-slate-400 text-sm">&middot;</span>
              <span className="text-sm text-slate-500">{invite.invitedPhone}</span>
              <Badge variant={getStatusVariant(status)} className="capitalize text-xs">
                {status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-3">
              <span>Unit {invite.unit?.unitNumber}</span>
              <span>{invite.unit?.property?.name}</span>
              <span className="font-semibold text-[#00162E]">
                {formatNairaAmount(invite.rentAmount)}{rentCycleSuffix(invite.rentCycle)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>Sent {formatRelativeTime(invite.createdAt).replace("Just now", "just now")}</span>
              <span>Start: {formatDate(invite.startDate)}</span>
              {invite.endDate && <span>End: {formatDate(invite.endDate)}</span>}
              {sender && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <UserCheck className="h-3 w-3" /> Sent by {sender}
                </span>
              )}
            </div>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 shrink-0">
              {status !== "expired" && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => copyInviteLink(invite.inviteCode)}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy link
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => resend.mutate(invite.id)}
                disabled={resending}
              >
                {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                Resend
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600 gap-1"
                onClick={() => cancel.mutate(invite.id)}
                disabled={cancelling}
                aria-label="Cancel invite"
              >
                {cancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
