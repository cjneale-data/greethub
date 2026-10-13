// The stop-condition walk (docs/PLAN.md, steps 1-7) in one browser session, as a new visitor would do it.
//
// Local, mock mode (free, no keys; see the header of docs/qa/README.md for the full command):
//   GREETHUB_MOCK_AI=1 GREETHUB_DATA_DIR=<scratch dir> npx next dev -p 3101
//   node tests/e2e/launch-flow.mjs [desktop|mobile]
// Preview URL:
//   BASE_URL=https://<preview>.vercel.app VERCEL_AUTOMATION_BYPASS_SECRET=... STRICT=1 node tests/e2e/launch-flow.mjs
//
// Hard failures throw and exit 1. Known product gaps (no signed-in card path, guest drafts not carried over, no
// sandbox print submission yet) print as GAP and only fail with STRICT=1. The done gate in PLAN.md is STRICT=1
// passing against the preview URL with real Stripe test mode and printer sandboxes.
import { BASE_URL, IS_LOCAL, VIEWPORTS, outDir, axe, collectErrors, contextOptions, makeReporter, shotter, syntheticPhoto, warmup, writeJson } from "./_lib.mjs";
import { chromium } from "playwright";

const mode = process.argv[2] === "mobile" ? "mobile" : "desktop";
const OUT = outDir("launch");
const { must, gap, step, results } = makeReporter(mode);
const email = `qa-launch-${Date.now()}@example.com`; // example.com never receives mail
const a11y = {};

await warmup(["/", "/create/card", "/login", "/signup", "/account/drafts", "/create/book", "/cart", "/checkout", "/orders", "/account", "/account/addresses", "/account/people", "/account/delete", "/api/book/session"]);

const browser = await chromium.launch();
const ctx = await browser.newContext(contextOptions(VIEWPORTS[mode]));
ctx.setDefaultTimeout(30_000);
const page = await ctx.newPage();
const errors = collectErrors(page);
const shot = shotter(page, OUT, mode);
const scan = async (label) => {
  a11y[label] = await axe(page);
  const serious = a11y[label].filter((v) => v.impact === "serious" || v.impact === "critical");
  console.log(`axe ${label}: ${a11y[label].length} violations (${serious.length} serious/critical)${serious.length ? " " + serious.map((v) => v.id).join(",") : ""}`);
};

