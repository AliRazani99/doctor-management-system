"use client"

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

const NAV: { id: View; label: string; icon: typeof LayoutDashboard; adminOnly?: boolean }[] = [
  { id: "dashboard", label: "داشبورد", icon: LayoutDashboard },
  { id: "patients", label: "بیماران", icon: Users },
  { id: "reports", label: "گزارش‌ها", icon: FileBarChart },
  { id: "admin", label: "مدیریت", icon: ShieldCheck, adminOnly: true },
  { id: "settings", label: "تنظیمات", icon: Settings },
]

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .replace(/^دکتر\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
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
    <aside className="flex w-16 shrink-0 flex-col border-l border-sidebar-border bg-sidebar md:w-60">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4 md:px-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Activity className="size-5" aria-hidden="true" />
        </div>

        <div className="hidden flex-col leading-tight md:flex">
          <span className="text-sm font-semibold text-sidebar-foreground">
            فندق
          </span>
          <span className="text-xs text-muted-foreground">
            مدیریت بیماران
          </span>
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
            {currentUser ? initials(currentUser.name) : "م"}
          </div>

          <div className="hidden min-w-0 flex-col leading-tight md:flex">
            <span className="truncate text-sm font-medium text-sidebar-foreground">
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
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground md:justify-start"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          <span className="hidden md:inline">خروج از حساب</span>
        </button>
      </div>
    </aside>
  )
}