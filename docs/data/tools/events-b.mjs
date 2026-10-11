// Part B: render, QA, feedback, proof, commerce, fulfillment, lifecycle, support, privacy, safety, experiments.
import { ev, D, SYS } from "./events-a.mjs";

/* ---------------- RENDER ---------------- */
ev("render_job_queued", "render", {
  stage: "render", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "Job document created.", props: ["job_id|string|R|", "kind|enum(story,sheet,pages,reroll,layout)|R|", "pages_planned|int|O|", "est_cost_usd|decimal|O|", "queue_depth|int|O|", "mock|bool|R|"], kpis: ["Q5_generation_failure", "U7_spend_vs_cap"]
});
ev("render_job_finished", "render", {
  stage: "render", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "Job reaches succeeded, failed or cancelled.", props: ["job_id|string|R|", "kind|enum(story,sheet,pages,reroll,layout)|R|", "status|enum(succeeded,failed,cancelled)|R|", "queue_wait_ms|int|R|", "run_ms|int|R|", "pages_done|int|O|", "pages_failed|int|O|", "cost_usd|decimal|R|", "error_class|enum(none,fatal,spend_cap,moderation,model_unavailable,timeout,heartbeat_lost,other)|R|", "charge_refunded|bool|O|"],
  kpis: ["Q5_generation_failure", "U1_cost_per_creation", "U7_spend_vs_cap"]
});
ev("generation_attempted", "render", {
  stage: "render", src: "worker", cls: "C0", tier: "T0", owner: "Data", ret: SYS, phase: "launch",
  trigger: "One model call attempt finishes. Mirrors a ledger row; the system of record is ml.generation_attempts and this event exists for funnel joins.",
  props: ["attempt_id|string|R|", "job_id|string|O|", "stage|enum(identity,modelsheet,story,card_copy,prompts,render,qa,intake)|R|", "label|string|R|Page id such as p3 or cover", "kind|enum(text,image)|R|", "model_requested|string|R|", "model_served|string|R|", "fallback_used|bool|R|", "attempt|int|R|", "status|enum(ok,http_error,network_error,no_image,mock,blocked)|R|", "http_status|int|O|", "image_size|enum(1K,2K,4K)|O|", "prompt_version_id|string|R|", "prompt_tokens|int|O|", "completion_tokens|int|O|", "image_tokens|int|O|", "cost_usd|decimal|R|", "cost_source|enum(openrouter_usage,computed,none)|R|", "latency_ms|int|R|", "zdr_requested|bool|O|", "experiment_key|string|O|", "experiment_variant|string|O|"],
  kpis: ["U1_cost_per_creation", "U4_cost_per_call", "Q5_generation_failure"]
});
ev("page_render_finished", "render", {
  stage: "render", src: "worker", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "A page reaches done or failed after any automatic retries.", props: ["job_id|string|R|", "page_id|string|R|", "page_kind|enum(cover,spread,back,card_front,card_inside)|R|", "status|enum(done,failed)|R|", "attempts|int|R|", "auto_rerolls|int|R|", "character_count_expected|int|R|", "final_qa_pass|bool|O|", "cost_usd|decimal|R|"],
  kpis: ["Q1_first_pass_qa", "Q2_auto_reroll_rate", "Q5_generation_failure"]
});
ev("spend_cap_hit", "render", {
  stage: "render", src: "server", cls: "C0", tier: "T0", owner: "CFO", ret: SYS, phase: "launch",
  trigger: "A call is blocked by the per-job, per-user or daily USD cap.", props: ["cap_scope|enum(job,user,daily,global_test)|R|", "cap_usd|decimal|R|", "spent_usd|decimal|R|", "purpose|enum(guest_preview,intake_chat,book_render,card_render,qa,story,other)|R|"], kpis: ["U7_spend_vs_cap"]
});

