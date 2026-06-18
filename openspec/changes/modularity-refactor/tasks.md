## 1. Shared Types

- [x] 1.1 Create `src/ts/types.ts` with `HotkeyBinding`, `HotkeyEntry`, `CategoryGroup`, `HotkeysCheatsheetSettings`, `DEFAULT_SETTINGS`
- [x] 1.2 Update `hotkeyCollector.ts` to import types from `types.ts` and remove the now-duplicate interface definitions
- [x] 1.3 Update `settingsTab.ts` to import `HotkeysCheatsheetSettings` and `DEFAULT_SETTINGS` from `types.ts`

## 2. Key Display Module

- [x] 2.1 Create `src/ts/keyDisplay.ts` with `MOD_LABEL_MAC`, `MOD_LABEL_WIN`, `FILTER_LABEL_MAC`, `KEY_ICONS` constants
- [x] 2.2 Add exported `modLabel(token)`, `filterLabel(token)`, `keyIcon(key)` functions to `keyDisplay.ts`, consolidating the inline map from `filterLabel` into `FILTER_LABEL_MAC`
- [x] 2.3 Remove the modifier/key display code from `cheatsheetModal.ts` and import from `keyDisplay.ts`

## 3. Filter Hotkeys Module

- [x] 3.1 Create `src/ts/filterHotkeys.ts` with exported `matchesFilters(entry, query, activeModifiers)` function
- [x] 3.2 Replace the inline filter predicate in `cheatsheetModal.ts` `renderGrid()` with a call to `matchesFilters`

## 4. Hotkey Collector Pure Layer

- [x] 4.1 Export `toTitleCase(str)` and `categorise(id, displayName)` from `hotkeyCollector.ts` (currently private)
- [x] 4.2 Extract all merge/normalize/group/sort logic from `collectHotkeys()` into a new exported `buildHotkeyGroups(defaultKeys, customKeys, commands)` function
- [x] 4.3 Reduce `collectHotkeys(app)` to a thin adapter (~10 lines) that reads undocumented Obsidian APIs and delegates to `buildHotkeyGroups`

## 5. i18n Testable Layer

- [x] 5.1 Add exported `translate(key, locale, vars?)` pure function to `i18n.ts`
- [x] 5.2 Refactor `t(key, vars?)` to call `translate(key, detectLocale(), vars)` (no behavioral change)

## 6. TypeScript Strict Mode

- [x] 6.1 Change `"strictNullChecks": true` to `"strict": true` in `tsconfig.json`
- [x] 6.2 Fix all TypeScript errors surfaced by strict mode across all source files

## 7. Tooling — ESLint + Prettier

- [x] 7.1 Install `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, and `prettier` as dev dependencies
- [x] 7.2 Create `.eslintrc.json` with TypeScript-ESLint recommended rules
- [x] 7.3 Create `.prettierrc` with project formatting preferences
- [x] 7.4 Add `"lint"` and `"format"` scripts to `package.json`

## 8. Dev Watch Workflow

- [x] 8.1 Install `watch` npm package as a dev dependency
- [x] 8.2 Add `"dev:deploy:watch": "watch 'npm run dev:deploy' src"` script to `package.json`

## 9. Minor Cleanup

- [x] 9.1 Replace `innerHTML` assignment in `settingsTab.ts` with `createEl` + `appendText` + `createEl('strong')` DOM construction

## 10. Vitest — Test Suite

- [x] 10.1 Install `vitest` as a dev dependency
- [x] 10.2 Create `vitest.config.ts` with `environment: 'node'` and include pattern `**/*.spec.ts`
- [x] 10.3 Add `"test": "vitest run"` script to `package.json`
- [x] 10.4 Create `src/ts/keyDisplay.spec.ts` — tests for `modLabel` (mac/win), `filterLabel` (mac/win), `keyIcon` (known + unknown keys)
- [x] 10.5 Create `src/ts/filterHotkeys.spec.ts` — tests for `matchesFilters`: name match, key match, modifier AND filter, combined filter, no filter, no results
- [x] 10.6 Create `src/ts/hotkeyCollector.spec.ts` — tests for `toTitleCase`, `categorise`, and `buildHotkeyGroups`: merge rules, key normalization, category ordering, alphabetical sort
- [x] 10.7 Create `src/ts/categories.spec.ts` — tests for `CATEGORY_ORDER` content/order and `CORE_PREFIX_MAP` key mappings
- [x] 10.8 Create `src/ts/i18n.spec.ts` — tests for `translate`: en/fr/es locale, fallback to en, `{{var}}` interpolation
- [x] 10.9 Run `npm test` and confirm all tests pass