try {
  /* ---------- 1. guest card preview ---------- */
  step("1. guest tries the card creator");
  await page.goto(`${BASE_URL}/create/card`);
  await page.getByRole("button", { name: "Reject" }).click({ timeout: 3000 }).catch(() => {});
  await page.getByText("Let's make a card").first().waitFor();
  const say = async (text) => {
    await page.getByLabel("Say anything").fill(text);
    await page.getByRole("button", { name: "Send" }).click();
    await page.getByRole("log").getByText(text, { exact: true }).first().waitFor();
    await page.waitForFunction(() => !document.querySelector('[aria-label="The guide is typing"]'));
  };
  await say("It's for my friend Maria, her birthday");
  await page.getByRole("group", { name: "Quick replies" }).getByRole("button", { name: "Heartfelt" }).click();
  await page.getByRole("group", { name: "Quick replies" }).getByRole("button", { name: "Soft Watercolor" }).click();
  await page.getByText("What should the picture show?").first().waitFor();
  await say("Maria in her garden with her little dog Biscuit");
  await page.getByText("What do you want to say inside?").first().waitFor();
  await page.getByRole("button", { name: "Write it for me" }).first().click();
  await page.getByText("Here's a draft").first().waitFor();
  await scan("card-brief");
  await page.getByTestId("make-preview").click();
  await page.getByTestId("preview-card").waitFor({ timeout: 90_000 });
  must(/low-resolution preview/i.test((await page.getByTestId("preview-card").locator("img").first().getAttribute("alt")) ?? ""), "guest preview shown, labelled low resolution");
  await shot("guest-preview");
  await scan("card-preview");

  /* ---------- 2. sign up; guest draft carries over ---------- */
  step("2. sign up from the card creator");
  await page.getByRole("button", { name: "Looks good" }).click();
  await page.getByRole("link", { name: "Make a free account" }).click();
  await page.waitForURL(/\/(login|signup)/);
  if (/\/login/.test(page.url())) {
    // older builds: the card modal said "Make a free account" but landed on the sign-in page (fixed by Head of CX, 2026-10-12)
    await page.getByRole("link", { name: "Make a free account" }).filter({ visible: true }).click();
    await page.waitForURL(/\/signup/);
  }
  // Next 16 (cacheComponents) keeps the previous route mounted but hidden (React Activity), so the sign-in form
  // is still in the DOM here. Only touch visible elements.
  await page.getByRole("heading", { name: "Make a free account" }).waitFor();
  await page.getByLabel("Email").filter({ visible: true }).fill(email);
  await page.getByLabel(/18 or older/).filter({ visible: true }).check();
  await shot("signup");
  await scan("signup");
  await page.getByRole("button", { name: "Email me a sign-in link" }).filter({ visible: true }).click();
  if (IS_LOCAL) {
    await page.getByTestId("dev-link").filter({ visible: true }).click();
  } else {
    throw new Error("Preview sign-in needs a test inbox (magic link) or Supabase test user; not built yet. See docs/PLAN.md QA.");
  }
  // Match the pathname: the sign-up URL itself carries ?next=/create/card, which a plain regex matches too early.
  await page.waitForURL((u) => u.pathname === "/create/card");
  const me = await (await page.request.get(`${BASE_URL}/api/account/profile`)).json().catch(() => ({}));
  must(JSON.stringify(me).includes(email), "signed in as the new account");
  await page.goto(`${BASE_URL}/account/drafts`);
  await page.waitForLoadState("networkidle");
  gap(!(await page.getByText("Nothing saved yet").isVisible()), "guest card draft carried over to Account > Drafts");
  await shot("drafts-after-signup");

  /* ---------- 3. signed-in card: approve and see the proof ---------- */
  step("3. signed-in card approval");
  await page.goto(`${BASE_URL}/create/card`);
  await page.getByTestId("preview-card").waitFor();
  await page.getByRole("button", { name: "Looks good" }).click();
  const walled = await page.getByRole("link", { name: "Make a free account" }).isVisible().catch(() => false);
  gap(!walled, "signed-in 'Looks good' opens a card approval/proof, not the sign-up wall");
  if (walled) await page.getByRole("button", { name: "Not now" }).click();
  await shot("card-signed-in");
  // Stand-in until the account card path exists: the same cart call the demo button makes.
  const cardAdd = await page.request.post(`${BASE_URL}/api/cart`, { data: { kind: "card", creationId: "demo-card-rosa", title: "Maria's card", recipientName: "Maria", format: "mailed", mailTo: "recipient" } });
  must(cardAdd.ok(), `card line added to the cart (stand-in, ${cardAdd.status()})`);

  /* ---------- 4. picture book ---------- */
  step("4. picture book: brief, photos, story, sheet, pages, proof");
  await page.goto(`${BASE_URL}/create/book`);
  await page.getByTestId("book-creator").waitFor();
  const bookSession = await (await page.request.get(`${BASE_URL}/api/book/session`)).json();
  must(bookSession.signedIn, "book creator sees the shop sign-in");
  if (IS_LOCAL) must(bookSession.mock, "book in mock mode locally (placeholder art, no cost)");
  await page.getByRole("button", { name: "Birthday", exact: true }).click();
  await page.getByLabel("Who is the book for?").fill("Lily");
  await page.getByLabel("They are your...").fill("niece");
  await page.getByRole("button", { name: "3 to 5", exact: true }).click();
  await page.getByRole("button", { name: "Adventurous", exact: true }).click();
  await page.locator('[data-testid^="style-"][role="radio"]').first().click();
  await page.getByLabel(/A real memory, an adventure/).fill("Lily and her grandpa look for a kite that blew into the big oak tree.");
  const p1 = page.getByTestId("char-0");
  await p1.getByLabel("Name").fill("Lily");
  await p1.getByRole("button", { name: "Child", exact: true }).click();
  await p1.getByRole("button", { name: "Hero", exact: true }).click();
  await page.getByRole("button", { name: "+ Add another person" }).click();
  const p2 = page.getByTestId("char-1");
  await p2.getByLabel("Name").fill("Grandpa Joe");
  await p2.getByRole("button", { name: "Older adult", exact: true }).click();
  await p2.getByRole("button", { name: "Grandparent", exact: true }).click();
  await shot("book-brief");
  await scan("book-brief");
  await page.getByTestId("brief-continue").click();
  await page.locator('[data-step="photos"]').waitFor();

  must(await page.getByTestId("consent-save").isDisabled(), "photo upload blocked until the two consent boxes are ticked");
  await page.locator("#consent-a").check();
  await page.locator("#consent-b").check();
  await page.getByTestId("consent-save").click();
  await page.getByTestId("consent-saved").waitFor();
  for (const i of [0, 1]) {
    await page.getByTestId(`file-${i}`).setInputFiles({ name: `synthetic-${i}.jpg`, mimeType: "image/jpeg", buffer: await syntheticPhoto(i) });
    await page.getByTestId(`photos-${i}`).locator("img").first().waitFor();
  }
  await shot("book-photos");
  await scan("book-photos");
  await page.getByTestId("photos-continue").click();

  await page.getByTestId("story-editor").waitFor({ timeout: 60_000 });
  await shot("book-story");
  await page.getByTestId("approve-story").click();
  await page.getByTestId("sheet-image").waitFor({ timeout: 60_000 });
  await shot("book-sheet");
  await scan("book-sheet");
  await page.getByTestId("approve-sheet").click();
  await page.getByTestId("render-step").waitFor();
  await page.getByTestId("view-proof").waitFor({ timeout: 180_000 });
  await shot("book-rendered");
  await page.getByTestId("view-proof").click();
  await page.getByTestId("proof-step").waitFor();
  await page.getByTestId("next").click();
  must((await page.getByTestId("spread-text").innerText()).trim().length > 0, "proof page 1 has story text");
  await shot("book-proof");
  await scan("book-proof");
  await page.locator("#ack").check();
  await page.getByTestId("add-to-cart").click();
  await page.getByTestId("approved").waitFor({ timeout: 60_000 });
  await page.getByTestId("add-to-cart-after").click();
  await page.waitForURL(/\/cart/);

  /* ---------- 5. cart, address, pay ---------- */
  step("5. cart and checkout");
  await page.getByText("Order summary").waitFor();
  const cart = await (await page.request.get(`${BASE_URL}/api/cart`)).json();
  const kinds = (cart.cart?.items ?? cart.items ?? []).map((i) => i.kind).sort();
  must(kinds.join(",") === "book,card", `cart holds the book and the card (${kinds.join(",")})`);
  await shot("cart");
  await scan("cart");
  await page.getByRole("button", { name: "Checkout" }).click();
  await page.waitForURL(/\/checkout/);
  await page.getByText("Where is it going? To you").waitFor();
  for (const [k, v] of Object.entries({ name: "Sam Rivera", line1: "99 Oak Ave", city: "Albany", region: "NY", postalCode: "12207" })) await page.locator(`[name="buyer-${k}"]`).fill(v);
  const other = page.locator('section[aria-label^="Where is it going? To Maria"]');
  for (const [k, v] of Object.entries({ name: "Maria Lopez", line1: "12 Elm St", city: "Albany", region: "NY", postalCode: "12208" })) await other.locator(`input[name$='-${k}']`).fill(v);
  for (const t of await page.getByRole("switch", { name: "Save this address" }).filter({ visible: true }).all()) await t.click();
  await page.getByLabel(/approve this proof/).check();
  await shot("checkout");
  await scan("checkout");
  await page.getByRole("button", { name: "Continue to payment" }).click();
  if (IS_LOCAL) {
    await page.getByText("Test payment").waitFor();
    await page.getByRole("button", { name: /Pay with test card/ }).click();
  } else {
    // Stripe Checkout (test mode): 4242 card. Field names are Stripe's; verify on the first preview run.
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 });
    await page.getByLabel(/Card number/i).fill("4242 4242 4242 4242");
    await page.getByLabel(/Expiration/i).fill("12 / 34");
    await page.getByLabel(/CVC/i).fill("123");
    await page.getByRole("button", { name: /Pay/ }).click();
  }
  await page.getByText(/We're on it/).waitFor({ timeout: 60_000 });
  await shot("confirmation");

  /* ---------- 6. email, print submission, tracking ---------- */
  step("6. confirmation email, print orders, tracking");
  if (IS_LOCAL) {
    const box = await (await page.request.get(`${BASE_URL}/api/dev/outbox`)).json();
    must(box.messages.some((m) => m.to === email && m.tag === "order_confirmed"), "order confirmation email sent");
  }
  await page.getByRole("link", { name: "Track this order" }).click();
  await page.getByText("What's in it").waitFor();
  const orderId = page.url().split("/orders/")[1]?.split(/[?#]/)[0];
  const order = (await (await page.request.get(`${BASE_URL}/api/orders/${orderId}`)).json()).order ?? {};
  const lines = order.items ?? [];
  must(lines.length === 2, `order has 2 lines (${lines.length})`);
  gap(lines.every((l) => l.status !== "needs_attention"), `every line submitted to a printer (${lines.map((l) => l.status).join(",")})`);
  gap(!IS_LOCAL, "print orders went to the Lulu and Prodigi sandboxes (local run uses the fake printer)");
  if (IS_LOCAL) {
    for (let i = 0; i < 3; i++) {
      await page.getByTestId("advance").click({ timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(700);
    }
  }
  await page.getByText("Tracking").first().waitFor();
  await shot("order-tracking");
  await scan("order");
  await page.goto(`${BASE_URL}/orders`);
  await page.getByRole("link").filter({ hasText: /order/i }).first().waitFor();

  /* ---------- 7. account ---------- */
  step("7. account: profile, addresses, drafts, orders, people, delete");
  await page.goto(`${BASE_URL}/account`);
  await page.getByLabel("First name").fill("Sam");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByText("Saved.").first().waitFor();
  await scan("account");
  await page.goto(`${BASE_URL}/account/addresses`);
  await page.getByText(/Maria Lopez/).filter({ visible: true }).first().waitFor();
  must(await page.getByText(/Sam Rivera/).filter({ visible: true }).first().isVisible(), "both addresses saved to the address book");
  await page.goto(`${BASE_URL}/account/drafts`);
  await page.waitForLoadState("networkidle");
  await shot("account-drafts");
  await page.goto(`${BASE_URL}/account/people`);
  await page.getByRole("button", { name: "+ Add a person" }).click();
  await page.getByLabel("Name").fill("Grandpa Joe");
  await page.getByLabel("Relationship").fill("Grandpa");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByText("Grandpa Joe").first().waitFor();
  await scan("account-people");
  const exp = await page.request.get(`${BASE_URL}/api/account/export`);
  const expText = await exp.text();
  must(exp.ok() && expText.includes(email), "data export downloads");
  gap(/"(bookProjects|books|projects)"/.test(expText), "export includes book projects and consent records (legal req 28)");

  await page.goto(`${BASE_URL}/account/delete`);
  await page.getByLabel("Type DELETE to confirm").fill("DELETE");
  await page.getByText("I know my open order").click({ timeout: 3000 }).catch(() => {});
  await scan("account-delete");
  await page.getByRole("button", { name: "Delete my account" }).click();
  await page.getByRole("button", { name: "Email me the link" }).click();
  if (!IS_LOCAL) throw new Error("Preview account deletion needs the test inbox; not built yet.");
  await page.getByTestId("delete-link").click();
  await page.getByTestId("confirm-delete").click();
  await page.getByText(/Your account is gone/).waitFor();
  await shot("deleted");
  must((await page.request.get(`${BASE_URL}/api/account/profile`)).status() === 401, "signed out and profile gone after delete");
  const books = await page.request.get(`${BASE_URL}/api/book/projects`);
  must(books.status() === 401 || !JSON.stringify(await books.json().catch(() => ({}))).includes("Lily"), "book API refuses the deleted session (data removal itself is covered by tests/book/consent.test.ts)");

  must(errors.length === 0, `no console or page errors ${errors.join(" | ").slice(0, 400)}`);
} finally {
  writeJson(OUT, `${mode}-axe.json`, a11y);
  writeJson(OUT, `${mode}-result.json`, { base: BASE_URL, mode, ...results, errors });
  await browser.close();
  console.log(`\n${mode}: ${results.ok} ok, ${results.fail.length} failed, ${results.gaps.length} gaps`);
  for (const g of results.gaps) console.log(`  GAP ${g}`);
}
console.log(results.gaps.length ? "PASS WITH GAPS" : "ALL OK");
