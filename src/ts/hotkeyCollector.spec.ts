import { describe, it, expect } from "vitest";
import { toTitleCase, categorise, buildHotkeyGroups } from "./hotkeyCollector";

describe("toTitleCase", () => {
  it("capitalises first letter of each word split on hyphen", () => {
    expect(toTitleCase("my-plugin")).toBe("My Plugin");
  });

  it("capitalises first letter of each word split on underscore", () => {
    expect(toTitleCase("file_explorer")).toBe("File Explorer");
  });

  it("capitalises first letter of each word split on space", () => {
    expect(toTitleCase("hello world")).toBe("Hello World");
  });

  it("handles a single word", () => {
    expect(toTitleCase("editor")).toBe("Editor");
  });

  it("handles mixed separators", () => {
    expect(toTitleCase("foo-bar_baz")).toBe("Foo Bar Baz");
  });
});

describe("categorise", () => {
  it("maps known core prefix to curated category", () => {
    expect(categorise("editor:toggle-bold", "Toggle Bold")).toBe("Editing");
  });

  it("maps unknown prefix to title-cased plugin name", () => {
    expect(categorise("my-plugin:do-thing", "Do Thing")).toBe("My Plugin");
  });

  it("falls back to display name plugin prefix when no colon in id", () => {
    expect(categorise("somecommand", "MyPlugin: Do Thing")).toBe("MyPlugin");
  });

  it("returns Other when no colon and no display name separator", () => {
    expect(categorise("somecommand", "Just a command")).toBe("Other");
  });
});

describe("buildHotkeyGroups", () => {
  const commands = {
    "editor:toggle-bold": { id: "editor:toggle-bold", name: "Toggle Bold" },
    "editor:toggle-italic": { id: "editor:toggle-italic", name: "Toggle Italic" },
    "my-plugin:action": { id: "my-plugin:action", name: "My Plugin Action" },
  };

  it("uses default keys when no custom key is set", () => {
    const defaultKeys = { "editor:toggle-bold": [{ modifiers: ["Mod"], key: "b" }] };
    const customKeys = {};
    const groups = buildHotkeyGroups(defaultKeys, customKeys, commands);
    expect(groups[0].entries[0].hotkeys[0].key).toBe("B");
  });

  it("normalises key strings to uppercase", () => {
    const defaultKeys = { "editor:toggle-bold": [{ modifiers: ["Mod"], key: "a" }] };
    const customKeys = {};
    const groups = buildHotkeyGroups(defaultKeys, customKeys, commands);
    expect(groups[0].entries[0].hotkeys[0].key).toBe("A");
  });

  it("custom key overrides default key", () => {
    const defaultKeys = { "editor:toggle-bold": [{ modifiers: ["Mod"], key: "b" }] };
    const customKeys = { "editor:toggle-bold": [{ modifiers: ["Ctrl"], key: "x" }] };
    const groups = buildHotkeyGroups(defaultKeys, customKeys, commands);
    const entry = groups[0].entries.find((e) => e.id === "editor:toggle-bold");
    expect(entry?.hotkeys[0].modifiers).toEqual(["Ctrl"]);
    expect(entry?.hotkeys[0].key).toBe("X");
  });

  it("empty custom array clears default (command does not appear)", () => {
    const defaultKeys = { "editor:toggle-bold": [{ modifiers: ["Mod"], key: "b" }] };
    const customKeys = { "editor:toggle-bold": [] };
    const groups = buildHotkeyGroups(defaultKeys, customKeys, commands);
    const allEntries = groups.flatMap((g) => g.entries);
    expect(allEntries.find((e) => e.id === "editor:toggle-bold")).toBeUndefined();
  });

  it("core categories appear before plugin categories", () => {
    const defaultKeys = {
      "editor:toggle-bold": [{ modifiers: ["Mod"], key: "b" }],
      "my-plugin:action": [{ modifiers: ["Alt"], key: "p" }],
    };
    const customKeys = {};
    const groups = buildHotkeyGroups(defaultKeys, customKeys, commands);
    const categoryNames = groups.map((g) => g.category);
    const editingIdx = categoryNames.indexOf("Editing");
    const pluginIdx = categoryNames.indexOf("My Plugin");
    expect(editingIdx).toBeGreaterThanOrEqual(0);
    expect(pluginIdx).toBeGreaterThanOrEqual(0);
    expect(editingIdx).toBeLessThan(pluginIdx);
  });

  it("entries within a category are sorted alphabetically", () => {
    const defaultKeys = {
      "editor:toggle-italic": [{ modifiers: ["Mod"], key: "i" }],
      "editor:toggle-bold": [{ modifiers: ["Mod"], key: "b" }],
    };
    const customKeys = {};
    const groups = buildHotkeyGroups(defaultKeys, customKeys, commands);
    const editingGroup = groups.find((g) => g.category === "Editing");
    expect(editingGroup?.entries[0].name).toBe("Toggle Bold");
    expect(editingGroup?.entries[1].name).toBe("Toggle Italic");
  });

  it("returns empty array when both defaultKeys and customKeys are empty", () => {
    expect(buildHotkeyGroups({}, {}, commands)).toEqual([]);
  });

  it("uses id as name fallback when command is not in commands map", () => {
    const defaultKeys = { "unknown:cmd": [{ modifiers: [], key: "z" }] };
    const customKeys = {};
    const groups = buildHotkeyGroups(defaultKeys, customKeys, {});
    expect(groups[0].entries[0].name).toBe("unknown:cmd");
  });
});
