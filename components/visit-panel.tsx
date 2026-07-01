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
    toast(`یادداشت ویزیت ${toFaNumber(visit.number)} ذخیره شد`)
  }

  const active = visit.biometrics[metric]

  return (
    <div dir="rtl" className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                سونوگرافی
              </h3>
              <p className="text-xs text-muted-foreground">
                {ga(visit.gaWeeks, visit.gaDays)} · {formatDate(visit.date)}
              </p>
            </div>

            <Stethoscope className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>

          <CardContent className="p-5">
            <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted">
              <Image
                src={visit.ultrasound}
                alt={`تصویر سونوگرافی ویزیت ${toFaNumber(visit.number)}`}
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 45vw"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              یافته‌های داپلر
            </h3>
            <Stethoscope className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>

          <CardContent className="divide-y divide-border p-5 py-1">
            {visit.doppler.map((d) => (
              <div
                key={`${d.label}-${d.value}`}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{d.label}</p>
                  <p className="text-sm text-muted-foreground">{d.value}</p>
                </div>

                <RiskBadge level={d.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-primary/5">
          <CardContent className="flex items-start justify-between gap-4 p-5">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                جمع‌بندی ویزیت
              </h3>
              <p className="text-sm leading-relaxed text-foreground">
                {visit.conclusion}
              </p>
            </div>

            <RiskBadge level={visit.risk} className="shrink-0" />
          </CardContent>
        </Card>

        {visit.number === 1 && visit.ntValue !== undefined && (
          <NtRiskModule initialNt={visit.ntValue} age={patientAge} />
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                اندازه‌گیری‌های بیومتریک
              </h3>
              <p className="text-xs text-muted-foreground">
                مقایسه با منحنی استاندارد رشد در سن بارداری{" "}
                {ga(visit.gaWeeks, visit.gaDays)}
              </p>
            </div>

            <UserRound className="size-5 text-muted-foreground" aria-hidden="true" />
          </div>

          <CardContent className="p-0">
            <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] border-b border-border px-5 py-3 text-xs font-semibold text-muted-foreground">
              <span>اندازه‌گیری</span>
              <span>مقدار</span>
              <span>میانه</span>
              <span>صدک</span>
            </div>

            {METRIC_ORDER.map((key) => {
              const m = visit.biometrics[key]
              const meta = BIOMETRIC_META[key]
              const median = referenceMedian(key, visit.gaWeeks)
              const selected = key === metric

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMetric(key)}
                  className={cn(
                    "grid w-full grid-cols-[1.2fr_1fr_1fr_1fr] items-center border-b border-border px-5 py-3 text-right text-sm transition-colors last:border-0",
                    selected ? "bg-primary/5" : "hover:bg-muted/60",
                  )}
                >
                  <span>
                    <span className="font-semibold text-foreground">
                      {meta.short}
                    </span>
                    <span className="mr-2 text-muted-foreground">
                      {meta.label}
                    </span>
                  </span>

                  <span className="font-medium text-foreground">
                    {toFaNumber(m.value)} {meta.unit}
                  </span>

                  <span className="text-muted-foreground">
                    {toFaNumber(median)} {meta.unit}
                  </span>

                  <span className={cn("font-semibold", percentileTone(m.percentile))}>
                    صدک {toFaNumber(m.percentile)}
                  </span>
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                نمودار رشد
              </h3>
              <p className="text-xs text-muted-foreground">
                {BIOMETRIC_META[metric].label} ·{" "}
                {toFaNumber(active.value)} {BIOMETRIC_META[metric].unit} ·{" "}
                صدک {toFaNumber(active.percentile)}
              </p>
            </div>

            <div className="flex items-center gap-1">
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
            </div>
          </div>

          <CardContent className="p-5">
            <GrowthChart
              metric={metric}
              week={visit.gaWeeks}
              value={active.value}
            />
          </CardContent>
        </Card>

        <Card>
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              یادداشت پزشک · ویزیت {toFaNumber(visit.number)}
              <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
            </h3>

            {visit.doctorName && (
              <span className="text-xs text-muted-foreground">
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
              aria-label={`یادداشت پزشک · ویزیت ${toFaNumber(visit.number)}`}
              className="w-full resize-y rounded-lg border border-input bg-card p-3 text-right text-sm leading-relaxed text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />

            <div className="mt-3 flex items-center justify-between">
              <Button size="lg" onClick={save} disabled={saved}>
                <Save className="size-4" aria-hidden="true" />
                ذخیره یادداشت
              </Button>

              <span className="text-xs text-muted-foreground">
                {saved ? "همه تغییرات ذخیره شده‌اند" : "تغییرات ذخیره نشده‌اند"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}