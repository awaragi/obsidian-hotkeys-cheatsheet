## MODIFIED Requirements

### Requirement: Modifier filter dropdown narrows entries by modifier
The modal toolbar SHALL include a modifier filter dropdown containing a checkbox for each of the four main modifier tokens: `Mod`, `Shift`, `Alt`, `Ctrl`. When one or more modifiers are checked, only hotkeys whose modifier set includes **all** checked modifiers SHALL be shown (AND logic). When no modifiers are checked, the filter is inactive and all hotkeys are shown. The modifier filter and search compose — both apply simultaneously.

The filter button SHALL visually reflect the active selection state: when ≥1 modifier is checked, the button replaces its label with flat `<kbd>` chips (one per active modifier, in canonical order) and a `▾` chevron; when nothing is checked, the button shows the static localised label. See `modifier-filter-chip-display` spec for chip display requirements.

#### Scenario: No modifiers checked shows all entries
- **WHEN** no modifier checkboxes are checked
- **THEN** all hotkey entries are visible (subject to search)

#### Scenario: Single modifier filters to matching hotkeys
- **WHEN** the user checks "Mod"
- **THEN** only entries that have at least one hotkey containing the `Mod` modifier remain visible

#### Scenario: Multiple modifiers filter with AND logic
- **WHEN** the user checks both "Mod" and "Shift"
- **THEN** only entries that have at least one hotkey containing BOTH `Mod` AND `Shift` remain visible

#### Scenario: Modifier filter and search compose
- **WHEN** the user checks "Mod" and types "b" in the search input
- **THEN** only entries matching the key "B" AND having a `Mod` modifier remain visible
