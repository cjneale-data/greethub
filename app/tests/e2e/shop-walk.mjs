// Walks cart -> sign-up -> checkout -> fake pay -> order tracking -> account -> delete, with screenshots.
// Usage: BASE_URL=http://localhost:3101 [OUT=dir] node tests/e2e/shop-walk.mjs [desktop|mobile]   (BASE= still works)
// Exits 1 if export, sign-out after delete, or console errors fail. The full launch walk is launch-flow.mjs.
import { chromium } from "playwright";
import fs from "node:fs";
import { BASE_URL as BASE, collectErrors, outDir, warmup } from "./_lib.mjs";

const OUT = outDir("shop");
const mode = process.argv[2] || "desktop";
fs.mkdirSync(OUT, { recursive: true });
const viewport = mode === "mobile" ? { width: 390, height: 844 } : { width: 1280, height: 900 };

await warmup(["/", "/browse", "/pricing", "/faq", "/cart", "/signup", "/checkout", "/orders", "/account", "/account/addresses", "/account/drafts", "/account/people", "/account/delete"]);
// Bundled Chromium (was channel "chrome", which needs Google Chrome installed and differs from CI).
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport, deviceScaleFactor: mode === "mobile" ? 2 : 1, isMobile: mode === "mobile" });
const page = await ctx.newPage();
const errors = collectErrors(page); // ignores the 402 from the deliberate declined-card step
let n = 0;
const shot = async (name) => page.screenshot({ path: `${OUT}/${mode}-${String(++n).padStart(2, "0")}-${name}.png`, fullPage: true });
const step = (s) => console.log(`[${mode}] ${s}`);
const email = `walk-${Date.now()}@example.com`;

await page.goto(BASE + "/");
await page.getByRole("button", { name: "Reject" }).click().catch(() => {});
await shot("home");
await page.goto(BASE + "/browse");
await shot("browse");
await page.getByRole("button", { name: /Big Birthday/ }).click();
await shot("browse-modal");
await page.keyboard.press("Escape");
await page.goto(BASE + "/pricing");
await shot("pricing");
await page.goto(BASE + "/faq");
await page.locator("summary").first().click();
await shot("faq");

step("empty cart then demo items as a guest");
await page.goto(BASE + "/cart");
await shot("cart-empty");
await page.getByTestId("add-demo").click();
await page.getByText("Order summary").waitFor();
await shot("cart");
await page.getByRole("button", { name: "Checkout" }).click();
await page.getByText("Make a free account to check out").waitFor();
await shot("cart-gate");
await page.getByRole("link", { name: "Make a free account" }).click();

step("sign up (18+ gate)");
await page.waitForURL(/signup/);
await page.getByLabel("Email").fill(email);
await page.getByRole("button", { name: "Email me a sign-in link" }).click();
await page.getByText("Tick the box").waitFor();
await shot("signup-gate");
await page.getByLabel(/18 or older/).check();
await page.getByRole("button", { name: "Email me a sign-in link" }).click();
await page.getByTestId("dev-link").waitFor();
await shot("signup-sent");
await page.getByTestId("dev-link").click();
await page.waitForURL(/checkout/);

step("checkout form, validation, then pay");
await page.getByText("Where is it going? To you").waitFor();
await page.getByRole("button", { name: "Continue to payment" }).click();
await shot("checkout-errors");
const fill = async (prefix, a) => {
  for (const [k, v] of Object.entries(a)) await page.locator(`[name="${prefix}-${k}"]`).fill(v);
};
await fill("buyer", { name: "Sam Rivera", line1: "99 Oak Ave", city: "Leeds", region: "NY", postalCode: "10001" });
const other = page.locator('section[aria-label^="Where is it going? To Rosa"]');
await other.locator("input[name$='-name']").fill("Rosa Diaz");
await other.locator("input[name$='-line1']").fill("PO Box 12");
await other.locator("input[name$='-city']").fill("Leeds");
await other.locator("input[name$='-region']").fill("NY");
await other.locator("input[name$='-postalCode']").fill("10001");
await page.getByRole("button", { name: "Continue to payment" }).click();
await page.getByText("PO boxes").first().waitFor();
await other.locator("input[name$='-line1']").fill("12 Elm St");
await page.getByLabel(/approve this proof/).check();
await shot("checkout");
await page.getByRole("button", { name: "Continue to payment" }).click();
await page.getByText("Test payment").waitFor();
await shot("fake-pay");
await page.getByRole("button", { name: /declined/ }).click();
await page.getByText("Your card was declined").waitFor();
await shot("fake-declined");
await page.getByRole("button", { name: /Pay with test card/ }).click();
await page.getByText(/We're on it/).waitFor({ timeout: 20000 });
await shot("confirmation");

step("order tracking");
await page.getByRole("link", { name: "Track this order" }).click();
await page.getByText("What's in it").waitFor();
await shot("order-1");
for (let i = 0; i < 3; i++) {
  await page.getByTestId("advance").click().catch(() => {});
  await page.waitForTimeout(700);
}
await page.getByText("Tracking").first().waitFor();
await shot("order-shipped");
await page.goto(BASE + "/orders");
await shot("orders");

step("account pages");
await page.goto(BASE + "/account");
await page.getByLabel("First name").fill("Sam");
await page.getByRole("button", { name: "Save changes" }).click();
await page.getByText("Saved.").first().waitFor();
await shot("account-profile");
await page.goto(BASE + "/account/addresses");
await page.getByText(/Sam Rivera|No saved addresses/).first().waitFor();
await shot("account-addresses");
await page.goto(BASE + "/account/drafts");
await page.getByText("Nothing saved yet").waitFor();
await shot("account-drafts");
await page.goto(BASE + "/account/people");
await page.getByRole("button", { name: "+ Add a person" }).click();
await page.getByLabel("Name").fill("Grandma Rosa");
await page.getByLabel("Relationship").fill("Grandma");
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.getByText("Grandma Rosa").first().waitFor();
await shot("account-people");
const dl = await page.request.get(BASE + "/api/account/export");
const exported = dl.ok() && (await dl.text()).includes(email);
console.log("export ok:", exported);

step("delete account");
await page.goto(BASE + "/account/delete");
await page.getByLabel("Type DELETE to confirm").fill("DELETE");
await page.getByText("I know my open order").click().catch(() => {});
await shot("account-delete");
await page.getByRole("button", { name: "Delete my account" }).click();
await page.getByRole("button", { name: "Email me the link" }).click();
await page.getByTestId("delete-link").click();
await page.getByTestId("confirm-delete").click();
await page.getByText(/Your account is gone/).waitFor();
await shot("deleted");
const after = await page.request.get(BASE + "/api/account/profile");
console.log("profile after delete (expect 401):", after.status());

console.log("console/page errors:", errors.length ? errors : "none");
await browser.close();
const failed = [!exported && "export", after.status() !== 401 && "still signed in after delete", errors.length && "console errors"].filter(Boolean);
if (failed.length) {
  console.log(`FAIL [${mode}]: ${failed.join(", ")}`);
  process.exit(1);
}
console.log(`ALL OK [${mode}]`);
