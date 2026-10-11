# 04. KPIs and dashboards

Owner: Head of Data. Date: 2026-10-10. Event names refer to `01-tracking-plan.md` / `tracking-plan.json`; table names to `03-schema.sql`. Numbers marked GUESS are placeholders from the CFO workbook or CMO plan, not data. All proportions are shown with n and a Wilson 95% interval; a number built on fewer than 30 observations is greyed out in every dashboard.

## 1. North star

**Successful orders per week** (`NSM_funnel`): paid orders in the week whose every item reached `delivered` (or `digital_delivery_completed` for digital SKUs), with no refund, reprint or quality-coded support ticket opened within 30 days of delivery.

Why this and not revenue or sign-ups: it only goes up when a visitor builds something they like (proof approved), pays, and the physical or digital product arrives intact. It punishes failure at every layer GreetHub controls (generation quality, print file, printer, carrier). It also is the numerator of every unit-economics ratio the CFO needs. The lagging 30-day condition means the headline is reported with a 5-week delay; the leading proxy shown next to it is **orders paid this week** and **proof-approval rate**.

Counter-metric (never let the north star be gamed): **contribution margin per order** (section 5). Guard-rail: **deletion/export SLA met 100%** (section 7).

## 2. KPI tree

```
Successful orders / week
├─ Paid orders (volume)
│   ├─ Visitors (A1)  x  channel mix (A2)
│   ├─ Visitor → creator start (B-side: A3 guest try rate, B2 signup→start)
│   ├─ Creator start → brief completed (B3)
│   │     ├─ chat vs form friction (Q9), photo step completion (P3 coverage)
│   ├─ Brief → sheet approved (B4)  [books]      ← cost gate
│   ├─ Sheet → proof approved (B5)               ← quality gate (Q1, Q2, Q3, Q7)
│   ├─ Proof → cart → checkout → paid (C2, C3)
│   └─ Orders per customer over time (R1 repeat, R3 reminders)
├─ Items per order and mix (C5, C6) → AOV (C4)
└─ Delivered without incident (F1 on-time, F2 needs-attention, F3 refund+reprint, F4 print reject, S1 contact rate)

Contribution margin / order (U8) = AOV − refunds − model cost (U1 + U2 + U3 allocated) − print + ship (U5) − payment fees − reprints
Efficiency: CAC by channel (U6) vs first-order contribution
Trust: consent coverage (P3), purge on time (P2), deletion SLA (P1), tier mix (P4)
```

## 3. Funnel definitions

Unit and window: person-level steps (visit to sign-up) use `coalesce(subject_id, anonymous_id)`, cohorted by first-visit date, converting within 30 days. Creation-level steps (brief onward) use `creation_id`, cohorted by `creator_started` date, converting within 30 days. A step counts the first time its event occurs. Bots are excluded at the collector (UA class dropped before storage); sessions without analytics permission are invisible to client steps, so visit counts are a floor and server-side steps (from `creator_started` on) are exact. This is the same under-count the CMO should expect from any consented analytics.

| # | Step | Event (first occurrence) | Unit | CFO / CMO mapping |
|---|---|---|---|---|
| 1 | Visit | `page_viewed` | person | CFO visitor; ux-spec `view_home` |
| 2 | Template or CTA click | `template_clicked` (optional) | person | CMO template ranking |
| 3 | Creator start | `creator_started` | person and creation | CFO "creator start"; CMO "guest preview rate" numerator is step 4 |
| 4 | Guest preview | `guest_preview_rendered` (non-mock) | person | CFO Inputs B15 |
| 5 | Sign-up | `signup_completed` | person | CFO sign-up; CMO KPI "preview-to-sign-up >= 20%" is 5/4 |
| 6 | Brief complete | `brief_completed` | creation | |
| 7 | Photos uploaded (books) | `photo_uploaded` for every human character | creation | `fact_creations` |
| 8 | Sheet approved (books) | `model_sheet_approved` | creation | ux-spec `book_sheet_approved` |
| 9 | Story approved (books) | `story_approved` | creation | |
| 10 | All pages rendered | `render_job_finished` kind=pages status=succeeded | creation | |
| 11 | Proof approved | `proof_approved` | creation | |
| 12 | Cart add | `cart_item_added` | creation | ux-spec `add_to_cart` |
| 13 | Checkout start | `checkout_started` | checkout | |
| 14 | Paid | `payment_succeeded` | order | CFO purchase; ux-spec `purchase` |
| 15 | Delivered without incident | `order_delivered`/`digital_delivery_completed` and no refund/reprint within 30 d | order | north star |

