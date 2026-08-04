## MODIFIED Requirements

### Requirement: Orphaned signatures are surfaced only in By Most-Used Shortcut mode
A signature present in the usage counts data with no entry currently bound to it SHALL appear only when the "By Most-Used Shortcut" sort mode is active. It SHALL render as a pseudo-entry: its modifiers and key parsed back into the same badge display used for bound entries. Orphaned signatures matching a known OS-reserved shortcut (per the `system-shortcut-detection` capability) SHALL render with that shortcut's own specific localized label (e.g. "Copy", "Paste", "Move to Line Start") in place of the generic "No command" placeholder, plus a leading lock icon and an explanatory tooltip, using the same muted text style as other orphaned pseudo-entries; all other orphaned signatures SHALL continue to render with the existing muted, localised "No command" placeholder and no icon.

#### Scenario: Orphaned signature appears in flat mode
- **WHEN** "By Most-Used Shortcut" is active and a captured signature has no matching bound entry and does not match a known system shortcut
- **THEN** a pseudo-entry appears showing "No command" as its label, its parsed modifier and key badges, and its usage count

#### Scenario: Suspected system shortcut renders with its own label and a lock icon
- **WHEN** "By Most-Used Shortcut" is active and a captured signature has no matching bound entry and matches a known OS-reserved shortcut (e.g. `Mod+V`)
- **THEN** the pseudo-entry shows that shortcut's specific label (e.g. "Paste") instead of "No command", with a leading lock icon and a tooltip explaining it is handled by the operating system, in the same muted text color as other orphan rows — distinguished from a generic "No command" orphan only by the label text and icon, not by a different text color

#### Scenario: Distinct system shortcuts show distinct labels
- **WHEN** "By Most-Used Shortcut" is active and orphaned signatures for both `Mod+C` and `Mod+V` are present
- **THEN** the two pseudo-entries show different labels ("Copy" and "Paste" respectively), not the same generic text

#### Scenario: Orphaned signatures do not appear in category-based modes
- **WHEN** "By Category" or "By Most-Used Category" is active
- **THEN** no orphaned-signature pseudo-entries are rendered, system-shortcut or otherwise, since they have no category to belong to

#### Scenario: Orphaned pseudo-entries respect the modifier filter but not text search
- **WHEN** a text search query is active
- **THEN** orphaned pseudo-entries, system-shortcut or otherwise, are excluded from the results regardless of their modifiers or key
- **WHEN** only the modifier filter is active (no text query) and an orphaned pseudo-entry's modifiers match the filter
- **THEN** the orphaned pseudo-entry remains visible
