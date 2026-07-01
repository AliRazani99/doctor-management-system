"use client"

import Image from "next/image"
import {
  Activity,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { View } from "./app-shell"
import { useStore } from "./store"

const NAV: {
  id: View
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}[] = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "patients", label: "بیماران", icon: Users },
  { id: "reports", label: "گزارش‌ها", icon: FileBarChart },
  { id: "admin", label: "مدیریت", icon: ShieldCheck, adminOnly: true },
  { id: "settings", label: "تنظیمات", icon: Settings },
]

const UNIVERSITY_LOGOS = [
  {
    src: "/logos/shiraz-university.png",
    alt: "لوگوی دانشگاه شیراز",
  },
  {
    src: "/logos/shiraz-medical.png",
    alt: "لوگوی دانشگاه علوم پزشکی شیراز",
  },
]

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .replace(/^دکتر\s*/i, "")
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export function Sidebar({
  view,
  onNavigate,
}: {
  view: View
  onNavigate: (view: View) => void
}) {
  const { currentUser, logout } = useStore()
  const isAdmin = currentUser?.role === "admin"
  const items = NAV.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside
      dir="rtl"
      className="flex w-20 shrink-0 flex-col border-l border-sidebar-border bg-sidebar md:w-72"
    >
      <div className="border-b border-sidebar-border px-3 py-4 md:px-4">
      <div className="flex items-center justify-center gap-3 md:justify-start">
        <div className="hidden items-center gap-3 md:flex">
          {UNIVERSITY_LOGOS.map((logo) => (
            <div
              key={logo.src}
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-border"
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                width={46}
                height={66}
                className="h-11 w-11 object-contain"
                priority
              />
            </div>
          ))}
        </div>

        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Activity className="size-6" aria-hidden="true" />
        </div>

        <div className="hidden min-w-0 flex-col leading-tight md:flex">
          <span className="truncate text-base font-bold text-sidebar-foreground">
            فندق
          </span>
          <span className="truncate text-xs text-muted-foreground">
            سامانه مدیریت بیماران
          </span>
        </div>
      </div>
    </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 md:p-3">
        {items.map((item) => {
          const Icon = item.icon
          const active = view === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                "justify-center md:justify-start",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-center gap-3 md:justify-start">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {currentUser ? initials(currentUser.name) : "م"}
          </div>

          <div className="hidden min-w-0 flex-col leading-tight md:flex">
            <span className="truncate text-sm font-semibold text-sidebar-foreground">
              {currentUser?.name ?? "کاربر مهمان"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {currentUser?.specialty ?? ""}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground md:justify-start"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">خروج از حساب</span>
        </button>
      </div>
    </aside>
  )
}