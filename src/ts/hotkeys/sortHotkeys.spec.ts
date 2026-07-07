import { describe, it, expect, vi } from "vitest";

vi.mock("obsidian", () => ({
  Keymap: { isModifier: () => false },
  debounce: (cb: (...args: unknown[]) => unknown) => cb,
  normalizePath: (p: string) => p,
}));

import {
  sortByCategory,
  sortByMostUsedCategory,
  sortByMostUsedShortcut,
  sortByKeyFlat,
  groupByModifier,
} from "./sortHotkeys";
import type { ResolvedCategoryGroup } from "../usage/usageResolver";

function makeGroups(): ResolvedCategoryGroup[] {
  return [
    {
      category: "Editing",
      aggregate: 3,
      entries: [
        { id: "e1", name: "Toggle Bold", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "B" }], count: 1, bindingCounts: [1] },
        { id: "e2", name: "Toggle Italic", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "I" }], count: 2, bindingCounts: [2] },
      ],
    },
    {
      category: "Navigation",
      aggregate: 10,
      entries: [
        { id: "n1", name: "Go Back", category: "Navigation", hotkeys: [{ modifiers: ["Mod"], key: "["  }], count: 10, bindingCounts: [10] },
      ],
    },
  ];
}

describe("sortByCategory", () => {
  it("returns groups unchanged", () => {
    const groups = makeGroups();
    expect(sortByCategory(groups)).toBe(groups);
  });
});

describe("sortByMostUsedCategory", () => {
  it("ranks categories by aggregate descending", () => {
    const result = sortByMostUsedCategory(makeGroups());
    expect(result.map((g) => g.category)).toEqual(["Navigation", "Editing"]);
  });

  it("ranks entries within a category by count descending", () => {
    const result = sortByMostUsedCategory(makeGroups());
    const editing = result.find((g) => g.category === "Editing")!;
    expect(editing.entries.map((e) => e.id)).toEqual(["e2", "e1"]);
  });
});

describe("sortByMostUsedShortcut", () => {
  it("flattens all entries into one list ranked by count descending", () => {
    const result = sortByMostUsedShortcut(makeGroups(), []);
    expect(result.map((item) => item.id)).toEqual(["n1", "e2", "e1"]);
  });

  it("includes orphan pseudo-entries only in this mode's output", () => {
    const result = sortByMostUsedShortcut(makeGroups(), [
      { signature: "Mod+Shift+K", modifiers: ["Shift"], key: "K", count: 52 },
    ]);
    const orphan = result.find((item) => item.isOrphan);
    expect(orphan).toEqual({
      id: "Mod+Shift+K",
      name: "",
      hotkeys: [{ modifiers: ["Shift"], key: "K" }],
      count: 52,
      bindingCounts: [52],
      isOrphan: true,
    });
    expect(result[0].id).toBe("Mod+Shift+K");
  });
});

/**
 * Fixture exercising multi-hotkey entries and a no-modifier binding, for the
 * key/modifier modes. "Multi Bind" mirrors the real bug this guards against:
 * distinct per-binding usage counts (11 and 5) that must not collapse into
 * one shared aggregate (16) on both duplicated rows.
 */
function makeKeyModifierGroups(): ResolvedCategoryGroup[] {
  return [
    {
      category: "Editing",
      aggregate: 20,
      entries: [
        { id: "e1", name: "Toggle Bold", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "B" }], count: 1, bindingCounts: [1] },
        {
          id: "e2",
          name: "Multi Bind",
          category: "Editing",
          hotkeys: [
            { modifiers: ["Mod"], key: "K" },
            { modifiers: ["Mod", "Shift"], key: "K" },
          ],
          count: 16,
          bindingCounts: [11, 5],
        },
        { id: "e3", name: "Ctrl Thing", category: "Editing", hotkeys: [{ modifiers: ["Ctrl"], key: "C" }], count: 3, bindingCounts: [3] },
      ],
    },
    {
      category: "Navigation",
      aggregate: 2,
      entries: [
        { id: "n1", name: "Cancel", category: "Navigation", hotkeys: [{ modifiers: [], key: "ESCAPE" }], count: 2, bindingCounts: [2] },
      ],
    },
  ];
}

describe("sortByKeyFlat", () => {
  it("orders bindings by raw key string, then modifier combo, then name; duplicates multi-bound entries", () => {
    const result = sortByKeyFlat(makeKeyModifierGroups());
    // ESCAPE is a special key and floats to the top, ahead of ordinary B/C/K keys.
    expect(result.map((item) => item.id)).toEqual(["n1::0", "e1::0", "e3::0", "e2::0", "e2::1"]);
  });

  it("shows each duplicated row's own binding count, not the entry's aggregate", () => {
    const result = sortByKeyFlat(makeKeyModifierGroups());
    const modBinding = result.find((item) => item.id === "e2::0")!; // Mod+K, used 11 times
    const modShiftBinding = result.find((item) => item.id === "e2::1")!; // Mod+Shift+K, used 5 times
    expect(modBinding.count).toBe(11);
    expect(modShiftBinding.count).toBe(5);
  });

  it("excludes orphans (no orphans parameter exists for this mode)", () => {
    const result = sortByKeyFlat(makeKeyModifierGroups());
    expect(result.every((item) => !item.isOrphan)).toBe(true);
  });
});

describe("groupByModifier", () => {
  it("groups bindings by modifier combination, including a no-modifier group", () => {
    const result = groupByModifier(makeKeyModifierGroups());
    expect(result.map((g) => g.category)).toEqual(["", "Mod", "Ctrl", "Mod+Shift"]);
  });

  it("orders groups by modifier count ascending, ties broken by canonical modifier order", () => {
    const result = groupByModifier(makeKeyModifierGroups());
    // Mod (rank 0) sorts before Ctrl (rank 1) — both single-modifier groups.
    const modIndex = result.findIndex((g) => g.category === "Mod");
    const ctrlIndex = result.findIndex((g) => g.category === "Ctrl");
    expect(modIndex).toBeLessThan(ctrlIndex);
  });

  it("orders bindings within a group by raw key string, then name", () => {
    const result = groupByModifier(makeKeyModifierGroups());
    const modGroup = result.find((g) => g.category === "Mod")!;
    expect(modGroup.entries.map((e) => e.id)).toEqual(["e1::0", "e2::0"]);
  });

  it("floats special keys to the top within a group, ahead of ordinary character keys", () => {
    const groups: ResolvedCategoryGroup[] = [
      {
        category: "Editing",
        aggregate: 2,
        entries: [
          { id: "e1", name: "Toggle Bold", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "B" }], count: 1, bindingCounts: [1] },
          { id: "e2", name: "Confirm", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "ENTER" }], count: 1, bindingCounts: [1] },
        ],
      },
    ];
    const result = groupByModifier(groups);
    const modGroup = result.find((g) => g.category === "Mod")!;
    expect(modGroup.entries.map((e) => e.id)).toEqual(["e2::0", "e1::0"]);
  });
});
