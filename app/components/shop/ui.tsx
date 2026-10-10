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

export function EmptyState({ message, actions }: { message: string; actions?: { label: string; href: string; variant?: "primary" | "secondary" | "dark" }[] }) {
  return (
    <div className="gs-empty">
      <p>{message}</p>
      {actions && (
        <div className="gs-row">
          {actions.map((a) => (
            <ButtonLink key={a.href + a.label} href={a.href} variant={a.variant ?? "secondary"}>
              {a.label}
            </ButtonLink>
          ))}
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
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input,button,select,textarea")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="gs-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gs-modal" role="dialog" aria-modal="true" aria-labelledby={id} ref={ref}>
        <h2 id={id}>{title}</h2>
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
