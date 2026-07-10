## Context

The plugin's i18n system (`src/ts/i18n/i18n.ts`) is a flat key/value lookup: `detectLocale()` reads `moment.locale()` (falling back to `navigator.language`), `translate()` looks up a key in the matched locale object and falls back to `en` per-key. `en.json`/`fr.json`/`es.json` are typed `Partial<Translations>` against `en`'s shape, so a locale can silently omit keys today with no test catching it.

Everything downstream of this — the modal's CSS, the `KEY_ICONS` glyph map, the five `localeCompare()` call sites, and both export templates — was built and only ever tested against Latin-script, LTR content. Manual testing against Obsidian's own Arabic interface language surfaced concrete gaps (see proposal): dropdowns anchored with physical `left`/`right` detach from their trigger buttons when the modal direction flips, the plugin's own command name/ribbon tooltip stay English (because no `ar.json` exists, not because of a caching bug — `t("command.name")` is called once in `onload()` and simply falls back to `en` when the locale isn't registered), and nothing verifies collation is locale-aware.

This change lands one concrete RTL locale (Arabic) and one CJK locale (Japanese) to prove the plugin handles both script families end-to-end, rather than adding translation files without exercising layout or collation.

## Goals / Non-Goals

**Goals:**
- Arabic (`ar`) renders correctly in the modal, ribbon/command registration, and both export paths, including layout mirroring.
- Japanese (`ja`) renders and sorts correctly (proves CJK collation, not just translation).
- Locale completeness is enforced by a test that requires no maintenance as keys/locales are added.
- RTL layout fixes are general (logical CSS properties, `dir`-driven mirroring) rather than Arabic-specific hacks, so future RTL locales (Hebrew, Persian, Urdu) are cheap to add.

**Non-Goals:**
- Adding more Latin-script locales (de, it, pt, ...) — mechanically identical to existing `fr`/`es`, not a design question.
- Per-note RTL rendering control for the Markdown export — Obsidian's own global "Right to left" editor setting governs how an exported note visually renders; this plugin does not attempt to override or detect that setting.
- A generic pluggable font/script system — Obsidian's own CSS variables already carry font selection; no plugin-level font-family changes are anticipated for Arabic or Japanese glyph rendering.
- RTL support for the standalone HTML export's *content layout* beyond `lang`/`dir` on the root element — the export's CSS has no physical `left`/`right` rules to begin with (verified during exploration), so `dir` inheritance is expected to be sufficient.

## Decisions

**Locale-aware comparison: pass `locale()` explicitly to every `localeCompare()` call, don't rely on runtime default locale.**
`String.prototype.localeCompare(b)` without a locale argument uses the JS runtime's default locale (Electron/Chromium's OS-detected locale), which will usually — but not reliably — match Obsidian's configured interface locale. The existing 5 call sites (`sortHotkeys.ts:134,175`, `hotkeyCollector.ts:129,136`, `keyDisplay.ts:95`) all pass a bare `b.name`/`b`. Alternative considered: leave them as-is and trust the runtime default to line up with `moment.locale()`. Rejected — that coupling is invisible and would silently break the moment a user's OS locale and Obsidian's configured language diverge (a real scenario: OS in English, Obsidian set to Japanese for testing/preference). Passing `locale()` explicitly from `i18n.ts` makes the dependency correct and visible.

**Completeness test iterates `Object.keys(en)` and `Object.entries(locales)`, not hardcoded lists.**
Per proposal: the test must not need edits when keys or locales are added. Implementation is a single parametrized check in `i18n.spec.ts`: for every non-`en` entry in `locales`, every key from `Object.keys(en)` must exist in that locale as a non-empty string. Empty string is treated as incomplete (not just missing), because `translate()`'s fallback is `strings[key] ?? en[key]` ([i18n.ts:27](src/ts/i18n/i18n.ts#L27)) — nullish coalescing does not catch `""`, so a blank value would render as blank rather than falling back to English. This is a real, not hypothetical, footgun the test needs to catch.

