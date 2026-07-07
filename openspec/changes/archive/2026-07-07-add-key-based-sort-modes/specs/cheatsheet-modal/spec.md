## MODIFIED Requirements

### Requirement: Toolbar includes a sort control
The modal toolbar SHALL include a sort control offering five modes, in this order: "By Category", "By Modifier", "By Key", "By Most-Used Category", and "By Most-Used Shortcut". The control SHALL follow the same button+dropdown, outside-click-to-dismiss pattern as the existing modifier filter and export controls. The sort mode SHALL reset to "By Category" every time the modal opens, regardless of what was last selected.

#### Scenario: Sort button opens a dropdown with five modes in order
- **WHEN** the user clicks the sort control
- **THEN** a dropdown appears listing "By Category", "By Modifier", "By Key", "By Most-Used Category", and "By Most-Used Shortcut", in that order

#### Scenario: Selecting a mode reorders the grid immediately
- **WHEN** the user selects a different sort mode from the dropdown
- **THEN** the grid re-renders in the newly selected order without requiring the modal to be reopened

#### Scenario: Sort mode resets on modal reopen
- **WHEN** the user selected "By Most-Used Shortcut", closes the modal, and reopens it
- **THEN** the modal opens with "By Category" active, not the previously selected mode

---

### Requirement: Usage-dependent sort modes are disabled when tracking is off
"By Most-Used Category" and "By Most-Used Shortcut" SHALL render in a disabled, non-interactive state (visible but not selectable) whenever `trackShortcutUsage` is `false`. "By Category", "By Modifier", and "By Key" SHALL remain selectable regardless of `trackShortcutUsage`, since they do not depend on usage data. When `trackShortcutUsage` is `false`, the grid SHALL render identically to how it rendered before this change whenever "By Category" is active.

#### Scenario: Usage-based modes are visible but disabled when tracking is off
- **WHEN** `trackShortcutUsage` is `false` and the user opens the sort dropdown
- **THEN** "By Most-Used Category" and "By Most-Used Shortcut" are shown in a muted, non-clickable state

#### Scenario: Structural modes remain selectable when tracking is off
- **WHEN** `trackShortcutUsage` is `false` and the user opens the sort dropdown
- **THEN** "By Category", "By Modifier", and "By Key" are shown enabled and selectable

#### Scenario: Only By Category is selectable among usage-based modes when tracking is off
- **WHEN** `trackShortcutUsage` is `false`
- **THEN** the grid renders using "By Category" ordering (with no usage indicators present) unless the user selects "By Modifier" or "By Key", which remain available

#### Scenario: Usage-based modes become selectable when tracking is enabled
- **WHEN** `trackShortcutUsage` is `true`
- **THEN** all five sort modes are selectable in the dropdown

---

### Requirement: Search and modifier filter apply across all sort modes
The existing search input and modifier filter dropdown SHALL continue to filter visible entries regardless of which sort mode is active, including "By Most-Used Shortcut"'s and "By Key"'s flat lists, and including "By Modifier"'s grouped sections.

#### Scenario: Search filters the flat most-used-shortcut list
- **WHEN** "By Most-Used Shortcut" is active and the user types a search query
- **THEN** only entries matching the query (by the same name/key rules as other modes) remain visible, still ordered by usage count descending

#### Scenario: Search filters the flat by-key list
- **WHEN** "By Key" is active and the user types a search query
- **THEN** only entries matching the query remain visible, still ordered by key

#### Scenario: Search filters grouped modifier sections
- **WHEN** "By Modifier" is active and the user types a search query
- **THEN** only matching entries remain visible within each group, and groups with no remaining matches are hidden entirely

---

### Requirement: Category sections are individually collapsible
Each group section (a category under "By Category"/"By Most-Used Category", or a modifier-combo group under "By Modifier") SHALL be collapsible by clicking its heading. The heading SHALL display a `▾` indicator when expanded and `▸` when collapsed. All sections SHALL be expanded on every modal open — collapse state is not persisted between opens. While a search query is active, heading click SHALL have no effect (sections are force-expanded by search).

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

#### Scenario: Modifier group sections collapse the same way as categories
- **WHEN** "By Modifier" is active and the user clicks a group heading
- **THEN** that group's entries toggle hidden/visible exactly as a category section would

## ADDED Requirements

### Requirement: Key-based ordering floats special keys above ordinary character keys
Wherever hotkeys are ordered by their bound key (currently: "By Key" and, within each group, "By Modifier"), ordering SHALL use the raw key string, never the displayed glyph, with one exception: special/non-printable keys (arrow keys, Enter, Escape, Tab, Backspace, Delete, Home, End, Page Up, Page Down) SHALL sort before all ordinary character keys, in a fixed priority order. Ordinary character keys SHALL sort alphabetically among themselves. This ordering rule SHALL be implemented as a single shared comparator so any current or future view that orders hotkeys by key applies the same rule.

