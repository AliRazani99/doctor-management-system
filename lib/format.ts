export function toFaNumber(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])
}

export function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fa-IR-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatShortDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("fa-IR-u-ca-gregory", {
    day: "numeric",
    month: "long",
  })
}

export function ga(weeks: number, days: number): string {
  return `${toFaNumber(weeks)} هفته و ${toFaNumber(days)} روز`
}