import { siteUrl } from "@/lib/seo";

/**
 * Tracked links for social posts and creator partners (Social, docs/social/).
 * Nothing here reads or stores anything: it only builds URLs. Capturing `ref` and `utm_*` on arrival is the
 * Head of Data's collector (DATA-003); paying commission needs a stored attribution and a discount code (not built).
 */

export type Channel = "pinterest" | "instagram" | "tiktok" | "facebook" | "creator" | "email";

const MEDIUM: Record<Channel, string> = {
  pinterest: "social",
  instagram: "social",
  tiktok: "social",
  facebook: "social",
  creator: "affiliate",
  email: "email",
};

/** Creator and campaign codes: lowercase letters, digits and dashes, 3-32 chars. No names of children, ever. */
export const CODE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,30})[a-z0-9]$/;

export function isValidCode(code: string): boolean {
  return CODE_PATTERN.test(code);
}

/** A path on our site with UTM tags. `ref` is set only for creator links, so it can later map to a partner. */
export function trackedLink(
  path: string,
  opts: { channel: Channel; campaign: string; content?: string; ref?: string },
  env: Record<string, string | undefined> = process.env,
): string {
  if (!path.startsWith("/")) throw new Error("path must start with /");
  if (!isValidCode(opts.campaign)) throw new Error("campaign must match CODE_PATTERN");
  if (opts.ref !== undefined && !isValidCode(opts.ref)) throw new Error("ref must match CODE_PATTERN");
  if (opts.content !== undefined && !isValidCode(opts.content)) throw new Error("content must match CODE_PATTERN");
  const url = new URL(path, siteUrl(env) + "/");
  url.searchParams.set("utm_source", opts.channel === "creator" && opts.ref ? opts.ref : opts.channel);
  url.searchParams.set("utm_medium", MEDIUM[opts.channel]);
  url.searchParams.set("utm_campaign", opts.campaign);
  if (opts.content) url.searchParams.set("utm_content", opts.content);
  if (opts.ref) url.searchParams.set("ref", opts.ref);
  return url.toString();
}

/**
 * Pinterest "Save" link for a public marketing image. Only for our own approved art (fictional families, no
 * customer content). Uses Pinterest's documented create-pin URL, so no Pinterest script loads on our pages.
 */
export function pinterestSaveUrl(pageUrl: string, imageUrl: string, description: string): string {
  const u = new URL("https://www.pinterest.com/pin/create/button/");
  u.searchParams.set("url", pageUrl);
  u.searchParams.set("media", imageUrl);
  u.searchParams.set("description", description.slice(0, 500));
  return u.toString();
}
