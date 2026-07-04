"use client"

import { useState } from "react"
import { Building2, ChevronRight, Pencil, Plus, Search, Stethoscope, Trash2 } from "lucide-react"
import { doctorName, hospitalName } from "@/lib/data"
import { formatDate, ga, toFaNumber } from "@/lib/format"
import type { Patient, RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { PageHeader } from "./page-header"
import { PatientFormDialog } from "./patient-form-dialog"
import { useStore } from "./store"
import { useToast } from "./toast"

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
  const { visiblePatients: PATIENTS, doctors, hospitals, currentUser, removePatient } =
    useStore()
  const toast = useToast()
  const [query, setQuery] = useState("")
  const [risk, setRisk] = useState<RiskLevel | "all">("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)

  const filtered = PATIENTS.filter((p) => {
    const q = query.trim().toLowerCase()

    const matchesQuery =
      p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)

    const matchesRisk = risk === "all" || p.risk === risk

    return matchesQuery && matchesRisk
  })

  function handleDelete(p: Patient) {
    if (
      window.confirm(
        `حذف پرونده «${p.name}» (${p.id})؟ این عمل قابل بازگشت نیست.`,
      )
    ) {
      removePatient(p.id)
      toast(`پرونده ${p.name} حذف شد`)
    }
  }

  return (
    <div dir="rtl">
      <PageHeader
        title="بیماران"
        subtitle={
          currentUser?.role === "admin"
            ? "جستجو و مدیریت پرونده همه بیماران سامانه"
            : "بیماران تحت مراقبت شما"
        }
      >
        <Button
          size="lg"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" aria-hidden="true" />
          افزودن بیمار
        </Button>
      </PageHeader>

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
              className="flex flex-col p-5 transition-shadow hover:shadow-md"
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

                    <p dir="ltr" className="text-right text-sm text-muted-foreground">
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
                  <p className="text-muted-foreground">تاریخ زایمان</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatDate(p.dueDate)}
                  </p>
                </div>

                <div>
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Building2 className="size-3.5" aria-hidden="true" />
                    بیمارستان
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {hospitalName(p.hospitalId, hospitals)}
                  </p>
                </div>

                <div>
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <Stethoscope className="size-3.5" aria-hidden="true" />
                    پزشک مسئول
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    {doctorName(p.assignedDoctorId, doctors)}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(p)
                      setDialogOpen(true)
                    }}
                    aria-label={`ویرایش ${p.name}`}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    ویرایش
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    aria-label={`حذف ${p.name}`}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-risk-high hover:text-risk-high-foreground"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    حذف
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenPatient(p.id)}
                  className="flex items-center gap-1 font-semibold text-primary"
                >
                  مشاهده پرونده
                  <ChevronRight className="size-4 rotate-180" aria-hidden="true" />
                </button>
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

      {dialogOpen && (
        <PatientFormDialog
          patient={editing ?? undefined}
          onClose={() => {
            setDialogOpen(false)
            setEditing(null)
          }}
          onCreated={(p) => onOpenPatient(p.id)}
        />
      )}
    </div>
  )
}
