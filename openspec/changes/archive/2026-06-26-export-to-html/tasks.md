## 1. HTML Template

- [x] 1.1 Create `src/ts/htmlExportTemplate.ts` with the exported `HTML_TEMPLATE` string constant — full `<!DOCTYPE html>` document with `{{TITLE}}`, `{{DATE}}`, `{{CONTENT}}` placeholders
- [x] 1.2 Write the embedded `<style>` block in the template: define 7 own CSS variables in `:root` (light palette) and override in `@media (prefers-color-scheme: dark)` (dark palette)
- [x] 1.3 Add layout CSS in the template: `columns: 300px`, `.hkc-section`, `.hkc-category-heading`, `.hkc-entry`, `.hkc-entry-name`, `.hkc-entry-hotkeys`, `.hkc-hk-row`, `.hkc-kbd` — targeting the same class names as the modal, using the new palette variables
- [x] 1.4 Add responsive reflow in template: `@media (max-width: 600px) { .hkc-grid { columns: 1 } }`
- [x] 1.5 Export `fillTemplate(title: string, date: string, content: string): string` helper that replaces `{{TITLE}}`, `{{DATE}}`, `{{CONTENT}}` in `HTML_TEMPLATE`

## 2. HTML Content Renderer

- [x] 2.1 Export `renderHtmlSections(groups: CategoryGroup[]): string` in `htmlExportTemplate.ts` — iterates groups, builds HTML string with `.hkc-section`, `.hkc-category-heading`, `.hkc-entry` divs
- [x] 2.2 Format each hotkey binding: one `.hkc-hk-row` per binding, one `<kbd class="hkc-kbd">` per modifier (via `modLabel()`) and per key (via `keyIcon()`); multiple bindings separated by a ` / ` span
- [x] 2.3 Escape command names for HTML (replace `&`, `<`, `>` with entities) to prevent any injection via unusual command names

## 3. Generate + Save Wiring

- [x] 3.1 Add `private generateHtml(): string` to `CheatsheetModal` — calls `renderHtmlSections(this.groups)` then `fillTemplate(title, date, content)`
- [x] 3.2 Add `private saveHtml(): void` to `CheatsheetModal` — creates a `Blob`, object URL, programmatic `<a download="Hotkeys Cheatsheet.html">` click, then revokes the URL
- [x] 3.3 Enable the "Save as HTML" dropdown item: remove `hkc-export-item--disabled` class and wire its click handler to `() => { close dropdown; this.saveHtml(); }`
- [x] 3.4 Update the `modal.export_save_html` i18n key in `en.json`, `es.json`, `fr.json` — remove the "(coming soon)" suffix from all three locales
