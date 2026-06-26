## Purpose

Generate and download a self-contained HTML cheatsheet file with embedded CSS, a visible header, multi-column grid layout, and automatic light/dark theming via OS preference.

## Requirements

### Requirement: Full cheatsheet exports as a self-contained HTML file
The plugin SHALL generate a self-contained HTML document from the complete hotkey dataset (`this.groups`) and trigger a native OS "Save As" dialog for the user to choose where to save it. The export SHALL always include all categories and all entries regardless of any active search query or modifier filter.

#### Scenario: Export contains all categories
- **WHEN** the user triggers "Save as HTML" while a search filter is active
- **THEN** the exported HTML contains all hotkey categories and entries, not just the filtered subset

#### Scenario: Export contains all entries in each category
- **WHEN** the user triggers "Save as HTML" while some sections are collapsed
- **THEN** the exported HTML contains entries from all sections including those collapsed in the modal

---

### Requirement: Exported HTML is fully self-contained with embedded CSS
The exported file SHALL require no external stylesheets, scripts, fonts, or network requests. All CSS SHALL be embedded in a `<style>` block in the document `<head>`.

#### Scenario: File opens without internet connection
- **WHEN** the user opens the exported HTML file in a browser with no internet connection
- **THEN** the file renders correctly with all styles applied

---

### Requirement: HTML file has a page title and visible header
The exported document SHALL include a `<title>` element in the `<head>` containing the cheatsheet title and export date. The document body SHALL begin with a visible header containing an `<h1>` with the cheatsheet title and a subtitle line with the export date.

#### Scenario: Browser tab shows title and date
- **WHEN** the user opens the exported HTML in a browser
- **THEN** the browser tab reads "Hotkeys Cheatsheet — YYYY-MM-DD"

#### Scenario: Header renders above the grid
- **WHEN** the user opens the exported HTML in a browser
- **THEN** a header with the cheatsheet title and export date appears above the hotkey grid

---

### Requirement: HTML layout uses the same multi-column grid as the modal
The exported HTML SHALL render categories using CSS `columns: 300px` multi-column layout, matching the modal's visual structure. Each category SHALL have a heading and a list of entries with command name and `<kbd>` hotkey badges.

#### Scenario: Grid flows into multiple columns
- **WHEN** the exported HTML is opened in a wide browser window
- **THEN** categories are laid out in multiple columns, flowing top-to-bottom within each column

#### Scenario: Grid reflows to single column on narrow viewport
- **WHEN** the exported HTML is opened in a narrow browser window (< ~600px)
- **THEN** categories stack into a single column

---

### Requirement: HTML automatically adapts to OS light/dark preference
The exported HTML SHALL use `prefers-color-scheme` CSS media query to apply a light palette by default and a dark palette when the OS is in dark mode. No JavaScript SHALL be required. The palette SHALL be self-contained (no Obsidian CSS variables).

#### Scenario: Light mode renders light palette
- **WHEN** the OS is set to light mode and the user opens the exported HTML
- **THEN** the page displays a light background with dark text

#### Scenario: Dark mode renders dark palette
- **WHEN** the OS is set to dark mode and the user opens the exported HTML
- **THEN** the page displays a dark background with light text

---

### Requirement: OS "Save As" dialog is triggered with a default filename
Clicking "Save as HTML" SHALL generate the HTML document and trigger a native OS "Save As" dialog using the browser `<a download>` mechanism. The default filename SHALL be `Hotkeys Cheatsheet.html`. No vault files SHALL be created or modified.

#### Scenario: Save dialog appears with correct filename
- **WHEN** the user clicks "Save as HTML" in the export dropdown
- **THEN** the OS "Save As" dialog opens with `Hotkeys Cheatsheet.html` as the default filename

#### Scenario: Cancelling the dialog has no side effects
- **WHEN** the user clicks "Save as HTML" and then cancels the OS dialog
- **THEN** no file is written and the modal remains open