Reported conversions: visitor -> sign-up (1->5), sign-up -> creator start (5->3 where start follows sign-up, or 3 where started as guest then signed up; documented in the view), creator start -> purchase (3->14 per creation, plus a person-level variant), proof approved -> paid (11->14), cart abandonment (12 without 14 within 7 d).

## 4. KPI dictionary

IDs are stable labels (not strictly sequential). "Source" is the table/events used; "Grain" is the default breakdown; targets are GUESSES from the CMO plan unless marked.

### Acquisition
| ID | Metric | Definition | Source |
|---|---|---|---|
| A1_visitors | Visitors | distinct `coalesce(subject_id, anonymous_id)` with `page_viewed` in period | events |
| A2_channel_mix | Channel mix | share of visitors, sign-ups, orders by `channel` (first touch for acquisition, last touch for conversion); spend from `ad_spend_daily` | events, ad_spend_daily |
| A3_guest_try_rate | Guest try rate | persons with `guest_preview_requested` / visitors. CFO Inputs B15 (15%). CMO target >= 15% GUESS | events |
| A3_template_ctr | Template CTR | `template_clicked` / `page_viewed` where page_type in (home, template_gallery) | events |

### Activation and funnel
| ID | Metric | Definition |
|---|---|---|
| B1_visitor_to_signup | Visitor -> sign-up | cohort: signup_completed within 30 d / visitors. CFO Inputs B12 (7%) |
| B2_signup_to_start | Sign-up -> creator start | signed-up persons with any `creator_started` / signed-up persons. CFO B13 (60%) |
| B3_brief_completion | Brief completion | creations with `brief_completed` / creations with `brief_started` (by product, by mode chat/form/mixed) |
| B4_sheet_approval | Sheet approval | book creations with `model_sheet_approved` / book creations with `model_sheet_generated`; also first-version approval share |
| B5_proof_approval | Proof approval | creations with `proof_approved` / creations with `brief_completed` |

### Conversion and value
| ID | Metric | Definition |
|---|---|---|
| C1_start_to_purchase | Start -> purchase | creations with a paid order item / creations started; person-level variant also reported. CFO B14 (25% organic) |
| C2_proof_to_cart | Proof -> cart | `cart_item_added` / `proof_approved` per creation |
| C2_cart_to_checkout | Cart -> checkout | `checkout_started` / sessions with `cart_item_added` |
| C3_checkout_to_paid | Checkout -> paid | `payment_succeeded` / `checkout_started` (by `payment_failed.reason`) |
| C4_aov | Average order value | `sum(total_cents - tax_cents) / orders` and ex-postage variant |
| C5_items_per_order | Items per order | `sum(items)/orders`. CFO B9 (1.15) |
| C6_mix | Product mix | share of items per `sku`; CFO SKU table "mix" column |

### Generation quality (section 6 has the formulas)
Q1_first_pass_qa, Q2_auto_reroll_rate, Q3_reroll_rate, Q4_sheet_redo_rate, Q5_generation_failure, Q6_user_rating, Q7_approval_without_reroll, Q9_intake_friction, Q10_story_edit_rate.

### Unit economics (section 5)
U1_cost_per_creation, U2_guest_preview_cost, U3_abandoned_draft_cost, U4_cost_per_call, U5_print_ship_cost, U6_cac_by_channel, U7_spend_vs_cap, U8_contribution_margin.

