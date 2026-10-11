/**
 * Data events for IP safety, named and shaped per docs/data/tracking-plan.json:
 * ip_input_rewritten, ip_input_blocked, ip_output_flagged, ip_output_rerolled.
 * Properties are kinds and counts only. Raw customer text is NEVER an event property (free_text rule in the plan).
 *
 * Until the analytics collector exists the events go to a JSON-lines file under GREETHUB_DATA_DIR (or the OS temp
 * dir) and, in tests, to an in-memory list. Swap `sink` for the collector call later.
 */
import { appendFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { EVENT_SURFACE, type DetectedKind, type IpField, type IpResult } from "./types";

export type SafetyEvent = {
  event_id: string;
  event_name: "ip_input_rewritten" | "ip_input_blocked" | "ip_output_flagged" | "ip_output_rerolled";
  schema_version: 1;
  occurred_at: string;
  source: "server" | "worker";
  props: Record<string, string | number | boolean | string[]>;
};

const memory: SafetyEvent[] = [];
export const recordedSafetyEvents = () => memory;
export const clearSafetyEvents = () => void (memory.length = 0);

function emit(e: Omit<SafetyEvent, "event_id" | "schema_version" | "occurred_at">) {
  const full: SafetyEvent = { event_id: crypto.randomUUID(), schema_version: 1, occurred_at: new Date().toISOString(), ...e };
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    memory.push(full);
    if (memory.length > 500) memory.shift();
    return;
  }
  try {
    const dir = process.env.GREETHUB_DATA_DIR || path.join(os.tmpdir(), "greethub-data");
    mkdirSync(dir, { recursive: true });
    appendFileSync(path.join(dir, "safety-events.jsonl"), JSON.stringify(full) + "\n", "utf8");
  } catch {
    /* analytics must never break a request */
  }
}

const kindsOf = (r: IpResult): string[] => [...new Set(r.detected.map((d) => d.kind as DetectedKind))].sort();

/** Call after every screen. Does nothing for verdict ok. */
export function logInputResult(field: IpField, original: string, r: IpResult, source: "server" | "worker" = "server") {
  if (r.verdict === "ok") return;
  const surface = EVENT_SURFACE[field];
  if (r.verdict === "rewritten") {
    emit({
      event_name: "ip_input_rewritten",
      source,
      props: { surface, detected_count: r.detected.length, detected_kinds: kindsOf(r), engine: r.engine, changed_chars: Math.abs(original.length - r.safeText.length) },
    });
  } else {
    emit({ event_name: "ip_input_blocked", source, props: { surface, detected_count: r.detected.length, detected_kinds: kindsOf(r), engine: r.engine } });
  }
}

export const OUTPUT_FLAGS = ["protected_character", "logo", "slogan", "licensed_merch", "lookalike_risk", "story_text"] as const;
export type OutputFlag = (typeof OUTPUT_FLAGS)[number];

export function logOutputFlagged(p: { pageId: string; flags: OutputFlag[]; lookalikeRisk?: number; isFinal: boolean }) {
  emit({ event_name: "ip_output_flagged", source: "worker", props: { page_id: p.pageId, flags: p.flags, ...(p.lookalikeRisk !== undefined ? { lookalike_risk: p.lookalikeRisk } : {}), is_final: p.isFinal } });
}

export function logOutputRerolled(p: { pageId: string; flags: OutputFlag[]; passedAfterReroll: boolean; costUsd?: number }) {
  emit({ event_name: "ip_output_rerolled", source: "worker", props: { page_id: p.pageId, flags: p.flags, passed_after_reroll: p.passedAfterReroll, ...(p.costUsd !== undefined ? { cost_usd: p.costUsd } : {}) } });
}
