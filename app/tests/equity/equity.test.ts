import { describe, it, expect } from "vitest";
import { computeSplit, computeHistory, ideaAward, DEFAULT_CONFIG, type Ledgers } from "@/lib/equity";

const people = [
  { id: "a", name: "Demo Alex", hourlyRate: 50 },
  { id: "b", name: "Demo Blake", hourlyRate: 100 },
  { id: "c", name: "Demo Casey", hourlyRate: 40 },
];
const empty = (): Ledgers => ({ people: structuredClone(people), time: [], cash: [], resources: [], ideas: [] });
const t = (id: string, personId: string, hours: number, approvedBy?: string, date = "2026-01-01") => ({
  id, personId, date, hours, category: "build", status: approvedBy ? ("approved" as const) : ("logged" as const), approvedBy,
});

describe("equity", () => {
  it("zero total gives 0 percent and no NaN", () => {
    const s = computeSplit(empty());
    expect(s.totalSlices).toBe(0);
    expect(s.people.every((p) => p.percent === 0)).toBe(true);
  });
  it("first entry takes 100 percent: 10h x $50 x 2 = 1000", () => {
    const l = empty(); l.time.push(t("1", "a", 10, "b"));
    const s = computeSplit(l);
    expect(s.people[0].timeSlices).toBe(1000);
    expect(s.people[0].percent).toBe(100);
  });
  it("logged-only and self-approved entries do not count", () => {
    const l = empty(); l.time.push(t("1", "a", 10), t("2", "a", 10, "a"));
    expect(computeSplit(l).totalSlices).toBe(0);
  });
  it("cash-only partner earns 4x", () => {
    const l = empty();
    l.cash.push({ id: "c1", personId: "c", date: "2026-01-02", amount: 1000, kind: "cash", status: "approved", approvedBy: "a" });
    const s = computeSplit(l);
    expect(s.people[2].cashSlices).toBe(4000);
    expect(s.people[2].percent).toBe(100);
  });
  it("mixed split sums to 100", () => {
    const l = empty();
    l.time.push(t("1", "a", 10, "b"), t("2", "b", 5, "a"));
    l.cash.push({ id: "c1", personId: "c", date: "2026-01-02", amount: 500, kind: "expense", status: "approved", approvedBy: "a" });
    const s = computeSplit(l);
    expect(s.totalSlices).toBe(1000 + 1000 + 2000);
    expect(s.people.reduce((a, p) => a + p.percent, 0)).toBeCloseTo(100, 1);
  });
  it("bad leaver forfeits time and drops cash to 1x; no-good-reason firing keeps", () => {
    const l = empty(); l.people[0].leaver = "quit_no_good_reason";
    l.time.push(t("1", "a", 10, "b"));
    l.cash.push({ id: "c1", personId: "a", date: "2026-01-02", amount: 1000, kind: "cash", status: "approved", approvedBy: "b" });
    let s = computeSplit(l);
    expect(s.people[0].timeSlices).toBe(0);
    expect(s.people[0].cashSlices).toBe(1000);
    l.people[0].leaver = "fired_no_good_reason";
    s = computeSplit(l);
    expect(s.people[0].total).toBe(1000 + 4000);
  });
  it("leaver rules are configurable", () => {
    const l = empty(); l.people[0].leaver = "quit_no_good_reason";
    l.time.push(t("1", "a", 10, "b"));
    const cfg = { ...DEFAULT_CONFIG, leaverRules: { ...DEFAULT_CONFIG.leaverRules, quit_no_good_reason: { nonCashKept: 0.5, cashMultiplier: 1 } } };
    expect(computeSplit(l, cfg).people[0].timeSlices).toBe(500);
  });
  it("idea awards need unlock, other-person review and respect caps", () => {
    const idea = {
      id: "i", authorId: "a", title: "x", description: "x", date: "2026-02-01", status: "proposed" as const,
      scores: { impact: 5, originality: 5, evidence: 5 }, reviewedBy: "b",
    };
    expect(ideaAward(idea, people)).toBe(0);
    expect(ideaAward({ ...idea, status: "shipped" }, people)).toBe(5000);
    expect(ideaAward({ ...idea, status: "shipped", reviewedBy: "a" }, people)).toBe(0);
    expect(ideaAward({ ...idea, status: "shipped", scores: { impact: 1, originality: 1, evidence: 1 } }, people)).toBe(0);
    const l = empty();
    l.ideas = Array.from({ length: 6 }, (_, k) => ({ ...idea, id: "i" + k, status: "shipped" as const }));
    expect(computeSplit(l).people[0].ideaSlices).toBe(20000);
  });
  it("history changes as entries arrive", () => {
    const l = empty();
    l.time.push(t("1", "a", 10, "b", "2026-01-01"), t("2", "b", 10, "a", "2026-02-01"));
    const h = computeHistory(l);
    expect(h).toHaveLength(2);
    expect(h[0].percents.a).toBe(100);
    expect(h[1].percents.a).toBeCloseTo(33.33, 1);
  });
  it("flags unknown people and bad values", () => {
    const l = empty(); l.time.push(t("1", "zzz", 1, "a"), t("2", "a", -1, "b"));
    expect(computeSplit(l).warnings.length).toBe(2);
  });
  it("only the unpaid part of time earns slices, and repaid cash earns none", () => {
    const l = empty();
    l.time.push({ ...t("1", "a", 10, "b"), paidAmount: 125 }); // 10h x $50 = $500, $125 paid -> 375 x 2
    l.time.push({ ...t("2", "b", 1, "a"), paidAmount: 500 }); // paid more than value -> 0, never negative
    l.cash.push({ id: "c1", personId: "c", date: "2026-01-02", amount: 1000, reimbursed: 400, kind: "expense", status: "approved", approvedBy: "a" });
    const s = computeSplit(l);
    expect(s.people[0].timeSlices).toBe(750);
    expect(s.people[1].timeSlices).toBe(0);
    expect(s.people[2].cashSlices).toBe(2400);
    expect(s.people[2].cashDollars).toBe(600);
  });
  it("NaN or non-finite values are rejected, not summed", () => {
    const l = empty(); l.time.push(t("1", "a", Number.NaN, "b"));
    l.cash.push({ id: "c1", personId: "c", date: "2026-01-02", amount: Number.POSITIVE_INFINITY, kind: "cash", status: "approved", approvedBy: "a" });
    const s = computeSplit(l);
    expect(s.totalSlices).toBe(0);
    expect(s.warnings.length).toBe(2);
  });
  it("duplicate entry ids are flagged", () => {
    const l = empty(); l.time.push(t("1", "a", 1, "b"), t("1", "a", 1, "b"));
    expect(computeSplit(l).warnings).toContain("time 1: duplicate id");
  });
  it("idea award is dated at unlock, not at proposal", () => {
    const l = empty();
    l.time.push(t("1", "b", 10, "a", "2026-01-01"));
    l.ideas.push({ id: "i", authorId: "a", title: "x", description: "x", date: "2026-01-01", unlockedDate: "2026-03-01",
      status: "shipped", scores: { impact: 5, originality: 5, evidence: 5 }, reviewedBy: "b" });
    const h = computeHistory(l);
    expect(h.map((p) => p.date)).toEqual(["2026-01-01", "2026-03-01"]);
    expect(h[0].percents.a).toBe(0);
    expect(h[1].percents.a).toBeGreaterThan(0);
  });
});
