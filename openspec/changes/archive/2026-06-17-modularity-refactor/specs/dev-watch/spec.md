## ADDED Requirements

### Requirement: Watch command triggers build and deploy on source changes
The project SHALL provide a `dev:deploy:watch` npm script (using the `watch` npm package) that monitors `src/` for file changes and automatically runs the dev build followed by the deploy step.

#### Scenario: Source TypeScript file is modified
- **WHEN** the developer runs `npm run dev:deploy:watch` and then edits any `.ts` file under `src/ts/`
- **THEN** the dev build runs automatically
- **THEN** the deploy script copies updated files to the configured vault plugin directory

#### Scenario: Source CSS file is modified
- **WHEN** the developer runs `npm run dev:deploy:watch` and then edits `src/css/styles.css`
- **THEN** the dev build runs automatically
- **THEN** the deploy script copies updated files to the configured vault plugin directory

---

### Requirement: Watch mode uses the dev (sourcemap) build
The watch-triggered build SHALL use the dev build configuration (inline sourcemaps) rather than the production configuration.

#### Scenario: Build output includes sourcemaps in watch mode
- **WHEN** `npm run watch` triggers a rebuild after a source change
- **THEN** the generated `dist/main.js` contains inline sourcemaps

---

### Requirement: Watch mode does not affect the existing build and deploy scripts
The introduction of `npm run dev:deploy:watch` SHALL NOT change the behavior of `npm run dev`, `npm run build`, or `npm run deploy`.

#### Scenario: Existing dev script still works
- **WHEN** `npm run dev` is run directly
- **THEN** it performs a one-shot dev build, identical to before the watch feature was introduced

#### Scenario: Existing build script still works
- **WHEN** `npm run build` is run directly
- **THEN** it performs a production build without sourcemaps, identical to before
