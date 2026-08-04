## Why

In "By Most-Used Shortcut" sort mode, orphaned signatures (captured keypresses with no bound Obsidian command) all render identically with a "No command" label. Some of these — like `Cmd+V`/`Ctrl+V` (paste), `Cmd+C`/`Ctrl+C` (copy), `Cmd+X`/`Ctrl+X` (cut), `Cmd+A`/`Ctrl+A` (select all) — are OS/Electron-level shortcuts that will never bind to an Obsidian command, since the OS intercepts them before Obsidian's command system sees them. Showing these the same as genuinely free, bindable combinations misleads users into thinking they could assign a command to them.

## What Changes

- Add a lookup that flags a captured signature as a "suspected system shortcut" — starting with clipboard/select-all: copy, cut, paste, select-all. The existing signature format already normalizes `Cmd`/`Ctrl` into a single platform-agnostic `Mod` token (see `usageTracker.ts` signature canonicalisation), so this lookup is a fixed signature set (`Mod+C`, `Mod+V`, `Mod+X`, `Mod+A`) that applies identically on macOS, Windows, and Linux — no OS detection required.
- When resolving usage data, orphaned signatures matching this lookup SHALL be marked as suspected system shortcuts, distinct from other (possibly genuinely bindable) orphaned signatures.
- In "By Most-Used Shortcut" mode, pseudo-entries for suspected system shortcuts SHALL render with a visual treatment distinct from both bound entries and other "No command" orphans (e.g. a different label/style indicating it's a system-reserved combination, not just unbound).

## Capabilities

### New Capabilities
- `system-shortcut-detection`: Determines whether a given canonical modifier+key signature matches a known OS/Electron-level reserved shortcut (copy/cut/paste/select-all) that can never be bound to an Obsidian command.

### Modified Capabilities
- `shortcut-usage-display`: The "Orphaned signatures are surfaced only in By Most-Used Shortcut mode" requirement is extended so that orphaned pseudo-entries matching a suspected system shortcut render with a distinct visual treatment from other orphaned pseudo-entries.

## Impact

- `src/ts/usage/usageResolver.ts` — flag orphaned signatures matching the system-shortcut lookup.
- `src/ts/hotkeys/sortHotkeys.ts` — carry the flag through to the flat "most used" list.
- `src/ts/modal/grid.ts` — distinct rendering for suspected-system-shortcut pseudo-entries.
- `src/ts/i18n/locales/*.json` — new localized label/description strings.
- New module (e.g. `src/ts/usage/systemShortcuts.ts`) — pure signature-set lookup, unit-testable without mocking Obsidian.
