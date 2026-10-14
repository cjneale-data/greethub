"use client";
import { useCallback, useEffect, useState } from "react";
import type { MembershipView } from "@/lib/membership/service";

export type MembershipState = { status: "loading" } | { status: "guest" } | { status: "error" } | { status: "ready"; view: MembershipView };

/** The member's plan, perks and usage. Guests get `guest`. */
export function useMembership() {
  const [state, setState] = useState<MembershipState>({ status: "loading" });
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/account/membership", { cache: "no-store" });
      if (r.status === 401) return setState({ status: "guest" });
      if (!r.ok) return setState({ status: "error" });
      setState({ status: "ready", view: (await r.json()) as MembershipView });
    } catch {
      setState({ status: "error" });
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  return { state, setView: (view: MembershipView) => setState({ status: "ready", view }), reload: load };
}

/** Is a paid perk on for this member? While memberships are off, everything that exists today stays on. */
export const isPaidFeatureOn = (s: MembershipState, key: "own_handwriting_print" | "apply_to_new_cards") => s.status === "ready" && !!s.view.features[key];
