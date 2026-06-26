## Purpose

User setting to show or hide the plugin's ribbon icon. The ribbon is registered conditionally at plugin load time; changing the setting takes effect after Obsidian reloads the plugin.

## Requirements

### Requirement: Ribbon icon visibility is user-configurable
The settings tab SHALL provide a toggle to show or hide the plugin's ribbon icon. `addRibbonIcon` SHALL only be called during `onload()` when `showRibbonIcon` is `true`. The command palette entry SHALL always remain available regardless of ribbon visibility.

#### Scenario: Ribbon hidden when setting is false at load
- **WHEN** `showRibbonIcon` is `false` and the plugin loads
- **THEN** `addRibbonIcon` is not called and no ribbon icon appears

#### Scenario: Ribbon shown when setting is true at load
- **WHEN** `showRibbonIcon` is `true` and the plugin loads
- **THEN** `addRibbonIcon` is called and the keyboard ribbon icon is visible

#### Scenario: Command palette unaffected by ribbon toggle
- **WHEN** the ribbon icon is hidden
- **THEN** the "Open Hotkeys Cheatsheet" command palette entry still opens the modal

#### Scenario: Setting persists across restarts
- **WHEN** the user changes the ribbon toggle and reloads Obsidian
- **THEN** the ribbon icon state matches the saved setting on next load

#### Scenario: Default is true
- **WHEN** no stored value exists for `showRibbonIcon` (first install or missing key)
- **THEN** the field resolves to `true` via `DEFAULT_SETTINGS` merge and the ribbon icon is shown
