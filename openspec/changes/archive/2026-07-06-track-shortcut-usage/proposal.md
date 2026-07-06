## Why

Users have no visibility into which of their configured hotkeys they actually rely on versus which sit unused. Capturing raw shortcut key-press activity (opt-in, off by default) lays the groundwork for a future stats/heatmap display without committing yet to how that data will be presented.

## What Changes

- Add a `trackShortcutUsage` setting (default `false`) to enable/disable capture. No behavior runs unless explicitly enabled.
- When enabled, register a capture-phase `keydown` listener that canonicalises each keypress into a modifier+key signature (independent of any specific command — no reverse lookup against `hotkeyManager` happens at capture time).
- Persist per-signature press counts to a dedicated data file, separate from the plugin's main settings file, so usage data can grow/reset independently of settings.
- Debounce writes so counts aren't flushed to disk on every keystroke.
- Add a "Reset usage statistics" action in the settings tab that clears all stored counts (with a confirmation step, since it's destructive).
- Stop capturing and detach the listener immediately when the setting is turned off; existing counts are preserved (not cleared) when disabling.

Explicitly out of scope for this change: any UI to view the collected stats (ranked list, heatmap, "no command associated" resolution) — that is a separate future change. This change only covers capture and storage.

## Capabilities

### New Capabilities
- `shortcut-usage-tracking`: Opt-in capture of raw hotkey-signature press counts (setting toggle, capture-phase keydown listener, debounced persistence to a dedicated data file, and a reset action). Does not resolve signatures to commands or expose any stats UI.

### Modified Capabilities
(none — no existing spec's requirements change)

## Impact

- `src/ts/main.ts`: wire up listener lifecycle (register on enable/load, unregister on disable/unload).
- `src/ts/settingsTab.ts`: add toggle + reset button.
- `src/ts/types.ts`: extend `HotkeysCheatsheetSettings` with `trackShortcutUsage`.
- New module (e.g. `src/ts/usageTracker.ts`): signature canonicalisation, in-memory counters, debounced persistence.
- New persisted data file (separate from `data.json`) for usage counts, managed via the plugin's `manifest.dir` / adapter file APIs rather than `saveData()`/`loadData()` (which target the single `data.json`).
