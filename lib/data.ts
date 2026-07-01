import type { BiometricKey, Doctor, Patient } from "./types"

/* -------------------------------------------------------------------------- */
/* Doctors / users                                                            */
/* -------------------------------------------------------------------------- */

// Demo-only accounts. Passwords are stored in plain text purely for this
// client-side demonstration and must never be used in a real application.
export const DOCTORS: Doctor[] = [
  {
    id: "D-001",
    name: "Dr. M. Reyes",
    specialty: "Maternal-Fetal Medicine",
    email: "admin@astraia.demo",
    password: "admin123",
    role: "admin",
  },
  {
    id: "D-002",
    name: "Dr. Amelia Chen",
    specialty: "Obstetric Ultrasound",
    email: "chen@astraia.demo",
    password: "doctor123",
    role: "doctor",
  },
  {
    id: "D-003",
    name: "Dr. Omar Haddad",
    specialty: "Fetal Cardiology",
    email: "haddad@astraia.demo",
    password: "doctor123",
    role: "doctor",
  },
  {
    id: "D-004",
    name: "Dr. Lena Novak",
    specialty: "High-Risk Obstetrics",
    email: "novak@astraia.demo",
    password: "doctor123",
    role: "doctor",
  },
]

/* -------------------------------------------------------------------------- */
/* Growth reference curves                                                    */
/* -------------------------------------------------------------------------- */

// Approximate median (p50) reference values by gestational week.
const REFERENCE: Record<BiometricKey, Record<number, number>> = {
  hc: { 12: 70, 16: 124, 20: 175, 24: 219, 28: 262, 32: 295, 36: 322, 40: 345 },
  ac: { 12: 56, 16: 105, 20: 152, 24: 197, 28: 241, 32: 285, 36: 322, 40: 352 },
  fl: { 12: 8, 16: 21, 20: 33, 24: 44, 28: 53, 32: 62, 36: 69, 40: 76 },
  efw: { 12: 14, 16: 100, 20: 300, 24: 600, 28: 1100, 32: 1700, 36: 2600, 40: 3400 },
}

export const BIOMETRIC_META: Record<
  BiometricKey,
  { label: string; short: string; unit: string }
> = {
  hc: { label: "Head circumference", short: "HC", unit: "mm" },
  ac: { label: "Abdominal circumference", short: "AC", unit: "mm" },
  fl: { label: "Femur length", short: "FL", unit: "mm" },
  efw: { label: "Estimated fetal weight", short: "EFW", unit: "g" },
}

function interp(map: Record<number, number>, week: number): number {
  const weeks = Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b)
  if (week <= weeks[0]) return map[weeks[0]]
  if (week >= weeks[weeks.length - 1]) return map[weeks[weeks.length - 1]]
  for (let i = 0; i < weeks.length - 1; i++) {
    const lo = weeks[i]
    const hi = weeks[i + 1]
    if (week >= lo && week <= hi) {
      const t = (week - lo) / (hi - lo)
      return map[lo] + t * (map[hi] - map[lo])
    }
  }
  return map[weeks[weeks.length - 1]]
}

export function referenceMedian(metric: BiometricKey, week: number): number {
  return Math.round(interp(REFERENCE[metric], week))
}

export interface CurvePoint {
  week: number
  p5: number
  p50: number
  p95: number
  measured?: number
}

/** Build a p5/p50/p95 curve across weeks 12-40 for a metric, plotting the
 * patient's measured value at their gestational week. */
export function buildGrowthCurve(
  metric: BiometricKey,
  measuredWeek: number,
  measuredValue: number,
): CurvePoint[] {
  const points: CurvePoint[] = []
  const spread = metric === "efw" ? 0.18 : 0.1
  for (let w = 12; w <= 40; w += 2) {
    const p50 = referenceMedian(metric, w)
    points.push({
      week: w,
      p5: Math.round(p50 * (1 - spread)),
      p50,
      p95: Math.round(p50 * (1 + spread)),
    })
  }
  // Insert the measured point at the exact gestational week.
  const existing = points.find((p) => p.week === measuredWeek)
  if (existing) {
    existing.measured = measuredValue
  } else {
    const p50 = referenceMedian(metric, measuredWeek)
    points.push({
      week: measuredWeek,
      p5: Math.round(p50 * (1 - spread)),
      p50,
      p95: Math.round(p50 * (1 + spread)),
      measured: measuredValue,
    })
    points.sort((a, b) => a.week - b.week)
  }
  return points
}

/* -------------------------------------------------------------------------- */
/* First-trimester risk module                                                */
/* -------------------------------------------------------------------------- */

