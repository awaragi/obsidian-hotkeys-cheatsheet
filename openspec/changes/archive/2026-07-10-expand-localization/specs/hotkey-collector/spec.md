## MODIFIED Requirements

### Requirement: Return categorised entries in defined display order
The collector SHALL return categories in the following order: Editing, Navigation, Search, Files & Vault, Workspace, then plugin groups sorted alphabetically using locale-aware comparison against the active locale. Within each category, entries SHALL be sorted alphabetically by display name using the same locale-aware comparison.

#### Scenario: Core categories appear before plugin groups
- **WHEN** the vault has both core and plugin-assigned hotkeys
- **THEN** Editing appears before any plugin group in the output

#### Scenario: Plugin groups are alphabetically sorted
- **WHEN** multiple plugin groups exist (e.g. "Dataview", "Calendar", "Templater")
- **THEN** they appear in the order: Calendar, Dataview, Templater

#### Scenario: Plugin group and display-name sorting uses the active locale
- **WHEN** the active locale is `ja` and plugin groups or display names contain Japanese text
- **THEN** sorting uses `ja` collation rules rather than the runtime's default locale
