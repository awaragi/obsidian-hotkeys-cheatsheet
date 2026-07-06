## ADDED Requirements

### Requirement: Toolbar includes a sort control
The modal toolbar SHALL include a sort control offering three modes: "By Category", "By Most-Used Category", and "By Most-Used Shortcut". The control SHALL follow the same button+dropdown, outside-click-to-dismiss pattern as the existing modifier filter and export controls. The sort mode SHALL reset to "By Category" every time the modal opens, regardless of what was last selected.

#### Scenario: Sort button opens a dropdown with three modes
- **WHEN** the user clicks the sort control
- **THEN** a dropdown appears listing "By Category", "By Most-Used Category", and "By Most-Used Shortcut"

#### Scenario: Selecting a mode reorders the grid immediately
- **WHEN** the user selects a different sort mode from the dropdown
- **THEN** the grid re-renders in the newly selected order without requiring the modal to be reopened

#### Scenario: Sort mode resets on modal reopen
- **WHEN** the user selected "By Most-Used Shortcut", closes the modal, and reopens it
- **THEN** the modal opens with "By Category" active, not the previously selected mode

---

### Requirement: Usage-dependent sort modes are disabled when tracking is off
"By Most-Used Category" and "By Most-Used Shortcut" SHALL render in a disabled, non-interactive state (visible but not selectable) whenever `trackShortcutUsage` is `false`. Only "By Category" SHALL be selectable in that state, and the grid SHALL render identically to how it rendered before this change.

#### Scenario: Usage-based modes are visible but disabled when tracking is off
- **WHEN** `trackShortcutUsage` is `false` and the user opens the sort dropdown
- **THEN** "By Most-Used Category" and "By Most-Used Shortcut" are shown in a muted, non-clickable state

#### Scenario: Only By Category is selectable when tracking is off
- **WHEN** `trackShortcutUsage` is `false`
- **THEN** the grid always renders using "By Category" ordering, with no usage indicators present

#### Scenario: Usage-based modes become selectable when tracking is enabled
- **WHEN** `trackShortcutUsage` is `true`
- **THEN** all three sort modes are selectable in the dropdown

---

### Requirement: By Most-Used Category mode reorders categories and entries by usage
When "By Most-Used Category" is active, categories SHALL be ordered by their aggregate usage total, descending. Within each category, entries SHALL be ordered by their individual usage count, descending, instead of alphabetically.

#### Scenario: Categories ranked by aggregate usage
- **WHEN** "By Most-Used Category" is active
- **THEN** the category with the highest summed usage count across its entries appears first, down to the lowest

#### Scenario: Entries within a category ranked by usage
- **WHEN** "By Most-Used Category" is active
- **THEN** entries inside each category section are ordered by descending usage count rather than alphabetically

---

### Requirement: By Most-Used Shortcut mode flattens the grid into a single ranked list
When "By Most-Used Shortcut" is active, the grid SHALL render as a single flat list of entries across all categories, with no category headings, ordered by usage count descending. This is the only mode in which entries with no bound command (orphaned signatures) are included, per the `shortcut-usage-display` capability.

#### Scenario: Flat list replaces category sections
- **WHEN** "By Most-Used Shortcut" is active
- **THEN** no category headings are rendered, and all entries appear in one continuous list ordered by usage count descending

#### Scenario: Collapse/expand-all toggle is disabled in flat mode
- **WHEN** "By Most-Used Shortcut" is active
- **THEN** the collapse/expand-all toolbar button is disabled, since there are no sections to collapse

---

### Requirement: Search and modifier filter apply across all sort modes
The existing search input and modifier filter dropdown SHALL continue to filter visible entries regardless of which sort mode is active, including "By Most-Used Shortcut"'s flat list.

#### Scenario: Search filters the flat most-used-shortcut list
- **WHEN** "By Most-Used Shortcut" is active and the user types a search query
- **THEN** only entries matching the query (by the same name/key rules as other modes) remain visible, still ordered by usage count descending
