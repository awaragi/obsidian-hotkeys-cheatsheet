## Why

The plugin's source has grown to a point where `cheatsheetModal.ts` (425 lines) mixes UI construction, state management, filtering, and display-label logic, while pure business logic in `hotkeyCollector.ts` and `i18n.ts` is entangled with Obsidian and browser globals, making it impossible to unit test without a full runtime. Addressing this now, before new features land, keeps the codebase maintainable and gives us a safety net for future changes.

## What Changes

- Extract shared type definitions (`HotkeyBinding`, `HotkeyEntry`, `CategoryGroup`, `HotkeysCheatsheetSettings`) into a dedicated `types.ts` module
- Extract modifier/key display helpers from `cheatsheetModal.ts` into `keyDisplay.ts`; consolidate the duplicated `filterLabel` inline map
- Extract the hotkey filter predicate from `renderGrid()` into a pure `matchesFilters()` function in `filterHotkeys.ts`
- Decouple `hotkeyCollector.ts`: split `collectHotkeys()` into a thin Obsidian-API adapter and a pure `buildHotkeyGroups()` function that takes plain data
- Make `i18n.ts` testable by extracting a pure `translate(key, locale, vars?)` function alongside the existing `t()` wrapper
- Enable TypeScript `strict` mode and fix any newly surfaced errors
- Add ESLint + Prettier with `lint` and `format` npm scripts
- Add Vitest with ~40 test cases covering all pure business logic
- Replace `npm run dev` esbuild watch approach with `npm-watch`-based `watch` script that rebuilds and deploys on `src/` changes
- Replace `innerHTML` in `settingsTab.ts` with safe DOM construction

## Capabilities

### New Capabilities

- `unit-tests`: Vitest test suite with ~40 test cases covering all pure business logic modules (`keyDisplay`, `filterHotkeys`, `hotkeyCollector` pure layer, `categories`, `i18n`)
- `dev-watch`: `npm run watch` command using `npm-watch` that monitors `src/` for changes and automatically builds + deploys to the local vault

### Modified Capabilities

<!-- Internal refactoring only — no spec-level behavioral changes to existing capabilities -->

## Impact

- **`src/ts/`**: Three new modules (`types.ts`, `keyDisplay.ts`, `filterHotkeys.ts`); refactored `hotkeyCollector.ts` and `i18n.ts`; `cheatsheetModal.ts` shrinks from ~425 to ~300 lines
- **`src/ts/__tests__/`**: Five new test files
- **`tsconfig.json`**: `strict: true`
- **`package.json`**: new devDependencies (`vitest`, `eslint`, `@typescript-eslint/*`, `prettier`, `npm-watch`); new scripts (`test`, `lint`, `format`, `watch`)
- **Config files**: `.eslintrc.json`, `.prettierrc`, `vitest.config.ts`
- **No behavioral changes** to plugin functionality, UI, or settings
