## Context

The modifier filter button in `cheatsheetModal.ts` is created once with static text (`t("modal.filter_label")` → "Modifiers") and never updated. When filters are active, the only signal is the filtered hotkey list — there is no visual indicator on the button itself. The toolbar uses flexbox with `hkc-search-wrapper` at `flex: 1`, so the search box already yields space naturally as the filter button grows.

## Goals / Non-Goals

**Goals:**
- Replace button label with `<kbd>` chips for each active modifier when ≥1 is selected
- Restore static "Modifiers" text when nothing is selected
- Signal active filter state via accent-colored border on the button
- Maintain toolbar stability with a `min-width` on the button

**Non-Goals:**
- No clear/reset control on the button itself (user clears via dropdown checkboxes)
- No animation or transition on chip appearance
- No persistence of filter state between modal opens (already not persisted)

## Decisions

### 1. Flat chips, not full `hkc-kbd`

The existing `.hkc-kbd` class uses `border-bottom-width: 2px` for a 3D key-press look. Inside a button that already has its own border, stacking depth-on-depth creates visual noise. A `.hkc-filter-chip` class inherits the `hkc-kbd` base styles but overrides `border-bottom-width: 1px` and `min-width: auto` to keep chips compact and flat.

Alternative considered: reuse `hkc-kbd` as-is. Rejected — the 3D border inside a button reads as two nested interactive elements.

### 2. DOM helpers over innerHTML

The codebase exclusively uses Obsidian's DOM helpers (`createEl`, `createSpan`, `setText`, `.empty()`). The `updateFilterBtn()` helper will call `filterBtn.empty()` then repopulate — consistent with the rest of `cheatsheetModal.ts`, and avoids XSS risk from string interpolation.

### 3. Canonical mod order for chips

Chips are rendered in the fixed `modTokens` order (`Mod → Shift → Alt → Ctrl`) regardless of selection sequence. This prevents chips from reordering as the user toggles, keeping the button visually stable.

### 4. Chevron only in active state

The default state keeps the exact existing text `t("modal.filter_label")` ("Modifiers") with no chevron — as confirmed. In the active state, a `▾` span is appended after the chips to preserve the dropdown affordance.

### 5. `min-width` on `.hkc-filter-btn`

A `min-width` (≈90px) prevents the button from collapsing when chips are short (e.g. one "Alt" chip). The button can grow beyond `min-width` when multiple chips are present; the search wrapper absorbs the change via `flex: 1`.

## Risks / Trade-offs

- **Button width shift on selection**: The button will grow slightly when switching from text to chips. Mitigated by `min-width` ensuring the button never disappears entirely; the shift is bounded and expected.
- **Cross-platform chip text length**: On macOS, "Option" is the longest label (6 chars). On Windows, "Shift" is longest (5 chars). Neither causes problematic overflow at the expected 1–2 chip use case.
