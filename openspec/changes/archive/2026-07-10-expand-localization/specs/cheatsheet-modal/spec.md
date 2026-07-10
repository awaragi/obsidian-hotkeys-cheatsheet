## MODIFIED Requirements

### Requirement: Key-based ordering floats special keys above ordinary character keys
Wherever hotkeys are ordered by their bound key (currently: "By Key" and, within each group, "By Modifier"), ordering SHALL use the raw key string, never the displayed glyph, with one exception: special/non-printable keys (arrow keys, Enter, Escape, Tab, Backspace, Delete, Home, End, Page Up, Page Down) SHALL sort before all ordinary character keys, in a fixed priority order. Ordinary character keys SHALL sort alphabetically among themselves using locale-aware comparison against the active locale. This ordering rule SHALL be implemented as a single shared comparator so any current or future view that orders hotkeys by key applies the same rule.

#### Scenario: Special key sorts before an ordinary character key
- **WHEN** the data contains a binding on `Escape` and a binding on `B`, and keys are being ordered
- **THEN** the `Escape` binding sorts before the `B` binding

#### Scenario: Ordinary character keys sort alphabetically
- **WHEN** the data contains bindings on `C`, `A`, and `B`, and keys are being ordered
- **THEN** they sort as `A`, `B`, `C`

#### Scenario: Special keys sort among themselves by fixed priority, not alphabetically
- **WHEN** the data contains bindings on both `ArrowUp` and `Enter`, and keys are being ordered
- **THEN** they sort in the fixed priority order, not alphabetically by key name

#### Scenario: Ordinary character key comparison uses the active locale
- **WHEN** the active locale is `ja` and ordinary character keys are being ordered
- **THEN** comparison uses `ja` collation rules rather than the runtime's default locale

## ADDED Requirements

### Requirement: Modal direction follows the active locale
The modal root SHALL set a `dir` attribute reflecting whether the active locale is right-to-left or left-to-right. Layout SHALL mirror correctly under a right-to-left locale: dropdown menus (filter, sort, export) SHALL remain anchored to their trigger button, and the usage-count label spacing SHALL mirror, all via CSS logical properties rather than physical `left`/`right`.

#### Scenario: Modal sets RTL direction under an RTL locale
- **WHEN** the active locale is `ar`
- **THEN** the modal root has `dir="rtl"`

#### Scenario: Dropdown stays anchored to its trigger under RTL
- **WHEN** the active locale is `ar` and the user opens the export dropdown
- **THEN** the dropdown appears anchored to the export button, not detached at a fixed screen edge

#### Scenario: Modal sets LTR direction under an LTR locale
- **WHEN** the active locale is `en`, `fr`, `es`, or `ja`
- **THEN** the modal root has `dir="ltr"`

---

### Requirement: Collapse chevron mirrors under RTL; keyboard arrow glyphs do not
The collapsed/expanded section chevron (`▸`/`▾`) SHALL mirror to point toward the reading-order "expand" direction when the active locale is right-to-left (`▸` becomes `◂`). The `KEY_ICONS` arrow glyphs (↑↓←→), which represent physical keyboard keys, SHALL NOT mirror under any locale direction.

#### Scenario: Collapse chevron mirrors under RTL
- **WHEN** the active locale is `ar` and a section is collapsed
- **THEN** the collapse chevron renders as `◂` instead of `▸`

#### Scenario: Keyboard arrow glyph does not mirror under RTL
- **WHEN** the active locale is `ar` and a hotkey is bound to the physical Left Arrow key
- **THEN** the key badge still displays `←`, not `→`

---

### Requirement: Hotkey badges are bidi-isolated from surrounding RTL text
Key-badge elements (the `<kbd>`-style modifier/key badges shown next to a command name) SHALL be rendered with explicit LTR direction and bidi isolation, so that an LTR hotkey combination embedded within an RTL command name does not have its character order altered by the Unicode Bidi Algorithm.

#### Scenario: Hotkey badge stays in LTR order next to an RTL command name
- **WHEN** the active locale is `ar` and a command name is in Arabic with an adjacent key badge reading a Latin hotkey combination
- **THEN** the key badge's characters render in their original left-to-right order

---

### Requirement: Curated category headings are translated
Category section headings SHALL be translated when the category is one of the plugin's curated categories (Editing, Navigation, Search, Files & Vault, Workspace) or the "Other" fallback. Plugin-derived categories (a third-party plugin's own name) SHALL render as-is, since there is no way to translate a plugin's own name. Internal grouping, sorting, search-filtering, and collapse-state tracking SHALL continue to key off the canonical (English) category identifier regardless of the active locale — only the displayed heading text changes.

#### Scenario: Curated category heading is translated
- **WHEN** the active locale is `ja` and the grid renders the "Editing" category section
- **THEN** the heading text is the Japanese translation, not the English word "Editing"

#### Scenario: Plugin category heading is not translated
- **WHEN** the active locale is `ja` and the grid renders a category derived from a third-party plugin's name
- **THEN** the heading text renders unchanged, in whatever language the plugin itself uses

#### Scenario: Collapse state is unaffected by the active locale
- **WHEN** the active locale is `ja`, the user collapses the "Editing" section, then the locale changes to `en`
- **THEN** the section remains collapsed, since collapse state is tracked by the canonical category identifier, not the translated display text

#### Scenario: This plugin's own category heading is translated, unlike a third-party plugin's
- **WHEN** the active locale is `ja` and the grid renders the category section for this plugin's own command ("Open Hotkeys Cheatsheet")
- **THEN** the heading text is the Japanese translation of the plugin's own name, not the English "Hotkeys Cheatsheet" — since this is a name the plugin controls and already translates (`settings.about.name`), not an arbitrary third-party plugin name
