# Hotkeys Cheatsheet

A live, searchable reference card for all your Obsidian keyboard shortcuts — opened instantly from the ribbon or command palette.

## What it does

Obsidian's built-in hotkey settings show a flat alphabetical list of 250+ commands. This plugin gives you a visual overview instead: a newspaper-style multi-column layout with every shortcut you have assigned, complete with `Cmd`, `Shift`, `Option`, `Ctrl` key badges rendered for your OS.

![Hotkeys Cheatsheet modal](docs/screenshot.png)

### Features

- **Live data** — reads your actual keymap at runtime (default hotkeys + your custom overrides), so it always reflects what's really assigned
- **Newspaper-style columns** — content flows top-to-bottom within each column then spills right; scroll horizontally to see more columns, or vertically on narrow viewports
- **Categorised sections** — core commands grouped by workflow (Editing, Navigation, Search, Files & Vault, Workspace); community plugin commands grouped by plugin name
- **Collapsible sections** — click any category heading to collapse or expand it; collapse/expand all with the icon button in the toolbar
- **Real-time search** — filter by command name or key character (type `b` to find all `Cmd B`, `Cmd Shift B`, etc.); collapsed sections auto-expand while searching and restore when cleared
- **Search clear button** — `×` button inside the search field clears the query instantly
- **Modifier filter** — dropdown to show only hotkeys that include specific modifiers (AND logic: select Cmd + Shift to find all `Cmd Shift` combos)
- **Modifier filter chips** — active modifier filters are shown directly on the filter button as flat `<kbd>` chips
- **Conflict & modified-from-default filters** — "Conflicts only" shows commands whose binding collides with another command's (Obsidian silently allows this — only one wins at runtime); "Modified only" shows commands whose binding differs from Obsidian's shipped default
- **Sort menu** — reorder the cheatsheet **By Category** (default), **By Modifier**, **By Key**, **By Most-Used Category**, or **By Most-Used Shortcut**; the last two need [usage tracking](#shortcut-usage-tracking-opt-in-fully-local) turned on
- **Usage indicators** *(opt-in)* — small bar-glyph + count badges next to each shortcut and category heading, showing how often it's actually been pressed — see [Shortcut usage tracking](#shortcut-usage-tracking-opt-in-fully-local)
- **Export menu** — toolbar export dropdown lets you save the cheatsheet as a note or export it as HTML
- **OS-aware badges** — `Cmd`/`Option` on macOS, `Ctrl`/`Alt`/`Win` on Windows/Linux
- **Special key icons** — arrow keys show ↑↓←→, Enter shows ↵, Backspace shows ⌫, Tab shows ⇥, etc.
- **Theme-compatible** — uses Obsidian CSS variables, works with any light or dark theme
- **Ribbon toggle** — hide or show the ribbon icon from Settings; the command palette entry always remains available
- **Header close button** — close the modal with the `✕` button in the header

### How to open it

- Click the keyboard icon in the ribbon (left sidebar)
- Or run **Open Hotkeys Cheatsheet** from the command palette (`Cmd P`)

### Keyboard behaviour

| Key | Action |
|-----|--------|
| `Escape` (search active) | Clears the search input and restores pre-search collapse state |
| `Escape` (search empty) | Closes the modal |

### Export options

Use the **Export** button in the modal toolbar to save the current cheatsheet in either format:

- **Save as Note** — creates an Obsidian note version of the cheatsheet
- **Save as HTML** — exports the cheatsheet as an HTML file

---

## Shortcut usage tracking (opt-in, fully local)

The plugin can optionally track how often you actually press each shortcut, so the cheatsheet can highlight what you use most and offer "most-used" sort modes. A few important points about what this does and doesn't do:

- **Off by default.** Nothing is recorded unless you explicitly enable **Track shortcut usage** in Settings.
- **Tracks key combinations, not commands.** It records that *"Cmd+Shift+K" was pressed 12 times* — never *which command* ran, never command names, never file names or content, never anything you type. It's counting physical key presses, not actions.
- **Not limited to hotkeys you've assigned.** Any modifier+key combination pressed anywhere in Obsidian is counted, even if it isn't bound to a command. This is intentional — it lets you spot combos you press habitually that aren't assigned to anything yet (these show up as "No command" entries in the **By Most-Used Shortcut** sort mode).
- **100% local — nothing is ever sent anywhere.** There are no network requests in this plugin, period. Counts are written to a single file, `usage-data.json`, inside this plugin's own folder in your vault (e.g. `.obsidian/plugins/hotkeys-cheatsheet/usage-data.json`). That file never leaves your machine.
- **Don't sync `usage-data.json` across devices.** Counts are specific to how *this machine* is used — syncing it (via Obsidian Sync, git, Syncthing, etc.) will mix or overwrite counts from unrelated devices. If your vault is synced, exclude this file (e.g. add `usage-data.json` to `.gitignore`, or to your sync tool's ignore list).
- **Fully resettable.** Settings → **Reset usage statistics** permanently clears the recorded counts (a second confirming click is required, since this can't be undone).

When enabled, usage shows up in the cheatsheet as small bar-glyph + count badges (e.g. `▅ 12`) next to each shortcut and category heading, scaled relative to your most-used entries — and unlocks the **By Most-Used Category** / **By Most-Used Shortcut** sort modes.

---

## Settings

Open **Settings → Hotkeys Cheatsheet** to configure:

| Setting | Default | Description |
|---------|---------|-------------|
| Show ribbon icon | On | Toggles whether the keyboard icon appears in the ribbon on startup. If disabled, the command palette entry still opens the cheatsheet. |
| Track shortcut usage | Off | Enables local-only shortcut usage tracking — see [Shortcut usage tracking](#shortcut-usage-tracking-opt-in-fully-local) above for exactly what this does and doesn't do. |
| Reset usage statistics | — | Permanently clears all recorded shortcut usage counts (click twice to confirm). Only relevant when usage tracking is on. |

---

## Development

### Prerequisites

- Node.js ≥ 18
- An Obsidian vault for testing

### Setup

```bash
# Install dependencies
npm install

# Copy .env.example and set your vault plugin path
cp .env.example .env
```

### Scripts

```bash
# Production build → dist/main.js
npm run build

# Development build (sourcemaps, watch mode)
npm run dev

# Copy dist/ to your local vault plugin directory
npm run deploy

# Build + deploy in one step
npm run dev:deploy

# Remove dist/
npm run clean
```

### Project structure

```text
src/
├── ts/
│   ├── main.ts                    Plugin entry point — ribbon icon, command, settings load/save
│   ├── settingsTab.ts             Settings tab — ribbon toggle, usage tracking toggle + reset, about blurb
│   ├── types.ts                   Shared types (HotkeyBinding, CategoryGroup, SortMode, settings shape)
│   │
│   ├── modal/                     The cheatsheet modal, split by concern
│   │   ├── cheatsheet.ts          CheatsheetModal — lifecycle; wires state/toolbar/grid/export together
│   │   ├── state.ts               CheatsheetState — search/filter/sort/collapse state + its invariants
│   │   ├── toolbar.ts             Toolbar — export/filter/sort dropdowns, search box, collapse-all toggle
│   │   ├── grid.ts                GridRenderer — category/flat rendering, entry rows, usage badges, search highlight
│   │   ├── export.ts              Markdown generation, vault write w/ overwrite confirm, HTML download
│   │   └── htmlExportTemplate.ts  Standalone HTML export template
│   │
│   ├── hotkeys/                   Collecting, categorising, formatting, sorting, filtering hotkey data
│   │   ├── hotkeyCollector.ts     Data layer — merges defaultKeys + customKeys, categorises, sorts
│   │   ├── categories.ts          Curated prefix → category map and display order
│   │   ├── keyDisplay.ts          OS-aware modifier/key display formatting
│   │   ├── sortHotkeys.ts         The 5 sort modes (category/modifier/key/most-used-*)
│   │   └── filterHotkeys.ts       Search + modifier-filter matching
│   │
│   ├── usage/                     Shortcut usage tracking pipeline
│   │   ├── usageTracker.ts        Capture keydown → signature, debounce persistence to usage-data.json
│   │   ├── usageResolver.ts       Joins hotkey entries against captured usage counts
│   │   └── usageGlyph.ts          Maps a usage count to one of 8 bar-glyph levels
│   │
│   └── i18n/
│       ├── i18n.ts                Locale detection and t() helper
│       └── locales/
│           ├── en.json            English strings
│           ├── fr.json            French strings
│           └── es.json            Spanish strings
└── css/
    └── styles.css                 All plugin styles (Obsidian CSS vars, no hardcoded colours)
```

### How hotkey data is collected

Obsidian exposes two internal maps on `app.hotkeyManager`:

```ts
app.hotkeyManager.defaultKeys  // Record<commandId, Hotkey[]> — Obsidian built-in defaults
app.hotkeyManager.customKeys   // Record<commandId, Hotkey[]> — user overrides
```

These are undocumented internal properties. A runtime guard checks for their existence and emits a console warning if they're missing (future-proofing against API changes).

Merge rule: if a command ID exists in `customKeys`, use those hotkeys (even `[]` — meaning the user cleared the default); otherwise fall back to `defaultKeys`.

> **Why not `getHotkeys(id)`?** It returns only user overrides, missing all built-in defaults (~41 hotkeys in a standard vault).

### Categorisation

Commands are categorised using a hybrid strategy:

1. If the command ID prefix (before the first `:`) matches a curated map → use the mapped workflow category
2. If the prefix is unknown → title-case it as a plugin group name
3. If there is no `:` in the ID → parse the display name for a `"PluginName: …"` pattern; fall back to "Other"

Core category order: Editing → Navigation → Search → Files & Vault → Workspace → (plugin groups, alphabetical)

### Localisation

The plugin UI is available in **English** (default), **French**, and **Spanish**. Language is detected automatically from Obsidian's locale setting.

To add a new language:

1. Copy `src/ts/i18n/locales/en.json` to `src/ts/i18n/locales/<code>.json` (e.g. `de.json`)
2. Translate all values — keys must stay identical to `en.json`
3. Import and register it in `src/ts/i18n/i18n.ts`:
   ```ts
   import de from "./locales/de.json";
   const locales = { en, fr, es, de };
   ```
4. Rebuild: `npm run build`

### Releases

1. **Bump the version** — choose `patch`, `minor`, or `major`:

   ```bash
   npm run release:prepare patch
   ```

   Updates `package.json` and `manifest.json`, then commits both as `"chore: bump version to X.Y.Z"`.

2. **Make your code changes** and commit them:

   ```bash
   git add -A && git commit -m "feat: ..."
   ```

3. **Publish** — pushes the branch, creates a bare version tag (e.g. `1.1.6`), and pushes the tag:

   ```bash
   npm run release
   ```

   The tag push triggers the GitHub Actions workflow, which builds and publishes the release.


---

## Backlog

Planned features and improvements for future releases:

- **Special character filter** — add filter input to quickly find and display special keys (arrows, Enter, Backspace, Tab, etc.)
- **Enhanced sort UI** — improve sorting controls to display active sort mode as prominently as modifier filters
- **Persist filter & sort state** — remember last filtering and sorting preferences via configurable settings (never remember, per-session, 5-minute timeout, or always remember)
- **Quick hotkey editor** — jump directly to the hotkey editor from any cheatsheet entry and auto-filter by selected hotkey
- **Improve display responsiveness** — enhance filtering performance and optimize rendering, especially during search interactions
- **Add links to the plugin** — include helpful links in the UI and documentation
- **Compact/comfortable density toggle** — switch between a denser layout (smaller row height, tighter columns) and the current spacing, for users with many commands or small windows - setting should be configurable in the plugin settings
- **Keyboard-only navigation within the modal** — arrow/Tab navigation between entries with a visible focus ring, without touching the mouse; pairs with the planned quick hotkey editor for an Enter-to-jump flow

