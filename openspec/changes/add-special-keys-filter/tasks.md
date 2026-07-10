## 1. Core filtering logic

- [x] 1.1 Add `isSpecialKey(key: string): boolean` to `src/ts/hotkeys/keyDisplay.ts` (`key in KEY_ICONS`), with a unit test in `keyDisplay.spec.ts` covering a special key, an ordinary key, and case sensitivity (input is expected already-uppercased).
- [x] 1.2 Add `specialKeysOnly?: boolean` to `EntryFilterFlags` in `src/ts/hotkeys/filterHotkeys.ts`.
- [x] 1.3 In `matchesFilters`, when `specialKeysOnly` is true, require `entry.hotkeys.some(hk => isSpecialKey(hk.key))`.
- [x] 1.4 In `matchesFlatItem`, apply the same `specialKeysOnly` check against `item.hotkeys` (including orphan rows, which have a real key).
- [x] 1.5 Add/extend cases in `filterHotkeys.spec.ts`: special-keys-only alone, combined with conflicts/modified (AND), combined with a modifier checkbox, combined with search, and the orphan-row case in `matchesFlatItem`.

## 2. State

- [x] 2.1 Add `specialKeysOnly = false` field and `setSpecialKeysOnly(active: boolean): void` to `CheatsheetState` in `src/ts/modal/state.ts`, mirroring `conflictsOnly`/`setConflictsOnly`.
- [x] 2.2 Pass `specialKeysOnly` into the `EntryFilterFlags` object everywhere `conflictsOnly`/`modifiedOnly` are currently passed (grid rendering call sites in `cheatsheet.ts`/`grid.ts`).

## 3. Toolbar UI

- [x] 3.1 Add a "Special keys only" checkbox to the filter dropdown in `toolbar.ts`, directly after "Modified only", following the same `hkc-filter-item` markup and `change` listener pattern (`state.setSpecialKeysOnly` → `updateFilterBtn()` → `callbacks.onChange()`).
- [x] 3.2 Extend `updateFilterBtn`'s `hasOtherActiveFilter` check and chip-rendering block to include `specialKeysOnly`, rendering a chip via a new i18n key when active.

## 4. i18n

- [x] 4.1 Add `modal.filter_special_keys_only` ("Special keys only") and `modal.filter_special_keys_chip` ("Special keys") to `en.json`, `fr.json`, and `es.json`.

## 5. Docs

- [x] 5.1 Remove the "Special character filter" bullet from the README Backlog section.
- [x] 5.2 Add a bullet documenting the new "Special keys only" checkbox under Features, near the existing "Conflict & modified-from-default filters" bullet.

## 6. Verification

- [x] 6.1 Run the full test suite (`npm test` or equivalent) and confirm all filter-related specs pass.
- [ ] 6.2 Manually verify in a running vault: checkbox narrows the grid to arrow/Enter/Backspace/Tab/etc.-bound commands, combines correctly with search and other filter checkboxes, and the filter button shows the new chip when active.
