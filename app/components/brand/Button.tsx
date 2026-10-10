import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "sunny";
export type ButtonSize = "sm" | "md" | "lg";

type Opts = { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant = "primary", size = "md", className = "", ...rest }: Opts & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`gh-btn gh-btn--${variant} gh-btn--${size} ${className}`.trim()} {...rest} />;
}

/** Same look as Button, rendered as a link (navigation CTAs). */
export function ButtonLink({ variant = "primary", size = "md", className = "", style, ...rest }: Opts & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={`gh-btn gh-btn--${variant} gh-btn--${size} ${className}`.trim()}
      style={{ textDecoration: "none", ...style }}
      {...rest}
    />
  );
}