**RTL layout: CSS logical properties + `dir` attribute on the modal root, not a parallel `[dir=rtl]` stylesheet.**
Alternative considered: keep physical `left`/`right` and add `.hkc-modal[dir="rtl"] { ... }` override rules for the handful of affected selectors. Rejected in favor of migrating the affected rules directly to logical properties (`inset-inline-start/end`, `margin-inline-start`) — fewer rules overall (no need to maintain a mirrored copy of each), and it's the same mechanism that already makes the flexbox `row`/`column` layouts direction-correct today for free. `dir` is set explicitly on the modal root from `locale()` rather than assumed to inherit from Obsidian's app shell, since the plugin's own translated locale (which may differ from Obsidian's configured interface language in edge cases, e.g. `navigator.language` fallback) should be the source of truth for the plugin's own UI direction.

**Two categories of directional glyphs get opposite treatment — encode this as a named constant/comment, not tribal knowledge.**
`KEY_ICONS` arrows (`↑↓←→`) represent physical keyboard keys and must never mirror regardless of `dir`. The collapse chevron (`▸`/`▾`) is a reading-order affordance and must mirror to `◂` when collapsed under RTL. These look like the same kind of glyph but require opposite handling; the implementation should make the distinction explicit (e.g. a comment at `KEY_ICONS` noting arrows are physical-key glyphs, not directional) so a future contributor doesn't "fix" one to match the other.

**Hotkey badges get explicit `dir="ltr"` / `unicode-bidi: isolate` rather than relying on Unicode bidi inheritance.**
Command names under an RTL locale may originate from other plugins and be in Arabic; the hotkey badge next to them (e.g. `⌘K`) is inherently LTR. Left to the browser's bidi algorithm, an LTR run embedded in an RTL paragraph can reorder unpredictably depending on surrounding punctuation. Isolating the badge explicitly removes that ambiguity rather than hoping the default Unicode Bidi Algorithm resolves it correctly in every case.

**Markdown export column order: unchanged, no locale-driven flip.**
Considered flipping `| Command | Hotkey |` to `| Hotkey | Command |` for RTL locales. Rejected: Markdown carries no `dir` metadata of its own. A rendered table's visual column order is controlled by whatever's viewing it — if Obsidian's own global RTL editor setting is on, the browser already mirrors the table via `direction: rtl` on the rendered `<table>`. Flipping the source order on top of that would double-mirror back to looking LTR, which is wrong and worse because it's silent. Leaving source order fixed and only translating cell *content* (already the case via `t()`) is deterministic and matches how the HTML export declares direction explicitly rather than baking in an assumption.

**HTML export: `lang`/`dir` set on `<html>`, no CSS changes needed.**
The export template ([htmlExportTemplate.ts](src/ts/modal/htmlExportTemplate.ts)) has its own embedded stylesheet, separate from the modal's, and was confirmed during exploration to contain no physical `left`/`right` positioning. Only the hardcoded `<html lang="en">` needs to become locale-driven; no logical-property migration needed there.

## Risks / Trade-offs

- **[Risk]** Visual RTL bugs beyond what's covered by grep (e.g. icon-only buttons whose padding reads asymmetric once mirrored) → **Mitigation**: manual pass in Obsidian with the interface language set to Arabic (`moment.locale('ar')` via DevTools console works without needing Obsidian to ship a full Arabic UI), checking every dropdown (filter, sort, export) and the collapse chevron specifically, per the exploration findings.
- **[Risk]** `Intl`/`localeCompare` collation behavior for `ar`/`ja` depends on the V8/ICU build Obsidian's Electron ships with — not independently verifiable without running inside Obsidian → **Mitigation**: unit tests assert relative ordering with known Japanese/Arabic sample strings, run in the same Vitest/Node environment used for the rest of the suite; treat as a smoke check, not a guarantee of pixel-perfect ICU behavior.
- **[Trade-off]** Scoping to exactly one RTL and one CJK locale (rather than a broader sweep) means other RTL locales (he, fa, ur) inherit the same layout fixes for free, but their own translation files are out of scope for this change.

## Migration Plan

No migration — purely additive (new locale files, new test, layout/collation fixes that are locale-conditional and no-ops for existing `en`/`fr`/`es` users). No data model or storage changes. Rollback is a plain revert if needed.

## Open Questions

None outstanding — scope and key decisions were settled during exploration prior to this change (see proposal.md).
