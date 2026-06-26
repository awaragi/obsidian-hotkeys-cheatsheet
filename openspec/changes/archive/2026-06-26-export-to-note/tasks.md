## 1. Markdown Generation

- [x] 1.1 Implement `generateMarkdown(groups: CategoryGroup[]): string` — builds the full Markdown document with title, timestamp, and one table per category
- [x] 1.2 Format hotkey bindings: wrap each modifier/key token in backticks, join with ` + `; join multiple bindings with ` / `
- [x] 1.3 Use `modLabel()` from `keyDisplay.ts` for OS-aware modifier labels in the exported text

## 2. Note Save Logic

- [x] 2.1 Implement save-location resolver: `app.workspace.getActiveFile()?.parent?.path ?? "/"`; build full path as `folder === "/" ? filename : folder + "/" + filename`
- [x] 2.2 Implement overwrite guard: check file existence with `app.vault.getAbstractFileByPath(path)`; on first attempt show a warning Notice and set `pendingOverwrite = true`; on second attempt write unconditionally
- [x] 2.3 Write the note using `app.vault.create(path, content)` for new files and `app.vault.modify(file, content)` for existing files
- [x] 2.4 Show a success Notice with the vault-relative path after a successful save
- [x] 2.5 Reset `pendingOverwrite` flag in `onClose()`

## 3. Export Dropdown UI

- [x] 3.1 Add Export button to `buildToolbar()` between the modifier filter wrapper and the collapse/expand toggle; give it class `hkc-export-btn`
- [x] 3.2 Create export dropdown element with class `hkc-export-dropdown hkc-hidden` containing two items: "Save as Note" and "Save as HTML"
- [x] 3.3 Wire "Save as Note" item click to the save logic (close dropdown → run export)
- [x] 3.4 Mark "Save as HTML" item as disabled with class `hkc-export-item--disabled` and add a "(coming soon)" label
- [x] 3.5 Wire Export button click to toggle dropdown visibility (same `stopPropagation` + `hkc-hidden` pattern as filter dropdown)
- [x] 3.6 Register Export dropdown in `handleOutsideClick` so it dismisses on outside click

## 4. Styles

- [x] 4.1 Add CSS for `.hkc-export-btn` — match the visual style of `.hkc-filter-btn`
- [x] 4.2 Add CSS for `.hkc-export-dropdown` and `.hkc-export-item` — reuse positioning and padding pattern from `.hkc-filter-dropdown` / `.hkc-filter-item`
- [x] 4.3 Add CSS for `.hkc-export-item--disabled` — dimmed opacity, `cursor: not-allowed`, `pointer-events: none`

## 5. i18n

- [x] 5.1 Add translation keys to `en.json` (and `es.json`, `fr.json`): `modal.export_label`, `modal.export_save_note`, `modal.export_save_html`, `modal.export_saved`, `modal.export_exists_warning`
- [x] 5.2 Wire all new UI strings through the `t()` helper
