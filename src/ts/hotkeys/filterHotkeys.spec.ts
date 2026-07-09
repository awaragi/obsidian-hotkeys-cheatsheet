import { describe, it, expect } from "vitest";
import { matchesFilters, matchesFlatItem } from "./filterHotkeys";
import type { HotkeyEntry } from "../types";
import type { FlatHotkeyItem } from "./sortHotkeys";

function makeEntry(
  name: string,
  hotkeys: { modifiers: string[]; key: string }[],
  isModifiedFromDefault = false
): HotkeyEntry {
  return { id: "test:cmd", name, category: "Test", hotkeys, isModifiedFromDefault };
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

function makeFlatItem(overrides: Partial<FlatHotkeyItem>): FlatHotkeyItem {
  return {
    id: "test:cmd",
    name: "Toggle Bold",
    hotkeys: [{ modifiers: ["Mod"], key: "B" }],
    count: 3,
    bindingCounts: [3],
    isOrphan: false,
    isModifiedFromDefault: false,
    commandId: "test:cmd",
    ...overrides,
  };
}

describe("matchesFilters conflicts/modified flags", () => {
  it("returns true for a conflicting entry when conflictsOnly is active", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(
      matchesFilters(entry, "", new Set(), {
        conflictsOnly: true,
        conflictingIds: new Set(["test:cmd"]),
      })
    ).toBe(true);
  });

  it("returns false for a non-conflicting entry when conflictsOnly is active", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(
      matchesFilters(entry, "", new Set(), {
        conflictsOnly: true,
        conflictingIds: new Set(["other:cmd"]),
      })
    ).toBe(false);
  });

  it("returns false for an unmodified entry when modifiedOnly is active", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }], false);
    expect(matchesFilters(entry, "", new Set(), { modifiedOnly: true })).toBe(false);
  });

  it("returns true for a modified entry when modifiedOnly is active", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }], true);
    expect(matchesFilters(entry, "", new Set(), { modifiedOnly: true })).toBe(true);
  });

  it("AND-combines conflictsOnly and modifiedOnly — must satisfy both", () => {
    const conflictingAndModified = makeEntry("A", [{ modifiers: ["Mod"], key: "B" }], true);
    const conflictingOnly = { ...makeEntry("B", [{ modifiers: ["Mod"], key: "B" }], false), id: "other:cmd" };
    const flags = { conflictsOnly: true, modifiedOnly: true, conflictingIds: new Set(["test:cmd", "other:cmd"]) };
    expect(matchesFilters(conflictingAndModified, "", new Set(), flags)).toBe(true);
    expect(matchesFilters(conflictingOnly, "", new Set(), flags)).toBe(false);
  });

  it("combines with an active modifier filter", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }], true);
    expect(
      matchesFilters(entry, "", new Set(["Shift"]), { modifiedOnly: true })
    ).toBe(false);
  });

  it("leaves prior filtering unaffected when both new flags are omitted/false", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }]);
    expect(matchesFilters(entry, "", new Set())).toBe(true);
  });

  it("combines with an active search query", () => {
    const entry = makeEntry("Toggle Bold", [{ modifiers: ["Mod"], key: "B" }], true);
    expect(matchesFilters(entry, "bold", new Set(), { modifiedOnly: true })).toBe(true);
    expect(matchesFilters(entry, "italic", new Set(), { modifiedOnly: true })).toBe(false);
  });
});

describe("matchesFlatItem", () => {
  it("matches a bound item like matchesFilters would", () => {
    const item = makeFlatItem({});
    expect(matchesFlatItem(item, "bold", new Set())).toBe(true);
    expect(matchesFlatItem(item, "italic", new Set())).toBe(false);
  });

  it("excludes an orphan pseudo-entry whenever a text query is active", () => {
    const orphan = makeFlatItem({ isOrphan: true, name: "" });
    expect(matchesFlatItem(orphan, "b", new Set())).toBe(false);
  });

  it("keeps an orphan pseudo-entry visible when only the modifier filter is active", () => {
    const orphan = makeFlatItem({ isOrphan: true, name: "" });
    expect(matchesFlatItem(orphan, "", new Set(["Mod"]))).toBe(true);
    expect(matchesFlatItem(orphan, "", new Set(["Shift"]))).toBe(false);
  });

  it("returns true for a conflicting item when conflictsOnly is active", () => {
    const item = makeFlatItem({ commandId: "test:cmd" });
    expect(
      matchesFlatItem(item, "", new Set(), {
        conflictsOnly: true,
        conflictingIds: new Set(["test:cmd"]),
      })
    ).toBe(true);
  });

  it("returns false for a non-conflicting item when conflictsOnly is active", () => {
    const item = makeFlatItem({ commandId: "test:cmd" });
    expect(
      matchesFlatItem(item, "", new Set(), {
        conflictsOnly: true,
        conflictingIds: new Set(["other:cmd"]),
      })
    ).toBe(false);
  });

  it("returns false for an unmodified item when modifiedOnly is active", () => {
    const item = makeFlatItem({ isModifiedFromDefault: false });
    expect(matchesFlatItem(item, "", new Set(), { modifiedOnly: true })).toBe(false);
  });

  it("returns true for a modified item when modifiedOnly is active", () => {
    const item = makeFlatItem({ isModifiedFromDefault: true });
    expect(matchesFlatItem(item, "", new Set(), { modifiedOnly: true })).toBe(true);
  });

  it("excludes an orphan whenever conflictsOnly or modifiedOnly is active — an orphan's signature never appears in conflictingIds (real command ids only), and it's never modified", () => {
    const orphan = makeFlatItem({ isOrphan: true, name: "", commandId: "Mod+Shift+K" });
    expect(
      matchesFlatItem(orphan, "", new Set(), {
        conflictsOnly: true,
        conflictingIds: new Set(["editor:bold", "editor:italic"]),
      })
    ).toBe(false);
    expect(matchesFlatItem(orphan, "", new Set(), { modifiedOnly: true })).toBe(false);
  });
});
