import { z } from "zod";

/** Scopes, modes and limits. Source: docs/integrations/02-auth-and-delegation.md sections 2 and 3. */
export const SCOPES = ["cards:read", "cards:draft", "cards:request_send", "cards:send_auto", "rules:manage"] as const;
export type Scope = (typeof SCOPES)[number];
/** What the first authorization challenge may ask for. cards:send_auto only comes from a web step-up (02 section 2). */
export const DEFAULT_REQUEST_SCOPES: Scope[] = ["cards:read", "cards:draft", "cards:request_send"];

export const GRANT_MODES = ["draft_only", "send_with_approval", "autonomous"] as const;
export type GrantMode = (typeof GRANT_MODES)[number];

export const CLIENT_TIERS = ["known", "registered", "unknown"] as const;
export type ClientTier = (typeof CLIENT_TIERS)[number];
/** Highest mode each tier may be granted (02 trust tiers). */
export const MAX_MODE_FOR_TIER: Record<ClientTier, GrantMode> = { known: "autonomous", registered: "send_with_approval", unknown: "draft_only" };

/** Defaults are PROPOSED in 02 section 3 and open question 7; the owner confirms. Money in integer US cents. */
export const GrantLimitsSchema = z.object({
  perCardCents: z.number().int().min(0).default(1500),
  monthlyCents: z.number().int().min(0).default(5000),
  annualCents: z.number().int().min(0).default(12000),
  maxCardsPerMonth: z.number().int().min(0).default(6),
  maxDraftsPerDay: z.number().int().min(0).default(10),
  newRecipientsPerDay: z.number().int().min(0).default(3),
  recipientAllowlist: z.array(z.string()).default([]),
  occasionAllowlist: z.array(z.string()).default([]),
  requireApprovalFirstNPerRecipient: z.number().int().min(0).default(3),
  productAllowlist: z.array(z.enum(["card_mailed"])).default(["card_mailed"]),
});
export type GrantLimits = z.infer<typeof GrantLimitsSchema>;

export type Grant = {
  grantId: string;
  userId: string;
  clientId: string;
  clientTier: ClientTier;
  mode: GrantMode;
  scopes: Scope[];
  limits: GrantLimits;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  /** Set only by a web step-up plus the 24 hour cooling-off. Never by a tool call. */
  autonomyEnabledAt: string | null;
};