### Retention and fulfilment
| ID | Metric | Definition |
|---|---|---|
| R1_repeat_rate | Repeat rate | customers (first paid order month M) with a second paid order within 12 months / customers. Early proxy at month 3: share with `reorder_started`. CFO B32 (0.35/yr) |
| R3_reminder_opt_in | Reminder opt-in | users with an active reminder / users with a delivered order |
| R3_saved_person_rate | Saved Person rate | creations that reused or created a Saved Person / creations with human characters |
| R4_template_popularity | Template and style popularity | per `template_id`, `art_style`, `occasion`: starts, completions, orders, approval-without-reroll rate (needs >= 30 starts per cell to rank) |
| F1_on_time_delivery | On-time delivery | delivered items with `delivered_at <= promised_delivery` / delivered items |
| F2_needs_attention_rate | Needs-attention | items that ever entered `needs_attention` / items submitted |
| F3_refund_reprint_rate | Refund + reprint | refunded cents / revenue cents (CFO B36) and reprinted items / printed items (CFO B37) |
| F4_print_reject_rate | Print reject | `fulfillment_submitted` with `validation_errors > 0` or `fulfillment_needs_attention.reason_code = file_rejected` / submissions |
| S1_contact_rate | Support contact rate | tickets / 100 orders, by category and stage |
| S2_first_response | First response | median `first_response_minutes` (helpdesk import) |

### Privacy and data health
| ID | Metric | Definition | Target |
|---|---|---|---|
| P1_deletion_sla | Deletion/export SLA | requests with all tasks done within 30 d / requests (legal 02 s7 step 3) | 100% |
| P2_photo_purge_ontime | Photo purge on time | photos deleted by `expires_at` / photos expired; `photo_purge_run.overdue_count` | 100%, overdue = 0 |
| P3_consent_coverage | Consent coverage | uploaded photos whose `consent_id` refers to a valid current-wording record / photos uploaded | 100% (hard) |
| P4_tier_mix | Tier mix | subjects by T0/T1/T2 and creations by contributing tier | informational |
| P5_moderation_rate | Moderation rate | blocks / checks by surface | watch for spikes |

## 5. Unit economics tied to the CFO workbook

Goal: every workbook assumption gets a measured twin so the CFO can overwrite GUESS/ESTIMATE cells with data. Refresh rule: weekly compute, monthly CFO update, and a cell is overwritten only when the denominator has at least 100 observations (otherwise keep the assumption and show the measured value beside it with its interval).

| Workbook location (`Inputs` unless stated) | Current | Measured definition | Query source |
|---|---|---|---|
| B12 Organic visitor -> sign-up | 0.07 | B1 for channel in (seo, direct, referral, email) | `v_funnel_by_channel` |
| B13 Sign-up -> creator start | 0.60 | B2 | events |
| B14 Organic creator start -> purchase | 0.25 | C1 for organic channels | events |
| B15 Visitors running a guest preview | 0.15 | A3 | events |
| B17 Token cost incurred before an unpaid start abandons | $0.35 | mean `cost_usd` of creations with no `payment_succeeded` after 30 d, including guest previews and intake chat | `ml.generation_attempts` joined to `fact_creations` |
| B32 Repeat orders per customer per year | 0.35 | R1 (second-order count per customer, annualised) | `fact_orders` |
| B34 / B35 Re-roll rate, cards / books | 0.20 / 0.20 | extra image renders over base / base renders, by product, including auto re-rolls (Q2 + Q3). Base = `plannedRenders().total` | `ml.generation_attempts` |
| B36 Refund rate | 0.03 | F3 refunded cents / revenue cents | `fact_orders` |
| B37 Reprint rate | 0.04 | reprinted items / printed items | events |
| B38 Chargeback rate | 0.003 | `dispute_opened` orders / orders | events |
| B9 Items per paid order | 1.15 | C5 | events |
| B40-B41 Stripe fee | 2.9% + $0.30 | `stripe_fee_cents / total_cents` actual | `fact_orders` |
| B42 OpenRouter credit-purchase fee | 5.5% | actual credit purchases vs provider-reported `cost_usd` (manual import monthly) | CFO |
| SKU table, mix | GUESS | C6 | `fact_order_items` |
| SKU table, print cost and shipping cost | ESTIMATE | mean `print_cost_cents`, `ship_cost_cents` by sku from printer responses | `fact_order_items` |
| SKU table, price | fixed in `PRICING` | n/a (check realised AOV vs list) | |
| Model Costs, tokens per SKU (measured per call, extrapolated per product) | card $0.248, 24pp book $1.264, 32pp $1.636 incl. 20% re-roll | U1 by sku: sum of ledger cost over the creation, split `intake`, `story`, `sheet`, `render`, `qa`, `reroll` | `ml.v_generation_cost_by_creation` |
| Model Costs, guest preview | $0.0689 | U2: mean `guest_preview_rendered.cost_usd` | events |
| Model Costs, intake chat | ESTIMATE | mean chat cost per creation: sum `chat_turn_completed.cost_usd` | events |
| Seasonality index (Inputs rows 68-79) | GUESS | month-over-year only after 12 months; before that use occasion mix from `brief_completed.occasion` | |
| CMO CSV: CPC, CTR, visitor_to_signup, signup_to_purchase, CAC | GUESS | CPC = spend/clicks from `ad_spend_daily`; CTR = clicks/impressions; conversions from channel funnel; CAC = U6 | `mv_channel_economics` |
| Opex / Scenarios: LTV | formula | observed 12-month contribution per customer cohort, with first-order contribution x (1 + repeat) as the early proxy | |

