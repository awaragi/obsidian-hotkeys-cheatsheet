## Context

The sort control (`src/ts/cheatsheetModal.ts`, `src/ts/sortHotkeys.ts`) currently offers three modes, all driven by category curation or usage counts:

- `category` — groups by category (`ResolvedCategoryGroup[]`), curated order, alphabetical within.
- `most-used-category` — same grouped shape, reordered by aggregate/entry usage.
- `most-used-shortcut` — flattens to a single ranked list (`FlatHotkeyItem[]`), no headings.

Two data shapes already exist and are consumed generically by the renderer:
- `renderCategorySection` accepts any `{ id, name, hotkeys, count }[]` grouped under a `category` label + `aggregate` — it doesn't care whether the label is a real category name.
- `renderFlatList` accepts any `FlatHotkeyItem[]` (`{ id, name, hotkeys, count, isOrphan }`).

Modifier canonicalization already exists in `usageTracker.ts`: `MODIFIER_ORDER = ["Mod", "Ctrl", "Meta", "Shift", "Alt"]` and `buildSignature(modifiers, key)`, used today to build stable usage-tracking signatures. `keyDisplay.ts` provides `modLabel()` (platform-aware modifier text) and `keyIcon()` (key → glyph for display only, never for ordering); it also owns `KEY_ICONS`, the map of special/non-printable keys (arrows, Enter, Escape, Tab, Backspace, Delete, Home/End, Page Up/Down) to their display glyphs.

Entries can carry multiple `HotkeyBinding`s (`hotkeys: HotkeyBinding[]`). The new modes need to place each *binding* independently (a command bound to both `Mod+K` and `Mod+Shift+K` belongs in two different key/modifier buckets), which the existing modes never had to do — they always kept an entry's bindings together as one row.

A "By Key (Grouped)" mode (one section per distinct key) was built and then dropped after a look at it in practice — grouping by individual key produces a long run of small, single- or double-entry sections, which reads as noisy rather than useful. "By Key" (flat) and "By Modifier" (grouped by combination) were kept; they answer the same underlying questions ("what's on this key," "what's under this modifier") without that noise.

## Goals / Non-Goals

**Goals:**
- Add two new sort modes — flat-by-key (`key`) and grouped-by-modifier (`modifier`) — that reuse the existing render functions unchanged.
- Establish one canonical way to duplicate multi-hotkey entries into per-binding rows, shared by both new modes.
- Keep ordering deterministic and based on raw data (key string, canonical modifier order), never on display glyphs — except for one explicit, reusable exception: special/non-printable keys sort ahead of ordinary character keys.

**Non-Goals:**
- No changes to usage tracking, data collection, or the `shortcut-usage-tracking` capability.
- No changes to export (`note-export`, `html-export`) — both stay category-shaped regardless of sort mode, as today.
- No persistence of the selected sort mode across modal opens — existing reset-to-`category`-on-open behavior is unchanged and extends to the new modes.
- No per-key grouping ("By Key (Grouped)") — considered, built, and dropped; see Context.

## Decisions

**1. Reuse existing data shapes instead of new rendering paths.**
`groupByModifier` produces `ResolvedCategoryGroup[]`-shaped data (group label = modifier-combo string, `aggregate` = summed count, `entries` = per-binding rows). `sortByKeyFlat` produces `FlatHotkeyItem[]`. `renderGrid()` branches only on "is this mode flat or grouped" (already does, for `most-used-shortcut`); no new render functions needed.
*Alternative considered*: a dedicated renderer per new mode. Rejected — the row shape (name + hotkeys + count) is identical; only the grouping/ordering differs, which belongs in `sortHotkeys.ts`, not the renderer.

**2. Shared duplication helper.**
An internal function `explodeEntryBindings(groups)` (in `sortHotkeys.ts`) walks every entry and emits one row per `HotkeyBinding`, carrying the entry's full `count` on each duplicate (same command, same usage count, appears once per binding). Row `id` becomes `${entry.id}::${bindingIndex}` to keep DOM keys distinct; this is an internal id only, never displayed. Both new modes call this once, then sort/group the exploded rows differently. This is the same "one command, appears multiple times" pattern `most-used-shortcut` already uses for orphans, generalized.
*Alternative considered*: keep bindings grouped (primary-binding-only ordering, extra bindings rendered but not driving placement). Rejected per explicit product decision — duplication was chosen because multi-hotkey entries are rare enough that the simpler, more literal "each binding lives where it belongs" model wins.

**3. Ordering key: raw key string, with special keys floated to the top — a shared, reusable comparator.**
Both modes sort/group using `compareKeys(a, b)`, a new export on `keyDisplay.ts` (colocated with `KEY_ICONS`, which already enumerates the special keys). It orders any two raw (already-uppercased) key strings so keys present in `KEY_ICONS` (arrows, Enter, Escape, Tab, Backspace, Delete, Home/End, Page Up/Down) sort before ordinary character keys, in `KEY_ICONS`' own key order; ordinary keys fall back to alphabetical (`localeCompare`). `keyIcon()` is still used only for display text, never for ordering.
Living in `keyDisplay.ts` and exported (rather than inlined in `sortHotkeys.ts`) is deliberate: it's the single place that already owns "what counts as a special key," and any other view that ever needs to order hotkeys by key can import the same comparator instead of re-deriving the rule.
*Alternative considered*: pure alphabetical ordering on the raw string (original design). Rejected after review — arrows/Enter/Escape etc. are conceptually a small, distinct set of "control" keys a user thinks of before scanning the alphabet; burying them mid-alphabet (e.g. "ARROWUP" sorting near "A") wasn't the intended reading.

