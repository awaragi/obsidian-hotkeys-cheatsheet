## ADDED Requirements

### Requirement: Category sections are individually collapsible
Each category section SHALL be collapsible by clicking its heading. The heading SHALL display a `▾` indicator when expanded and `▸` when collapsed. All sections SHALL be expanded on every modal open — collapse state is not persisted between opens. While a search query is active, heading click SHALL have no effect (sections are force-expanded by search).

#### Scenario: Section collapses on heading click
- **WHEN** the user clicks an expanded section heading
- **THEN** the section's entries are hidden and the heading shows `▸`

#### Scenario: Section expands on heading click
- **WHEN** the user clicks a collapsed section heading
- **THEN** the section's entries become visible and the heading shows `▾`

#### Scenario: All sections expanded on modal open
- **WHEN** the modal is opened
- **THEN** all sections are expanded regardless of previous collapse state

#### Scenario: Heading click disabled during search
- **WHEN** a search query is active and the user clicks a section heading
- **THEN** the section state does not change

---

### Requirement: Toolbar provides Expand All and Collapse All controls
The modal toolbar SHALL include an "Expand All" button and a "Collapse All" button. Both buttons SHALL be disabled while a search query is active.

#### Scenario: Collapse All hides all section entries
- **WHEN** the user clicks "Collapse All"
- **THEN** all section entries are hidden and all headings show `▸`

#### Scenario: Expand All shows all section entries
- **WHEN** the user clicks "Expand All"
- **THEN** all section entries are visible and all headings show `▾`

#### Scenario: Expand All and Collapse All disabled during search
- **WHEN** a search query is active
- **THEN** the Expand All and Collapse All buttons are disabled and non-interactive

---

### Requirement: Search force-expands sections and restores collapse state on clear
When the user begins typing a search query, the modal SHALL snapshot the current collapse state and force-expand all sections so no matching entries are hidden. When the search query is cleared, the collapse state SHALL be restored to the pre-search snapshot.

#### Scenario: Search expands collapsed sections
- **WHEN** one or more sections are collapsed and the user types a search query
- **THEN** all sections become expanded

#### Scenario: Clearing search restores collapse state
- **WHEN** the user clears the search input after typing
- **THEN** sections return to the collapse state that existed before the search began

#### Scenario: Escape clears search and restores collapse state
- **WHEN** the search input has text and the user presses Escape
- **THEN** the search is cleared and the pre-search collapse state is restored