/* ---------------- QA ---------------- */
ev("qa_evaluated", "qa", {
  stage: "qa", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "One QA evaluation of a rendered image completes (local border check, vision count/text check, later a learned scorer).",
  props: ["attempt_id|string|R|The render attempt being judged", "page_id|string|R|", "evaluator|enum(local_border,vision_count,scorer,human)|R|", "evaluator_version|string|R|", "pass|bool|R|", "score|decimal|O|", "expected_count|int|O|", "character_count|int|O|", "white_border|bool|O|", "text_in_image|bool|O|", "notes_code|enum(none,count_mismatch,white_border,text_present,unparseable,call_failed,other)|R|Controlled vocabulary; free-text notes are discarded", "cost_usd|decimal|R|", "led_to_auto_reroll|bool|R|"],
  kpis: ["Q1_first_pass_qa", "Q2_auto_reroll_rate", "U4_cost_per_call"]
});
ev("auto_reroll_triggered", "qa", {
  stage: "qa", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "QA failure causes the one allowed automatic re-render.", props: ["page_id|string|R|", "reason|enum(count_mismatch,white_border,text_present,moderation,character_logo)|R|", "cost_wasted_usd|decimal|R|Cost of the failed attempt"], kpis: ["Q2_auto_reroll_rate", "U1_cost_per_creation"]
});

/* ---------------- REROLL / FEEDBACK ---------------- */
ev("reroll_requested", "feedback", {
  stage: "proof", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User requests a new version of a page or the front of a card.",
  props: ["page_id|string|R|", "page_kind|enum(cover,spread,back,card_front,card_inside)|R|", "version_index|int|R|Version being replaced", "charge|enum(allowance,paid_extra,free_qa_fail)|R|", "rerolls_used_total|int|R|", "rerolls_left|int|R|", "reason_codes|enum[](wrong_count,likeness_off,style_off,text_in_image,cropped,odd_anatomy,bad_scene,colours,other)|O|", "has_note|bool|R|"],
  kpis: ["Q3_reroll_rate", "U1_cost_per_creation"], replaces: "reroll_used"
});
ev("reroll_completed", "feedback", {
  stage: "proof", src: "worker", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Reroll job finishes.", props: ["page_id|string|R|", "new_version_index|int|R|", "status|enum(done,failed)|R|", "cost_usd|decimal|R|", "charge_refunded|bool|R|"], kpis: ["Q3_reroll_rate", "Q5_generation_failure"]
});
ev("page_version_selected", "feedback", {
  stage: "proof", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User switches the current version of a page (for example back to an earlier one).",
  props: ["page_id|string|R|", "from_version|int|R|", "to_version|int|R|", "versions_available|int|R|"], kpis: ["Q6_user_rating", "Q3_reroll_rate"],
  note: "Feeds ml.preference_pairs (chosen vs rejected attempt ids). No image content involved."
});
ev("rating_submitted", "feedback", {
  stage: "proof", src: "client", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "Thumb or star on a model sheet, page, story or the finished proof.", props: ["target_type|enum(model_sheet,page,story,card_front,card_message,proof)|R|", "target_id|string|O|", "signal|enum(thumbs,stars)|R|", "value|int|R|", "reason_codes|enum[](likeness_off,wrong_count,style_off,text_in_image,story_flat,love_it,other)|O|", "has_free_text|bool|R|"],
  kpis: ["Q6_user_rating"], note: "Free text itself is not an event property; stored in ml.text_samples only for T1+ consent."
});

