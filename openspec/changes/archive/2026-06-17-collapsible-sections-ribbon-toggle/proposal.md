## Why

The cheatsheet modal has no way to focus on specific categories — all sections are always fully visible, which can be overwhelming for users who know what area they want to browse. Additionally, the ribbon icon cannot be hidden for users who prefer a minimal toolbar and rely on the command palette instead.

## What Changes

- New setting in the settings tab: toggle to show/hide the ribbon icon (takes effect immediately, no restart)
- Category sections in the modal can be individually collapsed/expanded by clicking their heading
- Two toolbar buttons — "Expand All" and "Collapse All" — control all sections at once
- Arrow indicator (`▾`/`▸`) on each heading shows its expand/collapse state
- All sections are expanded on every modal open (no state persistence between opens)
- While a search query is active, all sections are force-expanded so no matches are hidden; clearing search restores the collapse state that existed before typing

## Capabilities

### New Capabilities

- `ribbon-setting`: Setting to show or hide the plugin's ribbon icon, applied immediately without Obsidian restart

### Modified Capabilities

- `cheatsheet-modal`: Sections gain individual expand/collapse toggle; toolbar gains Expand All / Collapse All buttons; search interaction temporarily overrides collapse state

## Impact

- **Modified files**: `src/ts/main.ts`, `src/ts/settingsTab.ts`, `src/ts/cheatsheetModal.ts`, `src/css/styles.css`, `src/ts/i18n/en.json`, `fr.json`, `es.json`
- **No new dependencies**
