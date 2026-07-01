import type { BiometricKey, Doctor, Patient } from "./types"

/* -------------------------------------------------------------------------- */
/* پزشکان / کاربران                                                           */
/* -------------------------------------------------------------------------- */

// حساب‌های نمایشی. رمزها فقط برای نسخه دمو به صورت ساده ذخیره شده‌اند
// و در پروژه واقعی نباید به این شکل استفاده شوند.
export const DOCTORS: Doctor[] = [
  {
    id: "D-001",
    name: "دکتر محمد علایی",
    specialty: "زنان و زایمان",
    email: "admin@fandogh.demo",
    password: "admin123",
    role: "admin",
  },
  {
    id: "D-002",
    name: "دکتر هومان شاهچراغی",
    specialty: "سونوگرافی زنان و بارداری",
    email: "chen@fandogh.demo",
    password: "doctor123",
    role: "doctor",
  },
  {
    id: "D-003",
    name: "دکتر صادقی",
    specialty: "قلب جنین",
    email: "haddad@fandogh.demo",
    password: "doctor123",
    role: "doctor",
  },
  {
    id: "D-004",
    name: "دکتر نوری",
    specialty: "بارداری پرخطر",
    email: "novak@fandogh.demo",
    password: "doctor123",
    role: "doctor",
  },
]

/* -------------------------------------------------------------------------- */
/* منحنی‌های مرجع رشد                                                         */
/* -------------------------------------------------------------------------- */

// مقادیر تقریبی میانه p50 بر اساس هفته بارداری
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
  hc: { label: "دور سر جنین", short: "HC", unit: "میلی‌متر" },
  ac: { label: "دور شکم جنین", short: "AC", unit: "میلی‌متر" },
  fl: { label: "طول استخوان ران", short: "FL", unit: "میلی‌متر" },
  efw: { label: "وزن تخمینی جنین", short: "EFW", unit: "گرم" },
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

// ساخت نقاط منحنی p5 / p50 / p95 برای هفته‌های ۱۲ تا ۴۰
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
/* ماژول ریسک سه‌ماهه اول بارداری                                             */
/* -------------------------------------------------------------------------- */

export interface NtRiskResult {
  t21: number
  t18: number
  t13: number
  risk: "low" | "medium" | "high"
}

// مدل ساده‌شده و غیرتشخیصی برای نسخه نمایشی
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
  if (p <= 0) return "کمتر از ۱ در ۱۰٬۰۰۰"

  const denom = Math.round(1 / p)

  return `۱ در ${denom.toLocaleString("fa-IR")}`
}

/* -------------------------------------------------------------------------- */
/* تصاویر سونوگرافی                                                           */
/* -------------------------------------------------------------------------- */

function scanFor(week: number): string {
  if (week <= 14) return "/ultrasounds/scan-12w.png"
  if (week <= 22) return "/ultrasounds/scan-20w.png"
  if (week <= 30) return "/ultrasounds/scan-28w.png"

  return "/ultrasounds/scan-34w.png"
}

/* -------------------------------------------------------------------------- */
/* بیماران                                                                     */
/* -------------------------------------------------------------------------- */

