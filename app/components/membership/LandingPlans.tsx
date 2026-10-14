"use client";
import { Plans } from "./Plans";

/**
 * The shared plan cards on the public /membership page. The page can't see the session, so every paid-plan button
 * links to the account page (guests are sent to sign in and come back); Free links to sign-up.
 */
export function LandingPlans({ enabled }: { enabled: boolean }) {
  return <Plans enabled={enabled} chooseHref={(tier) => (tier === "free" ? "/signup?next=/account/membership" : "/account/membership")} />;
}
