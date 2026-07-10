## Why

The cheatsheet lists 250+ commands, and there's currently no quick way to see which shortcuts are bound to non-alphanumeric "special" keys (arrows, Enter, Backspace, Delete, Tab, Home/End, PageUp/Down, Escape). The only existing path — typing the literal key name into search for an exact match (e.g. `enter`) — is undocumented and undiscoverable; nobody guesses that typing an English word does an exact match against Obsidian's raw key string. This is the backlog item "Special character filter."

## What Changes

- Add a new "Special keys only" checkbox to the existing filter dropdown, alongside the current "Conflicts only" / "Modified only" checkboxes.
- When checked, only entries with at least one binding whose key is in the known special-key set (the existing `KEY_ICONS` table: arrows, Enter, Backspace, Delete, Tab, Home, End, PageUp, PageDown, Escape) are shown.
- Combines with search, modifier checkboxes, and the other two checkboxes using the same AND logic already used by conflicts/modified.
- No change to the existing free-text search behavior (typing a special key's raw name for an exact match) — that stays as-is, undocumented.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `cheatsheet-modal`: filter dropdown gains a third checkbox ("Special keys only") with the same AND-combination rule as the existing conflicts/modified checkboxes.

## Impact

- `src/ts/modal/state.ts` — new `specialKeysOnly` boolean + setter, mirroring `conflictsOnly`/`modifiedOnly`.
- `src/ts/hotkeys/filterHotkeys.ts` — `EntryFilterFlags` gains `specialKeysOnly`; `matchesFilters`/`matchesFlatItem` check it against the entry's bindings using the existing `KEY_ICONS` key set.
- `src/ts/modal/toolbar.ts` — new checkbox in the filter dropdown; filter button chip logic extended to show it when active.
- `src/ts/i18n/locales/{en,fr,es}.json` — new label/chip strings.
- `README.md` — remove the "Special character filter" backlog bullet, document the new checkbox under Features.
