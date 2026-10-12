/**
 * GreetHub dynamic equity ("Grunt Fund", Slicing Pie method) calculation module.
 * Pure functions, no I/O. Modelling only, not legal or tax advice. See docs/equity/01-model-spec.md.
 * Only humans are Person records; AI agents never earn slices.
 */

export type EntryStatus = "logged" | "approved" | "rejected";
export type IdeaStatus = "proposed" | "adopted" | "shipped";
export type LeaverType = "none" | "quit_no_good_reason" | "fired_good_reason" | "fired_no_good_reason" | "quit_good_reason";

export interface Person {
  id: string;
  name: string;
  /** Fair-market hourly base rate in dollars, set once per person by the owner. */
  hourlyRate: number;
  leaver?: LeaverType;
}

interface BaseEntry {
  id: string;
  personId: string;
  date: string; // ISO yyyy-mm-dd
  status: EntryStatus;
  approvedBy?: string; // person id, must differ from personId
  note?: string;
}
export interface TimeEntry extends BaseEntry { hours: number; category: string }
export interface CashEntry extends BaseEntry { amount: number; kind: "cash" | "expense" }
/** Equipment, supplies, IP, facilities contributed without cash. Value is fair market value of use. */
export interface ResourceEntry extends BaseEntry { fairValue: number; description: string }

export interface IdeaScores { impact: number; originality: number; evidence: number } // each 0..5
export interface Idea {
  id: string;
  authorId: string;
  title: string;
  description: string;
  date: string;
  status: IdeaStatus;
  scores?: IdeaScores;
  reviewedBy?: string; // person id, must differ from authorId
  reviewNote?: string;
}

export interface LeaverRule {
  /** Share of earned non-cash slices kept (0..1). */
  nonCashKept: number;
  /** Multiplier applied to cash contributions after leaving (4 = keep full, 1 = cash at face value). */
  cashMultiplier: number;
}

export interface EquityConfig {
  nonCashMultiplier: number;
  cashMultiplier: number;
  /** Max slices one idea may award. */
  ideaCapPerIdea: number;
  /** Max total idea slices per person. */
  ideaCapPerPerson: number;
  /** Rubric weights, must be positive; normalised internally. */
  ideaWeights: IdeaScores;
  /** Statuses at which an idea award unlocks. */
  ideaUnlockStatuses: IdeaStatus[];
  /** Minimum weighted score (0..5) for any award. */
  ideaMinScore: number;
  leaverRules: Record<LeaverType, LeaverRule>;
}

export const DEFAULT_CONFIG: EquityConfig = {
  nonCashMultiplier: 2,
  cashMultiplier: 4,
  ideaCapPerIdea: 5000,
  ideaCapPerPerson: 20000,
  ideaWeights: { impact: 0.5, originality: 0.2, evidence: 0.3 },
  ideaUnlockStatuses: ["adopted", "shipped"],
  ideaMinScore: 2,
  // Defaults follow Moyer's published description; the exact treatment is for the attorney. See docs.
  leaverRules: {
    none: { nonCashKept: 1, cashMultiplier: 4 },
    fired_good_reason: { nonCashKept: 0, cashMultiplier: 1 },
    quit_no_good_reason: { nonCashKept: 0, cashMultiplier: 1 },
    fired_no_good_reason: { nonCashKept: 1, cashMultiplier: 4 },
    quit_good_reason: { nonCashKept: 1, cashMultiplier: 4 },
  },
};

export interface Ledgers {
  people: Person[];
  time: TimeEntry[];
  cash: CashEntry[];
  resources: ResourceEntry[];
  ideas: Idea[];
}

export interface PersonSlices {
  personId: string;
  name: string;
  timeSlices: number;
  cashSlices: number;
  resourceSlices: number;
  ideaSlices: number;
  total: number;
  percent: number; // 0..100
  hours: number;
  cashDollars: number;
}

export interface Split { people: PersonSlices[]; totalSlices: number; warnings: string[] }

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Entry counts only if approved by a different, known person. */
export function entryCounts(e: BaseEntry, people: Person[]): boolean {
  return e.status === "approved" && !!e.approvedBy && e.approvedBy !== e.personId && people.some((p) => p.id === e.approvedBy);
}

export function ideaScore(scores: IdeaScores, cfg: EquityConfig = DEFAULT_CONFIG): number {
  const w = cfg.ideaWeights;
  const sum = w.impact + w.originality + w.evidence;
  if (sum <= 0) return 0;
  const clamp = (n: number) => Math.min(5, Math.max(0, n));
  return (clamp(scores.impact) * w.impact + clamp(scores.originality) * w.originality + clamp(scores.evidence) * w.evidence) / sum;
}

