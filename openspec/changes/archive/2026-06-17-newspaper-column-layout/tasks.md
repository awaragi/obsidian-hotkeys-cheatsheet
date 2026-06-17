## 1. CSS Layout

- [x] 1.1 Replace `display: grid` with `columns: 220px` and `column-gap: 20px` on `.hkc-grid`
- [x] 1.2 Add `column-fill: auto` and `height: 100%` to `.hkc-grid` for greedy column fill
- [x] 1.3 Set `overflow-x: auto; overflow-y: auto` on `.hkc-grid` for horizontal scroll with vertical fallback
- [x] 1.4 Remove `align-content: start` from `.hkc-grid` (no longer applicable)
- [x] 1.5 Remove `grid-column: 1 / -1` from `.hkc-no-results` (no longer in a grid context)

## 2. Section & Heading Styles

- [x] 2.1 Remove `break-inside: avoid` from `.hkc-section`; replace `gap` with `margin-bottom: 20px`
- [x] 2.2 Add `break-after: avoid` to `.hkc-category-heading` to prevent heading orphans
- [x] 2.3 Update `.hkc-category-heading` font: `font-ui-small`, `font-weight: 700`, `color: var(--text-normal)`

## 3. Responsive Fallback

- [x] 3.1 Update `@media (max-width: 600px)` breakpoint: set `columns: 1` (removes horizontal scroll on narrow viewports)

## 4. Build & Smoke Test

- [x] 4.1 Run `npm run build` — confirm no errors
- [ ] 4.2 Deploy to local vault and reload Obsidian
- [ ] 4.3 Verify content flows top-to-bottom before spilling to next column
- [ ] 4.4 Verify WORKSPACE and other tall sections pack into columns without leaving gaps
- [ ] 4.5 Verify category headings do not orphan at column bottoms
- [ ] 4.6 Verify horizontal scroll reveals additional columns
- [ ] 4.7 Verify narrow modal falls back to single-column vertical scroll
