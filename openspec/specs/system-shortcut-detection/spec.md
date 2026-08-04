## Purpose

Pure, platform-parameterized lookups for identifying OS/Electron-reserved keyboard shortcuts (and default Obsidian editor commands like undo/redo) that explain why a captured usage signature has no currently-bound entry, plus the platform-specific label describing what each one does. Used by the `shortcut-usage-display` capability to distinguish these from genuinely unbound, potentially bindable orphaned signatures.

## Requirements

### Requirement: Detects known OS-reserved shortcuts by canonical signature and platform
The system SHALL provide a pure lookup that, given a canonical modifier+key signature string (the same format produced by the existing usage-tracking signature builder) and whether the current platform is macOS, returns whether that signature matches a known OS/Electron-reserved shortcut, or a default Obsidian editor command binding, likely to explain why the signature has no currently-bound entry. The lookup SHALL take platform as an explicit parameter rather than detecting it internally, keeping the lookup itself free of any dependency on the Obsidian API.

The recognized set SHALL include, on every platform: clipboard/selection (`Mod+C`, `Mod+X`, `Mod+V`, `Mod+A`), undo/redo (`Mod+Z`, `Mod+Shift+Z`), line/document navigation and deletion (`Mod+ArrowLeft`, `Mod+ArrowRight`, `Mod+ArrowUp`, `Mod+ArrowDown`, `Mod+Backspace`), and selection-extension (`Mod+Shift+ArrowLeft`, `Mod+Shift+ArrowRight`) — even though the precise native behavior of several of these varies by platform (e.g. line-wise vs. word-wise navigation), and even though `Mod+Z`/`Mod+Shift+Z` are normally bound to Obsidian's own undo/redo commands rather than being genuinely OS-unbindable. Additionally, on macOS only, the set SHALL include word-wise navigation and selection (`Alt+ArrowLeft`, `Alt+ArrowRight`, `Shift+Alt+ArrowLeft`, `Shift+Alt+ArrowRight`) — these SHALL NOT be recognized on Windows/Linux, since `Alt+Arrow`'s meaning there is not consistent or confirmed enough to flag with confidence.

#### Scenario: Clipboard/selection signatures are recognized on every platform
- **WHEN** the lookup is checked with `"Mod+C"`, `"Mod+X"`, `"Mod+V"`, or `"Mod+A"`, for both macOS and non-macOS
- **THEN** it returns `true` in every case

#### Scenario: Undo/redo signatures are recognized on every platform
- **WHEN** the lookup is checked with `"Mod+Z"` or `"Mod+Shift+Z"`, for both macOS and non-macOS
- **THEN** it returns `true` in every case

#### Scenario: Navigation, deletion, and selection-extension signatures are recognized on every platform
- **WHEN** the lookup is checked with `"Mod+ARROWLEFT"`, `"Mod+ARROWRIGHT"`, `"Mod+ARROWUP"`, `"Mod+ARROWDOWN"`, `"Mod+BACKSPACE"`, `"Mod+Shift+ARROWLEFT"`, or `"Mod+Shift+ARROWRIGHT"`, for both macOS and non-macOS
- **THEN** it returns `true` in every case

#### Scenario: Alt-based word navigation/selection is recognized on macOS only
- **WHEN** the lookup is checked with `"Alt+ARROWLEFT"`, `"Alt+ARROWRIGHT"`, `"Shift+Alt+ARROWLEFT"`, or `"Shift+Alt+ARROWRIGHT"`, once for macOS and once for non-macOS
- **THEN** it returns `true` for macOS and `false` for non-macOS, for each signature

#### Scenario: Unrelated signature is not recognized
- **WHEN** the lookup is checked with a signature outside the recognized set, e.g. `"Mod+K"`
- **THEN** it returns `false`

#### Scenario: A recognized key with extra modifiers is not recognized
- **WHEN** the lookup is checked with a signature that adds a modifier beyond a recognized combination, e.g. `"Mod+Shift+V"`
- **THEN** it returns `false`, since only the exact reserved combination is flagged

### Requirement: Each recognized system shortcut resolves to its own platform-specific descriptive label
The system SHALL provide a pure lookup that, given a recognized signature and whether the current platform is macOS, returns the specific localization key describing what that shortcut does on that platform, rather than one generic label shared by every recognized signature. Several signatures SHALL resolve to a different label depending on platform, since the same signature has different native meaning on macOS versus Windows/Linux (e.g. `Mod+ArrowLeft` is "move to line start" on macOS but "move left one word" on Windows/Linux, since `Mod` normalizes to `Ctrl` there and `Ctrl+Arrow` is conventionally word-wise navigation on that platform). Word-selection signatures that differ in modifier by platform (macOS `Shift+Alt+ArrowLeft/Right` vs. Windows/Linux `Mod+Shift+ArrowLeft/Right`) SHALL resolve to the same underlying "select word" label, since they express the same concept. For a signature not recognized on the given platform, the lookup SHALL return `undefined`.

#### Scenario: Distinct signatures resolve to distinct labels on the same platform
- **WHEN** the label lookup is checked with `"Mod+V"` and then with `"Mod+C"`, both for macOS
- **THEN** it returns a different localization key for each, corresponding to "Paste" and "Copy" respectively

#### Scenario: The same signature resolves to a different label depending on platform
- **WHEN** the label lookup is checked with `"Mod+ARROWLEFT"` once for macOS and once for non-macOS
- **THEN** it returns the "move to line start" key for macOS and the "move left one word" key for non-macOS

#### Scenario: Platform-invariant signatures resolve to the same label on every platform
- **WHEN** the label lookup is checked with `"Mod+C"` once for macOS and once for non-macOS
- **THEN** it returns the same "Copy" localization key both times

#### Scenario: Equivalent word-selection signatures on different platforms share a label
- **WHEN** the label lookup is checked with `"Shift+Alt+ARROWLEFT"` for macOS and with `"Mod+Shift+ARROWLEFT"` for non-macOS
- **THEN** both return the same "select previous word" localization key

#### Scenario: A macOS-only signature has no label on Windows/Linux
- **WHEN** the label lookup is checked with `"Alt+ARROWLEFT"` for non-macOS
- **THEN** it returns `undefined`

#### Scenario: Unrecognized signature has no label on either platform
- **WHEN** the label lookup is checked with a signature outside the recognized set, e.g. `"Mod+K"`, for both macOS and non-macOS
- **THEN** it returns `undefined` in both cases
