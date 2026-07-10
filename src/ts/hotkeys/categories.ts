import { t } from "../i18n/i18n";

type TranslationKey = Parameters<typeof t>[0];

/** Curated map: Obsidian core command prefix → workflow category name. */
export const CORE_PREFIX_MAP: Record<string, string> = {
  editor: "Editing",
  markdown: "Editing",
  properties: "Editing",
  backlink: "Navigation",
  bookmarks: "Navigation",
  "command-palette": "Navigation",
  graph: "Navigation",
  navigate: "Navigation",
  outline: "Navigation",
  starred: "Navigation",
  switcher: "Navigation",
  "tag-pane": "Navigation",
  "global-search": "Search",
  search: "Search",
  "file-explorer": "Files & Vault",
  "file-recovery": "Files & Vault",
  file: "Files & Vault",
  app: "Workspace",
  canvas: "Workspace",
  theme: "Workspace",
  window: "Workspace",
  workspace: "Workspace",
};

/** Core categories rendered in this order before plugin groups. */
export const CATEGORY_ORDER: string[] = [
  "Editing",
  "Navigation",
  "Search",
  "Files & Vault",
  "Workspace",
];

/** Fallback category for a command with no recognizable prefix or plugin name. */
export const OTHER_CATEGORY = "Other";

/**
 * This plugin's own manifest id (`manifest.json`'s `"id"`). Its command falls
 * into the generic "unknown prefix → title-cased plugin name" branch of
 * `categorise()` like any third-party plugin, title-casing to "Hotkeys
 * Cheatsheet" — but unlike an actual third-party plugin, we do control this
 * name and already have it translated (`settings.about.name`), so it gets a
 * `CATEGORY_LABEL_KEYS` entry too instead of being left untranslated.
 */
const SELF_PLUGIN_CATEGORY = "Hotkeys Cheatsheet";

/**
 * Translation key for each curated category's display label, keyed by the
 * category's canonical (English) internal identifier — which stays stable
 * across locales since it's also used as a grouping/sort key. Third-party
 * plugin categories (arbitrary plugin names we don't control) have no entry
 * here and are displayed as-is; there is no way to translate those.
 */
const CATEGORY_LABEL_KEYS: Record<string, TranslationKey> = {
  Editing: "category.editing",
  Navigation: "category.navigation",
  Search: "category.search",
  "Files & Vault": "category.files_vault",
  Workspace: "category.workspace",
  [OTHER_CATEGORY]: "category.other",
  [SELF_PLUGIN_CATEGORY]: "settings.about.name",
};

/** Display label for a category heading: translated for curated categories, passed through unchanged for plugin categories. */
export function categoryDisplayLabel(category: string): string {
  const key = CATEGORY_LABEL_KEYS[category];
  return key ? t(key) : category;
}
