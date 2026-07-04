"use client"

import { useState } from "react"
import {
  Building2,
  CloudDownload,
  RefreshCw,
  Trash2,
  UserCog,
  UserPlus,
} from "lucide-react"
import type { UserRole } from "@/lib/types"
import { hospitalName } from "@/lib/data"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { PageHeader } from "./page-header"
import { useStore } from "./store"
import { useToast } from "./toast"

function initials(name: string): string {
  return name
    .replace(/^دکتر\s*/i, "")
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export function AdminView() {
  const {
    doctors,
    patients,
    hospitals,
    currentUser,
    addDoctor,
    removeDoctor,
    updatePatient,
    syncStatus,
    lastSynced,
    syncNow,
  } = useStore()
  const toast = useToast()

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("doctor")
  const [assignedHospital, setAssignedHospital] = useState<string>(hospitals[0]?.id ?? "")
  const [error, setError] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!name.trim() || !specialty.trim() || !trimmedEmail || !password) {
      setError("تکمیل همه فیلدها الزامی است.")
      return
    }
    if (doctors.some((d) => d.email.toLowerCase() === trimmedEmail)) {
      setError("پزشکی با این ایمیل از قبل ثبت شده است.")
      return
    }
    const displayName = /^دکتر\s/i.test(name.trim()) ? name.trim() : `دکتر ${name.trim()}`
    addDoctor({
      name: displayName,
      specialty: specialty.trim(),
      email: trimmedEmail,
      password,
      role,
      hospitalIds: role === "admin" ? hospitals.map((h) => h.id) : [assignedHospital],
    })
    toast(`${displayName} افزوده شد`)
    setName("")
    setSpecialty("")
    setEmail("")
    setPassword("")
    setRole("doctor")
    setError("")
  }

  function handleRemove(id: string, docName: string) {
    removeDoctor(id)
    toast(`${docName} حذف شد`)
  }

  const roleLabel = (r: UserRole) => (r === "admin" ? "مدیر" : "پزشک")
  const unassigned = patients.filter((p) => !p.assignedDoctorId)

  return (
    <div dir="rtl">
      <PageHeader
        title="مدیریت"
        subtitle="مدیریت پزشکان، تخصیص بیماران و همگام‌سازی داده‌های بیرونی"
      />
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        {/* همگام‌سازی داده‌های بیرونی */}
        <Card>
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <CloudDownload className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">
              همگام‌سازی با سامانه‌های بیرونی
            </h2>
          </div>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-sm text-foreground">
                دریافت پرونده‌های بیماران از سامانه‌های بیمارستانی متصل.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {syncStatus === "syncing"
                  ? "در حال دریافت اطلاعات…"
                  : lastSynced
                    ? `آخرین همگام‌سازی: ${new Date(lastSynced).toLocaleString("fa-IR")}`
                    : "تاکنون همگام‌سازی انجام نشده است."}
              </p>
            </div>
            <Button size="lg" onClick={syncNow} disabled={syncStatus === "syncing"}>
              <RefreshCw
                className={cn("size-4", syncStatus === "syncing" && "animate-spin")}
                aria-hidden="true"
              />
              {syncStatus === "syncing" ? "در حال همگام‌سازی…" : "همگام‌سازی اکنون"}
            </Button>
          </CardContent>
        </Card>

        {/* بیماران بدون پزشک مسئول */}
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <UserCog className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">
              تخصیص پزشک مسئول
            </h2>
          </div>
          {unassigned.length === 0 ? (
            <div className="px-5 py-6 text-sm text-muted-foreground">
              همه بیماران دارای پزشک مسئول هستند.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {unassigned.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <RiskBadge level={p.risk} withDot={false} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      <span dir="ltr" className="font-mono">{p.id}</span>
                      {" · "}
                      {hospitalName(p.hospitalId, hospitals)}
                    </p>
                  </div>
                  <select
                    aria-label={`تخصیص پزشک برای ${p.name}`}
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return
                      const doc = doctors.find((d) => d.id === e.target.value)
                      updatePatient(p.id, { assignedDoctorId: e.target.value })
                      toast(`${p.name} به ${doc?.name ?? "پزشک"} تخصیص یافت`)
                    }}
                    className={inputClass + " w-56"}
                  >
                    <option value="" disabled>
                      انتخاب پزشک…
                    </option>
                    {doctors
                      .filter((d) => d.role === "doctor")
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* افزودن پزشک */}
        <Card>
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <UserPlus className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">افزودن پزشک</h2>
          </div>
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
              <FormField label="نام کامل">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="لاله شاهچراغی"
                  className={inputClass}
                />
              </FormField>
              <FormField label="تخصص">
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="سونوگرافی زنان و بارداری"
                  className={inputClass}
                />
              </FormField>
              <FormField label="ایمیل">
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@fandogh.demo"
                  className={inputClass + " text-left"}
                />
              </FormField>
              <FormField label="رمز عبور">
                <input
                  type="text"
                  dir="ltr"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="رمز موقت"
                  className={inputClass + " text-left"}
                />
              </FormField>
              <FormField label="نقش">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                  {(["doctor", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        role === r
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {roleLabel(r)}
                    </button>
                  ))}
                </div>
              </FormField>
              {role === "doctor" && (
                <FormField label="بیمارستان">
                  <select
                    value={assignedHospital}
                    onChange={(e) => setAssignedHospital(e.target.value)}
                    className={inputClass}
                  >
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </FormField>
              )}
              <div className="flex items-end">
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  <UserPlus className="size-4" aria-hidden="true" />
                  افزودن پزشک
                </Button>
              </div>
              {error && (
                <p role="alert" className="sm:col-span-2 text-sm font-medium text-risk-high-foreground">
                  {error}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* فهرست پزشکان */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">پزشکان</h2>
            <p className="text-sm text-muted-foreground">
              {doctors.length} حساب دارای دسترسی
            </p>
          </div>
          <div className="divide-y divide-border">
            {doctors.map((d) => {
              const isSelf = d.id === currentUser?.id
              const patientCount = patients.filter((p) => p.assignedDoctorId === d.id).length
              return (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                    {initials(d.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{d.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          d.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {roleLabel(d.role)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {d.specialty} · <span dir="ltr">{d.email}</span>
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="size-3" aria-hidden="true" />
                      {d.role === "admin"
                        ? "دسترسی به همه بیمارستان‌ها"
                        : (d.hospitalIds ?? []).map((h) => hospitalName(h, hospitals)).join("، ") ||
                          "بدون بیمارستان"}
                      {d.role === "doctor" && ` · ${patientCount} بیمار`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(d.id, d.name)}
                    disabled={isSelf}
                    title={isSelf ? "امکان حذف حساب خودتان وجود ندارد" : "حذف پزشک"}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-risk-high hover:text-risk-high-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">حذف</span>
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}