/* ---------------- PROOF ---------------- */
ev("proof_viewed", "proof", {
  stage: "proof", src: "client", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "Proof viewer opens.", props: ["product|enum(card,book)|R|", "pages_viewed|int|O|Updated on leave", "seconds_viewed|int|O|", "device|enum(mobile,tablet,desktop)|R|"], kpis: ["C2_proof_to_cart"]
});
ev("layout_job_finished", "proof", {
  stage: "proof", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "Print PDFs and preview generated.", props: ["job_id|string|R|", "status|enum(succeeded,failed)|R|", "run_ms|int|R|", "validator_errors|int|O|Printer file validation", "pages|int|R|"], kpis: ["F4_print_reject_rate", "Q5_generation_failure"]
});
ev("proof_approved", "proof", {
  stage: "proof", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User approves the proof (stores page hashes for evidence, legal 06 req 32).",
  props: ["product|enum(card,book)|R|", "rerolls_used|int|R|", "sheet_redos_used|int|R|", "pages_with_reroll|int|R|", "story_edits|int|R|", "digital_copy|bool|R|", "seconds_since_brief_completed|int|R|", "total_cost_usd|decimal|R|"],
  kpis: ["B5_proof_approval", "Q7_approval_without_reroll", "U1_cost_per_creation", "NSM_funnel"]
});
ev("proof_link_opened", "proof", {
  stage: "proof", src: "client", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "User arrives from a 'proof ready' email link. Replaces the open-pixel event proof_email_open.", props: ["email_kind|enum(proof_ready,order_confirmation,shipped,reminder)|R|"], kpis: ["C2_proof_to_cart"], replaces: "proof_email_open",
  attorney: "Recommend no open-tracking pixels in transactional email; confirm."
});

/* ---------------- COMMERCE ---------------- */
ev("cart_item_added", "commerce", {
  stage: "cart", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Item added to cart.", props: ["sku|enum(card_digital,card_mailed,book_digital,book_24,book_32)|R|", "product|enum(card,book)|R|", "price_cents|int|R|", "postage_cents|int|R|", "quantity|int|R|", "cart_items_total|int|R|", "cart_value_cents|int|R|"], kpis: ["C2_proof_to_cart", "C4_aov", "C6_mix"], replaces: "add_to_cart"
});
ev("cart_viewed", "commerce", {
  stage: "cart", src: "client", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "Cart page rendered.", props: ["items|int|R|", "cart_value_cents|int|R|"], kpis: ["C2_cart_to_checkout"]
});
ev("cart_item_removed", "commerce", {
  stage: "cart", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Item removed.", props: ["sku|enum(skus)|R|", "reason|enum(user,expired,invalid)|R|"], kpis: ["C2_cart_to_checkout"]
});
ev("checkout_started", "commerce", {
  stage: "checkout", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Pending checkout created and Stripe session opened.", props: ["checkout_id|string|R|", "items|int|R|", "subtotal_cents|int|R|", "shipping_method|enum(standard,express)|R|", "has_printed|bool|R|", "ship_country|enum(US)|O|", "ship_state|string|O|US state code only", "proof_consent_given|bool|R|"],
  kpis: ["C2_cart_to_checkout", "C3_checkout_to_paid"], replaces: "checkout_start"
});
ev("checkout_consent_given", "commerce", {
  stage: "checkout", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: 1825, phase: "launch",
  trigger: "Proof approval + refund policy acceptance at checkout (legal 06 req 39).", props: ["policy_version|string|R|", "proof_approved|bool|R|", "items|int|R|"], kpis: ["P3_consent_coverage"]
});
ev("payment_succeeded", "commerce", {
  stage: "payment", src: "webhook", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Stripe checkout.session.completed processed (idempotent via processedEvents). The only source for purchase counts and for ad-platform conversion sending.",
  props: ["order_id|string|R|", "checkout_id|string|R|", "total_cents|int|R|", "subtotal_cents|int|R|", "postage_cents|int|R|", "shipping_method_cents|int|R|", "tax_cents|int|R|", "currency|enum(usd)|R|", "items|int|R|", "skus|enum[](skus)|R|", "has_printed|bool|R|", "is_first_order|bool|R|", "channel_first_touch|string|O|", "channel_last_touch|string|O|", "utm_campaign_last|string|O|", "stripe_fee_cents|int|O|"],
  kpis: ["NSM_funnel", "C1_start_to_purchase", "C4_aov", "C5_items_per_order", "C6_mix", "U6_cac_by_channel", "U8_contribution_margin"], replaces: "purchase",
  attorney: "What may be sent to ad platforms server-side (value, currency, event_id only vs hashed email); sale/share classification."
});
ev("payment_failed", "commerce", {
  stage: "payment", src: "webhook", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Stripe reports a failed or expired session/payment intent.", props: ["checkout_id|string|R|", "reason|enum(declined,expired,cancelled,fraud_block,error)|R|", "total_cents|int|R|"], kpis: ["C3_checkout_to_paid"]
});
ev("order_created", "commerce", {
  stage: "payment", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Order record created from a completed checkout (one per order).", props: ["order_id|string|R|", "items|int|R|", "promised_delivery_date|date|O|", "printer_by_item|string[]|O|"], kpis: ["NSM_funnel"]
});
ev("refund_issued", "commerce", {
  stage: "post", src: "webhook", cls: "C1", tier: "T0", owner: "CFO", ret: D, phase: "launch",
  trigger: "Refund created in Stripe or via admin.", props: ["order_id|string|R|", "refund_cents|int|R|", "full|bool|R|", "reason_code|enum(quality_failed_proof,print_defect,late_delivery,duplicate,customer_remorse,fraud,other)|R|", "days_since_order|int|R|"], kpis: ["F3_refund_reprint_rate", "NSM_funnel", "U8_contribution_margin"]
});
ev("dispute_opened", "commerce", {
  stage: "post", src: "webhook", cls: "C1", tier: "T0", owner: "CFO", ret: D, phase: "launch",
  trigger: "Stripe dispute created.", props: ["order_id|string|R|", "amount_cents|int|R|", "reason|string|O|Stripe reason code"], kpis: ["F3_refund_reprint_rate", "U8_contribution_margin"]
});

