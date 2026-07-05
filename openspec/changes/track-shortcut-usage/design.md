## Context

The plugin currently only *reads* hotkey bindings (`app.hotkeyManager.defaultKeys` / `customKeys`, undocumented internals, already guarded in [`hotkeyCollector.ts`](../../../src/ts/hotkeyCollector.ts)) to render the cheatsheet. It has no mechanism to observe when a key is actually pressed.

This change adds that observation layer only: capture raw key-press signatures and persist counts. It deliberately does **not** resolve signatures to commands or expose any UI for viewing the data — that's a follow-up change. Keeping capture/storage decoupled from command resolution means bindings can be rebound or removed over time without needing migration logic here; resolution becomes a stateless, display-time concern for the next change.

## Goals / Non-Goals

**Goals:**
- Opt-in (default off), zero overhead when disabled.
- Observe real key presses directly, independent of *how* Obsidian's own command dispatch works internally (no dependency on the `Scope`/`Keymap` stack behavior, no monkey-patching `executeCommandById`).
- Persist counts keyed by a canonical modifier+key signature only — no command IDs, no reverse lookups, no dependency on `hotkeyManager` at capture time.
- Survive plugin reloads; debounced writes so normal typing doesn't cause a disk write per keystroke.
- Provide a way to reset all collected data.

**Non-Goals:**
- Any UI to display/rank/heatmap the collected data (future change).
- Resolving a signature to a command ID, or tagging "no command associated" (future change — happens at display time against live `hotkeyManager` state, per the decision already made in exploration).
- Distinguishing *how* a command was triggered (hotkey vs. palette vs. ribbon) — this change only ever looks at raw `keydown` events, never `executeCommandById`.
- Time-windowed/decaying stats (last 30/90 days). Storage is a flat running total per signature; retention policy is deferred to the display change.

## Decisions

### Decision: Capture via a capture-phase `window` `keydown` listener, not `app.scope`
Obsidian exposes a public `Scope`/`Keymap` API (`app.scope.register(modifiers, key, fn)`), but scopes form a stack ("only one scope is active at a time... scopes may define parent scopes and inherit hotkeys") and it's unverified from public typings alone whether `app.scope` sees a key while, say, the editor or a modal has pushed its own scope — which is precisely where most hotkey usage happens. A `window.addEventListener('keydown', fn, { capture: true })` listener sees every keydown unconditionally, before any handler further down the tree can stop propagation, so it has no dependency on scope-stack internals. It also never touches `app.commands`/`executeCommandById` (undocumented), so this feature adds no new internal-API surface beyond what `hotkeyCollector.ts` already uses for display.

**Alternative considered**: registering on `app.scope` for every known binding. Rejected — introduces a dependency on `hotkeyManager` at capture time (which we explicitly want to avoid per the storage decision below) and has unverified behavior across the scope stack.

### Decision: Only capture signatures that look like shortcuts, not plain typing
A raw `keydown` listener sees every keystroke, including normal typing. Recording every letter/digit key would flood storage with noise and isn't "shortcut usage" by any reasonable definition. Filter: capture an event only if
- at least one of `ctrlKey`, `metaKey`, or `altKey` is true (covers `Mod`, `Ctrl`, `Meta`, `Alt` combos regardless of `Shift`), **or**
- the non-modifier key itself is in a fixed allowlist of keys that are meaningful as bare shortcuts in Obsidian: `Escape`, `Tab`, `Enter`, `Delete`, `Backspace`, `ArrowUp/Down/Left/Right`, `Home`, `End`, `PageUp`, `PageDown`, `F1`–`F12`.

A bare `Shift+letter` (e.g. typing a capital `H`) is therefore **not** captured — it's indistinguishable from ordinary typing and Obsidian itself has no bare-`Shift` command hotkeys of that shape. Events where `evt.key` itself is a modifier (`Control`, `Shift`, `Alt`, `Meta`) are always ignored (no key to record yet). `evt.repeat` (key-repeat while held down) is ignored — count one press, not one per repeat tick.

### Decision: Signature format
Canonical string: fixed modifier order `Mod, Ctrl, Meta, Shift, Alt` (matching the order already used for display in [`keyDisplay.ts`](../../../src/ts/keyDisplay.ts)), each checked via the public static `Keymap.isModifier(evt, modifier)`, joined with `+`, followed by the uppercased `evt.key`. E.g. `Mod+Shift+B`. This is an internal-only contract (write and read both live in this plugin), so it doesn't need to match Obsidian's own internal hotkey string format — it only needs to be self-consistent so a later display feature can invert it against `hotkeyManager` bindings using the same canonicalisation rule.

### Decision: Separate data file, not `data.json`
Obsidian's `loadData()`/`saveData()` read/write a single `data.json` shared with plugin settings. Usage counts have a different lifecycle (grow continuously, reset independently, no reason to round-trip through settings on every save) so they're stored in their own file via the public `Vault.adapter` (`read`/`write`/`exists`) at a path under `manifest.dir` (e.g. `${manifest.dir}/usage-data.json`, via `normalizePath`). Shape: `{ version: 1, counts: Record<string, number> }` — a version field costs nothing now and avoids a painful migration later if the format ever needs to change.

### Decision: Debounced, throttled persistence
Use Obsidian's public `debounce(cb, timeout, resetTimer)` helper (already exported from the `obsidian` package) rather than a hand-rolled timer. Use `resetTimer: false` (throttle-like: fires at most once per interval even under continuous input) rather than `true` (pure debounce, which could defer indefinitely during a long typing/shortcut burst and risk losing counts on an unexpected shutdown). Also flush on `onunload()` as a best-effort final save.

### Decision: Reset is immediate, not debounced
"Reset usage statistics" in the settings tab clears in-memory counters and writes the empty state to disk immediately (not through the debounced path), since it's a rare, explicit, already-confirmed destructive action — no reason to add latency or risk a stale debounced write racing after a reset.

## Risks / Trade-offs

- **[Risk]** A capture-phase global listener runs on *every* keydown across the entire app, including normal typing → potential input latency if the handler does anything expensive. **Mitigation**: handler does only cheap synchronous work (a few boolean checks + string concat + map increment); no DOM queries, no command/hotkey resolution at capture time.
- **[Risk]** The "looks like a shortcut" filter (Decision above) is a heuristic, not a source of truth — it will occasionally miss a legitimate bare-key command hotkey outside the allowlist, or a plugin-defined bare-modifier binding. **Mitigation**: allowlist covers the common non-modifier Obsidian shortcuts; this can be revisited once real usage data / feedback exists. Documented explicitly as a deliberate trade-off, not an oversight.
- **[Risk]** Best-effort flush on `onunload()` may not complete if Obsidian tears down the plugin synchronously before an async write finishes. **Mitigation**: throttled interval keeps the on-disk state reasonably fresh regardless (bounded staleness ~ the throttle interval), so a missed final flush loses at most a small window of counts, not everything.
- **[Trade-off]** Storing raw signatures with no command resolution means a signature whose binding was later removed/rebound becomes unresolvable noise until the (future) display feature labels it "no command associated." This is accepted per explicit product direction — resolution is deliberately deferred to display time.

## Open Questions

None blocking — the allowlist in the "looks like a shortcut" decision can be adjusted post-implementation without any data migration, since it only affects what's captured going forward, not the storage format.
