"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "../brand";

export function Checkbox({ checked, onChange, disabled, children, id }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; children: ReactNode; id?: string }) {
  return (
    <label className={`gb-check ${disabled ? "gb-check--disabled" : ""}`.trim()}>
      <input id={id} type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="gb-check__box" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7.5l3.2 3L12 3.5" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

export function Notice({ children, tone = "error", action }: { children: ReactNode; tone?: "error" | "info"; action?: { label: string; onClick: () => void } }) {
  return (
    <div className={`gb-notice ${tone === "info" ? "gb-notice--info" : ""}`.trim()} role={tone === "error" ? "alert" : "status"}>
      <p className="gb-notice__text">{children}</p>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ h = 20, w = "100%" }: { h?: number; w?: number | string }) {
  return <div className="gb-skel" style={{ height: h, width: w }} aria-hidden="true" />;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // Once per open: a fresh onClose each render must not re-run this, or focus jumps back on every keystroke.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("textarea,input,button")?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="gb-modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gb-modal__box" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2 className="gb-h2">{title}</h2>
        {children}
      </div>
    </div>
  );
}
