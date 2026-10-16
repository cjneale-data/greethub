import { assertUnderCap, type CostLedger, type LedgerEntry } from "./ledger";
import { FALLBACK_PRICES, IMAGE_MODELS, TEXT_MODEL, capSize, type ImageSize } from "./models";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type ChatMessage = { content?: string | null; images?: { image_url: { url: string } }[] };

export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

export type ClientOptions = {
  /** Read lazily so the key never lives in a long-lived variable or a log line. */
  apiKey: () => string;
  ledger: CostLedger;
  runId: string;
  fetch?: FetchLike;
  /** Backoff base in ms for attempt n is base * (n+1). 0 in tests. */
  backoffMs?: { network: number; http: number };
  maxAttempts?: number;
  timeoutMs?: number;
  /** Hard USD cap on this ledger. Checked before every attempt. */
  spendCapUsd?: number;
  log?: (msg: string) => void;
};

export type CallArgs = {
  model: string;
  content: ContentPart[];
  system?: string;
  extra?: Record<string, unknown>;
  stage: string;
  label: string;
  kind: "text" | "image";
  imageSize?: ImageSize;
};

type Usage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  cost?: number;
  completion_tokens_details?: { image_tokens?: number };
};

const URL_CHAT = "https://openrouter.ai/api/v1/chat/completions";

/** Retry rules (ported from pipeline.py call()):
 *  - network error (fetch throws, timeout): retry with 15s * n backoff
 *  - HTTP 429 and 5xx: retry with 5s * n backoff
 *  - HTTP 400 (bad request, usually a safety/format rejection): NEVER retry, return null at once
 *  - other 4xx (401/402/403/404): permanent, not retried
 *  Three attempts per model, then the caller falls through the model chain.
 */
export function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

export class OpenRouterClient {
  private fetchFn: FetchLike;
  constructor(private o: ClientOptions) {
    this.fetchFn = o.fetch ?? (globalThis.fetch as unknown as FetchLike);
  }
  get ledger() {
    return this.o.ledger;
  }
  private log(m: string) {
    (this.o.log ?? ((x: string) => console.log(x)))(m);
  }

  /** One logical call with retries. Every attempt is written to the ledger. Returns null when the model gave up. */
  async call(a: CallArgs): Promise<ChatMessage | null> {
    const msgs = [...(a.system ? [{ role: "system", content: a.system }] : []), { role: "user", content: a.content }];
    const body = JSON.stringify({ model: a.model, messages: msgs, usage: { include: true }, ...(a.extra ?? {}) });
    const max = this.o.maxAttempts ?? 3;
    const bo = this.o.backoffMs ?? { network: 15_000, http: 5_000 };

    for (let attempt = 1; attempt <= max; attempt++) {
      assertUnderCap(this.o.ledger, this.o.spendCapUsd);
      const t0 = Date.now();
      const base = this.base(a, attempt);
      let res;
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), this.o.timeoutMs ?? 600_000);
        try {
          res = await this.fetchFn(URL_CHAT, {
            method: "POST",
            headers: { Authorization: `Bearer ${this.o.apiKey()}`, "Content-Type": "application/json" },
            body,
            signal: ctl.signal,
          });
        } finally {
          clearTimeout(timer);
        }
      } catch (e) {
        this.log(`  [${a.model}] network error: ${(e as Error).name}; retrying`);
        this.o.ledger.record({ ...base, status: "network_error", costUsd: 0, costSource: "none", ms: Date.now() - t0 });
        await sleep(bo.network * attempt);
        continue;
      }

      if (res.ok) {
        const json = (await res.json()) as { choices?: { message: ChatMessage }[]; usage?: Usage };
        const msg = json.choices?.[0]?.message ?? null;
        const hasImage = !!msg?.images?.length;
        const { costUsd, costSource } = this.cost(a, json.usage, hasImage);
        const failedImage = a.kind === "image" && !hasImage;
        this.o.ledger.record({
          ...base,
          status: failedImage ? "no_image" : "ok",
          promptTokens: json.usage?.prompt_tokens,
          completionTokens: json.usage?.completion_tokens,
          imageTokens: json.usage?.completion_tokens_details?.image_tokens,
          costUsd,
          costSource,
          ms: Date.now() - t0,
        });
        return msg;
      }

      const text = (await res.text().catch(() => "")).slice(0, 300);
      this.log(`  [${a.model}] HTTP ${res.status}: ${redact(text)}`);
      this.o.ledger.record({ ...base, status: "http_error", httpStatus: res.status, costUsd: 0, costSource: "none", ms: Date.now() - t0 });
      if (!isRetryable(res.status)) return null; // 400 and other permanent errors: stop immediately
      await sleep(bo.http * attempt);
    }
    return null;
  }

  private base(a: CallArgs, attempt: number): Omit<LedgerEntry, "status" | "costUsd" | "costSource" | "ms"> {
    return {
      ts: new Date().toISOString(),
      runId: this.o.runId,
      stage: a.stage,
      label: a.label,
      model: a.model,
      kind: a.kind,
      imageSize: a.imageSize,
      attempt,
    };
  }

  private cost(a: CallArgs, usage: Usage | undefined, hasImage: boolean): { costUsd: number; costSource: LedgerEntry["costSource"] } {
    if (typeof usage?.cost === "number") return { costUsd: usage.cost, costSource: "openrouter_usage" };
    if (a.kind === "image") {
      if (!hasImage) return { costUsd: 0, costSource: "none" };
      return { costUsd: FALLBACK_PRICES.imagePerRender[a.imageSize ?? "1K"], costSource: "computed" };
    }
    const c = ((usage?.prompt_tokens ?? 0) * FALLBACK_PRICES.textPerMTokIn + (usage?.completion_tokens ?? 0) * FALLBACK_PRICES.textPerMTokOut) / 1e6;
    return { costUsd: c, costSource: usage ? "computed" : "none" };
  }

  /** Text call returning the string content (or null). */
  async text(args: { content: ContentPart[]; system?: string; stage: string; label: string; model?: string }): Promise<string | null> {
    const msg = await this.call({ ...args, model: args.model ?? TEXT_MODEL, kind: "text" });
    return msg?.content ?? null;
  }

  /** Try each image model in turn; return PNG/JPEG bytes + the model that produced them. */
  async image(args: {
    content: ContentPart[];
    stage: string;
    label: string;
    size: ImageSize;
    aspectRatio: string;
  }): Promise<{ data: Buffer; model: string; size: ImageSize } | null> {
    for (const m of IMAGE_MODELS) {
      const size = capSize(args.size, m.maxSize);
      this.log(`[${args.label}] generating with ${m.id} @ ${size} ...`);
      const msg = await this.call({
        model: m.id,
        content: args.content,
        stage: args.stage,
        label: args.label,
        kind: "image",
        imageSize: size,
        extra: { modalities: ["image", "text"], image_config: { aspect_ratio: args.aspectRatio, image_size: size } },
      });
      const url = msg?.images?.[0]?.image_url?.url;
      if (url) return { data: Buffer.from(url.split(",", 2)[1], "base64"), model: m.id, size };
      if (msg) this.log(`  no image returned: ${String(msg.content).slice(0, 200)}`);
    }
    return null;
  }
}

const sleep = (ms: number) => (ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve());

/** Never let a key-shaped string reach logs, even if an upstream error echoes one. */
export function redact(s: string): string {
  return s.replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-***");
}