/** Slice award for one idea; 0 until unlocked and reviewed by another person. */
export function ideaAward(idea: Idea, people: Person[], cfg: EquityConfig = DEFAULT_CONFIG): number {
  if (!cfg.ideaUnlockStatuses.includes(idea.status)) return 0;
  if (!idea.scores || !idea.reviewedBy || idea.reviewedBy === idea.authorId) return 0;
  if (!people.some((p) => p.id === idea.reviewedBy)) return 0;
  const s = ideaScore(idea.scores, cfg);
  if (s < cfg.ideaMinScore) return 0;
  return round2(cfg.ideaCapPerIdea * (s / 5));
}

export function computeSplit(l: Ledgers, cfg: EquityConfig = DEFAULT_CONFIG, asOf?: string): Split {
  const warnings: string[] = [];
  const inRange = (d: string) => !asOf || d <= asOf;
  const byId = new Map<string, PersonSlices>();
  for (const p of l.people) {
    byId.set(p.id, { personId: p.id, name: p.name, timeSlices: 0, cashSlices: 0, resourceSlices: 0, ideaSlices: 0, total: 0, percent: 0, hours: 0, cashDollars: 0 });
  }
  const person = (id: string) => l.people.find((p) => p.id === id);
  const rule = (id: string) => cfg.leaverRules[person(id)?.leaver ?? "none"];

  for (const e of l.time) {
    const p = person(e.personId), row = byId.get(e.personId);
    if (!p || !row) { warnings.push(`time ${e.id}: unknown person`); continue; }
    if (!inRange(e.date) || !entryCounts(e, l.people)) continue;
    if (e.hours <= 0 || p.hourlyRate < 0) { warnings.push(`time ${e.id}: invalid hours or rate`); continue; }
    row.hours += e.hours;
    row.timeSlices += e.hours * p.hourlyRate * cfg.nonCashMultiplier * rule(p.id).nonCashKept;
  }
  for (const e of l.cash) {
    const row = byId.get(e.personId);
    if (!row) { warnings.push(`cash ${e.id}: unknown person`); continue; }
    if (!inRange(e.date) || !entryCounts(e, l.people)) continue;
    if (e.amount <= 0) { warnings.push(`cash ${e.id}: invalid amount`); continue; }
    row.cashDollars += e.amount;
    const leaverRule = rule(e.personId);
    // Standard multiplier is cfg.cashMultiplier; a leaver rule can only lower it.
    row.cashSlices += e.amount * Math.min(cfg.cashMultiplier, leaverRule.cashMultiplier);
  }
  for (const e of l.resources) {
    const row = byId.get(e.personId);
    if (!row) { warnings.push(`resource ${e.id}: unknown person`); continue; }
    if (!inRange(e.date) || !entryCounts(e, l.people)) continue;
    if (e.fairValue <= 0) { warnings.push(`resource ${e.id}: invalid value`); continue; }
    row.resourceSlices += e.fairValue * cfg.nonCashMultiplier * rule(e.personId).nonCashKept;
  }
  for (const i of l.ideas) {
    const row = byId.get(i.authorId);
    if (!row) { warnings.push(`idea ${i.id}: unknown author`); continue; }
    if (!inRange(i.date)) continue;
    const award = ideaAward(i, l.people, cfg) * rule(i.authorId).nonCashKept;
    row.ideaSlices = Math.min(cfg.ideaCapPerPerson, row.ideaSlices + award);
  }

  const rows = [...byId.values()];
  for (const r of rows) {
    r.timeSlices = round2(r.timeSlices); r.cashSlices = round2(r.cashSlices);
    r.resourceSlices = round2(r.resourceSlices); r.ideaSlices = round2(r.ideaSlices);
    r.total = round2(r.timeSlices + r.cashSlices + r.resourceSlices + r.ideaSlices);
  }
  const totalSlices = round2(rows.reduce((a, r) => a + r.total, 0));
  for (const r of rows) r.percent = totalSlices > 0 ? Math.round((r.total / totalSlices) * 10000) / 100 : 0;
  return { people: rows, totalSlices, warnings };
}

export interface HistoryPoint { date: string; totalSlices: number; percents: Record<string, number> }

/** Split after each distinct contribution date (counted entries only). */
export function computeHistory(l: Ledgers, cfg: EquityConfig = DEFAULT_CONFIG): HistoryPoint[] {
  const dates = new Set<string>();
  for (const e of [...l.time, ...l.cash, ...l.resources]) if (entryCounts(e, l.people)) dates.add(e.date);
  for (const i of l.ideas) if (ideaAward(i, l.people, cfg) > 0) dates.add(i.date);
  return [...dates].sort().map((date) => {
    const s = computeSplit(l, cfg, date);
    return { date, totalSlices: s.totalSlices, percents: Object.fromEntries(s.people.map((p) => [p.personId, p.percent])) };
  });
}
