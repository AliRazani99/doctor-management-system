"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Dashboard } from "./dashboard"
import { PatientsView } from "./patients-view"
import { PatientRecord } from "./patient-record"
import { Reports } from "./reports"
import { SettingsView } from "./settings-view"
import { AdminView } from "./admin-view"
import { LoginScreen } from "./login-screen"
import { PatientPortal } from "./patient-portal"
import { AlertsBanner } from "./alerts-banner"
import { ToastProvider } from "./toast"
import { StoreProvider, useStore } from "./store"

export type View = "dashboard" | "patients" | "reports" | "admin" | "settings"

function Workspace() {
  const { currentUser, currentPatient, ready } = useStore()
  const [view, setView] = useState<View>("dashboard")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)

  function handleNavigate(next: View) {
    setView(next)
    setSelectedPatientId(null)
  }

  function openPatient(id: string) {
    setSelectedPatientId(id)
  }

  if (!ready) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background text-sm text-muted-foreground">
        در حال بارگذاری سامانه…
      </div>
    )
  }

  // درگاه بیمار (فقط خواندنی)
  if (currentPatient) {
    return <PatientPortal />
  }

  if (!currentUser) {
    return <LoginScreen />
  }

  const isAdmin = currentUser.role === "admin"
  // Guard the admin route in case state changes after navigation.
  const activeView = view === "admin" && !isAdmin ? "dashboard" : view

  function renderContent() {
    if (selectedPatientId) {
      return (
        <PatientRecord
          patientId={selectedPatientId}
          onBack={() => setSelectedPatientId(null)}
        />
      )
    }
    switch (activeView) {
      case "dashboard":
        return <Dashboard onOpenPatient={openPatient} />
      case "patients":
        return <PatientsView onOpenPatient={openPatient} />
      case "reports":
        return <Reports onOpenPatient={openPatient} />
      case "admin":
        return <AdminView />
      case "settings":
        return <SettingsView />
    }
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar view={activeView} onNavigate={handleNavigate} />
      <main className="flex-1 overflow-y-auto">
        <AlertsBanner onOpenPatient={openPatient} />
        {renderContent()}
      </main>
    </div>
  )
}

export function AppShell() {
  return (
    <StoreProvider>
      <ToastProvider>
        <Workspace />
      </ToastProvider>
    </StoreProvider>
  )
}
