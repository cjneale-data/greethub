"use client";
import { useId } from "react";

type Common = { label?: string; hint?: string; error?: string };
type InputProps = Common & { multiline?: false } & React.InputHTMLAttributes<HTMLInputElement>;
type AreaProps = Common & { multiline: true } & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextField(props: InputProps | AreaProps) {
  const id = useId();
  const { label, hint, error } = props;
  return (
    <label className="gh-field" htmlFor={id}>
      {label && <span className="gh-field__label">{label}</span>}
      {props.multiline ? (
        (() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { label: _l, hint: _h, error: _e, multiline: _m, rows, ...rest } = props;
          return <textarea id={id} className="gh-input" rows={rows ?? 3} aria-invalid={!!error} {...rest} />;
        })()
      ) : (
        (() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { label: _l, hint: _h, error: _e, multiline: _m, ...rest } = props;
          return <input id={id} className="gh-input" aria-invalid={!!error} {...rest} />;
        })()
      )}
      {(error || hint) && <span className={`gh-field__hint ${error ? "gh-field__hint--error" : ""}`.trim()}>{error || hint}</span>}
    </label>
  );
}
