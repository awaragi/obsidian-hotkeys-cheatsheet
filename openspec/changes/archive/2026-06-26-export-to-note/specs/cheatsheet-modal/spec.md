## ADDED Requirements

### Requirement: Toolbar includes an Export dropdown button
The modal toolbar SHALL include an Export button that opens a dropdown menu with two items: "Save as Note" and "Save as HTML". The dropdown SHALL follow the same outside-click-to-dismiss pattern as the modifier filter dropdown. The Export button SHALL appear between the modifier filter and the collapse/expand toggle.

#### Scenario: Export button opens dropdown
- **WHEN** the user clicks the Export button in the toolbar
- **THEN** a dropdown appears with two items: "Save as Note" and "Save as HTML"

#### Scenario: Dropdown closes on outside click
- **WHEN** the export dropdown is open and the user clicks anywhere outside it
- **THEN** the dropdown closes

#### Scenario: Export button position in toolbar
- **WHEN** the modal is open
- **THEN** the Export button appears to the right of the modifier filter and to the left of the collapse/expand toggle

---

### Requirement: "Save as Note" triggers note export
The "Save as Note" item in the export dropdown SHALL be active and clickable. Clicking it SHALL close the dropdown and trigger the note export flow defined in the `note-export` capability.

#### Scenario: Save as Note item is interactive
- **WHEN** the export dropdown is open
- **THEN** "Save as Note" is visually enabled and responds to click

#### Scenario: Clicking Save as Note triggers export
- **WHEN** the user clicks "Save as Note"
- **THEN** the dropdown closes and the note export process begins

---

### Requirement: "Save as HTML" is a disabled placeholder
The "Save as HTML" item in the export dropdown SHALL be visually disabled (dimmed, non-interactive). It SHALL display a "coming soon" indicator (e.g. tooltip, parenthetical label, or badge). Clicking it SHALL have no effect.

#### Scenario: Save as HTML item is disabled
- **WHEN** the export dropdown is open
- **THEN** "Save as HTML" is visually dimmed and cannot be clicked
