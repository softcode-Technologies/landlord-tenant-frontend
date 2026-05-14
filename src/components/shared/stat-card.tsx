import { type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  subtitle?: string
}

export function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-[#1a3c5e]",
  iconBg = "bg-[#1a3c5e]/10",
  subtitle,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            {change && (
              <p
                className={cn(
                  "text-xs font-medium mt-1",
                  changeType === "positive" && "text-green-600",
                  changeType === "negative" && "text-red-500",
                  changeType === "neutral" && "text-slate-500"
                )}
              >
                {change}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
