## 1. System shortcut detection module

- [x] 1.1 Create `src/ts/usage/systemShortcuts.ts` exporting `isSuspectedSystemShortcut(signature: string): boolean` over a fixed set (`Mod+C`, `Mod+X`, `Mod+V`, `Mod+A`), no `obsidian` import
- [x] 1.2 Add `src/ts/usage/systemShortcuts.spec.ts` covering: each recognized signature returns `true`; an unrelated signature returns `false`; a recognized key with an extra modifier (e.g. `Mod+Shift+V`) returns `false`

## 2. Resolver integration

- [x] 2.1 Extend `OrphanSignature` in `src/ts/usage/usageResolver.ts` with `isSuspectedSystemShortcut: boolean`, computed via `isSuspectedSystemShortcut(signature)` when building each orphan
- [x] 2.2 Extend `src/ts/usage/usageResolver.spec.ts` with cases: an orphan signature matching the system-shortcut set is flagged `true`; a non-matching orphan is flagged `false`; a signature that IS matched to a bound entry is never surfaced as an orphan regardless of whether it's in the system-shortcut set

## 3. Sort/flat-list integration

- [x] 3.1 Extend `FlatHotkeyItem` in `src/ts/hotkeys/sortHotkeys.ts` with `isSuspectedSystemShortcut: boolean`; set from the orphan's flag in `sortByMostUsedShortcut`'s `orphanItems` mapping, and `false` for all bound-entry items
- [x] 3.2 Extend `src/ts/hotkeys/sortHotkeys.spec.ts` to assert the flag is threaded through correctly for both orphan and bound-entry rows

## 4. Rendering

- [x] 4.1 Add `modal.system_shortcut` (label, e.g. "System shortcut") and a short explanatory string (tooltip, e.g. "Handled by the operating system — can't be bound to a command") to every locale file in `src/ts/i18n/locales/` (`en`, `ar`, `es`, `fr`, `ja`)
- [x] 4.2 Update `renderFlatList` in `src/ts/modal/grid.ts` so `isSuspectedSystemShortcut` rows use the new label, a `hkc-entry-name--system` class, and a leading `lock` icon (`setIcon`) with a `title` tooltip, instead of the generic muted `no_command` treatment
- [x] 4.3 Add `.hkc-entry-name--system` styling in `src/css/styles.css`, layered on top of the existing `.hkc-entry-name--muted` look
- [x] 4.4 Run the plugin in a dev vault with `trackShortcutUsage` enabled, press `Cmd+V`/`Ctrl+V` (and one non-system unbound combo for contrast), switch to "By Most-Used Shortcut", and confirm the system-shortcut row is visually distinct from both bound entries and generic "No command" orphans

## 5. Verification

- [x] 5.1 Run `npm run typecheck` and the full unit test suite
- [x] 5.2 Confirm exports ("Save as Note" / "Save as HTML") remain unaffected — no usage data or system-shortcut styling leaks into exported output

## 6. Per-command labels, muted color, and expanded shortcut set

- [x] 6.1 Rework `src/ts/usage/systemShortcuts.ts` from a plain signature set to a `Record<string, TranslationKey>` map (`SYSTEM_SHORTCUT_LABEL_KEYS`); keep `isSuspectedSystemShortcut` and add `systemShortcutLabelKey(signature): TranslationKey | undefined`, both derived from the same map
- [x] 6.2 Export `TranslationKey` (`keyof Translations`) from `src/ts/i18n/i18n.ts` so the label map is type-checked against real locale keys
- [x] 6.3 Expand the recognized set to also cover `Mod+ArrowLeft/Right/Up/Down` and `Mod+Backspace`
- [x] 6.4 Update `src/ts/usage/systemShortcuts.spec.ts` for the expanded set and the new `systemShortcutLabelKey` function
- [x] 6.5 Add specific i18n keys (`modal.system_shortcut_copy`, `_cut`, `_paste`, `_select_all`, `_line_start`, `_line_end`, `_doc_start`, `_doc_end`, `_delete_line_start`) to all 5 locale files
- [x] 6.6 Update `renderFlatList` in `grid.ts` to resolve each system-shortcut row's label via `systemShortcutLabelKey(buildSignature(...))` instead of the generic `modal.system_shortcut` string
- [x] 6.7 Remove the `--text-warning` color override from `.hkc-entry-name--system` in `styles.css` so system-shortcut rows keep the same muted color as generic "No command" orphans, distinguished only by label text + lock icon
- [x] 6.8 Update `design.md` and the `system-shortcut-detection`/`shortcut-usage-display` delta specs to reflect the label-map design, expanded set, and muted-color decision; re-run `openspec validate --strict`
- [x] 6.9 Re-run `npm run typecheck`, `npm run lint`, and the full unit test suite
- [x] 6.10 Rebuild, redeploy to the dev vault, and manually verify: `Cmd+C`/`Cmd+V`/`Cmd+A`/arrow keys/backspace each show their own distinct label with a lock icon in the same muted color as a generic "No command" row

