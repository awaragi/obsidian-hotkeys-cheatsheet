## MODIFIED Requirements

### Requirement: "Save as HTML" triggers HTML export
The "Save as HTML" item in the export dropdown SHALL be active and clickable. Clicking it SHALL close the dropdown and trigger the HTML export flow defined in the `html-export` capability.

#### Scenario: Save as HTML item is interactive
- **WHEN** the export dropdown is open
- **THEN** "Save as HTML" is visually enabled and responds to click

#### Scenario: Clicking Save as HTML triggers export
- **WHEN** the user clicks "Save as HTML"
- **THEN** the dropdown closes and the HTML export and download process begins
