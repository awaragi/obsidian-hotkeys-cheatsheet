## 1. Update `scripts/version.mjs`

- [x] 1.1 Add `commit` option parameter to `bumpVersion(type, { commit = false } = {})` — only run `git add` + `git commit` when `commit` is `true`
- [x] 1.2 Parse `--commit` from `process.argv` in the standalone script entrypoint and pass `{ commit: true }` to `bumpVersion`

## 2. Update `scripts/publish.mjs`

- [x] 2.1 Before tagging, run `git status --porcelain -- package.json manifest.json` and abort with a clear error message if output is non-empty
