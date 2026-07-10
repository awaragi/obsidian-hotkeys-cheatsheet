## Why

The plugin's translation system (`en`/`fr`/`es`) only proves out Latin-script, left-to-right languages. The backlog calls for expanding localization to cover right-to-left scripts and Asian character sets, but nothing in the current modal, exports, or sort logic has been exercised against either — dropdown positioning, key-badge glyphs, and string collation all assume LTR Latin text. Landing one RTL locale (Arabic) and one CJK locale (Japanese) end-to-end proves the plugin actually supports both script families, rather than just adding more Latin translation files.

## What Changes

- Add `ar.json` (Arabic, RTL) and `ja.json` (Japanese, CJK) locale files, registered in `i18n.ts`'s `locales` map.
- Add a dynamic locale-completeness test that iterates `Object.keys(en)` against every registered non-`en` locale (including empty-string values as incomplete) — no hardcoded key or locale lists, so it stays correct as keys/locales are added.
- Add locale-aware string comparison (`localeCompare` with the active locale passed explicitly) for the 5 existing sort/collation call sites, replacing default-locale comparison. This fixes collation for Japanese and any other non-Latin script, not just RTL.
- Add RTL layout support to the cheatsheet modal:
  - `dir` attribute set on the modal root from the active locale.
  - Physical `left`/`right`/`margin-left` CSS properties migrated to logical equivalents (`inset-inline-*`, `margin-inline-*`) for the search-clear button, filter/sort/export dropdowns, and usage-category label, so they stay anchored to their trigger controls when mirrored.
  - The collapse/expand chevron (`▸`/`▾`) mirrors to point toward the reading-order "expand" direction under RTL. The `KEY_ICONS` arrow glyphs (↑↓←→, representing physical keyboard keys) explicitly do NOT mirror.
  - Hotkey badge elements get explicit `dir="ltr"` / bidi isolation so LTR key combos don't get reordered when embedded in RTL-direction command names.
- Add `lang`/`dir` attributes to the standalone HTML export, derived from the active locale (**Modified**: `html-export`).
- Route the previously-hardcoded `"Export failed: ..."` Notice through `t()` (**Modified**: `note-export`). Markdown table column order is intentionally left unchanged — direction is left to the viewer's own RTL rendering, avoiding a double-mirror when Obsidian's own RTL editor setting is active.
- Translate the 5 curated category headings (Editing, Navigation, Search, Files & Vault, Workspace) plus the "Other" fallback, everywhere they're displayed (modal, Markdown export, HTML export). Found during manual Arabic testing — these were rendered as raw internal grouping keys. Plugin-derived categories (a third-party plugin's own name) remain untranslated, since there's no way to translate arbitrary plugin names; internal grouping/sorting/collapse-state tracking keys off the canonical English identifier regardless of locale (**Modified**: `cheatsheet-modal`, `html-export`, `note-export`). This plugin's own command also gets its category translated (it otherwise falls into the same "untranslatable plugin name" bucket as a real third-party plugin, even though we control and already translate its name).
- Translate the Markdown export's table column headers ("Command"/"Hotkey") and both export filenames (`Hotkeys Cheatsheet.md` / `.html`), which were hardcoded English constants (**Modified**: `note-export`, `html-export`).

## Capabilities

### New Capabilities
- `localization`: locale detection and translation lookup (formalizing the existing `i18n.ts` system as a spec'd capability), locale registration for `ar` (RTL) and `ja` (CJK) alongside existing `en`/`fr`/`es`, a self-updating completeness test, and a shared locale-aware string comparison helper used by sort-dependent capabilities.

### Modified Capabilities
- `cheatsheet-modal`: modal renders with correct `dir` and mirrored layout under an RTL locale; key-based ordering uses locale-aware comparison instead of default-locale comparison.
- `hotkey-collector`: alphabetical ordering of categories and display names uses locale-aware comparison instead of default-locale comparison.
- `html-export`: exported HTML document declares `lang` and `dir` matching the active locale.
- `note-export`: the export-failure Notice is translated instead of a hardcoded English string.

## Impact

- `src/ts/i18n/i18n.ts`, `src/ts/i18n/locales/*.json`, `src/ts/i18n/i18n.spec.ts`
- `src/ts/hotkeys/keyDisplay.ts`, `src/ts/hotkeys/sortHotkeys.ts`, `src/ts/hotkeys/hotkeyCollector.ts` (locale-aware comparison)
- `src/ts/modal/grid.ts`, `src/ts/modal/toolbar.ts`, `src/ts/modal/cheatsheet.ts`, `src/css/styles.css` (RTL layout)
- `src/ts/modal/export.ts`, `src/ts/modal/htmlExportTemplate.ts` (export lang/dir, translated failure notice)
- No breaking changes; no new dependencies.
