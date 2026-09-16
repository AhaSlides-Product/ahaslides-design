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

## 0.49.0 — 2026-09-16
### Changed
- **Leaf components now inherit the host app's typography.** A leaf that pinned the product font on its shadow content (`font-family:var(--aha-font-product,…)` on a `.class`) couldn't be re-themed — its text drifted off a host app's own font even when both used Plus Jakarta Sans (the `aha-alert`-in-AntD case). The product font is now set **once on `:host`** and every text-bearing content element uses `font-family:inherit`, so a themed host that sets `--aha-font-product` (or inherits a font into the element) gets matching text with **zero per-component config**. Standalone usage is unchanged — `:host` still supplies Plus Jakarta Sans. Normalized across 24 leaves: `aha-add-item-button`, `aha-alert`, `aha-avatar`, `aha-badge`, `aha-button`, `aha-card`, `aha-card-select`, `aha-checkbox`, `aha-counted-input`, `aha-counted-textarea`, `aha-image`, `aha-image-action-button`, `aha-input`, `aha-number-with-unit`, `aha-progress`, `aha-radio`, `aha-rate`, `aha-segmented`, `aha-select`, `aha-status-badge`, `aha-switch`, `aha-tag`, `aha-tooltip`, `aha-user-info`. Font size/weight/line-height are unchanged. (#99)
### Added
- **Font-inheritance gate in `standards.mjs`.** The per-leaf source scan now hard-fails a `font-family` that pins `--aha-font-product` (or a bare literal font stack) on any selector other than `:host`, so the anti-pattern can't regress. Allowed: `font-family:inherit` on content, the font on `:host`, and the mono/display/secondary tokens; a justified deviation carries a per-line `ds-lint-allow: font (why)`. Ships hard-fail with an empty `FONT_DEBT` grandfather map (same idiom as the motion/a11y/responsive gates). Plan: `plans/font-inheritance-normalization.md`. (#99)

