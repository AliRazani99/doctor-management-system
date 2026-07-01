"use client"

import { useState } from "react"
import { ChevronRight, Search } from "lucide-react"
import { formatDate, ga } from "@/lib/format"
import type { RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { PageHeader } from "./page-header"
import { useStore } from "./store"

const FILTERS: { id: RiskLevel | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
]

export function PatientsView({
  onOpenPatient,
}: {
  onOpenPatient: (id: string) => void
}) {
  const { patients: PATIENTS } = useStore()
  const [query, setQuery] = useState("")
  const [risk, setRisk] = useState<RiskLevel | "all">("all")

  const filtered = PATIENTS.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase())
    const matchesRisk = risk === "all" || p.risk === risk
    return matchesQuery && matchesRisk
  })

  return (
    <div>
      <PageHeader title="Patients" subtitle="Search and filter your full patient register" />
      <div className="mx-auto max-w-7xl space-y-5 px-6 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or patient ID"
              aria-label="Search patients"
              className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setRisk(f.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div className="leading-tight">
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.id}</p>
                  </div>
                </div>
                <RiskBadge level={p.risk} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Gestation</dt>
                  <dd className="font-medium text-foreground">{ga(p.gaWeeks, p.gaDays)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Age</dt>
                  <dd className="font-medium text-foreground">{p.age} yrs</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Due date</dt>
                  <dd className="font-medium text-foreground">{formatDate(p.dueDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Next visit</dt>
                  <dd className="font-medium text-foreground">
                    {formatDate(p.nextAppointment)}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm text-muted-foreground">
                <span>{p.visits.length} visits recorded</span>
                <span className="flex items-center gap-1 font-medium text-primary">
                  Open record
                  <ChevronRight className="size-4" aria-hidden="true" />
                </span>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
              No patients match your search.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
