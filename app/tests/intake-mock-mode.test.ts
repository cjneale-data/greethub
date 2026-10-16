import { afterEach, describe, expect, it } from "vitest";
import { isMockAi } from "@/lib/intake/config";

const saved = { key: process.env.OPENROUTER_API_KEY, flag: process.env.GREETHUB_MOCK_AI };
afterEach(() => {
  for (const [k, v] of [["OPENROUTER_API_KEY", saved.key], ["GREETHUB_MOCK_AI", saved.flag]] as const) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});
const set = (key?: string, flag?: string) => {
  if (key === undefined) delete process.env.OPENROUTER_API_KEY;
  else process.env.OPENROUTER_API_KEY = key;
  if (flag === undefined) delete process.env.GREETHUB_MOCK_AI;
  else process.env.GREETHUB_MOCK_AI = flag;
};

describe("card AI mock mode", () => {
  it("goes live when a key is set and the flag is unset (production on 2026-10-16 stayed on placeholder art)", () => {
    set("or-test");
    expect(isMockAi()).toBe(false);
  });
  it("is mock with no key, or when forced", () => {
    set(undefined);
    expect(isMockAi()).toBe(true);
    set(undefined, "0");
    expect(isMockAi()).toBe(true);
    set("or-test", "1");
    expect(isMockAi()).toBe(true);
    set("or-test", "0");
    expect(isMockAi()).toBe(false);
  });
});
