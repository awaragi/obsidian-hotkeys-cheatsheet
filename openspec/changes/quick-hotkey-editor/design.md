## Context

The cheatsheet is a read-only view over Obsidian's merged keymap (`app.hotkeyManager.defaultKeys`/`customKeys`, read in `hotkeyCollector.ts`). Rebinding still requires the user to leave the modal, open Settings → Hotkeys, and manually search for the command by name. A prototype (`src/ts/modal/jumpToHotkey.ts`) was built and manually verified against a live Obsidian vault: clicking an entry name opens Settings, switches to the Hotkeys tab, and successfully pre-fills that tab's search box.

Two undocumented internals make this work, neither present in `obsidian.d.ts`:
- `app.setting.open()` / `app.setting.openTabById("hotkeys")` — routing into Settings.
- The Hotkeys tab's search `<input type="search">`, found via `.vertical-tab-content-container input[type='search']` and driven by setting `.value` + dispatching a real `input` event (Obsidian's Setting/SearchComponent are plain DOM with real `addEventListener`, not a virtual-DOM diffing framework, so this is expected to keep working across versions barring a markup rewrite).

## Goals / Non-Goals

**Goals:**
- Let the user go from "looking at a hotkey in the cheatsheet" to "that hotkey's row in Obsidian's native editor" in one click.
- Degrade gracefully at every internal-API boundary: worst case is "Settings opens to the Hotkeys tab, unfiltered" — never a thrown error or a broken modal.
- Keep the cheatsheet itself strictly read-only; no in-modal rebind UI is introduced by this change.

**Non-Goals:**
- No inline/in-cheatsheet hotkey editing (no capture-key UI, no calling `hotkeyManager.setHotkeys`). That's a materially different, higher-risk feature (writes to the user's keymap) and is out of scope here.
- No per-binding filtering. Obsidian's native tab filters by command name, not by individual key combination, so a command with two bindings surfaces both rows — filtering to "just this one combo" isn't achievable against the native tab and isn't attempted.
- No new plugin setting to toggle this on/off — same "always on" posture as search/filtering elsewhere in the modal.

## Decisions

**Click target: the command name text, not the whole row or a separate icon.**
The row already shows hotkey `<kbd>` badges that are meaningful to read, not click; putting the handler on the name avoids a hit-target conflict and matches the existing search-highlight affordance already on that element. Orphan rows (`item.isOrphan`, rendered muted with no real command) are excluded — there's no command to jump to.

**Filtering by simulated search input (approach "A" from exploration), not DOM scroll+highlight (approach "B").**
(A) was prototyped and confirmed working live. (B) (find the matching `.setting-item` and `scrollIntoView`) was the more conservative fallback considered, but since (A) already works and matches the literal backlog intent ("auto-filter by selected hotkey"), it's the primary path. (A)'s failure mode (search input not found) is handled by the fail-soft guard below, so we don't lose the conservative-degradation property by choosing it.

**Every internal-API step fails soft and independently.**
```
app.setting missing?        → return, no-op (nothing opened; only if Obsidian's Settings API itself is gone)
setting.open() succeeds     → always attempt openTabById("hotkeys")
search <input> not found    → stop; Hotkeys tab stays open, just unfiltered
input found                 → set .value, dispatch real `input` event, bubbles: true
```
No exceptions should propagate out of `jumpToHotkey` under any of these conditions — each is a guarded early return, mirroring the existing defensive-guard pattern in `hotkeyCollector.collectHotkeys` (`if (!hm?.defaultKeys...) { console.warn(...); return [] }`).

**Fixed short delay before touching the DOM, not `requestAnimationFrame`.**
The prototype used `window.setTimeout(..., 50)` to let the Settings modal finish mounting before querying its DOM. A single `requestAnimationFrame` was considered but rejected — Settings modal construction involves multiple nested `Component.onload()` calls, plausibly spanning more than one frame, and a short timeout matches the existing precedent at `cheatsheet.ts` (`window.setTimeout(() => this.toolbar.focusSearch(), 30)`). 50ms is a judgment call, not a measured value — flagged as an open question below.

**Match by stripped display name (`entry.name`), not full raw command name or `id`.**
The cheatsheet already strips the category prefix (e.g. "Editor: Toggle bold" → "Toggle bold") for display. Obsidian's native search does a case-insensitive substring match against its own (unstripped) display name, so the stripped name still matches as a substring in the common case. Passing the full un-stripped name isn't available at the grid-rendering call site without threading the raw command name through in addition to the display name, which the current row-rendering signature doesn't carry — accepted as an approximation rather than a reason to widen the row's data shape.

## Risks / Trade-offs

- **[Risk]** Obsidian changes the Hotkeys tab's markup (class names) or switches its search box off plain DOM events in a future release → the search-input lookup silently stops filtering. **Mitigation**: fail-soft design means this degrades to "opens the tab, unfiltered" rather than an error; no user-facing crash. Documented in code comments as a known internals dependency to re-check on Obsidian major-version bumps.
- **[Risk]** `app.setting` itself is removed or renamed → the whole feature no-ops (click does nothing visible). **Mitigation**: same as above — guarded early return, no exception. Low likelihood; this API has been stable across the plugin ecosystem for years.
- **[Risk]** Two different commands share a display name substring (e.g. "Toggle bold" appears within multiple plugin commands) → the native search box shows more than one row, not just the intended one. **Mitigation**: acceptable — the user still lands in the right neighborhood and picks the correct row visually; this is a filter, not a deep link to a single row.
- **[Trade-off]** 50ms fixed delay is a guess, not a measurement. If it proves too short on slower machines (filter doesn't apply, tab opens unfiltered) or unnecessarily long, it's a one-line constant to tune post-ship; not worth over-engineering (e.g. polling/mutation-observer) for a fail-soft, low-stakes UI convenience.

## Open Questions

- Should the 50ms delay be validated against a slower machine/vault before shipping, or is "tune later if reports come in" acceptable given the fail-soft fallback makes the failure mode harmless? (Leaning: acceptable — proceeding with 50ms.)
