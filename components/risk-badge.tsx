import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/types"

const STYLES: Record<RiskLevel, string> = {
  low: "bg-risk-low text-risk-low-foreground",
  medium: "bg-risk-medium text-risk-medium-foreground",
  high: "bg-risk-high text-risk-high-foreground",
}

const LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        STYLES[level],
        className,
      )}
    >
      {withDot && (
        <span
          className="size-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {label ?? LABELS[level]}
    </span>
  )
}