#### Scenario: Special key sorts before an ordinary character key
- **WHEN** the data contains a binding on `Escape` and a binding on `B`, and keys are being ordered
- **THEN** the `Escape` binding sorts before the `B` binding

#### Scenario: Ordinary character keys sort alphabetically
- **WHEN** the data contains bindings on `C`, `A`, and `B`, and keys are being ordered
- **THEN** they sort as `A`, `B`, `C`

#### Scenario: Special keys sort among themselves by fixed priority, not alphabetically
- **WHEN** the data contains bindings on both `ArrowUp` and `Enter`, and keys are being ordered
- **THEN** they sort in the fixed priority order, not alphabetically by key name

---

### Requirement: By Key mode flattens the grid into a single key-ordered list
When "By Key" is active, the grid SHALL render as a single flat list of hotkey bindings across all categories, with no group headings, ordered by the bound key (per the key-based ordering rule, special keys first), then by modifier-combination in canonical order (`Mod, Ctrl, Meta, Shift, Alt`), then by command name. Orphaned signatures (unbound key combinations with recorded usage) are excluded from this mode, matching every mode other than "By Most-Used Shortcut".

#### Scenario: Flat list ordered by key, special keys first
- **WHEN** "By Key" is active
- **THEN** no group headings are rendered, and all bindings appear in one continuous list with special keys (arrows, Enter, Escape, etc.) ahead of ordinary character keys, alphabetical within each group

#### Scenario: Collapse/expand-all toggle is disabled in By Key mode
- **WHEN** "By Key" is active
- **THEN** the collapse/expand-all toolbar button is disabled, since there are no sections to collapse

---

### Requirement: By Modifier mode groups bindings by modifier combination
When "By Modifier" is active, the grid SHALL render bindings grouped by their modifier combination (e.g. no modifier, `Mod`, `Mod+Shift`, `Mod+Alt+Shift`), one group per distinct combination present in the data. The group heading SHALL display the combination as platform-aware modifier labels joined by `" + "` (e.g. "Cmd + Shift"), or a dedicated "No Modifier" label for bindings with no modifiers. Groups SHALL be ordered by modifier count ascending, with ties broken by canonical modifier order (`Mod, Ctrl, Meta, Shift, Alt`). Within a group, bindings SHALL be ordered by the key-based ordering rule (special keys first), then by command name.

#### Scenario: Groups render one per distinct modifier combination
- **WHEN** "By Modifier" is active
- **THEN** each distinct modifier combination present in the data is rendered as its own group, headed by its platform-aware label, containing every binding that uses that exact combination

#### Scenario: No-modifier bindings form their own group
- **WHEN** "By Modifier" is active and at least one binding has no modifiers (e.g. `F1`, `Escape`)
- **THEN** those bindings are grouped under a "No Modifier" heading, sorted first among the groups

#### Scenario: Groups ordered by modifier count then canonical order
- **WHEN** "By Modifier" is active
- **THEN** groups with fewer modifiers appear before groups with more, and groups with the same modifier count are ordered following `Mod, Ctrl, Meta, Shift, Alt`

---

### Requirement: Multi-hotkey entries are duplicated per binding in key- and modifier-based modes
In "By Key" and "By Modifier", a command with more than one bound hotkey SHALL appear once per binding — each binding placed in the position or group its own key/modifier combination determines — rather than once per command. This differs from "By Category", "By Most-Used Category", and "By Most-Used Shortcut", where a command's bindings are always shown together on one row.

#### Scenario: Two-binding command appears in two different groups
- **WHEN** a command is bound to both `Mod+K` and `Mod+Shift+K`, and "By Modifier" is active
- **THEN** the command's name appears once under the "Cmd" group (for `Mod+K`) and once under the "Cmd + Shift" group (for `Mod+Shift+K`)

#### Scenario: Duplicated rows carry the same usage count
- **WHEN** a multi-bound command has a recorded usage count and appears as multiple rows under "By Key"
- **THEN** every duplicate row displays the same usage count as the original command

---

### Requirement: Switching sort modes resets section collapse state
Whenever the user selects a different sort mode from the dropdown, any collapsed sections SHALL be cleared so all sections render expanded under the newly selected mode. This applies even when switching between two grouped modes (e.g. "By Category" to "By Modifier").

#### Scenario: Collapsed category expands after switching to a modifier-grouped mode
- **WHEN** a category section is collapsed under "By Category" and the user selects "By Modifier"
- **THEN** all groups render expanded under the new mode, with no residual collapse state from the previous mode
