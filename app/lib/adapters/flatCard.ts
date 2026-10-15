import type { Address } from "@greethub/shared";
import type { PrinterStatus } from "./types";

/**
 * Flat-card printing (photo cards). Vendor-agnostic: Gooten, Prodigi, Lob or PostGrid implement it later (vendor pick
 * is Oct 24); only the fake exists today. Shape follows docs/cto/photo-events-architecture.md section 5.
 * `PrinterAdapter` (one job, one ship-to) is left alone.
 */
export type FlatSizeId = "flat_5x7" | "flat_4x6" | "flat_3_5x5";

export type FlatCardCapabilities = {
  sizes: FlatSizeId[];
  doubleSided: boolean;
  papers: string[];
  envelopes: "none" | "blank" | "printed_return" | "printed_recipient";
  addressing: "pdf" | "data" | "none";
  mailForMe: boolean;
  minQty: number;
  maxQty: number;
  usOnly: boolean;
};

export type FlatCardFiles = { front: string; back?: string; envelopes?: string };

export type BulkJob = {
  orderId: string;
  /** Unique per line; the vendor's idempotency key, so a retry never prints twice. */
  lineId: string;
  sizeId: FlatSizeId;
  qty: number;
  files: FlatCardFiles;
  paper: string;
  shipTo: Address;
  email: string;
};

export type MailingJob = {
  orderId: string;
  lineId: string;
  sizeId: FlatSizeId;
  files: { front: string; back?: string };
  from: Address;
  to: { recipientId: string; address: Address }[];
};

export interface FlatCardPrinter {
  readonly name: "prodigi" | "gooten" | "lob" | "postgrid" | "fake";
  readonly fake: boolean;
  readonly caps: FlatCardCapabilities;
  quote(q: { sizeId: FlatSizeId; qty: number; mode: "ship_to_me" | "mail_for_me"; shipTo?: Address }): Promise<{ cents: number; postageCents: number; productionDays: number }>;
  submitBulk(job: BulkJob): Promise<{ externalId: string }>;
  submitMailing(job: MailingJob): Promise<{ externalIds: Record<string, string> }>;
  status(externalId: string): Promise<PrinterStatus>;
}
