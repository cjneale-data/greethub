/** Date reading for the proof checker. Pure, no locale, no Date.now: callers pass "now". */

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
};
const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0, mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6,
};
export const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const WD = "(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|weds|wed|thurs|thur|thu|fri|sat)";
const MO = "(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept|sep|oct|nov|dec)";
const LEAD = `(?:\\b(?<wd>${WD})\\b\\.?[,\\s]*(?:the\\s+)?)?`;
const ORD = "(?:st|nd|rd|th)?";
const DATE_RE = new RegExp(
  `${LEAD}(?:` +
    `\\b(?<m1>${MO})\\b\\.?\\s+(?<d1>\\d{1,2})(?!\\d)${ORD}(?:,?\\s+(?<y1>(?:19|20)\\d{2})(?!\\d))?` +
    `|(?<![\\d/.\\-])(?<d2>\\d{1,2})${ORD}\\s+(?:of\\s+)?(?<m2>${MO})\\b\\.?(?:,?\\s+(?<y2>(?:19|20)\\d{2})(?!\\d))?` +
    `|(?<![\\d/.\\-])(?<a3>\\d{1,2})[/.\\-](?<b3>\\d{1,2})[/.\\-](?<y3>\\d{4}|\\d{2})(?![\\d/\\-])` +
  `)`,
  "gi",
);

export type FoundDate = {
  /** The text that matched, for messages. */
  text: string;
  /** 0-based month, day of month, and the year if the text gave one (two-digit years read as 20xx). */
  month: number;
  day: number;
  year?: number;
  /** 0 = Sunday, when the text names a weekday. */
  weekday?: number;
  /** False for "February 30": no such day in that year (or, with no year, in any year). */
  exists: boolean;
};

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month, day)).getUTCDay();
}

export function findDates(input: string): FoundDate[] {
  const text = input.replace(/\s+/g, " ");
  const out: FoundDate[] = [];
  for (const m of text.matchAll(DATE_RE)) {
    const g = m.groups!;
    let month: number, day: number, year: number | undefined;
    if (g.m1) { month = MONTHS[g.m1.toLowerCase()]; day = +g.d1; year = g.y1 ? +g.y1 : undefined; }
    else if (g.m2) { month = MONTHS[g.m2.toLowerCase()]; day = +g.d2; year = g.y2 ? +g.y2 : undefined; }
    else {
      let a = +g.a3, b = +g.b3; // US order month/day; day-first only when the first number cannot be a month
      if (a > 12 && b <= 12) [a, b] = [b, a];
      month = a - 1; day = b;
      year = g.y3.length === 2 ? 2000 + +g.y3 : +g.y3;
    }
    if (month < 0 || month > 11 || day < 1) continue; // "13/45/26" is not a date at all
    const exists = day <= daysInMonth(year ?? 2024, month);
    const found: FoundDate = { text: m[0].trim(), month, day, year, exists };
    if (g.wd) found.weekday = WEEKDAYS[g.wd.toLowerCase()];
    out.push(found);
  }
  return out;
}

/** Years written in the text: 1900-2099, plus apostrophe years like '26. */
export function findYears(text: string): number[] {
  const years = new Set<number>();
  for (const m of text.matchAll(/(?<![\d])((?:19|20)\d{2})(?![\d])/g)) years.add(+m[1]);
  for (const m of text.matchAll(/(?<![\w])['’](\d{2})(?![\d])/g)) years.add(2000 + +m[1]);
  return [...years];
}
