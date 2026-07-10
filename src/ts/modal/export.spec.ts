import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("obsidian", () => ({
  Platform: { isMacOS: false },
}));

import { generateMarkdown, exportNoteFilename, exportHtmlFilename } from "./export";
import type { CategoryGroup } from "../types";

function makeGroups(): CategoryGroup[] {
  return [
    {
      category: "Editing",
      entries: [
        { id: "e1", name: "Toggle Bold", category: "Editing", hotkeys: [{ modifiers: ["Mod"], key: "B" }], isModifiedFromDefault: false },
      ],
    },
  ];
}

describe("generateMarkdown table headers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the English column headers by default", () => {
    const md = generateMarkdown(makeGroups());
    expect(md).toContain("| Command | Hotkey |");
  });

  it("translates the column headers under an active locale", () => {
    vi.stubGlobal("window", { moment: { locale: () => "ja" } });
    const md = generateMarkdown(makeGroups());
    expect(md).toContain("| コマンド | ショートカット |");
  });
});

describe("export filenames", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the English title by default", () => {
    expect(exportNoteFilename()).toBe("Hotkeys Cheatsheet.md");
    expect(exportHtmlFilename()).toBe("Hotkeys Cheatsheet.html");
  });

  it("uses the translated title under an active locale", () => {
    vi.stubGlobal("window", { moment: { locale: () => "ja" } });
    expect(exportNoteFilename()).toBe("ホットキー早見表.md");
    expect(exportHtmlFilename()).toBe("ホットキー早見表.html");
  });
});
