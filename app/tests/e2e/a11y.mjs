// Accessibility sweep of the public pages: axe-core (WCAG 2.x A/AA rules) plus a keyboard Tab walk.
//   node tests/e2e/a11y.mjs            (BASE_URL defaults to http://localhost:3101; OUT defaults to the OS temp dir)
// Exit 1 on any critical axe violation or a keyboard trap. Serious and lower are reported, not failed, until the
// backlog in docs/PLAN.md (QA) is cleared; set A11Y_STRICT=1 to fail on serious too.
// Signed-in pages (checkout, account, book steps) are scanned inside launch-flow.mjs.
import { chromium } from "playwright";
import { BASE_URL, VIEWPORTS, outDir, axe, contextOptions, warmup, writeJson } from "./_lib.mjs";

const OUT = outDir("a11y");
const PAGES = ["/", "/browse", "/pricing", "/faq", "/create/card", "/create/book", "/signup", "/login", "/cart", "/privacy", "/terms", "/refunds", "/accessibility", "/report"];
const fail = [];
const report = {};

await warmup(PAGES);
const browser = await chromium.launch();
for (const [vp, size] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext(contextOptions(size));
  for (const path of PAGES) {
    const page = await ctx.newPage();
    await page.goto(BASE_URL + path, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Reject" }).click({ timeout: 1500 }).catch(() => {});
    const violations = await axe(page);

    // Keyboard walk: Tab through the page and record where focus goes and whether it is visible.
    const stops = [];
    let trapped = false;
    for (let i = 0; i < 80; i++) {
      await page.keyboard.press("Tab");
      const f = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        if (el.tagName === "NEXTJS-PORTAL") return { tag: "dev-overlay", name: "", ring: true, visible: true, devOnly: true };
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none");
        const name = (el.getAttribute("aria-label") || el.textContent || el.getAttribute("placeholder") || "").trim().replace(/\s+/g, " ").slice(0, 40);
        return { tag: el.tagName.toLowerCase(), name, ring, visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden" };
      });
      if (!f && i < 3) continue; // focus can sit on <body> after the cookie notice closes
      if (!f) break;
      if (f.devOnly) continue; // the next dev error overlay takes a tab stop; it does not exist in production
      const key = `${f.tag}:${f.name}`;
      if (stops.length > 3 && stops.slice(-3).every((s) => `${s.tag}:${s.name}` === key)) {
        trapped = true;
        break;
      }
      stops.push(f);
    }
    const noRing = stops.filter((s) => s.visible && !s.ring).map((s) => `${s.tag}:${s.name}`);
    const hidden = stops.filter((s) => !s.visible).map((s) => `${s.tag}:${s.name}`);
    report[`${vp} ${path}`] = { violations, tabStops: stops.length, noFocusRing: noRing, focusOnHidden: hidden, trapped };

    const crit = violations.filter((v) => v.impact === "critical" || (process.env.A11Y_STRICT === "1" && v.impact === "serious"));
    if (crit.length) fail.push(`${vp} ${path}: ${crit.map((v) => v.id).join(", ")}`);
    if (trapped) fail.push(`${vp} ${path}: keyboard trap`);
    console.log(`${vp.padEnd(7)} ${path.padEnd(15)} axe ${violations.length} (${violations.map((v) => `${v.id}:${v.impact}`).join(" ") || "none"}) | tab stops ${stops.length}, no ring ${noRing.length}, hidden ${hidden.length}${trapped ? " TRAP" : ""}`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
writeJson(OUT, "a11y.json", report);
if (fail.length) {
  console.log("\nFAIL:\n  " + fail.join("\n  "));
  process.exit(1);
}
console.log("\nA11Y OK (no critical violations, no keyboard traps)");
