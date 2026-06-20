## Purpose

Modal UI that renders categorised hotkeys as a responsive grid with `<kbd>` badges, live search filtering, modifier filter dropdown, and OS-aware modifier display.

## Requirements

### Requirement: Modal opens via ribbon and command palette
The plugin SHALL register a ribbon icon (keyboard icon) and a command palette entry that both open the cheatsheet modal. The modal SHALL provide a ✕ close button in the header and SHALL also close when the user presses Escape.

#### Scenario: Ribbon icon opens modal
- **WHEN** the user clicks the ribbon icon
- **THEN** the cheatsheet modal opens

#### Scenario: Command opens modal
- **WHEN** the user runs "Open Hotkeys Cheatsheet" from the command palette
- **THEN** the cheatsheet modal opens

#### Scenario: X button closes modal
- **WHEN** the modal is open and the user clicks the ✕ button in the header
- **THEN** the modal closes

#### Scenario: Escape closes modal when search is empty
- **WHEN** the modal is open, the search input is empty, and the user presses Escape
- **THEN** the modal closes

#### Scenario: Escape clears active search before closing
- **WHEN** the modal is open, the search input has text, and the user presses Escape
- **THEN** the search input is cleared and all entries are shown (modal stays open)

---

### Requirement: Modal displays categorised hotkeys as a responsive grid
The modal SHALL render assigned hotkeys grouped by category, each group as a labelled section. Sections SHALL be laid out using CSS multi-column (`columns: 220px`) so content flows top-to-bottom within a column before spilling into the next. Columns SHALL use greedy fill (`column-fill: auto`) so each column fills to the modal height before the next begins. The container SHALL scroll horizontally when more columns exist than fit the modal width, and SHALL scroll vertically as a fallback when only one column fits.

Category headings SHALL use `break-after: avoid` so a heading is never left alone at the bottom of a column without at least one following entry.

Category headings SHALL be rendered at `font-ui-small` size, `font-weight: 700`, and `color: var(--text-normal)` for high contrast.

#### Scenario: Groups render with headings
- **WHEN** the modal opens
- **THEN** each category is rendered with a visible heading and its hotkey entries below it

#### Scenario: Content flows vertically before spilling to next column
- **WHEN** the modal has enough entries to fill more than one column
- **THEN** the first column fills completely top-to-bottom before entries appear in the second column

#### Scenario: Grid reflows on narrow viewport
- **WHEN** the modal is displayed at a narrow width (< ~600px)
- **THEN** categories stack into a single column with vertical scroll

#### Scenario: Heading does not orphan at column bottom
- **WHEN** a category heading falls at the bottom of a column with no entries below it in that column
- **THEN** the heading flows to the top of the next column alongside its first entry

---

### Requirement: Each hotkey entry renders key badges with OS-aware modifiers
Each hotkey SHALL be displayed as a command name alongside a row of `<kbd>` elements — one per modifier and one for the key. Modifier tokens SHALL be translated to platform-specific labels using `Platform.isMacOS`.

| Token | macOS | Win/Linux |
|---|---|---|
| `Mod` | `Cmd` | `Ctrl` |
| `Meta` | `Cmd` | `Win` |
| `Ctrl` | `Ctrl` | `Ctrl` |
| `Shift` | `Shift` | `Shift` |
| `Alt` | `Option` | `Alt` |

#### Scenario: Modifier renders correctly on macOS
- **WHEN** a hotkey has `modifiers: ["Mod", "Shift"]` and the platform is macOS
- **THEN** the badges render as `[Cmd]` `[Shift]` `[key]`

#### Scenario: Modifier renders correctly on Windows
- **WHEN** a hotkey has `modifiers: ["Mod", "Shift"]` and the platform is Windows
- **THEN** the badges render as `[Ctrl]` `[Shift]` `[key]`

#### Scenario: Bare key renders without modifier badge
- **WHEN** a hotkey has `modifiers: []` and `key: "F1"`
- **THEN** only one badge renders: `[F1]`

