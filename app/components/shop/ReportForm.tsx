"use client";
import { useState } from "react";
import { Button, TextField } from "@/components/brand";

const KINDS = [
  { id: "likeness", label: "A photo or picture of me or my child" },
  { id: "copyright", label: "Copyright: it uses my work or a character I own" },
  { id: "inappropriate", label: "Something that should not be here" },
  { id: "other", label: "Something else" },
] as const;
type Kind = (typeof KINDS)[number]["id"];

/** Report and takedown form (docs/legal/06 req 22). Posts to /api/report. */
export function ReportForm() {
  const [kind, setKind] = useState<Kind>("likeness");
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [depicted, setDepicted] = useState("");
  const [email, setEmail] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [signature, setSignature] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ id: string; hours: number } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setErrors({});
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, what, where, depicted, contactEmail: email, goodFaith, signature, website }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; hours?: number; error?: string; fields?: Record<string, string> };
      if (!res.ok) {
        setErrors(body.fields ?? {});
        setError(body.error ?? "Something went wrong on our side. You can also email report@greethub.example.");
        return;
      }
      setDone({ id: body.id ?? "", hours: body.hours ?? 48 });
    } catch {
      setError("We lost the connection. Try again, or email report@greethub.example.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="gs-stack" data-testid="report-done">
        <p style={{ margin: 0 }}>
          <strong>We got your report.</strong> Your reference is <span data-testid="report-id">{done.id}</span>. We aim to reply within {done.hours} hours at {email}.
        </p>
        <p className="gs-muted" style={{ margin: 0 }}>A confirmation is on its way to your inbox.</p>
      </div>
    );
  }

  return (
    <form className="gs-stack" onSubmit={submit} noValidate data-testid="report-form">
      {error && (
        <p role="alert" className="gh-field__hint gh-field__hint--error" style={{ margin: 0 }}>
          {error}
        </p>
      )}
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="gh-field__label">What are you reporting?</legend>
        {KINDS.map((k) => (
          <label key={k.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
            <input type="radio" name="kind" value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} />
            {k.label}
          </label>
        ))}
      </fieldset>
      <TextField multiline rows={4} label="What is the problem?" value={what} onChange={(e) => setWhat(e.target.value)} maxLength={2000} error={errors.what} />
      <TextField label="Where is it?" hint="An order number, a link, or the page where you saw it." value={where} onChange={(e) => setWhere(e.target.value)} maxLength={500} error={errors.where} />
      <TextField label="Who is shown? (optional)" hint="For a photo or picture of a person: who they are to you." value={depicted} onChange={(e) => setDepicted(e.target.value)} maxLength={300} error={errors.depicted} />
      <TextField label="Your email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} error={errors.contactEmail} />
      {kind === "copyright" && (
        <div className="gs-stack">
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" checked={goodFaith} onChange={(e) => setGoodFaith(e.target.checked)} style={{ marginTop: 4 }} />
            <span>
              I have a good-faith belief that this use is not authorised by the copyright owner, its agent or the law, and the information in this notice is accurate. I am the owner or authorised to act for the owner.
            </span>
          </label>
          {errors.goodFaith && <span className="gh-field__hint gh-field__hint--error">{errors.goodFaith}</span>}
          <TextField label="Type your full name as a signature" value={signature} onChange={(e) => setSignature(e.target.value)} maxLength={120} error={errors.signature} />
        </div>
      )}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} style={{ position: "absolute", left: "-9999px", height: 0, width: 0 }} aria-hidden="true" />
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Sending" : "Send report"}
        </Button>
      </div>
      <p className="gs-muted" style={{ margin: 0 }}>We aim to reply within 48 hours. If a photo shows you or your child and should not be here, say so and we will treat it as urgent.</p>
    </form>
  );
}
