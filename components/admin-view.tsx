"use client"

import { useState } from "react"
import { Trash2, UserPlus } from "lucide-react"
import type { UserRole } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "./page-header"
import { useStore } from "./store"
import { useToast } from "./toast"

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AdminView() {
  const { doctors, currentUser, addDoctor, removeDoctor } = useStore()
  const toast = useToast()

  const [name, setName] = useState("")
  const [specialty, setSpecialty] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("doctor")
  const [error, setError] = useState("")

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmedEmail = email.trim().toLowerCase()
    if (!name.trim() || !specialty.trim() || !trimmedEmail || !password) {
      setError("All fields are required.")
      return
    }
    if (doctors.some((d) => d.email.toLowerCase() === trimmedEmail)) {
      setError("A doctor with that email already exists.")
      return
    }
    const displayName = /^dr\.?\s/i.test(name.trim()) ? name.trim() : `Dr. ${name.trim()}`
    addDoctor({
      name: displayName,
      specialty: specialty.trim(),
      email: trimmedEmail,
      password,
      role,
    })
    toast(`${displayName} added`)
    setName("")
    setSpecialty("")
    setEmail("")
    setPassword("")
    setRole("doctor")
    setError("")
  }

  function handleRemove(id: string, docName: string) {
    removeDoctor(id)
    toast(`${docName} removed`)
  }

  return (
    <div>
      <PageHeader
        title="Admin"
        subtitle="Manage clinicians who can access the workspace"
      />
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-6">
        {/* Add doctor */}
        <Card>
          <div className="flex items-center gap-2 border-b border-border px-5 py-3">
            <UserPlus className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">Add a doctor</h2>
          </div>
          <CardContent className="p-5">
            <form onSubmit={handleAdd} className="grid gap-4 sm:grid-cols-2">
              <FormField label="Full name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Amelia Chen"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Specialty">
                <input
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Obstetric Ultrasound"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chen@astraia.demo"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Password">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Temporary password"
                  className={inputClass}
                />
              </FormField>
              <FormField label="Role">
                <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                  {(["doctor", "admin"] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                        role === r
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </FormField>
              <div className="flex items-end">
                <Button type="submit" size="lg" className="w-full sm:w-auto">
                  <UserPlus className="size-4" aria-hidden="true" />
                  Add doctor
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

        {/* Doctor list */}
        <Card className="overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Clinicians</h2>
            <p className="text-sm text-muted-foreground">
              {doctors.length} {doctors.length === 1 ? "account" : "accounts"} with access
            </p>
          </div>
          <div className="divide-y divide-border">
            {doctors.map((d) => {
              const isSelf = d.id === currentUser?.id
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
                          "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                          d.role === "admin"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {d.role}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {d.specialty} · {d.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(d.id, d.name)}
                    disabled={isSelf}
                    title={isSelf ? "You cannot remove your own account" : "Remove doctor"}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:border-risk-high hover:text-risk-high-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-muted-foreground"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Remove</span>
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
