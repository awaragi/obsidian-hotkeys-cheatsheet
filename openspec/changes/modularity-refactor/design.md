## Context

The plugin is a small (~850 lines TS + CSS) Obsidian community plugin with no runtime dependencies. Its source is split across 7 modules in `src/ts/`. Three modules are problematic for maintainability and testing:

- `cheatsheetModal.ts` (425 lines) owns UI construction, collapse state, search, modifier filtering, and the key/modifier display-label maps — unrelated concerns sharing a file.
- `hotkeyCollector.ts` has all merge/normalize/categorize/sort logic inside `collectHotkeys(app)`, which immediately reads undocumented Obsidian internal APIs. There is no seam to test the logic without a live Obsidian instance.
- `i18n.ts` calls `detectLocale()` at module load time (reads `window.moment`), making the `t()` function impossible to invoke for a specific locale in a Node test environment.

The TypeScript config uses only `strictNullChecks` (not full `strict`), and there is no linter, formatter, or test runner.

## Goals / Non-Goals

**Goals:**
- Establish a clear separation between pure business logic and Obsidian/browser API access
- Make all pure functions independently unit-testable with Vitest (no Obsidian mock harness)
- Eliminate the one real code duplication (modifier label maps in `cheatsheetModal.ts`)
- Add linting, formatting, and a file-watch+deploy workflow
- Enable TypeScript `strict` mode

**Non-Goals:**
- No behavioral changes to plugin functionality, UI, or settings
- No incremental DOM rendering (full re-render on filter change is acceptable at current scale)
- No tests for DOM-bound code (`cheatsheetModal`, `main`, `settingsTab`)
- No new plugin features

## Decisions

### 1. Centralize types in `types.ts`

**Decision:** Move `HotkeyBinding`, `HotkeyEntry`, `CategoryGroup` (from `hotkeyCollector.ts`) and `HotkeysCheatsheetSettings`, `DEFAULT_SETTINGS` (from `settingsTab.ts`) to a new `src/ts/types.ts`.

**Rationale:** Both `cheatsheetModal.ts` and `hotkeyCollector.ts` consume the same binding/entry types; having them originate in `hotkeyCollector.ts` creates an accidental dependency from the UI layer into the data layer. A dedicated types file breaks this cycle. Settings types belong beside domain types, not inside the settings UI tab.

**Alternative considered:** Keep types in their origin files and use re-exports. Rejected — re-exporting from origin files is only marginally better and leaves the types scattered.

---

### 2. Extract pure display helpers into `keyDisplay.ts`; consolidate modifier label duplication

**Decision:** Move `MOD_LABEL_MAC`, `MOD_LABEL_WIN`, `modLabel()`, `filterLabel()`, `KEY_ICONS`, and `keyIcon()` to `src/ts/keyDisplay.ts`. Merge the inline map in `filterLabel()` with `MOD_LABEL_MAC` into a single `FILTER_LABEL_MAC` constant.

**Rationale:** These helpers have zero UI dependencies — they take a string and return a string. Extracting them removes ~65 lines from `cheatsheetModal.ts` and enables direct unit testing. The duplication between `filterLabel`'s inline map and `MOD_LABEL_MAC` is a maintenance hazard (Mac modifier names could diverge silently).

**Note on `Platform`:** `modLabel()` and `filterLabel()` use `Platform.isMacOS` from `obsidian`. The functions keep this dependency; tests will mock the `obsidian` module via Vitest's `vi.mock`.

---

### 3. Extract filter predicate into `filterHotkeys.ts`

**Decision:** Extract the entry-matching predicate from `renderGrid()` into `export function matchesFilters(entry, query, activeModifiers): boolean` in `src/ts/filterHotkeys.ts`.

**Rationale:** Filter logic is pure (no DOM, no Obsidian APIs) and is the most likely place for bugs (AND logic across modifiers, case sensitivity, key-exact vs name-substring). Extracting it makes it independently testable and readable.

---

### 4. Split `hotkeyCollector.ts` into adapter + pure layer

