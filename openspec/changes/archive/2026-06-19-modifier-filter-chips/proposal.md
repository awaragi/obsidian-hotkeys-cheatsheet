## Why

The modifier filter button always shows static label text ("Modifiers ▾") regardless of selection state, giving no immediate visual feedback about which filters are active. Users must open the dropdown to check what's filtered.

## What Changes

- When one or more modifier keys are selected, the filter button replaces its label with flat `<kbd>` chips — one per active modifier — plus a `▾` chevron
- When nothing is selected, the button retains its current "Modifiers ▾" text
- The button gains a `min-width` so it holds its position in the toolbar; it grows naturally as chips are added (search box flexes to yield space)
- An active-state class (`.hkc-filter-btn--active`) applies an accent-colored border to signal that filtering is on

## Capabilities

### New Capabilities

- `modifier-filter-chip-display`: Visual chip representation of active modifier filters in the filter button, including active state styling and dynamic button content updates

### Modified Capabilities

- `cheatsheet-modal`: Filter button UI behavior changes — dynamic content rendering and active state class toggling on modifier selection

## Impact

- `src/ts/cheatsheetModal.ts`: Add `updateFilterBtn()` helper; call it on every checkbox change
- `src/css/styles.css`: Add `min-width` + flex layout to `.hkc-filter-btn`, add `.hkc-filter-btn--active` and `.hkc-filter-chip` classes
