## Context

Today's pipeline: `hotkeyManager.defaultKeys`/`customKeys` → `hotkeyCollector.buildHotkeyGroups()` (structural merge into `CategoryGroup[]`) → `resolveUsage()` (bolts per-entry usage counts onto that structure) → `GridRenderer` (renders, filtered live by `filterHotkeys.ts` against `CheatsheetState.searchQuery` + `activeModifiers`). The toolbar's filter dropdown currently renders four modifier checkboxes (`Mod`/`Shift`/`Alt`/`Ctrl`) wired 1:1 to `state.activeModifiers`.

This change adds two new, purely derived, per-entry yes/no signals — "does this entry's binding collide with another command's" and "does this entry's effective binding differ from Obsidian's shipped default" — surfaced only as two more checkboxes in that same dropdown. No new rendering.

## Goals / Non-Goals

**Goals:**
- Detect conflicts: entry-level `true` if any of the entry's bindings collides (same canonical signature) with a binding on a *different* command.
- Detect modified-from-default: entry-level `true` if the entry's effective binding set differs from `defaultKeys[id]` (added and/or remapped).
- Add two checkboxes to the existing filter dropdown, AND-combined with modifiers and search, using the dropdown's existing semantics.

**Non-Goals:**
- No badges, icons, or tooltips on hotkey rows — filter-only, `grid.ts` is untouched.
- No settings tab changes.
- No handling of fully-cleared defaults (entries the user emptied to zero live bindings) — these stay excluded from the cheatsheet per existing `hotkey-collector` behavior; that exclusion rule does not change.
- No new sort mode or dedicated audit/report view.
- No per-binding partial indication — a multi-binding entry where only one binding conflicts is simply `hasConflict: true` at the entry level.

## Decisions

**1. Entry-level boolean flags, not per-binding parallel arrays.**
Because badges were dropped in favor of filter-only surfacing, we never need to know *which* binding within a multi-binding entry conflicts or differs — only whether the entry as a whole passes the filter. Two flags: `hasConflict`, `isModifiedFromDefault`.
*Alternative considered:* per-binding arrays mirroring `bindingCounts` (e.g. `bindingConflicts: boolean[]`, index-aligned with `hotkeys`) — rejected as unneeded complexity with no per-binding UI to drive it.

**2. Conflict detection is a new resolver over the already-merged `CategoryGroup[]`, not inline in the collector.**
Shape mirrors `usageResolver.ts`: a pure `resolveConflicts(groups: CategoryGroup[]): ConflictResolution` builds a signature → command-id-list map (reusing `buildSignature` from `usage/usageTracker.ts` for canonical modifier ordering rather than reinventing it), then flags every entry with ≥1 binding whose signature maps to more than one distinct command id.
*Alternative considered:* computing conflicts inline inside `buildHotkeyGroups` — rejected because conflict detection is inherently a whole-dataset, cross-entry pass (every entry's bindings must be known before any collision can be detected), while `buildHotkeyGroups` builds entries one at a time during its merge loop. A separate pass over the finished `CategoryGroup[]` preserves the existing separation of concerns: collector = structural merge, resolvers = derived cross-cutting analysis.

**3. Diff-from-default detection lives inside `hotkeyCollector.ts`, not a separate resolver.**
Unlike conflicts, this only needs data the merge loop already has in scope per-entry: `defaultKeys[id]` versus that entry's own effective `hotkeys`. No cross-entry view required. Comparison: normalise both sides to canonical signatures (via `buildSignature`) and compare as sets, order-independent — `isModifiedFromDefault` is true iff the symmetric difference is non-empty. A command with no `defaultKeys[id]` entry at all is `isModifiedFromDefault: true` by definition (any effective binding on it is, by this data source, "added").
*Alternative considered:* a separate `diffResolver.ts` parallel to `usageResolver.ts` — rejected because it would require threading the raw `defaultKeys`/`customKeys` maps back out of the collector solely to hand them to a second pass, for no structural benefit.

**4. Filter wiring: two new checkboxes, AND-combined, reusing the existing dropdown's event pattern.**
`CheatsheetState` gains `conflictsOnly: boolean` and `modifiedOnly: boolean` alongside `activeModifiers`. `filterHotkeys.ts`'s `matchesFilters`/`matchesFlatItem` gate on them the same way the modifier check does (`if (state.conflictsOnly && !hasConflict(entry)) return false`). `toolbar.ts` adds two more `<label><input type=checkbox>` rows to the existing filter dropdown, wired with the same `checkbox.addEventListener("change", ...)` → state setter → `callbacks.onChange()` pattern already used for modifiers.

**5. Where the flags live.**
`isModifiedFromDefault` is stored directly on `HotkeyEntry` (types.ts) — the collector can compute it correctly on its own. `hasConflict` is *not* stored on `HotkeyEntry` — the collector has no cross-entry view to compute it correctly — instead `resolveConflicts` returns a lookup (e.g. `Set<string>` of conflicting entry ids) that `CheatsheetState`/`filterHotkeys.ts` consult alongside each entry, the same way `usageResolution` is consulted today rather than being baked into `HotkeyEntry`.

## Risks / Trade-offs

- [Risk] `isModifiedFromDefault` reads `true` for any command entirely absent from `defaultKeys` (no Obsidian-reported default at all), which may surprise users for plugin commands that ship their own default outside `hotkeyManager.defaultKeys`. → Mitigation: this matches the proposal's stated scope ("differs from what Obsidian's hotkeyManager reports as default"); revisit only if it becomes a real support question.
- [Risk] Conflict detection re-runs on every modal open rather than being cached, matching how `usageResolution` already behaves. For a typical vault (~250–400 assigned commands) this is negligible; flagged only in case a future vault with thousands of plugin commands makes memoization worth it.
- [Risk] The two checkboxes are AND-combined per product decision, so checking both together yields a narrow — often empty — result (a conflicting binding is not usually also a remapped one). → Accepted trade-off; the existing "No results" empty state already handles this.
- [Risk] With no badge, a user filtering to "Conflicts only" sees *that* an entry conflicts but not *which other command* shares the combo, and "Modified only" shows *that* something changed but not what the original default was. → Accepted as this iteration's explicit scope (per product decision to drop badges); a real information gap, worth flagging as a natural follow-up rather than silently dropping.

## Open Questions

- Should the filter button's active-state indicator (today: modifier chips, per `modifier-filter-chip-display`) do anything when only the two new checkboxes are active with zero modifiers checked, so the toolbar still visually signals a filter is on? Needs a small UI decision before `toolbar.ts` changes land; does not block the data-layer work.
- Exact checkbox label wording ("Conflicts only" / "Modified only" vs. alternatives) for `en.json`/`fr.json`/`es.json` — low-risk to finalize during implementation.
