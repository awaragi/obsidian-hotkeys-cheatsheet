## Context

A code review of the current codebase surfaced six hardening issues, none of which are new features (see `proposal.md`):

1. `writeUsageData()` in [usageTracker.ts](../../../src/ts/usageTracker.ts) has no error handling; a failed `adapter.write` becomes an unhandled promise rejection from the debounced flush, and an uncaught exception from `flushUsageData()` (called in `onunload`) or `resetUsageData()` (called from the settings reset button).
2. `loadUsageData()` is only called `if (this.manifest.dir)` in [main.ts](../../../src/ts/main.ts). If that's ever falsy, `usageFilePath` stays `null` forever, so `writeUsageData()` silently no-ops on every call — counts accumulate in memory and are discarded on every reload, with no signal to the user.
3. `pendingOverwrite` in [cheatsheetModal.ts](../../../src/ts/cheatsheetModal.ts) is a bare boolean, not scoped to the path it was raised for, and never expires — a confirmation granted for one target path can be silently "spent" against a different path if the active file changes between clicks, or reused long after the original warning is no longer meaningfully in the user's mind.
4. `generateMarkdown()` interpolates `entry.name` directly into a `| Command | Hotkey |` table cell with no escaping; a `|` in a command name (arbitrary, plugin-supplied) corrupts the table.
5. `canonicaliseKeydown()` doesn't exclude the `"Dead"` key, so composing accented characters with Option/Alt on international keyboard layouts is miscounted as an "Alt+Dead" shortcut.
6. The `settings.usage_tracking.desc` copy ("Record how often each shortcut is pressed...") doesn't disclose that capture is global — any Ctrl/Cmd/Alt+key press anywhere in the app, not just recognized Obsidian hotkeys.

## Goals / Non-Goals

**Goals:**
- Eliminate the unhandled-rejection / uncaught-exception paths around usage-data persistence.
- Make the missing-plugin-dir case observable instead of silently discarding data forever.
- Make the export overwrite confirmation path-scoped and time-bounded.
- Prevent Markdown table corruption from arbitrary command names.
- Stop counting composed/dead-key input as shortcut usage.
- Disclose the actual (global) scope of usage capture in the settings description.

**Non-Goals:**
- Not narrowing *what* gets captured beyond the dead-key exclusion (e.g. no allowlist/denylist for specific input contexts like password fields) — that's a larger scope-of-capture redesign, not a bugfix.
- Not changing the `usage-data.json` file format, default settings values, or any public plugin API/command IDs.
- Not adding new sort modes, UI panels, or other user-facing features.

## Decisions

**1. Swallow-and-log for `writeUsageData()` failures.**
Wrap the `adapter.write` call in try/catch inside `writeUsageData()` itself, logging via `console.error` with the existing `[Hotkeys Cheatsheet]` prefix convention (already used in `hotkeyCollector.ts`) and returning normally rather than rethrowing. This means `flushDebounced`, `flushUsageData()`, and `resetUsageData()` all become failure-safe by construction — no caller needs its own try/catch. Alternative considered: let callers catch — rejected because there are three independent call sites (debounce callback, `onunload`, settings reset button) and it's easy to miss one; centralizing in `writeUsageData()` is the single point of truth.

**2. Treat missing plugin dir as "persistence unavailable" and skip capture entirely.**
`loadUsageData()` returns a boolean (persistence available or not). `main.ts` only calls `startCapture()` when both `trackShortcutUsage` is `true` *and* persistence is available; when the setting is on but persistence isn't available, log a `console.warn` and skip starting capture (rather than counting into memory only to discard it every reload). Alternative considered: keep counting in memory anyway for the current session — rejected as pointless complexity for a case (`manifest.dir` unset) that shouldn't occur in normal desktop/mobile operation, and silently-lossy in-memory counting is exactly the confusing behavior this fix removes.

