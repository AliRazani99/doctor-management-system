"use client"

import { useState } from "react"
import { Activity, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "./store"

export function LoginScreen() {
  const { login } = useStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ok = login(email, password)
    setError(!ok)
  }

  return (
    <div
      dir="rtl"
      className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-6" aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              فندق
            </h1>
            <p className="text-sm text-muted-foreground">
              برای ورود به پنل مدیریت بیماران، اطلاعات حساب خود را وارد کنید
            </p>
          </div>
        </div>

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
                setError(false)
              }}
              placeholder="مثلاً admin@fandogh.demo"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-right text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
                setError(false)
              }}
              placeholder="رمز عبور خود را وارد کنید"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-right text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-risk-high-foreground">
              ایمیل یا رمز عبور وارد شده صحیح نیست.
            </p>
          )}

          <Button type="submit" size="lg" className="w-full gap-2">
            <LogIn className="size-4" aria-hidden="true" />
            ورود به سامانه
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-border bg-accent/40 p-4 text-right text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1.5 font-semibold text-foreground">حساب‌های آزمایشی</p>
          <p>
            <span className="font-medium text-foreground">مدیر:</span>{" "}
            admin@fandogh.demo / admin123
          </p>
          <p>
            <span className="font-medium text-foreground">پزشک:</span>{" "}
            doctor@fandogh.demo / doctor123
          </p>
        </div>
      </div>
    </div>
  )
}