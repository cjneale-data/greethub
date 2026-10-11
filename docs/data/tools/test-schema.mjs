// Smoke test for 03-schema.sql against an in-process Postgres (PGlite), synthetic rows only.
// Usage: npm i --no-save @electric-sql/pglite && node docs/data/tools/test-schema.mjs
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite();
await db.exec(readFileSync(path.join(dir, "03-schema.sql"), "utf8"));
await db.exec(readFileSync(path.join(dir, "03b-seed-event-definitions.sql"), "utf8"));
await db.exec("select analytics.ensure_event_partitions(2)");
const one = async (sql, p = []) => (await db.query(sql, p)).rows[0];
const fails = async (sql, p = []) => { try { await db.query(sql, p); return false; } catch { return true; } };
let n = 0; const ok = (name) => console.log(`ok ${++n} ${name}`);

const defs = await one("select count(*)::int c from analytics.event_definitions");
assert.ok(defs.c >= 80); ok(`seeded ${defs.c} event definitions`);

// identity + ingest
const s1 = (await one("insert into privacy.subjects(auth_user_id) values (gen_random_uuid()) returning subject_id")).subject_id;
const s2 = (await one("insert into privacy.subjects(auth_user_id, is_guest) values (gen_random_uuid(), true) returning subject_id")).subject_id;
const anon = "11111111-1111-1111-1111-111111111111";
assert.equal((await one("select analytics.ingest_event(gen_random_uuid(),'page_viewed',now(),'client',$1,null,null,'{}') r", [anon])).r, true); ok("anonymous event ingested");
assert.ok(await fails("select analytics.ingest_event(gen_random_uuid(),'no_such_event',now(),'client',null,null,null,'{}')")); ok("unknown event rejected");
const dup = "22222222-2222-2222-2222-222222222222";
const when = "2026-11-02T10:00:00Z"; // a retry carries the same event_id and occurred_at
await db.query("select analytics.ingest_event($1,'page_viewed',$3::timestamptz,'client',$2,null,null,'{}')", [dup, anon, when]);
await db.query("select analytics.ingest_event($1,'page_viewed',$3::timestamptz,'client',$2,null,null,'{}')", [dup, anon, when]);
assert.equal((await one("select count(*)::int c from analytics.events where event_id=$1", [dup])).c, 1); ok("dedupe by event_id");
assert.ok(await fails("insert into analytics.events(event_id,event_name,occurred_at,source,sensitivity) values (gen_random_uuid(),'page_viewed',now(),'client','C2')")); ok("C2 cannot enter analytics.events");
await db.query("select privacy.link_anonymous($1,$2,'signup')", [anon, s1]);
assert.equal((await one("select count(*)::int c from analytics.events where subject_id=$1", [s1])).c, 2); ok("anonymous history back-filled on link");

// consent tier gating
await db.query("insert into privacy.consent_state(subject_id,tier,analytics_ok) values ($1,'T0',false)", [s2]);
assert.equal((await one("select analytics.ingest_event(gen_random_uuid(),'page_viewed',now(),'client',null,$1,null,'{}') r", [s2])).r, false); ok("analytics_ok=false drops behavioural event");
assert.equal((await one("select analytics.ingest_event(gen_random_uuid(),'payment_succeeded',now(),'webhook',null,$1,null,'{}') r", [s2])).r, true); ok("commerce event still recorded");
assert.ok(await fails("update privacy.consent_state set tier='T2' where subject_id=$1", [s2])); ok("T2 requires consent_id");

// training gates
await db.query("insert into ml.generation_attempts(ts,run_id,stage,label,kind,model_requested,attempt,status,cost_source,subject_id,prompt_sha256,job_id,creation_id,cost_usd) values (now(),'r','render','p1','image','m',1,'ok','openrouter_usage',$1,'abc','job_1','c_1',0.061)", [s1]);
await db.query("insert into ml.training_candidates(subject_id,modality,source_table,source_id,content_class,derived_from_photo,contains_likeness,minors_possible,consent_tier_at_capture) values ($1,'image_art','ml.generation_attempts','x','C4',true,true,true,'T0')", [s1]);
assert.ok(await fails("update ml.training_candidates set status='eligible'")); ok("likeness/photo-derived candidate cannot become eligible");
const so = (await one("insert into privacy.legal_signoffs(scope,signed_by,document_ref,valid_from) values ('test','x','y',current_date) returning signoff_id")).signoff_id;
await db.query("insert into ml.training_candidates(subject_id,modality,source_table,source_id,content_class,derived_from_photo,contains_likeness,minors_possible,consent_tier_at_capture,consent_id,legal_signoff_id,pii_scan_passed,moderation_clean,status) values ($1,'text_story','ml.text_samples','y','C3',false,false,false,'T2','cns_1',$2,true,true,'eligible')", [s1, so]);
ok("fully gated text candidate can be eligible");
await db.exec("insert into ml.dataset_versions(dataset_id,purpose,built_by,legal_signoff_id) values ('ds1','test','me','" + so + "')");
await db.query("insert into ml.dataset_members(dataset_id,candidate_id) select 'ds1', candidate_id from ml.training_candidates where status='eligible'");

