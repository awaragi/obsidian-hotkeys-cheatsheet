## Why

A code review of the current codebase (concentrated on correctness bugs and vulnerabilities, not style) surfaced six issues worth fixing before they cause silent data loss, corrupted exports, or user confusion: unhandled promise rejections around usage-data persistence, silent permanent loss of usage counts when the plugin directory is unavailable, an export "overwrite" confirmation that isn't scoped to the file it was raised for, Markdown table corruption from unescaped command names, usage-tracking noise from composed/dead-key input on international keyboard layouts, and a settings description that understates how broadly usage capture actually listens. None of these are new features — they're hardening fixes to existing behavior.

## What Changes

- Wrap `writeUsageData()` in error handling so a disk I/O failure (full disk, permission error, sync conflict) no longer produces an unhandled promise rejection from the debounced flush, `flushUsageData()` (called from `onunload`), or `resetUsageData()` (called from the settings tab's reset button).
- Detect when the plugin directory is unavailable (`manifest.dir` falsy) and avoid silently discarding all in-memory usage counts on every reload — either warn once via console/Notice or disable the tracking toggle with an explanation, instead of counting invisibly into a void.
- Scope the Markdown-note export's overwrite-confirmation state (`pendingOverwrite`) to the specific resolved target path rather than a bare boolean, and add an explicit expiry so a stale confirmation from a different folder/file can't cause a silent unconfirmed overwrite. **BREAKING**: changes the documented "second trigger overwrites unconditionally" behavior in the `note-export` spec to "second trigger overwrites unconditionally only for the same target path, within a bounded time window."
- Escape or otherwise neutralize table-breaking characters (starting with `|`) when interpolating command names into the Markdown export's `| Command | Hotkey |` table rows, matching the escaping already done in the HTML export path.
- Exclude the `"Dead"` key (produced when Option/Alt is used to compose accented characters on international keyboard layouts) from shortcut-usage capture, alongside the existing bare-modifier exclusion, so ordinary international typing doesn't pollute usage counts and the orphan-signatures list.
- Clarify the "Track shortcut usage" settings description to disclose that capture is global (any Ctrl/Cmd/Alt + key press app-wide while enabled), not limited to recognized Obsidian hotkeys.

## Capabilities

### New Capabilities
_None._

### Modified Capabilities
- `note-export`: the "Overwrite confirmation before replacing an existing note" requirement changes to scope the pending-overwrite state to the resolved target path and add a confirmation expiry window; the Markdown table-row generation requirement changes to require escaping of table-breaking characters in command names.
- `shortcut-usage-tracking`: the "Usage counts persist to a dedicated data file" requirement gains explicit error-handling behavior for a failed write (no unhandled rejection, and no silent, permanent loss of counts when the plugin directory is unavailable at load time); the "Captured keydown events are filtered to shortcut-like combinations" requirement gains an exclusion for the `"Dead"` key (composed/accented input on international layouts) alongside the existing bare-modifier exclusion; the "Usage tracking is disabled by default and user-configurable" requirement's settings description text changes to disclose that capture is global (any Ctrl/Cmd/Alt + key press app-wide while enabled), not limited to recognized Obsidian hotkeys.

## Impact

- **Affected code**: `src/ts/usageTracker.ts` (error handling, dead-key filtering), `src/ts/main.ts` (missing `manifest.dir` handling), `src/ts/cheatsheetModal.ts` (`exportNote()` overwrite-state scoping, `generateMarkdown()` escaping), `src/ts/i18n/*.json` (settings description copy).
- **No new dependencies.** No changes to the public plugin API, command IDs, or settings schema shape (only description copy changes).
