## MODIFIED Requirements

### Requirement: Usage tracking is disabled by default and user-configurable
The settings tab SHALL provide a toggle, `trackShortcutUsage`, to enable or disable shortcut usage capture. The field SHALL default to `false` when no stored value exists. Capture SHALL only be active while the setting is `true`. The setting's description text SHALL disclose that capture applies to any `Ctrl`/`Cmd`/`Alt`+key combination pressed anywhere in the application while enabled, not only to combinations that match a recognized Obsidian command hotkey.

#### Scenario: Default is disabled
- **WHEN** no stored value exists for `trackShortcutUsage` (first install or missing key)
- **THEN** the field resolves to `false` via `DEFAULT_SETTINGS` merge and no capture listener is registered

#### Scenario: Enabling the setting starts capture
- **WHEN** the user turns the toggle on and persistence is available
- **THEN** a keydown capture listener is registered without requiring a plugin reload

#### Scenario: Disabling the setting stops capture without clearing data
- **WHEN** the user turns the toggle off
- **THEN** the capture listener is removed and previously stored usage counts remain on disk unchanged

#### Scenario: Setting description discloses global capture scope
- **WHEN** the user views the "Track shortcut usage" setting description
- **THEN** the text states that capture records any held-modifier key combination pressed anywhere in the app, not just recognized Obsidian hotkeys

---

### Requirement: Captured keydown events are filtered to shortcut-like combinations
The capture listener SHALL only record an event when at least one of `Ctrl`, `Meta`/`Mod`, or `Alt` is held. Events where `key` is itself a modifier, or where `repeat` is `true`, SHALL be ignored. A bare (no-modifier) key press — including keys like `Escape`, `Enter`, `Tab`, `Backspace`, arrows, and function keys — SHALL NOT be recorded: these are indistinguishable from normal typing/navigation/UI-dismissal and would only add noise, not a meaningful shortcut-usage signal.

Composed/accented character input via Option (Alt) on international keyboard layouts SHALL also be excluded, covering both forms this takes: the intermediate `"Dead"` composition state (two-step sequences, e.g. Option+E then E), and a single-step composed character produced directly when Alt is the sole non-Shift qualifying modifier (e.g. on a Canadian CSA layout, Option+S produces `"ß"` and Option+A produces `"æ"` in one keydown, with no `"Dead"` state at all) — in the latter case, any resulting single character that isn't a plain ASCII letter or digit SHALL be treated as composed text, not a shortcut. This exclusion SHALL NOT apply when Ctrl or Meta/Mod is also held alongside Alt, since macOS does not perform text composition in that case.

#### Scenario: Modifier combo is captured
- **WHEN** the user presses `Cmd/Ctrl+Shift+B`
- **THEN** the press is recorded

#### Scenario: Plain typing is not captured
- **WHEN** the user types a plain letter or digit key with no `Ctrl`/`Meta`/`Alt` held
- **THEN** the press is not recorded

#### Scenario: Bare non-modifier key is not captured
- **WHEN** the user presses `Escape`, `Enter`, `Tab`, `Backspace`, an arrow key, or a function key with no `Ctrl`/`Meta`/`Alt` held
- **THEN** the press is not recorded

#### Scenario: Held-down key repeat is not double-counted
- **WHEN** the user holds a qualifying shortcut combination down and the browser fires repeated `keydown` events for it
- **THEN** only the initial, non-repeat event is recorded

#### Scenario: Bare modifier press is not recorded
- **WHEN** the user presses and releases `Shift` (or another modifier) alone
- **THEN** no entry is recorded, since there is no non-modifier key to key the signature on

#### Scenario: Two-step dead-key composition is not recorded
- **WHEN** the user presses Option/Alt plus a key to begin composing an accented character (producing a `"Dead"` key value) on an international keyboard layout
- **THEN** the press is not recorded, even though a modifier is held

#### Scenario: Single-step Option-composed character is not recorded
- **WHEN** the user presses Option (Alt) plus a letter on a layout where it composes directly to an accented or special character in one keydown (e.g. Option+S producing `"ß"`, Option+A producing `"æ"`, or Option+2 producing `"@"` on a Canadian CSA layout), with no Ctrl or Meta/Mod also held
- **THEN** the press is not recorded, even though Alt is held

#### Scenario: Alt combined with Cmd/Ctrl is still captured
- **WHEN** the user presses a combination that holds Alt together with Ctrl or Meta/Mod (e.g. `Cmd+Alt+K`)
- **THEN** the press is recorded normally, since macOS does not compose text in that case

---

### Requirement: Usage counts persist to a dedicated data file, separate from plugin settings
Usage counts SHALL be persisted as `{ version: 1, counts: Record<string, number> }` to a file dedicated to usage data, distinct from the settings data file, using the vault adapter. Writes SHALL be debounced/throttled so that continuous input does not cause a write per keystroke. A failure to write the usage data file (e.g. disk full, permission error, sync conflict) SHALL be caught and logged rather than surfacing as an unhandled promise rejection or an uncaught exception to any caller (the debounced flush, plugin unload, or the settings "Reset usage statistics" action). If the plugin's own data directory is unavailable at load time, the plugin SHALL treat persistence as unavailable and SHALL NOT start capture even if `trackShortcutUsage` is `true`, rather than counting presses in memory that can never be saved.

#### Scenario: Counts survive a plugin reload
- **WHEN** the plugin unloads and reloads after usage has been recorded
- **THEN** previously recorded counts are still present and continue incrementing from their prior values

#### Scenario: Writes are not per-keystroke
- **WHEN** the user presses several qualifying shortcuts in quick succession
- **THEN** the data file is written at most once per throttle interval, not once per press

#### Scenario: Settings and usage data are independent files
- **WHEN** usage counts are persisted
- **THEN** the plugin's settings data file is not modified as a result

#### Scenario: A failed write does not crash the caller
- **WHEN** the vault adapter's write call fails during a debounced flush, plugin unload, or a reset action
- **THEN** the failure is logged and the calling code path completes without throwing or producing an unhandled rejection

#### Scenario: Missing plugin directory disables capture instead of losing data silently
- **WHEN** `trackShortcutUsage` is `true` but the plugin's data directory is unavailable at load time
- **THEN** the plugin does not register the capture listener, and a warning is logged rather than counting presses in memory that will never be persisted
