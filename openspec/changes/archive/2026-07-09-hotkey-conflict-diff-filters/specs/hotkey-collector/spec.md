## ADDED Requirements

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
