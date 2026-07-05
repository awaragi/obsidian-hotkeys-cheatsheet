## Why

Once shortcut usage is captured (see the `track-shortcut-usage` change), the raw counts are inert without a way to see them. Users configuring or pruning hotkeys have no visibility into which ones they actually rely on versus which sit unused — this change adds that visibility directly into the existing cheatsheet modal, rather than as a separate view.

## What Changes

- Each hotkey entry gains a usage indicator — a single UTF-8 "eighths block" character (`▁▂▃▄▅▆▇█`) plus the raw press count — shown only when `trackShortcutUsage` is enabled. Bar height is continuous, scaled against the highest single-entry count. A never-pressed bound entry still renders (`▁ 0`) in its normal position — there is no separate "unused" bucket.
- Each category heading gains the same glyph+count treatment as an aggregate (sum of its entries' counts), scaled independently against the highest category total — not the entry-level scale, since a category sum would otherwise always peg near the top of the entry scale.
- The toolbar gains a sort control with three modes:
  - **By Category** (default) — current behavior: curated category order, entries alphabetical within each.
  - **By Most-Used Category** — categories reordered by aggregate total (descending); entries within each category also reordered by count (descending).
  - **By Most-Used Shortcut** — a flat, category-less list of all entries ranked by count (descending). This is the only mode that also surfaces captured signatures with no matching command binding (an orphaned/rebound shortcut), shown with the raw signature standing in for a name since there is no command to label it with.
- The sort control is always visible in the toolbar, but the two usage-based modes are disabled (present, non-selectable) when `trackShortcutUsage` is off — signaling to the user that enabling tracking unlocks them. With tracking off, only "By Category" is selectable and the modal is pixel-identical to today's behavior.
- Signature-to-command resolution (used to compute per-entry counts and to detect orphaned signatures) is always performed live against the current `hotkeyManager` state at render time — never cached — so a rebound or removed hotkey is reflected immediately and consistently with how usage data is stored (signatures only, no command IDs).
- Export ("Save as Note" / "Save as HTML") is unchanged: no usage indicators, counts, or sort-mode ordering are included in exported output, regardless of tracking state. Exports continue to reflect the existing category/alphabetical structure only.

## Capabilities

### New Capabilities
- `shortcut-usage-display`: Per-entry and per-category usage indicators (bar+count), the three-mode sort control and its reordering/visibility rules, and live signature-to-command resolution for both counts and orphaned-signature detection.

### Modified Capabilities
- `cheatsheet-modal`: toolbar gains a sort control; grid rendering now orders categories/entries according to the active sort mode instead of always using the fixed alphabetical/category order.

## Impact

- Depends on the `trackShortcutUsage` setting and the usage-counts data file introduced by the `track-shortcut-usage` change (not yet implemented). This change's capability is inert until that data exists — with tracking off or no data file present, behavior falls back to today's modal exactly.
- `src/ts/cheatsheetModal.ts`: toolbar sort control (three-way selector with two conditionally-disabled options), per-entry/category rendering augmented with bar+count, grid-building logic branches on active sort mode.
- `src/ts/hotkeyCollector.ts` (or a new module): join usage counts against live `collectHotkeys()` output; compute the two independent bar scales (entry-level, category-level); identify signatures with no matching entry (orphaned) for the flat sort mode.
- `src/ts/types.ts`: a sort-mode type/enum; entries and groups extended with optional resolved usage data (count, category aggregate).
- No new settings are required — the existing `trackShortcutUsage` toggle (from `track-shortcut-usage`) is sufficient to gate this feature's visibility.
