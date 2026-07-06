## MODIFIED Requirements

### Requirement: Exported Markdown uses one table per category
The exported note SHALL use a level-1 heading for the document title, a timestamp subtitle line, and a level-2 heading per category followed by a Markdown table with two columns: Command and Hotkey.

Format:
```
# Hotkeys Cheatsheet

*Exported from Obsidian on YYYY-MM-DD*

\#\# <Category Name>

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
