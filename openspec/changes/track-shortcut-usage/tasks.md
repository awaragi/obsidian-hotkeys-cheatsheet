## 1. Types & Settings Data Model

- [ ] 1.1 Add `trackShortcutUsage: boolean` to `HotkeysCheatsheetSettings` in [types.ts](../../../src/ts/types.ts) and default it to `false` in `DEFAULT_SETTINGS`
- [ ] 1.2 Define the usage data file shape (`UsageData = { version: 1; counts: Record<string, number> }`) in a new module

## 2. Signature Canonicalisation & Capture Filter

- [ ] 2.1 Create `src/ts/usageTracker.ts` with a pure `canonicaliseKeydown(evt: KeyboardEvent): string | null` function: returns `null` for modifier-only keys, `evt.repeat` events, and events that don't qualify as shortcut-like (per design.md's filter — needs `ctrlKey`/`metaKey`/`altKey`, or key in the bare-key allowlist); otherwise returns the canonical `Mod+Ctrl+Meta+Shift+Alt+KEY` signature using `Keymap.isModifier`
- [ ] 2.2 Add `usageTracker.spec.ts` unit tests covering: modifier combo captured, plain letter/digit not captured, allowlisted bare key (e.g. `Escape`) captured, bare modifier press ignored, `repeat` events ignored, consistent signature for repeated identical presses

## 3. In-Memory Counters & Debounced Persistence

- [ ] 3.1 In `usageTracker.ts`, add an in-memory counters map, an `increment(signature)` function, and a `debounce`-wrapped (via `obsidian`'s exported `debounce`, `resetTimer: false`) flush function that writes `{ version: 1, counts }` to a dedicated file via `app.vault.adapter` at a `normalizePath`d path under `manifest.dir`
- [ ] 3.2 Add a load function that reads the usage data file at startup (tolerating a missing file → empty counters) and merges it into the in-memory map
- [ ] 3.3 Add a `resetUsageData()` function that clears in-memory counters and writes the empty state immediately (bypassing the debounce)
- [ ] 3.4 Add unit tests for load (missing file → empty state), increment + debounce flush behavior, and immediate reset, using a mocked vault adapter

## 4. Capture Listener Lifecycle

- [ ] 4.1 Add `startCapture(app)` / `stopCapture()` functions in `usageTracker.ts` that add/remove the capture-phase `window` `keydown` listener, wired to `canonicaliseKeydown` + `increment`
- [ ] 4.2 In [main.ts](../../../src/ts/main.ts) `onload()`, call `startCapture` only when `trackShortcutUsage` is `true` after settings load; call `stopCapture` and flush in `onunload()`

## 5. Settings Tab UI

- [ ] 5.1 Add a toggle in [settingsTab.ts](../../../src/ts/settingsTab.ts) for `trackShortcutUsage` that calls `startCapture`/`stopCapture` immediately on change (no reload required) in addition to persisting the setting
- [ ] 5.2 Add a "Reset usage statistics" button/action with a confirmation step before calling `resetUsageData()`
- [ ] 5.3 Add new i18n keys (`settings.usage_tracking.label`, `settings.usage_tracking.desc`, `settings.usage_tracking.reset_label`, `settings.usage_tracking.reset_confirm`, etc.) to [en.json](../../../src/ts/i18n/en.json), [es.json](../../../src/ts/i18n/es.json), and [fr.json](../../../src/ts/i18n/fr.json)

## 6. Verification

- [ ] 6.1 Run the full test suite and confirm existing tests still pass alongside new ones
- [ ] 6.2 Manually verify in Obsidian: toggle on → press a shortcut → data file created/updated; toggle off → listener stops, prior data retained; reset → data file cleared after confirmation
