## ADDED Requirements

### Requirement: Locale is detected from Obsidian's configured language
The plugin SHALL detect the active locale by reading `moment.locale()` (which mirrors Obsidian's configured interface language), falling back to `navigator.language` when unavailable. The detected value SHALL be reduced to its base language subtag (e.g. `en-US` → `en`) before being matched against registered locales.

#### Scenario: Obsidian language drives detection
- **WHEN** Obsidian's interface language is set to Japanese
- **THEN** the plugin's `locale()` returns `"ja"`

#### Scenario: Unregistered locale falls back to English
- **WHEN** the detected locale code has no matching entry in the registered locales
- **THEN** all translated strings render in English

---

### Requirement: Translation lookup falls back to English per-key
Each translated string SHALL be looked up in the active locale's translation object; if the key is missing (undefined/null) in that locale, the English value SHALL be used instead. `{{var}}` placeholders in the resolved string SHALL be replaced with corresponding values from a supplied variables map.

#### Scenario: Missing key falls back to English
- **WHEN** a locale's translation object omits a key present in `en.json`
- **THEN** looking up that key returns the English string, not an empty or undefined value

#### Scenario: Placeholder interpolation
- **WHEN** a translated string contains `{{date}}` and a vars map of `{ date: "2026-07-09" }` is supplied
- **THEN** the resolved string has `{{date}}` replaced with `2026-07-09`

---

### Requirement: Arabic and Japanese locales are registered with complete translations
`ar.json` (Arabic) and `ja.json` (Japanese) SHALL be registered in the locale map alongside `en`, `fr`, and `es`, each providing a non-empty translation for every key present in `en.json`.

#### Scenario: Arabic locale resolves the modal title
- **WHEN** the active locale is `ar`
- **THEN** `modal.title` resolves to the Arabic translation, not the English fallback

#### Scenario: Japanese locale resolves the modal title
- **WHEN** the active locale is `ja`
- **THEN** `modal.title` resolves to the Japanese translation, not the English fallback

---

### Requirement: Locale completeness is verified without hardcoded key or locale lists
A test SHALL verify, for every registered locale other than `en`, that every key present in `en.json` exists in that locale as a non-empty string. The test SHALL derive both the set of required keys and the set of locales to check dynamically (from `Object.keys` of the English translations object and from the registered locales map, respectively), so that adding a new key to `en.json` or a new locale to the locale map does not require any change to the test itself.

#### Scenario: Test fails on a missing key
- **WHEN** a non-English locale is missing a key that exists in `en.json`
- **THEN** the completeness test fails, identifying the locale and the missing key

#### Scenario: Test fails on an empty-string value
- **WHEN** a non-English locale has a key present but set to an empty string
- **THEN** the completeness test fails, identifying the locale and the key

#### Scenario: Test requires no changes when a new key is added
- **WHEN** a new key is added to `en.json` and translated in every registered locale
- **THEN** the completeness test passes without any modification to the test file itself

#### Scenario: Test requires no changes when a new locale is added
- **WHEN** a new locale is registered in the locale map with a complete translation set
- **THEN** the completeness test covers that locale automatically, without any modification to the test file itself

---

### Requirement: String comparison is locale-aware
A shared helper SHALL expose `Intl`/`localeCompare`-based string comparison using the active detected locale explicitly, rather than relying on the JavaScript runtime's default locale. This helper SHALL be used by every capability that orders strings alphabetically (category names, command display names, key values).

#### Scenario: Japanese strings collate using Japanese rules
- **WHEN** the active locale is `ja` and two Japanese command names are compared
- **THEN** the comparison uses `ja` collation rules rather than the runtime's default locale

#### Scenario: Comparison does not depend on OS locale matching Obsidian's configured locale
- **WHEN** the OS-level default locale differs from Obsidian's configured interface locale
- **THEN** string comparison still uses Obsidian's configured locale, not the OS default

---

### Requirement: RTL locales are identified for layout purposes
The plugin SHALL expose whether the active locale is right-to-left, used to drive `dir` attributes and mirrored layout in the modal and exports.

#### Scenario: Arabic is identified as RTL
- **WHEN** the active locale is `ar`
- **THEN** the plugin reports the active locale as right-to-left

#### Scenario: Japanese is identified as LTR
- **WHEN** the active locale is `ja`
- **THEN** the plugin reports the active locale as left-to-right
