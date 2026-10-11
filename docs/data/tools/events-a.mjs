// Source of truth for the tracking plan (part A: acquisition to model sheet). Part B is events-b.mjs.
// `node build-tracking-plan.mjs` emits ../tracking-plan.json and the event tables in ../01-tracking-plan.md.
// Property spec: "name|type|R or O|description". Every property is class C1 (pseudonymous behaviour) or C0 (system):
// no names, emails, addresses, IPs, free text, file names or image content may be a property (build script enforces a deny-list).

export const D = 395; // 13 months raw behavioural retention
export const SYS = 730; // system events
export const E = [];
export const ev = (name, domain, o) => E.push({ name, domain, ...o });

/* ---------------- ACQUISITION ---------------- */
ev("page_viewed", "acquisition", {
  stage: "visit", src: "client", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "Route change on any page once analytics is allowed. On pages that show photos or children's names only the first-party collector runs, never third-party tags.",
  props: ["page_type|enum(home,template_gallery,template_detail,product_card,product_book,pricing,faq,seo_occasion,creator,proof,cart,checkout,account,legal,other)|R|Coarse page class, never the raw URL path",
    "template_id|string|O|Template slug when page_type is template_detail", "occasion|enum(brief.OCCASIONS)|O|Occasion for SEO/occasion pages",
    "referrer_host|string|O|Host only, no path or query", "utm_source|string|O|Lower-cased, max 40 chars", "utm_medium|string|O|", "utm_campaign|string|O|", "utm_content|string|O|",
    "channel|enum(meta,pinterest,google_search,tiktok,creator,seo,email,direct,referral,other)|O|Derived from utm/referrer using the CMO CSV channel names",
    "is_entrance|bool|R|First page of the session", "viewport_class|enum(mobile,tablet,desktop)|R|", "lcp_ms|int|O|Largest contentful paint"],
  kpis: ["A1_visitors", "A2_channel_mix", "B1_visitor_to_signup"], replaces: "view_home",
  note: "Query strings are stripped to the allowlisted utm_* keys. Ad click ids (fbclid, gclid) are never stored in analytics tables."
});
ev("attribution_captured", "acquisition", {
  stage: "visit", src: "server", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "First request of a new anonymous_id carrying utm/referrer data; writes first_touch on the session and later on the user.",
  props: ["channel|enum(channels)|R|", "utm_source|string|O|", "utm_medium|string|O|", "utm_campaign|string|O|", "utm_content|string|O|", "landing_page_type|string|R|", "referrer_host|string|O|"],
  kpis: ["A2_channel_mix", "U6_cac_by_channel"]
});
ev("consent_banner_decided", "acquisition", {
  stage: "visit", src: "client", cls: "C1", tier: "T0", owner: "CTO", ret: 1825, phase: "launch",
  trigger: "User accepts, rejects or customises the privacy banner on marketing pages, or a Global Privacy Control signal is detected.",
  props: ["analytics_choice|enum(accept,reject,default)|R|", "marketing_choice|enum(accept,reject,default)|R|", "gpc_detected|bool|R|", "banner_version|string|R|"],
  kpis: ["P3_consent_coverage"], attorney: "Whether first-party operational analytics needs a banner choice at all; GPC handling; equal-weight buttons (legal 06 req 43)."
});
ev("template_clicked", "acquisition", {
  stage: "visit", src: "client", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "User clicks a template card in the gallery or on an SEO page.",
  props: ["template_id|string|R|", "product|enum(card,book)|R|", "occasion|enum(brief.OCCASIONS)|O|", "position|int|O|Grid position", "surface|enum(home,gallery,seo,account)|R|"],
  kpis: ["A3_template_ctr", "R4_template_popularity"], replaces: "template_click"
});
ev("creator_started", "acquisition", {
  stage: "creator", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "A draft/creation is created (guest or account) and the first intake step renders.",
  props: ["product|enum(card,book)|R|", "entry|enum(hero_cta,template,seo,saved_person,reorder,account,resume_draft)|R|", "template_id|string|O|", "is_guest|bool|R|", "occasion|enum(brief.OCCASIONS)|O|Prefilled by entry, if known"],
  kpis: ["B2_signup_to_start", "C1_start_to_purchase", "A3_guest_try_rate"], replaces: "creator_start"
});

