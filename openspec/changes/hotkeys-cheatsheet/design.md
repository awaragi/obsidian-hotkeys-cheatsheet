## Context

This is a new Obsidian plugin built on a clean skeleton (main.ts, settingsTab.ts, i18n, build pipeline all in place). The plugin has no existing implementation — only scaffold.

Obsidian's hotkey system has two internal stores:
- `app.hotkeyManager.defaultKeys`: built-in default hotkeys (41 in a standard vault)
- `app.hotkeyManager.customKeys`: user-defined overrides (sparse)

Experimentation confirmed:
- `getHotkeys(id)` returns only custom overrides — not suitable as the sole source
- `bakedHotkeys` is a reverse lookup (key string → command) — not useful for our direction
- Modifier tokens: `"Mod"`, `"Shift"`, `"Alt"`, `"Ctrl"`, `"Meta"` (5 total, all confirmed)
- `Mod` and `Ctrl` are distinct — `["Ctrl", "Mod"]` = hold both simultaneously
- `Meta` = explicit Command/Meta key; renders same as `Mod` on macOS
- Empty `modifiers: []` is valid (bare keys: F1, F2)
- Key strings may be lowercase — must normalise with `toUpperCase()`
- Multiple hotkeys per command are possible (e.g. next/previous tab have 2 each)
- ~51 assigned in a minimal vault; up to ~100+ with community plugins

## Goals / Non-Goals

**Goals:**
- Display all currently assigned hotkeys (default + custom merged) in a categorised modal
- Categorise core Obsidian commands by workflow via a curated prefix map
- Categorise community plugin commands by plugin name (auto-derived from command ID)
- Real-time search by command name OR bare key character (modifiers not matched in search)
- Modifier filter dropdown (multi-checkbox, AND logic) independent from search
- Explicit ✕ close button in header; Escape clears search first, then closes
- Render modifier badges OS-aware (Mac vs Win/Linux)
- Responsive grid layout that reflows across viewport widths
- Settings tab with plugin about blurb (name, version, author, description)
- No new npm dependencies

**Non-Goals:**
- Editing or remapping hotkeys from within the plugin
- Showing unassigned commands
- Export (PDF, markdown, etc.)
- Conflict detection or roadmap/planning features
- User-configurable settings beyond the about section in v1

## Decisions

### 1. Data source: manual merge over `getHotkeys()`

**Decision**: Merge `defaultKeys` and `customKeys` directly.

```
effectiveKeys(id) =
  id in customKeys ? customKeys[id] : (defaultKeys[id] ?? [])
```

**Rationale**: `getHotkeys()` only returns user overrides, producing only 10 results vs 51 from the full merge. The merge logic is simple and well-understood from experimentation.

**Alternative considered**: Use `bakedHotkeys` (pre-computed by Obsidian). Rejected — it's a reverse-lookup structure (hotkey string → command), not forward-lookup (command → hotkeys), and uses comma-serialised modifier strings which would require extra parsing.

---

### 2. Categorisation: hybrid prefix map + plugin name

**Decision**: Core commands (known prefixes) → curated workflow category. Unknown prefixes → plugin name derived from the command ID prefix, title-cased.

Category display order: Editing → Navigation → Search → Files & Vault → Workspace → plugins (alphabetically).

No-colon edge case (e.g. `insert-current-date`): fall back to parsing the display name for a `"PluginName: ..."` pattern. If no match, group as "Other".

**Rationale**: Core commands benefit from workflow grouping (a user thinks "I want to bold text", not "I want to call editor:toggle-bold"). Plugin commands are already self-labelled by their plugin name.

**Alternative considered**: Fully automatic categorisation via command name text analysis. Rejected — too brittle and unpredictable for a reference card.

---

### 3. UI surface: Modal

**Decision**: Full-screen-style modal opened via ribbon icon or command.

**Rationale**: A cheatsheet is a "glance and close" artefact. Modals suit this posture. The JetBrains reference card (the design inspiration) is a document you open, scan, and close — not a panel you work beside.

**Alternative considered**: Sidebar leaf (pinnable panel). Rejected — adds complexity (view registration, state persistence) without matching the intended usage pattern.

---

### 4. Rendering: pure DOM, no framework

**Decision**: Build the modal UI with Obsidian's `contentEl` DOM API and standard `createElement` calls. Style with CSS custom properties that inherit from Obsidian's theme.

**Rationale**: Obsidian plugins run in Electron and have direct DOM access. Adding a framework (React, Svelte) would bloat the bundle and complicate the build pipeline. The UI is essentially a static grid — no reactive state beyond search filtering.

---

### 5. Search matches key character only, not modifiers

**Decision**: The search input matches (a) command name substring, or (b) the bare key character of any hotkey. Modifier names are excluded from search matching.

**Rationale**: Typing "b" to find `⌘B` is intuitive and fast. Matching modifier names in search would produce confusing results (e.g. typing "mod" surfacing unrelated commands). The modifier filter dropdown is the dedicated control for modifier-based filtering.

**Escape behaviour**: First press clears the search input (if non-empty); second press (or if already empty) closes the modal. This is a standard pattern in search-heavy UIs.

---

### 6. Modifier filter uses AND semantics

**Decision**: Checking multiple modifiers shows only hotkeys that include ALL selected modifiers.

**Rationale**: AND semantics answer the most useful power-user question: "what have I already assigned to `⌘⇧`?" OR semantics would answer "anything using Mod or Shift" — a much larger, less useful set.

---

### 7. OS detection: `Platform.isMacOS`

**Decision**: Use Obsidian's built-in `Platform.isMacOS` to choose modifier display strings.

| Token | macOS | Win/Linux |
|---|---|---|
| `Mod` | `⌘` | `Ctrl` |
| `Meta` | `⌘` | `Win` |
| `Ctrl` | `⌃` | `Ctrl` |
| `Shift` | `⇧` | `Shift` |
| `Alt` | `⌥` | `Alt` |

Empty `modifiers: []` → render only the key badge, no modifier badges.
Key strings normalised via `.toUpperCase()`.

## Risks / Trade-offs

**`defaultKeys` and `customKeys` are not part of Obsidian's public plugin API** → They are accessed via `app.hotkeyManager` which is available in plugin context but undocumented. If Obsidian changes these internal property names, the collector breaks silently (returns 0 results). *Mitigation*: add a runtime guard that checks for property existence and shows a graceful "unable to read hotkeys" notice if missing.

**Prefix map is hand-curated** → New core Obsidian features may introduce unknown prefixes that fall through to the plugin-name catch-all. *Mitigation*: the catch-all renders them under a derived name, which is acceptable. The prefix map can be updated in future versions.

**Multiple hotkeys per command** → Show all. If a command has two bindings, both are shown as separate `<kbd>` rows within the same entry. Keeps the card accurate at the cost of slightly more vertical space.

## Migration Plan

Not applicable — this is a new plugin. No existing data or behaviour to migrate.

## Open Questions

- Should conflicts (two commands sharing a key) be surfaced in v1? Currently deferred — v1 is display-only.