/* ---------------- FULFILLMENT ---------------- */
ev("fulfillment_submitted", "fulfillment", {
  stage: "fulfillment", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Order item submitted to Lulu/Prodigi.", props: ["order_id|string|R|", "order_item_id|string|R|", "printer|enum(lulu,prodigi,gelato)|R|", "sku|enum(skus)|R|", "validation_errors|int|R|", "submit_latency_ms|int|R|", "attempt|int|R|"], kpis: ["F4_print_reject_rate", "F1_on_time_delivery"]
});
ev("fulfillment_status_changed", "fulfillment", {
  stage: "fulfillment", src: "webhook", cls: "C0", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Printer webhook or poll moves an item/order along the state machine (orderState.ts).", props: ["order_id|string|R|", "order_item_id|string|R|", "printer|enum(lulu,prodigi,gelato)|R|", "from_status|enum(order_statuses)|R|", "to_status|enum(order_statuses)|R|", "raw_state|string|O|Printer's own state name", "hours_in_prev_status|decimal|O|"],
  kpis: ["F1_on_time_delivery", "F2_needs_attention_rate"]
});
ev("order_shipped", "fulfillment", {
  stage: "fulfillment", src: "webhook", cls: "C0", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "First shipped status per item.", props: ["order_id|string|R|", "order_item_id|string|R|", "carrier|string|O|", "days_since_payment|decimal|R|", "print_cost_cents|int|O|Actual from printer", "ship_cost_cents|int|O|Actual from printer"], kpis: ["F1_on_time_delivery", "U5_print_ship_cost"]
});
ev("order_delivered", "fulfillment", {
  stage: "fulfillment", src: "webhook", cls: "C0", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Delivered status.", props: ["order_id|string|R|", "days_since_payment|decimal|R|", "on_time|bool|O|Against promised_delivery_date", "days_late|int|O|"], kpis: ["F1_on_time_delivery", "NSM_funnel"]
});
ev("fulfillment_needs_attention", "fulfillment", {
  stage: "fulfillment", src: "webhook", cls: "C0", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Item enters needs_attention (reject, error, hold).", props: ["order_id|string|R|", "order_item_id|string|R|", "printer|enum(lulu,prodigi,gelato)|R|", "reason_code|enum(file_rejected,address_invalid,out_of_stock,printer_error,delay,other)|R|"], kpis: ["F2_needs_attention_rate", "F4_print_reject_rate"]
});
ev("reprint_created", "fulfillment", {
  stage: "post", src: "server", cls: "C1", tier: "T0", owner: "CFO", ret: D, phase: "launch",
  trigger: "Reprint/reship created for an item.", props: ["order_id|string|R|", "order_item_id|string|R|", "reason_code|enum(print_defect,damaged,lost,quality_failed_proof,address_error,other)|R|", "extra_cost_cents|int|O|"], kpis: ["F3_refund_reprint_rate", "U8_contribution_margin"]
});
ev("delay_notice_sent", "fulfillment", {
  stage: "post", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Late-delivery notice sent (legal 06 req 37).", props: ["order_id|string|R|", "days_late_projected|int|R|", "cancel_offered|bool|R|"], kpis: ["F1_on_time_delivery"]
});

