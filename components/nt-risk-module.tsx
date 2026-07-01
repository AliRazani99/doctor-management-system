"use client"

import { useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import { calculateNtRisk, formatRiskRatio } from "@/lib/data"
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
    { label: "Trisomy 21", value: result.t21 },
    { label: "Trisomy 18", value: result.t18 },
    { label: "Trisomy 13", value: result.t13 },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Calculator className="size-4.5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              First-trimester risk
            </h3>
            <p className="text-xs text-muted-foreground">Combined screening estimate</p>
          </div>
        </div>
        <RiskBadge level={result.risk} />
      </div>

      <div className="mt-5">
        <div className="flex items-end justify-between">
          <label htmlFor="nt-input" className="text-sm font-medium text-foreground">
            Nuchal translucency
          </label>
          <span className="font-mono text-sm font-semibold text-foreground">
            {nt.toFixed(1)} mm
          </span>
        </div>
        <input
          id="nt-input"
          type="range"
          min={0.8}
          max={6}
          step={0.1}
          value={nt}
          onChange={(e) => setNt(Number(e.target.value))}
          className="mt-2 w-full accent-[var(--primary)]"
        />
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>0.8 mm</span>
          <span>6.0 mm</span>
        </div>
      </div>

      <dl className="mt-5 space-y-2">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between rounded-lg bg-muted px-3 py-2.5"
          >
            <dt className="text-sm text-muted-foreground">{r.label}</dt>
            <dd className="font-mono text-sm font-semibold text-foreground">
              {formatRiskRatio(r.value)}
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Demonstration model only — adjust the NT slider to see the estimated risk
        recalculate live. Not for clinical use.
      </p>
    </div>
  )
}
