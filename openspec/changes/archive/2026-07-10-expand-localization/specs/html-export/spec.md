## MODIFIED Requirements

### Requirement: OS "Save As" dialog is triggered with a default filename
Clicking "Save as HTML" SHALL generate the HTML document and trigger a native OS "Save As" dialog using the browser `<a download>` mechanism. The default filename SHALL be the active locale's translation of the cheatsheet title (`modal.title`) with a `.html` extension, so it matches the exported document's own `<title>`/`<h1>` and stays consistent with the active locale. No vault files SHALL be created or modified.

#### Scenario: Save dialog appears with correct filename
- **WHEN** the user clicks "Save as HTML" in the export dropdown in the `en` locale
- **THEN** the OS "Save As" dialog opens with `Hotkeys Cheatsheet.html` as the default filename

#### Scenario: Cancelling the dialog has no side effects
- **WHEN** the user clicks "Save as HTML" and then cancels the OS dialog
- **THEN** no file is written and the modal remains open

#### Scenario: Filename matches the active locale
- **WHEN** the active locale is `ja` and the user clicks "Save as HTML"
- **THEN** the default filename is the Japanese translation of the title (`.html` extension), not the English `Hotkeys Cheatsheet.html`

## ADDED Requirements

### Requirement: Exported HTML declares language and direction matching the active locale
The exported HTML document's `<html>` element SHALL set `lang` to the active locale's language code and `dir` to `rtl` or `ltr` matching whether the active locale is right-to-left.

#### Scenario: Arabic export declares RTL direction
- **WHEN** the active locale is `ar` and the user triggers "Save as HTML"
- **THEN** the exported document's `<html>` element has `lang="ar"` and `dir="rtl"`

#### Scenario: English export declares LTR direction
- **WHEN** the active locale is `en` and the user triggers "Save as HTML"
- **THEN** the exported document's `<html>` element has `lang="en"` and `dir="ltr"`

---

### Requirement: Curated category headings are translated in HTML export
Category headings (`<h2>`) in the exported HTML SHALL use the same translated label as the modal for curated categories, and pass plugin-derived categories through unchanged, per the `cheatsheet-modal` capability's category translation rule.

#### Scenario: Curated category heading is translated in the export
- **WHEN** the active locale is `ja` and the user triggers "Save as HTML"
- **THEN** the exported document's category headings for curated categories (Editing, Navigation, Search, Files & Vault, Workspace, Other) are in Japanese
