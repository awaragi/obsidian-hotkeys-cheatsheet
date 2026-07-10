import { describe, it, expect } from "vitest";
import { translate, isRtl, compareStrings, locales } from "./i18n";

const en = locales["en"];

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

  it("resolves the command name and ribbon tooltip in Arabic (registered at plugin onload)", () => {
    expect(translate("command.name", "ar")).toBe("فتح ورقة اختصارات لوحة المفاتيح");
    expect(translate("ribbon.tooltip", "ar")).toBe("فتح ورقة اختصارات لوحة المفاتيح");
  });

  it("resolves the command name and ribbon tooltip in Japanese (registered at plugin onload)", () => {
    expect(translate("command.name", "ja")).toBe("ホットキー早見表を開く");
    expect(translate("ribbon.tooltip", "ja")).toBe("ホットキー早見表を開く");
  });
});

describe("locale completeness", () => {
  const requiredKeys = Object.keys(en);

  for (const [code, translations] of Object.entries(locales)) {
    if (code === "en") continue;

    describe(`${code} locale`, () => {
      for (const key of requiredKeys) {
        it(`has a non-empty translation for "${key}"`, () => {
          const value = (translations as Record<string, string | undefined>)[key];
          expect(typeof value).toBe("string");
          expect((value as string).length).toBeGreaterThan(0);
        });
      }
    });
  }
});

describe("isRtl", () => {
  it("returns true for Arabic", () => {
    expect(isRtl("ar")).toBe(true);
  });

  it("returns false for Japanese and other LTR locales", () => {
    expect(isRtl("ja")).toBe(false);
    expect(isRtl("en")).toBe(false);
    expect(isRtl("fr")).toBe(false);
    expect(isRtl("es")).toBe(false);
  });
});

describe("compareStrings", () => {
  it("orders Japanese strings using ja collation", () => {
    expect(compareStrings("あ", "い", "ja")).toBeLessThan(0);
  });

  it("orders ASCII strings alphabetically by default", () => {
    expect(["C", "A", "B"].sort((a, b) => compareStrings(a, b, "en"))).toEqual(["A", "B", "C"]);
  });
});
