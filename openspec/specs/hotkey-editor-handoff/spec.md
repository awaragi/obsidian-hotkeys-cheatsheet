## Purpose

Lets the user jump from a cheatsheet entry straight to Obsidian's native Settings → Hotkeys tab, pre-filtered to that command, so rebinding doesn't require manually re-finding the command in native Settings.

## Requirements

### Requirement: Jump to Obsidian's native hotkey editor for a given command
The plugin SHALL expose a function that, given the active `App` and a command's display name, opens Obsidian's Settings modal to the Hotkeys tab and attempts to pre-fill that tab's search box with the given name so the matching row(s) are visible.

#### Scenario: Settings opens to the Hotkeys tab
- **WHEN** the jump function is called with a valid command name
- **THEN** Obsidian's Settings modal opens with the Hotkeys tab active

#### Scenario: Hotkeys tab search box is pre-filled
- **WHEN** the jump function is called with a command name and the Hotkeys tab's search input is found in the DOM
- **THEN** the search input's value is set to that command name and an `input` event is dispatched so the native tab filters its list

---

### Requirement: Every internal-API dependency fails soft
Because this capability depends entirely on undocumented Obsidian internals (`app.setting`, `openTabById`, and the Hotkeys tab's search input), each step SHALL be independently guarded: if a given internal is missing or not shaped as expected, execution SHALL stop at that step without throwing, leaving whatever was already opened in place.

#### Scenario: `app.setting` is unavailable
- **WHEN** the jump function is called and `app.setting` does not exist
- **THEN** the function returns without opening anything and without throwing

#### Scenario: Settings opens but the search input cannot be found
- **WHEN** the jump function successfully opens Settings to the Hotkeys tab but no matching search `<input>` is found in the DOM
- **THEN** the Hotkeys tab remains open, unfiltered, and no error is thrown