## 7. Platform-aware labels, undo/redo, word-jump, and select-to-line

- [x] 7.1 Confirm with the user (via AskUserQuestion) whether to include `Mod+Z`/`Mod+Shift+Z` despite them normally being real bound commands, and how to handle Mac/Windows label-accuracy mismatch — resolved: include undo/redo, and add real platform-aware labels
- [x] 7.2 Restructure `systemShortcuts.ts` into two label tables, `MAC_LABEL_KEYS` and `OTHER_LABEL_KEYS`, covering an identical signature set; `systemShortcutLabelKey(signature, isMac)` now takes platform as an explicit parameter (no `obsidian` import in this module)
- [x] 7.3 Add `Mod+Z`, `Mod+Shift+Z` (undo/redo), `Mod+Shift+ArrowLeft/Right` (select to line/word start/end), and `Alt+ArrowLeft/Right` (word jump on macOS) to the recognized signature set
- [x] 7.4 Re-map the existing `Mod+ArrowLeft/Right/Up/Down`/`Mod+Backspace` Windows/Linux labels to their actual Ctrl-based meaning (word/paragraph-wise), since `Mod` normalizes to `Ctrl` there and Windows conventions differ from macOS's `Cmd`-based line/document-wise meaning
- [x] 7.5 Update `src/ts/usage/systemShortcuts.spec.ts` for both label tables, including a test that every recognized signature has a label on both platforms
- [x] 7.6 Add the 13 new i18n keys (undo, redo, select-line-start/end, word-left/right, paragraph-up/down, delete-word, select-word-left/right, navigate-back/forward) to all 5 locale files
- [x] 7.7 Update `grid.ts` to pass `Platform.isMacOS` into `systemShortcutLabelKey`
- [x] 7.8 Update `design.md` and the `system-shortcut-detection` delta spec for the expanded set and platform-aware labels; re-run `openspec validate --strict`
- [x] 7.9 Re-run `npm run typecheck`, `npm run lint`, and the full unit test suite
- [x] 7.10 Rebuild, redeploy to the dev vault, and manually verify on macOS: `Cmd+Z`/`Cmd+Shift+Z`, `Option+←/→`, and `Cmd+Shift+←/→` each show a distinct, sensible label

## 8. Correct Alt+Arrow scope for Windows/Linux; add Option+Shift+Arrow word-select

- [x] 8.1 User correction: `Ctrl+Arrow` (not `Alt+Arrow`) is the real word-jump shortcut on Windows/Linux (already correctly mapped); confirmed via AskUserQuestion to drop the unverified `Alt+Arrow` → "Navigate Back/Forward" Windows/Linux guess entirely rather than keep it
- [x] 8.2 Remove `Alt+ARROWLEFT`/`Alt+ARROWRIGHT` from `OTHER_LABEL_KEYS`; `systemShortcutLabelKey`/`isSuspectedSystemShortcut` now both take `isMac` and no longer assume identical signature sets across platforms (`isSuspectedSystemShortcut` derived from `systemShortcutLabelKey(...) !== undefined`)
- [x] 8.3 Thread `isMac` into `resolveUsage(groups, counts, isMac)` in `usageResolver.ts` and its caller `CheatsheetState.load()` in `state.ts` (now imports `Platform` from `obsidian`, previously type-only), since detection itself is platform-dependent for the Alt-based entries, not just labeling
- [x] 8.4 Remove unused `modal.system_shortcut_navigate_back`/`_navigate_forward` i18n keys from all 5 locale files
- [x] 8.5 Add macOS-only `Shift+Alt+ARROWLEFT`/`Shift+Alt+ARROWRIGHT` (Option+Shift+Arrow, word selection) to `MAC_LABEL_KEYS`, reusing the existing `select_word_left`/`select_word_right` label keys already defined for Windows/Linux's `Mod+Shift+Arrow` — same concept, confirmed as the standard word-selection convention on that platform too
- [x] 8.6 Update `systemShortcuts.spec.ts` and `usageResolver.spec.ts` for the `isMac`-parameterized detection, macOS-only signatures, and the new call-site signature (`resolveUsage(groups, counts, isMac)`)
- [x] 8.7 Update `design.md` and the `system-shortcut-detection` delta spec to reflect platform-parameterized detection and the new macOS-only entries; re-run `openspec validate --strict`
- [x] 8.8 Re-run `npm run typecheck`, `npm run lint`, and the full unit test suite
- [x] 8.9 Rebuild, redeploy to the dev vault, and manually verify on macOS: `Option+←/→` and `Option+Shift+←/→` show distinct labels, and confirm no build/type errors from the `state.ts` → `Platform` import
