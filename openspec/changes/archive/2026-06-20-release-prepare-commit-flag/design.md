## Context

`scripts/version.mjs` bumps `package.json` and `manifest.json`, then unconditionally runs `git add` + `git commit`. This means it always produces a standalone commit, making it impossible to bundle the version bump into a meaningful feature commit. The fix is straightforward: default to no-commit, add an opt-in flag.

`scripts/publish.mjs` currently has no guard against releasing with dirty version files. If a user forgets to commit the bumped files, the tag points to the wrong version.

## Goals / Non-Goals

**Goals:**
- `release:prepare` writes version files only; no git operations by default
- `release:prepare --commit` preserves the existing auto-commit behaviour
- `release` (publish.mjs) aborts if `package.json` or `manifest.json` are dirty or untracked in the index

**Non-Goals:**
- Changing the bump logic (major/minor/patch calculation)
- Changing `npm run release` tag/push behaviour
- Supporting custom commit messages via CLI

## Decisions

**Parse `--commit` from `process.argv` directly** (no arg-parsing library)  
The script has a single optional flag; `process.argv.includes('--commit')` is sufficient. Adding a dependency like `minimist` would be overkill.

**Dirty-check via `git status --porcelain`** in publish.mjs  
Running `git status --porcelain -- package.json manifest.json` and checking for non-empty output is the simplest, most portable way to detect uncommitted changes. Exit code alone doesn't distinguish clean vs. dirty.

**`bumpVersion` keeps its existing signature; commit behaviour is a parameter**  
`bumpVersion(type, { commit = false } = {})` — callers that import `bumpVersion` programmatically aren't broken; the standalone script CLI opt-in passes `commit: true` only when `--commit` is present.

## Risks / Trade-offs

[Risk] User forgets to commit version files → they run `release` and hit the new guard  
Mitigation: clear error message telling them to commit or stage `package.json` and `manifest.json`

[Risk] `bumpVersion` is imported by other scripts and callers expect the old auto-commit behaviour  
Mitigation: only `publish.mjs` imports it today; default `commit: false` is a safe change

## Migration Plan

No migration required. The change is fully backwards-compatible at the CLI level:
- Old: `npm run release:prepare patch` → bumps + commits (auto)
- New: `npm run release:prepare patch` → bumps only; `npm run release:prepare patch -- --commit` → bumps + commits
