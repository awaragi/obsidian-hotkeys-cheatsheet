## 1. Locale infrastructure

- [x] 1.1 Add `src/ts/i18n/locales/ar.json` with a non-empty translation for every key in `en.json`
- [x] 1.2 Add `src/ts/i18n/locales/ja.json` with a non-empty translation for every key in `en.json`
- [x] 1.3 Register `ar` and `ja` in the `locales` map in `src/ts/i18n/i18n.ts`
- [x] 1.4 Add an `isRtl(locale)` (or equivalent) helper in `i18n.ts` that returns whether a given locale code is right-to-left, covering `ar` (true) and `ja`/`en`/`fr`/`es` (false)
- [x] 1.5 Add a `compareStrings(a, b, locale)` (or equivalent) helper in `i18n.ts` wrapping `localeCompare` with an explicit locale argument

## 2. Locale completeness test

- [x] 2.1 In `i18n.spec.ts`, add a dynamic test that iterates `Object.keys(en)` and `Object.entries(locales)` (excluding `en`) and asserts every key exists as a non-empty string in every locale
- [x] 2.2 Verify the test fails as expected against a deliberately incomplete locale object (temporary local check, not committed) before relying on it

## 3. Locale-aware collation

- [x] 3.1 Update `keyDisplay.ts:95` (`compareKeys`) to use the shared locale-aware comparison helper instead of bare `localeCompare`
- [x] 3.2 Update `sortHotkeys.ts:134` and `sortHotkeys.ts:175` to use the shared locale-aware comparison helper
- [x] 3.3 Update `hotkeyCollector.ts:129` and `hotkeyCollector.ts:136` to use the shared locale-aware comparison helper
- [x] 3.4 Add/update unit tests for each call site asserting comparison behavior with sample Japanese strings

## 4. RTL layout — CSS

- [x] 4.1 Migrate `.hkc-search-clear` (`right: 6px`) to a logical `inset-inline-end` property
- [x] 4.2 Migrate `.hkc-filter-dropdown` and `.hkc-sort-dropdown` (`right: 0`) to logical `inset-inline-end`
- [x] 4.3 Migrate `.hkc-export-dropdown` (`left: 0`) to logical `inset-inline-start`
- [x] 4.4 Migrate `.hkc-usage-category` (`margin-left: 8px`) to logical `margin-inline-start`
- [x] 4.5 Sweep `src/css/styles.css` for any other physical `left`/`right`/`margin-left`/`margin-right`/`padding-left`/`padding-right` rules affecting modal chrome (toolbar, search, dropdowns) and migrate to logical equivalents — also migrated `.hkc-search`'s physical `padding` shorthand to `padding-block`/`padding-inline`; confirmed no physical directional rules remain

## 5. RTL layout — modal behavior

- [x] 5.1 Set a `dir` attribute on the modal root element derived from `isRtl(locale())` when the modal opens
- [x] 5.2 In `grid.ts`, mirror the collapse chevron glyph (`▸`→`◂` collapsed, `▾` stays) when the active locale is RTL; leave `KEY_ICONS` arrow glyphs in `keyDisplay.ts` untouched, with a comment noting they represent physical keys and must not mirror
- [x] 5.3 Apply explicit `dir="ltr"` / `unicode-bidi: isolate` styling to hotkey badge elements so LTR key combos don't reorder next to RTL command names
- [ ] 5.4 Manually verify in Obsidian with `moment.locale('ar')` (via DevTools console): filter, sort, and export dropdowns stay anchored to their trigger buttons; collapse chevron points the mirrored direction; hotkey badges render in correct LTR order next to Arabic text

## 6. Exports

- [x] 6.1 In `htmlExportTemplate.ts`, replace the hardcoded `<html lang="en">` with `lang`/`dir` derived from the active locale
- [x] 6.2 In `export.ts`, add a translation key for the export-failure message and route the `Notice(\`Export failed: ${String(err)}\`)` call through `t()` with the error interpolated in
- [ ] 6.3 Verify Save-as-HTML output under `ar` locale has correct `lang`/`dir` and Save-as-Note output has translated headers with unchanged column order

## 7. Command registration