/* ---------------- GUEST PREVIEW ---------------- */
ev("guest_preview_requested", "guest_preview", {
  stage: "guest", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Guest hits POST /api/card/preview (before rate-limit and spend-cap checks).",
  props: ["occasion|enum(brief.OCCASIONS)|R|", "tone|enum(brief.TONES)|R|", "art_style|enum(art_style_ids)|R|", "inside_illustration|bool|O|", "rate_limited|bool|R|", "spend_cap_blocked|bool|R|"],
  kpis: ["A3_guest_try_rate", "U2_guest_preview_cost"]
});
ev("guest_preview_rendered", "guest_preview", {
  stage: "guest", src: "worker", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Guest preview image returned to the browser (real or mock).",
  props: ["cost_usd|decimal|R|From OpenRouter usage.cost", "latency_ms|int|R|", "model_served|string|R|", "image_size|enum(1K,2K,4K)|R|", "mock|bool|R|", "prompt_version_id|string|R|", "qa_pass|bool|O|"],
  kpis: ["U2_guest_preview_cost", "A3_guest_try_rate"]
});
ev("guest_preview_failed", "guest_preview", {
  stage: "guest", src: "worker", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Preview pipeline failed or was blocked.",
  props: ["reason|enum(model_error,timeout,moderation,rate_limit,spend_cap,other)|R|", "cost_usd|decimal|O|Spend before failure", "latency_ms|int|O|"],
  kpis: ["Q5_generation_failure", "U2_guest_preview_cost"]
});
ev("signup_prompt_shown", "guest_preview", {
  stage: "guest", src: "client", cls: "C1", tier: "T0", owner: "CMO", ret: D, phase: "launch",
  trigger: "Upgrade prompt (save, photos, high-res) becomes visible to a guest.",
  props: ["trigger_reason|enum(save_draft,add_photos,hires_proof,reroll,checkout,manual)|R|", "after_preview|bool|R|"],
  kpis: ["B1_visitor_to_signup"]
});

/* ---------------- AUTH ---------------- */
ev("signup_started", "auth", {
  stage: "signup", src: "client", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User submits the sign-up form or starts Google OAuth.",
  props: ["method|enum(magic_link,google)|R|", "from|enum(prompt,header,checkout,creator,other)|R|"], kpis: ["B1_visitor_to_signup"]
});
ev("signup_completed", "auth", {
  stage: "signup", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Account created and age confirmation + policy acceptance stored (legal 06 req 1, 51). Triggers identity stitching (privacy.link_anonymous).",
  props: ["method|enum(magic_link,google)|R|", "age_confirmed|bool|R|", "terms_version|string|R|", "privacy_version|string|R|", "guest_draft_carried|bool|R|", "marketing_email_opt_in|bool|R|", "first_touch_channel|string|O|"],
  kpis: ["B1_visitor_to_signup", "B2_signup_to_start", "NSM_funnel"], replaces: "signup_complete"
});
ev("login_completed", "auth", {
  stage: "signup", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Existing user authenticated.", props: ["method|enum(magic_link,google)|R|", "merged_guest_draft|bool|R|", "days_since_last_login|int|O|"], kpis: ["R1_repeat_rate"]
});
ev("auth_failed", "auth", {
  stage: "signup", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "Magic link expired/used, OAuth error.", props: ["method|enum(magic_link,google)|R|", "reason|enum(expired,used,denied,error)|R|"], kpis: ["B1_visitor_to_signup"]
});
ev("age_gate_failed", "auth", {
  stage: "signup", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "18+ box not ticked at sign-up, or a user states they are under 18 (actual-knowledge handler, legal 06 req 2).",
  props: ["reason|enum(unticked,self_declared_minor,support_reported)|R|", "account_locked|bool|R|"], kpis: ["P1_deletion_sla"],
  attorney: "Actual-knowledge handling and what, if anything, may be kept after lockout."
});

