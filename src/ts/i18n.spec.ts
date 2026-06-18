import { describe, it, expect } from "vitest";
import { translate } from "./i18n";

describe("translate", () => {
  it("returns the English string for the en locale", () => {
    expect(translate("modal.title", "en")).toBe("Hotkeys Cheatsheet");
  });

  it("returns a different string for the fr locale", () => {
    expect(translate("modal.title", "fr")).toBe("Aide-mémoire des raccourcis");
  });

  it("falls back to English for an unknown locale", () => {
    expect(translate("modal.title", "xx")).toBe("Hotkeys Cheatsheet");
  });
});
