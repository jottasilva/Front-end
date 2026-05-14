import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastInput {
  type?: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
} satisfies Record<ToastType, typeof CheckCircle2>;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, number>>({});

  const dismiss = useCallback((id: string) => {
    window.clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "info", title, description, durationMs = 4600 }: ToastInput) => {
      const id = crypto.randomUUID();
      setToasts((current) => [{ id, type, title, description }, ...current].slice(0, 5));
      timers.current[id] = window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  useEffect(() => {
    const activeTimers = timers.current;
    return () => {
      Object.values(activeTimers).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (title, description) => showToast({ type: "success", title, description }),
      error: (title, description) => showToast({ type: "error", title, description }),
      warning: (title, description) => showToast({ type: "warning", title, description }),
      info: (title, description) => showToast({ type: "info", title, description }),
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-label="Notificacoes do sistema" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = toastIcons[toast.type];
          return (
            <article className={`toast-card ${toast.type}`} key={toast.id} role={toast.type === "error" ? "alert" : "status"}>
              <Icon size={20} />
              <div>
                <strong>{toast.title}</strong>
                {toast.description && <span>{toast.description}</span>}
              </div>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Fechar notificacao">
                <X size={16} />
              </button>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
