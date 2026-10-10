export type KbKind = "occasion_tip" | "sample_message" | "style_preset" | "format";

export type KbDoc = {
  id: string;
  kind: KbKind;
  title: string;
  text: string;
  occasion?: string;
  tone?: string;
  styleId?: string;
};

export type KbHit = { doc: KbDoc; score: number };

export type SearchOptions = {
  k?: number;
  kinds?: KbKind[];
  /** Boost docs tagged with this occasion. Not a hard filter, so general docs can still surface. */
  occasion?: string;
  tone?: string;
};

/**
 * Retrieval seam. The BM25 implementation runs in-process today. A pgvector implementation
 * (embed the query, nearest-neighbour over the same docs table) drops in behind this interface
 * without touching the Greet Guide. Retrieval is grounding only.
 */
export interface KnowledgeBase {
  search(query: string, opts?: SearchOptions): Promise<KbHit[]>;
}
