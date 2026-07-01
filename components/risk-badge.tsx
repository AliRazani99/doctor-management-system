import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/types"

const STYLES: Record<RiskLevel, string> = {
  low: "bg-risk-low text-risk-low-foreground",
  medium: "bg-risk-medium text-risk-medium-foreground",
  high: "bg-risk-high text-risk-high-foreground",
}

const LABELS: Record<RiskLevel, string> = {
  low: "کم‌خطر",
  medium: "ریسک متوسط",
  high: "پرخطر",
}

export function RiskBadge({
  level,
  className,
  withDot = true,
  label,
}: {
  level: RiskLevel
  className?: string
  withDot?: boolean
  label?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        STYLES[level],
        className,
      )}
    >
      {withDot && <span className="size-1.5 rounded-full bg-current" />}
      {label ?? LABELS[level]}
    </span>
  )
}