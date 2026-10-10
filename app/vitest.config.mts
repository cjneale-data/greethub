import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@greethub/shared": path.resolve(__dirname, "packages/shared/src/index.ts"), "@": path.resolve(__dirname) } },
  test: { include: ["tests/**/*.test.ts", "packages/**/*.test.ts"], environment: "node" },
});
