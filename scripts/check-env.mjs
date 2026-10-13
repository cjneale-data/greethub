#!/usr/bin/env node
/**
 * Pre-build environment check. Runs before `next build` on Vercel (app/vercel.json buildCommand) and can be run by hand.
 * Prints variable NAMES and pass/fail only. It never prints, logs or hashes a value.
 *
 *   node scripts/check-env.mjs                 uses VERCEL_ENV (production | preview | development), else "development"
 *   node scripts/check-env.mjs --env=production
 *
 * Production: a missing or short SESSION_SECRET fails the build when sign-in is the local cookie auth, because sign-in
 * would fail at runtime (app/lib/shop/session.ts); with Supabase Auth configured it is not used. A Supabase URL with a
 * path fails any build. A failed build keeps the last good deployment serving, which is the safer outcome.
 * Everything else is a warning so a demo deploy is never blocked by this script. Preview: warnings only.
 * Docs: docs/devops/01-environments.md
 */
const arg = process.argv.find((a) => a.startsWith("--env="));
const target = (arg ? arg.slice(6) : process.env.VERCEL_ENV) || "development";
const env = process.env;
const has = (k) => typeof env[k] === "string" && env[k].trim() !== "";
const on = (k) => env[k] === "1" || env[k] === "true";

const errors = [];
const warnings = [];

// Same switch as app/lib/adapters/index.ts: with all three, sign-in is Supabase Auth and SESSION_SECRET is unused.
const supabaseAuth = has("NEXT_PUBLIC_SUPABASE_URL") && has("NEXT_PUBLIC_SUPABASE_ANON_KEY") && has("SUPABASE_SERVICE_ROLE_KEY");

if (has("NEXT_PUBLIC_SUPABASE_URL")) {
  let u = null;
  try {
    u = new URL(env.NEXT_PUBLIC_SUPABASE_URL.trim());
  } catch {}
  if (!u || (u.protocol !== "https:" && u.hostname !== "127.0.0.1" && u.hostname !== "localhost")) errors.push("NEXT_PUBLIC_SUPABASE_URL is not a valid https URL.");
  else if (u.pathname !== "/" || u.search) errors.push("NEXT_PUBLIC_SUPABASE_URL has a path on it. Use the bare project URL (https://<ref>.supabase.co), not the /rest/v1 endpoint.");
}

if (target === "production" || target === "preview") {
  const list = target === "production" && !supabaseAuth ? errors : warnings;
  if (!supabaseAuth) {
    if (!has("SESSION_SECRET")) list.push("SESSION_SECRET is not set (sign-in fails closed without it).");
    else if (env.SESSION_SECRET.length < 32) list.push("SESSION_SECRET is shorter than 32 characters (sign-in fails closed).");
  }

  if (!has("NEXT_PUBLIC_SITE_URL")) warnings.push("NEXT_PUBLIC_SITE_URL is not set (email links and Stripe return URLs fall back to request headers).");
  if (on("GREETHUB_ALLOW_FAKE")) warnings.push("GREETHUB_ALLOW_FAKE is on (fake sign-in, fake checkout and the dev outbox are reachable).");
  if (on("GREETHUB_ALLOW_DEV_SIGNIN")) warnings.push("GREETHUB_ALLOW_DEV_SIGNIN is on (anyone can sign in as any email).");
}

if (target === "production") {
  if (!has("CRON_SECRET")) warnings.push("CRON_SECRET is not set (the daily photo purge cron gets 403 and never runs).");
  if (!has("GREETHUB_ADMIN_TOKEN")) warnings.push("GREETHUB_ADMIN_TOKEN is not set (the takedown reports page stays locked).");
  if (!has("OPENROUTER_API_KEY") && !on("GREETHUB_MOCK_AI")) warnings.push("Neither OPENROUTER_API_KEY nor GREETHUB_MOCK_AI is set.");
  if (on("GREETHUB_MOCK_AI")) warnings.push("GREETHUB_MOCK_AI is on in production (placeholder art, mock photo moderation).");
  if (!has("STRIPE_SECRET_KEY") || !has("STRIPE_WEBHOOK_SECRET")) warnings.push("Stripe keys are not set (checkout uses the fake adapter or is refused).");
}

console.log(`[check-env] target: ${target}`);
for (const w of warnings) console.log(`[check-env] warning: ${w}`);
for (const e of errors) console.error(`[check-env] error: ${e}`);
if (errors.length) {
  console.error("[check-env] Set the variable in Vercel > Settings > Environment Variables, then redeploy. See docs/devops/01-environments.md.");
  process.exit(1);
}
console.log(`[check-env] ok (${warnings.length} warning${warnings.length === 1 ? "" : "s"})`);
