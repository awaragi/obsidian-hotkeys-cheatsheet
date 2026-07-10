## MODIFIED Requirements

### Requirement: Filter dropdown includes conflict, modified, and special-keys checkboxes
The modal's existing filter dropdown SHALL include three additional checkboxes — "Special keys only", "Conflicts only", and "Modified only" — below the four modifier checkboxes, separated from them by a horizontal divider; "Special keys only" SHALL be the first of the three, directly under that divider, with "Conflicts only" and "Modified only" following it. When "Special keys only" is checked, only entries with at least one hotkey binding whose key is a special key (arrows, Enter, Backspace, Delete, Tab, Home, End, PageUp, PageDown, Escape — the same set rendered as glyphs elsewhere in the modal) SHALL be shown. When "Conflicts only" is checked, only entries flagged as conflicting (per the `hotkey-conflict-detection` capability) SHALL be shown. When "Modified only" is checked, only entries flagged as differing from default (per the `hotkey-collector` capability) SHALL be shown. All three checkboxes SHALL combine with each other, with the modifier checkboxes, and with the search input using AND logic — an entry must satisfy every currently-active condition to remain visible.

#### Scenario: Conflicts only checkbox narrows the grid
- **WHEN** the user checks "Conflicts only"
- **THEN** only entries flagged as conflicting remain visible, across all sort modes

#### Scenario: Modified only checkbox narrows the grid
- **WHEN** the user checks "Modified only"
- **THEN** only entries flagged as differing from default remain visible, across all sort modes

#### Scenario: Special keys only checkbox narrows the grid
- **WHEN** the user checks "Special keys only"
- **THEN** only entries with at least one binding whose key is in the special-key set (arrows, Enter, Backspace, Delete, Tab, Home, End, PageUp, PageDown, Escape) remain visible, across all sort modes

#### Scenario: Conflicts and Modified combine with AND logic
- **WHEN** the user checks both "Conflicts only" and "Modified only"
- **THEN** only entries that are both conflicting AND differing from default remain visible

#### Scenario: Special keys only combines with the other new checkboxes using AND logic
- **WHEN** the user checks "Special keys only" together with "Conflicts only" and/or "Modified only"
- **THEN** only entries satisfying every checked condition simultaneously remain visible

#### Scenario: New checkboxes combine with modifier filter and search
- **WHEN** the user checks "Conflicts only", "Modified only", or "Special keys only" and also checks a modifier checkbox or types a search query
- **THEN** only entries satisfying all active conditions simultaneously remain visible

#### Scenario: Unchecking all three new checkboxes restores prior filtering
- **WHEN** "Conflicts only", "Modified only", and "Special keys only" are all unchecked
- **THEN** visibility is governed only by the modifier filter and search, as before this change
