import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

// The dashboard artifact embeds a compiled copy of app/lib/equity/index.ts. This guards against the two drifting apart.
// To resync: transpile the module (ES2020, ESNext modules), strip leading `export `, and replace the first <script> block.
describe("equity dashboard copy", () => {
  it("matches the transpiled calculation module", () => {
    const src = readFileSync(join(__dirname, "../../lib/equity/index.ts"), "utf8");
    const expected = ts
      .transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext } })
      .outputText.replace(/^export /gm, "")
      .replace(/\r\n/g, "\n")
      .trim();
    const html = readFileSync(join(__dirname, "../../../docs/equity/dashboard.html"), "utf8").replace(/\r\n/g, "\n");
    const start = html.indexOf("<script>\n/**\n * GreetHub dynamic equity");
    expect(start).toBeGreaterThan(-1);
    const end = html.indexOf("</script>", start);
    const embedded = html.slice(start + "<script>\n".length, end).trim();
    expect(embedded).toBe(expected);
  });
});
