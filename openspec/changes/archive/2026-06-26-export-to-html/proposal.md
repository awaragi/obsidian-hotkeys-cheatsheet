## Why

The "Save as HTML" button in the export dropdown is currently a disabled placeholder. Users need a way to share the cheatsheet as a portable, self-contained file that opens in any browser — independent of Obsidian.

## What Changes

- Enable the "Save as HTML" export dropdown item (remove disabled state)
- Add `src/ts/htmlExportTemplate.ts` — the self-contained HTML template with embedded CSS, own light/dark palette via `prefers-color-scheme`, and `{{TITLE}}`, `{{DATE}}`, `{{CONTENT}}` placeholders
- Add HTML content renderer: `renderHtmlSections(groups)` → HTML string for the grid
- Add `generateHtml()` method on `CheatsheetModal` — assembles the full HTML document from template + rendered sections
- Add `saveHtml()` method — triggers a native OS "Save As" dialog via `<a download>` blob URL; no vault involvement
- Wire the "Save as HTML" item click to `saveHtml()`

## Capabilities

### New Capabilities

- `html-export`: Generate and download a self-contained HTML cheatsheet file with embedded CSS, a header (title + export date), multi-column grid layout, and automatic light/dark theming via OS preference

### Modified Capabilities

- `cheatsheet-modal`: "Save as HTML" item transitions from disabled placeholder to active; no other requirement changes

## Impact

- `src/ts/cheatsheetModal.ts` — add `generateHtml()` and `saveHtml()`, enable the HTML dropdown item
- `src/ts/htmlExportTemplate.ts` — new file containing the HTML template string and `renderHtmlSections()` renderer
- `src/css/styles.css` — no changes (template uses its own CSS)
- No new dependencies
