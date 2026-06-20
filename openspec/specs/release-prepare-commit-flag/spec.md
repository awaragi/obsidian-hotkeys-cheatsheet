## Purpose

Specifies the behaviour of `scripts/version.mjs` (`release:prepare`) and `scripts/publish.mjs` (`release`) around version bump commits and release safety guards.

## Requirements

### Requirement: Version bump does not auto-commit by default
`release:prepare` SHALL update `package.json` and `manifest.json` with the new version and stop there. It SHALL NOT stage or commit any files unless the `--commit` flag is explicitly passed.

#### Scenario: Default invocation leaves files unstaged
- **WHEN** the user runs `npm run release:prepare patch` (no `--commit` flag)
- **THEN** `package.json` and `manifest.json` are updated with the bumped version
- **AND** no git commit is created
- **AND** the files remain as working-tree changes (unstaged)

### Requirement: `--commit` flag triggers auto-commit
When `--commit` is passed, `release:prepare` SHALL stage `package.json` and `manifest.json` and create a commit with the message `chore: bump version to <version>`.

#### Scenario: `--commit` flag produces a version bump commit
- **WHEN** the user runs `npm run release:prepare patch -- --commit`
- **THEN** `package.json` and `manifest.json` are updated with the bumped version
- **AND** both files are staged and committed with the message `chore: bump version to <version>`

### Requirement: Release is guarded against dirty version files
`release` (publish.mjs) SHALL abort with a non-zero exit code and a clear error message if `package.json` or `manifest.json` have uncommitted changes at the time of tagging.

#### Scenario: Dirty version files abort the release
- **WHEN** the user runs `npm run release`
- **AND** `package.json` or `manifest.json` have uncommitted modifications or are untracked
- **THEN** the script exits with a non-zero code
- **AND** prints an error telling the user to commit the version files before releasing

#### Scenario: Clean state allows release to proceed
- **WHEN** the user runs `npm run release`
- **AND** `package.json` and `manifest.json` are both committed and unmodified
- **THEN** the release proceeds normally (push + tag)
