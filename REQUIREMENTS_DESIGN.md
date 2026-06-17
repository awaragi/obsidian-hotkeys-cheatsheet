# Hotkeys Cheatsheet — Requirements & Design

## Product Goal

Display a live, categorised, searchable reference card of a user's currently assigned Obsidian hotkeys. Read-only. Always reflects the real keymap.

---

## Target Users

| Persona | Need |
|---|---|
| **New user** | Discover what shortcuts exist and what they do, grouped by workflow |
| **Power user** | Audit their custom keymap at a glance; spot inconsistencies before going to Settings to fix them |

---

## Scope

### In
- Live hotkey data pulled from Obsidian's runtime API
- Assigned hotkeys only (no unassigned commands)
- Hybrid categorisation (see below)
- Modal UI with search and modifier filter
- Explicit ✕ close button on modal (in addition to Escape)
- Responsive HTML layout
- OS-aware key rendering (⌘ / Ctrl, ⌥ / Alt, ⇧ / Shift)
- Settings page with plugin about blurb
- i18n (EN / FR / ES)

### Out
- Hotkey editing or remapping from within the plugin
- Export (PDF, markdown, etc.)
- Roadmap / planning features
- Unassigned command listing

---

## Data Source

Obsidian exposes the following APIs on `app.hotkeyManager`:

```ts
app.commands.commands          // Record<id, Command> — all registered commands
app.hotkeyManager.defaultKeys  // Record<id, Hotkey[]> — Obsidian built-in defaults
app.hotkeyManager.customKeys   // Record<id, Hotkey[]> — user overrides
```

> **Do NOT use** `app.hotkeyManager.getHotkeys(id)` — it returns only user overrides,
> missing all built-in default hotkeys.
> **Do NOT use** `app.hotkeyManager.bakedHotkeys` — it is a reverse lookup
> (key string → command) used internally; not useful for our direction.

### Merge logic

```
effectiveKeys(id) =
  id in customKeys
    ? customKeys[id]          // user override (may be [] = explicitly cleared)
    : defaultKeys[id] ?? []   // fall back to built-in default
```

Filter: keep only commands where `effectiveKeys(id).length > 0`.

### Hotkey shape (confirmed)

```ts
interface Hotkey {
  modifiers: Modifier[]   // see table below — may be empty []
  key: string             // e.g. "P", "ArrowLeft", "F1", "l" (normalise to uppercase)
}
```

### Modifier tokens (all confirmed in the wild)

| Token | macOS display | Win/Linux display | Notes |
|---|---|---|---|
| `Mod` | `⌘` | `Ctrl` | Platform-primary modifier |
| `Meta` | `⌘` | `Win` | Explicit Command/Meta key — render same as `Mod` on Mac |
| `Ctrl` | `⌃` | `Ctrl` | Always the Control key — distinct from `Mod` |
| `Shift` | `⇧` | `Shift` | |
| `Alt` | `⌥` | `Alt` | |

`Mod` and `Ctrl` are distinct. A hotkey with `["Ctrl", "Mod"]` requires holding both simultaneously.

Empty `modifiers: []` means a bare key with no modifier (e.g. `F1`, `F2`).

Detection via `Platform.isMacOS` (Obsidian built-in).

### Key value normalisation

Key strings may be lowercase (e.g. `"l"`). Normalise to `toUpperCase()` for display.

---

## Categorisation (Hybrid)

Core Obsidian commands are categorised by curated prefix map.
Plugin commands are grouped by their plugin name (title-cased).

### Core prefix → category map (validated against real data)

| Command ID prefix | Category |
|---|---|
| `editor:*` | Editing |
| `markdown:*` | Editing |
| `properties:*` | Editing |
| `file-explorer:*` | Files & Vault |
| `file-recovery:*` | Files & Vault |
| `global-search:*` | Search |
| `switcher:*` | Navigation |
| `command-palette:*` | Navigation |
| `graph:*` | Navigation |
| `backlink:*` | Navigation |
| `bookmarks:*` | Navigation |
| `workspace:*` | Workspace |
| `app:*` | Workspace |
| `window:*` | Workspace |
| `theme:*` | Workspace |
| *(unknown prefix)* | Plugin name, title-cased |

`app:*` maps to Workspace — open-settings, open-help, go-back/forward, and toggle-sidebars are all app-shell concerns.

Category display order: Editing → Navigation → Search → Files & Vault → Workspace → (plugins alphabetically)

### Plugin name extraction

Command IDs follow the pattern `pluginId:command-name`.
Plugin name = title-case the segment before the first `:`.

```
"templater-obsidian:insert-template"  →  "Templater Obsidian"
"dataview:dataview-force-refresh"     →  "Dataview"
```

**Edge case — no colon (confirmed in the wild):**
Some core plugin commands have no colon in their ID (e.g. `insert-current-date`).
Fallback: parse the display name for a `"PluginName: command"` pattern.

```
id   = "insert-current-date"            (no colon)
name = "Templates: Insert current date"
         ─────────┬──────────────────
                  │
     split on ": " → group = "Templates"
     if no ": " in name → group = "Other"
```

---

## UI

### Entry point
- Ribbon icon (keyboard icon)
- Command palette: "Open Hotkeys Cheatsheet"

### Modal layout