**4. Modifier-combo grouping reuses `MODIFIER_ORDER`.**
The group key for `groupByModifier` is built the same way `buildSignature` orders modifiers — filter `MODIFIER_ORDER` by which tokens are present — but without the key suffix, and without the Mod/alias dedup step (that dedup is signature-specific to usage tracking; hotkey bindings already store `Mod` xor its platform alias, never both, so no dedup is needed here). Groups are ordered by `(modifier count ascending, then MODIFIER_ORDER position for ties)`, so the no-modifier bucket sorts first, then single-modifier buckets in `Mod, Ctrl, Meta, Shift, Alt` order, then combos. Within a group, entries are ordered by `compareKeys`. The heading label is built as `modLabel(token)` per token joined with `" + "` (e.g. `"Cmd + Shift"`), matching the plain-text heading style already used for categories (not `<kbd>` badges); the no-modifier bucket's heading uses a dedicated localized string ("No Modifier").
*Alternative considered*: order combo groups by usage-style descending frequency instead of a fixed structural order. Rejected — these modes are explicitly structural/non-usage-based; a fixed, learnable order matters more than raw frequency.

**5. `usageDependent` becomes an explicit allowlist.**
`cheatsheetModal.ts`'s dropdown-disable check changes from `mode !== "category"` to `mode === "most-used-category" || mode === "most-used-shortcut"`. The two new modes need no usage data and remain selectable regardless of `trackShortcutUsage`. Usage indicators themselves are unaffected — they're already gated solely by `showUsage = settings.trackShortcutUsage`, independent of sort mode, and continue to render on the new modes' rows exactly as they do today in `category` mode.

**6. Collapse state resets on sort-mode change.**
`collapsedSections` is a `Set<string>` keyed by group label. Category and most-used-category share the category-name label space today, so collapse state incidentally carries over between them — harmless since the labels mean the same thing. The modifier-combo label space means something entirely different (a collapsed category named "Editing" has no relationship to a modifier-group happening to be labeled "Alt"). Decision: clear `collapsedSections` whenever `sortMode` changes (in the existing sort-item click handler), not just on modal reopen. This avoids meaningless cross-label-space collisions and is a pure simplification — no existing spec requirement locks in the old cross-mode persistence.

**7. Flat-by-key mode disables collapse, like most-used-shortcut.**
Grouped-by-modifier extends the existing collapsible-section behavior (heading click toggles, collapse/expand-all toolbar button, search force-expand). Flat-by-key has no sections, same as `most-used-shortcut` — the collapse/expand-all toggle button is disabled while it's active.

**8. Dropdown order: structural modes directly after "By Category," ahead of usage-based modes.**
Final order: "By Category", "By Modifier", "By Key", "By Most-Used Category", "By Most-Used Shortcut". The two structural/non-usage modes are grouped next to the other non-usage mode (`category`); the two usage-based modes stay adjacent to each other at the end, preserving their existing relative order.

**9. Per-binding usage counts (`bindingCounts`), not just the entry aggregate.**
Building "By Key"/"By Modifier" required exploding entries into per-binding rows, which is what surfaced the bug: `usageResolver.ts`'s `resolveUsage()` only ever computed one summed `count` per entry, so the exploded modes were initially about to inherit that same aggregate on every duplicated row (a command bound to `Mod+K`, 11 presses, and `Mod+Shift+K`, 5 presses, would show "16" twice). The fix generalizes past the two new modes: `ResolvedHotkeyEntry` gains `bindingCounts: number[]`, parallel to `hotkeys`, computed alongside `count` in the same loop (no extra signature lookups). `explodeEntryBindings` now reads `entry.bindingCounts[index]` per row instead of `entry.count`. `FlatHotkeyItem` gains the same `bindingCounts` field, populated from `entry.bindingCounts` (for `most-used-shortcut`) or `[row.count]` (for the already-exploded `sortByKeyFlat`, trivially one binding per row).
The existing single-row-with-multiple-badges renderer (`renderHotkeyEntryRow`, shared by "By Category," "By Most-Used Category," and "By Most-Used Shortcut") had the same bug independent of the new modes — it rendered one usage indicator next to the command name, scaled from the summed `count`, while showing every binding's badge underneath. Fixed by moving the indicator from the name row into each `hkRow`, keyed by `bindingCounts[index]`. The entry-level `count` remains the ranking key for `most-used-category`/`most-used-shortcut` (unchanged) — only the per-badge *display* now uses `bindingCounts`.
*Alternative considered*: leave the old bug in the three existing modes and only get per-binding counts right in the two new ones (since that's technically all the proposal asked for). Rejected — leaving a known-wrong number on screen in the more heavily used existing modes, once identified, isn't a reasonable trade-off against the small size of the actual fix.

## Risks / Trade-offs

- **Duplicate rows read as "why does this command appear twice?"** → Mitigated by this only happening for genuinely multi-bound commands (confirmed rare); no visual distinction is added since each row shows its own single binding, which is self-explanatory in context.
- **Collapse-state reset on mode change is a small behavior change** (previously incidental persistence between `category` ⇄ `most-used-category`) → Acceptable: not documented as a requirement anywhere, and resetting is the more predictable behavior for the new modes.
- **Special-keys-first ordering is a judgment call, not a "natural" order** → Mitigated by keeping the rule in one named, tested comparator (`compareKeys`) rather than scattered inline logic, so it's easy to revisit or extend (e.g. adding function keys to the special set) in one place.

## Migration Plan

No data migration — this is additive UI/sort-logic only. No changes to settings schema, stored usage data, or export formats. Ships as a normal minor release; fully backward compatible with the three existing modes.

## Open Questions

None outstanding — the grouped-by-key mode question (keep or drop) that was open during initial design has been resolved (dropped, see Context).
