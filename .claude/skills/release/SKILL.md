---
name: release
description: Cut a release of this plugin (obsidian-clipboard-monitor) — bump the version with npm run release:prepare, commit, then tag and push with npm run release. Use when the user asks to "release", "cut a release", "create a patch/minor/major release", or "publish a new version".
license: MIT
metadata:
  author: Pierre Awaragi
  version: "1.0"
---

Cuts a release of this Obsidian plugin using the repo's own release scripts (`scripts/version.mjs`, `scripts/publish.mjs`).

**Input**: A release type — `patch`, `minor`, or `major`. If the user didn't specify one, ask rather than guessing.

**Steps**

1. Run `npm run typecheck && npm run lint && npm run test && npm run build`. All four must pass — don't bump the version on a red build.

2. Bump: `node scripts/version.mjs <patch|minor|major>`. This updates `package.json` and `manifest.json` but doesn't commit.

3. Commit the version bump — either as its own commit, or bundled into an existing uncommitted change if there is one. Either way, `git status --porcelain` must be clean before the next step: `npm run release` (via `scripts/publish.mjs`) refuses to run otherwise, and separately refuses if the version's tag already exists in history.

4. Confirm with the user before running `npm run release` — it pushes the branch and the new tag to `origin`, which is hard to reverse. Skip this if they already gave explicit go-ahead for this release.

5. `npm run release`. Report the version, commit(s), and that the tag was pushed.

If `scripts/publish.mjs` errors (dirty tree, or tag already exists), stop and report it — don't force past with `git tag -f`, `push --force`, or similar.