```
┌─────────────────────────────────────────────────────────────┐
│  Hotkeys Cheatsheet                                      ✕  │
├─────────────────────────────────────────────────────────────┤
│  🔍 [search by name or key...]   [▾ Modifiers ▾]           │
├──────────────┬───────────────┬──────────────────────────────┤
│  EDITING     │  NAVIGATION   │  FILES & VAULT               │
│  ──────────  │  ───────────  │  ─────────────               │
│  ⌘B  Bold    │  ⌘O  Open     │  ⌘N  New note                │
│  ⌘I  Italic  │  ⌘P  Switcher │  ⌘S  Save                    │
│  ...         │  ...          │  ...                         │
├──────────────┼───────────────┴──────────────────────────────┤
│  TEMPLATER   │  DATAVIEW                                    │
│  ...         │  ...                                         │
└──────────────┴──────────────────────────────────────────────┘
```

### Close button

The modal header SHALL include a ✕ button that closes the modal. Escape also closes.

### Responsiveness

CSS Grid with `auto-fill, minmax(220px, 1fr)` — groups reflow automatically.

| Viewport | Columns |
|---|---|
| > ~900px | 3–4 |
| ~600–900px | 2 |
| < ~600px | 1 (stacked) |

### Search

- Input in the toolbar row (below header)
- Filters by **command name** (substring match) OR **key character only** (e.g. typing `b` matches any hotkey whose key is `B`, regardless of modifiers — so `⌘B`, `⌘⇧B`, `⌃B` all match)
- Modifiers are NOT matched in search — use the modifier filter for that
- Highlights matching text in command names
- `Escape` clears search if active, otherwise closes modal

### Modifier filter

- Dropdown in the toolbar row, next to the search input
- Contains a checkbox per distinct modifier token: `Mod`, `Shift`, `Alt`, `Ctrl`
- When one or more modifiers are checked, **only hotkeys whose modifier set includes ALL checked modifiers** are shown (AND logic — useful for finding e.g. all `⌘⇧` combos)
- When no modifiers are checked the filter is inactive and all hotkeys are shown
- Search and modifier filter compose — both apply simultaneously

### Key badge rendering

Each `Hotkey` renders as a row of `<kbd>` elements:

| Modifier token | macOS | Win/Linux |
|---|---|---|
| `Mod` | `⌘` | `Ctrl` |
| `Shift` | `⇧` | `Shift` |
| `Alt` | `⌥` | `Alt` |
| `Ctrl` | `⌃` | `Ctrl` |

Detection via `Platform.isMacOS` (Obsidian's built-in).

> **Important:** `Mod` and `Ctrl` are distinct tokens. A hotkey with `["Ctrl", "Mod"]` means the user holds *both* Control and Command simultaneously (confirmed in the wild — e.g. Toggle left sidebar). All modifiers in the array must be rendered.

---

## Settings Page

The plugin settings tab (accessible via Obsidian Settings → Community Plugins) SHALL include an about blurb at the top displaying:
- Plugin name
- Version (read from `manifest.json` via `this.manifest.version`)
- Author
- One-line description

No user-configurable options in v1 beyond the about section.

## Planned File Structure

```
src/ts/
├── main.ts                ✓ skeleton
├── settingsTab.ts         ✓ skeleton — add about blurb
├── i18n.ts                ✓ ready
├── i18n/en|fr|es.json     ✓ ready — add new strings
│
├── categories.ts          curated core prefix → category map
├── hotkeyCollector.ts     reads API, returns categorised HotkeyEntry[]
└── cheatsheetModal.ts     Modal subclass — renders grid, toolbar, badges

src/css/
└── styles.css             grid layout, kbd badges, toolbar, responsive
```

---

## Data Flow

```
app.hotkeyManager.defaultKeys  +  app.hotkeyManager.customKeys
                                          │
                                     merge logic
                              (customKeys overrides defaultKeys)
                                          │
                              filter: keys.length > 0
                                          │
                              for each command id
                                          │
                              ┌───────────┴───────────┐
                        core prefix?            unknown prefix
                              │                       │
                        curated category         plugin name group
                              │                       │
                              └───────────┬───────────┘
                                          ▼
                                  HotkeyEntry[]
                                  grouped by category
                                          │
                                          ▼
                                   CheatsheetModal
                                   header (title + ✕)
                                   toolbar (search + modifier filter)
                                   grid (categories + kbd badges)
```

---

## Experimentation Results

Validated against a live vault (257 commands, 41 default + 10 custom = 51 assigned, macOS).

| Question | Result |
|---|---|
| Correct API for full hotkey data | ✅ `defaultKeys` + `customKeys` merge — NOT `getHotkeys()` |
| `getHotkeys(id)` | ⚠️ Returns only user overrides — misses all built-in defaults |
| `bakedHotkeys` | ⚠️ Reverse lookup (key→command) — not useful for our direction |
| Plugin command ID pattern `pluginId:commandName` | ✅ Yes — no multiple colons found |
| Edge case: no colon in ID | ⚠️ Confirmed — core Templates plugin (`insert-current-date`) |
| Modifier tokens | ✅ `"Mod"`, `"Shift"`, `"Alt"`, `"Ctrl"`, `"Meta"` (5 total) |
| `Mod` and `Ctrl` are distinct | ✅ Confirmed — both appear together (e.g. Toggle left sidebar) |
| `Meta` token exists | ✅ Confirmed — used by next/previous tab defaults; render as `⌘` on Mac |
| Empty modifiers array | ✅ Confirmed — F1, F2 use `modifiers: []` (bare key, no badge) |
| Key values may be lowercase | ✅ Confirmed — `"l"` found; normalise with `toUpperCase()` |
| Special key format | ✅ Browser names: `ArrowLeft/Right/Up/Down`, `Enter`, `Tab`, `F1`, `F2` |
| Commands with multiple hotkeys | ✅ Confirmed — next/previous tab have 2 each; show all |
| Typical assigned count | ~51 defaults, ~50–100+ for power users with plugins |

---

## Open Questions

- How should conflicts (two commands sharing a key) be surfaced — or ignored for v1?
