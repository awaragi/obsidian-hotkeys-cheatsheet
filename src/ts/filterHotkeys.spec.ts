import { describe, it, expect } from "vitest";
import { matchesFilters } from "./filterHotkeys";
import type { HotkeyEntry } from "./types";

function makeEntry(
  name: string,
  hotkeys: { modifiers: string[]; key: string }[]
): HotkeyEntry {
  return { id: "test:cmd", name, category: "Test", hotkeys };
}

describe("matchesFilters", () => {
  it("returns true when no filters are active", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(matchesFilters(entry, "", new Set())).toBe(true);
  });

  it("returns true for a name substring match", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(matchesFilters(entry, "bold", new Set())).toBe(true);
  });

  it("name match is case-insensitive", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(matchesFilters(entry, "TOGGLE", new Set())).toBe(true);
  });

  it("returns false when name does not match and no key match", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(matchesFilters(entry, "italic", new Set())).toBe(false);
  });

  it("returns true for an exact key match (case-insensitive)", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(matchesFilters(entry, "b", new Set())).toBe(true);
  });

  it("returns false when key does not match exactly", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(matchesFilters(entry, "bb", new Set())).toBe(false);
  });

  it("returns true when all active modifiers are present", () => {
    const entry = makeEntry("Action", [{ modifiers: ["Mod", "Shift"], key: "P" }]);
    expect(matchesFilters(entry, "", new Set(["Mod", "Shift"]))).toBe(true);
  });

  it("returns false when only some active modifiers are present (AND logic)", () => {
    const entry = makeEntry("Action", [{ modifiers: ["Mod"], key: "P" }]);
    expect(matchesFilters(entry, "", new Set(["Mod", "Shift"]))).toBe(false);
  });

  it("returns true when modifier filter passes and name query also matches", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod", "Shift"], key: "B" }]);
    expect(matchesFilters(entry, "bold", new Set(["Mod"]))).toBe(true);
  });

  it("returns false when modifier filter passes but query does not match", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(matchesFilters(entry, "italic", new Set(["Mod"]))).toBe(false);
  });

  it("returns false when entry has no hotkeys and modifier filter is active", () => {
    const entry = makeEntry("No Hotkey", []);
    expect(matchesFilters(entry, "", new Set(["Mod"]))).toBe(false);
  });

  it("matches when at least one hotkey satisfies the modifier filter", () => {
    const entry = makeEntry("Dual Bind", [
      { modifiers: ["Alt"], key: "X" },
      { modifiers: ["Mod", "Shift"], key: "X" },
    ]);
    expect(matchesFilters(entry, "", new Set(["Mod", "Shift"]))).toBe(true);
  });
});
