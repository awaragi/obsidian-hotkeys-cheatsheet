## 1. Shared Signature Resolution

- [ ] 1.1 Confirm/extract the canonical signature function (`Mod,Ctrl,Meta,Shift,Alt` order + uppercased key) as a shared, exported function usable from both capture (`track-shortcut-usage`'s `usageTracker.ts`) and this change — coordinate with that change's implementation state; if it hasn't landed yet, define the shared function now in a location both can import from.
- [ ] 1.2 Add a pure `resolveUsage(groups: CategoryGroup[], counts: Record<string, number>)` function (e.g. in `hotkeyCollector.ts` or a new `usageResolver.ts`) that, for each entry, builds its canonical signature(s) and attaches the resolved count; computes each category's aggregate (sum of its entries' counts); and returns the list of signatures present in `counts` with no matching entry (orphans).
- [ ] 1.3 Add unit tests for `resolveUsage`: entry with a matching signature gets its count; entry with no matching signature in `counts` resolves to `0`; a signature in `counts` with no matching entry appears in the orphan list; multiple hotkeys on one entry sum correctly if more than one matches.

## 2. Scaling & Glyph Mapping

- [ ] 2.1 Add a pure `countToGlyph(count: number, max: number): { glyph: string; level: number }` function mapping to the 8 "eighths block" characters (`▁▂▃▄▅▆▇█`) using `sqrt(count) / sqrt(max)`, guarding `max === 0` (return the lowest level rather than dividing by zero).
- [ ] 2.2 Add unit tests: `count = 0` → lowest glyph; `count = max` → highest glyph; a small count against a much larger max still renders above the lowest level (verifying sqrt compression vs. linear); `max = 0` → lowest glyph, no throw.

## 3. Sort Modes

- [ ] 3.1 Add a `SortMode` type (`'category' | 'most-used-category' | 'most-used-shortcut'`) to [types.ts](../../../src/ts/types.ts).
- [ ] 3.2 Add pure reorder functions: `sortByCategory` (existing default order, unchanged), `sortByMostUsedCategory` (categories ranked by aggregate descending, entries within each ranked by count descending), `sortByMostUsedShortcut` (flattens all entries into one list ranked by count descending, including orphan pseudo-entries parsed from the orphan signature list).
- [ ] 3.3 Add unit tests for each reorder function, including: category ranking order, intra-category entry ranking, flat-list ranking, and orphan pseudo-entries present only in `sortByMostUsedShortcut`'s output with a parsed `{modifiers, key}` and a "no command" marker.

## 4. Modal Toolbar — Sort Control

- [ ] 4.1 In [cheatsheetModal.ts](../../../src/ts/cheatsheetModal.ts), add a sort button+dropdown following the existing filter/export dropdown pattern (outside-click-to-close, same visual language).
- [ ] 4.2 Disable "By Most-Used Category" and "By Most-Used Shortcut" dropdown items (muted style, no click handler) when `trackShortcutUsage` is `false`; keep them enabled and selectable when `true`.
- [ ] 4.3 Reset the active sort mode to `'category'` in `onOpen()`, matching the existing collapse-state reset precedent.
- [ ] 4.4 Disable the collapse/expand-all toggle button when the active sort mode is `'most-used-shortcut'` (no sections exist to collapse), reusing the existing disabled-button styling used during search.

## 5. Grid Rendering

- [ ] 5.1 When `trackShortcutUsage` is `true`, render each entry's glyph+count (from `resolveUsage` + `countToGlyph`, scaled against the full-dataset max) alongside its existing name/hotkey display; omit entirely when tracking is off.
- [ ] 5.2 Render each category heading's aggregate glyph+count using the independent category-level scale.
- [ ] 5.3 Ensure both scales (`max` for entries, `max` for categories) are computed once from the full unfiltered dataset before search/filter is applied, so glyph levels don't shift as the user types.
- [ ] 5.4 Implement flat rendering for `'most-used-shortcut'` mode: no category headings, one continuous ranked list.
- [ ] 5.5 Render orphan pseudo-entries (in flat mode only) using the same `modLabel`/`keyIcon` badge rendering as bound entries, with a localised "No command" placeholder instead of a name.
- [ ] 5.6 Extend the filtering logic so orphan pseudo-entries are excluded whenever the text search query is non-empty, but remain subject only to the modifier filter when the query is empty.

## 6. i18n

- [ ] 6.1 Add new keys (sort control label, the three mode labels, disabled-option tooltip text, "No command" placeholder) to [en.json](../../../src/ts/i18n/en.json), [es.json](../../../src/ts/i18n/es.json), and [fr.json](../../../src/ts/i18n/fr.json).

## 7. Verification

- [ ] 7.1 Run the full test suite and confirm existing tests still pass alongside new ones.
- [ ] 7.2 Manually verify in Obsidian: with tracking off, the modal is pixel-identical to before this change and only "By Category" is selectable; with tracking on, entry/category glyphs appear, all three sort modes work, orphaned signatures only appear in "By Most-Used Shortcut", and search/modifier-filter behave per the spec in every mode.
- [ ] 7.3 Manually verify export ("Save as Note" and "Save as HTML") is unaffected regardless of tracking state or active sort mode.