/* ---------------- BRIEF / CHAT ---------------- */
ev("brief_started", "intake", {
  stage: "brief", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "First brief field saved for a creation.", props: ["product|enum(card,book)|R|", "mode|enum(chat,form,mixed)|R|", "is_guest|bool|R|"], kpis: ["B3_brief_completion"]
});
ev("brief_field_completed", "intake", {
  stage: "brief", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "A required or optional brief field becomes valid for the first time (server-validated).",
  props: ["field_key|enum(brief_field_keys)|R|Structured field name, never its value for free-text fields", "value_enum|string|O|Value only for enumerated fields (occasion, tone, art_style, reading_age, page_count, age_band)", "value_chars|int|O|Length only, for free-text fields", "source|enum(chat,form,template,people,rag)|R|Matches CardDraft FieldSource", "seconds_since_brief_start|int|R|", "order_index|int|R|Nth field completed"],
  kpis: ["B3_brief_completion", "R4_template_popularity"],
  note: "Recipient name, relationship text, character names, story idea, memory, inside jokes, message wording, include/avoid are free text: only value_chars is recorded."
});
ev("brief_field_edited", "intake", {
  stage: "brief", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User changes a previously completed field (brief card edit or chat correction).",
  props: ["field_key|enum(brief_field_keys)|R|", "source|enum(chat,form,template,people,rag)|R|", "edit_count_for_field|int|R|", "chars_delta|int|O|"], kpis: ["B3_brief_completion", "Q9_intake_friction"]
});
ev("brief_completed", "intake", {
  stage: "brief", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "missingFields(draft) returns empty; creation becomes generation-ready.",
  props: ["product|enum(card,book)|R|", "occasion|enum(brief.OCCASIONS)|R|", "tone|enum(brief.TONES)|R|", "art_style|enum(art_style_ids)|R|", "reading_age|enum(0-2,3-5,6-8)|O|", "page_count|enum(24,32)|O|", "character_count|int|R|", "has_pet|bool|R|", "uses_saved_person|bool|R|", "inside_illustration|bool|O|", "delivery|enum(print_mail,ecard,pdf)|O|", "source_mix_chat|int|R|", "source_mix_form|int|R|", "source_mix_template|int|R|", "story_idea_chars|int|O|", "message_chars|int|O|", "duration_s|int|R|", "chat_turns|int|R|", "planned_renders|int|R|From plannedRenders()", "planned_cost_usd|decimal|O|"],
  kpis: ["B3_brief_completion", "C6_mix", "R4_template_popularity", "U1_cost_per_creation"], replaces: "brief_complete"
});
ev("brief_abandoned", "intake", {
  stage: "brief", src: "batch", cls: "C1", tier: "T0", owner: "Data", ret: D, phase: "launch",
  trigger: "Derived nightly: creation with no activity for 24 h before brief_completed. Not a client event.",
  props: ["product|enum(card,book)|R|", "last_field_key|enum(brief_field_keys)|O|", "fields_completed|int|R|", "had_chat|bool|R|", "intake_cost_usd|decimal|R|", "is_guest|bool|R|"],
  kpis: ["B3_brief_completion", "U3_abandoned_draft_cost"]
});
ev("chat_session_started", "intake", {
  stage: "brief", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Greet Guide session opens; AI disclosure shown (legal 06 req 12).",
  props: ["ai_disclosure_shown|bool|R|", "model|string|R|", "prompt_version_id|string|R|", "is_guest|bool|R|", "mock|bool|R|"], kpis: ["B3_brief_completion", "U1_cost_per_creation"]
});
ev("chat_turn_completed", "intake", {
  stage: "brief", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "One user message plus guide reply (POST /api/intake) finishes.",
  props: ["turn_index|int|R|", "user_chars|int|R|Length of the user message only", "reply_chars|int|R|", "tool_calls|int|R|", "fields_patched|int|R|", "quick_reply_used|bool|R|", "prompt_tokens|int|O|", "completion_tokens|int|O|", "cost_usd|decimal|R|", "latency_ms|int|R|", "model|string|R|", "prompt_version_id|string|R|", "guardrail_hit|enum(none,sensitive,public_figure,copyright_rewrite,photo_guest,other)|R|", "retrieval_used|bool|O|", "retrieval_hit_ids|string[]|O|Knowledge-base doc ids only"],
  kpis: ["B3_brief_completion", "U1_cost_per_creation", "Q9_intake_friction"],
  note: "Message text is never an event property. Chat transcripts live only in the operational draft record under the draft retention rule."
});
ev("chat_guardrail_triggered", "intake", {
  stage: "brief", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: 365, phase: "launch",
  trigger: "Rule-based or model moderation blocks or rewrites chat/brief text.",
  props: ["guardrail|enum(sensitive,public_figure,copyright_rewrite,photo_guest,moderation_model)|R|", "action|enum(blocked,rewritten,warned)|R|", "surface|enum(chat,form,story,message)|R|"], kpis: ["Q9_intake_friction", "P5_moderation_rate"],
  attorney: "Retention of the flagged text itself (not stored here); moderation log retention is 12 months in legal 02 s7."
});
ev("draft_saved", "intake", {
  stage: "brief", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Account draft persisted (explicit save or autosave milestone).", props: ["product|enum(card,book)|R|", "fields_completed|int|R|", "autosave|bool|R|"], kpis: ["B3_brief_completion"]
});