#### Scenario: Multiple hotkeys per command are all shown
- **WHEN** a command has two assigned hotkeys (e.g. next tab: `Ctrl+Tab` and `⌘⇧]`)
- **THEN** both hotkey rows are displayed under the same command name

#### Scenario: Special key names render as icons
- **WHEN** a hotkey has `key: "ArrowUp"`
- **THEN** the key badge renders as `↑`

---

### Requirement: Real-time search filters entries by name or key character
The modal SHALL include a search input in the toolbar. As the user types, entries are filtered in real time using two match criteria (either is sufficient to keep an entry visible):
1. **Command name** — the query is a case-insensitive substring of the command name.
2. **Key character only** — the query matches the bare key of any of the command's hotkeys (case-insensitive, ignoring modifiers). Typing `b` SHALL match `Cmd B`, `Cmd Shift B`, and `Ctrl B`.

Modifiers are NOT matched by the search input — modifier filtering is handled separately by the modifier filter dropdown.
Matching text in command names SHALL be highlighted. The matching key badge SHALL also be highlighted. The search SHALL be case-insensitive.

#### Scenario: Search filters by command name
- **WHEN** the user types "bold" in the search input
- **THEN** only entries whose name contains "bold" (case-insensitive) remain visible

#### Scenario: Search matches by key character regardless of modifiers
- **WHEN** the user types "b" in the search input
- **THEN** all entries that have a hotkey with key "B" remain visible (e.g. Toggle bold Cmd B, any other Cmd Shift B binding)

#### Scenario: Search does not match on modifier names
- **WHEN** the user types "cmd" or "shift" in the search input
- **THEN** entries are NOT matched on modifier names — only name text and key character are searched

#### Scenario: Empty search shows all entries (subject to modifier filter)
- **WHEN** the search input is cleared
- **THEN** all entries not filtered out by the modifier filter are visible

#### Scenario: No results shows empty state
- **WHEN** the combined search + modifier filter matches no entries
- **THEN** a "No results" message is displayed

---

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

---

### Requirement: Settings tab displays plugin about blurb
The plugin settings tab SHALL display a read-only about section containing: plugin name, version (from `this.manifest.version`), author name, and a one-line description of the plugin.

#### Scenario: About section renders in settings
- **WHEN** the user opens Obsidian Settings and navigates to the Hotkeys Cheatsheet plugin
- **THEN** the plugin name, version, author, and description are displayed

---

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

### Requirement: Toolbar provides a collapse/expand all toggle
The modal toolbar SHALL include a single icon button at the far right that toggles between collapsing all sections and expanding all sections. When any section is expanded, clicking the button collapses all; when all sections are collapsed, clicking the button expands all. The icon SHALL update to reflect the current state (`chevrons-down-up` when collapsible, `chevrons-up-down` when expandable). The button SHALL be disabled while a search query is active.

#### Scenario: Collapse All collapses all sections
- **WHEN** one or more sections are expanded and the user clicks the toggle button
- **THEN** all section entries are hidden and all headings show `▸`

#### Scenario: Expand All expands all sections
- **WHEN** all sections are collapsed and the user clicks the toggle button
- **THEN** all section entries are visible and all headings show `▾`

#### Scenario: Toggle disabled during search
- **WHEN** a search query is active
- **THEN** the collapse/expand toggle button is disabled and non-interactive

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

---

### Requirement: Modal inherits Obsidian theme variables
All colours, spacing, and typography in the modal SHALL use Obsidian CSS custom properties (e.g. `--background-primary`, `--text-normal`, `--interactive-accent`) so the modal respects the user's active theme without hardcoded colours.

#### Scenario: Modal matches light theme
- **WHEN** Obsidian is using a light theme
- **THEN** the modal background and text colours match the theme

#### Scenario: Modal matches dark theme
- **WHEN** Obsidian is using a dark theme
- **THEN** the modal background and text colours match the theme
