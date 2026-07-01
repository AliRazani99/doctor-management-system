"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Baby, CalendarDays, ClipboardList, Users } from "lucide-react"
import { flatVisitsOf } from "@/lib/data"
import { formatDate, ga, toFaNumber } from "@/lib/format"
import type { RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { PageHeader } from "./page-header"
import { useStore } from "./store"

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "var(--chart-3)",
  medium: "var(--chart-4)",
  high: "var(--chart-5)",
}

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "کم‌خطر",
  medium: "ریسک متوسط",
  high: "پرخطر",
}

const FILTERS: { id: RiskLevel | "all"; label: string }[] = [
  { id: "all", label: "همه ریسک‌ها" },
  { id: "low", label: "کم‌خطر" },
  { id: "medium", label: "ریسک متوسط" },
  { id: "high", label: "پرخطر" },
]

export function Reports({
  onOpenPatient,
}: {
  onOpenPatient: (id: string) => void
}) {
  const { patients } = useStore()
  const [risk, setRisk] = useState<RiskLevel | "all">("all")
  const [since, setSince] = useState("")

  const flatVisits = useMemo(() => flatVisitsOf(patients), [patients])

  const totalVisits = flatVisits.length

  const visitsThisMonth = flatVisits.filter((v) => {
    const d = new Date(v.date + "T00:00:00")
    return d.getMonth() === 6 && d.getFullYear() === 2026
  }).length

  const highRiskPatients = patients.filter((p) => p.risk === "high").length

  const riskData = (["low", "medium", "high"] as RiskLevel[]).map((level) => ({
    level,
    name: RISK_LABELS[level],
    value: patients.filter((p) => p.risk === level).length,
  }))

  const visitsByTrimester = [
    {
      bucket: "سه‌ماهه اول",
      count: flatVisits.filter((v) => v.gaWeeks < 14).length,
    },
    {
      bucket: "سه‌ماهه دوم",
      count: flatVisits.filter((v) => v.gaWeeks >= 14 && v.gaWeeks < 28).length,
    },
    {
      bucket: "سه‌ماهه سوم",
      count: flatVisits.filter((v) => v.gaWeeks >= 28).length,
    },
  ]

  const filtered = flatVisits.filter((v) => {
    const matchesRisk = risk === "all" || v.risk === risk
    const matchesDate = !since || v.date >= since
    return matchesRisk && matchesDate
  })

  const stats = [
    {
      label: "کل بیماران",
      value: toFaNumber(patients.length),
      icon: Users,
    },
    {
      label: "کل ویزیت‌ها",
      value: toFaNumber(totalVisits),
      icon: ClipboardList,
    },
    {
      label: "ویزیت‌های ژوئیه",
      value: toFaNumber(visitsThisMonth),
      icon: Baby,
    },
    {
      label: "بیماران پرخطر",
      value: toFaNumber(highRiskPatients),
      icon: CalendarDays,
    },
  ]

  return (
    <div dir="rtl">
      <PageHeader
        title="گزارش‌ها"
        subtitle="آمار پرونده‌ها، وضعیت ریسک بیماران و فعالیت‌های اخیر"
      />

      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon

            return (
              <Card key={s.label}>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {s.label}
                    </p>
                    <p className="text-2xl font-semibold text-foreground">
                      {s.value}
                    </p>
                  </div>

                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                توزیع ریسک بیماران
              </h2>
            </div>

            <CardContent className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:justify-center">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={2}
                      stroke="var(--card)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {riskData.map((d) => (
                        <Cell key={d.level} fill={RISK_COLORS[d.level]} />
                      ))}
                    </Pie>

                    <Tooltip
                      formatter={(value, name) => [
                        toFaNumber(String(value)),
                        String(name),
                      ]}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <ul className="space-y-3">
                {riskData.map((d) => (
                  <li key={d.level} className="flex items-center gap-3">
                    <span
                      className="size-3 rounded-full"
                      style={{ background: RISK_COLORS[d.level] }}
                      aria-hidden="true"
                    />

                    <span className="text-sm text-foreground">{d.name}</span>

                    <span className="font-mono text-sm font-semibold text-foreground">
                      {toFaNumber(d.value)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">
                ویزیت‌ها بر اساس سه‌ماهه بارداری
              </h2>
            </div>

            <CardContent className="p-5">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={visitsByTrimester}
                    margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                    />

                    <YAxis
                      allowDecimals={false}
                      tickFormatter={(value) => toFaNumber(value)}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                    />

                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      formatter={(value) => [
                        toFaNumber(String(value)),
                        "تعداد ویزیت",
                      ]}
                      labelFormatter={(label) => String(label)}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        fontSize: 12,
                      }}
                    />

                    <Bar
                      dataKey="count"
                      name="ویزیت‌ها"
                      fill="var(--chart-1)"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              ویزیت‌های اخیر
            </h2>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                از تاریخ
                <input
                  type="text"
                  inputMode="numeric"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  placeholder="2026-07-01"
                  dir="ltr"
                  className="h-8 rounded-md border border-input bg-card px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>

              <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setRisk(f.id)}
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      risk === f.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">تاریخ</th>
                  <th className="px-5 py-3 font-medium">بیمار</th>
                  <th className="px-5 py-3 font-medium">ویزیت</th>
                  <th className="px-5 py-3 font-medium">سن بارداری</th>
                  <th className="px-5 py-3 font-medium">ریسک</th>
                  <th className="px-5 py-3 font-medium">جمع‌بندی</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((v) => (
                  <tr
                    key={v.visitId}
                    onClick={() => onOpenPatient(v.patientId)}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/60"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-muted-foreground">
                      {formatDate(v.date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 font-medium text-foreground">
                      {v.patientName}
                    </td>

                    <td className="px-5 py-3 text-muted-foreground">
                      ویزیت {toFaNumber(v.visitNumber)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-3 text-foreground">
                      {ga(v.gaWeeks, v.gaDays)}
                    </td>

                    <td className="px-5 py-3">
                      <RiskBadge level={v.risk} />
                    </td>

                    <td className="max-w-xs px-5 py-3 text-muted-foreground">
                      <span className="line-clamp-1">{v.conclusion}</span>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-muted-foreground"
                    >
                      هیچ ویزیتی با فیلترهای انتخاب‌شده پیدا نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}