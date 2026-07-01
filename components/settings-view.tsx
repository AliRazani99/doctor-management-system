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
      <div className="text-right">
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
    <div dir="rtl">
      <PageHeader
        title="تنظیمات"
        subtitle="مشخصات مرکز درمانی و ترجیحات سامانه"
      />

      <div className="mx-auto max-w-3xl space-y-6 px-6 py-6">
        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              مشخصات مرکز درمانی
            </h2>
          </div>

          <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="نام مرکز" value="مرکز درمانی فندق" />
            <Field label="پزشک مسئول" value="دکتر مهدیه علایی" />
            <Field label="بخش" value="زنان و زایمان" />
            <Field label="منطقه زمانی" value="GMT+01:00 (CET)" ltr />
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              ترجیحات سامانه
            </h2>
          </div>

          <CardContent className="divide-y divide-border p-5 py-1">
            <Toggle
              label="هشدار بیماران پرخطر"
              description="در صورت ثبت ویزیت پرخطر، هشدار نمایش داده شود"
              defaultOn
            />

            <Toggle
              label="نمایش نمودارهای رشد"
              description="صدک‌های ۵، ۵۰ و ۹۵ در نمودارهای رشد نمایش داده شوند"
              defaultOn
            />

            <Toggle
              label="پیشنهاد خودکار یادداشت"
              description="یادداشت ویزیت بر اساس یافته‌های قبلی بیمار پیشنهاد شود"
            />
          </CardContent>
        </Card>

        <Card>
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              استاندارد مرجع
            </h2>
          </div>

          <CardContent className="p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              اندازه‌گیری‌های بیومتریک با استاندارد مرجع انتخاب‌شده برای رشد
              جنین مقایسه می‌شوند. این نسخه صرفاً نمایشی است و نباید برای
              تصمیم‌گیری واقعی درمانی استفاده شود.
            </p>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Field label="مرجع فعال" value="INTERGROWTH-21st نسخه نمایشی" />

              <Button size="lg" onClick={() => toast("تنظیمات ذخیره شد")}>
                ذخیره تغییرات
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  ltr = false,
}: {
  label: string
  value: string
  ltr?: boolean
}) {
  return (
    <div className="text-right">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        dir={ltr ? "ltr" : "rtl"}
        className={cn(
          "text-sm font-medium text-foreground",
          ltr && "text-right",
        )}
      >
        {value}
      </p>
    </div>
  )
}