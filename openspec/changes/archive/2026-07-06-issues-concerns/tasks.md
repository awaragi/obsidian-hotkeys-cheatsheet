## 1. Usage-data persistence error handling

- [x] 1.1 In [usageTracker.ts](../../../src/ts/usageTracker.ts), wrap the `adapter.write` call in `writeUsageData()` in a try/catch; on failure, log via `console.error` (using the existing `[Hotkeys Cheatsheet]` prefix convention from `hotkeyCollector.ts`) and return normally instead of rethrowing.
- [x] 1.2 Add a unit test to `usageTracker.spec.ts` asserting that a rejecting mock `adapter.write` does not cause `flushUsageData()` or `resetUsageData()` to throw/reject.

## 2. Missing plugin-directory handling

- [x] 2.1 Change `loadUsageData()` in `usageTracker.ts` to return `Promise<boolean>` indicating whether persistence is available (i.e. `pluginDir` was provided), and export a way for `main.ts` to read this (return value is enough since it's only called once at startup).
- [x] 2.2 In [main.ts](../../../src/ts/main.ts) `onload()`, only call `startCapture(this.app)` when `trackShortcutUsage` is `true` AND `loadUsageData` reported persistence available; when the setting is `true` but persistence is unavailable, log a `console.warn` explaining capture was skipped.
- [x] 2.3 Add/update unit tests in `usageTracker.spec.ts` for `loadUsageData`'s return value in both the available and unavailable cases.

## 3. Export overwrite-confirmation scoping

- [x] 3.1 In [cheatsheetModal.ts](../../../src/ts/cheatsheetModal.ts), replace the `pendingOverwrite: boolean` field with `pendingOverwrite: { path: string; expiresAt: number } | null`.
- [x] 3.2 In `exportNote()`, on first encountering an existing file at the resolved path, set `pendingOverwrite = { path, expiresAt: Date.now() + <notice duration constant> }` (extract the existing `5000` literal used in `new Notice(..., 5000)` into a named constant shared by both the timeout and the Notice duration).
- [x] 3.3 On a subsequent `exportNote()` call, only treat it as confirmed if `pendingOverwrite !== null && pendingOverwrite.path === path && Date.now() < pendingOverwrite.expiresAt`; otherwise treat it as a fresh attempt (re-raising the warning if a file exists at the new/current path).
- [x] 3.4 Ensure `pendingOverwrite` still resets to `null` in `onClose()` and after a successful export, per existing behavior.

## 4. Markdown table escaping

- [x] 4.1 Add an `escapeMarkdownTableCell()` helper (in `cheatsheetModal.ts` or a shared location alongside `escapeHtml()` in `htmlExportTemplate.ts`) that replaces `|` with `\|`. (Added to `htmlExportTemplate.ts` and imported into `cheatsheetModal.ts`, since it's obsidian-import-free there and directly unit-testable.)
- [x] 4.2 Apply it to `entry.name` when building each row in `generateMarkdown()`.
- [x] 4.3 Add a unit test (new or in an existing spec file covering export) verifying a command name containing `|` renders as an escaped, structurally-intact table row. (New `htmlExportTemplate.spec.ts`.)

## 5. Composed/dead-key exclusion from capture

- [x] 5.1 In `canonicaliseKeydown()` in `usageTracker.ts`, extend the early-return check to also ignore `evt.key === "Dead"`.
- [x] 5.2 Add a unit test to `usageTracker.spec.ts` asserting a `Dead`-key event (with a modifier held) is not captured.
- [x] 5.3 Live-tested on macOS with a Canadian CSA layout revealed the two-step `"Dead"` check alone was insufficient: Option+letter often composes directly to an accented/special character in one keydown (`Alt+@`, `Alt+ß`→uppercased `Alt+SS`, `Alt+æ`→uppercased `Alt+Æ` were still being recorded). Added `isComposedAltCharacter()`: when Alt is the sole non-Shift qualifying modifier and the resulting key is a single non-alphanumeric-ASCII character, treat it as composed text rather than a shortcut; does not apply when Ctrl/Meta is also held (macOS doesn't compose text in that case).
- [x] 5.4 Added unit tests for the single-step composed case (`ß`, `æ`, `@` with Alt only), confirmed a plain `Alt+letter` combo is still captured, and confirmed `Cmd+Alt+...` combos are still captured.

## 6. Settings disclosure copy

- [x] 6.1 Update `settings.usage_tracking.desc` in [en.json](../../../src/ts/i18n/en.json) to disclose that capture records any Ctrl/Cmd/Alt+key combination pressed anywhere in the app while enabled, not just recognized Obsidian hotkeys.
- [x] 6.2 Apply the equivalent wording update to [fr.json](../../../src/ts/i18n/fr.json) and [es.json](../../../src/ts/i18n/es.json).

## 7. Verification

- [x] 7.1 Run the full test suite and confirm all existing and new tests pass. (93/93 pass; `tsc --noEmit` and `npm run lint` also clean.)
- [ ] 7.2 Manually verify in Obsidian: trigger a simulated write failure (e.g. temporarily throw in a debug build) and confirm no console-level unhandled rejection/uncaught exception appears, only the logged warning/error.
- [ ] 7.3 Manually verify the export overwrite flow: export once (warned), switch the active file to a different folder containing its own existing `Hotkeys Cheatsheet.md`, export again, and confirm the second folder's file is NOT silently overwritten (its own warning appears instead).
- [ ] 7.4 Manually verify a command name containing `|` (if any installed plugin has one, or via a temporary test command) exports as a structurally correct Markdown table row.