/* ---------------- LIFECYCLE ---------------- */
ev("email_sent", "lifecycle", {
  stage: "post", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "Any email handed to Resend.", props: ["email_kind|enum(magic_link,order_confirmation,proof_ready,shipped,delay_notice,purge_reminder,deletion_confirmation,marketing)|R|", "provider_status|enum(accepted,failed)|R|", "class|enum(transactional,marketing)|R|"], kpis: ["P2_photo_purge_ontime", "R3_reminder_opt_in"]
});
ev("email_unsubscribed", "lifecycle", {
  stage: "post", src: "webhook", cls: "C1", tier: "T0", owner: "CMO", ret: 1825, phase: "launch",
  trigger: "One-click unsubscribe or Resend suppression webhook.", props: ["list|enum(marketing,reminders)|R|"], kpis: ["R3_reminder_opt_in"]
});
ev("survey_responded", "lifecycle", {
  stage: "post", src: "server", cls: "C1", tier: "T0", owner: "CX", ret: D, phase: "launch",
  trigger: "Post-delivery survey submitted (sent 5 days after delivered).", props: ["order_id|string|R|", "nps|int|R|0-10", "csat_print_quality|int|O|1-5", "csat_art_quality|int|O|1-5", "reason_codes|enum[](art_quality,likeness,print_quality,late,price,story,love_it,other)|O|", "has_free_text|bool|R|", "would_reorder|bool|O|"],
  kpis: ["Q6_user_rating", "R1_repeat_rate", "NSM_funnel"]
});
ev("reminder_opt_in_changed", "lifecycle", {
  stage: "post", src: "server", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "post_launch",
  trigger: "User adds/removes an occasion reminder.", props: ["action|enum(added,removed)|R|", "occasion|enum(brief.OCCASIONS)|R|", "days_ahead|int|O|"], kpis: ["R3_reminder_opt_in", "R1_repeat_rate"],
  attorney: "Reminders store a recipient's occasion date; confirm treatment of third-party (recipient) data."
});
ev("reorder_started", "lifecycle", {
  stage: "post", src: "server", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "User starts a creation from a past order or saved Person.", props: ["source|enum(order,saved_person,reminder_email)|R|", "product|enum(card,book)|R|", "days_since_last_order|int|O|"], kpis: ["R1_repeat_rate"]
});
ev("digital_delivery_completed", "lifecycle", {
  stage: "post", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Digital card/book downloaded or e-card sent.", props: ["order_id|string|R|", "sku|enum(skus)|R|", "channel|enum(download,email,link)|R|"], kpis: ["NSM_funnel", "C6_mix"]
});

