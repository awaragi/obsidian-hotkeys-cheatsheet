## MODIFIED Requirements

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
