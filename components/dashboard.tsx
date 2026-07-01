"use client"

import { Baby, CalendarClock, ChevronRight, TriangleAlert, Users } from "lucide-react"
import type { Patient } from "@/lib/types"
import { formatDate, ga, toFaNumber } from "@/lib/format"
import { Card, CardContent } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { PageHeader } from "./page-header"
import { useStore } from "./store"

export function Dashboard({ onOpenPatient }: { onOpenPatient: (id: string) => void }) {
  const { patients: PATIENTS } = useStore()
  const total = PATIENTS.length
  const highRisk = PATIENTS.filter((p) => p.risk === "high").length
  const visitsThisMonth = PATIENTS.flatMap((p) => p.visits).filter((v) => {
    const d = new Date(v.date + "T00:00:00")
    return d.getMonth() === 6 && d.getFullYear() === 2026
  }).length
  const upcoming = [...PATIENTS]
    .sort((a, b) => (a.nextAppointment < b.nextAppointment ? -1 : 1))
    .slice(0, 1)[0]

    const stats = [
      { label: "بیماران فعال", value: toFaNumber(total), icon: Users },
      { label: "ویزیت‌های این ماه", value: toFaNumber(visitsThisMonth), icon: Baby },
      { label: "بیماران پرخطر", value: toFaNumber(highRisk), icon: TriangleAlert },
      {
        label: "نوبت بعدی",
        value: formatDate(upcoming.nextAppointment),
        icon: CalendarClock,
        small: true,
      },
    ]

  return (
    <div>
      <PageHeader
        title="داشبورد"
        subtitle="نمای کلی بیماران و ویزیت‌های پیش‌رو"
      />
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
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                    <p
                      className={
                        s.small
                          ? "truncate text-base font-semibold text-foreground"
                          : "text-2xl font-semibold text-foreground"
                      }
                    >
                      {s.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <PatientTable patients={PATIENTS} onOpenPatient={onOpenPatient} />
      </div>
    </div>
  )
}

export function PatientTable({
  patients: PATIENTS,
  onOpenPatient,
}: {
  patients: Patient[]
  onOpenPatient: (id: string) => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">فهرست بیماران</h2>
        <p className="text-sm text-muted-foreground">
          {PATIENTS.length} بیمار تحت پایش فعال
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3 font-medium">بیمار</th>
              <th className="px-5 py-3 font-medium">شناسه</th>
              <th className="px-5 py-3 font-medium">سن بارداری</th>
              <th className="px-5 py-3 font-medium">ریسک</th>
              <th className="px-5 py-3 font-medium">نوبت بعدی</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {PATIENTS.map((p) => (
              <tr
                key={p.id}
                tabIndex={0}
                onClick={() => onOpenPatient(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onOpenPatient(p.id)
                  }
                }}
                className="cursor-pointer border-b border-border last:border-0 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {initials(p.name)}
                    </span>
                    <div className="leading-tight">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{toFaNumber(p.age)} سال</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                  {p.id}
                </td>
                <td className="px-5 py-3.5 text-foreground">{ga(p.gaWeeks, p.gaDays)}</td>
                <td className="px-5 py-3.5">
                  <RiskBadge level={p.risk} />
                </td>
                <td className="px-5 py-3.5 text-muted-foreground">
                  {formatDate(p.nextAppointment)}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <ChevronRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}
