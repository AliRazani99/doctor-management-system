"use client"

import { useState } from "react"
import {
  Activity,
  ArrowRight,
  IdCard,
  LogIn,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react"
import type { SelectableRole } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useStore } from "./store"

const ROLE_CARDS: {
  id: SelectableRole
  title: string
  description: string
  icon: typeof Stethoscope
}[] = [
  {
    id: "doctor",
    title: "پزشک",
    description: "دسترسی به بیماران تحت مراقبت شما و ثبت ویزیت",
    icon: Stethoscope,
  },
  {
    id: "admin",
    title: "رئیس دپارتمان",
    description: "مدیریت پزشکان، بیماران و همگام‌سازی داده‌ها",
    icon: ShieldCheck,
  },
  {
    id: "patient",
    title: "بیمار",
    description: "مشاهده سوابق ویزیت و توصیه‌های پزشک",
    icon: UserRound,
  },
]

const ROLE_LABEL: Record<SelectableRole, string> = {
  doctor: "پزشک",
  admin: "رئیس دپارتمان",
  patient: "بیمار",
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
        <Activity className="size-6" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">فندق</h1>
        <p className="text-sm text-muted-foreground text-balance">{subtitle}</p>
      </div>
    </div>
  )
}

export function LoginScreen() {
  const [role, setRole] = useState<SelectableRole | null>(null)

  if (!role) {
    return <RoleSelection onSelect={setRole} />
  }

  if (role === "patient") {
    return <PatientLogin onBack={() => setRole(null)} />
  }

  return <StaffLogin role={role} onBack={() => setRole(null)} />
}

/* -------------------------------------------------------------------------- */
/* انتخاب نقش                                                                  */
/* -------------------------------------------------------------------------- */

function RoleSelection({ onSelect }: { onSelect: (role: SelectableRole) => void }) {
  return (
    <div
      dir="rtl"
      className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10"
    >
      <div className="w-full max-w-2xl">
        <Brand subtitle="سامانه یکپارچه مدیریت بیماران چند‌بیمارستانی" />

        <div className="mb-6 text-center">
          <h2 className="text-base font-semibold text-foreground">
            برای ورود، نقش خود را انتخاب کنید
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {ROLE_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelect(card.id)}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center outline-none transition-all hover:border-primary hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span className="text-base font-semibold text-foreground">
                  {card.title}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {card.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ورود کارکنان (پزشک / مدیر)                                                  */
/* -------------------------------------------------------------------------- */

function StaffLogin({
  role,
  onBack,
}: {
  role: "doctor" | "admin"
  onBack: () => void
}) {
  const { doctors, loginDoctor } = useStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const match = doctors.find(
      (d) =>
        d.email.toLowerCase() === email.trim().toLowerCase() &&
        d.password === password,
    )
    if (!match) {
      setError("ایمیل یا رمز عبور وارد شده صحیح نیست.")
      return
    }
    if (match.role !== role) {
      setError(
        role === "admin"
          ? "این حساب دسترسی مدیریت ندارد. لطفاً از درگاه پزشک وارد شوید."
          : "این حساب متعلق به مدیر است. لطفاً از درگاه رئیس دپارتمان وارد شوید.",
      )
      return
    }
    loginDoctor(email, password)
  }

  const isAdmin = role === "admin"

  return (
    <div
      dir="rtl"
      className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10"
    >
      <div className="w-full max-w-sm">
        <Brand
          subtitle={`ورود به درگاه ${ROLE_LABEL[role]} با ایمیل و رمز عبور`}
        />

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 text-right shadow-sm"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              ایمیل
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError("")
              }}
              placeholder="مثلاً admin@fandogh.demo"
              dir="ltr"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-left text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              رمز عبور
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError("")
              }}
              placeholder="رمز عبور خود را وارد کنید"
              dir="ltr"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-left text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-risk-high-foreground">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full gap-2">
            <LogIn className="size-4" aria-hidden="true" />
            ورود به سامانه
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-border bg-accent/40 p-4 text-right text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1.5 font-semibold text-foreground">حساب آزمایشی</p>
          {isAdmin ? (
            <p>
              <span className="font-medium text-foreground">مدیر:</span>{" "}
              admin@fandogh.demo / admin123
            </p>
          ) : (
            <p>
              <span className="font-medium text-foreground">پزشک:</span>{" "}
              chen@fandogh.demo / doctor123
            </p>
          )}
        </div>

        <BackButton onBack={onBack} />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* ورود بیمار (فقط با شناسه)                                                   */
/* -------------------------------------------------------------------------- */

function PatientLogin({ onBack }: { onBack: () => void }) {
  const { loginPatient } = useStore()
  const [patientId, setPatientId] = useState("")
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = loginPatient(patientId)
    setError(!ok)
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10"
    >
      <div className="w-full max-w-sm">
        <Brand subtitle="ورود بیمار با شناسه اختصاصی" />

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 text-right shadow-sm"
        >
          <div className="space-y-1.5">
            <label htmlFor="patientId" className="text-sm font-medium text-foreground">
              شناسه بیمار
            </label>
            <div className="relative">
              <IdCard
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="patientId"
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value)
                  setError(false)
                }}
                placeholder="مثلاً P-10428"
                dir="ltr"
                className="h-10 w-full rounded-lg border border-input bg-background py-2 pl-3 pr-9 text-left text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              شناسه هنگام ثبت‌نام توسط پزشک برای شما صادر می‌شود.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-risk-high-foreground">
              شناسه بیمار معتبری یافت نشد.
            </p>
          )}

          <Button type="submit" size="lg" className="w-full gap-2">
            <LogIn className="size-4" aria-hidden="true" />
            ورود به پرونده من
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-border bg-accent/40 p-4 text-right text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1.5 font-semibold text-foreground">شناسه آزمایشی</p>
          <p dir="ltr" className="text-right">
            P-10428 · P-10591 · P-10866
          </p>
        </div>

        <BackButton onBack={onBack} />
      </div>
    </div>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mt-4 flex w-full items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowRight className="size-4" aria-hidden="true" />
      بازگشت به انتخاب نقش
    </button>
  )
}
