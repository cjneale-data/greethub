"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Toast } from "@/components/brand";

/* ---------- fetch helper ---------- */

export type ApiResult<T> = { ok: boolean; status: number; data: T & { error?: string; fieldErrors?: Record<string, Record<string, string>> } };

export async function api<T = Record<string, unknown>>(url: string, init?: RequestInit & { json?: unknown }): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) },
      body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
      cache: "no-store",
    });
    const data = (await res.json().catch(() => ({}))) as ApiResult<T>["data"];
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "We lost you for a second. Trying again." } as ApiResult<T>["data"] };
  }
}

/* ---------- session + cart count (one shared cache) ---------- */

export type SessionInfo = {
  loaded: boolean;
  signedIn: boolean;
  email: string | null;
  firstName: string | null;
  cartCount: number;
  fake: { auth: boolean; payments: boolean; printers: boolean };
};

const INITIAL: SessionInfo = { loaded: false, signedIn: false, email: null, firstName: null, cartCount: 0, fake: { auth: true, payments: true, printers: true } };
let state: SessionInfo = INITIAL;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export async function refreshSession(): Promise<SessionInfo> {
  const r = await api<Omit<SessionInfo, "loaded">>("/api/auth/session");
  if (r.ok) {
    state = { ...state, ...r.data, loaded: true };
    emit();
  }
  return state;
}

/** Call after any cart change so the nav badge updates. */
export function setCartCount(n: number) {
  state = { ...state, cartCount: n };
  emit();
}

export function useSession(): SessionInfo {
  const snap = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => state,
    () => INITIAL,
  );
  useEffect(() => {
    if (!state.loaded) void refreshSession();
  }, []);
  return snap;
}

/* ---------- toasts ---------- */

type ToastItem = { id: number; message: ReactNode; action?: string; onAction?: () => void };
const ToastCtx = createContext<(message: ReactNode, opts?: { action?: string; onAction?: () => void; ms?: number }) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(1);
  const push = useCallback((message: ReactNode, opts?: { action?: string; onAction?: () => void; ms?: number }) => {
    const id = next.current++;
    setItems((l) => [...l.slice(-2), { id, message, action: opts?.action, onAction: opts?.onAction }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), opts?.ms ?? 5000);
  }, []);
  const ctx = useMemo(() => push, [push]);
  return (
    <ToastCtx.Provider value={ctx}>
      {children}
      <div className="gs-toasts" aria-live="polite">
        {items.map((t) => (
          <Toast
            key={t.id}
            action={t.action}
            onAction={() => {
              t.onAction?.();
              setItems((l) => l.filter((x) => x.id !== t.id));
            }}
          >
            {t.message}
          </Toast>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- small hooks ---------- */

/** Loads JSON on mount and on demand. */
export function useLoad<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<number>(0);
  const [loading, setLoading] = useState(!!url);
  const reload = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    const r = await api<T>(url);
    setStatus(r.status);
    if (r.ok) {
      setData(r.data as T);
      setError(null);
    } else {
      setError(r.data.error ?? "Something broke on our side. It's not you. Try again in a minute.");
    }
    setLoading(false);
  }, [url]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
  }, [reload]);
  return { data, setData, error, status, loading, reload };
}
