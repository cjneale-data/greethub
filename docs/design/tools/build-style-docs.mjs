#!/usr/bin/env node
// Generates one markdown style guide per style (docs/design/styles/<id>.md) and an index (docs/design/styles/README.md)
// from docs/design/style-library.json, the source of truth. Edit the JSON, not the markdown.
//   node docs/design/tools/build-style-docs.mjs            write
//   node docs/design/tools/build-style-docs.mjs --check    exit 1 when a file is out of date
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const lib = JSON.parse(readFileSync(join(root, "docs", "design", "style-library.json"), "utf8"));
const check = process.argv.includes("--check");
const outDir = join(root, "docs", "design", "styles");
const cats = Object.fromEntries(lib.categories.map((c) => [c.id, c]));
const srcs = Object.fromEntries(lib.sources.map((s) => [s.id, s]));
const bullets = (a) => a.map((x) => `- ${x}`).join("\n");
const stars = (n) => `${n} of 5`;

function styleDoc(s) {
  const t = s.thumbnail;
  const lines = [];
  lines.push(`# ${s.name}`, "", `<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->`, "");
  lines.push(`**id** \`${s.id}\` | **category** ${cats[s.category].name} | **status** ${s.status} | **products** ${s.products.join(", ")} | **ages** ${s.ageBands.join(", ")}`, "");
  lines.push(`> ${s.description}`, "", `**Why this one (shown to customers):** ${s.whyThisOne}`, "");
  lines.push(`**Occasions:** ${s.occasions.join(", ")}  `, `**Tones:** ${s.tones.join(", ")}  `, `**Older ids that resolve here:** ${s.legacyIds.length ? s.legacyIds.map((x) => `\`${x}\``).join(", ") : "none"}`, "");
  lines.push("## Popularity evidence", "", `Rating: **${s.popularity.rating}**. ${s.popularity.summary}`, "");
  for (const r of s.popularity.sources) { const x = srcs[r]; lines.push(`- ${r} [${x.tag}] ${x.title}: ${x.url} (read ${x.dateRead})`); }
  lines.push("", "## How it looks", "");
  for (const k of ["medium", "technique", "line", "palette", "composition", "mood", "era"]) lines.push(`- **${k[0].toUpperCase() + k.slice(1)}:** ${s.look[k]}`);
  lines.push("", "## Image-model style string", "", "Passed verbatim to the image model. The pipeline appends the page rules and the IP-safety hardening lines separately.", "", "```text", s.styleString, "```", "", "**Avoid list (negative prompt):**", "", bullets(s.avoid), "", "## Palette", "", "| Swatch | Hex |", "|---|---|", ...s.swatches.map((x) => `| ${x.name} | \`${x.hex}\` |`), "");
  lines.push("## Character consistency", "", `Book rating **${stars(s.consistency.bookRating)}**, card rating **${stars(s.consistency.cardRating)}** (5 = holds characters best).`, "", s.consistency.notes, "");
  if (s.consistency.renderNotes) lines.push(`**Sample render (2026-10-11):** ${s.consistency.renderNotes}`, "");
  lines.push("**Tips (what to attach and repeat):**", "", bullets(s.consistency.tips), "", "## Photo reference handling", "", s.photoReference, "");
  if (s.card) {
    lines.push("## Card typography and layout", "", `- **Display:** ${s.card.typography.display.join("; ")}`, `- **Body:** ${s.card.typography.body.join("; ")}`, `- **Notes:** ${s.card.typography.notes}`, `- **Layout:** ${s.card.layout}`, `- **Text-safe zone:** ${s.card.textSafeZone}`, "", "Type is always added by GreetHub in the layout step, never drawn by the image model. Fonts named here are open-license Google Fonts; only Andika and Chewy are embedded in `pipeline/fonts` today, so add the others before use.", "");
  }
  lines.push("## Print and colour notes", "", `- **Bleed:** ${s.print.bleed}`, `- **Ink coverage:** ${s.print.inkCoverage}`, `- **Foil and spot colour:** ${s.print.foilAndSpot}`, "", "## Best for / avoid for", "", "**Best for**", "", bullets(s.bestFor), "", "**Avoid for**", "", bullets(s.avoidFor), "");
  lines.push("## Retrieval", "", `- **Tags:** ${s.tags.join(", ")}`, `- **Synonyms (customer words):** ${s.synonyms.join(", ")}`, `- **ipSafeAliases (customer phrases mapped to this generic style; matched in code, never put in a prompt):** ${s.ipSafeAliases.length ? s.ipSafeAliases.join(", ") : "none"}`, "");
  lines.push("## Risks", "", `- **IP:** ${s.risks.ip}`, `- **Uncanny valley:** ${s.risks.uncanny}`, `- **Age appropriateness:** ${s.risks.age}`, "");
  lines.push("## Brand kit pairing", "", `Display ${s.brandKit.fonts.display}, text ${s.brandKit.fonts.body}. Text colour \`${s.brandKit.textColor}\`, paper \`${s.brandKit.paperColor}\`, accent \`${s.brandKit.accentColor}\` (all from, or checked against, the brand tokens in brand/README.md).`, "");
  lines.push("## Thumbnail", "", t.rendered ? `Rendered sample: \`docs/design/samples/${t.file}\` (copied to \`app/public/styles/\`). ${t.note}` : `${t.note}`, "");
  return lines.join("\n");
}

const files = {};
for (const s of lib.styles) files[`${s.id}.md`] = styleDoc(s);
const idx = ["# Style guides", "", "<!-- GENERATED from docs/design/style-library.json by docs/design/tools/build-style-docs.mjs. Do not edit by hand. -->", "", `${lib.styles.length} styles in ${lib.categories.length} categories. Source of truth: \`docs/design/style-library.json\`. How they are organised: \`../01-taxonomy.md\`. How to choose: \`../03-selection-guide.md\`.`, ""];
for (const c of lib.categories) {
  idx.push(`## ${c.name}`, "", c.blurb, "", "| Style | Products | Ages | Popularity | Sample |", "|---|---|---|---|---|");
  for (const s of lib.styles.filter((x) => x.category === c.id)) idx.push(`| [${s.name}](${s.id}.md) | ${s.products.join(", ")} | ${s.ageBands.join(", ")} | ${s.popularity.rating} | ${s.thumbnail.rendered ? "rendered" : "colors only"} |`);
  idx.push("");
}
files["README.md"] = idx.join("\n");

mkdirSync(outDir, { recursive: true });
let stale = 0;
for (const [name, content] of Object.entries(files)) {
  const p = join(outDir, name);
  const same = existsSync(p) && readFileSync(p, "utf8") === content;
  if (check) { if (!same) { console.error(`out of date: docs/design/styles/${name}`); stale++; } }
  else if (!same) writeFileSync(p, content, "utf8");
}
if (check && stale) process.exit(1);
console.log(check ? "style docs are up to date" : `wrote ${Object.keys(files).length} files`);
