"use client";
import { Button, ButtonLink } from "../brand";

/** The sign-in gate at the photo step (UX spec 6a). Books are account-only because they use real photos. */
export function SignInGate({ devSignin, onDevSignIn, onClose, busy }: { devSignin: boolean; onDevSignIn: () => void; onClose: () => void; busy?: boolean }) {
  return (
    <section className="gb-panel gb-panel--cream" aria-labelledby="gate-h" data-testid="signin-gate">
      <h2 className="gb-h2" id="gate-h">
        Books use real photos, so we need to know it&apos;s you.
      </h2>
      <p className="gb-lede">Make a free account to start. Your answers come with you.</p>
      <div className="gb-row">
        <ButtonLink variant="primary" href="/login?next=/create/book">
          Make a free account
        </ButtonLink>
        <Button variant="ghost" onClick={onClose}>
          Not now
        </Button>
      </div>
      {devSignin && (
        <p className="gb-small">
          Local build:{" "}
          <button type="button" className="gh-btn gh-btn--sm gh-btn--secondary" onClick={onDevSignIn} disabled={busy} data-testid="dev-signin">
            Continue as the local test account
          </button>
        </p>
      )}
    </section>
  );
}