### Definitions

- **Model cost per creation (U1)** = `sum(cost_usd)` over `ml.generation_attempts` for the `creation_id`, all purposes except `guest_preview`, including failed attempts, QA calls and intake chat. Reported as total and by stage. Compare to the SKU benchmark and show variance.
- **Guest preview cost (U2)** = mean cost of guest previews; **allocated guest cost per order** = total guest preview spend in period / orders in period (this is the cost that "brings no revenue" in the workbook).
- **Abandoned draft cost (U3)** = sum of ledger cost on creations with no payment after 30 days (or deleted/expired) / orders in period.
- **Fully loaded model cost per order** = U1 for the order's creations + allocated guest cost per order + allocated abandoned draft cost per order.
- **Cost per call (U4)** = mean `cost_usd` by `model_served`, `kind`, `image_size`, `stage`.
- **Print and ship cost (U5)** = printer actuals per item (`order_shipped.print_cost_cents`, `ship_cost_cents`).
- **Contribution margin per order (U8)** = `(total_cents - tax_cents) - refunded_cents - payment_fee_cents - chargeback_fee - print_cost - ship_cost - reprint_cost - fully_loaded_model_cost`, all in cents/USD aligned, matching the workbook's Unit Economics sheet (price + postage, refund allowance, tokens, print, shipping, reprint, Stripe, disputes). Marketing cost is excluded (it is in CAC).
- **CAC (U6)** = channel spend in period / first-time customers whose `channel_first_touch` equals the channel (first order in period). Also **blended CAC** = total spend / all first-time customers, and **paid CAC** excluding organic channels (workbook headline: about $76 at CMO assumptions). **CAC payback** = CAC / first-order contribution (orders). Workbook base: CAC $76 vs about $15.20 contribution per order, so the first measured payback ratio is the most decision-relevant number in the company in the first 90 days.
- **Spend vs cap (U7)** = today's UTC `analytics.spend_daily` total vs `GENERATION_DAILY_SPEND_CAP_USD`, by purpose; alert at 70% and 100%.

## 6. Generation quality metrics

Definitions use `ml.generation_attempts` (g), `ml.qa_results` (q), events `reroll_requested`, `proof_approved`. Unit: rendered art page (kind = image, stage = render), not model call.

