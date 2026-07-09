import { describe, it, expect, vi } from "vitest";

vi.mock("obsidian", () => ({
  Keymap: { isModifier: () => false },
  debounce: (cb: (...args: unknown[]) => unknown) => cb,
  normalizePath: (p: string) => p,
}));

import { resolveConflicts } from "./conflictDetector";
import type { CategoryGroup } from "../types";

function makeEntry(id: string, hotkeys: { modifiers: string[]; key: string }[]) {
  return { id, name: id, category: "Editing", hotkeys, isModifiedFromDefault: false };
}

describe("resolveConflicts", () => {
  it("flags both commands when they share the same combo", () => {
    const groups: CategoryGroup[] = [
      {
        category: "Editing",
        entries: [
          makeEntry("editor:bold", [{ modifiers: ["Mod", "Shift"], key: "K" }]),
          makeEntry("editor:italic", [{ modifiers: ["Mod", "Shift"], key: "K" }]),
        ],
      },
    ];
    const conflicting = resolveConflicts(groups);
    expect(conflicting.has("editor:bold")).toBe(true);
    expect(conflicting.has("editor:italic")).toBe(true);
  });

  it("does not flag a single command's own multiple bindings as conflicting with each other", () => {
    const groups: CategoryGroup[] = [
      {
        category: "Editing",
        entries: [
          makeEntry("command-palette:open", [
            { modifiers: ["Mod"], key: "P" },
            { modifiers: ["Ctrl", "Shift"], key: "P" },
          ]),
        ],
      },
    ];
    expect(resolveConflicts(groups).size).toBe(0);
  });

  it("flags nothing when no bindings are shared", () => {
    const groups: CategoryGroup[] = [
      {
        category: "Editing",
        entries: [
          makeEntry("editor:bold", [{ modifiers: ["Mod"], key: "B" }]),
          makeEntry("editor:italic", [{ modifiers: ["Mod"], key: "I" }]),
        ],
      },
    ];
    expect(resolveConflicts(groups).size).toBe(0);
  });

  it("detects conflicts regardless of modifier array declaration order", () => {
    const groups: CategoryGroup[] = [
      {
        category: "Editing",
        entries: [
          makeEntry("editor:bold", [{ modifiers: ["Mod", "Shift"], key: "K" }]),
          makeEntry("editor:italic", [{ modifiers: ["Shift", "Mod"], key: "K" }]),
        ],
      },
    ];
    const conflicting = resolveConflicts(groups);
    expect(conflicting.has("editor:bold")).toBe(true);
    expect(conflicting.has("editor:italic")).toBe(true);
  });
});
