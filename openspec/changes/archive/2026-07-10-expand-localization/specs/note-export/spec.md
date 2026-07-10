## MODIFIED Requirements

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

#### Scenario: Column headers are translated
- **WHEN** the active locale is `ja` and the user triggers "Save as Note"
- **THEN** the table header row reads `| コマンド | ショートカット |` instead of `| Command | Hotkey |`

## ADDED Requirements

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
