import { z } from "zod";
import { OCCASIONS, TONES } from "../brief";
import type { Scope } from "./grants";

/**
 * The 16 assistant tools. Source of truth: docs/integrations/05-tool-spec.md sections 2 and 5.
 * JSON Schema for MCP and REST is generated from these Zod inputs. Every tool carries explicit annotations
 * (directory requirement). Outputs are plain JSON from the service layer; tighten per phase.
 */
const idemKey = z.string().min(1).max(80);
const personId = z.string().regex(/^per_[A-Za-z0-9]{12,}$/);
const draftId = z.string().regex(/^drf_[A-Za-z0-9]{12,}$/);
const orderId = z.string().regex(/^ord_[A-Za-z0-9]{12,}$/);

export const PersonRefSchema = z.union([
  z.object({ personId }).strict(),
  z.object({ name: z.string().min(1).max(60), relationship: z.string().min(1).max(60) }).strict(),
]);

export const MessageInputSchema = z
  .object({
    mode: z.enum(["as_written", "polish", "compose"]).optional(),
    text: z.string().max(1200).optional(),
    memory: z.string().max(300).optional().describe("A short, user-visible reason for the card. No names of other people, no links."),
  })
  .strict();

export const TOOL_INPUTS = {
  search_styles: z.object({ occasion: z.enum(OCCASIONS).optional(), tone: z.enum(TONES).optional(), query: z.string().max(80).optional(), limit: z.number().int().min(1).max(12).default(6) }).strict(),
  list_people: z.object({ limit: z.number().int().min(1).max(50).default(20), cursor: z.string().optional() }).strict(),
  add_person: z.object({
    idempotencyKey: idemKey,
    name: z.string().min(1).max(60),
    relationship: z.string().min(1).max(60),
    // Minors cannot be created by an assistant (05 section 5.3).
    ageBand: z.enum(["adult", "senior", "pet"]),
    address: z.object({ name: z.string().max(80), line1: z.string().max(120), line2: z.string().max(120).optional(), city: z.string().max(80), region: z.string().max(40), postalCode: z.string().max(20), country: z.string().length(2) }).strict().optional(),
  }).strict(),
  get_quote: z.object({ product: z.literal("card_mailed"), quantity: z.number().int().min(1).max(10).default(1), shippingMethod: z.literal("standard").default("standard") }).strict(),
  get_account_limits: z.object({}).strict(),
  create_card_draft: z.object({
    idempotencyKey: idemKey,
    occasion: z.enum(OCCASIONS),
    occasionOther: z.string().max(80).optional(),
    recipient: PersonRefSchema,
    tone: z.enum(TONES),
    styleId: z.string().optional().describe("From search_styles. Omit to let GreetHub pick."),
    message: MessageInputSchema.optional(),
    mailTo: z.enum(["recipient", "buyer"]).default("recipient"),
    insideIllustration: z.boolean().default(false),
    trigger: z.object({ kind: z.enum(["user_request", "meeting_ended", "date_reminder", "standing_rule"]), occurredOn: z.string().date().optional() }).strict().optional(),
  }).strict(),
  revise_card_draft: z.object({
    idempotencyKey: idemKey,
    draftId,
    message: MessageInputSchema.optional(),
    styleId: z.string().optional(),
    tone: z.enum(TONES).optional(),
    insideIllustration: z.boolean().optional(),
    reason: z.string().max(200).optional(),
  }).strict(),
  preview_card: z.object({ draftId, waitSeconds: z.number().int().min(0).max(20).default(15) }).strict(),
  list_orders: z.object({ limit: z.number().int().min(1).max(20).default(10), status: z.array(z.string()).optional(), cursor: z.string().optional() }).strict(),
  track_order: z.object({ orderId }).strict(),
  request_approval: z.object({ idempotencyKey: idemKey, draftId, note: z.string().max(140).optional() }).strict(),
  cancel_order: z.object({ idempotencyKey: idemKey, orderId, reason: z.string().max(200).optional() }).strict(),
  approve_and_pay: z.object({ idempotencyKey: idemKey, draftId }).strict(),
  // P3 rules tools. Only a pending proposal is created; a human enables it on greethub.com (05 section 8).
  propose_standing_rule: z.object({
    idempotencyKey: idemKey,
    type: z.enum(["after_event", "annual_date"]),
    occasion: z.enum(OCCASIONS),
    recipientIds: z.array(personId).min(1).max(20),
    note: z.string().max(200).optional(),
  }).strict(),
  list_standing_rules: z.object({}).strict(),
  pause_standing_rule: z.object({ idempotencyKey: idemKey, ruleId: z.string().regex(/^rul_[A-Za-z0-9]{12,}$/) }).strict(),
} as const;

