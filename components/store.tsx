"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { DOCTORS, HOSPITALS, PATIENTS } from "@/lib/data"
import type { Doctor, Hospital, Patient, RiskLevel, Visit } from "@/lib/types"

/* -------------------------------------------------------------------------- */
/* Persistence helpers                                                        */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = "fandogh-store-v3"
const SESSION_KEY = "fandogh-session-v3"

interface PersistShape {
  doctors: Doctor[]
  patients: Patient[]
  hospitals: Hospital[]
}

type Session =
  | { kind: "doctor"; id: string }
  | { kind: "patient"; id: string }
  | null

function loadPersisted(): PersistShape {
  if (typeof window === "undefined") {
    return { doctors: DOCTORS, patients: PATIENTS, hospitals: HOSPITALS }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as PersistShape
      if (parsed.doctors?.length && parsed.patients?.length) {
        return {
          doctors: parsed.doctors,
          patients: parsed.patients,
          hospitals: parsed.hospitals?.length ? parsed.hospitals : HOSPITALS,
        }
      }
    }
  } catch {
    // ignore malformed storage and fall back to seed data
  }
  return { doctors: DOCTORS, patients: PATIENTS, hospitals: HOSPITALS }
}

function loadSession(): Session {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw) as Session
  } catch {
    // ignore
  }
  return null
}

function persistSession(session: Session) {
  try {
    if (session) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } else {
      window.localStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // ignore
  }
}

/* -------------------------------------------------------------------------- */
/* Store context                                                              */
/* -------------------------------------------------------------------------- */

export interface NewVisitInput {
  gaWeeks: number
  gaDays: number
  date: string
  hospitalId: string
  diagnosis: string
  biometrics: Visit["biometrics"]
  doppler: Visit["doppler"]
  note: string
  conclusion: string
  risk: Visit["risk"]
}

export interface NewPatientInput {
  name: string
  age: number
  dueDate: string
  gaWeeks: number
  gaDays: number
  bloodType: string
  gravida: number
  para: number
  nextAppointment: string
  risk: RiskLevel
  hospitalId: string
  assignedDoctorId: string
}

export type SyncStatus = "idle" | "syncing" | "synced" | "error"