**3. Scope the overwrite-confirmation state to `{ path, expiresAt }` and tie its lifetime to the Notice.**
Replace the `pendingOverwrite: boolean` field with `pendingOverwrite: { path: string; expiresAt: number } | null`. On the second `exportNote()` call, only treat it as a confirmed overwrite if `existing`'s path matches the stored path *and* `Date.now() < expiresAt`. Set `expiresAt` to `Date.now() + NOTICE_DURATION_MS`, reusing the same duration already passed to `new Notice(..., 5000)` — so the confirmation window is exactly as long as the warning is visible on screen, which is the most intuitive lifetime for the user. Alternative considered: an arbitrarily longer/separate timeout constant — rejected as introducing a second magic number that could drift out of sync with the Notice duration.

**4. Escape only the table-breaking character (`|`) in Markdown-exported command names.**
Add a small `escapeMarkdownCell()` helper (mirroring the existing `escapeHtml()` in `htmlExportTemplate.ts`) that replaces `|` with `\|`, and apply it to `entry.name` in `generateMarkdown()`. Alternative considered: escape a broader set of Markdown syntax characters (`*`, `_`, backticks) — rejected as out of scope; those don't break the table structure, only `|` does, and over-escaping would visually mangle otherwise-fine command names.

**5. Exclude both the intermediate `"Dead"` state and single-step Option-composed characters.**
The literal `"Dead"` key (the two-step dead-key sequence, e.g. Option+E then E → "é") turned out not to be the only composition path: on many non-US layouts — confirmed live on macOS with a Canadian CSA layout — Option+letter composes directly to an accented/special character in one keydown (Option+S → "ß", Option+A → "æ", Option+2 → "@"), with no intermediate `"Dead"` event at all. Since macOS only performs this composition when Option is held without Cmd/Ctrl (those combinations are treated as app shortcuts instead), the fix adds a second check: when Alt is the sole non-Shift qualifying modifier and the resulting `evt.key` is a single character that isn't a plain ASCII letter or digit, treat it as composed text rather than a shortcut. Alternative considered: only match the literal `"Dead"` key — rejected once live testing showed it catches just the two-step case and leaves the (more common) single-step case fully unfiltered, which was the original bug report.

**6. Update `settings.usage_tracking.desc` across all three locales.**
Reword to state capture applies to any Ctrl/Cmd/Alt+key combination pressed anywhere in the app while enabled, not just Obsidian's own recognized hotkeys. Applied to `en.json`, `fr.json`, and `es.json` to keep locales in sync (existing project convention per `i18n.ts`'s fallback-to-English behavior for missing keys, though here all three already have the key).

## Risks / Trade-offs

- [Skipping capture entirely when persistence is unavailable changes observable behavior from "silently counts, silently loses it" to "doesn't count at all"] → Mitigation: this is strictly less surprising, and a `console.warn` gives developers/support a diagnosable signal; no real usage data is lost either way since it was never being persisted.
- [Tying the overwrite-confirmation expiry to the Notice's 5000ms duration is a fairly short window] → Mitigation: this matches the existing "Reset usage statistics" double-confirm pattern in `settingsTab.ts` (also 5000ms), so the behavior is consistent with an established precedent elsewhere in the plugin.
- [Translated copy for the updated settings description in `fr.json`/`es.json` is written by the implementer, not a native speaker or translation service] → Mitigation: keep the wording simple and structurally parallel to the existing translated strings; low risk given the short, non-idiomatic nature of the sentence.
- [Excluding Option-composed single characters means a genuine Alt+letter hotkey that happens to compose on a given international layout will not be tracked in usage stats] → Mitigation: accepted trade-off — such combos are rare (most Alt-based defaults pair Alt with Cmd, which is unaffected since macOS doesn't compose text when Cmd is held), and the alternative (leaving composed characters uncounted-as-noise) is exactly the bug being fixed.

## Migration Plan

No data migration needed — `usage-data.json`'s `{ version: 1, counts }` shape is unchanged, and no settings key changes shape or default. This ships as a normal patch/minor release; no rollback concerns beyond reverting the commit.

## Open Questions

None outstanding — all six issues have a settled approach above.
