"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { BIOMETRIC_META, referenceMedian } from "@/lib/data"
import type { BiometricKey, RiskLevel, Visit } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useStore, type NewVisitInput } from "./store"
import { useToast } from "./toast"

const METRIC_ORDER: BiometricKey[] = ["hc", "ac", "fl", "efw"]
const RISKS: RiskLevel[] = ["low", "medium", "high"]

/** Rough percentile estimate of a measured value vs the reference median. */
function estimatePercentile(measured: number, median: number): number {
  if (median <= 0) return 50
  const ratio = measured / median
  // Map a +/-20% band around the median onto ~5th..95th centiles.
  const pct = 50 + (ratio - 1) * 250
  return Math.max(1, Math.min(99, Math.round(pct)))
}

export function NewVisitDialog({
  patientId,
  onClose,
  onCreated,
}: {
  patientId: string
  onClose: () => void
  onCreated: (visit: Visit) => void
}) {
  const { addVisit, currentUser } = useStore()
  const toast = useToast()

  const today = new Date().toISOString().slice(0, 10)
  const [gaWeeks, setGaWeeks] = useState("28")
  const [gaDays, setGaDays] = useState("0")
  const [date, setDate] = useState(today)
  const [values, setValues] = useState<Record<BiometricKey, string>>({
    hc: "",
    ac: "",
    fl: "",
    efw: "",
  })
  const [dopplerLabel, setDopplerLabel] = useState("Umbilical artery PI")
  const [dopplerValue, setDopplerValue] = useState("")
  const [dopplerStatus, setDopplerStatus] = useState<RiskLevel>("low")
  const [note, setNote] = useState("")
  const [conclusion, setConclusion] = useState("")
  const [risk, setRisk] = useState<RiskLevel>("low")
  const [error, setError] = useState("")

  const week = Number(gaWeeks) || 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date) {
      setError("Please choose a visit date.")
      return
    }
    if (METRIC_ORDER.some((k) => !values[k])) {
      setError("Please enter all four biometric measurements.")
      return
    }
    if (!note.trim() || !conclusion.trim()) {
      setError("Note and conclusion are required.")
      return
    }

    const biometrics = METRIC_ORDER.reduce((acc, key) => {
      const value = Number(values[key])
      const median = referenceMedian(key, week)
      acc[key] = { value, percentile: estimatePercentile(value, median) }
      return acc
    }, {} as Visit["biometrics"])

    const doppler = dopplerValue.trim()
      ? [{ label: dopplerLabel.trim(), value: dopplerValue.trim(), status: dopplerStatus }]
      : []

    const input: NewVisitInput = {
      gaWeeks: week,
      gaDays: Number(gaDays) || 0,
      date,
      biometrics,
      doppler,
      note: note.trim(),
      conclusion: conclusion.trim(),
      risk,
    }

    const created = addVisit(patientId, input)
    if (created) {
      toast(`Visit ${created.number} recorded`)
      onCreated(created)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-visit-title"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id="new-visit-title" className="text-base font-semibold text-foreground">
              New visit
            </h2>
            <p className="text-sm text-muted-foreground">
              Recording as {currentUser?.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {/* Gestation + date */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="GA weeks">
              <input
                type="number"
                min={4}
                max={42}
                value={gaWeeks}
                onChange={(e) => setGaWeeks(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="GA days">
              <input
                type="number"
                min={0}
                max={6}
                value={gaDays}
                onChange={(e) => setGaDays(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Visit date">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          {/* Biometrics */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Biometrics</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {METRIC_ORDER.map((key) => {
                const meta = BIOMETRIC_META[key]
                const median = week ? referenceMedian(key, week) : 0
                return (
                  <Field key={key} label={`${meta.short} (${meta.unit})`}>
                    <input
                      type="number"
                      step="0.1"
                      value={values[key]}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      placeholder={median ? `≈ ${median} median` : meta.label}
                      className={inputClass}
                    />
                  </Field>
                )
              })}
            </div>
          </div>

          {/* Doppler (optional single finding) */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Doppler finding{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Label">
                <input
                  value={dopplerLabel}
                  onChange={(e) => setDopplerLabel(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Value">
                <input
                  value={dopplerValue}
                  onChange={(e) => setDopplerValue(e.target.value)}
                  placeholder="e.g. 1.12"
                  className={inputClass}
                />
              </Field>
              <Field label="Status">
                <RiskPicker value={dopplerStatus} onChange={setDopplerStatus} />
              </Field>
            </div>
          </div>

          {/* Note */}
          <Field label="Doctor's note">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Clinical observations for this visit…"
              className={cn(inputClass, "h-auto resize-y py-2 leading-relaxed")}
            />
          </Field>

          {/* Conclusion */}
          <Field label="Conclusion">
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              rows={2}
              placeholder="Summary and plan…"
              className={cn(inputClass, "h-auto resize-y py-2 leading-relaxed")}
            />
          </Field>

          {/* Overall risk */}
          <Field label="Overall risk for this visit">
            <RiskPicker value={risk} onChange={setRisk} />
          </Field>

          {error && (
            <p role="alert" className="text-sm font-medium text-risk-high-foreground">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" size="lg" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="lg">
              Save visit
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  )
}

function RiskPicker({
  value,
  onChange,
}: {
  value: RiskLevel
  onChange: (r: RiskLevel) => void
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {RISKS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange(r)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
            value === r
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  )
}
