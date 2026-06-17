## Context

The plugin currently has an empty settings interface (about blurb only) and no user-configurable behaviour. The cheatsheet modal renders all category sections fully expanded with no way to collapse them. Both features are independent but ship together as they are small in scope.

## Goals / Non-Goals

**Goals:**
- Ribbon visibility controlled via a toggle in settings, applied immediately to the live ribbon element
- Each category section individually collapsible by clicking its heading
- Global Expand All / Collapse All buttons in the modal toolbar
- Search forces all sections open; clearing search restores pre-search collapse state
- All sections expanded on every modal open (no persistence)

**Non-Goals:**
- Persisting collapse state between modal opens or across Obsidian sessions
- Collapsing sections with zero search matches (they are already hidden by existing filter logic)
- Animating the expand/collapse transition (keep it simple)

## Decisions

### 1. Ribbon toggle: store reference from `addRibbonIcon`, toggle `.hide()` / `.show()`

**Decision**: Store the `HTMLElement` returned by `this.addRibbonIcon()` on the plugin instance. The settings tab calls `plugin.setRibbonVisible(bool)` which calls `.hide()` / `.show()` on the stored element and saves the setting.

**Rationale**: Obsidian's `HTMLElement` extensions include `.hide()` and `.show()` helpers. This avoids CSS class manipulation and works with Obsidian's own DOM helpers. The ribbon element reference is stable for the lifetime of the plugin.

**Alternative considered**: Re-registering / removing the ribbon icon on toggle. Rejected — `addRibbonIcon` does not return a handle that supports clean removal in all Obsidian versions; toggling visibility on the element is simpler and reversible.

---

### 2. Collapse state: `Set<string>` of collapsed category names on the modal instance

**Decision**: `CheatsheetModal` holds `private collapsedSections = new Set<string>()`. The set is empty on every `onOpen()` (all expanded). Toggling a section adds/removes its category name. `renderGrid()` checks membership to decide whether to render entries.

**Rationale**: A `Set` is the minimal structure needed — O(1) lookup, trivial add/remove. Category names are stable strings (produced by `hotkeyCollector`), safe to use as keys.

**Alternative considered**: Boolean map on each rendered DOM section. Rejected — collapse state must survive `renderGrid()` re-renders (triggered by search input), so it needs to live on the modal instance, not the DOM.

---

### 3. Section toggle: click handler on the heading element

**Decision**: Attach a `click` listener to `.hkc-category-heading`. On click, toggle membership in `collapsedSections` and call `renderGrid()`.

**Rationale**: The heading is already a distinct styled element. Clicking it is the most natural affordance. An arrow indicator (`▾` / `▸`) rendered as part of the heading text communicates state.

**Alternative considered**: A dedicated toggle button inside the heading. Rejected — adds DOM complexity and a larger click target on the heading itself is better UX.

---

### 4. Search override: snapshot + force-expand, restore on clear

**Decision**: When `searchQuery` transitions from empty to non-empty, snapshot `collapsedSections` into `private searchSnapshot: Set<string> | null`. While query is non-empty, `renderGrid()` treats all sections as expanded (ignores `collapsedSections`). When query clears, restore from snapshot and null it.

**Rationale**: This keeps the collapse state machine simple — `collapsedSections` is the single source of truth for non-search state. The snapshot is a temporary override, not a second state system. Sections with zero matches are already excluded by the existing filter logic, so no extra handling is needed for them.

**Snapshot timing**: snapshot is taken on the first keystroke (transition from `""` to non-empty), not on every keystroke. Clearing means `searchQuery === ""`, which restores and discards the snapshot.

---

### 5. Expand All / Collapse All: clear or fill `collapsedSections`

**Decision**: "Expand All" calls `collapsedSections.clear()` + `renderGrid()`. "Collapse All" adds every currently visible category name to `collapsedSections` + `renderGrid()`. Both buttons are disabled (greyed) when the search is active, since search forces all open anyway.

**Rationale**: Expanding all = empty set (all expanded is the default). Collapsing all = full set of category names. These are the two extreme states — no need for more logic.

## Risks / Trade-offs

**`renderGrid()` re-renders the full DOM on every search keystroke** → Already the case today. Adding a collapse check per section is O(n) on categories, not entries — negligible.

**Heading click and search compose** → While search is active, clicking a heading does nothing visible (force-expand overrides it). This could confuse users. Mitigation: disable the click handler (or ignore the click) while search is active, so the heading doesn't appear interactive when it has no effect.

**`addRibbonIcon` return type** → Typed as `HTMLElement` in Obsidian's API. `.hide()` / `.show()` are Obsidian DOM extensions present on all `HTMLElement` instances in plugin context. Risk is low but worth a smoke test.
