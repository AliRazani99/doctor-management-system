// وضعیت ریسک به صورت کلید داخلی نگهداری می‌شود و برچسب فارسی جداگانه نمایش داده می‌شود.
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

/* -------------------------------------------------------------------------- */
/* بیمارستان‌ها                                                                */
/* -------------------------------------------------------------------------- */

export interface Hospital {
  id: string
  name: string
  city: string
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
  /** Hospital where this specific visit took place (may differ from where the patient was registered) */
  hospitalId?: string
  /** Clinical diagnosis recorded during the visit */
  diagnosis?: string
}

// نقش‌های دارای حساب و رمز عبور (مدیر/رئیس دپارتمان و پزشک)
export type UserRole = "admin" | "doctor"

// نقش‌هایی که در صفحه انتخاب نقش قابل انتخاب هستند
export type SelectableRole = "admin" | "doctor" | "patient"

export interface Doctor {
  id: string
  name: string
  specialty: string
  email: string
  /** Demo-only credential stored client-side; not for production use. */
  password: string
  role: UserRole
  /** Hospitals this clinician belongs to */
  hospitalIds: string[]
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
  /** Doctor currently responsible for this patient */
  assignedDoctorId: string
  /** Hospital where the patient was originally registered */
  hospitalId: string
  visits: Visit[]
}