/* ---------------- CONSENT ---------------- */
ev("consent_modal_shown", "consent", {
  stage: "photos", src: "client", cls: "C1", tier: "T0", owner: "CTO", ret: 1825, phase: "launch",
  trigger: "Photo-consent modal opens before the first upload.", props: ["wording_version|string|R|", "reason|enum(first_upload,wording_changed,reprompt)|R|"], kpis: ["P3_consent_coverage"]
});
ev("consent_recorded", "consent", {
  stage: "photos", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: 1825, phase: "launch",
  trigger: "ConsentRecord written (privacy.consent_records). Properties are flags only; IP and UA stay in the consent ledger.",
  props: ["consent_id|string|R|", "wording_version|string|R|", "box_a|bool|R|", "box_b|bool|R|", "box_c_keep_person|bool|R|", "box_d_marketing|bool|R|", "box_e_improve|bool|R|Proposed T1 opt-in", "box_f_training|bool|R|Proposed T2 opt-in; UI hidden until legal sign-off", "photo_count|int|R|"],
  kpis: ["P3_consent_coverage", "P4_tier_mix"], attorney: "Final wording of boxes A-F; whether box E/F consent can be given by an adult for content that depicts a minor."
});
ev("consent_changed", "consent", {
  stage: "account", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: 1825, phase: "launch",
  trigger: "User toggles improvement/training/marketing/keep-person consent in Settings, or withdraws consent.",
  props: ["consent_id|string|R|", "change|enum(granted,withdrawn)|R|", "scope|enum(improve,training,keep_person,marketing_use,photos_all,email_marketing)|R|", "new_tier|enum(T0,T1,T2)|R|"], kpis: ["P3_consent_coverage", "P4_tier_mix"],
  note: "Withdrawal triggers deletion tasks for the affected scope (see 06-data-governance)."
});
ev("policy_accepted", "consent", {
  stage: "signup", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: 1825, phase: "launch",
  trigger: "Terms/Privacy acceptance recorded at signup or checkout (legal 06 req 51).", props: ["terms_version|string|R|", "privacy_version|string|R|", "context|enum(signup,checkout,reprompt)|R|"], kpis: ["P3_consent_coverage"]
});

/* ---------------- PHOTOS ---------------- */
ev("photo_upload_started", "photos", {
  stage: "photos", src: "client", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User picks files in the upload step (after the consent gate passes).", props: ["file_count|int|R|", "character_role|enum(human,pet,place)|R|", "consent_id|string|R|"], kpis: ["B3_brief_completion", "P3_consent_coverage"],
  note: "No client-side face detection, no EXIF, no filenames, no image-derived signal of any kind (biometric risk, legal 02 s5)."
});
ev("photo_uploaded", "photos", {
  stage: "photos", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Photo stored in private storage after moderation passes.",
  props: ["photo_id|string|R|Opaque id", "consent_id|string|R|", "character_role|enum(human,pet,place)|R|", "age_band|enum(brief.AGE_BANDS)|R|Declared by the user, never inferred from the image", "bytes_bucket|enum(lt_1mb,1_3mb,3_8mb,gt_8mb)|R|", "megapixel_bucket|enum(lt_1,1_4,4_12,gt_12)|R|", "content_type|enum(jpeg,png,webp,heic)|R|", "expires_at|timestamp|R|Purge date (90 days)", "keep_person|bool|R|"],
  kpis: ["B3_brief_completion", "P2_photo_purge_ontime"], attorney: "Whether the declared age_band of a depicted child is itself 'known child' data under state law; kept only for purge scheduling and consent coverage."
});
ev("photo_upload_blocked", "photos", {
  stage: "photos", src: "server", cls: "C0", tier: "T0", owner: "CTO", ret: 365, phase: "launch",
  trigger: "Upload rejected: size, type, no consent id, rate limit, or moderation block. CSAM hits are NOT logged here (separate restricted safety log).",
  props: ["reason|enum(size,type,dimensions,no_consent,moderation_block,rate_limit)|R|", "character_role|enum(human,pet,place)|O|"], kpis: ["P5_moderation_rate", "Q9_intake_friction"],
  attorney: "CSAM procedure and evidence preservation must live outside analytics (legal 02 s8, 06 req 18)."
});
ev("photo_deleted", "photos", {
  stage: "photos", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "A photo is removed (user, purge job, deletion flow, consent withdrawal).", props: ["photo_id|string|R|", "reason|enum(user,retention_90d,guest_expiry,account_deletion,consent_withdrawn,moderation)|R|", "age_days|int|R|"], kpis: ["P2_photo_purge_ontime"]
});
ev("photo_purge_run", "photos", {
  stage: "photos", src: "worker", cls: "C0", tier: "T0", owner: "CTO", ret: SYS, phase: "launch",
  trigger: "Daily purge job finishes (legal 06 req 25).", props: ["photos_deleted|int|R|", "projects_touched|int|R|", "overdue_count|int|R|Photos past expires_at that were not deleted", "duration_ms|int|R|", "reminders_sent|int|R|"], kpis: ["P2_photo_purge_ontime"]
});
ev("saved_person_changed", "photos", {
  stage: "account", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Saved Person created, reused in a creation, deleted or expired.", props: ["action|enum(created,reused,deleted,expired)|R|", "age_band|enum(brief.AGE_BANDS)|R|", "uses_count|int|O|"], kpis: ["R1_repeat_rate", "R3_saved_person_rate"]
});

