"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

type ToastAction = { label: string; onClick: () => void | Promise<void> };
type ToastInput = { message: string; kind?: "info" | "success" | "error"; action?: ToastAction; durationMs?: number };
type ToastItem = ToastInput & { id: number };

interface ToastApi {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastApi>({ toast: () => {} });

/** Safe to call anywhere; outside a provider it does nothing. */
export function useToast(): ToastApi {
  return useContext(ToastContext);
}

const DEFAULT_DURATION = 7000;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback((input: ToastInput) => {
    const id = ++seq.current;
    setItems((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { ...input, id }]);
  }, []);

  const api = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[500] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-3" aria-live="polite">
        {items.map((item) => <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: Readonly<{ item: ToastItem; onDismiss: () => void }>) {
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(onDismiss, item.durationMs ?? DEFAULT_DURATION);
    return () => clearTimeout(timer);
  }, [item.durationMs, onDismiss]);

  const color = item.kind === "error" ? "border-danger/40" : item.kind === "success" ? "border-success/40" : "border-border-strong";

  return (
    <div role="status" className={`pointer-events-auto flex w-full animate-pop-in items-center gap-3 rounded-lg border ${color} bg-panel px-3.5 py-2.5 text-sm shadow-lg`}>
      <span className="min-w-0 flex-1">{item.message}</span>
      {item.action && (
        <button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try { await item.action!.onClick(); } finally { onDismiss(); }
          }}
          className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-accent hover:bg-accent-soft disabled:opacity-50"
        >
          {item.action.label}
        </button>
      )}
      <button onClick={onDismiss} aria-label="Dismiss" className="shrink-0 text-faint hover:text-fg"><X size={14} /></button>
    </div>
  );
}
