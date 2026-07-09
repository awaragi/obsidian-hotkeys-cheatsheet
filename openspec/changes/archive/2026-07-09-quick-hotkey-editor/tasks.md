## 1. Harden the hotkey-editor-handoff module

- [x] 1.1 Rewrite `src/ts/modal/jumpToHotkey.ts` to production quality: drop "PROTOTYPE" framing from comments (replace with a permanent note documenting the undocumented-internals dependency per design.md), name the magic delay/selector as constants, and make each internal-API step (`app.setting` presence, `openTabById`, search-input lookup) an independently guarded early return per the `hotkey-editor-handoff` spec's fail-soft requirement.
- [x] 1.2 Add unit tests for `jumpToHotkey` (new `jumpToHotkey.spec.ts`) covering: `app.setting` missing (no-op, no throw), settings open + search input present (value set to the command name and an `input` event dispatched), and settings open + search input absent (no throw, no further action).

## 2. Finalize modal wiring

- [x] 2.1 In `src/ts/modal/grid.ts`, finalize the `onJumpToHotkey` callback wiring on entry-name rows: keep it excluded for muted/orphan rows, drop the "PROTOTYPE" comment framing in favor of a permanent one-line note if the intent isn't obvious from the code.
- [x] 2.2 In `src/ts/modal/cheatsheet.ts`, finalize passing `jumpToHotkey(this.app, name)` as `onJumpToHotkey`.
- [x] 2.3 In `src/css/styles.css`, finalize the `.hkc-entry-name--clickable` hover/cursor rule, dropping the "PROTOTYPE" comment framing.

## 3. Verify

- [x] 3.1 Run `npm run lint`, `npm test`, and `npm run build`; fix any failures.
- [x] 3.2 Manually verify in the dev vault (`npm run dev:deploy`): clicking a normal entry's name opens Settings on the Hotkeys tab filtered to that command; clicking an orphan row (in **By Most-Used Shortcut** sort) does nothing; hover affordance is visible.

## 4. Documentation

- [x] 4.1 Update `README.md`: move the "Quick hotkey editor" line from **Backlog** into the **Features** list, describing the actual shipped behavior (click a command name to jump to Obsidian's native Hotkeys tab, pre-filtered).
