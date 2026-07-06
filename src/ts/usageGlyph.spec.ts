import { describe, it, expect } from "vitest";
import { countToGlyph } from "./usageGlyph";

describe("countToGlyph", () => {
  it("returns the lowest glyph for count 0", () => {
    expect(countToGlyph(0, 100).level).toBe(0);
  });

  it("returns the highest glyph when count equals max", () => {
    expect(countToGlyph(100, 100).level).toBe(7);
  });

  it("compresses small counts above the lowest level via sqrt scaling", () => {
    // linear scaling would round 1/100 * 8 = 0.08 down to level 0
    const { level } = countToGlyph(1, 100);
    expect(level).toBeGreaterThan(0);
  });

  it("returns the lowest glyph and does not throw when max is 0", () => {
    expect(() => countToGlyph(0, 0)).not.toThrow();
    expect(countToGlyph(0, 0).level).toBe(0);
  });
});