export interface NtRiskResult {
  t21: number
  t18: number
  t13: number
  risk: "low" | "medium" | "high"
}

/** Simplified, non-clinical NT risk model for demonstration only. */
export function calculateNtRisk(ntMm: number, age: number): NtRiskResult {
  const ntFactor = Math.max(0, ntMm - 2.5)
  const ageFactor = Math.max(0, age - 30) * 0.04
  const base21 = 1 / (700 - age * 8)
  let t21 = base21 * (1 + ntFactor * 9 + ageFactor)
  let t18 = t21 * 0.32 * (1 + ntFactor * 1.4)
  let t13 = t21 * 0.18 * (1 + ntFactor * 1.2)

  t21 = Math.min(t21, 0.95)
  t18 = Math.min(t18, 0.9)
  t13 = Math.min(t13, 0.85)

  const worst = Math.max(t21, t18, t13)
  const risk = worst >= 1 / 50 ? "high" : worst >= 1 / 300 ? "medium" : "low"

  return { t21, t18, t13, risk }
}

export function formatRiskRatio(p: number): string {
  if (p <= 0) return "1 : >10000"
  const denom = Math.round(1 / p)
  return `1 : ${denom.toLocaleString("en-US")}`
}

/* -------------------------------------------------------------------------- */
/* Ultrasound image pool (one distinct image per gestational stage)           */
/* -------------------------------------------------------------------------- */

function scanFor(week: number): string {
  if (week <= 14) return "/ultrasounds/scan-12w.png"
  if (week <= 22) return "/ultrasounds/scan-20w.png"
  if (week <= 30) return "/ultrasounds/scan-28w.png"
  return "/ultrasounds/scan-34w.png"
}

/* -------------------------------------------------------------------------- */
/* Patients                                                                   */
/* -------------------------------------------------------------------------- */

