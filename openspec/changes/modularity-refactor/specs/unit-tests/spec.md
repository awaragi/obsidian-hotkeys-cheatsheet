## ADDED Requirements

### Requirement: Test runner is available via npm script
The project SHALL provide a `test` npm script that executes the Vitest test suite without requiring a live Obsidian instance.

#### Scenario: Running tests in a clean environment
- **WHEN** the developer runs `npm test` in the project root
- **THEN** Vitest discovers and runs all `*.spec.ts` files co-located with their source modules under `src/ts/`
- **THEN** the suite completes with a pass/fail exit code usable in CI

---

### Requirement: Key display helpers are unit tested
The `modLabel`, `filterLabel`, and `keyIcon` functions in `keyDisplay.ts` SHALL be covered by tests that verify correct output on both macOS and Windows/Linux platforms.

#### Scenario: Modifier label on macOS
- **WHEN** `modLabel('Mod')` is called with `Platform.isMacOS` mocked to `true`
- **THEN** the function returns `"Cmd"`

#### Scenario: Modifier label on Windows
- **WHEN** `modLabel('Mod')` is called with `Platform.isMacOS` mocked to `false`
- **THEN** the function returns `"Ctrl"`

#### Scenario: Known special key icon
- **WHEN** `keyIcon('ARROWUP')` is called
- **THEN** the function returns `"↑"`

#### Scenario: Unknown key passthrough
- **WHEN** `keyIcon('F5')` is called
- **THEN** the function returns `"F5"` unchanged

---

### Requirement: Hotkey filter logic is unit tested
The `matchesFilters` function in `filterHotkeys.ts` SHALL be covered by tests that verify all filter combinations.

#### Scenario: Name substring match
- **WHEN** `matchesFilters` is called with a query matching a substring of the entry name
- **THEN** the function returns `true`

#### Scenario: Exact key match
- **WHEN** `matchesFilters` is called with a query equal to the entry's hotkey key (case-insensitive)
- **THEN** the function returns `true`

#### Scenario: Modifier AND filter
- **WHEN** `matchesFilters` is called with `activeModifiers = {'Mod', 'Shift'}` and the entry has a hotkey containing both modifiers
- **THEN** the function returns `true`

#### Scenario: Modifier AND filter fails on partial match
- **WHEN** `matchesFilters` is called with `activeModifiers = {'Mod', 'Shift'}` and the entry has a hotkey with only `Mod`
- **THEN** the function returns `false`

---

### Requirement: Hotkey collection pure layer is unit tested
The `buildHotkeyGroups` function in `hotkeyCollector.ts` SHALL be covered by tests that verify data transformation without requiring an Obsidian runtime.

#### Scenario: Custom key overrides default
- **WHEN** `buildHotkeyGroups` is called with a `customKeys` entry for a command that also has a `defaultKeys` entry
- **THEN** the returned groups use the custom key, not the default

#### Scenario: Empty custom array clears default
- **WHEN** `buildHotkeyGroups` is called with a `customKeys` entry of `[]` for a command with a non-empty `defaultKeys` entry
- **THEN** the command does not appear in the returned groups

#### Scenario: Core categories appear before plugin categories
- **WHEN** `buildHotkeyGroups` is called with commands from both a core prefix (e.g. `editor`) and a plugin prefix
- **THEN** the returned groups list the core category before the plugin category

#### Scenario: Key strings are normalized to uppercase
- **WHEN** `buildHotkeyGroups` is called with a hotkey whose key is lowercase (e.g. `"a"`)
- **THEN** the returned entry's hotkey key is `"A"`

---

### Requirement: i18n translation is unit tested
The `translate` function in `i18n.ts` SHALL be covered by tests that exercise locale selection and variable interpolation without requiring `window.moment`.

#### Scenario: French translation is returned for fr locale
- **WHEN** `translate('modal.title', 'fr')` is called
- **THEN** the function returns the French translation of `modal.title`

#### Scenario: Fallback to English for unknown locale
- **WHEN** `translate('modal.title', 'xx')` is called with an unrecognised locale
- **THEN** the function returns the English translation of `modal.title`

#### Scenario: Variable interpolation
- **WHEN** `translate` is called with a key whose value contains `{{name}}` and `vars = { name: 'test' }`
- **THEN** the function returns the string with `{{name}}` replaced by `"test"`

---

### Requirement: Category constants are covered by tests
The `CATEGORY_ORDER` array and `CORE_PREFIX_MAP` object in `categories.ts` SHALL be covered by tests that verify their shape and content.

#### Scenario: CATEGORY_ORDER contains all expected workflow categories
- **WHEN** the `CATEGORY_ORDER` array is inspected
- **THEN** it contains `"Editing"`, `"Navigation"`, `"Search"`, `"Files & Vault"`, and `"Workspace"` in that order

#### Scenario: CORE_PREFIX_MAP maps known prefixes to categories
- **WHEN** `CORE_PREFIX_MAP['editor']` is accessed
- **THEN** it equals `"Editing"`
