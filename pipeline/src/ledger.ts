import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

export type LedgerEntry = {
  ts: string;
  runId: string;
  stage: string; // identity | modelsheet | story | prompts | render | qa | ...
  label: string; // page id etc.
  model: string;
  kind: "text" | "image";
  imageSize?: string;
  attempt: number;
  status: "ok" | "http_error" | "network_error" | "no_image" | "mock";
  httpStatus?: number;
  promptTokens?: number;
  completionTokens?: number;
  imageTokens?: number;
  /** USD. Source says where the number came from. */
  costUsd: number;
  costSource: "openrouter_usage" | "computed" | "none";
  ms: number;
};

export interface CostLedger {
  record(entry: LedgerEntry): void;
  entries(): LedgerEntry[];
  totalUsd(): number;
}

/** Append-only JSON-lines ledger on disk (the Supabase cost_ledger table mirrors these columns). */
export class FileLedger implements CostLedger {
  constructor(private path: string) {
    mkdirSync(dirname(path), { recursive: true });
  }
  record(entry: LedgerEntry): void {
    appendFileSync(this.path, JSON.stringify(entry) + "\n", "utf8");
  }
  entries(): LedgerEntry[] {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((l) => JSON.parse(l) as LedgerEntry);
  }
  totalUsd(): number {
    return this.entries().reduce((a, e) => a + e.costUsd, 0);
  }
}

export class MemoryLedger implements CostLedger {
  private list: LedgerEntry[] = [];
  record(e: LedgerEntry) {
    this.list.push(e);
  }
  entries() {
    return this.list;
  }
  totalUsd() {
    return this.list.reduce((a, e) => a + e.costUsd, 0);
  }
}

/** Throws before a call when a hard spend cap would be exceeded. Used for the test budget and per-user caps. */
export class SpendCapExceeded extends Error {}
export function assertUnderCap(ledger: CostLedger, capUsd: number | undefined) {
  if (capUsd !== undefined && ledger.totalUsd() >= capUsd) {
    throw new SpendCapExceeded(`Spend cap $${capUsd.toFixed(2)} reached ($${ledger.totalUsd().toFixed(4)} spent)`);
  }
}