// merge
const s3 = (await one("insert into privacy.subjects(auth_user_id) values (gen_random_uuid()) returning subject_id")).subject_id;
await db.query("select analytics.ingest_event(gen_random_uuid(),'creator_started',now(),'server',null,$1,null,'{}')", [s3]);
await db.query("select privacy.merge_subjects($1,$2)", [s3, s1]);
assert.equal((await one("select count(*)::int c from privacy.subjects where subject_id=$1", [s3])).c, 0); ok("merge_subjects removes the guest subject");

// delete
await db.query("insert into analytics.fact_creations(creation_id,subject_id,kind,created_at) values ('c_1',$1,'book',now())", [s1]);
await db.query("insert into analytics.fact_orders(order_id,subject_id,created_at,status,items_count,subtotal_cents,postage_cents,total_cents,is_first_order) values ('o_1',$1,now(),'paid',1,3900,599,4499,true)", [s1]);
await db.query("select privacy.delete_subject($1,'account','self_service')", [s1]);
for (const t of ["analytics.events", "analytics.sessions", "analytics.fact_creations", "ml.qa_results", "ml.user_feedback", "ml.edits", "ml.preference_pairs", "ml.outcomes", "ml.text_samples", "ml.experiment_assignments"]) {
  assert.equal((await one(`select count(*)::int c from ${t} where subject_id=$1`, [s1])).c, 0, t);
}
const g = await one("select subject_id, job_id, creation_id, prompt_sha256, cost_usd from ml.generation_attempts");
assert.equal(g.subject_id, null); assert.equal(g.prompt_sha256, null); assert.equal(Number(g.cost_usd), 0.061); ok("ledger anonymised, cost kept");
assert.equal((await one("select count(*)::int c from ml.training_candidates where subject_id=$1 and status<>'withdrawn'", [s1])).c, 0); ok("training candidates withdrawn");
assert.equal((await one("select needs_rebuild from ml.dataset_versions where dataset_id='ds1'")).needs_rebuild, true); ok("dataset flagged for rebuild");
assert.equal((await one("select count(*)::int c from privacy.subjects where subject_id=$1", [s1])).c, 0); ok("identity link severed");
assert.equal((await one("select count(*)::int c from privacy.deletion_tombstones where subject_id=$1", [s1])).c, 1); ok("tombstone written");
assert.equal((await one("select analytics.ingest_event(gen_random_uuid(),'creator_started',now(),'server',null,$1,null,'{}') r", [s1])).r, false); ok("tombstoned subject cannot ingest");
const log = await one("select counts::text c from privacy.deletion_log order by log_id desc limit 1");
assert.ok(!log.c.includes(s1)); ok("deletion_log has no subject id");

// resurrection via simulated restore
await db.query("insert into analytics.events(event_id,event_name,occurred_at,source,subject_id) values (gen_random_uuid(),'creator_started',now(),'server',$1)", [s1]);
assert.equal((await one("select privacy.replay_tombstones() n")).n, 1); ok("replay_tombstones removes a resurrected subject");
assert.equal((await one("select count(*)::int c from analytics.events where subject_id=$1", [s1])).c, 0);

// retention
await db.query("insert into analytics.events(event_id,event_name,occurred_at,source,anonymous_id) values (gen_random_uuid(),'page_viewed',now() - interval '500 days','client',$1)", [anon]);
const pr = await one("select privacy.purge_expired() r");
assert.ok(pr.r.events >= 1); ok("purge_expired removes events past retention");

// spend cap
await db.exec("insert into analytics.spend_daily(day,purpose,usd) values ((now() at time zone 'utc')::date,'guest_preview',9.5)");
assert.equal((await one("select analytics.spend_ok(10) r")).r, true);
assert.equal((await one("select analytics.spend_ok(9) r")).r, false); ok("spend_ok");

// views compile and run
await db.query("select * from analytics.v_funnel_daily"); await db.query("select * from ml.v_generation_cost_by_creation"); await db.query("select * from ml.v_qa_first_pass_rate"); ok("views run");
console.log(`\nall ${n} checks passed`);
