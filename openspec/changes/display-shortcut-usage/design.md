## Context

The cheatsheet modal ([cheatsheetModal.ts](../../../src/ts/cheatsheetModal.ts)) currently renders `CategoryGroup[]` from `collectHotkeys()` — a live join of `hotkeyManager.defaultKeys`/`customKeys` against `app.commands.commands`, recomputed fresh every time the modal opens. This change adds a second live join: entries against usage counts (a flat `Record<signature, count>`, per `track-shortcut-usage`'s storage design), and layers sort/display logic on top. No new persistence is introduced here — this change is read-only against both the hotkey configuration and the usage data file.

`track-shortcut-usage` (the capture/storage change this depends on) is designed but not yet implemented. This design assumes its data shape (`{ version: 1, counts: Record<string, number> }`) and its signature format (fixed modifier order `Mod, Ctrl, Meta, Shift, Alt` + uppercased key) as given contracts.

## Goals / Non-Goals

**Goals:**
- Render per-entry and per-category usage indicators without mutating or caching resolved data — always a fresh join at render time, exactly like `collectHotkeys()` already is.
- Zero visual change when `trackShortcutUsage` is off or no usage data file exists yet — the modal must be indistinguishable from today's behavior in that state.
- Keep the three sort modes' reordering logic pure and independent of DOM rendering, so it's unit-testable the same way `buildHotkeyGroups`/`matchesFilters` already are.

**Non-Goals:**
- Persisting the user's last-chosen sort mode across modal opens (matches existing precedent: collapse state also resets on every open).
- Any UI for resetting/managing usage data — that's already covered by `track-shortcut-usage`'s settings-tab reset action.
- Time-windowed or decaying usage stats — this change displays the flat running totals as stored, unchanged.
- Changing export output — export remains name/hotkey-only regardless of tracking state or active sort mode.

## Decisions

### Decision: Signature canonicalisation is a single shared function, not reimplemented here
Resolving an entry's `HotkeyBinding[]` to a lookup key against `counts` requires building the *exact* same canonical string the capture side writes. Reimplementing the modifier-order-plus-uppercase rule independently in this change would risk silent drift (e.g. a future change to the allowlist or ordering in one place and not the other). The canonicalisation function (`Mod,Ctrl,Meta,Shift,Alt` order, uppercased key) should be exported from wherever `track-shortcut-usage` defines it (`usageTracker.ts`) and imported here rather than duplicated. If this change lands before `track-shortcut-usage` is implemented, its tasks should include extracting/stubbing that shared function so both changes converge on one implementation.

**Alternative considered**: each change owns its own copy of the format string logic. Rejected — the two sides (write signature, read/resolve signature) must never disagree, and a shared function is the only way to guarantee that at compile time rather than by convention.

### Decision: Two independent, non-linear scale domains
Entry-level bars are scaled against the single highest entry count across the full (unfiltered) dataset; category-level bars are scaled against the highest category aggregate. These are computed once per render and never mixed — a category total plotted on the entry scale would almost always peg at `█`, defeating the purpose of the indicator. Both scales use `sqrt(count)` rather than linear count when mapping to the 8 glyph levels (`level = round(sqrt(count) / sqrt(max) * 8)`), so a single outlier (e.g. the command palette shortcut) doesn't compress every other entry down to level 0–1. The exact numeric count is always rendered as text alongside the glyph regardless of scale, so no precision is lost to the visual compression.

**Alternative considered**: linear scaling. Rejected — with real-world usage distributions (a handful of very hot shortcuts, a long tail of occasional ones), linear scaling makes the glyph nearly useless for anything but the top one or two entries.

### Decision: Scale is computed from the full dataset, not the currently filtered/visible set
Bar height must not change as the user types a search query or toggles the modifier filter — only which rows are visible should change. Recomputing `max` from the filtered subset would make bars appear to grow/shrink as a side effect of searching, which reads as a bug ("why did this bar change, I didn't press anything"). `max` (both entry-level and category-level) is computed once from the full resolved dataset before any search/filter is applied.

### Decision: Sort control reuses the existing button+dropdown toolbar pattern, not a native `<select>`
The toolbar already has two dropdown-driven controls (modifier filter, export) built on the same button/dropdown/outside-click-to-close pattern. The sort control follows the same pattern for visual and interaction consistency, rather than introducing a native `<select>` element that would look and behave differently from its toolbar neighbors.

The two usage-dependent items ("By Most-Used Category", "By Most-Used Shortcut") render in a disabled visual state (muted text, no click handler, no hover affordance) when `trackShortcutUsage` is `false`, rather than being hidden — this is a deliberate discoverability choice per explicit product direction: a disabled-but-visible option signals "this exists, enable tracking to unlock it" more effectively than an absent one.

### Decision: Sort mode is component-local state, reset to "By Category" on every modal open
Consistent with the existing collapse-state precedent (`cheatsheet-modal` spec: "All sections SHALL be expanded on every modal open — collapse state is not persisted between opens"). Adding persistence for sort mode would be a small addition, but nothing in this change's motivation calls for it, and keeping the modal's opening state fully predictable/consistent is simpler to reason about.

### Decision: Orphaned signatures are parsed back into badge form, not shown as raw text
A captured signature with no matching entry (e.g. `Mod+Shift+K` with 52 presses, no current binding) only ever appears in "By Most-Used Shortcut" mode. Rather than displaying the raw signature string as plain text, it's parsed back into `{modifiers: string[], key: string}` (splitting on `+`) and rendered through the exact same `modLabel`/`keyIcon` badge rendering as every other entry's hotkey row — so it looks like a hotkey, not a debug string. The name column shows a muted, localised placeholder (e.g. "No command") instead of a command name.

### Decision: Orphan pseudo-entries participate in the modifier filter but not text search
The modifier-filter checkboxes operate on `hotkeys[].modifiers`, which a parsed-back orphan signature has — so it composes naturally with the existing filter. Text search, however, matches against a command *name*, which orphans don't have; matching search text against the raw signature instead would be inconsistent with the existing rule that modifier tokens are never searchable text (`cheatsheet-modal` spec: "entries are NOT matched on modifier names"). Orphan entries are therefore excluded from results whenever the search query is non-empty, and shown only when the query is empty (subject to the modifier filter).

### Decision: Collapse/expand-all toggle is disabled in "By Most-Used Shortcut" mode
That mode has no category sections at all (flat list), so the toggle has nothing to act on — same treatment already applied to that button while a search is active.

## Risks / Trade-offs

- **[Risk]** This change's tasks depend on a shared canonicalisation function that doesn't exist yet, because `track-shortcut-usage` isn't implemented. **Mitigation**: this design specifies the exact contract (`Mod,Ctrl,Meta,Shift,Alt` order + uppercased key) so implementation can proceed against a stub/shared module regardless of which change lands first, and the two are reconciled to a single shared function before either is archived.
- **[Risk]** The eighths-block Unicode glyphs (`▁▂▃▄▅▆▇█`, U+2581–U+2588) depend on font coverage. **Mitigation**: these are broadly supported block-element characters (used across common terminal/sparkline tooling); the numeric count is always rendered as adjacent text, so even a tofu/missing-glyph fallback still conveys the information.
- **[Trade-off]** `sqrt` scaling makes bar height a relative, non-linear signal — two entries at level `▄` are not necessarily "about the same," only "in the same rough band." Accepted since the exact count is always shown as text for anyone who needs precision; the glyph is explicitly a glanceable approximation, not a precise chart.
- **[Trade-off]** Excluding orphan entries from text search (Decision above) means there's no way to search *for* an orphaned signature by typing part of it. Accepted as a minor gap — orphans are already a rare edge case (rebound/removed hotkeys), and the flat sort mode already surfaces all of them without search.

## Open Questions

None blocking. The shared-canonicalisation-function landing order (this change vs. `track-shortcut-usage`) is a sequencing detail to resolve at implementation time, not a design ambiguity.
