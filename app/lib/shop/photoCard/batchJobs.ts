import type { JobQueue } from "../../book/queue";
import type { FlatCardFiles, FlatCardPrinter } from "../../adapters/flatCard";
import { docs } from "../../store";
import { canTransition, isTerminal, mapPrinterState, pathTo, type OrderStatus } from "../orderState";
import { sendNeedsAttention, sendShipped } from "../mail";
import { recomputeOrder } from "../orderService";
import type { BatchJob, Order, OrderItem } from "../types";

/**
 * Order -> render -> submitBulk -> tracking for photo card lines (docs/cto/photo-events-architecture.md section 9, item 11).
 * - The job document (`batch_jobs/<orderId>:<lineId>`) holds only ids, file paths and printer state. Names and addresses stay
 *   on the order item, so scrubbing the order scrubs them.
 * - `enqueueBatchLine` writes the job once and hands its id to the existing JobQueue; `runBatchJob` is what the queue runs.
 * - Every step is safe to repeat: the job is claimed once, rendered files are kept, and the printer call is idempotent per line.
 * - Status moves through the existing order state machine (orderState.ts); a printer update can never move a line backwards.
 */

const STALE_RENDER_MS = 10 * 60_000;

export const batchJobId = (orderId: string, lineId: string) => `${orderId}:${lineId}`;

/** Produces the print files for one line. The card engineer's layoutFlatCard plugs in here; `mockRender` is the mock-mode stand-in. */
export type RenderStep = (ctx: { order: Order; item: OrderItem }) => Promise<FlatCardFiles>;

export const mockRender: RenderStep = async ({ order, item }) => {
  const base = `private/print/${order.userId}/${order.id}/${item.id}`;
  return { front: `${base}/front.pdf`, back: `${base}/back.pdf` };
};

export type BatchDeps = { printer: FlatCardPrinter; render: RenderStep; now?: () => Date };

const isBatchItem = (i: OrderItem) => !!i.batch;

/** Creates the job for a batch line (once) and queues it. Returns false when the line is not a batch line. */
export async function enqueueBatchLine(order: Order, item: OrderItem, queue: JobQueue, now = new Date()): Promise<boolean> {
  if (!isBatchItem(item)) return false;
  const id = batchJobId(order.id, item.id);
  const job: BatchJob = { id, userId: order.userId, orderId: order.id, lineId: item.id, step: "queued", attempts: 0, createdAt: now.toISOString(), updatedAt: now.toISOString() };
  await docs().insertIfAbsent("batch_jobs", id, job);
  await queue.enqueue(id);
  return true;
}

/** Queues every batch line of an order that has no job yet or whose job failed. */
export async function enqueueOrderBatchLines(orderId: string, queue: JobQueue): Promise<number> {
  const order = await docs().get("orders", orderId);
  if (!order) return 0;
  let n = 0;
  for (const item of order.items) if (await enqueueBatchLine(order, item, queue)) n++;
  return n;
}

/** Item status step using the order state machine. Backwards or illegal moves are ignored (out-of-order printer updates). */
function moveItem(item: OrderItem, to: OrderStatus): OrderItem {
  if (item.status === to || isTerminal(item.status)) return item;
  if (to === "needs_attention" || pathTo(item.status, to).length > 0 || canTransition(item.status, to)) return { ...item, status: to };
  return item;
}

async function patchOrderItem(orderId: string, lineId: string, patch: (i: OrderItem) => OrderItem, now: Date): Promise<{ order?: Order; before?: OrderItem; after?: OrderItem }> {
  let before: OrderItem | undefined;
  let after: OrderItem | undefined;
  const order = await docs().mutate("orders", orderId, (cur) => {
    if (!cur) return cur;
    const copy: Order = structuredClone(cur);
    copy.items = copy.items.map((i) => {
      if (i.id !== lineId) return i;
      before = i;
      after = patch(i);
      return after;
    });
    return recomputeOrder(copy, now);
  });
  return { order, before, after };
}

/**
 * Render and submit one line. Idempotent: a job already submitted is returned as is; a failed job can be run again
 * (the queue retry, or support pressing "try again"), reusing the files it already rendered.
 */
