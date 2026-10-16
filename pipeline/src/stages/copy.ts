import { extractJson } from "../imageutil";
import { bookSpreads, type BookBrief, type CardBrief } from "@greethub/shared";
import type { Ctx, PagePlan } from "../types";
import { cast } from "./identity";
import { fastText, logOutputFlagged, screenAll } from "../safety/index";
import type { IpInput } from "../safety/index";

type RawPage = { text?: string; scene: string; characters?: string[] };

function briefDigest(brief: Ctx["brief"]): string {
  // Second layer behind the app-level screen: customer free text is run through the free IP rules before it reaches the model.
  const known = [...cast(brief).map((c) => c.name), brief.recipient.name];
  const t = (s: string | undefined, field: IpInput["field"]) => (s ? fastText(s, field, known) : s);
  const list = (a: string[]) => a.map((x) => fastText(x, "brief_field", known));
  const who = cast(brief).map((c) => `${c.name} (${c.ageBand}, ${c.role})`).join("; ");
  return [
    `Occasion: ${brief.occasion === "other" ? brief.occasionOther : brief.occasion}`,
    `For: ${brief.recipient.name} (${brief.recipient.relationship})`,
    `Tone: ${brief.tone}`,
    `Cast: ${who || "none"}`,
    brief.storyIdea && `Story idea: ${t(brief.storyIdea, "story_idea")}`,
    brief.memory && `Memory: ${t(brief.memory, "story_idea")}`,
    brief.insideJokes && `Inside jokes: ${t(brief.insideJokes, "story_idea")}`,
    brief.messageWording && `Message wording from the buyer: ${t(brief.messageWording, "card_message")}`,
    brief.settingDetails && `Setting: ${t(brief.settingDetails, "story_idea")}`,
    brief.include.length ? `Include: ${list(brief.include).join("; ")}` : "",
    brief.avoid.length ? `Avoid: ${list(brief.avoid).join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Stage 0 (books): brief -> page text + scene per spread. `spreadsOverride` lets tests make small books. */
export async function writeStory(ctx: Ctx, spreadsOverride?: number): Promise<{ title: string; blurb: string; pages: PagePlan[] }> {
  const brief = ctx.brief as BookBrief;
  const n = spreadsOverride ?? bookSpreads(brief.pageCount);
  const ageHint = { "0-2": "10-25 words per page, rhythmic", "3-5": "25-45 words per page", "6-8": "45-80 words per page" }[brief.readingAge];
  const prompt =
    `Write a ${brief.tone} picture book for a ${brief.readingAge} year old reader as exactly ${n} spreads. ${ageHint}.\n` +
    `${briefDigest(brief)}\n` +
    (brief.dedication ? `Dedication: ${brief.dedication}\n` : "") +
    "Each spread has the printed text and one illustration scene (concrete: setting, action, expressions, who is present). " +
    "Use character names exactly as given. Scenes never contain text or signs with words.\n" +
    'Return ONLY JSON: {"title": str, "blurb": str (back-cover, 2-3 sentences), "cover_scene": str, "cover_characters": [names], "pages": [{"text": str, "scene": str, "characters": [names visible]}]}';
  const raw = await ctx.client.text({ content: [{ type: "text", text: prompt }], stage: "story", label: "story" });
  if (!raw) throw new Error("Story call failed");
  const j = extractJson<{ title: string; blurb: string; cover_scene: string; cover_characters?: string[]; pages: RawPage[] }>(raw);
  const all = cast(brief).map((c) => c.name);
  const known = [...all, brief.recipient.name];
  // Check the model's OUTPUT too: printed text and scenes may not name or evoke protected characters, brands or slogans.
  const inputs: IpInput[] = [
    { text: j.title, field: "story_text", knownNames: known },
    { text: j.blurb, field: "story_text", knownNames: known },
    { text: j.cover_scene, field: "image_prompt", knownNames: known },
    ...j.pages.slice(0, n).flatMap((p): IpInput[] => [
      { text: p.text ?? "", field: "story_text", knownNames: known },
      { text: p.scene, field: "image_prompt", knownNames: known },
    ]),
  ];
  const safe = await screenAll(ctx.safety, inputs);
  if (safe.some((r) => r.verdict === "rewritten")) logOutputFlagged({ pageId: "story", flags: ["story_text"], isFinal: false });
  let k = 0;
  const take = (orig: string) => {
    const r = safe[k++];
    return r.verdict === "rewritten" ? r.safeText : orig;
  };
  j.title = take(j.title);
  j.blurb = take(j.blurb);
  j.cover_scene = take(j.cover_scene);
  for (const p of j.pages.slice(0, n)) {
    p.text = take(p.text ?? "");
    p.scene = take(p.scene);
  }
  const pages: PagePlan[] = [
    { id: "cover", kind: "cover", scene: j.cover_scene, characters: j.cover_characters ?? all, textZone: "top 30% of the image: calm, empty sky or wall for the title" },
    ...j.pages.slice(0, n).map((p, i): PagePlan => ({ id: `p${i + 1}`, kind: "spread", scene: p.scene, characters: p.characters ?? all, text: p.text })),
  ];
  return { title: j.title, blurb: j.blurb, pages };
}

/** Card copy: front illustration scene, inside message, optional inside illustration. */
export async function writeCardCopy(ctx: Ctx): Promise<{ title: string; pages: PagePlan[]; message: string }> {
  const brief = ctx.brief as CardBrief;
  const prompt =
    `Write a ${brief.tone} greeting card.\n${briefDigest(brief)}\n` +
    "Inside message: 20-60 words, in the buyer's voice, first names only, use the buyer's wording if given. " +
    "Front: one concrete illustration scene (setting, action, expressions, who is present), no words in the picture. " +
    (brief.insideIllustration ? "Also one small inside illustration scene. " : "") +
    'Return ONLY JSON: {"title": str, "front_scene": str, "front_characters": [names], "inside_scene": str|null, "inside_characters": [names], "message": str}';
  const raw = await ctx.client.text({ content: [{ type: "text", text: prompt }], stage: "story", label: "card_copy" });
  if (!raw) throw new Error("Card copy call failed");
  const j = extractJson<{ title: string; front_scene: string; front_characters?: string[]; inside_scene?: string | null; inside_characters?: string[]; message: string }>(raw);
  const all = cast(brief).map((c) => c.name);
  const known = [...all, brief.recipient.name];
  const inputs: IpInput[] = [
    { text: j.title, field: "card_message", knownNames: known },
    { text: j.message, field: "card_message", knownNames: known },
    { text: j.front_scene, field: "image_prompt", knownNames: known },
    { text: j.inside_scene ?? "", field: "image_prompt", knownNames: known },
  ];
  const safe = await screenAll(ctx.safety, inputs);
  if (safe.some((r) => r.verdict === "rewritten")) logOutputFlagged({ pageId: "card", flags: ["story_text"], isFinal: false });
  const pick = (i: number, orig: string) => (safe[i].verdict === "rewritten" ? safe[i].safeText : orig);
  j.title = pick(0, j.title);
  j.message = pick(1, j.message);
  j.front_scene = pick(2, j.front_scene);
  if (j.inside_scene) j.inside_scene = pick(3, j.inside_scene);
  const pages: PagePlan[] = [{ id: "front", kind: "card_front", scene: j.front_scene, characters: j.front_characters ?? all }];
  if (brief.insideIllustration && j.inside_scene) {
    pages.push({ id: "inside", kind: "card_inside", scene: j.inside_scene, characters: j.inside_characters ?? all });
  }
  return { title: j.title, pages, message: j.message };
}
