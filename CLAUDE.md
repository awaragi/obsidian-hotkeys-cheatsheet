# Project Directives

## Process
- All new features and behavior changes go through OpenSpec (`openspec new change` → proposal/design/specs/tasks → apply). Do not implement feature work outside that flow.
- For bug fixes that are not feature work or change-spec work, prompt the user to confirm whether to skip OpenSpec before implementing.

## Architecture
- Keep Obsidian API usage behind seam interfaces; core logic must not import `obsidian` directly.
- Favor small, pure, single-purpose functions/modules over logic embedded in controllers or UI classes.
- Keep list/state mutation logic separate from DOM/UI rendering.

## Testability
- Write code to favor unit-testable: pure functions, injectable dependencies, no hidden globals.
- Add unit tests (`.spec.ts`) when applicable — for new pure functions/modules and for logic-bearing changes to existing ones. Not every file needs a test (e.g. thin UI wiring with no logic of its own).
- Any function depending on current time, randomness, or the environment must accept an injectable parameter (e.g. `now: Date`) with a real default.
- If a unit isn't testable without mocking Obsidian's DOM/App, extract the testable part into a plain function/module first.
- Avoid mocking in tests (e.g. `vi.mock`) — exercise real implementations or hand-written fakes behind existing seams instead. Mocking is a rare, justified exception, not a default, since it couples tests to implementation details rather than behavior.
