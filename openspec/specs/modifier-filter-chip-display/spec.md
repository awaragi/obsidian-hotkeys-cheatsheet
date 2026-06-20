## Purpose

Visual behaviour of the modifier filter button in the cheatsheet modal toolbar: chip-based display when modifiers are active, static label when none are selected.

## Requirements

### Requirement: Filter button reflects active modifier selection via chips
When one or more modifier filters are active, the filter button SHALL replace its label text with a flat `<kbd>` chip for each active modifier (in canonical order: Mod, Shift, Alt, Ctrl) followed by a `▾` chevron span. When no modifiers are active, the button SHALL display the static localised label (e.g. "Modifiers") with no chevron. The button SHALL carry a CSS class (`hkc-filter-btn--active`) when any modifier is checked, and remove it when all are unchecked.

#### Scenario: Button shows chips when modifiers are selected
- **WHEN** the user checks one or more modifier checkboxes in the dropdown
- **THEN** the filter button displays a flat `<kbd>` chip per active modifier (using `filterLabel()` text) followed by a `▾` span, and the button has class `hkc-filter-btn--active`

#### Scenario: Button restores label text when all modifiers are cleared
- **WHEN** the user unchecks all modifier checkboxes
- **THEN** the filter button displays the static localised "Modifiers" label text and does not have class `hkc-filter-btn--active`

#### Scenario: Chips appear in canonical modifier order
- **WHEN** the user selects Shift before Mod
- **THEN** the chips render as Mod chip followed by Shift chip (canonical order: Mod, Shift, Alt, Ctrl)

#### Scenario: Clicking active-state button opens the dropdown
- **WHEN** the filter button is in chip-display (active) state and the user clicks it
- **THEN** the modifier filter dropdown opens, same as in the default state

### Requirement: Filter button has stable minimum width
The filter button SHALL have a CSS `min-width` so it holds its position in the toolbar when transitioning between label text and chip display. The button SHALL grow beyond `min-width` when chip content requires it; the search input (at `flex: 1`) absorbs the change.

#### Scenario: Button width is bounded from below
- **WHEN** the filter button is in its default (no selection) state
- **THEN** the button occupies at least its defined `min-width`

#### Scenario: Search input yields space to growing filter button
- **WHEN** the user selects multiple modifiers causing the filter button to grow
- **THEN** the search input shrinks to accommodate, and no toolbar overflow occurs
