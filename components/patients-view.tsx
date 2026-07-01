"use client"

import { useState } from "react"
import { ChevronRight, Search } from "lucide-react"
import { formatDate, ga, toFaNumber } from "@/lib/format"
import type { RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { PageHeader } from "./page-header"
import { useStore } from "./store"

const FILTERS: { id: RiskLevel | "all"; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "low", label: "کم‌خطر" },
  { id: "medium", label: "ریسک متوسط" },
  { id: "high", label: "پرخطر" },
]

function initials(name: string): string {
  return name
    .replace(/^دکتر\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export function PatientsView({
  onOpenPatient,
}: {
  onOpenPatient: (id: string) => void
}) {
  const { patients: PATIENTS } = useStore()
  const [query, setQuery] = useState("")
  const [risk, setRisk] = useState<RiskLevel | "all">("all")

  const filtered = PATIENTS.filter((p) => {
    const q = query.trim().toLowerCase()

    const matchesQuery =
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)

    const matchesRisk = risk === "all" || p.risk === risk

    return matchesQuery && matchesRisk
  })

  return (
    <div dir="rtl">
      <PageHeader
        title="بیماران"
        subtitle="جستجو و فیلتر پرونده بیماران ثبت‌شده در سامانه"
      />

      <div className="space-y-6 px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجو بر اساس نام یا شناسه بیمار"
              aria-label="جستجوی بیماران"
              className="h-10 w-full rounded-lg border border-input bg-card py-2 pl-3 pr-9 text-right text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex w-full items-center gap-1 rounded-xl border border-border bg-card p-1 md:w-auto">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRisk(f.id)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
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

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenPatient(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onOpenPatient(p.id)
                }
              }}
              className="cursor-pointer p-5 outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {initials(p.name)}
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {p.name}
                    </h2>

                    <p dir="ltr" className="text-sm text-muted-foreground">
                      {p.id}
                    </p>
                  </div>
                </div>

                <RiskBadge level={p.risk} />
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">سن بارداری</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {ga(p.gaWeeks, p.gaDays)}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">سن بیمار</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {toFaNumber(p.age)} سال
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">تاریخ زایمان</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDate(p.dueDate)}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">نوبت بعدی</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDate(p.nextAppointment)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
                <p className="text-muted-foreground">
                  {toFaNumber(p.visits.length)} ویزیت ثبت‌شده
                </p>

                <div className="flex items-center gap-1 font-semibold text-primary">
                  مشاهده پرونده
                  <ChevronRight className="size-4 rotate-180" aria-hidden="true" />
                </div>
              </div>
            </Card>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              بیماری مطابق جستجوی شما پیدا نشد.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}