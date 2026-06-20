## 1. CSS — Filter Button Styles

- [x] 1.1 Add `display: inline-flex`, `align-items: center`, `gap: 4px`, and `min-width: 90px` to `.hkc-filter-btn` in `styles.css`
- [x] 1.2 Add `.hkc-filter-btn--active` rule with `border-color: var(--interactive-accent)` and `color: var(--text-normal)`
- [x] 1.3 Add `.hkc-filter-chip` rule inheriting kbd look but with `border-bottom-width: 1px` and `min-width: auto`

## 2. JS — Dynamic Button Content

- [x] 2.1 Add `updateFilterBtn()` private method to `CheatsheetModal` that clears the button and either sets static label text (0 active) or appends one `.hkc-filter-chip` `<kbd>` per active modifier (in Mod→Shift→Alt→Ctrl order) plus a `▾` span
- [x] 2.2 Toggle `.hkc-filter-btn--active` class inside `updateFilterBtn()` based on `activeModifiers.size`
- [x] 2.3 Call `updateFilterBtn()` at the end of each checkbox `change` event handler (after updating `activeModifiers`)

## 3. Verification

- [x] 3.1 Build (`npm run build`) and load plugin in Obsidian — open modal, confirm default button shows "Modifiers" with no chips
- [x] 3.2 Check one modifier → button shows one chip + `▾` + accent border; dropdown still opens on click
- [x] 3.3 Check two modifiers → chips appear in canonical order, search box shrinks to accommodate
- [x] 3.4 Uncheck all → button reverts to "Modifiers" text, accent border removed
