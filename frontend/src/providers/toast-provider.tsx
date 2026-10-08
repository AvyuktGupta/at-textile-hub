"use client";

import { createContext, use, useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error";

interface ToastAction {
  label: string;
  href: string;
}

interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  action?: ToastAction;
}

interface ToastContextValue {
  success: (message: string, action?: ToastAction) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (tone: ToastTone, message: string, action?: ToastAction) => {
      const id = ++nextId.current;
      setToasts((current) => [...current.slice(-2), { id, tone, message, action }]);
      window.setTimeout(() => dismiss(id), action ? TOAST_DURATION_MS * 1.5 : TOAST_DURATION_MS);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (message: string, action?: ToastAction) => push("success", message, action),
      error: (message: string) => push("error", message),
    }),
    [push]
  );

  return (
    <ToastContext value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-100 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface px-4 py-3 text-sm shadow-lift",
              toast.tone === "success" ? "border-line" : "border-danger/30"
            )}
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            ) : (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
            )}
            <p className="flex-1 text-ink-soft">{toast.message}</p>
            {toast.action && (
              <Link
                href={toast.action.href}
                onClick={() => dismiss(toast.id)}
                className="shrink-0 font-semibold text-brand hover:text-brand-hover"
              >
                {toast.action.label}
              </Link>
            )}
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="-m-1 rounded p-1 text-ink-faint hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const context = use(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
