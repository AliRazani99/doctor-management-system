"use client"

import { useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import { calculateNtRisk, formatRiskRatio } from "@/lib/data"
import { toFaNumber } from "@/lib/format"
import { RiskBadge } from "./risk-badge"

export function NtRiskModule({
  initialNt,
  age,
}: {
  initialNt: number
  age: number
}) {
  const [nt, setNt] = useState(initialNt)

  const result = useMemo(() => calculateNtRisk(nt, age), [nt, age])

  const rows = [
    { label: "تریزومی ۲۱", value: result.t21 },
    { label: "تریزومی ۱۸", value: result.t18 },
    { label: "تریزومی ۱۳", value: result.t13 },
  ]

  return (
    <div
      dir="rtl"
      className="rounded-xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
            <Calculator className="size-5" aria-hidden="true" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">
              ریسک سه‌ماهه اول
            </h3>
            <p className="text-sm text-muted-foreground">
              برآورد غربالگری ترکیبی
            </p>
          </div>
        </div>

        <RiskBadge level={result.risk} className="shrink-0" />
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="nt-slider"
            className="text-sm font-semibold text-foreground"
          >
            ضخامت NT
          </label>

          <span className="text-sm font-semibold text-foreground">
            {toFaNumber(nt.toFixed(1))} میلی‌متر
          </span>
        </div>

        <input
          id="nt-slider"
          type="range"
          min="0.8"
          max="6"
          step="0.1"
          value={nt}
          onChange={(e) => setNt(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--primary)]"
          dir="ltr"
        />

        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>۰.۸ میلی‌متر</span>
          <span>۶.۰ میلی‌متر</span>
        </div>
      </div>

      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
          >
            <span className="text-sm text-muted-foreground">{r.label}</span>
            <span className="font-semibold text-foreground">
              {formatRiskRatio(r.value)}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        این مدل فقط برای نسخه نمایشی است. با تغییر مقدار NT، ریسک تخمینی
        به‌صورت زنده محاسبه می‌شود و برای تصمیم‌گیری واقعی درمانی قابل استفاده
        نیست.
      </p>
    </div>
  )
}