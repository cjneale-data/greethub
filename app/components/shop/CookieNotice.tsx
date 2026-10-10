"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/brand";

const KEY = "gh_cookie_choice";

/** "accepted" | "rejected" | null. Future analytics or ad tags must check this and Global Privacy Control before loading. */
export function getCookieChoice(): "accepted" | "rejected" | null {
  try {
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
    if (gpc) return "rejected";
    const v = localStorage.getItem(KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
}

/**
 * Equal-weight Accept and Reject (docs/legal 06, req. 43). Today the site sets only the cookies it needs (sign-in, cart) and loads no
 * analytics or ad tags, so both choices change nothing yet. The choice is stored so tags added later start off.
 */
export function CookieNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const gpc = (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!gpc && getCookieChoice() === null) setShow(true);
  }, []);
  if (!show) return null;
  const choose = (v: "accepted" | "rejected") => {
    try {
      localStorage.setItem(KEY, v);
    } catch {}
    setShow(false);
  };
  return (
    <div className="gs-cookie" role="region" aria-label="Cookie choices">
      <p>
        We only use the cookies the site needs to work: your sign-in and your cart. No ad or analytics tags. <Link className="gs-link" href="/privacy#choices">Your privacy choices</Link>
      </p>
      <div className="gs-row">
        <Button variant="secondary" size="sm" onClick={() => choose("accepted")}>Accept</Button>
        <Button variant="secondary" size="sm" onClick={() => choose("rejected")}>Reject</Button>
      </div>
    </div>
  );
}
