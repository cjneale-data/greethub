"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button, ButtonLink } from "@/components/brand";
import { formatMoney } from "@greethub/shared";

export const Money = ({ cents }: { cents: number }) => <>{formatMoney(cents)}</>;

export function Skeleton({ h = 20, w = "100%", r }: { h?: number; w?: number | string; r?: number }) {
  return <div className="gs-skel" style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />;
}

export function SkeletonList({ rows = 3, h = 96 }: { rows?: number; h?: number }) {
  return (
    <div className="gs-stack" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} h={h} r={22} />
      ))}
    </div>
  );
}

type EmptyAction = { label: string; variant?: "primary" | "secondary" | "dark" } & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

export function EmptyState({ message, actions }: { message: string; actions?: EmptyAction[] }) {
  return (
    <div className="gs-empty">
      <p>{message}</p>
      {actions && (
        <div className="gs-row">
          {actions.map((a) =>
            a.onClick ? (
              <Button key={a.label} variant={a.variant ?? "secondary"} onClick={a.onClick}>
                {a.label}
              </Button>
            ) : (
              <ButtonLink key={a.href + a.label} href={a.href} variant={a.variant ?? "secondary"}>
                {a.label}
              </ButtonLink>
            ),
          )}
        </div>
      )}
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="gs-error gs-row gs-row--between" role="alert">
      <span>{message}</span>
      {onRetry && (
        <Button size="sm" variant="dark" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function Modal({ title, children, actions, onClose }: { title: string; children?: ReactNode; actions: ReactNode; onClose: () => void }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  // Callers pass a fresh onClose each render; the effect below must run once per open, or every keystroke in a field
  // re-runs it and focus jumps back to the first control.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const onClose = () => closeRef.current();
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input,button,select,textarea")?.focus();
    // Escape closes; Tab stays inside the dialog (WAI-ARIA modal pattern, CX P1-4).
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !ref.current) return;
      const els = [...ref.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="gs-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gs-modal" role="dialog" aria-modal="true" aria-labelledby={id} ref={ref}>
        <div className="gs-row gs-row--between" style={{ alignItems: "flex-start" }}>
          <h2 id={id}>{title}</h2>
          <button type="button" className="gs-modal__close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        {children}
        <div className="gs-modal__actions">{actions}</div>
      </div>
    </div>
  );
}

export function Check({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: string }) {
  return (
    <div>
      <label className="gs-check">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span>{children}</span>
      </label>
      {error && <span className="gh-field__hint gh-field__hint--error">{error}</span>}
    </div>
  );
}

export function PageTitle({ title, lede, accent }: { title: string; lede?: string; accent?: string }) {
  return (
    <header style={{ marginBottom: 24 }}>
      <h1 className="gs-h1">
        {title}
        {accent && (
          <>
            {" "}
            <em>{accent}</em>
          </>
        )}
      </h1>
      {lede && <p className="gs-lede" style={{ marginBottom: 0 }}>{lede}</p>}
    </header>
  );
}
