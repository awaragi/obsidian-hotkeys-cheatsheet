## 1. Hotkey Collector

- [ ] 1.1 Create `src/ts/categories.ts` with the curated core prefix → category map and category display order
- [ ] 1.2 Create `src/ts/hotkeyCollector.ts` — merge `defaultKeys` + `customKeys` with runtime guard for missing API properties
- [ ] 1.3 Implement categorise logic: known prefix → curated category, unknown prefix → title-cased plugin name, no-colon → parse display name
- [ ] 1.4 Sort output: core categories in defined order, plugin groups alphabetically, entries within each group alphabetically by name
- [ ] 1.5 Normalise key values to uppercase; handle bare keys (`modifiers: []`)

## 2. Cheatsheet Modal

- [ ] 2.1 Create `src/ts/cheatsheetModal.ts` extending Obsidian `Modal`
- [ ] 2.2 Render modal header: title + ✕ close button (clicking ✕ closes the modal)
- [ ] 2.3 Render toolbar row: search input + modifier filter dropdown
- [ ] 2.4 Implement Escape behaviour: clears search if non-empty, otherwise closes modal
- [ ] 2.5 Render the category grid using CSS Grid (`auto-fill, minmax(220px, 1fr)`)
- [ ] 2.6 Render each hotkey entry: command name + `<kbd>` badges per modifier and key
- [ ] 2.7 Implement OS-aware modifier rendering using `Platform.isMacOS`; handle all 5 tokens (`Mod`, `Meta`, `Ctrl`, `Shift`, `Alt`)
- [ ] 2.8 Handle multiple hotkeys per command (show all as separate rows)
- [ ] 2.9 Implement real-time search: match by command name substring OR bare key character (case-insensitive); modifiers are NOT matched
- [ ] 2.10 Highlight matching text in command names during search
- [ ] 2.11 Implement modifier filter dropdown: checkboxes for `Mod`, `Shift`, `Alt`, `Ctrl`; AND logic; inactive when nothing checked
- [ ] 2.12 Compose search and modifier filter (both apply simultaneously)
- [ ] 2.13 Show "No results" empty state when combined filters match nothing

## 3. Styles

- [ ] 3.1 Write modal layout styles in `src/css/styles.css` using Obsidian CSS custom properties (no hardcoded colours)
- [ ] 3.2 Style modal header (title + ✕ button) and toolbar (search + modifier filter)
- [ ] 3.3 Style category headings, entry rows, and `<kbd>` badges
- [ ] 3.4 Style modifier filter dropdown and checkboxes
- [ ] 3.5 Ensure responsive reflow (single column below ~600px)

## 4. Wiring & i18n

- [ ] 4.1 Update `src/ts/main.ts`: register ribbon icon and command that call `openCheatsheet()`; instantiate and open `CheatsheetModal`
- [ ] 4.2 Update `src/ts/i18n/en.json`, `fr.json`, `es.json` with new UI strings (search placeholder, empty state, modifier filter label, about section strings)
- [ ] 4.3 Replace placeholder setting in `src/ts/settingsTab.ts` with about blurb (plugin name, version via `this.manifest.version`, author, description)

## 5. Build & Smoke Test

- [ ] 5.1 Run `npm run build` and confirm no TypeScript errors
- [ ] 5.2 Deploy to local vault with `npm run deploy` and reload Obsidian
- [ ] 5.3 Open the cheatsheet and verify hotkeys match what the console script reported (51 entries in the test vault)
- [ ] 5.4 Verify search filters correctly and highlights match text
- [ ] 5.5 Verify OS-aware modifier display renders correctly
- [ ] 5.6 Verify responsive reflow by resizing the modal