export type ToolName = keyof typeof TOOL_INPUTS;
export type ToolInput<N extends ToolName> = z.infer<(typeof TOOL_INPUTS)[N]>;

export type ToolMeta = {
  title: string;
  /** Function only, no steering (directory rule). */
  description: string;
  phase: 1 | 2 | 3;
  scope: Scope;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  openWorldHint: false;
  idempotentHint: boolean;
  needsIdempotencyKey: boolean;
  /** Spends model money (cost ledger reservation, draft quota). */
  spendsModelMoney?: boolean;
  /** Moves the user's money or voids an order. */
  movesMoney?: boolean;
  /** Takes free text that must pass the safety screen. */
  freeText?: boolean;
};

const m = (x: Omit<ToolMeta, "openWorldHint">): ToolMeta => ({ ...x, openWorldHint: false });
const READ = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, needsIdempotencyKey: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, needsIdempotencyKey: true } as const;

export const TOOL_META: Record<ToolName, ToolMeta> = {
  search_styles: m({ title: "Search card styles", description: "Lists GreetHub illustration styles that suit an occasion and tone.", phase: 1, scope: "cards:read", ...READ }),
  list_people: m({ title: "List saved people", description: "Lists the user's saved recipients by first name and relationship. Never returns addresses, emails, phones or photos.", phase: 1, scope: "cards:read", ...READ }),
  add_person: m({ title: "Save a recipient", description: "Saves an adult, senior or pet recipient. An address, if given, is stored unconfirmed until the account owner confirms it on greethub.com.", phase: 1, scope: "cards:draft", ...WRITE, freeText: true }),
  get_quote: m({ title: "Get a price quote", description: "Returns the price of a mailed card in US cents and whether it is within the user's assistant limits. Tax is worked out at payment.", phase: 1, scope: "cards:read", ...READ }),
  get_account_limits: m({ title: "Get assistant limits", description: "Returns the spending and drafting limits the user set for this assistant, and how much is used.", phase: 1, scope: "cards:read", ...READ }),
  create_card_draft: m({ title: "Create a card draft", description: "Starts a draft greeting card in the user's account and queues the illustration. Nothing is bought.", phase: 1, scope: "cards:draft", ...WRITE, spendsModelMoney: true, freeText: true }),
  revise_card_draft: m({ title: "Revise a card draft", description: "Changes the message, style or tone of an existing draft. A new style or tone re-renders the art and uses one of the included re-rolls.", phase: 1, scope: "cards:draft", ...WRITE, spendsModelMoney: true, freeText: true }),
  preview_card: m({ title: "Preview a card draft", description: "Returns the draft's status, front image, exact printed text and quote. Waits up to 20 seconds for the render.", phase: 1, scope: "cards:read", ...READ }),
  list_orders: m({ title: "List orders", description: "Lists the user's recent orders with status and total.", phase: 1, scope: "cards:read", ...READ }),
  track_order: m({ title: "Track an order", description: "Returns the status timeline and carrier tracking for one order. No address or payment details.", phase: 1, scope: "cards:read", ...READ }),
  request_approval: m({ title: "Ask the user to approve a card", description: "Sends the user an approval request for a ready draft. The user reviews, confirms the address and pays on greethub.com.", phase: 2, scope: "cards:request_send", ...WRITE, idempotentHint: true, freeText: true }),
  cancel_order: m({ title: "Cancel an order", description: "Cancels a paid order that has not been sent to the printer and starts a full refund.", phase: 2, scope: "cards:request_send", ...WRITE, destructiveHint: true, idempotentHint: true, movesMoney: true }),
  approve_and_pay: m({ title: "Approve and pay for a card", description: "Pays for a ready draft with the saved card inside the user's limits. Only available when the user turned on sending within limits.", phase: 3, scope: "cards:send_auto", ...WRITE, destructiveHint: true, idempotentHint: true, movesMoney: true }),
  propose_standing_rule: m({ title: "Propose a standing rule", description: "Creates a pending proposal for a recurring card rule. It does nothing until the user turns it on at greethub.com.", phase: 3, scope: "rules:manage", ...WRITE, freeText: true }),
  list_standing_rules: m({ title: "List standing rules", description: "Lists the user's standing rules and their state.", phase: 3, scope: "rules:manage", ...READ }),
  pause_standing_rule: m({ title: "Pause a standing rule", description: "Pauses one standing rule. Only the user can resume it.", phase: 3, scope: "rules:manage", ...WRITE, idempotentHint: true }),
};

export const TOOL_NAMES = Object.keys(TOOL_INPUTS) as ToolName[];
export const isToolName = (s: string): s is ToolName => Object.prototype.hasOwnProperty.call(TOOL_INPUTS, s);
export const AGENT_SCHEMA_VERSION = 1;
