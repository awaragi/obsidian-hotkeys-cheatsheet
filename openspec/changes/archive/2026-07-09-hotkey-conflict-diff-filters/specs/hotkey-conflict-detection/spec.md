## Purpose

Detects hotkey bindings that are assigned to more than one command, since Obsidian silently allows this and only one binding wins at runtime — surfacing that as an entry-level flag for use by the cheatsheet's filter.

## ADDED Requirements

### Requirement: Detect bindings shared by more than one command
The system SHALL compute, over the complete set of collected hotkey entries, whether each entry has at least one binding whose canonical modifier+key signature is also used by a binding belonging to a different command. This SHALL be computed as a single pass over the complete entry set, independent of category grouping.

#### Scenario: Two different commands share the same combo
- **WHEN** two different commands each have a binding with the same modifiers and key (e.g. both bound to `Mod+Shift+K`)
- **THEN** both entries are flagged as having a conflict

#### Scenario: A command's own multiple bindings do not conflict with each other
- **WHEN** a single command has two different bindings assigned to it (e.g. `Mod+P` and `Ctrl+Shift+P`)
- **THEN** neither binding is flagged as conflicting, since both belong to the same command

#### Scenario: No shared bindings means no conflicts
- **WHEN** every binding across the collected entries has a distinct combination of modifiers and key
- **THEN** no entries are flagged as having a conflict

#### Scenario: Canonical signature matching ignores modifier declaration order
- **WHEN** two commands are bound to the same key and the same modifiers, expressed in different array order
- **THEN** they are still detected as conflicting, since comparison uses the canonical signature, not raw array order

---

### Requirement: Conflict detection is entry-level, not per-binding
When at least one of an entry's bindings conflicts with another command's binding, the entire entry SHALL be flagged as conflicting. The system SHALL NOT distinguish, for an entry with multiple bindings, which specific binding is the conflicting one.

#### Scenario: Entry with one conflicting and one non-conflicting binding is flagged
- **WHEN** a command has two bindings, one of which collides with another command's binding and one which does not
- **THEN** the entry as a whole is flagged as conflicting
