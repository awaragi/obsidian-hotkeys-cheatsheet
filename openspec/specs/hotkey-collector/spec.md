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

### Requirement: Strip redundant category prefix from display name
When the raw command display name begins with `"<category>: "`, that prefix SHALL be stripped before the entry is stored. This prevents redundant repetition of the plugin/category name in the command label when it is already shown as the section heading.

#### Scenario: Plugin name prefix stripped from command name
- **WHEN** the command name is `"My Plugin: Open My Plugin"` and the derived category is `"My Plugin"`
- **THEN** the stored display name is `"Open My Plugin"`

#### Scenario: Name without matching prefix is unchanged
- **WHEN** the command name does not start with `"<category>: "`
- **THEN** the display name is stored as-is

---

### Requirement: Normalise key display values
The collector SHALL normalise the `key` field of each hotkey to uppercase before returning. Commands with `modifiers: []` (bare keys such as F1, F2) SHALL be included and treated as valid single-key bindings.

#### Scenario: Lowercase key is normalised
- **WHEN** a hotkey has `key: "l"`
- **THEN** the returned entry has `key: "L"`

#### Scenario: Bare key with no modifiers is included
- **WHEN** a hotkey has `modifiers: []` and `key: "F1"`
- **THEN** the entry is included and displayed as a bare key badge

---

### Requirement: Flag entries whose effective binding differs from the shipped default
Each collected entry SHALL carry a flag indicating whether its effective hotkey binding set differs from `defaultKeys[id]` for that command — that is, whether the user has added a binding beyond the default, or replaced the default entirely. Comparison SHALL be order-independent (as sets of canonical modifier+key signatures). A command with no entry in `defaultKeys` at all SHALL be flagged as differing from default, since any effective binding on it is, by this data source, user-added.

#### Scenario: Effective binding matches default exactly
- **WHEN** a command's effective hotkeys are identical (as a set) to its `defaultKeys` entry
- **THEN** the entry is not flagged as differing from default

#### Scenario: User added an extra binding beyond the default
- **WHEN** a command's effective hotkeys are a superset of its `defaultKeys` entry
- **THEN** the entry is flagged as differing from default

#### Scenario: User remapped the binding entirely
- **WHEN** a command's effective hotkeys share no combination with its `defaultKeys` entry
- **THEN** the entry is flagged as differing from default

#### Scenario: Command has no shipped default at all
- **WHEN** a command has no entry in `defaultKeys` but has one or more effective hotkeys via `customKeys`
- **THEN** the entry is flagged as differing from default

#### Scenario: Fully-cleared defaults remain excluded, unaffected by this flag
- **WHEN** a command's effective hotkeys are empty (the user cleared all bindings)
- **THEN** the entry is excluded from collected results entirely, per the existing exclusion rule — this flag has no bearing on that exclusion
