## Context

The cheatsheet modal renders hotkeys from `this.groups: CategoryGroup[]` — an in-memory data structure populated once on modal open. All export logic can work directly from this data without touching the DOM.

The modal toolbar currently has: search input, modifier filter dropdown, and collapse/expand toggle. Export controls need to fit into this toolbar without crowding it.

Obsidian plugin context: file writes use `app.vault` APIs. The active file is `app.workspace.getActiveFile()`. Obsidian provides a `Notice` class for transient user-facing messages.

## Goals / Non-Goals

**Goals:**
- Export the full hotkey cheatsheet as a Markdown note saved to the vault
- Save to the current active file's folder (fallback: vault root)
- Warn before overwriting an existing file at that path
- Show a toolbar dropdown with "Save as Note" (active) and "Save as HTML" (disabled placeholder)

**Non-Goals:**
- DOM cloning or HTML export (placeholder only — no implementation)
- Respecting active search/filter state in the export (always full data)
- Persisting export location preferences
- Exporting to external filesystem paths outside the vault

## Decisions

### Data source: `this.groups`, not the DOM
Generate Markdown by iterating `this.groups` directly rather than cloning `this.gridEl`.

**Why over DOM clone**: The DOM reflects current UI state — collapsed sections are absent, search highlights are embedded, interactive class names leak into the output. Data-driven rendering is clean, complete, and decoupled from UI state.

### Markdown format: one table per category
```markdown
# Hotkeys Cheatsheet

*Exported from Obsidian on 2026-06-26*

## Editor

| Command | Hotkey |
|---------|--------|
| Toggle bold | `Ctrl` + `B` |
| Open file | `Ctrl` + `O` / `Ctrl` + `Shift` + `O` |
```

Key choices:
- `#` heading for the document title, `##` per category
- Table columns: Command name | Hotkey
- Multiple bindings on one command: joined with ` / ` in the Hotkey cell
- Individual modifier+key tokens wrapped in backticks, joined with ` + `
- Generation timestamp in a subtitle line

**Why tables over lists**: More scannable for a cheatsheet; consistent column alignment aids at-a-glance lookup.

### Save location: active file folder → vault root
```ts
const folder = app.workspace.getActiveFile()?.parent?.path ?? "/";
const fullPath = folder === "/" ? filename : `${folder}/${filename}`;
```

**Why**: Saves the note "where the user is working" with no extra prompting. Vault root is a safe fallback. No dialog needed for the common case.

### Overwrite: confirm via Notice + re-trigger pattern
When `fullPath` already exists, show a Notice with a "Click to overwrite" action rather than a blocking modal dialog.

Implementation: Use Obsidian's `new Notice(msg, duration)`. For the confirm flow, display a first Notice with an instruction; on a second export trigger, bypass the check. A simpler approach: show a Notice "File exists — export again to overwrite" and store a `pendingOverwrite` flag on the class. On second export trigger within a short window, write unconditionally.

**Why not a modal dialog**: Keeps the UI lightweight. A blocking confirm modal requires additional boilerplate and is heavier UX for a non-destructive action (the note can be recovered from vault history).

### UI: Export dropdown, reuse filter-dropdown pattern
Add an "Export ↓" button to the right side of the toolbar (before the collapse toggle). On click, show a dropdown with two items:
- **Save as Note** — active, triggers note export
- **Save as HTML** — disabled, labeled with a "coming soon" tooltip

Reuse `.hkc-filter-dropdown` pattern (position: absolute, outside-click to dismiss) for consistency.

**Why dropdown over two buttons**: Keeps the toolbar uncluttered. Future HTML export slots in without adding another button.

## Risks / Trade-offs

- **Overwrite UX with flag**: The two-trigger overwrite pattern is slightly unconventional. If the user closes and reopens the modal between triggers, the flag resets — they'd need to trigger export twice again. Acceptable for the scope.
- **No folder picker**: Users working across multiple folders may find the active-file heuristic unexpected. Mitigated by showing the full path in the success Notice.
- **Markdown table width**: Long command names in tables can be wide. No mitigation needed — Obsidian's table renderer handles overflow.
