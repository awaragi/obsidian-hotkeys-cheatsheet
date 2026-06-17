## 1. Ribbon Toggle Setting

- [x] 1.1 Add `showRibbonIcon: boolean` (default `true`) to `HotkeysCheatsheetSettings` interface and `DEFAULT_SETTINGS` in `settingsTab.ts`
- [x] 1.2 Store the `HTMLElement` returned by `addRibbonIcon()` on the plugin instance in `main.ts`
- [x] 1.3 On `onload`, hide the ribbon element if `settings.showRibbonIcon` is `false`
- [x] 1.4 Add `setRibbonVisible(visible: boolean)` method to the plugin that toggles `.hide()` / `.show()` and saves settings
- [x] 1.5 Add a toggle setting in `settingsTab.ts` display() that calls `plugin.setRibbonVisible()`
- [x] 1.6 Add i18n strings for the toggle label and description to `en.json`, `fr.json`, `es.json`

## 2. Section Collapse State

- [x] 2.1 Add `private collapsedSections = new Set<string>()` to `CheatsheetModal`; reset to empty in `onOpen()`
- [x] 2.2 Add `private searchSnapshot: Set<string> | null = null` for search restore
- [x] 2.3 In `renderCategorySection`, skip rendering entries (and mark heading as `▸`) when section is in `collapsedSections`; render entries (and mark heading as `▾`) otherwise
- [x] 2.4 Attach a `click` listener to `.hkc-category-heading` that toggles membership in `collapsedSections` and calls `renderGrid()` — listener is a no-op while `searchQuery` is non-empty
- [x] 2.5 Add CSS for collapsible heading: `cursor: pointer` when interactive, arrow indicator styled inline with heading text, `user-select: none`

## 3. Expand All / Collapse All Toolbar Buttons

- [x] 3.1 Add "Expand All" and "Collapse All" icon buttons to the toolbar in `buildToolbar()`
- [x] 3.2 "Expand All" clears `collapsedSections` and calls `renderGrid()`
- [x] 3.3 "Collapse All" adds all current group category names to `collapsedSections` and calls `renderGrid()`
- [x] 3.4 Disable both buttons (add `disabled` attribute and muted style) while `searchQuery` is non-empty; re-enable when cleared
- [x] 3.5 Add i18n strings for button labels to `en.json`, `fr.json`, `es.json`

## 4. Search Snapshot / Restore

- [x] 4.1 In the search `input` event handler: when transitioning from empty to non-empty query, snapshot `collapsedSections` into `searchSnapshot`
- [x] 4.2 While `searchQuery` is non-empty, `renderGrid()` treats all sections as expanded (ignores `collapsedSections`)
- [x] 4.3 When `searchQuery` clears (input event or Escape), restore `collapsedSections` from `searchSnapshot` and null the snapshot, then call `renderGrid()`

## 5. Build & Smoke Test

- [x] 5.1 Run `npm run build` — confirm no TypeScript errors
- [x] 5.2 Deploy to local vault and reload Obsidian
- [x] 5.3 Verify ribbon toggle in settings hides/shows ribbon immediately
- [x] 5.4 Verify hidden ribbon setting persists after Obsidian restart
- [x] 5.5 Verify clicking a section heading collapses and expands it with correct arrow indicator
- [x] 5.6 Verify Collapse All / Expand All buttons work correctly
- [x] 5.7 Verify buttons are disabled during search
- [x] 5.8 Verify typing a search query expands all collapsed sections
- [x] 5.9 Verify clearing search restores pre-search collapse state
- [x] 5.10 Verify Escape clears search and restores collapse state
