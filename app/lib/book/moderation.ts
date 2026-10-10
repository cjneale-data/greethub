/**
 * Image moderation seam (docs/legal/06 req 17: nudity, sexual content involving minors, violence, before any AI call).
 * TODO(legal P0): no moderation provider is wired yet, so this passes everything. Replace with a real classifier and
 * quarantine on a hit; the CSAM procedure (req 18) needs the attorney's approved written process first.
 */
export async function moderatePhoto(_data: Uint8Array): Promise<{ ok: boolean }> {
  return { ok: true };
}
