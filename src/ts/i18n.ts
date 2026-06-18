import en from "./i18n/en.json";
import fr from "./i18n/fr.json";
import es from "./i18n/es.json";

type Translations = typeof en;

const locales: Record<string, Partial<Translations>> = { en, fr, es };

function detectLocale(): string {
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
