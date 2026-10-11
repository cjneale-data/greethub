"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button, Chip, TextField } from "@/components/brand";
import "./creator.css";

/* ---------- chat ---------- */

export function ChatBubble({ role, children }: { role: "guide" | "user"; children: ReactNode }) {
  return <div className={`gc-bubble gc-bubble--${role}`}>{children}</div>;
}

export function TypingBubble() {
  return (
    <ChatBubble role="guide">
      <span className="gc-dots" role="status" aria-label="The guide is typing">
        <span />
        <span />
        <span />
      </span>
    </ChatBubble>
  );
}

/* ---------- modal ---------- */

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, a, input")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="gc-scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className="gc-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
    </div>
  );
}

/* ---------- checkbox (twine border, radius 8, persimmon-ink check) ---------- */

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button type="button" role="checkbox" aria-checked={checked} className="gc-check" onClick={() => onChange(!checked)}>
      <span className="gc-check__box">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M2.5 7.5l3 3 6-7" stroke="var(--gh-persimmon-ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span>{children}</span>
    </button>
  );
}

/* ---------- chip pickers ---------- */

/** Single-select chips. With `otherLabel`, that chip reveals a free-text field and the typed value becomes the selection. */
export function ChipPicker({
  options, value, onChange, otherLabel, otherPlaceholder = "Tell me in a few words", ariaLabel, scroll,
}: {
  options: readonly string[];
  value?: string;
  onChange: (v: string) => void;
  otherLabel?: string;
  otherPlaceholder?: string;
  ariaLabel?: string;
  scroll?: boolean;
}) {
  const isOther = !!otherLabel && !!value && !options.includes(value) ;
  const showOther = !!otherLabel && (isOther || value === otherLabel);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className={`gc-chips ${scroll ? "gc-chips--scroll" : ""}`} role="group" aria-label={ariaLabel}>
        {options.map((o) => (
          <Chip key={o} selected={o === value || (o === otherLabel && showOther)} onClick={() => onChange(o)}>
            {o}
          </Chip>
        ))}
      </div>
      {showOther && (
        <TextField
          aria-label={otherPlaceholder}
          placeholder={otherPlaceholder}
          maxLength={40}
          value={value === otherLabel ? "" : (value ?? "")}
          onChange={(e) => onChange(e.target.value || otherLabel!)}
        />
      )}
    </div>
  );
}

/** Bottom sheet used on mobile for the brief card drawer. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="gc-sheet" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="gc-sheet__body" role="dialog" aria-modal="true" aria-label={title}>
        <div className="gc-row">
          <h2 className="gc-panel__title">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
