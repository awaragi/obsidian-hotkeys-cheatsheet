## Why

Today's three sort modes ("By Category", "By Most-Used Category", "By Most-Used Shortcut") are all driven by curated category order or usage counts. Users who want to learn or audit shortcuts by the physical key combination itself — "what's bound to B?", "what's under Cmd+Shift?" — have no way to view the cheatsheet that way. Adding key- and modifier-based sort modes lets users navigate hotkeys by the input itself rather than by what it does or how often it's used.

## What Changes

- Add two new sort modes to the existing sort control: "By Modifier" (grouped by modifier combination) and "By Key" (flat list ordered by key).
- Entries bound to multiple hotkeys are duplicated — one row per binding — in both new modes, matching the existing duplication pattern used for orphaned signatures in "By Most-Used Shortcut".
- Ordering is based on the raw key string, never the display glyph (`↑`), except that special/non-printable keys (arrows, Enter, Escape, Tab, Backspace, Delete, Home/End, Page Up/Down) float to the top ahead of ordinary character keys — this ordering rule is a shared, reusable comparator, not mode-specific logic. Modifier-combo ordering reuses the canonical `MODIFIER_ORDER` (`Mod, Ctrl, Meta, Shift, Alt`) already established in `usageTracker.ts`.
- The dropdown's "disabled when usage tracking is off" logic changes from "every mode except By Category" to explicitly naming the two usage-based modes ("By Most-Used Category", "By Most-Used Shortcut"). The two new modes are structural (not usage-based) and remain selectable regardless of the `trackShortcutUsage` setting.
- Dropdown order changes to: "By Category", "By Modifier", "By Key", "By Most-Used Category", "By Most-Used Shortcut" — the new structural modes sit right after "By Category", ahead of the usage-based modes.
- Collapse/expand-all toolbar behavior extends to "By Modifier" (collapsible sections, like category grouping); "By Key" is flat and disables the toggle, like "By Most-Used Shortcut".
- Export continues to always reflect the raw category/alphabetical structure, unaffected by any sort mode — no change to existing export behavior.

A "By Key (Grouped)" mode (one section per key) was considered and implemented, then dropped after review — grouping by individual key produced too many small, visually noisy sections to be pleasant to scan. "By Key" (flat) and "By Modifier" (grouped by combination) cover the same underlying need without that noise.

Building "By Key"/"By Modifier" surfaced a latent bug in usage display: a command bound to more than one hotkey had its per-binding usage counts summed into one aggregate, then that same aggregate was shown next to every one of its hotkey badges — so `Mod+K` (pressed 11 times) and `Mod+Shift+K` (pressed 5 times) both displayed "16". This is fixed as part of this change: each hotkey badge now shows its own binding's count, in every sort mode that renders multiple badges per entry ("By Category", "By Most-Used Category", "By Most-Used Shortcut"), not only the new key/modifier modes (which already showed correct per-binding counts by construction, since they duplicate each binding into its own row).

## Bug Fix: Per-binding usage counts

- `resolveUsage()` now computes and retains a `bindingCounts: number[]` array (parallel to `hotkeys`) alongside the existing summed `count`, so both the aggregate (used for ranking/sorting) and each binding's own count (used for display) are available.
- The shared entry-row renderer now attaches a usage indicator to each hotkey badge individually, using that badge's own count, instead of one indicator shown once next to the command name.
- The category-heading aggregate (sum across all of a category's entries) and the sort-by-usage ranking (which entry/category counts as "most used") are unchanged — only the per-badge *display* changed, not any ranking logic.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `cheatsheet-modal`: sort control gains two new modes (By Modifier, By Key); dropdown order changes; the usage-dependent-disable requirement changes from "all non-category modes" to explicitly naming the two usage-based modes; collapse/expand-all and search-filtering requirements extend to cover the new modes; key-based ordering follows a special-keys-first rule.
- `shortcut-usage-display`: the per-entry usage indicator requirement changes from "one indicator per entry, showing the entry's summed count" to "one indicator per hotkey badge, showing that binding's own count" — a bug fix uncovered while building the new modes, not scoped to them.

## Impact

- `src/ts/sortHotkeys.ts`: new sort/group functions for key-ordered and modifier-combo ordering, plus a shared helper for duplicating multi-hotkey entries into per-binding rows.
- `src/ts/keyDisplay.ts`: new `compareKeys` comparator (special keys before ordinary character keys), reusable anywhere hotkeys are ordered by key.
- `src/ts/types.ts`: `SortMode` union gains two new values (`"modifier"`, `"key"`).
- `src/ts/cheatsheetModal.ts`: sort dropdown gains two new items in the new order; `usageDependent` disable check updated; flat-mode and grouped-mode rendering/collapse logic extended to cover the new modes.
- `src/ts/i18n/en.json`, `fr.json`, `es.json`: new label strings for the two new dropdown entries and the modifier "No Modifier" group heading.
- `src/ts/usageResolver.ts`: `ResolvedHotkeyEntry` gains `bindingCounts: number[]`.
- No changes to usage tracking, export, or data collection.
