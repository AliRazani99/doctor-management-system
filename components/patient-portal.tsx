"use client"

import {
  Activity,
  Building2,
  CalendarClock,
  FileText,
  LogOut,
  Stethoscope,
} from "lucide-react"
import { doctorName, hospitalName } from "@/lib/data"
import { formatDate, ga, toFaNumber } from "@/lib/format"
import { Card, CardContent } from "@/components/ui/card"
import { RiskBadge } from "./risk-badge"
import { useStore } from "./store"

const RISK_LABEL: Record<string, string> = {
  low: "کم‌خطر",
  medium: "ریسک متوسط",
  high: "پرخطر",
}

const RISK_MESSAGE: Record<string, string> = {
  low: "وضعیت شما پایدار است. مراقبت‌های معمول بارداری را ادامه دهید.",
  medium: "وضعیت شما نیازمند پایش دقیق‌تر است. لطفاً نوبت‌های خود را جدی بگیرید.",
  high: "وضعیت شما پرخطر ارزیابی شده است. حتماً طبق توصیه پزشک پیگیری کنید.",
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export function PatientPortal() {
  const { currentPatient, doctors, hospitals, logout } = useStore()

  if (!currentPatient) return null

  const p = currentPatient
  const visits = [...p.visits].sort((a, b) => (a.date < b.date ? 1 : -1))
  const latest = visits[0]

  return (
    <div dir="rtl" className="min-h-dvh bg-muted/40">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Activity className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-foreground">
                درگاه بیمار — فندق
              </h1>
              <p className="text-xs text-muted-foreground">
                مشاهده سوابق و توصیه‌های پزشک
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-6 py-6">
        {/* کارت مشخصات و وضعیت ریسک */}
        <Card>
          <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-base font-semibold text-secondary-foreground">
                {initials(p.name)}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-foreground">{p.name}</h2>
                <p dir="ltr" className="text-right font-mono text-sm text-muted-foreground">
                  {p.id}
                </p>
              </div>
            </div>
            <RiskBadge level={p.risk} label={`وضعیت کلی: ${RISK_LABEL[p.risk]}`} />
          </CardContent>
        </Card>

        {/* پیام وضعیت */}
        <div className="rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
          {RISK_MESSAGE[p.risk]}
        </div>

        {/* خلاصه اطلاعات */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <InfoCard
            icon={CalendarClock}
            label="سن بارداری"
            value={ga(p.gaWeeks, p.gaDays)}
          />
          <InfoCard
            icon={CalendarClock}
            label="نوبت بعدی"
            value={formatDate(p.nextAppointment)}
          />
          <InfoCard
            icon={Stethoscope}
            label="پزشک مسئول"
            value={doctorName(p.assignedDoctorId, doctors)}
          />
          <InfoCard
            icon={Building2}
            label="بیمارستان ثبت‌نام"
            value={hospitalName(p.hospitalId, hospitals)}
          />
        </div>

        {/* تاریخچه ویزیت‌ها */}
        <section>
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            تاریخچه ویزیت‌ها و توصیه‌ها
          </h3>

          {visits.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              هنوز ویزیتی برای شما ثبت نشده است.
            </div>
          ) : (
            <ol className="space-y-4">
              {visits.map((v) => (
                <li key={v.id}>
                  <Card>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-foreground">
                          ویزیت {toFaNumber(v.number)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(v.date)} · {ga(v.gaWeeks, v.gaDays)}
                        </span>
                      </div>
                      <RiskBadge level={v.risk} label={RISK_LABEL[v.risk]} />
                    </div>

                    <CardContent className="space-y-4 p-5">
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Building2 className="size-4" aria-hidden="true" />
                          {hospitalName(v.hospitalId ?? p.hospitalId, hospitals)}
                        </span>
                        {v.doctorName && (
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Stethoscope className="size-4" aria-hidden="true" />
                            {v.doctorName}
                          </span>
                        )}
                      </div>

                      {v.diagnosis && (
                        <div>
                          <p className="text-xs text-muted-foreground">تشخیص</p>
                          <p className="text-sm font-medium text-foreground">
                            {v.diagnosis}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <FileText className="size-3.5" aria-hidden="true" />
                          توصیه و جمع‌بندی پزشک
                        </p>
                        <p className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed text-foreground">
                          {v.conclusion}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          )}
        </section>

        {latest && (
          <p className="pb-4 text-center text-xs text-muted-foreground">
            آخرین به‌روزرسانی پرونده: {formatDate(latest.date)}
          </p>
        )}
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
