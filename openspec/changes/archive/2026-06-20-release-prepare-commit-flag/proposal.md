## Why

`release:prepare` currently auto-commits the version bump with a generic message, which forces an unwanted standalone commit when run after code changes are already staged or committed. Removing the auto-commit lets the version bump ride along with the feature commit naturally; the optional `--commit` flag preserves the ability to auto-commit for users who prefer that workflow.

## What Changes

- `scripts/version.mjs` no longer auto-commits by default — it only writes `package.json` and `manifest.json`
- A `--commit` CLI flag is added to `version.mjs`; when passed, it stages and commits exactly as before
- `scripts/publish.mjs` gains a pre-flight guard that aborts if `package.json` or `manifest.json` have uncommitted changes, preventing a release with a dirty version state

## Capabilities

### New Capabilities
- `release-prepare-commit-flag`: CLI flag `--commit` on `release:prepare` controls whether the version bump is auto-committed

### Modified Capabilities
- `cheatsheet-modal`: none (not affected)

## Impact

- `scripts/version.mjs`: remove unconditional `git add` + `git commit`; parse `--commit` from `process.argv`; commit only when flag is present
- `scripts/publish.mjs`: add check for dirty `package.json` / `manifest.json` before tagging
- `package.json` scripts: no change to script names or invocation syntax
