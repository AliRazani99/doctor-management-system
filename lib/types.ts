export type RiskLevel = "low" | "medium" | "high"

export type BiometricKey = "hc" | "ac" | "fl" | "efw"

export interface Biometric {
  /** Measured value for this visit */
  value: number
  /** Percentile this measurement falls on against the standard curve */
  percentile: number
}

export interface DopplerFinding {
  label: string
  value: string
  status: RiskLevel
}

export interface Visit {
  id: string
  number: number
  /** Gestational age in weeks at time of visit */
  gaWeeks: number
  gaDays: number
  date: string
  ultrasound: string
  biometrics: Record<BiometricKey, Biometric>
  doppler: DopplerFinding[]
  note: string
  conclusion: string
  risk: RiskLevel
  /** Only present on the first-trimester visit */
  ntValue?: number
  /** Doctor who recorded this visit */
  doctorId?: string
  doctorName?: string
}

export type UserRole = "admin" | "doctor"

export interface Doctor {
  id: string
  name: string
  specialty: string
  email: string
  /** Demo-only credential stored client-side; not for production use. */
  password: string
  role: UserRole
}

export interface Patient {
  id: string
  name: string
  age: number
  dueDate: string
  gaWeeks: number
  gaDays: number
  risk: RiskLevel
  nextAppointment: string
  bloodType: string
  gravida: number
  para: number
  visits: Visit[]
}