/* ---------------- SUPPORT ---------------- */
ev("support_contact_created", "support", {
  stage: "post", src: "server", cls: "C1", tier: "T0", owner: "CX", ret: D, phase: "launch",
  trigger: "Support form, email or chat creates a ticket. The ticket body stays in the helpdesk.", props: ["ticket_id|string|R|", "channel|enum(form,email,chat,social)|R|", "category|enum(order_status,quality,refund,billing,account,privacy_request,takedown,bug,other)|R|", "order_id|string|O|", "stage_when_contacted|enum(pre_purchase,creating,proof,post_payment,fulfillment,delivered)|R|"],
  kpis: ["S1_contact_rate", "NSM_funnel"]
});
ev("support_ticket_resolved", "support", {
  stage: "post", src: "server", cls: "C1", tier: "T0", owner: "CX", ret: D, phase: "launch",
  trigger: "Ticket closed.", props: ["ticket_id|string|R|", "first_response_minutes|int|R|", "resolution_hours|decimal|R|", "resolution|enum(info,reprint,refund,fix_bug,no_action,escalated_legal)|R|", "csat|int|O|1-5"], kpis: ["S2_first_response", "F3_refund_reprint_rate"]
});
ev("content_report_submitted", "support", {
  stage: "post", src: "server", cls: "C1", tier: "T0", owner: "CX", ret: 365, phase: "launch",
  trigger: "'Report content / remove a photo of me or my child' form submitted (legal 06 req 22).", props: ["report_type|enum(photo_removal,copyright,harmful_content,other)|R|", "is_about_minor|bool|O|", "source_page|enum(footer,proof,account,email)|R|"], kpis: ["P5_moderation_rate", "P1_deletion_sla"],
  attorney: "Takedown/removal SLA (48 h target) and evidence handling."
});

/* ---------------- PRIVACY ---------------- */
ev("data_export_requested", "privacy", {
  stage: "account", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: 1825, phase: "launch",
  trigger: "User requests 'download my data'.", props: ["request_id|string|R|", "channel|enum(self_service,email,support)|R|", "includes_analytics|bool|R|"], kpis: ["P1_deletion_sla"]
});
ev("deletion_requested", "privacy", {
  stage: "account", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: 1825, phase: "launch",
  trigger: "Delete-my-data or delete-account confirmed (after magic-link confirmation).", props: ["request_id|string|R|", "kind|enum(account,data_only,consent_withdrawal,underage_lockout)|R|", "channel|enum(self_service,email,support,system)|R|", "open_orders|int|R|", "account_age_days|int|R|"], kpis: ["P1_deletion_sla"],
  note: "Recorded in privacy.deletion_log without a subject id; no event row survives the deletion it describes (delete_subject removes it)."
});
ev("deletion_completed", "privacy", {
  stage: "account", src: "worker", cls: "C0", tier: "T0", owner: "Data", ret: 1825, phase: "launch",
  trigger: "All privacy.deletion_tasks for the request left 'pending'.", props: ["request_id|string|R|", "duration_hours|decimal|R|", "tasks_total|int|R|", "tasks_retained_by_law|int|R|", "tasks_failed|int|R|", "datasets_flagged|int|R|"], kpis: ["P1_deletion_sla"]
});
ev("retention_job_run", "privacy", {
  stage: "account", src: "batch", cls: "C0", tier: "T0", owner: "Data", ret: SYS, phase: "launch",
  trigger: "Nightly privacy.purge_expired() finishes.", props: ["job|enum(events_purge,guest_expiry,consent_purge,ledger_strip,text_samples_purge)|R|", "rows_affected|int|R|", "duration_ms|int|R|", "overdue_rows|int|R|"], kpis: ["P2_photo_purge_ontime"]
});
ev("training_candidate_registered", "privacy", {
  stage: "ml", src: "batch", cls: "C0", tier: "T1", owner: "Data", ret: 1825, phase: "post_launch",
  trigger: "A row enters ml.training_candidates (default status 'quarantined').", props: ["modality|enum(text_story,text_message,text_prompt,image_art,qa_label,preference_pair)|R|", "content_class|enum(C1,C3,C4)|R|", "status|enum(quarantined,eligible,excluded)|R|", "gate_failed|enum[](no_t2_consent,no_signoff,likeness,photo_derived,minors_possible,pii_scan,moderation)|O|"], kpis: ["P4_tier_mix"]
});

