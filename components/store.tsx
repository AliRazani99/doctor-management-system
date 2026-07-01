"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { DOCTORS, PATIENTS } from "@/lib/data"
import type { Doctor, Patient, Visit } from "@/lib/types"

/* -------------------------------------------------------------------------- */
/* Persistence helpers                                                        */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "astraia-store-v1"
const SESSION_KEY = "astraia-session-v1"

interface PersistShape {
  doctors: Doctor[]
  patients: Patient[]
}

function loadPersisted(): PersistShape {
  if (typeof window === "undefined") {
    return { doctors: DOCTORS, patients: PATIENTS }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistShape
      if (parsed.doctors?.length && parsed.patients?.length) {
        return parsed
      }
    }
  } catch {
    // ignore malformed storage and fall back to seed data
  }
  return { doctors: DOCTORS, patients: PATIENTS }
}

/* -------------------------------------------------------------------------- */
/* Store context                                                              */
/* -------------------------------------------------------------------------- */

export interface NewVisitInput {
  gaWeeks: number
  gaDays: number
  date: string
  biometrics: Visit["biometrics"]
  doppler: Visit["doppler"]
  note: string
  conclusion: string
  risk: Visit["risk"]
}

interface StoreValue {
  doctors: Doctor[]
  patients: Patient[]
  currentUser: Doctor | null
  ready: boolean
  login: (email: string, password: string) => boolean
  logout: () => void
  addDoctor: (input: Omit<Doctor, "id">) => void
  removeDoctor: (id: string) => void
  addVisit: (patientId: string, input: NewVisitInput) => Visit | null
  updateVisitNote: (patientId: string, visitId: string, note: string) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within a StoreProvider")
  return ctx
}

function scanFor(week: number): string {
  if (week <= 14) return "/ultrasounds/scan-12w.png"
  if (week <= 22) return "/ultrasounds/scan-20w.png"
  if (week <= 30) return "/ultrasounds/scan-28w.png"
  return "/ultrasounds/scan-34w.png"
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS)
  const [patients, setPatients] = useState<Patient[]>(PATIENTS)
  const [currentUser, setCurrentUser] = useState<Doctor | null>(null)
  const [ready, setReady] = useState(false)

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const persisted = loadPersisted()
    setDoctors(persisted.doctors)
    setPatients(persisted.patients)
    try {
      const sessionId = window.localStorage.getItem(SESSION_KEY)
      if (sessionId) {
        const user = persisted.doctors.find((d) => d.id === sessionId) ?? null
        setCurrentUser(user)
      }
    } catch {
      // ignore
    }
    setReady(true)
  }, [])

  // Persist whenever data changes (after hydration).
  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ doctors, patients }),
      )
    } catch {
      // ignore quota errors
    }
  }, [doctors, patients, ready])

  const login = useCallback(
    (email: string, password: string) => {
      const user = doctors.find(
        (d) =>
          d.email.toLowerCase() === email.trim().toLowerCase() &&
          d.password === password,
      )
      if (user) {
        setCurrentUser(user)
        try {
          window.localStorage.setItem(SESSION_KEY, user.id)
        } catch {
          // ignore
        }
        return true
      }
      return false
    },
    [doctors],
  )

  const logout = useCallback(() => {
    setCurrentUser(null)
    try {
      window.localStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  }, [])

  const addDoctor = useCallback((input: Omit<Doctor, "id">) => {
    setDoctors((prev) => {
      const nextNum = prev.reduce((max, d) => {
        const n = Number(d.id.replace(/\D/g, ""))
        return Number.isFinite(n) && n > max ? n : max
      }, 0) + 1
      const id = `D-${String(nextNum).padStart(3, "0")}`
      return [...prev, { ...input, id }]
    })
  }, [])

  const removeDoctor = useCallback(
    (id: string) => {
      setDoctors((prev) => prev.filter((d) => d.id !== id))
      // Clear the session if a logged-in user removed their own account.
      setCurrentUser((prev) => (prev?.id === id ? null : prev))
    },
    [],
  )

  const addVisit = useCallback(
    (patientId: string, input: NewVisitInput): Visit | null => {
      let created: Visit | null = null
      setPatients((prev) =>
        prev.map((p) => {
          if (p.id !== patientId) return p
          const number = p.visits.length + 1
          const visit: Visit = {
            id: `${p.id}-V${number}`,
            number,
            gaWeeks: input.gaWeeks,
            gaDays: input.gaDays,
            date: input.date,
            ultrasound: scanFor(input.gaWeeks),
            biometrics: input.biometrics,
            doppler: input.doppler,
            note: input.note,
            conclusion: input.conclusion,
            risk: input.risk,
            doctorId: currentUser?.id,
            doctorName: currentUser?.name,
          }
          created = visit
          return {
            ...p,
            risk: input.risk,
            gaWeeks: input.gaWeeks,
            gaDays: input.gaDays,
            visits: [...p.visits, visit],
          }
        }),
      )
      return created
    },
    [currentUser],
  )

  const updateVisitNote = useCallback(
    (patientId: string, visitId: string, note: string) => {
      setPatients((prev) =>
        prev.map((p) =>
          p.id !== patientId
            ? p
            : {
                ...p,
                visits: p.visits.map((v) =>
                  v.id === visitId ? { ...v, note } : v,
                ),
              },
        ),
      )
    },
    [],
  )

  const value = useMemo<StoreValue>(
    () => ({
      doctors,
      patients,
      currentUser,
      ready,
      login,
      logout,
      addDoctor,
      removeDoctor,
      addVisit,
      updateVisitNote,
    }),
    [
      doctors,
      patients,
      currentUser,
      ready,
      login,
      logout,
      addDoctor,
      removeDoctor,
      addVisit,
      updateVisitNote,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
