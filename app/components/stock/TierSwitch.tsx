"use client";
import { useRouter } from "next/navigation";
import { Segmented } from "@/components/brand";

/** "Made for you | Ready Cards": the one switch between the two card tiers (docs/cmo/stock-cards-positioning.md section 4). */
export function TierSwitch({ current }: { current: "made" | "ready" }) {
  const router = useRouter();
  return (
    <Segmented
      options={["Made for you", "Ready Cards"]}
      value={current === "ready" ? "Ready Cards" : "Made for you"}
      onChange={(v) => router.push(v === "Ready Cards" ? "/ready-cards" : "/browse?product=card")}
    />
  );
}
