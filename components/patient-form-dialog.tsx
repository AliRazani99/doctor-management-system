"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { Patient, RiskLevel } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useStore } from "./store"
import { useToast } from "./toast"

const RISKS: { id: RiskLevel; label: string }[] = [
  { id: "low", label: "کم‌خطر" },
  { id: "medium", label: "ریسک متوسط" },
  { id: "high", label: "پرخطر" },
]

export function PatientFormDialog({
  patient,
  onClose,
  onCreated,
}: {
  /** When provided the dialog edits an existing patient. */
  patient?: Patient
  onClose: () => void
  onCreated?: (patient: Patient) => void
}) {
  const { hospitals, doctors, currentUser, addPatient, updatePatient } = useStore()
  const toast = useToast()
  const isEdit = Boolean(patient)
  const isAdmin = currentUser?.role === "admin"

  const today = new Date().toISOString().slice(0, 10)
  const [name, setName] = useState(patient?.name ?? "")
  const [age, setAge] = useState(String(patient?.age ?? "30"))
  const [bloodType, setBloodType] = useState(patient?.bloodType ?? "O+")
  const [gaWeeks, setGaWeeks] = useState(String(patient?.gaWeeks ?? "12"))
  const [gaDays, setGaDays] = useState(String(patient?.gaDays ?? "0"))
  const [gravida, setGravida] = useState(String(patient?.gravida ?? "1"))
  const [para, setPara] = useState(String(patient?.para ?? "0"))
  const [dueDate, setDueDate] = useState(patient?.dueDate ?? "")
  const [nextAppointment, setNextAppointment] = useState(
    patient?.nextAppointment ?? today,
  )
  const [risk, setRisk] = useState<RiskLevel>(patient?.risk ?? "low")
  const [hospitalId, setHospitalId] = useState(
    patient?.hospitalId ?? currentUser?.hospitalIds[0] ?? hospitals[0]?.id ?? "",
  )
  const [assignedDoctorId, setAssignedDoctorId] = useState(
    patient?.assignedDoctorId ?? currentUser?.id ?? "",
  )
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("نام بیمار الزامی است.")
      return
    }
    if (!hospitalId) {
      setError("انتخاب بیمارستان الزامی است.")
      return
    }

    const base = {
      name: name.trim(),
      age: Number(age) || 0,
      bloodType: bloodType.trim(),
      gaWeeks: Number(gaWeeks) || 0,
      gaDays: Number(gaDays) || 0,
      gravida: Number(gravida) || 0,
      para: Number(para) || 0,
      dueDate: dueDate || today,
      nextAppointment: nextAppointment || today,
      risk,
      hospitalId,
      assignedDoctorId: assignedDoctorId || currentUser?.id || "",
    }

    if (isEdit && patient) {
      updatePatient(patient.id, base)
      toast(`پرونده ${base.name} به‌روزرسانی شد`)
      onClose()
      return
    }

    const created = addPatient(base)
    toast(`بیمار ثبت شد — شناسه ورود: ${created.id}`)
    onCreated?.(created)
    onClose()
  }

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="patient-form-title"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="patient-form-title" className="text-base font-semibold text-foreground">
              {isEdit ? "ویرایش بیمار" : "افزودن بیمار جدید"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isEdit
                ? "به‌روزرسانی اطلاعات پرونده بیمار"
                : "پس از ثبت، شناسه ورود اختصاصی برای بیمار صادر می‌شود"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="نام و نام خانوادگی">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً زهرا محمدی"
                className={inputClass}
              />
            </Field>
            <Field label="سن">
              <input
                type="number"
                min={12}
                max={60}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="سن بارداری (هفته)">
              <input
                type="number"
                min={4}
                max={42}
                value={gaWeeks}
                onChange={(e) => setGaWeeks(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="سن بارداری (روز)">
              <input
                type="number"
                min={0}
                max={6}
                value={gaDays}
                onChange={(e) => setGaDays(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="گروه خونی">
              <input
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                dir="ltr"
                className={cn(inputClass, "text-left")}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تعداد بارداری (Gravida)">
              <input
                type="number"
                min={0}
                value={gravida}
                onChange={(e) => setGravida(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="تعداد زایمان (Para)">
              <input
                type="number"
                min={0}
                value={para}
                onChange={(e) => setPara(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="تاریخ تخمینی زایمان">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                dir="ltr"
                className={cn(inputClass, "text-left")}
              />
            </Field>
            <Field label="نوبت بعدی">
              <input
                type="date"
                value={nextAppointment}
                onChange={(e) => setNextAppointment(e.target.value)}
                dir="ltr"
                className={cn(inputClass, "text-left")}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="بیمارستان محل ثبت‌نام">
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className={inputClass}
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.city}
                  </option>
                ))}
              </select>
            </Field>

            {isAdmin ? (
              <Field label="پزشک مسئول">
                <select
                  value={assignedDoctorId}
                  onChange={(e) => setAssignedDoctorId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">بدون پزشک مسئول</option>
                  {doctors
                    .filter((d) => d.role === "doctor")
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </Field>
            ) : (
              <Field label="پزشک مسئول">
                <input
                  value={currentUser?.name ?? ""}
                  disabled
                  className={cn(inputClass, "opacity-70")}
                />
              </Field>
            )}
          </div>

          <Field label="سطح ریسک اولیه">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              {RISKS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRisk(r.id)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    risk === r.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </Field>

          {error && (
            <p role="alert" className="text-sm font-medium text-risk-high-foreground">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" size="lg">
              {isEdit ? "ذخیره تغییرات" : "ثبت بیمار"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-right text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}
