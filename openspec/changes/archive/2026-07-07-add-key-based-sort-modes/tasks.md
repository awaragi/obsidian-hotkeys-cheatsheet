## 1. Types

- [x] 1.1 Extend `SortMode` in `src/ts/types.ts` with `"modifier"` and `"key"`.

## 2. Sort/group logic (`src/ts/sortHotkeys.ts`)

- [x] 2.1 Add `explodeEntryBindings(groups)`: emits one row per `HotkeyBinding` (id `${entry.id}::${bindingIndex}`, same `name`/`count` as the source entry), shared by both new modes.
- [x] 2.2 Add `sortByKeyFlat(groups)`: calls `explodeEntryBindings`, returns `FlatHotkeyItem[]` ordered by `compareKeys` (special keys first), then canonical modifier order (`Mod, Ctrl, Meta, Shift, Alt`), then command name. Excludes orphans.
- [x] 2.3 Add `groupByModifier(groups)`: calls `explodeEntryBindings`, returns `ResolvedCategoryGroup[]`-shaped data with one group per distinct modifier combination (empty combination included), entries ordered by `compareKeys` then command name. Groups ordered by modifier count ascending, ties broken by canonical modifier order.
- [x] 2.4 Add a small internal helper to build a modifier-combo group key from a `HotkeyBinding`'s modifiers using `MODIFIER_ORDER` (import from `usageTracker.ts`), without the Mod/alias dedup step (not needed — bindings never store both).
- [x] 2.5 Dropped: `groupByKey` (grouping by individual key) — built, reviewed, and removed for being visually noisy (too many small sections). Do not re-add without revisiting `design.md`.

## 3. Key ordering (`src/ts/keyDisplay.ts`)

- [x] 3.1 Add `compareKeys(a, b)`: orders two raw key strings so keys present in `KEY_ICONS` (arrows, Enter, Escape, Tab, Backspace, Delete, Home, End, Page Up/Down) sort before ordinary character keys, in `KEY_ICONS`' key order; ordinary keys fall back to `localeCompare`. Exported so any other view needing key ordering can reuse it.

## 4. Modal wiring (`src/ts/cheatsheetModal.ts`)

- [x] 4.1 Add "By Modifier" and "By Key" to the `modes` array in `buildSortControl`, in final order: "By Category", "By Modifier", "By Key", "By Most-Used Category", "By Most-Used Shortcut".
- [x] 4.2 Update the `usageDependent` check to an explicit allowlist: `mode === "most-used-category" || mode === "most-used-shortcut"`.
- [x] 4.3 In the sort-item click handler, clear `this.collapsedSections` before calling `updateSortItems()`/`renderGrid()` so collapse state never carries across a sort-mode change.
- [x] 4.4 In `renderGrid()`, branch: `"most-used-shortcut"` and `"key"` both use the flat-list path (`sortByMostUsedShortcut` / `sortByKeyFlat` respectively, filtered via `matchesFlatItem`); `"modifier"` uses the grouped path alongside `"category"`/`"most-used-category"`, selecting `groupByModifier(...)` instead of `usageResolution.groups`.
- [x] 4.5 Update `updateToolbarState()`'s `flatMode` check to `this.sortMode === "most-used-shortcut" || this.sortMode === "key"`.
- [x] 4.6 Track `currentGroupLabels` (the active mode's group labels) so the collapse/expand-all toggle and its button reflect whichever grouping is currently rendered, not always the raw categories.
- [x] 4.7 For "By Modifier" heading text: render the joined `modLabel()` tokens (or the localized "No Modifier" string for the empty combination) instead of the raw category string.

## 5. i18n

- [x] 5.1 Add `modal.sort_key`, `modal.sort_modifier`, and `modal.sort_no_modifier` keys to `src/ts/i18n/en.json`, `fr.json`, and `es.json`.

## 6. Tests

- [x] 6.1 `keyDisplay.spec.ts`: unit tests for `compareKeys` (special-before-ordinary, alphabetical among ordinary keys, fixed priority among special keys, equal keys).
- [x] 6.2 `sortHotkeys.spec.ts`: unit tests for `sortByKeyFlat` ordering (special keys first, then key string asc, then modifier order, then name; orphans excluded; multi-hotkey entries duplicated with count carried on each row).
- [x] 6.3 `sortHotkeys.spec.ts`: unit tests for `groupByModifier` (grouping correctness including the no-modifier bucket, group order by modifier count then canonical order, within-group order including special-keys-first).
- [x] 6.4 `filterHotkeys.spec.ts`: confirm `matchesFlatItem`/`matchesFilters` behave correctly against exploded single-binding rows (no new filter logic expected, but verify no regressions).

## 7. Manual verification

- [ ] 7.1 Drive the modal: confirm all five modes render in order, reorder immediately on selection, reset to "By Category" on modal reopen, and that "By Modifier"/"By Key" stay selectable with `trackShortcutUsage` off.
- [ ] 7.2 Confirm a multi-hotkey command appears once per binding under "By Modifier", each duplicate showing that binding's own usage count (not a shared aggregate).
- [ ] 7.3 Confirm switching from a collapsed "By Category" section to "By Modifier" renders fully expanded.
- [ ] 7.4 Confirm special keys (arrows, Enter, Escape, etc.) appear ahead of ordinary character keys under "By Key" and within each "By Modifier" group.
- [ ] 7.5 Confirm a multi-hotkey command under "By Category" (or "By Most-Used Category"/"By Most-Used Shortcut") shows each hotkey badge with its own usage count, not the same summed number repeated on every badge.

## 8. Bug fix: per-binding usage counts

- [x] 8.1 `usageResolver.ts`: `ResolvedHotkeyEntry` gains `bindingCounts: number[]` (parallel to `hotkeys`), computed in the same loop as the existing summed `count`.
- [x] 8.2 `sortHotkeys.ts`: `explodeEntryBindings` reads `entry.bindingCounts[index]` instead of `entry.count`; `FlatHotkeyItem` gains `bindingCounts`, populated in `sortByMostUsedShortcut` (from `entry.bindingCounts` / `[orphan.count]`) and `sortByKeyFlat` (`[row.count]`); `groupByModifier`'s produced entries include `bindingCounts: [row.count]`.
- [x] 8.3 `cheatsheetModal.ts`: `renderHotkeyEntryRow` takes `bindingCounts: number[]` instead of a single `count`; the usage indicator moves from next to the command name into each `hkRow`, keyed by `bindingCounts[index]`. Both callers (`renderCategorySection`, `renderFlatList`) updated to pass `bindingCounts`.
- [x] 8.4 Tests: `usageResolver.spec.ts` covers a multi-hotkey entry with distinct per-binding counts; `sortHotkeys.spec.ts`'s "carries the count" test rewritten to assert distinct per-binding counts instead of a shared aggregate; `filterHotkeys.spec.ts`'s `makeFlatItem` fixture updated with `bindingCounts`.
