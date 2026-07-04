"use client"

import { Bell, BellOff, ChevronLeft, TriangleAlert } from "lucide-react"
import { hospitalName } from "@/lib/data"
import { ga, toFaNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useStore } from "./store"

export function AlertsBanner({
  onOpenPatient,
}: {
  onOpenPatient: (id: string) => void
}) {
  const { visiblePatients, hospitals, showAlerts, toggleAlerts } = useStore()

  const highRisk = visiblePatients.filter((p) => p.risk === "high")

  return (
    <div dir="rtl" className="border-b border-border bg-background/60 px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TriangleAlert
            className={cn(
              "size-4",
              highRisk.length > 0 ? "text-risk-high-foreground" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span>
            {highRisk.length > 0
              ? `${toFaNumber(highRisk.length)} بیمار پرخطر نیازمند توجه`
              : "بیمار پرخطری وجود ندارد"}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={showAlerts}
          onClick={toggleAlerts}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            showAlerts
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          {showAlerts ? (
            <Bell className="size-4" aria-hidden="true" />
          ) : (
            <BellOff className="size-4" aria-hidden="true" />
          )}
          نمایش هشدارها
        </button>
      </div>

      {showAlerts && highRisk.length > 0 && (
        <div className="mx-auto mt-3 max-w-7xl overflow-hidden rounded-xl border border-risk-high bg-risk-high/60">
          <div className="flex items-center gap-2 border-b border-risk-high/50 px-4 py-2.5">
            <TriangleAlert
              className="size-4 text-risk-high-foreground"
              aria-hidden="true"
            />
            <h2 className="text-sm font-semibold text-risk-high-foreground">
              هشدار بیماران پرخطر
            </h2>
          </div>

          <ul className="divide-y divide-risk-high/40">
            {highRisk.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onOpenPatient(p.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-right transition-colors hover:bg-risk-high/40"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-risk-high-foreground">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-risk-high-foreground/80" dir="ltr">
                      {p.id}
                    </span>
                    <span className="hidden text-xs text-risk-high-foreground/80 sm:inline">
                      {ga(p.gaWeeks, p.gaDays)} · {hospitalName(p.hospitalId, hospitals)}
                    </span>
                  </span>

                  <ChevronLeft
                    className="size-4 text-risk-high-foreground"
                    aria-hidden="true"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
