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
The exported note SHALL use a level-1 heading for the document title, a timestamp subtitle line, and a level-2 heading per category followed by a Markdown table with two columns: Command and Hotkey.

Format:
```
# Hotkeys Cheatsheet

*Exported from Obsidian on YYYY-MM-DD*

## <Category Name>

| Command | Hotkey |
|---------|--------|
| <command name> | `<mod>` + `<key>` |
```

Each modifier and key token in the Hotkey cell SHALL be wrapped in backticks and joined with ` + `. When a command has multiple hotkey bindings, they SHALL all appear in the same cell joined with ` / `. Modifier tokens SHALL be OS-aware (e.g. `Cmd` on macOS, `Ctrl` on Windows).

#### Scenario: Single hotkey renders correctly
- **WHEN** a command has one binding with modifiers `["Mod", "Shift"]` and key `"P"` on macOS
- **THEN** the Hotkey cell reads `` `Cmd` + `Shift` + `P` ``

#### Scenario: Multiple bindings are joined with slash
- **WHEN** a command has two bindings: `Ctrl+O` and `Ctrl+Shift+O`
- **THEN** the Hotkey cell reads `` `Ctrl` + `O` / `Ctrl` + `Shift` + `O` ``

#### Scenario: Timestamp appears in subtitle
- **WHEN** the note is exported on 2026-06-26
- **THEN** the second line of the note reads `*Exported from Obsidian on 2026-06-26*`

---

### Requirement: Note is saved to the active file's folder with a fixed filename
The plugin SHALL determine the save folder as the parent folder of the currently active file in the workspace. If no file is active, the plugin SHALL fall back to the vault root. The filename SHALL always be `Hotkeys Cheatsheet.md`.

#### Scenario: Saves to active file's folder
- **WHEN** the user has `Notes/Work/todo.md` open as the active file and triggers export
- **THEN** the note is saved at `Notes/Work/Hotkeys Cheatsheet.md`

#### Scenario: Falls back to vault root when no file is active
- **WHEN** no file is currently open in the workspace and the user triggers export
- **THEN** the note is saved at `Hotkeys Cheatsheet.md` (vault root)

---

### Requirement: On success the modal closes and the exported note opens
After a successful save, the plugin SHALL close the cheatsheet modal and open the exported note in the current workspace leaf.

#### Scenario: Modal closes and note opens after export
- **WHEN** the export completes successfully
- **THEN** the cheatsheet modal closes and the exported note is opened in the editor

---

### Requirement: Overwrite confirmation before replacing an existing note
If a note already exists at the target path, the plugin SHALL NOT overwrite it immediately. Instead, it SHALL show a Notice informing the user that the file exists and instructing them to trigger export again to confirm the overwrite. On the second trigger (within the same modal session), the plugin SHALL overwrite the file unconditionally.

The pending-overwrite flag SHALL reset when the modal is closed.

#### Scenario: First export attempt warns instead of overwriting
- **WHEN** `Hotkeys Cheatsheet.md` already exists in the target folder and the user triggers export
- **THEN** a Notice appears indicating the file exists and asking for confirmation, and the file is NOT overwritten

#### Scenario: Second export attempt overwrites
- **WHEN** the user triggers export a second time after seeing the overwrite warning (within the same modal session)
- **THEN** the existing file is overwritten and the modal closes with the note opened

#### Scenario: Overwrite flag resets on modal close
- **WHEN** the user sees the overwrite warning, closes the modal without confirming, and reopens the modal
- **THEN** triggering export again shows the warning again (does not skip to overwrite)
