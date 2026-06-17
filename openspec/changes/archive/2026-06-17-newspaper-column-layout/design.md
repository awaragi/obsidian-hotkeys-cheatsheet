## Context

The cheatsheet modal renders category sections (heading + hotkey entries) inside a scrollable container. Previously this used `display: grid` with `repeat(auto-fill, minmax(220px, 1fr))`, which places sections into equal-height grid rows. Short sections inherit the row height of their tallest neighbour, leaving large gaps of unused space.

The DOM structure — `.hkc-grid` containing `.hkc-section` elements, each with an `.hkc-category-heading` and `.hkc-entry` rows — is unchanged. This is a CSS-only change.

## Goals / Non-Goals

**Goals:**
- Sections pack into columns vertically with no wasted row-height gaps
- Content flows top-to-bottom within a column, then spills into the next (newspaper style)
- Categories with many entries (Editing, Workspace) fill a column before shorter ones start beside them
- Headings never orphan at the bottom of a column alone
- Single-column fallback remains usable (vertical scroll instead of horizontal)

**Non-Goals:**
- Changing the DOM structure or TypeScript logic
- Perfectly equal column heights (not needed; greedy fill is preferred)
- Custom column count controls or user settings

## Decisions

### 1. CSS multi-column (`columns`) over CSS Grid

**Decision**: Replace `display: grid` with `columns: 220px` on `.hkc-grid`.

**Rationale**: CSS multi-column is the only native CSS mechanism that flows content vertically-first into columns. Grid and Flexbox both place items left-to-right. Masonry grid (CSS Grid Level 3) is not available in Electron/Obsidian's Chromium version at time of writing.

**Alternative considered**: JavaScript column-balancing (measure section heights, distribute into N columns manually). Rejected — adds runtime complexity and a resize observer for no gain over native CSS behavior.

---

### 2. `column-fill: auto` (greedy) over `column-fill: balance` (default)

**Decision**: Use `column-fill: auto` so each column fills completely before the next begins.

**Rationale**: With `balance` (the CSS default when no height is set), the browser distributes content evenly, which can leave the last column sparse. With a fixed `height: 100%` and `column-fill: auto`, the first column fills to the modal height, then the second, etc. — true newspaper behaviour.

**Alternative considered**: Leave `column-fill` at default (balance). Rejected — balance mode with a constrained height produces the same uneven result as before for very long sections.

---

### 3. `break-after: avoid` on heading only, not `break-inside: avoid` on the whole section

**Decision**: Apply `break-after: avoid` to `.hkc-category-heading` only. Do not apply `break-inside: avoid` to `.hkc-section`.

**Rationale**: `break-inside: avoid` on the whole section prevents any column break within the section. For large sections (Editing: 20+ entries, Workspace: 20+ entries) this forces the entire block to jump to a new column, leaving large gaps in the previous column — exactly the problem being solved. `break-after: avoid` on the heading alone ensures only the heading + first entry stay together; subsequent entries can flow freely across column boundaries.

**Alternative considered**: `break-inside: avoid` on section. Rejected — reproduces the gap problem for tall sections.

---

### 4. Horizontal scroll with vertical fallback

**Decision**: `.hkc-grid` uses `overflow-x: auto; overflow-y: auto; height: 100%`.

**Rationale**: With a fixed height and `column-fill: auto`, columns naturally overflow horizontally. `overflow-x: auto` exposes a scrollbar when there are more columns than fit the modal width. `overflow-y: auto` (rather than `hidden`) ensures that in the single-column edge case (very narrow modal), content that exceeds the column height is still reachable via vertical scroll instead of being silently clipped.

## Risks / Trade-offs

**CSS multi-column and flexbox children** → `.hkc-section` uses `display: flex`. Some browsers have historically had rendering quirks with flex children inside multi-column containers. Obsidian runs on a fixed Electron/Chromium version, so this is low risk but worth smoke-testing.

**Heading orphan prevention is best-effort** → `break-after: avoid` is a hint, not a guarantee. Browsers may ignore it under extreme space constraints. In practice this is not an issue for the section sizes observed.

**Horizontal scroll discoverability** → Users may not immediately notice there are more columns to the right. The scrollbar provides the affordance; no additional indicator is added in this change.
