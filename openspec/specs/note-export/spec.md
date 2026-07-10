## Purpose

Export the full hotkey cheatsheet as a Markdown note saved to the vault, with one table per category and OS-aware hotkey formatting.

## Requirements

### Requirement: Full cheatsheet exports as a Markdown note
The plugin SHALL generate a Markdown document from the complete hotkey dataset and save it as a note in the vault. The export SHALL always include all categories and all entries regardless of any active search query or modifier filter.

#### Scenario: Export contains all categories
- **WHEN** the user triggers "Save as Note" while a search filter is active
- **THEN** the exported note contains all hotkey categories and entries, not just the filtered subset

#### Scenario: Export contains all entries in each category
- **WHEN** the user triggers "Save as Note" while some sections are collapsed
- **THEN** the exported note contains entries from all sections, including those that were collapsed in the modal

---

### Requirement: Exported Markdown uses one table per category
The exported note SHALL use a level-1 heading for the document title, a timestamp subtitle line, and a level-2 heading per category followed by a Markdown table with two columns: Command and Hotkey. The document title, category headings, and the two column headers SHALL be translated to the active locale (per `modal.title`, the `cheatsheet-modal` capability's category translation rule, and the `modal.export_table_command`/`modal.export_table_hotkey` translation keys, respectively).

Format (shown in the `en` locale; heading levels noted in brackets since literal `#` markers here would be misread as document structure):
```
[H1] Hotkeys Cheatsheet

*Exported from Obsidian on YYYY-MM-DD*

[H2] <Category Name>

| Command | Hotkey |
|---------|--------|
| <command name> | `<mod>` + `<key>` |
```

Each modifier and key token in the Hotkey cell SHALL be wrapped in backticks and joined with ` + `. When a command has multiple hotkey bindings, they SHALL all appear in the same cell joined with ` / `. Modifier tokens SHALL be OS-aware (e.g. `Cmd` on macOS, `Ctrl` on Windows). A literal `|` character appearing in a command name SHALL be escaped (as `\|`) before being placed into a table cell, so it cannot be misread as a column separator and corrupt the table structure.

#### Scenario: Single hotkey renders correctly
- **WHEN** a command has one binding with modifiers `["Mod", "Shift"]` and key `"P"` on macOS
- **THEN** the Hotkey cell reads `` `Cmd` + `Shift` + `P` ``

#### Scenario: Multiple bindings are joined with slash
- **WHEN** a command has two bindings: `Ctrl+O` and `Ctrl+Shift+O`
- **THEN** the Hotkey cell reads `` `Ctrl` + `O` / `Ctrl` + `Shift` + `O` ``

#### Scenario: Timestamp appears in subtitle
- **WHEN** the note is exported on 2026-06-26
- **THEN** the second line of the note reads `*Exported from Obsidian on 2026-06-26*`

#### Scenario: Command name containing a pipe character does not break the table
- **WHEN** a command's display name contains a literal `|` character
- **THEN** the exported table cell escapes it as `\|` and the table renders with the correct number of columns

#### Scenario: Column headers are translated
- **WHEN** the active locale is `ja` and the user triggers "Save as Note"
- **THEN** the table header row reads `| コマンド | ショートカット |` instead of `| Command | Hotkey |`

---

### Requirement: Note is saved to the active file's folder with a translated filename
The plugin SHALL determine the save folder as the parent folder of the currently active file in the workspace. If no file is active, the plugin SHALL fall back to the vault root. The filename SHALL be the active locale's translation of the cheatsheet title (`modal.title`) with a `.md` extension, so it matches the exported note's own `# <title>` heading and stays consistent with the active locale.

#### Scenario: Saves to active file's folder
- **WHEN** the user has `Notes/Work/todo.md` open as the active file and triggers export in the `en` locale
- **THEN** the note is saved at `Notes/Work/Hotkeys Cheatsheet.md`

#### Scenario: Falls back to vault root when no file is active
- **WHEN** no file is currently open in the workspace and the user triggers export in the `en` locale
- **THEN** the note is saved at `Hotkeys Cheatsheet.md` (vault root)

#### Scenario: Filename matches the active locale
- **WHEN** the active locale is `ja` and the user triggers export
- **THEN** the note is saved with the Japanese translation of the title as its filename (`.md` extension), not the English `Hotkeys Cheatsheet.md`

---

### Requirement: On success the modal closes and the exported note opens
After a successful save, the plugin SHALL close the cheatsheet modal and open the exported note in the current workspace leaf.

#### Scenario: Modal closes and note opens after export
- **WHEN** the export completes successfully
- **THEN** the cheatsheet modal closes and the exported note is opened in the editor

---

### Requirement: Overwrite confirmation before replacing an existing note
If a note already exists at the target path, the plugin SHALL NOT overwrite it immediately. Instead, it SHALL show a Notice informing the user that the file exists and instructing them to trigger export again to confirm the overwrite. The pending-overwrite confirmation SHALL be scoped to the specific target path it was raised for, and SHALL remain valid only for the duration the Notice is shown on screen. On a second trigger for the *same* target path within that window, the plugin SHALL overwrite the file. A second trigger for a *different* target path, or a trigger after the confirmation window has elapsed, SHALL be treated as a fresh export attempt (re-raising the warning if that path's file also already exists).

The pending-overwrite state SHALL also reset when the modal is closed.

#### Scenario: First export attempt warns instead of overwriting
- **WHEN** `Hotkeys Cheatsheet.md` already exists in the target folder and the user triggers export
- **THEN** a Notice appears indicating the file exists and asking for confirmation, and the file is NOT overwritten

#### Scenario: Second export attempt overwrites the same target
- **WHEN** the user triggers export a second time, within the confirmation window, for the same target path that raised the warning
- **THEN** the existing file is overwritten and the modal closes with the note opened

#### Scenario: Confirmation does not carry over to a different target path
- **WHEN** the user sees the overwrite warning for one target path, then the active file changes such that export now resolves to a different target path, and the user triggers export again
- **THEN** the plugin evaluates the new target path fresh — showing its own overwrite warning if a file exists there, rather than silently overwriting it

#### Scenario: Confirmation expires after the warning is no longer shown
- **WHEN** the user sees the overwrite warning, waits longer than the confirmation window without triggering export again, and then triggers export
- **THEN** the plugin treats it as a first attempt again, re-showing the warning instead of overwriting

#### Scenario: Overwrite state resets on modal close
- **WHEN** the user sees the overwrite warning, closes the modal without confirming, and reopens the modal
- **THEN** triggering export again shows the warning again (does not skip to overwrite)

---

### Requirement: Export failure notice is translated
If saving the exported note to the vault fails, the plugin SHALL show a Notice with a translated message (including the underlying error detail), rather than a hardcoded English string.

#### Scenario: Failure notice renders in the active locale
- **WHEN** the active locale is `ar` and saving the exported note fails
- **THEN** the failure Notice text is rendered in Arabic, with the underlying error detail interpolated in

---

### Requirement: Curated category headings are translated in Markdown export
Category headings (`## <Category Name>`) in the exported Markdown SHALL use the same translated label as the modal for curated categories, and pass plugin-derived categories through unchanged, per the `cheatsheet-modal` capability's category translation rule.

#### Scenario: Curated category heading is translated in the export
- **WHEN** the active locale is `ja` and the user triggers "Save as Note"
- **THEN** the exported note's headings for curated categories (Editing, Navigation, Search, Files & Vault, Workspace, Other) are in Japanese