export async function runBatchJob(jobId: string, deps: BatchDeps): Promise<BatchJob | null> {
  const now = () => (deps.now ? deps.now() : new Date());
  // Claim: only one runner moves a queued or failed job to rendering.
  let claimed = false;
  const job = await docs().mutate("batch_jobs", jobId, (cur) => {
    if (!cur || cur.step === "submitted") return cur;
    // A runner that died mid-render leaves the job in "rendering"; take it over after the stale window.
    if (cur.step === "rendering" && now().getTime() - Date.parse(cur.updatedAt) < STALE_RENDER_MS) return cur;
    claimed = true;
    return { ...cur, step: "rendering", attempts: cur.attempts + 1, error: undefined, updatedAt: now().toISOString() };
  });
  if (!job) return null;
  if (!claimed) return job;

  const order = await docs().get("orders", job.orderId);
  const item = order?.items.find((i) => i.id === job.lineId);
  const fail = async (reason: string, note: string): Promise<BatchJob | null> => {
    const failed = await docs().mutate("batch_jobs", jobId, (c) => c && { ...c, step: "failed", error: reason, updatedAt: now().toISOString() });
    const r = await patchOrderItem(job.orderId, job.lineId, (i) => ({ ...moveItem(i, "needs_attention"), note }), now());
    if (r.order && r.after && r.before?.status !== "needs_attention") await sendNeedsAttention(r.order, r.after).catch((e) => console.error("email failed", e));
    return failed ?? null;
  };
  if (!order || !item || !isBatchItem(item) || !item.batch) return fail("line not found", "We couldn't find this line. We're looking into it.");
  if (!item.shipTo) return fail("no ship-to address", "We need a delivery address for this order. We'll be in touch.");

  try {
    // Render once; a retry after a printer failure reuses the files.
    let files = job.files;
    if (!files) {
      files = await deps.render({ order, item });
      await docs().mutate("batch_jobs", jobId, (c) => c && { ...c, files, updatedAt: now().toISOString() });
    }
    const { externalId } = await deps.printer.submitBulk({
      orderId: order.id,
      lineId: item.id,
      sizeId: item.batch.sizeId,
      qty: item.quantity,
      files,
      paper: item.batch.paper,
      shipTo: item.shipTo,
      email: order.email,
    });
    const submittedAt = now().toISOString();
    const done = await docs().mutate("batch_jobs", jobId, (c) => c && { ...c, step: "submitted", printer: deps.printer.name, externalId, printerState: "submitted", updatedAt: submittedAt });
    await patchOrderItem(
      order.id,
      item.id,
      (i) => ({ ...moveItem(i, "preparing"), fulfillment: { printer: deps.printer.name, externalId, state: "submitted", submittedAt }, note: undefined }),
      now(),
    );
    return done ?? null;
  } catch (err) {
    // Log the failure kind only: never customer content.
    console.error("batch job failed", jobId, err instanceof Error ? err.name : "error");
    return fail("render or print submit failed", "We couldn't reach the print shop. We're looking into it.");
  }
}

/** Polls the printer for a submitted job and applies tracking and status to the job and the order line. Safe to call repeatedly. */
export async function refreshBatchJob(jobId: string, deps: Pick<BatchDeps, "printer" | "now">): Promise<BatchJob | null> {
  const job = await docs().get("batch_jobs", jobId);
  if (!job) return null;
  if (job.step !== "submitted" || !job.externalId) return job;
  const now = deps.now ? deps.now() : new Date();
  const st = await deps.printer.status(job.externalId);
  const mapped = mapPrinterState(st.state);
  const r = await patchOrderItem(
    job.orderId,
    job.lineId,
    (i) => {
      const f = i.fulfillment;
      if (!f) return i;
      let next: OrderItem = { ...i, fulfillment: { ...f, state: st.state, trackingUrl: st.trackingUrl ?? f.trackingUrl, trackingNumber: st.trackingNumber ?? f.trackingNumber, carrier: st.carrier ?? f.carrier } };
      if (mapped) next = moveItem(next, mapped);
      next.note = mapped === "needs_attention" ? "The print shop flagged this one. We're looking at it." : next.status === "needs_attention" ? next.note : undefined;
      return next;
    },
    now,
  );
  const updated = await docs().mutate(
    "batch_jobs",
    jobId,
    (c) => c && { ...c, printerState: st.state, trackingUrl: st.trackingUrl ?? c.trackingUrl, trackingNumber: st.trackingNumber ?? c.trackingNumber, carrier: st.carrier ?? c.carrier, updatedAt: now.toISOString() },
  );
  if (r.order && r.after && r.after.status === "shipped" && r.before?.status !== "shipped" && r.before?.status !== "delivered") {
    await sendShipped(r.order, r.after).catch((e) => console.error("email failed", e));
  }
  return updated ?? null;
}

/** Polls every submitted batch line of an order. */
export async function refreshOrderBatchJobs(orderId: string, deps: Pick<BatchDeps, "printer" | "now">): Promise<void> {
  const order = await docs().get("orders", orderId);
  if (!order) return;
  for (const i of order.items) if (isBatchItem(i)) await refreshBatchJob(batchJobId(orderId, i.id), deps);
}
