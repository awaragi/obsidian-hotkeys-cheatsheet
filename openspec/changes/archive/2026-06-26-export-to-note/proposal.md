## Why

Users want a persistent, shareable record of their Obsidian hotkeys. The modal is great for quick reference but disappears on close — exporting to a vault note gives a durable, searchable cheatsheet that lives alongside their notes.

## What Changes

- Add an **Export** dropdown button to the cheatsheet modal toolbar
- Implement **Save as Note** — renders the full hotkey cheatsheet as a Markdown table note and saves it to the vault
- Add a **Save as HTML** placeholder button (disabled, labeled "coming soon") for future implementation
- On save: use the active file's parent folder as destination, fallback to vault root; filename is `Hotkeys Cheatsheet.md`
- If the file already exists: show a confirmation notice before overwriting
- After save: show an Obsidian notice with the saved file path

## Capabilities

### New Capabilities

- `note-export`: Export the full hotkey cheatsheet as a Markdown note with one table per category, saved to the vault

### Modified Capabilities

- `cheatsheet-modal`: Add export toolbar controls (Export dropdown with Note and HTML options) to the existing modal UI

## Impact

- `src/ts/cheatsheetModal.ts` — add export dropdown to toolbar, implement note export logic
- `src/css/styles.css` — add styles for export dropdown and its items
- `src/ts/i18n/en.json` (and other locales) — add translation keys for export UI strings