export const PATIENTS: Patient[] = [
  {
    id: "P-10428",
    name: "زهره عظیمی فر",
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
          { label: "شاخص PI شریان رحمی", value: "1.42", status: "low" },
          { label: "داکتوس ونوسوس", value: "موج a طبیعی", status: "low" },
        ],
        note:
          "غربالگری ترکیبی سه‌ماهه اول انجام شد. ضخامت NT در محدوده طبیعی است. استخوان بینی دیده شد. بیمار تهوع خفیف دارد و در سایر موارد وضعیت عمومی مناسب است.",
        conclusion:
          "غربالگری سه‌ماهه اول کم‌خطر است. ادامه مراقبت معمول بارداری توصیه می‌شود.",
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
          { label: "شاخص PI شریان بند ناف", value: "1.18", status: "low" },
          { label: "شاخص PI شریان رحمی", value: "0.98", status: "low" },
        ],
        note:
          "بررسی کامل آناتومی انجام شد. ساختارهای قابل مشاهده طبیعی هستند. جفت در موقعیت خلفی قرار دارد و از دهانه رحم فاصله مناسب دارد. مایع آمنیوتیک طبیعی است.",
        conclusion:
          "اسکن آناتومی میانه بارداری طبیعی است و نگرانی خاصی مشاهده نشد.",
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
          { label: "شاخص PI شریان بند ناف", value: "1.02", status: "low" },
          { label: "شاخص PI شریان مغزی میانی", value: "1.85", status: "low" },
        ],
        note:
          "رشد جنین در حدود صدک ۵۰ دنبال می‌شود. حرکات جنین طبق گزارش بیمار طبیعی است. علامتی به نفع پره‌اکلامپسی مشاهده نشد. فشار خون 118/74 ثبت شد.",
        conclusion:
          "رشد جنین مناسب است و داپلرها طبیعی هستند. پیگیری معمول طی ۶ هفته آینده انجام شود.",
        risk: "low",
      },
    ],
  },
  {
    id: "P-10591",
    name: "حمیرا وفایی",
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
          { label: "شاخص PI شریان رحمی", value: "2.10", status: "medium" },
          { label: "داکتوس ونوسوس", value: "موج a طبیعی", status: "low" },
        ],
        note:
          "سن مادر ۳۸ سال است. ضخامت NT افزایش‌یافته اندازه‌گیری شد. غربالگری ترکیبی، ریسک متوسط برای تریزومی ۲۱ نشان داد. تست NIPT پیشنهاد و توسط بیمار پذیرفته شد.",
        conclusion:
          "ریسک سه‌ماهه اول در محدوده متوسط است. نتیجه cfDNA در انتظار بررسی است.",
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
          { label: "شاخص PI شریان رحمی", value: "1.95", status: "medium" },
          { label: "شاخص PI شریان بند ناف", value: "1.30", status: "low" },
        ],
        note:
          "اسکن آناتومی طبیعی است. ناچ دوطرفه شریان رحمی همراه با PI بالا همچنان دیده می‌شود. آسپرین با دوز پایین برای پیشگیری از پره‌اکلامپسی شروع شد.",
        conclusion:
          "داپلر شریان رحمی افزایش‌یافته است و ریسک پره‌اکلامپسی یا محدودیت رشد جنین بیشتر است. پایش سریالی رشد برنامه‌ریزی شد.",
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
          { label: "شاخص PI شریان بند ناف", value: "1.62", status: "medium" },
          { label: "شاخص PI شریان مغزی میانی", value: "1.40", status: "medium" },
        ],
        note:
          "دور شکم جنین به زیر صدک ۱۰ کاهش یافته است. الگوی محدودیت رشد نامتقارن دیده می‌شود. نسبت CPR در محدوده مرزی است. پایش بیمار به دو بار در هفته افزایش یافت.",
        conclusion:
          "محدودیت رشد زودرس جنین مطرح است. داپلر دو بار در هفته و بررسی رشد طی ۲ هفته آینده انجام شود.",
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
          { label: "شاخص PI شریان بند ناف", value: "1.88", status: "high" },
          { label: "شاخص PI شریان مغزی میانی", value: "1.10", status: "high" },
          { label: "نسبت مغزی-جفتی", value: "0.59", status: "high" },
        ],
        note:
          "محدودیت رشد جنین پیش‌رونده است و الگوی brain-sparing دیده می‌شود. داپلر شریان بند ناف و شریان مغزی میانی غیرطبیعی است. بیمار با تیم طب مادر و جنین مطرح شد. بستری برای پایش و دریافت کورتیکواستروئید پیش از زایمان برنامه‌ریزی شد.",
        conclusion:
          "محدودیت رشد شدید و زودرس جنین همراه با داپلر غیرطبیعی وجود دارد. بستری، دریافت استروئید و تصمیم‌گیری درباره زمان زایمان با تیم تخصصی انجام شود.",
        risk: "high",
      },
    ],
  },
  {
    id: "P-10733",
    name: "زهرا سیدی",
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
        doppler: [{ label: "داکتوس ونوسوس", value: "موج a طبیعی", status: "low" }],
        note:
          "بارداری اول بیمار است. سن بارداری تأیید شد. ضخامت NT طبیعی است و استخوان بینی دیده شد. درباره ریسک پایین غربالگری به بیمار توضیح داده شد.",
        conclusion: "غربالگری سه‌ماهه اول کم‌خطر است.",
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
        doppler: [{ label: "شاخص PI شریان بند ناف", value: "1.22", status: "low" }],
        note:
          "اسکن رشد زودتر از بررسی کامل آناتومی انجام شد. جنین فعال است و رشد در مسیر مناسب قرار دارد. اسکن آناتومی برای هفته ۲۰ برنامه‌ریزی شده است.",
        conclusion:
          "رشد فاصله‌ای طبیعی است. اسکن آناتومی طبق برنامه انجام شود.",
        risk: "low",
      },
    ],
  },
  {
    id: "P-10866",
    name: "مونا صاحبی",
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
        doppler: [{ label: "شاخص PI شریان رحمی", value: "1.55", status: "low" }],
        note:
          "غربالگری طبیعی است. سابقه دیابت بارداری در بارداری قبلی ذکر شد. تست تحمل گلوکز زودهنگام برنامه‌ریزی شد.",
        conclusion:
          "غربالگری کم‌خطر است. از نظر عود دیابت بارداری پایش شود.",
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
        doppler: [{ label: "شاخص PI شریان بند ناف", value: "0.95", status: "low" }],
        note:
          "تست تحمل گلوکز، دیابت بارداری را تأیید کرد. دور شکم جنین به سمت صدک‌های بالاتر در حال حرکت است. متفورمین و توصیه‌های تغذیه‌ای شروع شد. پایش رشد هر ۳ تا ۴ هفته انجام شود.",
        conclusion:
          "دیابت بارداری همراه با دور شکم در صدک‌های بالا وجود دارد. از نظر ماکروزومی پایش شود.",
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
        doppler: [{ label: "شاخص PI شریان بند ناف", value: "0.88", status: "low" }],
        note:
          "وزن تخمینی جنین در صدک ۸۸ و دور شکم بالاتر از صدک ۹۰ است. پلی‌هیدرآمنیوس خفیف مشاهده شد. کنترل قند خون با تیم دیابت بررسی شد.",
        conclusion:
          "جنین درشت‌تر از سن بارداری همراه با پلی‌هیدرآمنیوس خفیف، احتمالاً مرتبط با دیابت بارداری است. اسکن رشد طی ۲ هفته آینده و بررسی زمان زایمان توصیه می‌شود.",
        risk: "medium",
      },
    ],
  },
  {
    id: "P-10977",
    name: "مهدیه طاهری",
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
        doppler: [{ label: "داکتوس ونوسوس", value: "موج a طبیعی", status: "low" }],
        note:
          "غربالگری ترکیبی سه‌ماهه اول انجام شد. طول سری-نشیمنگاهی با سن بارداری هماهنگ است. ضخامت NT پایین است. بیمار Rh منفی است و مسیر دریافت آنتی-D ثبت شد.",
        conclusion:
          "غربالگری سه‌ماهه اول کم‌خطر است. مسیر مراقبت Rh منفی آغاز شد.",
        risk: "low",
        ntValue: 1.3,
      },
    ],
  },
  {
    id: "P-11042",
    name: "هما رضایی",
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
        doppler: [{ label: "داکتوس ونوسوس", value: "موج a معکوس", status: "high" }],
        note:
          "سن مادر ۴۱ سال است. ضخامت NT افزایش‌یافته و موج a معکوس در داکتوس ونوسوس مشاهده شد. ریسک ترکیبی برای تریزومی ۲۱ بالا گزارش شد. درباره تست تهاجمی با بیمار مشاوره شد.",
        conclusion:
          "غربالگری سه‌ماهه اول پرخطر است. نمونه‌برداری CVS به بیمار پیشنهاد شد.",
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
        doppler: [{ label: "شاخص PI شریان بند ناف", value: "1.15", status: "low" }],
        note:
          "نتیجه CVS کاریوتایپ طبیعی 46,XX را نشان داد. اسکن آناتومی طبیعی بود و بیمار اطمینان خاطر پیدا کرد. با توجه به سن مادر، ادامه پایش معمول توصیه شد.",
        conclusion:
          "کاریوتایپ و آناتومی طبیعی است. ریسک کاهش یافته و فقط پایش مرتبط با سن مادر ادامه یابد.",
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
          { label: "شاخص PI شریان بند ناف", value: "1.05", status: "low" },
          { label: "شاخص PI شریان مغزی میانی", value: "1.78", status: "low" },
        ],
        note:
          "رشد جنین مناسب است و در حدود صدک ۵۰ دنبال می‌شود. داپلرها طبیعی هستند. با توجه به سن بالای مادر، درباره القای زایمان در هفته ۳۹ مشاوره انجام خواهد شد.",
        conclusion:
          "رشد جنین مناسب و داپلرها اطمینان‌بخش هستند. برنامه‌ریزی زایمان در انتهای بارداری بررسی شود.",
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