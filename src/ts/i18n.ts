import en from "./i18n/en.json";
import fr from "./i18n/fr.json";
import es from "./i18n/es.json";

type Translations = typeof en;

const locales: Record<string, Partial<Translations>> = { en, fr, es };

function detectLocale(): string {
  // Obsidian exposes moment — its locale matches the app language setting
  const lang = (window as any).moment?.locale() ?? navigator.language;
  const code = lang.split("-")[0].toLowerCase();
  return code in locales ? code : "en";
}

const strings: Partial<Translations> = locales[detectLocale()];

export function t(key: keyof Translations, vars?: Record<string, string>): string {
  let str = (strings[key] ?? en[key]) as string;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{{${k}}}`, v);
    }
  }
  return str;
}

export function locale(): string {
  return detectLocale();
}
