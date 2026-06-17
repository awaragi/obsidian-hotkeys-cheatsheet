## Purpose

Reads and merges Obsidian's default and custom hotkey maps; filters to assigned-only; categorises each entry using a hybrid prefix-map + plugin-name strategy; returns sorted, normalised results.

## Requirements

### Requirement: Collect all assigned hotkeys from the runtime
The collector SHALL read `app.hotkeyManager.defaultKeys` and `app.hotkeyManager.customKeys`, merge them, and return only entries where at least one hotkey is assigned. The merge rule is: if a command ID exists in `customKeys`, use those hotkeys (even if the array is empty, meaning the user cleared the default); otherwise fall back to `defaultKeys`.

#### Scenario: Default hotkeys are included
- **WHEN** a command has an entry in `defaultKeys` and no entry in `customKeys`
- **THEN** the command is included with its default hotkeys

#### Scenario: Custom override replaces default
- **WHEN** a command has entries in both `defaultKeys` and `customKeys`
- **THEN** only the `customKeys` value is used

#### Scenario: User-cleared default is excluded
- **WHEN** a command has `customKeys[id] = []` (user explicitly removed the hotkey)
- **THEN** the command is excluded from results

#### Scenario: Unassigned commands are excluded
- **WHEN** a command has no entry in either `defaultKeys` or `customKeys`
- **THEN** the command is not included in results

---

### Requirement: Graceful handling of missing internal API properties
The collector SHALL check that `app.hotkeyManager.defaultKeys` and `app.hotkeyManager.customKeys` exist before accessing them. If either is missing, the collector SHALL return an empty result set and emit a console warning.

#### Scenario: API properties unavailable
- **WHEN** `app.hotkeyManager.defaultKeys` or `app.hotkeyManager.customKeys` is undefined
- **THEN** the collector returns an empty array and logs a warning to the console

---

### Requirement: Categorise each hotkey entry using a hybrid strategy
Each collected command SHALL be assigned to exactly one category using the following logic:
1. Extract the prefix from the command ID (the segment before the first `:`).
2. If the prefix matches a curated core prefix, assign the corresponding category.
3. If no colon exists in the ID, attempt to parse the display name for a `"PluginName: ..."` pattern and use that as the group name.
4. If neither rule matches, title-case the prefix and use it as the group name.

#### Scenario: Known core prefix maps to curated category
- **WHEN** the command ID starts with `editor:`
- **THEN** the entry is assigned to the "Editing" category

#### Scenario: Unknown prefix becomes plugin group
- **WHEN** the command ID starts with `dataview:`
- **THEN** the entry is assigned to the "Dataview" group

#### Scenario: No-colon ID uses display name prefix
- **WHEN** the command ID has no colon (e.g. `insert-current-date`) and the display name contains `": "` (e.g. `"Templates: Insert current date"`)
- **THEN** the entry is grouped under "Templates"

#### Scenario: No-colon ID with no parseable prefix
- **WHEN** the command ID has no colon and the display name contains no `": "`
- **THEN** the entry is grouped under "Other"

---

### Requirement: Return categorised entries in defined display order
The collector SHALL return categories in the following order: Editing, Navigation, Search, Files & Vault, Workspace, then plugin groups sorted alphabetically. Within each category, entries SHALL be sorted alphabetically by display name.

#### Scenario: Core categories appear before plugin groups
- **WHEN** the vault has both core and plugin-assigned hotkeys
- **THEN** Editing appears before any plugin group in the output

#### Scenario: Plugin groups are alphabetically sorted
- **WHEN** multiple plugin groups exist (e.g. "Dataview", "Calendar", "Templater")
- **THEN** they appear in the order: Calendar, Dataview, Templater

---

### Requirement: Normalise key display values
The collector SHALL normalise the `key` field of each hotkey to uppercase before returning. Commands with `modifiers: []` (bare keys such as F1, F2) SHALL be included and treated as valid single-key bindings.

#### Scenario: Lowercase key is normalised
- **WHEN** a hotkey has `key: "l"`
- **THEN** the returned entry has `key: "L"`

#### Scenario: Bare key with no modifiers is included
- **WHEN** a hotkey has `modifiers: []` and `key: "F1"`
- **THEN** the entry is included and displayed as a bare key badge
