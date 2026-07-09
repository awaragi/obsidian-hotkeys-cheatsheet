## 1. Conflict detection — data layer

- [x] 1.1 Add `resolveConflicts(groups: CategoryGroup[])` in a new module `src/ts/hotkeys/conflictDetector.ts`: build a canonical signature → command-id list map (reuse `buildSignature` from `usage/usageTracker.ts` rather than reinventing normalization), then return a lookup (e.g. `Set<string>` of entry ids) for every entry with ≥1 binding whose signature is shared by a different command.
- [x] 1.2 Wire `resolveConflicts` into `CheatsheetState.load()` (`state.ts`), storing the result (e.g. `state.conflictingIds`) recomputed fresh on every modal open, alongside the existing `usageResolution` computation.
- [x] 1.3 Unit tests for `resolveConflicts`: two commands sharing a combo are both flagged; a single command's own multiple bindings never self-conflict; no shared bindings means no conflicts; modifier-array declaration order doesn't affect detection.

## 2. Conflict detection — filter wiring

- [x] 2.1 Add `conflictsOnly: boolean` to `CheatsheetState`, with a setter mirroring `setModifierActive`.
- [x] 2.2 Extend `matchesFilters`/`matchesFlatItem` in `filterHotkeys.ts` to gate on `conflictsOnly` against `state.conflictingIds`, AND-combined with the existing modifier/search checks.
- [x] 2.3 Add a "Conflicts only" checkbox to the filter dropdown in `toolbar.ts`, wired with the same change-event → state setter → `callbacks.onChange()` pattern as the modifier checkboxes.
- [x] 2.4 Extend the filter button's active-state class (`hkc-filter-btn--active`) to also apply when `conflictsOnly` is checked, even with no modifier chips shown — resolves the open question in `design.md` without introducing a new chip type.
- [x] 2.5 Add a `modal.filter_conflicts_only` string to `en.json`, `fr.json`, and `es.json`.
- [x] 2.6 Manually verify in a dev vault: assign the same hotkey to two different commands via Obsidian's own hotkey settings, open the cheatsheet, check "Conflicts only", and confirm both commands appear and nothing else does.

## 3. Diff-from-default detection — data layer

- [x] 3.1 In `hotkeyCollector.ts`, compute `isModifiedFromDefault` per entry inside the existing merge loop in `buildHotkeyGroups`, comparing canonical signature sets of `defaultKeys[id]` against the entry's effective `hotkeys` (reusing `buildSignature`).
- [x] 3.2 Add `isModifiedFromDefault: boolean` to the `HotkeyEntry` type (`types.ts`).
- [x] 3.3 Unit tests: exact match is not modified; a superset (added binding) is modified; a disjoint set (remapped) is modified; a command with no `defaultKeys` entry at all is modified; confirm fully-cleared defaults (zero effective hotkeys) remain excluded exactly as before — this flag has no bearing on that existing exclusion rule.

## 4. Diff-from-default detection — filter wiring

- [x] 4.1 Add `modifiedOnly: boolean` to `CheatsheetState`, with a setter mirroring `conflictsOnly`.
- [x] 4.2 Extend `matchesFilters`/`matchesFlatItem` to gate on `modifiedOnly` against `entry.isModifiedFromDefault`, AND-combined with all other active filters.
- [x] 4.3 Add a "Modified only" checkbox to the filter dropdown in `toolbar.ts`, using the same wiring pattern as "Conflicts only".
- [x] 4.4 Extend the filter button's active-state class to also apply when `modifiedOnly` is checked.
- [x] 4.5 Add a `modal.filter_modified_only` string to `en.json`, `fr.json`, and `es.json`.
- [x] 4.6 Manually verify in a dev vault: change a default hotkey via Obsidian's settings, open the cheatsheet, check "Modified only", and confirm only that entry (and any other previously-customised ones) remain visible.

## 5. Cross-cutting verification

- [x] 5.1 Verify the two checkboxes combine with AND logic: in a vault with at least one conflicting entry and one modified-but-non-conflicting entry, checking both together shows only entries that satisfy both.
- [x] 5.2 Verify both checkboxes combine correctly with the existing modifier filter and search input, per the `cheatsheet-modal` spec scenarios.
- [x] 5.3 Run the full test suite and confirm no regressions in existing sort-mode/filter tests.
- [x] 5.4 Update `README.md`: remove "Duplicate/conflicting hotkey detection" and "Diff from Obsidian defaults" from the Backlog section now that they're implemented; add a short bullet to the Features list describing the two new filter checkboxes.
