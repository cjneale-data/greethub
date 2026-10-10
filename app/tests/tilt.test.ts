import { describe, expect, it } from "vitest";
import { tiltDegrees } from "@/components/brand/TemplateCard";

describe("tiltDegrees", () => {
  it("maps small non-negative integers to preset tilts", () => {
    expect(tiltDegrees(0)).toBe(-2);
    expect(tiltDegrees(1)).toBe(2);
  });
  it("treats everything else as degrees", () => {
    expect(tiltDegrees(-6)).toBe(-6);
    expect(tiltDegrees(4.5)).toBe(4.5);
    expect(tiltDegrees(12)).toBe(12);
  });
});
