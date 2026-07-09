## ADDED Requirements

### Requirement: Filter dropdown includes conflict and modified checkboxes
The modal's existing filter dropdown SHALL include two additional checkboxes, "Conflicts only" and "Modified only", alongside the four modifier checkboxes. When "Conflicts only" is checked, only entries flagged as conflicting (per the `hotkey-conflict-detection` capability) SHALL be shown. When "Modified only" is checked, only entries flagged as differing from default (per the `hotkey-collector` capability) SHALL be shown. Both checkboxes SHALL combine with each other, with the modifier checkboxes, and with the search input using AND logic — an entry must satisfy every currently-active condition to remain visible.

#### Scenario: Conflicts only checkbox narrows the grid
- **WHEN** the user checks "Conflicts only"
- **THEN** only entries flagged as conflicting remain visible, across all sort modes

#### Scenario: Modified only checkbox narrows the grid
- **WHEN** the user checks "Modified only"
- **THEN** only entries flagged as differing from default remain visible, across all sort modes

#### Scenario: Conflicts and Modified combine with AND logic
- **WHEN** the user checks both "Conflicts only" and "Modified only"
- **THEN** only entries that are both conflicting AND differing from default remain visible

#### Scenario: New checkboxes combine with modifier filter and search
- **WHEN** the user checks "Conflicts only" and also checks a modifier checkbox or types a search query
- **THEN** only entries satisfying all active conditions simultaneously remain visible

#### Scenario: Unchecking both new checkboxes restores prior filtering
- **WHEN** "Conflicts only" and "Modified only" are both unchecked
- **THEN** visibility is governed only by the modifier filter and search, as before this change