| ID | Metric | Formula | Notes / alert (GUESS thresholds) |
|---|---|---|---|
| Q1_first_pass_qa | First-attempt QA pass rate | pages whose attempt 1 passes all QA evaluators / pages | by model_served, image_size, prompt_version, style, cast size. Eye Story evidence: 2 of 8 failed (25%). Alert < 70% weekly |
| Q2_auto_reroll_rate | Auto re-roll rate | pages with `auto_reroll_triggered` / pages; plus wasted cost = sum `cost_wasted_usd` | |
| Q3_reroll_rate | User re-roll rate | `reroll_requested` (charge allowance or paid_extra) / art pages shown at proof; plus per-creation distribution (share with 0, 1-2, 3+) | workbook 20% extra renders; compare "extra renders / base renders" |
| Q4_sheet_redo_rate | Sheet redo rate | sheet versions generated beyond first / creations with sheet; share approved on version 1 | the most predictive upstream metric for downstream rerolls |
| Q5_generation_failure | Failure rate | failed jobs / jobs; failed pages / pages; calls with status in (http_error, network_error, no_image) / calls; fallback rate = `model_served <> model_requested` | alert if fallback > 5% or http_error > 2% |
| Q6_user_rating | User rating | share positive `rating_submitted` thumbs; mean stars; NPS from `survey_responded` ((9-10) - (0-6))/n | by prompt_version and model |
| Q7_approval_without_reroll | Approved with no re-roll | proofs with `rerolls_used = 0 and sheet_redos_used = 0` / proofs | the cleanest "it just worked" rate |
| Q9_intake_friction | Intake friction | median turns to `brief_completed`; fields edited after completion; guardrail hit rate; share who leave after a guardrail hit | |
| Q10_story_edit_rate | Story edit rate | share of story pages edited (edit_kind in moderate, rewrite) / pages; mean edit_distance_ratio | high rewrite share signals weak prompts |
| Effective cost per accepted page | Image cost / pages in approved proofs | `sum(image cost)` for creations with proof approved / their final pages | the cost of quality; ties to workbook 20% |
| Time to proof | `proof_approved.occurred_at - brief_completed.occurred_at` (median, p90), queue wait, run time | | UX and capacity |
| Scorer agreement (after DATA-ML stage 2) | precision/recall of learned scorer vs human labels on golden set | | gate for replacing vision QA |

Segment every quality metric by: product, `model_served`, `image_size`, `prompt_version_id`, `art_style`, cast size, has_pet, uses_saved_person, device. Never by anything image-derived about a person.

## 7. Dashboards (all read-only, Metabase unless noted)

Refresh column: hourly = materialised view refresh; daily = overnight. Filter on every dashboard: date range, product, channel, `mock = false` (mock jobs excluded always).

| # | Dashboard | Audience | Refresh | Tiles and exact metrics |
|---|---|---|---|---|
| D1 | Executive weekly | Owner, CFO | daily | Successful orders (NSM, 5-week lag) and orders paid this week; revenue (`sum(total_cents - tax_cents)`); contribution margin per order (U8) with 4-week average; blended and paid CAC; CAC payback ratio; refund + reprint rate; model spend vs budget; open `needs_attention` items; deletion SLA status |
| D2 | Funnel | CMO, Head of Data | hourly | Steps 1 to 15 counts and step conversion by cohort week; same by channel, device, product, new vs returning; median time between steps; cart abandonment; checkout failures by reason |
| D3 | Acquisition and CAC | CMO, CFO | daily | spend, clicks, CPC, CTR (from `ad_spend_daily`), visitors, sign-ups, first orders, CAC by channel vs CSV assumption (variance %), UTM campaign table, template CTR |
| D4 | Creator health | CTO, CMO | hourly | brief completion by mode; fields edited; chat turns and cost; guardrail hits; photo upload funnel (consent shown -> recorded -> upload started -> uploaded -> blocked reasons); sheet approval; story edit rate |
| D5 | Generation quality | CTO, Head of Data | hourly | Q1, Q2, Q3, Q4, Q5, Q7 by model, prompt version, size, style; QA failure notes_code mix; fallback share; effective cost per accepted page |
| D6 | Generation cost and spend cap | CTO, CFO | hourly | today's spend by purpose vs cap; 30-day spend; cost per call by model/size (U4); cost per creation by sku (U1) vs workbook; guest preview cost and allocated cost per order (U2); abandoned draft cost (U3); retries and wasted cost |
| D7 | Unit economics vs workbook | CFO | daily | table of every row in section 5: workbook value, measured value, n, interval, last refresh, "ready to overwrite" flag |
| D8 | Fulfilment | CX, CTO | hourly | items by status; hours in status; on-time delivery vs promised; needs-attention by reason and printer; print file rejects; actual print and ship cost by sku vs estimate; delay notices sent |
| D9 | Support and refunds | CX, CFO | daily | contact rate by category and stage; first response and resolution time; refunds and reprints by reason code; link from quality-coded tickets to prompt version of the order's creation |
| D10 | Privacy and data health | Head of Data, CTO, owner | hourly | consent coverage (P3 must be 100%); photos past `expires_at` (must be 0); purge job last run; deletion requests open and age vs 30-day due date; tasks pending by target; events dropped/rejected by reason; events with unknown names; tier mix; tombstone replay count |
| D11 | Template and style (after launch) | CMO | daily | R4 by template, style, occasion, tone, reading age; min 30 starts per cell |
| D12 | Experiments (after launch) | Head of Data | daily | per experiment: arm sizes, primary metric with interval, guardrail metrics, sample-size progress, decision log |

