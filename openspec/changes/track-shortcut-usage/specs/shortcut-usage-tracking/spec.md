## ADDED Requirements

### Requirement: Usage tracking is disabled by default and user-configurable
The settings tab SHALL provide a toggle, `trackShortcutUsage`, to enable or disable shortcut usage capture. The field SHALL default to `false` when no stored value exists. Capture SHALL only be active while the setting is `true`.

#### Scenario: Default is disabled
- **WHEN** no stored value exists for `trackShortcutUsage` (first install or missing key)
- **THEN** the field resolves to `false` via `DEFAULT_SETTINGS` merge and no capture listener is registered

#### Scenario: Enabling the setting starts capture
- **WHEN** the user turns the toggle on
- **THEN** a keydown capture listener is registered without requiring a plugin reload

#### Scenario: Disabling the setting stops capture without clearing data
- **WHEN** the user turns the toggle off
- **THEN** the capture listener is removed and previously stored usage counts remain on disk unchanged

### Requirement: Captured keydown events are filtered to shortcut-like combinations
The capture listener SHALL only record an event when at least one of `Ctrl`, `Meta`/`Mod`, or `Alt` is held, or when the non-modifier key is one of a fixed allowlist of keys meaningful as bare shortcuts (`Escape`, `Tab`, `Enter`, `Delete`, `Backspace`, `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Home`, `End`, `PageUp`, `PageDown`, `F1`–`F12`). Events where `key` is itself a modifier, or where `repeat` is `true`, SHALL be ignored.

#### Scenario: Modifier combo is captured
- **WHEN** the user presses `Cmd/Ctrl+Shift+B`
- **THEN** the press is recorded

#### Scenario: Plain typing is not captured
- **WHEN** the user types a plain letter or digit key with no `Ctrl`/`Meta`/`Alt` held
- **THEN** the press is not recorded

#### Scenario: Allowlisted bare key is captured
- **WHEN** the user presses `Escape` with no modifiers held
- **THEN** the press is recorded

#### Scenario: Held-down key repeat is not double-counted
- **WHEN** the user holds a qualifying shortcut combination down and the browser fires repeated `keydown` events for it
- **THEN** only the initial, non-repeat event is recorded

#### Scenario: Bare modifier press is not recorded
- **WHEN** the user presses and releases `Shift` (or another modifier) alone
- **THEN** no entry is recorded, since there is no non-modifier key to key the signature on

### Requirement: Captured presses are stored as canonical signatures, not command IDs
Each recorded press SHALL be converted to a canonical string signature composed of held modifiers in a fixed order (`Mod`, `Ctrl`, `Meta`, `Shift`, `Alt`) followed by the uppercased key, with no lookup against `hotkeyManager` or any command performed at capture time.

#### Scenario: Signature is command-agnostic
- **WHEN** a qualifying press is captured
- **THEN** the stored data contains only the modifier+key signature, with no command ID or name attached

#### Scenario: Same physical combination always yields the same signature
- **WHEN** the same modifier+key combination is pressed multiple times
- **THEN** each press increments the count for the same signature string

### Requirement: Usage counts persist to a dedicated data file, separate from plugin settings
Usage counts SHALL be persisted as `{ version: 1, counts: Record<string, number> }` to a file dedicated to usage data, distinct from the settings data file, using the vault adapter. Writes SHALL be debounced/throttled so that continuous input does not cause a write per keystroke.

#### Scenario: Counts survive a plugin reload
- **WHEN** the plugin unloads and reloads after usage has been recorded
- **THEN** previously recorded counts are still present and continue incrementing from their prior values

#### Scenario: Writes are not per-keystroke
- **WHEN** the user presses several qualifying shortcuts in quick succession
- **THEN** the data file is written at most once per throttle interval, not once per press

#### Scenario: Settings and usage data are independent files
- **WHEN** usage counts are persisted
- **THEN** the plugin's settings data file is not modified as a result

### Requirement: User can reset all collected usage statistics
The settings tab SHALL provide a "Reset usage statistics" action that clears all stored counts after explicit confirmation, since the action is destructive and irreversible.

#### Scenario: Reset clears stored counts immediately
- **WHEN** the user triggers the reset action and confirms
- **THEN** in-memory counters are cleared and the usage data file is immediately updated to reflect zero recorded signatures, without waiting for the debounce interval

#### Scenario: Reset requires confirmation
- **WHEN** the user triggers the reset action
- **THEN** the plugin requires an explicit confirmation step before clearing data

#### Scenario: Reset is available even when tracking is currently disabled
- **WHEN** `trackShortcutUsage` is `false` but prior usage data exists on disk
- **THEN** the reset action is still available and clears that existing data
