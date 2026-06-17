## Why

Obsidian's built-in hotkey settings page is an alphabetical list of 250+ commands — functional but not designed for understanding. Users have no quick way to see their full keymap at a glance, grouped by workflow. This plugin fills that gap with a live, categorised, searchable reference card that mirrors the JetBrains-style cheatsheet format.

## What Changes

- New Obsidian plugin that opens a modal displaying the user's currently assigned hotkeys
- Hotkeys are read live from Obsidian's runtime API (`defaultKeys` + `customKeys` merge)
- Commands are categorised by workflow (Editing, Navigation, Search, Files & Vault, Workspace) for core commands, and by plugin name for community plugin commands
- Modal includes a real-time search overlay
- Key badges are rendered OS-aware (⌘/Ctrl, ⌥/Alt, ⇧/Shift, ⌃/Ctrl)
- Responsive grid layout (CSS Grid, auto-reflow by viewport width)
- Accessible via ribbon icon and command palette
- i18n support (EN / FR / ES)

## Capabilities

### New Capabilities

- `hotkey-collector`: Reads and merges Obsidian's default and custom hotkey maps; filters to assigned-only; categorises each entry using a hybrid prefix-map + plugin-name strategy
- `cheatsheet-modal`: Modal UI that renders categorised hotkeys as a responsive grid with `<kbd>` badges, live search filtering, and OS-aware modifier display

### Modified Capabilities

_(none — this is a new plugin with no existing specs)_

## Impact

- **New files**: `src/ts/categories.ts`, `src/ts/hotkeyCollector.ts`, `src/ts/cheatsheetModal.ts`
- **Updated files**: `src/ts/main.ts` (wire up modal), `src/ts/settingsTab.ts` (add any settings), `src/css/styles.css` (modal layout and kbd styles), `src/ts/i18n/*.json` (UI strings)
- **Dependencies**: No new npm dependencies — uses only Obsidian API and DOM
- **APIs used**: `app.commands.commands`, `app.hotkeyManager.defaultKeys`, `app.hotkeyManager.customKeys`, `Platform.isMacOS`
