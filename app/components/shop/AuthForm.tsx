"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, LogoMark, TextField } from "@/components/brand";
import { Check, ErrorBox } from "./ui";
import { api } from "./client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const sp = useSearchParams();
  const router = useRouter();
  const next = sp.get("next") || "/account";
  const signup = mode === "signup";
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [password, setPassword] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [acceptErr, setAcceptErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(sp.get("error") === "expired" ? "That link has expired. Send a new one?" : sp.get("reason") ? "Sign in to see this." : "");
  const [sent, setSent] = useState<{ email: string; devLink?: string } | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const gate = () => {
    if (signup && !accepted) {
      setAcceptErr("Tick the box to confirm you're 18 or older and agree to the Terms and Privacy Policy.");
      return false;
    }
    setAcceptErr("");
    return true;
  };

  async function sendLink() {
    setError("");
    if (!EMAIL_RE.test(email.trim())) return setEmailErr("That email doesn't look right. Check for typos.");
    setEmailErr("");
    if (!gate()) return;
    setBusy(true);
    const r = await api<{ devLink?: string }>("/api/auth/magic-link", { method: "POST", json: { email: email.trim(), next, signup, accepted } });
    setBusy(false);
    if (!r.ok) return setError(r.data.error ?? "Something broke on our side. It's not you. Try again in a minute.");
    setSent({ email: email.trim(), devLink: r.data.devLink });
    setWait(30);
  }

  async function withPassword() {
    setError("");
    if (!EMAIL_RE.test(email.trim())) return setEmailErr("That email doesn't look right. Check for typos.");
    setEmailErr("");
    if (signup && password.length < MIN_PASSWORD) return setPasswordErr(`Use at least ${MIN_PASSWORD} characters.`);
    if (!password) return setPasswordErr("Enter your password.");
    setPasswordErr("");
    if (!gate()) return;
    setBusy(true);
    const r = await api<{ next?: string }>("/api/auth/password", { method: "POST", json: { email: email.trim(), password, next, signup, accepted } });
    if (!r.ok) {
      setBusy(false);
      return setError(r.data.error ?? "Something broke on our side. It's not you. Try again in a minute.");
    }
    // Full load so the header and every server component pick up the new session.
    const dest = new URL(r.data.next || next, window.location.origin);
    dest.searchParams.set("signedin", "1");
    window.location.assign(dest.toString());
  }

  async function google() {
    setError("");
    if (!gate()) return;
    setBusy(true);
    const r = await api<{ url?: string }>("/api/auth/google", { method: "POST", json: { next, signup, accepted } });
    setBusy(false);
    if (r.ok && r.data.url) router.push(r.data.url);
    else setError(r.data.error ?? "Google isn't available right now.");
  }

  return (
    <div className="gs-page gs-page--form">
      <div className="gs-auth gs-stack">
        <LogoMark size={44} />
        <div>
          <h1 className="gs-h2" style={{ marginBottom: 4 }}>{signup ? "Make a free account" : "Welcome back"}</h1>
          <p className="gs-muted" style={{ margin: 0 }}>{signup ? "Your card comes with you." : "Sign in with your email and password, or get a link by email."}</p>
        </div>
        {error && <ErrorBox message={error} />}
        {sent ? (
          <div className="gs-stack" role="status">
            <p style={{ margin: 0 }}>
              <strong>Check your email.</strong> We sent a link to {sent.email}. It works for 15 minutes.
            </p>
            {sent.devLink && (
              <div className="gs-devnote">
                Local mode: no email is really sent. <Link className="gs-link" data-testid="dev-link" href={sent.devLink}>Open the sign-in link</Link>
              </div>
            )}
            <div className="gs-row">
              <Button variant="ghost" onClick={() => setSent(null)}>Use a different email</Button>
              <Button variant="ghost" disabled={wait > 0 || busy} onClick={sendLink}>{wait > 0 ? `Resend in ${wait}s` : "Resend"}</Button>
            </div>
          </div>
        ) : (
          <form className="gs-stack" onSubmit={(e) => { e.preventDefault(); void withPassword(); }} noValidate>
            <Button type="button" variant="secondary" size="lg" disabled={busy} onClick={google}>Continue with Google</Button>
            <div className="gs-divider">or</div>
            <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} error={emailErr} placeholder="you@example.com" />
            <TextField label="Password" type="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} error={passwordErr} hint={signup ? `At least ${MIN_PASSWORD} characters.` : undefined} maxLength={72} />
            {signup && (
              <Check checked={accepted} onChange={setAccepted} error={acceptErr}>
                I&apos;m 18 or older, and I agree to the <Link className="gs-link" href="/terms" target="_blank">Terms</Link> and <Link className="gs-link" href="/privacy" target="_blank">Privacy Policy</Link>.
              </Check>
            )}
            <Button type="submit" size="lg" disabled={busy}>{busy ? "One moment" : signup ? "Make my account" : "Sign in"}</Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={sendLink}>Email me a sign-in link</Button>
            <p className="gs-muted gs-small" style={{ margin: 0 }}>
              {signup ? (
                <>Already have an account? <Link className="gs-link" href={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link></>
              ) : (
                <>New here? <Link className="gs-link" href={`/signup?next=${encodeURIComponent(next)}`}>Make a free account</Link>. By continuing you agree to the Terms and Privacy Policy.</>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
