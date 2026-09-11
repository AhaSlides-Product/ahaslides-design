# Changelog

All notable changes to `@ahaslides-product/design`, **newest first**.

**The rule:** every merge adds one entry here **and** bumps `version` in `package.json`.
The top entry's version MUST equal `package.json` → `version` — `standards.mjs` enforces it, so a
PR that forgets either goes red. The `v<version>` release tag (what `npm publish` ships) matches too.
The gate also rejects an unfilled `(#PR)` placeholder in the top entry: link the **real** PR number.

**Format** — one entry per version:

```
## X.Y.Z — YYYY-MM-DD
### Added        ← new component / prop / token / export
### Changed      ← behaviour or API change to something that already shipped
### Fixed        ← bug / gate / doc fix, no API change
### Removed       ← a removed export / component / token
- one short bullet per change, written for a consumer; link the real PR: (#123) — never a bare (#PR)
```

Include only the sections you touched. **Versioning is [SemVer](https://semver.org)** — pre-1.0:
an additive change (new component/prop/token) bumps **MINOR** (`0.x.0`); a fix with no API change
bumps **PATCH** (`0.0.x`); a breaking change also bumps MINOR until 1.0, and is called out in the bullet.

## 0.43.1 — 2026-09-11
### Fixed
- **Tooltip** — a full-sentence `?` help hint now wraps inside the bubble's 240px max-width instead of laying out as one long `nowrap` line that overflowed and got clipped near a panel edge (the settings-label help tooltip, e.g. on Mode field, was getting cut off). (#83)
### Changed
- **Mode field** — the active option's body now renders as de-emphasised help text (secondary colour, regular weight, 13/20) so the field label stays the primary line; and its `?` help tooltip now opens below the label (`bottom-start`) so it clears the panel top instead of being clipped above. (#83)

## 0.43.0 — 2026-09-11
### Added
- **Anti-slop consumer feeds** — the DS now ships the official AhaSlides build→judge→fix loop to any agent that connects: `anti-slop.md` + `anti-slop.agent.json` carry, per surface, the composition rules and a **binary self-judge** (PASS/FAIL each, no partial credit), and `llms.txt` points a connecting agent at them first. A new **App shell** guideline closes the screen-composition gap (real brand mark, no dead placeholders, deliberate hierarchy, tokenised chrome, animated nav state). Criteria live in the DS-owned `anti-slop/criteria.json` — the DS is the single source of truth for anti-slop, seeded once from the aha-design skills. `standards.mjs` gains a consistency gate over the store + feeds. (#82)

## 0.42.0 — 2026-09-11
### Added
- **Loader** — `<aha-loader>`, the full-surface branded loading *screen* shown while a new environment boots (workspace → editor, editor → presenting). Fills its container on a white ground and cycles five branded illustration tiles with a staggered soft-flow (fade + slide + unblur in, hold, out). Reuses the shared `<aha-illustration>` spot art (`loader-award`/`-wand`/`-plane`/`-ballot`/`-chart`, added to the illustration registry), themed by `--aha-*` tokens, `role="status"`, and stills under `prefers-reduced-motion`. Lands under **Patterns · AhaSlides surfaces**. Distinct from `<aha-spin>` (the inline indeterminate spinner). (#78)

## 0.41.0 — 2026-09-11
### Changed
- **Screen heading** — the page title now renders via the reused `<aha-breadcrumb size="page-title">` instead of a hand-rolled `<h1>`, for BOTH a plain `title` (a single-crumb page title) and a `breadcrumb` trail (the heading with its ancestor path in front) — so a sub-page header is now a real page-title-size heading, not a 13px default trail. The DS's single page-heading owner is the breadcrumb; the only local `<h1>` left is the accent-name greeting (`highlight`), which the breadcrumb can't express. No API change. (#81)

## 0.40.0 — 2026-09-11
### Added
- **Settings list — `visible_if` conditional visibility (the Shopify model).** A schema row can declare a trigger: it is shown ONLY when its trigger setting is on and hidden when off, updating live as the trigger changes. Structured form `visibleIf: { key, equals?, in?, not? }` or the Shopify string `visible_if: "{{ settings.<key> }}"` / `"{{ settings.mode == 'advanced' }}"`. A dependent row renders NESTED — indented 24, bound tighter to its parent, de-emphasised label — and when hidden is `display:none` so it leaves no phantom gap (SETTINGS-07/14/19). (#80)

## 0.39.1 — 2026-09-11
### Changed
- **Settings — setting label weight.** A member setting's label is now regular (400), not semibold — only the group/section header (`aha-section-header` / `aha-setting-group` / `settings-list` group header) carries weight (600). Restores the header-vs-member hierarchy (SETTINGS-37) on `aha-setting-row` and `<aha-settings-list>` rows. (#79)