interface StoreValue {
  doctors: Doctor[]
  patients: Patient[]
  hospitals: Hospital[]
  /** Patients visible to the current user (all for admin, own for doctors). */
  visiblePatients: Patient[]
  currentUser: Doctor | null
  currentPatient: Patient | null
  ready: boolean
  loginDoctor: (email: string, password: string) => boolean
  loginPatient: (patientId: string) => boolean
  logout: () => void
  addDoctor: (input: Omit<Doctor, "id">) => void
  updateDoctor: (id: string, patch: Partial<Omit<Doctor, "id">>) => void
  removeDoctor: (id: string) => void
  addPatient: (input: NewPatientInput) => Patient
  updatePatient: (id: string, patch: Partial<Omit<Patient, "id" | "visits">>) => void
  removePatient: (id: string) => void
  addVisit: (patientId: string, input: NewVisitInput) => Visit | null
  updateVisitNote: (patientId: string, visitId: string, note: string) => void
  // آلارم/هشدارها
  showAlerts: boolean
  toggleAlerts: () => void
  // همگام‌سازی داده‌های بیرونی
  syncStatus: SyncStatus
  lastSynced: string | null
  syncNow: () => void
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

function nextPatientId(patients: Patient[]): string {
  const max = patients.reduce((m, p) => {
    const n = Number(p.id.replace(/\D/g, ""))
    return Number.isFinite(n) && n > m ? n : m
  }, 10000)
  return `P-${max + Math.floor(Math.random() * 90) + 11}`
}

// یک بیمار نمونه که گویی از سامانه بیمارستان دیگری دریافت شده است.
function makeSyncedPatient(patients: Patient[], hospitals: Hospital[]): Patient {
  const names = ["فاطمه کریمی", "سمیرا احمدی", "نرگس محمدی", "الهام رستمی", "شیرین قاسمی"]
  const name = names[Math.floor(Math.random() * names.length)]
  const hospital = hospitals[Math.floor(Math.random() * hospitals.length)]
  const risk: RiskLevel = Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low"
  const gaWeeks = 16 + Math.floor(Math.random() * 18)
  const id = nextPatientId(patients)
  return {
    id,
    name,
    age: 24 + Math.floor(Math.random() * 18),
    dueDate: "2026-11-01",
    gaWeeks,
    gaDays: Math.floor(Math.random() * 6),
    risk,
    nextAppointment: "2026-08-15",
    bloodType: ["O+", "A+", "B+", "AB+"][Math.floor(Math.random() * 4)],
    gravida: 1 + Math.floor(Math.random() * 3),
    para: Math.floor(Math.random() * 2),
    assignedDoctorId: "",
    hospitalId: hospital.id,
    visits: [
      {
        id: `${id}-V1`,
        number: 1,
        gaWeeks,
        gaDays: 0,
        date: "2026-06-01",
        ultrasound: scanFor(gaWeeks),
        biometrics: {
          hc: { value: 0, percentile: 50 },
          ac: { value: 0, percentile: 50 },
          fl: { value: 0, percentile: 50 },
          efw: { value: 0, percentile: 50 },
        },
        doppler: [],
        note: "پرونده از سامانه بیمارستان دیگر همگام‌سازی شد و نیازمند بازبینی است.",
        conclusion: "رکورد وارد‌شده از سیستم خارجی — لطفاً پزشک مسئول تعیین شود.",
        risk,
        hospitalId: hospital.id,
        diagnosis: "رکورد همگام‌سازی‌شده",
      },
    ],
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS)
  const [patients, setPatients] = useState<Patient[]>(PATIENTS)
  const [hospitals, setHospitals] = useState<Hospital[]>(HOSPITALS)
  const [session, setSession] = useState<Session>(null)
  const [ready, setReady] = useState(false)
  const [showAlerts, setShowAlerts] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle")
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const persisted = loadPersisted()
    setDoctors(persisted.doctors)
    setPatients(persisted.patients)
    setHospitals(persisted.hospitals)
    setSession(loadSession())
    setReady(true)
  }, [])

  // Persist whenever data changes (after hydration).
  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ doctors, patients, hospitals }),
      )
    } catch {
      // ignore quota errors
    }
  }, [doctors, patients, hospitals, ready])

  const currentUser = useMemo<Doctor | null>(
    () =>
      session?.kind === "doctor"
        ? doctors.find((d) => d.id === session.id) ?? null
        : null,
    [session, doctors],
  )

  const currentPatient = useMemo<Patient | null>(
    () =>
      session?.kind === "patient"
        ? patients.find((p) => p.id === session.id) ?? null
        : null,
    [session, patients],
  )

  const loginDoctor = useCallback(
    (email: string, password: string) => {
      const user = doctors.find(
        (d) =>
          d.email.toLowerCase() === email.trim().toLowerCase() &&
          d.password === password,
      )
      if (user) {
        const next: Session = { kind: "doctor", id: user.id }
        setSession(next)
        persistSession(next)
        return true
      }
      return false
    },
    [doctors],
  )

  const loginPatient = useCallback(
    (patientId: string) => {
      const patient = patients.find(
        (p) => p.id.toLowerCase() === patientId.trim().toLowerCase(),
      )
      if (patient) {
        const next: Session = { kind: "patient", id: patient.id }
        setSession(next)
        persistSession(next)
        return true
      }
      return false
    },
    [patients],
  )

  const logout = useCallback(() => {
    setSession(null)
    persistSession(null)
  }, [])

  const addDoctor = useCallback((input: Omit<Doctor, "id">) => {
    setDoctors((prev) => {
      const nextNum =
        prev.reduce((max, d) => {
          const n = Number(d.id.replace(/\D/g, ""))
          return Number.isFinite(n) && n > max ? n : max
        }, 0) + 1
      const id = `D-${String(nextNum).padStart(3, "0")}`
      return [...prev, { ...input, id }]
    })
  }, [])

  const updateDoctor = useCallback(
    (id: string, patch: Partial<Omit<Doctor, "id">>) => {
      setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)))
    },
    [],
  )

  const removeDoctor = useCallback((id: string) => {
    setDoctors((prev) => prev.filter((d) => d.id !== id))
    setSession((prev) =>
      prev?.kind === "doctor" && prev.id === id ? null : prev,
    )
  }, [])

  const addPatient = useCallback((input: NewPatientInput): Patient => {
    let created: Patient | null = null
    setPatients((prev) => {
      const id = nextPatientId(prev)
      const patient: Patient = {
        id,
        name: input.name,
        age: input.age,
        dueDate: input.dueDate,
        gaWeeks: input.gaWeeks,
        gaDays: input.gaDays,
        risk: input.risk,
        nextAppointment: input.nextAppointment,
        bloodType: input.bloodType,
        gravida: input.gravida,
        para: input.para,
        assignedDoctorId: input.assignedDoctorId,
        hospitalId: input.hospitalId,
        visits: [],
      }
      created = patient
      return [patient, ...prev]
    })
    return created as unknown as Patient
  }, [])

  const updatePatient = useCallback(
    (id: string, patch: Partial<Omit<Patient, "id" | "visits">>) => {
      setPatients((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    [],
  )

  const removePatient = useCallback((id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id))
    setSession((prev) =>
      prev?.kind === "patient" && prev.id === id ? null : prev,
    )
  }, [])

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
            hospitalId: input.hospitalId,
            diagnosis: input.diagnosis,
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

  const toggleAlerts = useCallback(() => setShowAlerts((v) => !v), [])

  const syncNow = useCallback(() => {
    setSyncStatus("syncing")
    // شبیه‌سازی فراخوانی سیستم خارجی
    setTimeout(() => {
      setPatients((prev) => [makeSyncedPatient(prev, hospitals), ...prev])
      setSyncStatus("synced")
      setLastSynced(new Date().toISOString())
    }, 1400)
  }, [hospitals])

  const visiblePatients = useMemo<Patient[]>(() => {
    if (!currentUser) return []
    if (currentUser.role === "admin") return patients
    return patients.filter((p) => p.assignedDoctorId === currentUser.id)
  }, [patients, currentUser])

  const value = useMemo<StoreValue>(
    () => ({
      doctors,
      patients,
      hospitals,
      visiblePatients,
      currentUser,
      currentPatient,
      ready,
      loginDoctor,
      loginPatient,
      logout,
      addDoctor,
      updateDoctor,
      removeDoctor,
      addPatient,
      updatePatient,
      removePatient,
      addVisit,
      updateVisitNote,
      showAlerts,
      toggleAlerts,
      syncStatus,
      lastSynced,
      syncNow,
    }),
    [
      doctors,
      patients,
      hospitals,
      visiblePatients,
      currentUser,
      currentPatient,
      ready,
      loginDoctor,
      loginPatient,
      logout,
      addDoctor,
      updateDoctor,
      removeDoctor,
      addPatient,
      updatePatient,
      removePatient,
      addVisit,
      updateVisitNote,
      showAlerts,
      toggleAlerts,
      syncStatus,
      lastSynced,
      syncNow,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
