import { describe, it, expect } from "vitest";
import { sortByCategory, sortByMostUsedCategory, sortByMostUsedShortcut } from "./sortHotkeys";
import type { ResolvedCategoryGroup } from "./usageResolver";

function makeGroups(): ResolvedCategoryGroup[] {
  return [
    {
      category: "Editing",
      aggregate: 3,
      entries: [
        { id: "e1", name: "Toggle Bold", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "B" }], count: 1 },
        { id: "e2", name: "Toggle Italic", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "I" }], count: 2 },
      ],
    },
    {
      category: "Navigation",
      aggregate: 10,
      entries: [
        { id: "n1", name: "Go Back", category: "Navigation", hotkeys: [{ modifiers: ["Mod"], key: "["  }], count: 10 },
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
      isOrphan: true,
    });
    expect(result[0].id).toBe("Mod+Shift+K");
  });
});
