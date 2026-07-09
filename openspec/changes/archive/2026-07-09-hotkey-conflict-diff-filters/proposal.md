## Why

Obsidian silently allows two different commands to be bound to the same key combination — only one wins at runtime — and its settings UI gives no way to see, at a glance, which of your hotkeys still match the shipped defaults versus which you've customised. Both are blind spots the cheatsheet is already positioned to close, since it computes the fully-merged effective keymap on every open.

## What Changes

- Detect hotkey bindings shared by more than one command ("conflicts") — computed globally across all entries once the cheatsheet's data loads.
- Detect entries whose effective binding differs from Obsidian's shipped default ("modified") — added or remapped bindings, computed by comparing each entry's effective hotkeys against `defaultKeys`. Fully-cleared defaults (entries the user removed, leaving zero live bindings) are out of scope — they're already excluded from the cheatsheet entirely, and that exclusion rule is unchanged.
- Extend the existing toolbar filter dropdown (currently modifier-only checkboxes: Mod/Shift/Alt/Ctrl) with two new checkboxes: **Conflicts only** and **Modified only**. Both combine with each other, with the modifier checkboxes, and with search using the dropdown's existing AND logic — checking multiple narrows the results further.
- No visual badges or indicators on hotkey rows in this iteration — purely a filtering mechanism using existing row rendering. No new settings tab entries.

## Capabilities

### New Capabilities
- `hotkey-conflict-detection`: pure logic that flags entries whose effective hotkey binding is also bound to at least one other command, for use as a filter predicate.

### Modified Capabilities
- `hotkey-collector`: entries gain a derived flag indicating whether the effective binding differs from the shipped default (added or remapped bindings), computed during the existing merge step.
- `cheatsheet-modal`: the modifier filter dropdown gains two additional checkboxes ("Conflicts only", "Modified only") that AND-combine with the existing modifier checkboxes and search.

## Impact

- `src/ts/hotkeys/hotkeyCollector.ts` — compute and attach the "modified from default" flag per entry during merge.
- New module under `src/ts/hotkeys/` for global conflict detection (analogous in shape to `usage/usageResolver.ts`).
- `src/ts/modal/state.ts` — compute conflict/modified data once on load; track the two new checkbox states alongside `activeModifiers`.
- `src/ts/hotkeys/filterHotkeys.ts` — extend `matchesFilters`/`matchesFlatItem` to also gate on the new flags.
- `src/ts/modal/toolbar.ts` — two new checkboxes in the existing filter dropdown.
- `src/ts/i18n/locales/{en,fr,es}.json` — labels for the two new checkboxes.
- `src/ts/types.ts` — new fields on `HotkeyEntry` (or equivalent) for the two flags.
- Unit tests for both detectors and the extended filter predicates.
