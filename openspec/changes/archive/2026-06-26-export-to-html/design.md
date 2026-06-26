## Context

The export dropdown already exists in the modal toolbar with "Save as HTML" rendered as a disabled placeholder. The infrastructure (dropdown, outside-click dismissal, pattern) is already in place. This change activates the HTML item and adds the generation + download pipeline.

Obsidian is an Electron app. Its renderer process is a Chromium browser context, so browser APIs (`Blob`, `URL.createObjectURL`, `<a download>`) work natively. No Node.js or Electron APIs are needed.

## Goals / Non-Goals

**Goals:**
- Generate a self-contained, portable HTML file from `this.groups` (full dataset, always)
- Embed all CSS in `<style>` — no external stylesheets or network requests
- Auto light/dark via `prefers-color-scheme` using an isolated CSS variable palette
- Header: `<h1>` title + export date line above the grid
- `<title>` tag with title and date for browser tab
- Trigger a native OS "Save As" dialog via `<a download>` Blob URL
- Filename default: `Hotkeys Cheatsheet.html`

**Non-Goals:**
- Vault involvement of any kind
- Any JavaScript in the exported HTML (pure CSS theming)
- Print stylesheet
- Interactive features (search, filter) in the exported file
- Matching the user's current Obsidian theme (fixed palette, not computed)

## Decisions

### Template as a TypeScript string constant

The HTML template lives in `src/ts/htmlExportTemplate.ts` as an exported string constant with `{{TITLE}}`, `{{DATE}}`, and `{{CONTENT}}` placeholders. A `fillTemplate(title, date, content)` helper replaces them.

**Why not `?raw` import of an `.html` file**: Would require an esbuild loader config change. String constant needs zero build config, is fully portable, and is easy to read and diff.

**Why not inline in `cheatsheetModal.ts`**: The template CSS will be 80–120 lines. Keeping it in a dedicated file prevents `cheatsheetModal.ts` from growing unwieldy.

### Own CSS variable palette — not computed from Obsidian

The template defines its own 7-variable palette in `:root` (light) and `@media (prefers-color-scheme: dark)` override. No `getComputedStyle` calls, no Obsidian variables.

```
Light palette                  Dark palette
──────────────────────         ──────────────────────
--bg:         #ffffff           --bg:         #1e1e2e
--bg-2:       #f4f4f5           --bg-2:       #2a2a3c
--border:     #e4e4e7           --border:     #3f3f52
--text:       #18181b           --text:       #cdd6f4
--text-muted: #71717a           --text-muted: #9399b2
--accent:     #7c3aed           --accent:     #cba6f7
--kbd-bg:     #e4e4e7           --kbd-bg:     #313244
```

**Why fixed palette over computed**: Simpler, no runtime DOM inspection, file looks the same on any machine regardless of active Obsidian theme.

### HTML renderer: `renderHtmlSections()` pure function

Takes `groups: CategoryGroup[]`, returns an HTML string. Reuses the same `hkc-*` class names as the modal — the template CSS targets the same selectors, just with the new palette variables. Modifier labels use `modLabel()` (OS-aware), key display uses `keyIcon()`.

Multiple bindings per command: joined with ` / ` separator span between `hkc-hk-row` divs.

### Layout: same `columns: 300px` multi-column CSS

CSS `columns` is standard browser CSS — no Obsidian dependency. The exported HTML grid looks identical to the modal grid in layout, just with the new palette.

### Save: `<a download>` Blob URL

```ts
const blob = new Blob([html], { type: "text/html" });
const url  = URL.createObjectURL(blob);
const a    = document.createElement("a");
a.href     = url;
a.download = "Hotkeys Cheatsheet.html";
a.click();
URL.revokeObjectURL(url);
```

Triggers Electron's native "Save As" dialog. No vault state changes. If the user cancels, nothing happens.

**Why not Electron's `dialog.showSaveDialog`**: Requires `electron.remote` which Obsidian plugins don't expose officially. The `<a download>` approach is the standard, sandboxed, Obsidian-safe way.

## Risks / Trade-offs

- **Electron "Save As" dialog behaviour**: In Electron, `<a download>` may trigger the dialog or auto-save to the Downloads folder depending on Electron/Chromium version and user settings. Behaviour is consistent with how other Obsidian plugins handle downloads — acceptable.
- **Fixed palette diverges from user's theme**: A dark-theme Obsidian user exports and gets a light HTML file on a light-mode OS. The `prefers-color-scheme` follows OS setting, not Obsidian setting. Low impact — the file is still readable and well-styled.
- **Template maintenance**: If class names in `cheatsheetModal.ts` change in the future, `htmlExportTemplate.ts` styles may drift. Mitigated by keeping both in the same repo and using the same `hkc-*` namespace.
