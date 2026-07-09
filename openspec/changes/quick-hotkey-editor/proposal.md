## Why

Rebinding a hotkey today means leaving the cheatsheet, opening Settings → Hotkeys, and manually typing the command name into that tab's search box to find the one row you came from — three steps to act on something you were just looking at. The cheatsheet already knows exactly which command each entry represents; it should hand that off to Obsidian's native hotkey editor instead of making the user re-find it.

## What Changes

- Each hotkey entry's command name becomes a click target. Clicking it opens Obsidian's Settings modal, switches to the **Hotkeys** tab, and pre-fills that tab's search box with the command's name so the matching row(s) are immediately visible — no in-app rebinding UI, no new modal; the user still rebinds through Obsidian's own native control.
- "Orphan" rows (unassigned key combinations shown in **By Most-Used Shortcut** with no bound command) are not clickable — there is no command to jump to.
- The jump routine reaches into two undocumented Obsidian internals (`app.setting.open`/`openTabById`, and the Hotkeys tab's search `<input>`). Every step SHALL fail soft: if a given internal isn't present or shaped as expected, execution stops at that step rather than throwing — worst case the user lands on a plain, unfiltered Hotkeys tab instead of a filtered one.
- No settings-tab toggle for this — it's always on, mirroring how search/filtering are always on elsewhere in the modal.

## Capabilities

### New Capabilities
- `hotkey-editor-handoff`: pure/isolated logic that opens Obsidian's Settings app to the Hotkeys tab and attempts to filter it to a given command name, with defensive fallbacks at each internal-API boundary.

### Modified Capabilities
- `cheatsheet-modal`: hotkey entry rows gain a click affordance (cursor + hover style) on the command name, wired to the new hotkey-editor-handoff capability; orphan rows are explicitly excluded from this affordance.

## Impact

- New module `src/ts/modal/jumpToHotkey.ts` (already prototyped) — formalize with tests and defensive guards.
- `src/ts/modal/grid.ts` — `GridRendererCallbacks` gains `onJumpToHotkey`; `renderHotkeyEntryRow` wires the click handler on non-muted rows.
- `src/ts/modal/cheatsheet.ts` — passes `jumpToHotkey(this.app, name)` into the grid renderer's callbacks.
- `src/css/styles.css` — `.hkc-entry-name--clickable` hover/cursor affordance.
- Unit tests for `jumpToHotkey`'s fallback behavior (missing `app.setting`, missing search input) using DOM/mock stubs.
- README: move this line from Backlog to Features once shipped.