/* ---------------- STORY ---------------- */
ev("story_generated", "story", {
  stage: "story", src: "worker", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Story job succeeds (book) or card copy generated.", props: ["job_id|string|R|", "kind|enum(book_story,card_copy)|R|", "spread_count|int|O|", "total_words|int|O|", "cost_usd|decimal|R|", "latency_ms|int|R|", "model_served|string|R|", "prompt_version_id|string|R|", "attempt_count|int|R|"],
  kpis: ["U1_cost_per_creation", "Q5_generation_failure"]
});
ev("story_edited", "story", {
  stage: "story", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User saves changes to a story page, title, dedication or card message.",
  props: ["target|enum(story_page,title,dedication,card_message)|R|", "page_index|int|O|", "chars_before|int|R|", "chars_after|int|R|", "edit_distance_ratio|decimal|R|0 unchanged, 1 rewritten; computed server-side, text discarded", "edit_kind|enum(minor,moderate,rewrite,delete,add)|R|", "source_job_id|string|O|"],
  kpis: ["Q10_story_edit_rate", "Q6_user_rating"], note: "Edit text diffs are stored only under T1 consent, in ml.text_samples, scrubbed."
});
ev("story_approved", "story", {
  stage: "story", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User approves the story.", props: ["edited_page_count|int|R|", "total_pages|int|R|", "regenerations|int|R|", "seconds_in_step|int|R|"], kpis: ["B4_sheet_approval", "Q10_story_edit_rate"]
});

/* ---------------- MODEL SHEET ---------------- */
ev("model_sheet_generated", "sheet", {
  stage: "sheet", src: "worker", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "Sheet job succeeds (a version is added).", props: ["job_id|string|R|", "version_index|int|R|", "character_count|int|R|", "cost_usd|decimal|R|", "latency_ms|int|R|", "model_served|string|R|", "image_size|enum(1K,2K,4K)|R|", "prompt_version_id|string|R|", "zdr_requested|bool|R|", "uses_saved_person|bool|R|", "qa_pass|bool|O|"],
  kpis: ["B4_sheet_approval", "U1_cost_per_creation", "Q4_sheet_redo_rate"]
});
ev("model_sheet_redo_requested", "sheet", {
  stage: "sheet", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User asks to redo the model sheet (free redo or paid reroll).",
  props: ["version_index|int|R|", "charge|enum(free_redo,reroll)|R|", "reason_codes|enum[](likeness_off,age_off,hair,clothes,style_off,wrong_count,pet_off,other)|O|Controlled list shown as chips", "has_note|bool|R|Whether a free-text note was typed; text not recorded", "characters_flagged|int|R|"],
  kpis: ["Q4_sheet_redo_rate", "Q3_reroll_rate"], note: "Reason 'likeness_off' is feedback about a generated drawing, not a face measurement."
});
ev("model_sheet_approved", "sheet", {
  stage: "sheet", src: "server", cls: "C1", tier: "T0", owner: "CTO", ret: D, phase: "launch",
  trigger: "User approves the model sheet; page rendering becomes allowed.", props: ["approved_version_index|int|R|", "versions_generated|int|R|", "free_redos_used|int|R|", "paid_rerolls_used|int|R|", "seconds_in_step|int|R|", "kept_as_person|bool|R|"],
  kpis: ["B4_sheet_approval", "Q4_sheet_redo_rate"], replaces: "book_sheet_approved"
});
ev("model_sheet_abandoned", "sheet", {
  stage: "sheet", src: "batch", cls: "C1", tier: "T0", owner: "Data", ret: D, phase: "launch",
  trigger: "Derived: sheet generated, no approval or redo within 7 days.", props: ["versions_generated|int|R|", "cost_usd|decimal|R|"], kpis: ["B4_sheet_approval", "U3_abandoned_draft_cost"]
});
