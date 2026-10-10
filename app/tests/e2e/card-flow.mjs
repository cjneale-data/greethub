// Headless drive of the guest card flow in mock mode.
//   GREETHUB_MOCK_AI=1 npx next dev -p 3101   then   node tests/e2e/card-flow.mjs [shotsDir]
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3101";
const shots = process.argv[2] ?? "e2e-shots";
mkdirSync(shots, { recursive: true });
const browser = await chromium.launch();
const log = (m) => console.log(m);
const must = (cond, msg) => {
  if (!cond) throw new Error("FAIL: " + msg);
  log("ok: " + msg);
};

async function run(name, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${base}/create/card`);
  await page.getByText("Let's make a card").first().waitFor();
  await page.screenshot({ path: join(shots, `${name}-1-empty.png`), fullPage: true });
  must(await page.getByTestId("make-preview").isDisabled(), `${name}: make preview disabled when empty`);

  const say = async (text) => {
    await page.getByLabel("Say anything").fill(text);
    await page.getByRole("button", { name: "Send" }).click();
    await page.getByRole("log").getByText(text, { exact: true }).first().waitFor();
    await page.waitForFunction(() => !document.querySelector('[aria-label="The guide is typing"]'));
  };
  await say("It's for my mum, Rosa, her birthday");
  await page.getByText("What should it feel like?").first().waitFor();
  await page.getByRole("group", { name: "Quick replies" }).getByRole("button", { name: "Heartfelt" }).click();
  await page.getByText("Pick a look.").first().waitFor();
  await page.getByRole("group", { name: "Quick replies" }).getByRole("button", { name: "Soft Watercolor" }).click();
  await page.getByText("What should the picture show?").first().waitFor();
  await page.screenshot({ path: join(shots, `${name}-2-chat.png`), fullPage: true });

  // copyright guardrail
  await say("Meeko the raccoon in her garden");
  await page.getByText("I can't draw Meeko").first().waitFor();
  await page.screenshot({ path: join(shots, `${name}-3-guardrail.png`), fullPage: true });
  await page.getByRole("button", { name: "Yes, do that" }).click();
  await page.getByText("What do you want to say inside?").first().waitFor();
  await page.getByRole("button", { name: "Write it for me" }).first().click();
  await page.getByText("Here's a draft").first().waitFor();

  // form mode edits the same brief
  await page.getByRole("tab", { name: "Form" }).click();
  await page.screenshot({ path: join(shots, `${name}-4-form.png`), fullPage: true });
  await page.getByRole("tab", { name: "Chat" }).click();

  const make = page.getByTestId("make-preview");
  must(await make.isEnabled(), `${name}: make preview enabled once brief is complete`);
  await make.click();
  await page.getByText("Drawing Rosa's card").waitFor();
  await page.screenshot({ path: join(shots, `${name}-5-rendering.png`), fullPage: true });
  await page.getByTestId("preview-card").waitFor({ timeout: 30000 });
  await page.screenshot({ path: join(shots, `${name}-6-preview-front.png`), fullPage: true });
  await page.getByTestId("preview-card").click();
  await page.waitForTimeout(800);
  must((await page.getByTestId("preview-card").getAttribute("data-side")) === "inside", `${name}: card flips to inside`);
  await page.screenshot({ path: join(shots, `${name}-7-preview-inside.png`), fullPage: true });

  await page.getByRole("button", { name: "Re-roll" }).click();
  await page.getByText("Accounts get re-rolls every month").waitFor();
  await page.screenshot({ path: join(shots, `${name}-8-upgrade.png`), fullPage: true });
  await page.getByRole("button", { name: "Not now" }).click();

  // draft survives reload, and the second preview is refused by the server
  await page.reload();
  await page.getByTestId("preview-card").waitFor();
  must(true, `${name}: preview restored from localStorage`);
  must(errors.length === 0, `${name}: no console errors ${errors.join(" | ").slice(0, 300)}`);
  const second = await page.evaluate(async () => {
    const stored = JSON.parse(localStorage.getItem("greethub.guestCardDraft.v1"));
    const r = await fetch("/api/card/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: stored.draft }) });
    return { status: r.status, body: await r.json() };
  });
  must(second.status === 403 && second.body.error === "guest_limit", `${name}: second preview refused (${second.status})`);
  const photo = await page.evaluate(async () => (await fetch("/api/card/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: {}, characters: [{ photoIds: ["x"] }] }) })).status);
  must(photo === 403, `${name}: guest photo refused`);
  await ctx.close();
}

try {
  await run("desktop", { width: 1280, height: 900 });
  await run("mobile", { width: 390, height: 844 });
  log("ALL OK");
} finally {
  await browser.close();
}
