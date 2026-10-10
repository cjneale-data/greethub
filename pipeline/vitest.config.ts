import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@greethub/shared": path.resolve(__dirname, "../app/packages/shared/src/index.ts") } },
  test: { include: ["tests/**/*.test.ts"], environment: "node", testTimeout: 30000 },
});
