## Purpose

User setting to show or hide the plugin's ribbon icon, applied immediately without Obsidian restart.

## Requirements

### Requirement: Ribbon icon visibility is user-configurable
The settings tab SHALL provide a toggle to show or hide the plugin's ribbon icon. The change SHALL take effect immediately without requiring Obsidian to restart. The command palette entry SHALL always remain available regardless of ribbon visibility.

#### Scenario: Ribbon hidden via settings
- **WHEN** the user disables the "Show ribbon icon" toggle in settings
- **THEN** the ribbon icon is hidden immediately

#### Scenario: Ribbon shown via settings
- **WHEN** the user enables the "Show ribbon icon" toggle in settings
- **THEN** the ribbon icon becomes visible immediately

#### Scenario: Command palette unaffected by ribbon toggle
- **WHEN** the ribbon icon is hidden
- **THEN** the "Open Hotkeys Cheatsheet" command palette entry still opens the modal

#### Scenario: Setting persists across restarts
- **WHEN** the user hides the ribbon icon and restarts Obsidian
- **THEN** the ribbon icon remains hidden on next load
