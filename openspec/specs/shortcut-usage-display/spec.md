## Purpose

Displays per-entry and per-category shortcut usage indicators (glyph + raw count) in the cheatsheet modal, sourced from the `shortcut-usage-tracking` capability's stored press counts, and surfaces orphaned signatures in the "By Most-Used Shortcut" sort mode. Usage data is always excluded from exports.

## Requirements

### Requirement: Per-entry usage indicator shows a scaled glyph and raw count
Each individually bound hotkey (badge row) SHALL display a usage indicator consisting of one Unicode "eighths block" character (`▁▂▃▄▅▆▇█`) plus that specific binding's raw press count as text, whenever `trackShortcutUsage` is `true`. The glyph level SHALL be computed from the binding's count relative to the highest single-entry count across the full dataset. A bound hotkey with zero recorded presses SHALL still render the indicator, showing the lowest glyph level and `0`, in its normal alphabetical/category position — there is no separate "unused" grouping. A command bound to more than one hotkey SHALL show each badge's own count independently — never one shared aggregate repeated on every badge.

#### Scenario: Entry with presses shows a proportional indicator
- **WHEN** `trackShortcutUsage` is `true` and a bound hotkey has a recorded count greater than zero
- **THEN** that hotkey's badge displays a glyph scaled relative to the highest entry count, plus the exact count as text

#### Scenario: Never-pressed bound entry still shows an indicator
- **WHEN** `trackShortcutUsage` is `true` and a bound hotkey has no recorded presses
- **THEN** that hotkey's badge displays the lowest glyph level and the count `0`, in its normal position

#### Scenario: Indicator is absent when tracking is off
- **WHEN** `trackShortcutUsage` is `false`
- **THEN** no hotkey badge displays a usage glyph or count, and the grid renders exactly as it did before this change

#### Scenario: Multi-bound command shows each binding's own count, not a shared aggregate
- **WHEN** `trackShortcutUsage` is `true` and a command is bound to two hotkeys with different press counts (e.g. `Mod+K` pressed 11 times, `Mod+Shift+K` pressed 5 times)
- **THEN** the `Mod+K` badge shows `11` and the `Mod+Shift+K` badge shows `5` — neither badge shows the summed total (`16`)

---

### Requirement: Per-category usage aggregate uses an independent scale from entry-level indicators
Each category heading SHALL display the same glyph+count treatment as an aggregate: the sum of its entries' usage counts. This aggregate SHALL be scaled against the highest category aggregate across all categories, independently of the entry-level scale.

#### Scenario: Category aggregate reflects summed usage
- **WHEN** `trackShortcutUsage` is `true`
- **THEN** each category heading shows a glyph+count representing the sum of its entries' counts

#### Scenario: Category scale is independent of entry scale
- **WHEN** a category's aggregate total is many times larger than any single entry's count
- **THEN** the category glyph is scaled against the highest category aggregate, not the highest single-entry count, so it does not always render at the maximum glyph level

---

### Requirement: Usage indicator scale is computed from the full dataset, unaffected by active search or filter
The maximum values used to scale entry-level and category-level glyphs SHALL be computed once from the complete, unfiltered set of resolved entries. Applying a search query or modifier filter SHALL change which entries are visible but SHALL NOT change the scale used to compute glyph levels for entries that remain visible.

#### Scenario: Bar height is stable while searching
- **WHEN** the user types a search query that narrows the visible entries
- **THEN** the glyph level of each still-visible entry remains the same as before the search began

---

### Requirement: Signature-to-command resolution is always performed live, never cached
Usage counts SHALL be joined against entries by resolving each entry's current hotkey bindings to the canonical signature format and looking up that signature in the stored counts, recomputed fresh every time the modal renders. No resolved mapping between a signature and a command SHALL be cached or persisted.

#### Scenario: Rebound hotkey immediately reflects its new command
- **WHEN** a signature was previously associated with one command and the user has since rebound that key combination to a different command
- **THEN** the modal attributes that signature's usage count to the currently bound command, not the previous one

---

### Requirement: Orphaned signatures are surfaced only in By Most-Used Shortcut mode
A signature present in the usage counts data with no entry currently bound to it SHALL appear only when the "By Most-Used Shortcut" sort mode is active. It SHALL render as a pseudo-entry: its modifiers and key parsed back into the same badge display used for bound entries, with a muted, localised "No command" placeholder in place of a command name.

#### Scenario: Orphaned signature appears in flat mode
- **WHEN** "By Most-Used Shortcut" is active and a captured signature has no matching bound entry
- **THEN** a pseudo-entry appears showing "No command" as its label, its parsed modifier and key badges, and its usage count

#### Scenario: Orphaned signatures do not appear in category-based modes
- **WHEN** "By Category" or "By Most-Used Category" is active
- **THEN** no orphaned-signature pseudo-entries are rendered, since they have no category to belong to

#### Scenario: Orphaned pseudo-entries respect the modifier filter but not text search
- **WHEN** a text search query is active
- **THEN** orphaned pseudo-entries are excluded from the results regardless of their modifiers or key
- **WHEN** only the modifier filter is active (no text query) and an orphaned pseudo-entry's modifiers match the filter
- **THEN** the orphaned pseudo-entry remains visible

---

### Requirement: Export never includes usage data
Exporting via "Save as Note" or "Save as HTML" SHALL produce output containing only command names and hotkey bindings, exactly as it did before this change, regardless of whether `trackShortcutUsage` is enabled or which sort mode is currently active in the modal.

#### Scenario: Export excludes usage indicators even when tracking is enabled
- **WHEN** `trackShortcutUsage` is `true` and the user exports via "Save as Note" or "Save as HTML"
- **THEN** the resulting output contains command names and hotkeys only, with no usage glyphs, counts, or category aggregates

#### Scenario: Export ignores the active sort mode
- **WHEN** "By Most-Used Category" or "By Most-Used Shortcut" is the active sort mode and the user exports
- **THEN** the exported content uses the standard category/alphabetical structure, not the active sort mode's ordering
