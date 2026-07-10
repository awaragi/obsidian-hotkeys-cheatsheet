## Context

The filter dropdown already has a well-established pattern for boolean, AND-combined checkboxes beyond the four modifier chips: "Conflicts only" and "Modified only" ([`cheatsheet-modal` spec](../../specs/cheatsheet-modal/spec.md), requirement "Filter dropdown includes conflict and modified checkboxes"). Both are backed by a plain boolean on `CheatsheetState`, checked in `matchesFilters`/`matchesFlatItem` via `EntryFilterFlags`, and rendered on the filter button as a chip when active.

The "special key" concept is already defined exactly once, as the key set of `KEY_ICONS` in `src/ts/hotkeys/keyDisplay.ts` (arrows, Enter, Backspace, Delete, Tab, Home, End, PageUp, PageDown, Escape). This is the same table that decides which keys render as glyphs and which keys sort first in "By Key" mode — so it's already the canonical definition of "special key" for this plugin.

Two UI shapes were discussed (see conversation): a per-key submenu (choose specifically Tab vs. Enter vs. arrows) vs. a single coarse toggle. The per-key submenu was deferred — it needs new combination semantics (OR across selected keys, vs. the AND used for modifiers) and a nested-dropdown UI pattern the toolbar doesn't have yet (every existing dropdown is a single flat list, closed on outside-click). The single toggle was chosen for this change as sufficient for the common case ("does anything special-key-related exist here") and it fits the existing checkbox pattern with no new interaction model.

## Goals / Non-Goals

**Goals:**
- Let a user narrow the grid to only entries with at least one special-key binding, with one click.
- Reuse the existing conflicts/modified checkbox pattern exactly (same AND-combination, same chip-on-filter-button behavior) so this doesn't introduce a second filtering idiom.
- Reuse `KEY_ICONS` as the single source of truth for "what counts as a special key" — no second list to keep in sync.

**Non-Goals:**
- Per-key selection (Tab vs. Enter vs. individual arrows) — deferred; would need OR-combination semantics and a nested-menu UI pattern not yet in the toolbar.
- Any change to the existing free-text search exact-key-match behavior — stays as-is, undocumented.
- Persisting the checkbox state across modal opens — matches how the other two checkboxes already behave (reset each `load()`).

## Decisions

- **Special-key predicate**: add `isSpecialKey(key: string): boolean` to `keyDisplay.ts`, implemented as `key in KEY_ICONS`. `filterHotkeys.ts` imports this rather than re-deriving the list, so the special-key definition can never drift from the glyph/sort table.
- **State shape**: add `specialKeysOnly: boolean` + `setSpecialKeysOnly()` to `CheatsheetState`, mirroring `conflictsOnly`/`modifiedOnly` field-for-field (same default `false`, same reset-on-`load()` behavior — it's not in `load()`'s reset list today for conflicts/modified either, since they're re-declared as class fields with defaults; same treatment applies here).
- **Filter predicate**: in `matchesFilters`/`matchesFlatItem`, when `specialKeysOnly` is true, require `entry.hotkeys.some(hk => isSpecialKey(hk.key))` (or `item.hotkeys` for the flat-list variant). AND-combined with everything else already in those functions — no new combination logic needed since it's a single boolean, not a set.
- **Toolbar placement**: new checkbox placed directly under the modifier checkboxes, right after the existing divider and before "Conflicts only"/"Modified only" — same `hkc-filter-item` markup, same `change` listener shape (`state.setSpecialKeysOnly(checkbox.checked)` → `updateFilterBtn()` → `callbacks.onChange()`).
- **Filter button chip**: extend `updateFilterBtn`'s `hasOtherActiveFilter` check and chip-rendering block to include `specialKeysOnly`, using a new i18n chip key, same as the existing `modal.filter_conflicts_chip` / `modal.filter_modified_chip` pattern.

## Risks / Trade-offs

- **Coarse granularity** — a user who wants "just Tab" still has to scan the filtered special-keys list by eye. → Accepted per explicit user decision; a follow-up per-key submenu change remains open as future work if this proves insufficient in practice.
- **Orphan entries in "By Most-Used Shortcut" mode** — orphan pseudo-entries (no bound command) still carry a real `key`, so `isSpecialKey` applies to them unchanged; no special-casing needed beyond what `matchesFlatItem` already does for its other flags.

## Migration Plan

None — purely additive UI/state, no persisted settings, no data migration. Existing saved usage-tracking data and settings are untouched.
