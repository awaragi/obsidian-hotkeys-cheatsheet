## Why

The original CSS Grid layout placed all category sections in equal-height grid rows, causing short sections (Navigation, Search) to inherit the height of tall neighbours (Editing), wasting large amounts of vertical space. A newspaper-style multi-column layout fills space naturally and matches how users scan a reference card.

## What Changes

- Replace `display: grid` with CSS `columns` (multi-column) on `.hkc-grid`
- Content flows top-to-bottom within a column before spilling into the next
- `column-fill: auto` (greedy fill) so columns pack fully before starting a new one
- `height: 100%` + `overflow-x: auto` for true horizontal newspaper scroll; falls back to `overflow-y: auto` when content overflows vertically (single-column edge case)
- `break-after: avoid` on `.hkc-category-heading` prevents orphaned headings at column bottoms — sections themselves are free to flow across column boundaries
- Category headings made larger (`font-ui-small`), bolder (`700`), and full-contrast (`text-normal`) to stand out in the denser layout

## Capabilities

### New Capabilities

_(none — this is a pure CSS layout change with no new functional capabilities)_

### Modified Capabilities

- `cheatsheet-modal`: Visual layout of the category grid changes from CSS Grid rows to CSS multi-column flow; heading style updated

## Impact

- **Modified files**: `src/css/styles.css` only
- **No TypeScript changes** — DOM structure is unchanged
- **No new dependencies**
