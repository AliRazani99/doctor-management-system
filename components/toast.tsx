"use client"

import { createContext, useCallback, useContext, useState } from "react"
import { CheckCircle2 } from "lucide-react"

interface ToastItem {
  id: number
  message: string
}

const ToastContext = createContext<(message: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-card-foreground shadow-lg animate-in slide-in-from-bottom-2 fade-in"
          >
            <CheckCircle2 className="size-4 text-risk-low-foreground" aria-hidden="true" />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
