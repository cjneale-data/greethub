"use client";
import { useCallback, useEffect, useState } from "react";
import type { WritingView } from "@/lib/writing/service";

export type WritingState = { status: "loading" } | { status: "guest" } | { status: "error" } | { status: "ready"; view: WritingView };

/** The member's saved handwriting and signatures. Guests get `guest` (presets and a typed signature still work). */
export function useWriting() {
  const [state, setState] = useState<WritingState>({ status: "loading" });
  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/account/writing", { cache: "no-store" });
      if (r.status === 401) return setState({ status: "guest" });
      if (!r.ok) return setState({ status: "error" });
      setState({ status: "ready", view: (await r.json()) as WritingView });
    } catch {
      setState({ status: "error" });
    }
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  return { state, setView: (view: WritingView) => setState({ status: "ready", view }), reload: load };
}

export const signatureImageUrl = (id: string) => `/api/account/writing/signatures/${encodeURIComponent(id)}/image`;
