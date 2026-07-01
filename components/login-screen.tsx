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
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Astraia Fetal Medicine
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to access the clinical workspace
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
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
              placeholder="you@astraia.demo"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
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
              placeholder="••••••••"
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-risk-high-foreground">
              Invalid email or password.
            </p>
          )}

          <Button type="submit" size="lg" className="w-full">
            <LogIn className="size-4" aria-hidden="true" />
            Sign in
          </Button>
        </form>

        <div className="mt-6 rounded-lg border border-border bg-accent/40 p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1.5 font-semibold text-foreground">Demo accounts</p>
          <p>
            <span className="font-medium text-foreground">Admin:</span>{" "}
            admin@astraia.demo / admin123
          </p>
          <p>
            <span className="font-medium text-foreground">Doctor:</span>{" "}
            chen@astraia.demo / doctor123
          </p>
        </div>
      </div>
    </div>
  )
}