- [x] 7.1 Verify ribbon tooltip and command palette entry (`main.ts` `onload()`) render correctly in Arabic and Japanese once `ar.json`/`ja.json` are registered — no code change made to `main.ts` (confirms the existing one-time-registration-at-`onload()` pattern needs none); added direct `translate("command.name"/"ribbon.tooltip", "ar"/"ja")` assertions in `i18n.spec.ts` confirming correct lookups. Live-Obsidian visual confirmation still pending (see 8.2/8.3).

## 8. Verification

- [x] 8.1 Run the full test suite and confirm all locale, collation, and export tests pass — 345/345 passing; `tsc --noEmit` and `npm run lint` clean; `npm run build` succeeds
- [ ] 8.2 Manual pass in Obsidian: switch to Arabic (`moment.locale('ar')`), open the modal, exercise search/filter/sort/export/collapse, confirm layout mirrors correctly and no English strings leak into the plugin's own UI
- [ ] 8.3 Manual pass in Obsidian: switch to Japanese (`moment.locale('ja')`), confirm translations render and command/category ordering uses Japanese collation

## 9. Category heading localization

Gap found during manual Arabic testing: the 5 curated category headings (Editing, Navigation, Search, Files & Vault, Workspace) and the "Other" fallback were never translated — they were rendered as raw internal grouping keys in the modal, Markdown export, and HTML export.

- [x] 9.1 Add `category.editing` / `category.navigation` / `category.search` / `category.files_vault` / `category.workspace` / `category.other` keys to all 5 locale files
- [x] 9.2 Add `categoryDisplayLabel()` in `categories.ts`, translating the 6 curated identifiers and passing plugin-derived categories through unchanged (they can't be translated — arbitrary third-party plugin names); export `OTHER_CATEGORY` constant to replace the `"Other"` string literal in `hotkeyCollector.ts`
- [x] 9.3 Wire `categoryDisplayLabel()` into `grid.ts` (`groupHeadingLabel`), `export.ts` (`generateMarkdown`), and `htmlExportTemplate.ts` (`renderHtmlSections`) — internal grouping/sorting/collapse-state keys stay on the canonical English identifier; only display text changes
- [x] 9.4 Add `categories.spec.ts` covering: English default, translation under an active locale, and plugin categories passing through unchanged
- [x] 9.5 Run full test suite, typecheck, lint, build — 372/372 tests passing, all clean
- [x] 9.6 Fix a second gap found in the same pass: this plugin's own command falls into `categorise()`'s generic "unknown prefix → title-cased plugin name" branch (title-casing manifest id `"hotkeys-cheatsheet"` to `"Hotkeys Cheatsheet"`), so it was being treated as an untranslatable third-party plugin category even though the plugin already has a translated name (`settings.about.name`). Added a `SELF_PLUGIN_CATEGORY` entry to `CATEGORY_LABEL_KEYS` in `categories.ts` reusing that key, plus a regression test in `categories.spec.ts` — 373/373 tests passing, typecheck/lint/build clean

## 10. Note export table headers and filenames

Two more gaps reported after manual testing: the Markdown table's column headers ("Command"/"Hotkey") were hardcoded literal strings never routed through `t()`, and both export filenames (`Hotkeys Cheatsheet.md` / `.html`) were hardcoded constants rather than derived from the translated title.

- [x] 10.1 Add `modal.export_table_command` / `modal.export_table_hotkey` translation keys to all 5 locale files
- [x] 10.2 In `export.ts`'s `generateMarkdown()`, replace the hardcoded `| Command | Hotkey |` header with `t("modal.export_table_command")` / `t("modal.export_table_hotkey")`
- [x] 10.3 Replace the `EXPORT_FILENAME` / `EXPORT_HTML_FILENAME` module-level constants with `exportNoteFilename()` / `exportHtmlFilename()` functions deriving the name from `t("modal.title")` at call time, so the filename matches the active locale; wire into `exportNoteToVault()`'s `path` and `saveHtmlDownload()`'s `a.download`
- [x] 10.4 Add `export.spec.ts` covering: default English table headers and filenames, and translated Japanese table headers and filenames
- [x] 10.5 Update the pre-existing `note-export` and `html-export` specs (MODIFIED Requirements) to reflect the translated filename and table headers, replacing the literal-English normative text
- [x] 10.6 Run full test suite, typecheck, lint, build — 385/385 tests passing, all clean
