"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "./client";

/** One-shot toasts from redirects: account deleted. */
export function HomeToast() {
  const sp = useSearchParams();
  const toast = useToast();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    if (sp.get("deleted")) {
      done.current = true;
      const n = sp.get("name");
      toast(`Your account is gone. Take care${n ? `, ${n}` : ""}.`);
    }
  }, [sp, toast]);
  return null;
}