**Decision:** Extract all merge/normalize/categorize/sort/group logic from `collectHotkeys(app)` into a new `export function buildHotkeyGroups(defaultKeys, customKeys, commands): CategoryGroup[]`. Keep `collectHotkeys(app)` as a ~10-line adapter that reads the undocumented APIs and delegates. Also export `toTitleCase` and `categorise` for direct testing.

**Rationale:** `buildHotkeyGroups` becomes fully testable with plain fixture objects — no Obsidian runtime, no `(app as any)` casts required in tests. The undocumented API risk is isolated to the adapter and is no worse than before; it just has a smaller footprint.

**Alternative considered:** Inject a `HotkeyManager` interface instead. Rejected for this change — introduces a new abstraction boundary wider than needed for the refactor scope.

---

### 5. Make `i18n.ts` testable via `translate(key, locale, vars?)`

**Decision:** Add `export function translate(key, locale, vars?): string` as the pure core. Keep `t(key, vars?)` as a thin wrapper calling `translate(key, detectLocale(), vars)`. The existing public API is unchanged.

**Rationale:** `detectLocale()` is side-effectful (reads `window.moment`) and runs at module load time. Extracting `translate` gives tests a pure entry point — `translate('modal.title', 'fr')` — without mocking globals or reloading the module.

---

### 6. Vitest with `environment: 'node'`

**Decision:** Use Vitest (`environment: 'node'`). The only `obsidian` dependency in tested files is `Platform` in `keyDisplay.ts`, handled with `vi.mock('obsidian', ...)`.

**Rationale:** All tested logic is pure (strings, objects, sets). No DOM is needed. A node environment is simpler and faster than jsdom. `vi.mock` is the standard Vitest pattern for mocking external modules.

**Alternative considered:** Jest. Rejected — Vitest has native ESM support and zero config for TypeScript via esbuild transform, while Jest requires `ts-jest` or Babel.

---

### 7. `watch` npm package for file-watch + deploy workflow

**Decision:** Add the `watch` npm package as a dev dependency. Add `"dev:deploy:watch": "watch 'npm run dev:deploy' src"` script to `package.json`. This recursively monitors the `src/` directory and re-runs `dev:deploy` (dev build + deploy) on any file change.

**Rationale:** The `watch` package provides a simple CLI (`watch '<cmd>' <dir>`) that composes naturally with the existing `dev` and `deploy` scripts. No extra config key or wrapper is needed — the entire configuration is expressed in a single script line. `esbuild.config.mjs` is left untouched.

**Alternative considered:** esbuild `watch` mode. Rejected per explicit user preference; also would require modifying `esbuild.config.mjs` and does not automatically trigger the deploy step.

---

### 8. ESLint + Prettier with `@typescript-eslint`

**Decision:** Use legacy `.eslintrc.json` format with `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`. Pair with a minimal `.prettierrc`.

**Rationale:** The legacy config format has the widest compatibility with current TypeScript-ESLint versions. Flat config (`eslint.config.js`) would also work but requires ESLint 9+, which has less tooling ecosystem stability at this time.

## Risks / Trade-offs

- **Undocumented Obsidian APIs** — `collectHotkeys()` still uses `(app as any).hotkeyManager`. The adapter layer isolates the risk but does not eliminate it. A future Obsidian update could still break the plugin; the runtime guard mitigates user-visible impact (empty cheatsheet rather than crash).
- **`vi.mock('obsidian')` brittleness** — If `keyDisplay.ts` imports more from `obsidian` in the future, the test mock must be updated. Mitigation: keep the mock explicit and scoped to the test file.
- **`strict` mode errors** — Enabling `strict: true` may surface latent issues (primarily from `(app as any)` casts and optional chaining in adapter code). These must be fixed before CI passes. Mitigation: fix errors incrementally during the same PR.
- **`watch` deploy dependency** — `npm run deploy` reads `OBSIDIAN_PLUGIN_DIR` from `.env`. The watch workflow silently does nothing useful if this is not set. Mitigation: document in README.
