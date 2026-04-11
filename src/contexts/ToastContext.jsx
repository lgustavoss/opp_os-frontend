import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react'

const ToastContext = createContext(null)

const VARIANT_STYLES = {
  success: {
    wrapper: 'border-success-200 bg-success-50 text-success-900',
    icon: CheckCircle2,
  },
  error: {
    wrapper: 'border-danger-200 bg-danger-50 text-danger-900',
    icon: AlertCircle,
  },
  warning: {
    wrapper: 'border-warning-200 bg-warning-50 text-warning-900',
    icon: AlertTriangle,
  },
  info: {
    wrapper: 'border-primary-200 bg-primary-50 text-primary-900',
    icon: Info,
  },
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    ({ message, variant = 'info', durationMs = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((prev) => [...prev, { id, message, variant }])
      window.setTimeout(() => removeToast(id), durationMs)
    },
    [removeToast]
  )

  const value = useMemo(
    () => ({
      showToast,
      success: (message, durationMs) => showToast({ message, variant: 'success', durationMs }),
      error: (message, durationMs) => showToast({ message, variant: 'error', durationMs }),
      warning: (message, durationMs) => showToast({ message, variant: 'warning', durationMs }),
      info: (message, durationMs) => showToast({ message, variant: 'info', durationMs }),
    }),
    [showToast]
  )

  useEffect(() => {
    const previousAlert = window.alert
    window.alert = (message) => {
      const text = typeof message === 'string' ? message : 'Aviso'
      showToast({ message: text, variant: 'warning' })
    }
    return () => {
      window.alert = previousAlert
    }
  }, [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((toast) => {
          const style = VARIANT_STYLES[toast.variant] || VARIANT_STYLES.info
          const Icon = style.icon
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur-sm ${style.wrapper}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <p className="flex-1 text-sm leading-snug">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="rounded p-1 opacity-70 transition hover:opacity-100"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return ctx
}