## 0.48.0 — 2026-09-15
### Added
- **Responsive gate — one UI, every device.** Device responsiveness is now a house non-negotiable with a rule + gates, so a new component/pattern/screen can't ship a layout that traps on a phone. Product UI must be **fluid from a 360px floor up** (reflow, never a horizontal scroll) with **≥ 24px** touch targets (WCAG 2.5.8 AA). `standards.mjs` (component source) and `screen-lint.mjs` (consumer screens) now **hard-fail a fixed `min-width` ≥ 360px trap** — the zero-interpretation source tell that a layout can't fit a phone (a fixed *width* below the floor is fine; a per-line `ds-lint-allow: responsive (why)` overrides). `screen-lint.mjs` also gains an opt-in **`--measure`** pass that renders a real screen at **360 / 768 / 1200** and hard-fails a horizontal overflow — the render-side twin, Chrome-gated so the static path stays dependency-free for consumer CI. New **`measureAtViewports()`** in `cdp.mjs` sweeps several viewports in one Chrome launch. (The measured pass is scoped to *screens*, not component showcases — a single composed screen must fit a phone, whereas a doc/showcase page legitimately packs many wide variants; a wide data table that scrolls is the one exception.) (#95)

## 0.47.3 — 2026-09-15
### Changed
- **Landing Button — matches the buttons the site ships today.** `landing/button.json` reverts the
  round-3 XL-pill styling: the block now uses the DS default `8px` radius (`--aha-radius-default`)
  and the large control height (`--aha-control-height-button-lg`, 40px) with `20px` padding — the
  same shape and size as both the product `aha-button` and the live `.btn`, so the docs preview reads
  as the real buttons. The pink-accent variant now uses `--aha-pink-60` (`#FF4081`, the live bold
  pink) resting and `--aha-pink-50` on hover. The state fixes from 0.47.2 (focus ring, secondary
  hover/press) are kept. `landing/SCAN.md`'s radius/size/pink rows and Webflow-to-update items 2 and
  8 are corrected accordingly (`#ff4081` is on the DS pink scale; no pill to apply in Webflow).
- **Landing docs — preview labels + no block badge.** The Button preview now labels each variant by
  name (Primary / Secondary / Pink), and the `landing block` badge is removed from every landing
  page heading in `generate.mjs`. (#93)

### Fixed
- **Landing Button — re-scanned against the live Webflow homepage, closed the completeness gaps.**
  `landing/button.json`'s secondary variant was missing the hover text-colour and press-border
  states, and used a plain `outline` for focus instead of the product `aha-button.js`'s soft
  box-shadow ring (`--aha-button-focus-ring`) — both now match the canonical Button primitive
  exactly. `landing/SCAN.md`'s Buttons section is rewritten with a full per-property verdict table
  and 14 new Webflow-to-update deltas (primary press colour, focus-ring colour, pill radius vs the
  live site's square `8px`, label weight, and the secondary border/hover/font-size shades) — DS
  wins every one, nothing was reconciled down to the live site. (#92)

## 0.47.1 — 2026-09-15
### Fixed
- **Modal — responsive width on mobile.** `modalWidth(size)` capped the dialog at a fixed viewport fraction (`35vw`/`50vw`/`90vw`), so on a phone a `simple` modal collapsed to ~135px. It now resolves to `min(<target px>, calc(100vw − 32px))` — the tier's px width on desktop, and near-full-width (16px gutter each side) on mobile. Height caps (`75/80/90vh`) are unchanged. `modalMaxWidth` stays exported as the per-tier desktop reference (no longer used to compute the width). (#91)

## 0.47.0 — 2026-09-15
### Added
- **Modal — two types + viewport size cap.** Reworked the shared Modal to the DS V3 spec: **two types** (a Confirmation modal — five contexts default/confirm/warning/info/danger with a status icon, copy, a Learn-more link and Cancel/Apply — and an Action modal — a task surface with an optional divider), each **capped to the viewport in both axes** so it never grows bigger than the screen. New `modalWidth(size)`, `modalStyles(size)`, `modalMaxWidth`, `modalMaxHeight` exports on `@ahaslides-product/design/modal-theme` keyed by three sizes — **simple 504·35vw·75vh · complexity 720·50vw·80vh · rich 1280·90vw·90vh**: `width={modalWidth('complexity')}` caps the width (`min(target px, vw)`, stays centred) and `styles={modalStyles('complexity')}` caps the height (`auto` up to the cap, then the body scrolls while title + footer stay pinned). Every modal opens as a real overlay — portals to `<body>`, an always-on mask, page scroll locked, closes on mask/Esc/✕ (a destructive confirmation overrides to non-mask-closable). The Learn-more link is a `--aha-text-link` anchor whose external-link glyph shows only when it leaves AhaSlides. The doc playground **triggers each variant with a button**, and the HTML/React/Vue snippets show both types. (#89)

## 0.46.1 — 2026-09-14
### Fixed
- **Landing area links 404** — the Landing index page linked to its block pages with a doubled `landing/landing/<slug>/` path (it rendered as if hosted at the site root, one level too shallow), so every block link and the page's own nav/fonts 404'd. The index now resolves links from its real `landing/` depth. (#88)

## 0.46.0 — 2026-09-14
### Added
- **Landing basics** — the framework-free landing tier gains its core marketing blocks alongside Hero: **Section container** and **Grid** (Layout), **Button** and **Link** (Elements), and the **Spacing** and **Fonts** Foundations-usage references. Each is a paste-and-run `landing/<slug>.json` bound entirely to the shared `--aha-*` tokens (no second brand source): Button follows the product `aha-button` contract in an XL marketing register, Spacing/Fonts reference the shared scales, and every value was grounded against the live AhaSlides Webflow homepage (see `landing/SCAN.md`). (#87)

## 0.45.0 — 2026-09-14
### Added
- **Landing** — a new top-level area for the AhaSlides landing/marketing sites, alongside Components and Patterns. It shares Foundations (the same `--aha-*` tokens) and is a separate tier from the product-app Patterns: framework-free, paste-and-run HTML+CSS marketing sections a landing builder drops into Webflow/WordPress/a static page. One artifact per block in `landing/<slug>.json`; the generator emits the scoped sidebar, a gallery, a doc page per block, and the `landing.llms.txt` / `landing.agent.json` feeds. First block: **Hero**. (#87)
- **Type & spacing tokens as CSS vars** — the canonical `size`, `space`, `weight`, `lineHeight`, `letterSpacing`, `controlHeight` and `breakpoints` scales are now emitted as `--aha-*` custom properties (e.g. `--aha-size-h1`, `--aha-space-24`, `--aha-weight-semibold`, `--aha-radius-marketing`, `--aha-font-secondary`), so framework-free surfaces and components can bind every dimension to a token instead of hardcoding px. Values are derived from `tokens.canonical.json`; no new numbers authored. (#87)

## 0.44.0 — 2026-09-14
### Added
- **Screen-lint** — a mechanical composition gate (`node screen-lint.mjs --surface=product|canvas <files>`; `./screen-lint` export, `npm run lint:screen`, now in `npm run check`). It's the **static companion to the anti-slop self-judge**: before the binary judge, it hard-fails the zero-interpretation defects on a consumer screen — raw hex / off-scale radius / off-scale font-weight / gradient fills / icon-only-without-an-accessible-name (product surface); hardcoded colour / sub-16px + viewport-unit fonts (canvas surface). `--surface` routes the world first, like the judge. Statically-undecidable rules (token-layer contrast, copy, right-instrument) stay the self-judge's job. (#86)
### Changed
- **Type scale** — weights are now **400/600 only**; `700` is dropped from the product type scale (Display uses 600, not Bold). The one remaining literal `font-weight:700` is the measured `aha-tabs` primary-tab label, grandfathered pending re-measure; screen-lint hard-fails any other weight. (#86)
### Fixed
- **Badge snippet** — the paste-and-run example set a raw `background:#fff`; now bound to `var(--aha-bg-container,#fff)` (the first defect screen-lint caught). (#86)

## 0.43.2 — 2026-09-14
### Fixed
- **Foundations · Typography** — the ROLE column specimen font-size was capped at 28px, so display1/display2/h1/h2/h3/h4 all rendered at the same size and the type scale looked flat; each role now renders at its true token size (display1 64px down to bodySM 12px). (#85)

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

