"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "./toast"
import { PageHeader } from "./page-header"

function Toggle({
  label,
  description,
  defaultOn = false,
}: {
  label: string
  description: string
  defaultOn?: boolean
}) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-input",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-card shadow-sm transition-transform",
            on ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  )
}

export function SettingsView() {
  const toast = useToast()

  return (
    <div>
      <PageHeader title="Settings" subtitle="Clinic profile and application preferences" />
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Clinic profile</h2>
          </div>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Clinic name" value="Astraia Fetal Medicine Centre" />
            <Field label="Lead clinician" value="Dr. M. Reyes" />
            <Field label="Department" value="Maternal-Fetal Medicine" />
            <Field label="Timezone" value="GMT+01:00 (CET)" />
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Preferences</h2>
          </div>
          <CardContent className="divide-y divide-border p-5 py-1">
            <Toggle
              label="High-risk alerts"
              description="Notify me when a visit is flagged high risk"
              defaultOn
            />
            <Toggle
              label="Growth curve overlays"
              description="Show 5th/50th/95th centiles on all charts"
              defaultOn
            />
            <Toggle
              label="Auto-draft notes"
              description="Pre-fill visit notes from previous findings"
            />
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">Reference standard</h2>
          </div>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Biometric measurements are compared against the selected fetal growth
              reference. This is a demonstration build and is not for clinical use.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <Field label="Active reference" value="INTERGROWTH-21st (demo)" />
              <Button size="lg" onClick={() => toast("Preferences saved")}>
                Save changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}
