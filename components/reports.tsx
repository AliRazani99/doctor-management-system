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
import { PATIENTS, allVisitsFlat } from "@/lib/data"
import { formatDate, ga } from "@/lib/format"
import type { RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { PageHeader } from "./page-header"

const RISK_COLORS: Record<RiskLevel, string> = {
  low: "var(--chart-3)",
  medium: "var(--chart-4)",
  high: "var(--chart-5)",
}

const FILTERS: { id: RiskLevel | "all"; label: string }[] = [
  { id: "all", label: "All risk" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
]

export function Reports({ onOpenPatient }: { onOpenPatient: (id: string) => void }) {
  const [risk, setRisk] = useState<RiskLevel | "all">("all")
  const [since, setSince] = useState("")

  const flatVisits = useMemo(() => allVisitsFlat(), [])
  const totalVisits = flatVisits.length
  const visitsThisMonth = flatVisits.filter((v) => {
    const d = new Date(v.date + "T00:00:00")
    return d.getMonth() === 6 && d.getFullYear() === 2026
  }).length

  const riskData = (["low", "medium", "high"] as RiskLevel[]).map((level) => ({
    level,
    name: level[0].toUpperCase() + level.slice(1),
    value: PATIENTS.filter((p) => p.risk === level).length,
  }))

  const visitsByWeek = [
    { bucket: "1st tri", count: flatVisits.filter((v) => v.gaWeeks < 14).length },
    {
      bucket: "2nd tri",
      count: flatVisits.filter((v) => v.gaWeeks >= 14 && v.gaWeeks < 28).length,
    },
    { bucket: "3rd tri", count: flatVisits.filter((v) => v.gaWeeks >= 28).length },
  ]

  const filtered = flatVisits.filter((v) => {
    const matchesRisk = risk === "all" || v.risk === risk
    const matchesDate = !since || v.date >= since
    return matchesRisk && matchesDate
  })

  const stats = [
    { label: "Total patients", value: String(PATIENTS.length), icon: Users },
    { label: "Total visits", value: String(totalVisits), icon: ClipboardList },
    { label: "Visits in July", value: String(visitsThisMonth), icon: Baby },
    {
      label: "High-risk patients",
      value: String(PATIENTS.filter((p) => p.risk === "high").length),
      icon: CalendarDays,
    },
  ]

  return (
    <div>
      <PageHeader title="Reports" subtitle="Caseload statistics and recent activity" />
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <p className="text-2xl font-semibold text-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Risk distribution</h2>
            </div>
            <CardContent className="flex items-center gap-6 p-5">
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
                    <span className="text-sm text-foreground">{d.name} risk</span>
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {d.value}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-semibold text-foreground">Visits by trimester</h2>
            </div>
            <CardContent className="p-5">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={visitsByWeek} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <XAxis
                      dataKey="bucket"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      stroke="var(--border)"
                    />
                    <Tooltip
                      cursor={{ fill: "var(--muted)" }}
                      contentStyle={{
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="count"
                      name="Visits"
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
            <h2 className="text-sm font-semibold text-foreground">Recent visits</h2>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                Since
                <input
                  type="date"
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
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
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Patient</th>
                  <th className="px-5 py-3 font-medium">Visit</th>
                  <th className="px-5 py-3 font-medium">Gestation</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Conclusion</th>
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
                    <td className="px-5 py-3 text-muted-foreground">Visit {v.visitNumber}</td>
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
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">
                      No visits match the selected filters.
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
