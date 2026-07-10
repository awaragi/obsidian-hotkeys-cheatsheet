import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("obsidian", () => ({
  Keymap: { isModifier: () => false },
  debounce: (cb: (...args: unknown[]) => unknown) => cb,
  normalizePath: (p: string) => p,
}));

import { categoryDisplayLabel, CATEGORY_ORDER, OTHER_CATEGORY } from "./categories";

describe("categoryDisplayLabel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the English label for a curated category with no locale set", () => {
    expect(categoryDisplayLabel("Editing")).toBe("Editing");
    expect(categoryDisplayLabel("Files & Vault")).toBe("Files & Vault");
  });

  it("translates every curated category and the Other fallback under an active locale", () => {
    vi.stubGlobal("window", { moment: { locale: () => "fr" } });
    expect(categoryDisplayLabel("Editing")).toBe("Édition");
    vi.unstubAllGlobals();

    // Japanese differs in script from every English category name, so this
    // also confirms none of them silently fall through untranslated.
    vi.stubGlobal("window", { moment: { locale: () => "ja" } });
    for (const category of [...CATEGORY_ORDER, OTHER_CATEGORY]) {
      expect(categoryDisplayLabel(category)).not.toBe(category);
    }
  });

  it("passes a plugin category name through unchanged, since it can't be translated", () => {
    vi.stubGlobal("window", { moment: { locale: () => "fr" } });
    expect(categoryDisplayLabel("My Plugin")).toBe("My Plugin");
  });

  it("translates this plugin's own category, unlike a third-party plugin's", () => {
    // categorise() title-cases the "hotkeys-cheatsheet" manifest id to this
    // exact string for this plugin's own command — see hotkeyCollector.ts.
    vi.stubGlobal("window", { moment: { locale: () => "ja" } });
    expect(categoryDisplayLabel("Hotkeys Cheatsheet")).toBe("ホットキー早見表");
  });
});
