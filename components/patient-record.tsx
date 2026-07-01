"use client"

import { useState } from "react"
import { ArrowLeft, Plus } from "lucide-react"
import { formatDate, ga } from "@/lib/format"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RiskBadge } from "./risk-badge"
import { VisitPanel } from "./visit-panel"
import { NewVisitDialog } from "./new-visit-dialog"
import { useStore } from "./store"

export function PatientRecord({
  patientId,
  onBack,
}: {
  patientId: string
  onBack: () => void
}) {
  const { patients } = useStore()
  const patient = patients.find((p) => p.id === patientId)
  const [activeVisitId, setActiveVisitId] = useState(
    patient?.visits[patient.visits.length - 1]?.id ?? "",
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  if (!patient) {
    return <div className="p-6 text-sm text-muted-foreground">Patient not found.</div>
  }

  const activeVisit =
    patient.visits.find((v) => v.id === activeVisitId) ??
    patient.visits[patient.visits.length - 1] ??
    patient.visits[0]

  const summary = [
    { label: "Age", value: `${patient.age} yrs` },
    { label: "Patient ID", value: patient.id, mono: true },
    { label: "Gestation", value: ga(patient.gaWeeks, patient.gaDays) },
    { label: "Due date", value: formatDate(patient.dueDate) },
    { label: "Gravida / Para", value: `G${patient.gravida} P${patient.para}` },
    { label: "Blood type", value: patient.bloodType },
  ]

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to patients
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-foreground">
                {patient.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">
                  {patient.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Next appointment {formatDate(patient.nextAppointment)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RiskBadge
                level={patient.risk}
                className="px-3 py-1 text-sm"
                label={`Overall: ${patient.risk} risk`}
              />
              <Button size="lg" onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" aria-hidden="true" />
                New visit
              </Button>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
            {summary.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-muted-foreground">{s.label}</dt>
                <dd
                  className={cn(
                    "text-sm font-medium text-foreground",
                    s.mono && "font-mono",
                  )}
                >
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Visit timeline */}
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Visit timeline</h2>
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            {patient.visits.map((visit, i) => {
              const active = visit.id === activeVisit.id
              return (
                <div key={visit.id} className="flex items-stretch">
                  <button
                    type="button"
                    onClick={() => setActiveVisitId(visit.id)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex min-w-44 flex-col gap-1 rounded-xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:bg-muted/60",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        Visit {visit.number}
                      </span>
                      <RiskBadge level={visit.risk} withDot={false} label={visit.risk} />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {ga(visit.gaWeeks, visit.gaDays)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(visit.date)}
                    </span>
                  </button>
                  {i < patient.visits.length - 1 && (
                    <div className="flex items-center px-1" aria-hidden="true">
                      <div className="h-px w-3 bg-border" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Active visit content (remounts per visit to reset local state) */}
        <VisitPanel
          key={activeVisit.id}
          patientId={patient.id}
          visit={activeVisit}
          patientAge={patient.age}
        />
      </div>

      {dialogOpen && (
        <NewVisitDialog
          patientId={patient.id}
          onClose={() => setDialogOpen(false)}
          onCreated={(visit) => {
            setActiveVisitId(visit.id)
            setDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}
