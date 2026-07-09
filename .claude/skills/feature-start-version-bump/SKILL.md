---
name: feature-start-version-bump
description: Prompt for a semantic version bump before starting implementation of a new feature, fix, or change — whether tracked via OpenSpec or not. Use at the very start of a new unit of work, before making the first code edit, to decide if/how to bump the version with npm run release:prepare. Not for continuing already-started work or trivial one-line tweaks.
license: MIT
---

Ask about a version bump before the first line of code is written for a new feature, fix, or change — regardless of whether it's tracked as an OpenSpec change or just a plain implementation request.

**When this applies**
- The user is asking to start building/implementing something new (a feature, fix, or OpenSpec change), and no code has been written for it yet in this conversation.
- An OpenSpec change is about to be applied for the first time (progress shows 0 tasks complete).

**When this does NOT apply**
- Continuing or resuming work already in progress (some code/tasks already done for this unit of work).
- Trivial one-off tweaks, typo fixes, or exploratory/throwaway edits that aren't a planned feature/change.
- This has already been asked once for this feature/change in the current conversation — don't ask twice.

**Steps**

1. Confirm this is genuinely the start of new implementation work (see above). If unsure, err on the side of asking.

2. Ask with the **AskUserQuestion tool**:

   > "Starting implementation of `<feature/change name>`. Want to bump the version now?"

   Options:
   - **Minor (new feature)** (Recommended) — new functionality, backwards compatible (`x.Y.0`)
   - **Patch (fix/tweak)** — backwards-compatible fix or small change (`x.y.Z`)
   - **Major (breaking change)** — incompatible API/behavior change (`X.0.0`)
   - **Skip** — don't bump now (e.g. bundling with other changes, or will do it later)

3. If the user picks patch/minor/major, run:
   ```bash
   npm run release:prepare <type>
   ```
   Do **not** append `-- --commit`. `release:prepare` intentionally leaves `package.json`/`manifest.json` unstaged so the version bump rides along with the feature commit rather than becoming a standalone commit (see `openspec/specs/release-prepare-commit-flag/spec.md`).

4. If the user picks Skip, continue without bumping.

5. Proceed with the implementation (or, if this was triggered from an OpenSpec apply flow, continue that flow's normal steps).

**Guardrails**
- Ask at most once per feature/change per conversation.
- Don't block on this — if the user is mid-flow and clearly wants to keep moving, ask once, then proceed regardless of their answer.
- This skill only decides *whether/when* to bump — it doesn't replace or duplicate OpenSpec's own change-tracking steps.
