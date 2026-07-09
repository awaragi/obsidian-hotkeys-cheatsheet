## ADDED Requirements

### Requirement: Hotkey entry names jump to the native hotkey editor
Each rendered hotkey entry's command name SHALL be a click target that hands off to the `hotkey-editor-handoff` capability, passing that entry's display name. The name SHALL show a pointer cursor and a hover style to indicate it is interactive. Orphan rows (unassigned key combinations with no bound command, shown in **By Most-Used Shortcut**) SHALL NOT be clickable, since there is no command to jump to.

#### Scenario: Clicking a real entry's name opens the native hotkey editor
- **WHEN** the user clicks the command name of a non-orphan hotkey entry
- **THEN** Obsidian's Settings modal opens to the Hotkeys tab, filtered toward that command

#### Scenario: Orphan rows are not clickable
- **WHEN** the modal is sorted **By Most-Used Shortcut** and an orphan ("No command") row is displayed
- **THEN** clicking its name does not trigger the hotkey-editor handoff