/* ---------------- SAFETY ---------------- */
ev("text_moderation_result", "safety", {
  stage: "brief", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: 365, phase: "launch",
  trigger: "Moderation runs on a brief, story, chat message or name field.", props: ["surface|enum(chat,brief_field,story,message,name_field,feedback)|R|", "result|enum(pass,block,rewrite)|R|", "category|enum(none,sexual,violence,hate,self_harm,minor_safety,public_figure,copyright,other)|R|", "engine|enum(rules,model)|R|"], kpis: ["P5_moderation_rate"]
});
ev("output_check_result", "safety", {
  stage: "qa", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: 365, phase: "launch",
  trigger: "Character/logo/celebrity vision check on a rendered page (legal 06 req 19).", props: ["page_id|string|R|", "result|enum(pass,rerolled,blocked)|R|", "category|enum(none,copyright_character,logo,celebrity)|R|"], kpis: ["P5_moderation_rate", "Q1_first_pass_qa"]
});

ev("ip_input_rewritten", "safety", {
  stage: "intake", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: 365, phase: "launch",
  trigger: "IP-safety screening rewrote customer text so a protected character, brand, franchise or slogan became an original idea (docs/legal/07).", props: ["surface|enum(chat,card_message,story_idea,character_note,photo_caption,reroll_note,brief_field,story_text,image_prompt)|R|Where the text was typed or produced", "detected_count|int|R|Number of items found", "detected_kinds|string[]|R|Kinds only: character, brand, slogan, person, franchise", "engine|enum(rules,model)|R|", "changed_chars|int|R|Length of the text before minus after, absolute value"], kpis: ["P5_moderation_rate"]
});
ev("ip_input_blocked", "safety", {
  stage: "intake", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: 365, phase: "launch",
  trigger: "IP-safety screening refused customer text (for example a real public figure) and asked for a different direction.", props: ["surface|enum(chat,card_message,story_idea,character_note,photo_caption,reroll_note,brief_field,story_text,image_prompt)|R|", "detected_count|int|R|", "detected_kinds|string[]|R|Kinds only", "engine|enum(rules,model)|R|"], kpis: ["P5_moderation_rate", "Q9_intake_friction"]
});
ev("ip_output_flagged", "safety", {
  stage: "qa", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: 365, phase: "launch",
  trigger: "Output vision check flagged a rendered page (recognisable protected character, logo, slogan, licensed merchandise or high look-alike risk) or Sonnet-written story text was flagged.", props: ["page_id|string|R|", "flags|string[]|R|Closed list: protected_character, logo, slogan, licensed_merch, lookalike_risk, story_text", "lookalike_risk|int|O|0-10 score from the vision check", "is_final|bool|R|True when the page was blocked after the re-roll"], kpis: ["P5_moderation_rate", "Q1_first_pass_qa"]
});
ev("ip_output_rerolled", "safety", {
  stage: "qa", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: 365, phase: "launch",
  trigger: "A flagged page was automatically re-rolled once with a hardened prompt.", props: ["page_id|string|R|", "flags|string[]|R|Same closed list as ip_output_flagged", "passed_after_reroll|bool|R|", "cost_usd|decimal|O|Extra spend of the re-roll and its check"], kpis: ["P5_moderation_rate", "Q2_auto_reroll_rate"]
});

/* ---------------- EXPERIMENTS ---------------- */
ev("experiment_assigned", "experiment", {
  stage: "ml", src: "server", cls: "C1", tier: "T0", owner: "Data", ret: D, phase: "post_launch",
  trigger: "A unit is first bucketed into an experiment.", props: ["experiment_key|string|R|", "variant|string|R|", "unit|enum(subject,creation,session)|R|"], kpis: ["Q1_first_pass_qa", "B3_brief_completion"]
});
