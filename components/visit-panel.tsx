"use client"

import { useState } from "react"
import Image from "next/image"
import { FileText, Save, Stethoscope, UserRound } from "lucide-react"
import { BIOMETRIC_META, referenceMedian } from "@/lib/data"
import type { BiometricKey, Visit } from "@/lib/types"
import { formatDate, ga, toFaNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { GrowthChart } from "./growth-chart"
import { NtRiskModule } from "./nt-risk-module"
import { useToast } from "./toast"
import { useStore } from "./store"

const METRIC_ORDER: BiometricKey[] = ["hc", "ac", "fl", "efw"]

function percentileTone(p: number): string {
  if (p < 10 || p > 90) return "text-risk-high-foreground"
  if (p < 25 || p > 75) return "text-risk-medium-foreground"
  return "text-risk-low-foreground"
}

export function VisitPanel({
  patientId,
  visit,
  patientAge,
}: {
  patientId: string
  visit: Visit
  patientAge: number
}) {
  const [metric, setMetric] = useState<BiometricKey>("hc")
  const [note, setNote] = useState(visit.note)
  const [saved, setSaved] = useState(true)
  const toast = useToast()
  const { updateVisitNote } = useStore()

  function save() {
    updateVisitNote(patientId, visit.id, note)
    setSaved(true)
    toast(`یادداشت ویزیت ${visit.number} ذخیره شد`)
  }

  const active = visit.biometrics[metric]

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Left: imaging + doppler */}
      <div className="space-y-6 lg:col-span-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">سونوگرافی</h3>
            <span className="text-xs text-muted-foreground">
              {ga(visit.gaWeeks, visit.gaDays)} · {formatDate(visit.date)}
            </span>
          </div>
          <div className="relative aspect-[4/3] w-full bg-foreground">
            <Image
              src={visit.ultrasound || "/placeholder.svg"}
              alt={`Ultrasound scan from Visit ${visit.number} at ${ga(visit.gaWeeks, visit.gaDays)}`}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <Stethoscope className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">یافته های داپلر</h3>
          </div>
          <CardContent className="space-y-2 p-5">
            {visit.doppler.map((d) => (
              <div
                key={d.label}
                className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5"
              >
                <span className="text-sm text-muted-foreground">{d.label}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-sm font-medium text-foreground">
                    {d.value}
                  </span>
                  <RiskBadge level={d.status} withDot={false} label={d.status} />
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="rounded-xl border border-border bg-accent/40 p-5">
          <h3 className="text-sm font-semibold text-foreground">جمع‌بندی ویزیت</h3>
          <div className="mt-2 flex items-start gap-3">
            <RiskBadge level={visit.risk} />
            <p className="text-sm leading-relaxed text-foreground">{visit.conclusion}</p>
          </div>
        </div>

        {visit.number === 1 && visit.ntValue !== undefined && (
          <NtRiskModule initialNt={visit.ntValue} age={patientAge} />
        )}
      </div>

      {/* Right: biometrics, chart, note */}
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <div className="border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">اندازه گیری های بیومتریک</h3>
            <p className="text-xs text-muted-foreground">
              مقایسه با منحنی استاندارد رشد در سن بارداری {ga(visit.gaWeeks, visit.gaDays)}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 font-medium">اندازه گیری</th>
                  <th className="px-5 py-2.5 font-medium">مقدار</th>
                  <th className="px-5 py-2.5 font-medium">میانه</th>
                  <th className="px-5 py-2.5 font-medium">صدک</th>
                </tr>
              </thead>
              <tbody>
                {METRIC_ORDER.map((key) => {
                  const m = visit.biometrics[key]
                  const meta = BIOMETRIC_META[key]
                  const median = referenceMedian(key, visit.gaWeeks)
                  const selected = key === metric
                  return (
                    <tr
                      key={key}
                      onClick={() => setMetric(key)}
                      className={cn(
                        "cursor-pointer border-b border-border last:border-0 transition-colors",
                        selected ? "bg-primary/5" : "hover:bg-muted/60",
                      )}
                    >
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2 rounded-full",
                              selected ? "bg-primary" : "bg-transparent",
                            )}
                            aria-hidden="true"
                          />
                          <span className="font-medium text-foreground">{meta.short}</span>
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {meta.label}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-foreground">
                        {m.value} {meta.unit}
                      </td>
                      <td className="px-5 py-3 font-mono text-muted-foreground">
                        {median} {meta.unit}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("font-semibold", percentileTone(m.percentile))}>
                          {m.percentile}th
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <CardContent className="border-t border-border p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {METRIC_ORDER.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetric(key)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    key === metric
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground",
                  )}
                >
                  {BIOMETRIC_META[key].short}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                {BIOMETRIC_META[metric].label} · {active.value} {BIOMETRIC_META[metric].unit} ({active.percentile}th centile)
              </span>
            </div>
            <GrowthChart metric={metric} week={visit.gaWeeks} value={active.value} />
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-3">
            <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-foreground">
              Doctor&apos;s note · Visit {visit.number}
            </h3>
            {visit.doctorName && (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                <UserRound className="size-3.5" aria-hidden="true" />
                {visit.doctorName}
              </span>
            )}
          </div>
          <CardContent className="p-5">
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                setSaved(false)
              }}
              rows={5}
              aria-label={`یادداشت پزشک · ویزیت {toFaNumber(visit.number)}`}
              className="w-full resize-y rounded-lg border border-input bg-card p-3 text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {saved ? "همه تغییرات ذخیره شده‌اند" : "تغییرات ذخیره نشده"}
              </span>
              <Button size="lg" onClick={save} disabled={saved}>
                <Save className="size-4" aria-hidden="true" />
                ذخیره یادداشت
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
