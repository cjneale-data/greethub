import { describe, expect, it } from "vitest";
import fixtures from "./fixtures/ip-redteam.json";
import { fastScreen } from "@/lib/safety/fastpass";
import type { IpField } from "@/lib/safety/types";

type Case = { id: string; cat: string; field: IpField; text: string; expect: "ok" | "rewritten" | "blocked"; mock?: boolean; no?: string[]; keep?: string[]; knownNames?: string[]; history?: string[] };
const cases = fixtures.cases as Case[];
const run = (c: Case) => fastScreen({ text: c.text, field: c.field, knownNames: c.knownNames, history: c.history });

describe("red-team set (free rules / mock)", () => {
  it("has at least 80 adversarial inputs", () => {
    expect(cases.length).toBeGreaterThanOrEqual(80);
  });

  for (const c of cases.filter((x) => x.mock || x.expect === "ok")) {
    it(`${c.id} [${c.expect}] ${c.text.slice(0, 50)}`, () => {
      const r = run(c);
      expect(r.verdict).toBe(c.expect);
      const low = r.safeText.toLowerCase();
      for (const s of c.no ?? []) expect(low).not.toContain(s.toLowerCase());
      for (const s of c.keep ?? []) expect(r.safeText).toContain(s);
      if (c.expect !== "ok") expect(r.userNote.length).toBeGreaterThan(0);
    });
  }

  it("benign set: zero false positives; rules recall on mock-tagged cases is 100%", () => {
    const benign = cases.filter((c) => c.expect === "ok");
    expect(benign.filter((c) => run(c).verdict !== "ok")).toEqual([]);
    const tagged = cases.filter((c) => c.mock);
    expect(tagged.filter((c) => run(c).verdict === "ok").map((c) => c.id)).toEqual([]);
  });
});
