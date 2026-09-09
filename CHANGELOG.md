# Changelog

All notable changes to `@ahaslides-product/design`, **newest first**.

**The rule:** every merge adds one entry here **and** bumps `version` in `package.json`.
The top entry's version MUST equal `package.json` → `version` — `standards.mjs` enforces it, so a
PR that forgets either goes red. The `v<version>` release tag (what `npm publish` ships) matches too.

**Format** — one entry per version:

```
## X.Y.Z — YYYY-MM-DD
### Added        ← new component / prop / token / export
### Changed      ← behaviour or API change to something that already shipped
### Fixed        ← bug / gate / doc fix, no API change
### Removed       ← a removed export / component / token
- one short bullet per change, written for a consumer; link the PR: (#123)
```

Include only the sections you touched. **Versioning is [SemVer](https://semver.org)** — pre-1.0:
an additive change (new component/prop/token) bumps **MINOR** (`0.x.0`); a fix with no API change
bumps **PATCH** (`0.0.x`); a breaking change also bumps MINOR until 1.0, and is called out in the bullet.

## 0.4.1 — 2026-09-09
### Fixed
- Button docs (`button.html.txt`/`.react.txt`/`.vue.txt`/`.preview.html`): the icon-slot examples (add/close/more) were hand-rolled inline `<svg>` — a direct violation of the icon contract's "call by name, never inline SVG" rule, and inconsistent with the Icon component's own docs. Swapped to `<aha-icon name="system-plus|system-x|system-dots-three">`. (#PR)

## 0.4.0 — 2026-09-09
### Added
- Standards gate: a **motion rule** on leaf sources, so a dropped transition can't pass. It flags four ways motion gets lost — (1) an interactive element with no `transition` (snap), (2) a `transition` timed with a bare literal instead of a motion token (drift), (3) a **dead** transition: the element rebuilds its subtree via `innerHTML=` on the state attribute the transition animates, so it never fires **even with correct CSS** (why the Switch didn't animate on click after its motion was re-tuned), and (4) an **example out of sync**: `parts/<slug>.preview.html` (the copy `qa.mjs` measures) is missing a transition the element ships, so the rendered example shows different motion than the component. Escape hatch `ds-lint-allow: motion (why)`. Ships **warn-first** behind `MOTION_HARD_FAIL`; flips to hard fail once the re-rendering leaves (switch/checkbox/tooltip) are restructured. Mirrors the colour/radius enforcement. (#27)
### Changed
- AGENTS / PRINCIPLES / CONTRIBUTING: motion is now a documented house non-negotiable — animate interactive states via `--aha-motion-*` / `--aha-ease-*`, never snap, never a bare literal, and keep the transition on a persistent node (don't re-render the subtree on a state change). (#27)

## 0.3.0 — 2026-09-09
### Added
- `aha-input` `size` prop (`sm` 24 · `md` 32 · `lg` 40), matching the measured DS V3 field scale; radius stays 8. (#PR)
- Motion token layer: `--aha-motion-fast/-mid/-slow` and the Ant eases `--aha-ease-in-out`, `--aha-ease-out`, `--aha-ease-in-out-circ`, `--aha-ease-out-back`, emitted from `generate.mjs` into the `--aha-*` variables. (#PR)
- Changelog is now surfaced in the generated DS: a browsable **Changelog** page (`/feeds/changelog.html`, linked from the header version badge), a fetchable raw feed at `/CHANGELOG.md`, the current version + changelog URL in `llms.txt` and `design.md` headers, and the full log appended to `llms-full.txt`. Agents and humans both see what changed per release. (#23)
### Changed
- DS V3 conformance: field default height corrected 36 → 32 across Input, Select, Form and DatePicker (controlHeight root 32). (#PR)
- `aha-switch` aligned to the measured DS V3 toggle: track 44×22, 1px `#D4D4D4` border, off `#F7F7F7`, disabled 40% opacity. (#PR)
- `aha-tag` radius 6 → 4, matching the measured DS V3 tag (`--aha-radius-xs`). (#PR)
- Leaf transitions (input, tag, badge, switch, tooltip, button, checkbox) re-tuned to Ant's motion system: controls `.2s` ease-in-out, switch `.2s` ease-in-out-circ, tooltip pop `.2s` ease-out-back; `lib/` and the inline `parts/*.preview.html` copies kept in sync. (#PR)
### Fixed
- `tag.preview.html` had drifted to no transition at all — restored and matched to `lib/aha-tag.js`. (#PR)

## 0.2.1 — 2026-09-09
### Changed
- Components nav: the planned-inventory catalog now spans the full AntD v6 taxonomy (General / Layout / Navigation / Data Entry / Data Display / Feedback) merged with the AhaSlides surfaces (Paywall, Status badge, CSAT, Settings list) — 57 planned, live pages still from `contracts/`, the rest greyed "soon". Datepicker nav slug aligned to its shipped contract. (#23)

## 0.2.0 — 2026-09-09
### Added
- Changelog + version rule: every merge now adds a dated entry to `CHANGELOG.md` and bumps `package.json` → `version`. `standards.mjs` gates it (top entry must match the package version, be dated, and carry ≥1 bullet).

## 0.1.0 — 2026-09-08
### Added
- Initial design system: `--aha-*` tokens, the `<aha-icon>` call-by-name registry, the `aha-checkbox` / `aha-button` / `aha-paywall` leaf elements, the shared DataTable composite (antd theme), the generated agent feeds in `dist/`, and the standards + render gates (`npm run check`).
