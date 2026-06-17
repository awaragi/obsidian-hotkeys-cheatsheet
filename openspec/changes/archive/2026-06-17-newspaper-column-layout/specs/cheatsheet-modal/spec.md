## MODIFIED Requirements

### Requirement: Modal displays categorised hotkeys as a responsive grid
The modal SHALL render assigned hotkeys grouped by category, each group as a labelled section. Sections SHALL be laid out using CSS multi-column (`columns: 220px`) so content flows top-to-bottom within a column before spilling into the next. Columns SHALL use greedy fill (`column-fill: auto`) so each column fills to the modal height before the next begins. The container SHALL scroll horizontally when more columns exist than fit the modal width, and SHALL scroll vertically as a fallback when only one column fits.

Category headings SHALL use `break-after: avoid` so a heading is never left alone at the bottom of a column without at least one following entry.

Category headings SHALL be rendered at `font-ui-small` size, `font-weight: 700`, and `color: var(--text-normal)` for high contrast.

#### Scenario: Groups render with headings
- **WHEN** the modal opens
- **THEN** each category is rendered with a visible heading and its hotkey entries below it

#### Scenario: Content flows vertically before spilling to next column
- **WHEN** the modal has enough entries to fill more than one column
- **THEN** the first column fills completely top-to-bottom before entries appear in the second column

#### Scenario: Grid reflows on narrow viewport
- **WHEN** the modal is displayed at a narrow width (< ~600px)
- **THEN** categories stack into a single column with vertical scroll

#### Scenario: Heading does not orphan at column bottom
- **WHEN** a category heading falls at the bottom of a column with no entries below it in that column
- **THEN** the heading flows to the top of the next column alongside its first entry
