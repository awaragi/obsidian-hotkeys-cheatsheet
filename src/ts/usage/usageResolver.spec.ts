import { describe, it, expect, vi } from "vitest";

vi.mock("obsidian", () => ({
  Keymap: { isModifier: () => false },
  debounce: (cb: (...args: unknown[]) => unknown) => cb,
  normalizePath: (p: string) => p,
}));

import { resolveUsage } from "./usageResolver";
import type { CategoryGroup } from "../types";

function makeGroups(): CategoryGroup[] {
  return [
    {
      category: "Editing",
      entries: [
        { id: "editor:bold", name: "Toggle Bold", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "B" }], isModifiedFromDefault: false },
        { id: "editor:italic", name: "Toggle Italic", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "I" }], isModifiedFromDefault: false },
      ],
    },
  ];
}

describe("resolveUsage", () => {
  it("attaches the matching count to an entry", () => {
    const { groups } = resolveUsage(makeGroups(), { "Mod+B": 5 }, true);
    expect(groups[0].entries.find((e) => e.id === "editor:bold")?.count).toBe(5);
  });

  it("resolves an entry with no matching signature to 0", () => {
    const { groups } = resolveUsage(makeGroups(), {}, true);
    expect(groups[0].entries.find((e) => e.id === "editor:italic")?.count).toBe(0);
  });

  it("lists a signature with no matching entry as an orphan", () => {
    const { orphans } = resolveUsage(makeGroups(), { "Mod+Shift+K": 52 }, true);
    expect(orphans).toEqual([
      { signature: "Mod+Shift+K", modifiers: ["Mod", "Shift"], key: "K", count: 52, isSuspectedSystemShortcut: false },
    ]);
  });

  it("flags an orphan signature that matches a known system shortcut", () => {
    const { orphans } = resolveUsage(makeGroups(), { "Mod+V": 9 }, true);
    expect(orphans).toEqual([
      { signature: "Mod+V", modifiers: ["Mod"], key: "V", count: 9, isSuspectedSystemShortcut: true },
    ]);
  });

  it("does not surface a system-shortcut signature as an orphan when it matches a bound entry", () => {
    const groups: CategoryGroup[] = [
      {
        category: "Editing",
        entries: [
          { id: "editor:paste", name: "Paste", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "V" }], isModifiedFromDefault: false },
        ],
      },
    ];
    const { orphans } = resolveUsage(groups, { "Mod+V": 9 }, true);
    expect(orphans).toEqual([]);
  });

  it("flags a macOS-only system shortcut on macOS but not on Windows/Linux", () => {
    const macResult = resolveUsage(makeGroups(), { "Alt+ARROWLEFT": 3 }, true);
    const otherResult = resolveUsage(makeGroups(), { "Alt+ARROWLEFT": 3 }, false);
    expect(macResult.orphans[0].isSuspectedSystemShortcut).toBe(true);
    expect(otherResult.orphans[0].isSuspectedSystemShortcut).toBe(false);
  });

  it("sums counts across multiple hotkeys bound to the same entry", () => {
    const groups: CategoryGroup[] = [
      {
        category: "Editing",
        entries: [
          {
            id: "editor:bold",
            name: "Toggle Bold",
            category: "Editing",
            hotkeys: [
              { modifiers: ["Mod"], key: "B" },
              { modifiers: ["Ctrl"], key: "B" },
            ],
            isModifiedFromDefault: false,
          },
        ],
      },
    ];
    const { groups: resolved } = resolveUsage(groups, { "Mod+B": 3, "Ctrl+B": 4 }, true);
    expect(resolved[0].entries[0].count).toBe(7);
  });

  it("keeps each binding's own count available separately from the entry's aggregate", () => {
    const groups: CategoryGroup[] = [
      {
        category: "Editing",
        entries: [
          {
            id: "editor:bold",
            name: "Toggle Bold",
            category: "Editing",
            hotkeys: [
              { modifiers: ["Mod"], key: "K" },
              { modifiers: ["Mod", "Shift"], key: "K" },
            ],
            isModifiedFromDefault: false,
          },
        ],
      },
    ];
    const { groups: resolved } = resolveUsage(groups, { "Mod+K": 11, "Mod+Shift+K": 5 }, true);
    const entry = resolved[0].entries[0];
    expect(entry.count).toBe(16);
    expect(entry.bindingCounts).toEqual([11, 5]);
  });

  it("computes a category aggregate as the sum of its entries' counts", () => {
    const { groups } = resolveUsage(makeGroups(), { "Mod+B": 5, "Mod+I": 2 }, true);
    expect(groups[0].aggregate).toBe(7);
  });

  it("tracks the max entry count and max category aggregate across the dataset", () => {
    const { maxEntryCount, maxCategoryAggregate } = resolveUsage(makeGroups(), { "Mod+B": 5, "Mod+I": 2 }, true);
    expect(maxEntryCount).toBe(5);
    expect(maxCategoryAggregate).toBe(7);
  });
});