### Exact SQL for the three most important tiles (reference implementations; views will wrap them)

```sql
-- Q1 first-attempt QA pass rate by week and prompt version (already ml.v_qa_first_pass_rate)
select week, prompt_version_id, model_served, pages, first_attempt_pass_rate
from ml.v_qa_first_pass_rate
where pages >= 30
order by week desc;

-- U1 model cost per creation vs list SKU benchmark
select i.sku,
       count(distinct i.creation_id)                       as creations,
       avg(c.cost_usd)                                      as mean_model_cost_usd,
       percentile_cont(0.9) within group (order by c.cost_usd) as p90_model_cost_usd
from analytics.fact_order_items i
join ml.v_generation_cost_by_creation c using (creation_id)
where i.status <> 'cancelled'
group by i.sku;

-- U6 CAC by first-touch channel, last 30 days
with spend as (
  select channel, sum(spend_usd) as spend
  from analytics.ad_spend_daily
  where day >= current_date - 30 group by 1),
firsts as (
  select channel_first_touch as channel, count(*) as new_customers
  from analytics.fact_orders
  where is_first_order and created_at >= now() - interval '30 days' group by 1)
select s.channel, s.spend, coalesce(f.new_customers,0) as new_customers,
       s.spend / nullif(f.new_customers,0) as cac_usd
from spend s left join firsts f using (channel);
```

## 8. Alerts (to email/Slack, owner approves channel)

| Alert | Condition | Severity |
|---|---|---|
| Spend cap | daily spend >= 70% / 100% of cap | warn / page |
| Failure spike | image call error rate > 5% over 30 min, or fallback share > 20% | page |
| QA collapse | rolling 100-page first-attempt pass rate < 60% | warn |
| Purge overdue | any photo past `expires_at` + 24 h | page |
| Consent gap | any photo whose `consent_id` is missing/invalid | page (should be impossible) |
| Deletion due | request older than 20 days with pending tasks | warn |
| Event integrity | unknown event name or rejected property count > 0 in an hour; events received per hour down > 70% vs same hour last week | warn |
| Payment mismatch | `payment_succeeded` count differs from Stripe paid sessions for the day | warn |

## 9. Data-quality rules (enforced in CI and nightly)

- Every `payment_succeeded` has exactly one `order_created` and one `fact_orders` row; sum of `fact_order_items.product_cents + postage_cents` plus method and tax equals `total_cents` within 1 cent.
- Every `ml.generation_attempts` row with `kind = 'image'` and `status = 'ok'` for a render has a `qa_results` row within 5 minutes unless `mock`.
- No `analytics.events.props` key outside the plan for that event (strict mode from week 2).
- `fact_creations.total_cost_usd` equals `ml.v_generation_cost_by_creation.cost_usd` within $0.001.
- Webhook replay produces zero duplicates.

## 10. Reporting cadence

| When | What | To |
|---|---|---|
| Daily, automated | spend and failure digest | CTO, owner |
| Weekly (Fri) | D1, D2, D3 snapshot + CAC by channel in the CMO's format (CMO "Fri report to CFO sheet") | CMO, CFO |
| Day 30 / 60 / 90 | D7 variance table; recommended workbook overwrites; CMO day-90 actual-vs-assumed CPC/CTR/CAC | CFO, CMO |
| Monthly | privacy and data-health review (D10) and retention job audit | owner, attorney if exceptions |