export const PATIENTS: Patient[] = [
  {
    id: "P-10428",
    name: "Amara Okafor",
    age: 31,
    dueDate: "2026-09-14",
    gaWeeks: 28,
    gaDays: 3,
    risk: "low",
    nextAppointment: "2026-07-21",
    bloodType: "O+",
    gravida: 2,
    para: 1,
    visits: [
      {
        id: "P-10428-V1",
        number: 1,
        gaWeeks: 12,
        gaDays: 2,
        date: "2026-03-30",
        ultrasound: scanFor(12),
        biometrics: {
          hc: { value: 71, percentile: 52 },
          ac: { value: 57, percentile: 55 },
          fl: { value: 8, percentile: 50 },
          efw: { value: 15, percentile: 53 },
        },
        doppler: [
          { label: "Uterine artery PI", value: "1.42", status: "low" },
          { label: "Ductus venosus", value: "Normal a-wave", status: "low" },
        ],
        note: "First-trimester combined screening performed. Nuchal translucency within normal limits. Nasal bone present. Patient reports mild nausea, otherwise well.",
        conclusion: "Low-risk first-trimester screen. Continue routine antenatal care.",
        risk: "low",
        ntValue: 1.6,
      },
      {
        id: "P-10428-V2",
        number: 2,
        gaWeeks: 20,
        gaDays: 1,
        date: "2026-05-25",
        ultrasound: scanFor(20),
        biometrics: {
          hc: { value: 176, percentile: 51 },
          ac: { value: 150, percentile: 46 },
          fl: { value: 34, percentile: 58 },
          efw: { value: 312, percentile: 54 },
        },
        doppler: [
          { label: "Umbilical artery PI", value: "1.18", status: "low" },
          { label: "Uterine artery PI", value: "0.98", status: "low" },
        ],
        note: "Detailed anatomy survey completed. All structures visualised and appear normal. Placenta posterior, clear of os. Amniotic fluid normal.",
        conclusion: "Normal mid-trimester anatomy scan. No concerns.",
        risk: "low",
      },
      {
        id: "P-10428-V3",
        number: 3,
        gaWeeks: 28,
        gaDays: 3,
        date: "2026-07-20",
        ultrasound: scanFor(28),
        biometrics: {
          hc: { value: 263, percentile: 50 },
          ac: { value: 239, percentile: 47 },
          fl: { value: 53, percentile: 52 },
          efw: { value: 1120, percentile: 51 },
        },
        doppler: [
          { label: "Umbilical artery PI", value: "1.02", status: "low" },
          { label: "MCA PI", value: "1.85", status: "low" },
        ],
        note: "Growth tracking along the 50th centile. Fetal movements reported as normal. No signs of pre-eclampsia. BP 118/74.",
        conclusion: "Appropriately grown fetus, normal Dopplers. Routine follow-up in 6 weeks.",
        risk: "low",
      },
    ],
  },
  {
    id: "P-10591",
    name: "Sofia Marchetti",
    age: 38,
    dueDate: "2026-08-02",
    gaWeeks: 33,
    gaDays: 5,
    risk: "high",
    nextAppointment: "2026-07-08",
    bloodType: "A-",
    gravida: 3,
    para: 1,
    visits: [
      {
        id: "P-10591-V1",
        number: 1,
        gaWeeks: 12,
        gaDays: 4,
        date: "2026-02-16",
        ultrasound: scanFor(12),
        biometrics: {
          hc: { value: 73, percentile: 60 },
          ac: { value: 58, percentile: 58 },
          fl: { value: 9, percentile: 62 },
          efw: { value: 16, percentile: 60 },
        },
        doppler: [
          { label: "Uterine artery PI", value: "2.10", status: "medium" },
          { label: "Ductus venosus", value: "Normal a-wave", status: "low" },
        ],
        note: "Advanced maternal age (38). Increased nuchal translucency measured. Combined screening returned intermediate risk for trisomy 21. NIPT offered and accepted.",
        conclusion: "Intermediate first-trimester risk. Awaiting cfDNA results.",
        risk: "medium",
        ntValue: 3.1,
      },
      {
        id: "P-10591-V2",
        number: 2,
        gaWeeks: 22,
        gaDays: 0,
        date: "2026-04-27",
        ultrasound: scanFor(22),
        biometrics: {
          hc: { value: 196, percentile: 42 },
          ac: { value: 168, percentile: 38 },
          fl: { value: 37, percentile: 40 },
          efw: { value: 460, percentile: 41 },
        },
        doppler: [
          { label: "Uterine artery PI", value: "1.95", status: "medium" },
          { label: "Umbilical artery PI", value: "1.30", status: "low" },
        ],
        note: "Anatomy scan normal. Persistent bilateral uterine artery notching with elevated PI. Started on low-dose aspirin for pre-eclampsia prophylaxis.",
        conclusion: "Elevated uterine artery Dopplers — increased risk of pre-eclampsia / FGR. Serial growth surveillance arranged.",
        risk: "medium",
      },
      {
        id: "P-10591-V3",
        number: 3,
        gaWeeks: 28,
        gaDays: 2,
        date: "2026-06-08",
        ultrasound: scanFor(28),
        biometrics: {
          hc: { value: 248, percentile: 18 },
          ac: { value: 214, percentile: 9 },
          fl: { value: 49, percentile: 22 },
          efw: { value: 905, percentile: 11 },
        },
        doppler: [
          { label: "Umbilical artery PI", value: "1.62", status: "medium" },
          { label: "MCA PI", value: "1.40", status: "medium" },
        ],
        note: "Abdominal circumference falling below the 10th centile. Asymmetric growth restriction pattern. CPR borderline. Increased surveillance to twice weekly.",
        conclusion: "Early fetal growth restriction. Twice-weekly Doppler and growth in 2 weeks.",
        risk: "high",
      },
      {
        id: "P-10591-V4",
        number: 4,
        gaWeeks: 33,
        gaDays: 5,
        date: "2026-07-06",
        ultrasound: scanFor(34),
        biometrics: {
          hc: { value: 298, percentile: 14 },
          ac: { value: 262, percentile: 6 },
          fl: { value: 60, percentile: 19 },
          efw: { value: 1580, percentile: 7 },
        },
        doppler: [
          { label: "Umbilical artery PI", value: "1.88", status: "high" },
          { label: "MCA PI", value: "1.10", status: "high" },
          { label: "Cerebroplacental ratio", value: "0.59", status: "high" },
        ],
        note: "Progressive FGR with brain-sparing (low CPR). Abnormal umbilical and middle cerebral artery Dopplers. Discussed with MFM team. Plan for antenatal corticosteroids and admission for monitoring.",
        conclusion: "Severe early-onset FGR with abnormal Dopplers. Admit for steroids and consider delivery timing with MFM.",
        risk: "high",
      },
    ],
  },
  {
    id: "P-10733",
    name: "Priya Nair",
    age: 27,
    dueDate: "2026-10-30",
    gaWeeks: 18,
    gaDays: 2,
    risk: "low",
    nextAppointment: "2026-08-04",
    bloodType: "B+",
    gravida: 1,
    para: 0,
    visits: [
      {
        id: "P-10733-V1",
        number: 1,
        gaWeeks: 12,
        gaDays: 5,
        date: "2026-05-18",
        ultrasound: scanFor(12),
        biometrics: {
          hc: { value: 72, percentile: 55 },
          ac: { value: 58, percentile: 57 },
          fl: { value: 9, percentile: 61 },
          efw: { value: 16, percentile: 58 },
        },
        doppler: [{ label: "Ductus venosus", value: "Normal a-wave", status: "low" }],
        note: "First pregnancy. Dating confirmed. Nuchal translucency normal, nasal bone present. Reassured patient regarding low screening risk.",
        conclusion: "Low-risk first-trimester screen.",
        risk: "low",
        ntValue: 1.4,
      },
      {
        id: "P-10733-V2",
        number: 2,
        gaWeeks: 18,
        gaDays: 2,
        date: "2026-06-29",
        ultrasound: scanFor(20),
        biometrics: {
          hc: { value: 156, percentile: 56 },
          ac: { value: 132, percentile: 53 },
          fl: { value: 28, percentile: 59 },
          efw: { value: 240, percentile: 57 },
        },
        doppler: [{ label: "Umbilical artery PI", value: "1.22", status: "low" }],
        note: "Early growth scan ahead of anatomy survey. Fetus active, growth on track. Anatomy survey scheduled for 20 weeks.",
        conclusion: "Normal interval growth. Proceed to anatomy scan.",
        risk: "low",
      },
    ],
  },
  {
    id: "P-10866",
    name: "Hannah Bergström",
    age: 34,
    dueDate: "2026-07-19",
    gaWeeks: 35,
    gaDays: 1,
    risk: "medium",
    nextAppointment: "2026-07-09",
    bloodType: "AB+",
    gravida: 2,
    para: 0,
    visits: [
      {
        id: "P-10866-V1",
        number: 1,
        gaWeeks: 13,
        gaDays: 0,
        date: "2026-02-01",
        ultrasound: scanFor(12),
        biometrics: {
          hc: { value: 80, percentile: 64 },
          ac: { value: 66, percentile: 66 },
          fl: { value: 11, percentile: 65 },
          efw: { value: 23, percentile: 64 },
        },
        doppler: [{ label: "Uterine artery PI", value: "1.55", status: "low" }],
        note: "Screening normal. History of gestational diabetes in previous pregnancy noted. Early GTT arranged.",
        conclusion: "Low-risk screen. Monitor for recurrent GDM.",
        risk: "low",
        ntValue: 1.8,
      },
      {
        id: "P-10866-V2",
        number: 2,
        gaWeeks: 28,
        gaDays: 4,
        date: "2026-05-12",
        ultrasound: scanFor(28),
        biometrics: {
          hc: { value: 272, percentile: 72 },
          ac: { value: 258, percentile: 84 },
          fl: { value: 55, percentile: 66 },
          efw: { value: 1290, percentile: 78 },
        },
        doppler: [{ label: "Umbilical artery PI", value: "0.95", status: "low" }],
        note: "GTT confirmed gestational diabetes. AC trending toward the upper centiles. Commenced on metformin and dietary advice. Growth surveillance every 3-4 weeks.",
        conclusion: "GDM with AC on upper centiles. Monitor for macrosomia.",
        risk: "medium",
      },
      {
        id: "P-10866-V3",
        number: 3,
        gaWeeks: 35,
        gaDays: 1,
        date: "2026-07-07",
        ultrasound: scanFor(34),
        biometrics: {
          hc: { value: 320, percentile: 80 },
          ac: { value: 332, percentile: 92 },
          fl: { value: 70, percentile: 74 },
          efw: { value: 2740, percentile: 88 },
        },
        doppler: [{ label: "Umbilical artery PI", value: "0.88", status: "low" }],
        note: "EFW on the 88th centile with abdominal circumference > 90th. Polyhydramnios mild (DVP 7.8 cm). Glycaemic control reviewed with diabetes team.",
        conclusion: "Large-for-dates with mild polyhydramnios secondary to GDM. Plan growth scan in 2 weeks, discuss delivery timing.",
        risk: "medium",
      },
    ],
  },
  {
    id: "P-10977",
    name: "Leah Thompson",
    age: 29,
    dueDate: "2026-11-22",
    gaWeeks: 13,
    gaDays: 4,
    risk: "low",
    nextAppointment: "2026-08-19",
    bloodType: "O-",
    gravida: 1,
    para: 0,
    visits: [
      {
        id: "P-10977-V1",
        number: 1,
        gaWeeks: 13,
        gaDays: 4,
        date: "2026-06-28",
        ultrasound: scanFor(12),
        biometrics: {
          hc: { value: 82, percentile: 58 },
          ac: { value: 68, percentile: 60 },
          fl: { value: 12, percentile: 59 },
          efw: { value: 25, percentile: 57 },
        },
        doppler: [{ label: "Ductus venosus", value: "Normal a-wave", status: "low" }],
        note: "First-trimester combined screening. Crown-rump length consistent with dates. Nuchal translucency low. Patient is Rh-negative — anti-D plan documented.",
        conclusion: "Low-risk first-trimester screen. Rh-negative pathway initiated.",
        risk: "low",
        ntValue: 1.3,
      },
    ],
  },
  {
    id: "P-11042",
    name: "Yuki Tanaka",
    age: 41,
    dueDate: "2026-08-25",
    gaWeeks: 31,
    gaDays: 0,
    risk: "high",
    nextAppointment: "2026-07-10",
    bloodType: "A+",
    gravida: 4,
    para: 2,
    visits: [
      {
        id: "P-11042-V1",
        number: 1,
        gaWeeks: 12,
        gaDays: 1,
        date: "2026-03-09",
        ultrasound: scanFor(12),
        biometrics: {
          hc: { value: 70, percentile: 49 },
          ac: { value: 56, percentile: 48 },
          fl: { value: 8, percentile: 47 },
          efw: { value: 14, percentile: 48 },
        },
        doppler: [{ label: "Ductus venosus", value: "Reversed a-wave", status: "high" }],
        note: "Maternal age 41. Elevated nuchal translucency and reversed a-wave in ductus venosus. High combined risk for trisomy 21. Counselled regarding invasive testing.",
        conclusion: "High-risk first-trimester screen. CVS offered.",
        risk: "high",
        ntValue: 3.8,
      },
      {
        id: "P-11042-V2",
        number: 2,
        gaWeeks: 20,
        gaDays: 3,
        date: "2026-05-13",
        ultrasound: scanFor(20),
        biometrics: {
          hc: { value: 178, percentile: 53 },
          ac: { value: 154, percentile: 50 },
          fl: { value: 34, percentile: 55 },
          efw: { value: 322, percentile: 52 },
        },
        doppler: [{ label: "Umbilical artery PI", value: "1.15", status: "low" }],
        note: "CVS returned normal karyotype (46,XX). Anatomy survey normal. Patient greatly reassured. Continue routine surveillance given age.",
        conclusion: "Normal karyotype and anatomy. Risk downgraded; age-related surveillance only.",
        risk: "medium",
      },
      {
        id: "P-11042-V3",
        number: 3,
        gaWeeks: 31,
        gaDays: 0,
        date: "2026-07-09",
        ultrasound: scanFor(34),
        biometrics: {
          hc: { value: 290, percentile: 49 },
          ac: { value: 278, percentile: 51 },
          fl: { value: 59, percentile: 50 },
          efw: { value: 1640, percentile: 48 },
        },
        doppler: [
          { label: "Umbilical artery PI", value: "1.05", status: "low" },
          { label: "MCA PI", value: "1.78", status: "low" },
        ],
        note: "Growth appropriate, tracking the 50th centile. Normal Dopplers. Given advanced maternal age, planning induction discussion at 39 weeks.",
        conclusion: "Appropriately grown, reassuring Dopplers. Plan delivery discussion at term.",
        risk: "medium",
      },
    ],
  },
]

export function getPatient(id: string): Patient | undefined {
  return PATIENTS.find((p) => p.id === id)
}

export interface FlatVisit {
  patientId: string
  patientName: string
  visitId: string
  visitNumber: number
  date: string
  gaWeeks: number
  gaDays: number
  risk: Patient["risk"]
  conclusion: string
}

export function flatVisitsOf(patients: Patient[]): FlatVisit[] {
  return patients
    .flatMap((p) =>
      p.visits.map((v) => ({
        patientId: p.id,
        patientName: p.name,
        visitId: v.id,
        visitNumber: v.number,
        date: v.date,
        gaWeeks: v.gaWeeks,
        gaDays: v.gaDays,
        risk: v.risk,
        conclusion: v.conclusion,
      })),
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function allVisitsFlat(): FlatVisit[] {
  return PATIENTS.flatMap((p) =>
    p.visits.map((v) => ({
      patientId: p.id,
      patientName: p.name,
      visitId: v.id,
      visitNumber: v.number,
      date: v.date,
      gaWeeks: v.gaWeeks,
      gaDays: v.gaDays,
      risk: v.risk,
      conclusion: v.conclusion,
    })),
  ).sort((a, b) => (a.date < b.date ? 1 : -1))
}
