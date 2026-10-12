/** Agent channel error contract. Source: docs/integrations/05-tool-spec.md section 3. */
export const TOOL_ERROR_CODES = [
  "validation_failed", "content_blocked", "sensitive_content", "scope_insufficient", "approval_required",
  "address_unconfirmed", "recipient_not_found", "recipient_not_allowed", "likeness_not_allowed", "quota_exceeded",
  "spend_cap_reached", "idempotency_conflict", "draft_not_ready", "draft_expired", "not_found", "order_not_cancellable",
  "service_busy", "payment_failed", "unauthorized",
  // Framework-only: the tool is defined but its backing service is not built yet (see docs/cto/agent-channel-build-order.md).
  "not_implemented",
] as const;
export type ToolErrorCode = (typeof TOOL_ERROR_CODES)[number];

export type ToolError = {
  code: ToolErrorCode;
  /** One plain sentence the assistant may show the user. */
  message: string;
  retryable: boolean;
  retryAfterSeconds?: number;
  missing?: { path: string; message: string }[];
};

/** REST status for each code (05 section 3). In MCP only unauthorized and scope_insufficient become real HTTP errors. */
export const HTTP_STATUS: Record<ToolErrorCode, number> = {
  validation_failed: 422, content_blocked: 422, sensitive_content: 422, scope_insufficient: 403, approval_required: 409,
  address_unconfirmed: 409, recipient_not_found: 404, recipient_not_allowed: 403, likeness_not_allowed: 403,
  quota_exceeded: 429, spend_cap_reached: 429, idempotency_conflict: 409, draft_not_ready: 409, draft_expired: 410,
  not_found: 404, order_not_cancellable: 409, service_busy: 503, payment_failed: 402, unauthorized: 401, not_implemented: 501,
};

export const toolError = (code: ToolErrorCode, message: string, extra: Partial<Omit<ToolError, "code" | "message">> = {}): ToolError => ({
  code,
  message,
  retryable: extra.retryable ?? (code === "service_busy" || code === "quota_exceeded"),
  ...extra,
});
