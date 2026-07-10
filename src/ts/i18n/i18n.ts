import en from "./locales/en.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import ar from "./locales/ar.json";
import ja from "./locales/ja.json";

type Translations = typeof en;

/** Registered locales, keyed by code. Exported so tests can verify completeness dynamically. */
export const locales: Record<string, Partial<Translations>> = { en, fr, es, ar, ja };

/** Locale codes that read right-to-left, used to drive `dir` and mirrored layout. */
const RTL_LOCALES = new Set(["ar"]);

function detectLocale(): string {
  // No `window` outside a browser/Electron renderer (e.g. under Vitest) — fall back to English.
  if (typeof window === "undefined") return "en";
  // Obsidian exposes moment — its locale matches the app language setting
  const lang = (window as Window & { moment?: { locale(): string } }).moment?.locale() ?? navigator.language;
  const code = lang.split("-")[0].toLowerCase();
  return code in locales ? code : "en";
}

/**
 * Pure translation function: looks up `key` in the given `locale` (falling
 * back to English) and interpolates any `{{var}}` placeholders from `vars`.
 * Does not read any globals — suitable for use in unit tests.
 */
export function translate(
  key: keyof Translations,
  locale: string,
  vars?: Record<string, string>
): string {
  const strings: Partial<Translations> = locales[locale] ?? locales["en"];
  let str = strings[key] ?? en[key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{{${k}}}`, v);
    }
  }
  return str;
}

export function t(key: keyof Translations, vars?: Record<string, string>): string {
  return translate(key, detectLocale(), vars);
}

export function locale(): string {
  return detectLocale();
}

/** True if `loc` is a right-to-left locale (e.g. Arabic). */
export function isRtl(loc: string): boolean {
  return RTL_LOCALES.has(loc);
}

/**
 * Locale-aware string comparison for sorting. Passes `loc` explicitly to
 * `localeCompare` rather than relying on the JS runtime's default locale,
 * which is not guaranteed to match Obsidian's configured interface language.
 * Defaults to the active detected locale when `loc` is omitted.
 */
export function compareStrings(a: string, b: string, loc: string = locale()): number {
  return a.localeCompare(b, loc);
}
