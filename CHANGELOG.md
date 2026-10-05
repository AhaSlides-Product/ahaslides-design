# Changelog

All notable changes to `@ahaslides-product/design`, **newest first**.

**The rule:** every merge adds one entry here **and** bumps `version` in `package.json`.
The top entry's version MUST equal `package.json` → `version` — `standards.mjs` enforces it, so a
PR that forgets either goes red. The `v<version>` release tag (what `npm publish` ships) matches too.
The gate also rejects an unfilled `(#129)` placeholder in the top entry: link the **real** PR number.

**Format** — one entry per version:

```
## X.Y.Z — YYYY-MM-DD
### Added        ← new component / prop / token / export
### Changed      ← behaviour or API change to something that already shipped
### Fixed        ← bug / gate / doc fix, no API change
### Removed       ← a removed export / component / token
- one short bullet per change, written for a consumer; link the real PR: (#123) — never a bare (#125)
```

Include only the sections you touched. **Versioning is [SemVer](https://semver.org)** — pre-1.0:
an additive change (new component/prop/token) bumps **MINOR** (`0.x.0`); a fix with no API change
bumps **PATCH** (`0.0.x`); a breaking change also bumps MINOR until 1.0, and is called out in the bullet.

## 0.81.0 — 2026-10-05
### Added
- **`<aha-progress-toast>` (Feedback).** A bottom-right card for one long-running task (slide import, export, upload): file icon, name, DS Progressbar, caption + Cancel action, and `progress` / `success` / `cancelled` / `offline` / `error` states with a ✕ on terminal states. `icon`, `action` and `footer` slots take a branded file icon, a Cancel control and a cancel confirmation, retry buttons or an `<aha-csat>` rating. Pure view: the consumer owns the task, copy and auto-dismiss. Reuses Progressbar, Button, Csat and Icon; first consumer is the presenter Import notification. (#PR)

## 0.80.1 — 2026-10-05
### Fixed
- **The agent plugin no longer ships Python bytecode.** `agent/hooks/__pycache__/*.pyc` committed in 0.80.0 is removed, and `__pycache__/` and `*.pyc` are now ignored; `npm test` fails if bytecode is tracked under `agent/` again. (#151)

## 0.80.0 — 2026-10-05
### Added
- **The DS ships its own Claude Code plugin.** This repo is now a plugin marketplace: `/plugin marketplace add AhaSlides-Product/ahaslides-design`, then enable `ahaslides-design@ahaslides-design`. The plugin (`agent/`) carries the `aha-design` skill and its hooks (prompt mandate, design guard incl. the Vue 2 new-file rule and storybook-kit block, end-of-turn judge, anti-slop floor), versioned with each release. Hooks read criteria from the installed package, else the plugin's own copy of `anti-slop/criteria.json` from the same release; no network. It replaces `aha-design` in `aha-claude-plugins` after a short overlap; enable one of the two. Setup is in the README, "Agent plugin". (#150)
- `standards.mjs` fails when `agent/.claude-plugin/plugin.json`'s version differs from `package.json` or the plugin's criteria copy differs from the store; `npm test` runs the hook suites. (#150)
### Fixed
- **`tokens.css` and element registrations survive tree-shaking.** `sideEffects` now covers every CSS file (`*.css`), `lib/all.js` and `lib/aha-loader.js`, so a webpack / vue-cli build no longer drops `import '@ahaslides-product/design/tokens.css'`. `standards.mjs` fails when an exported CSS file or a custom-element registration is missing from `sideEffects`. (#150)

## 0.79.1 — 2026-10-05
### Fixed
- **`@ahaslides-product/design/screen-lint` now resolves to `lintHtml`.** A duplicate `./screen-lint` key in `exports` (pointing at the CLI file) shadowed the new entry in 0.79.0; the CLI file stays importable as `./screen-lint.mjs`. A test now imports the documented path through the package name. (#149)
- **`ds-lint-allow` names exact rules.** Naming `raw-hex` no longer also silences `canvas-hardcoded-colour`; only the short group names (`hex`, `responsive`) cover more than one rule. (#149)

## 0.79.0 — 2026-10-05
### Added
- **`lintHtml(source, { surface, path? })`** — `screen-lint` as a pure importable function (`@ahaslides-product/design/screen-lint`): no fs, no process, no console, runs in Node and Cloudflare workerd, icon names bundled (`lib/icon-names.js`). Returns `{ findings: [{ rule, line, message, severity }] }`. The CLI is built on it and keeps its output and exit codes. (#148)
- **Unit tests** for `lintHtml` (`tests/screen-lint.test.mjs`, `npm run test`), run in CI and `npm run check`. (#148)
### Changed
- **`ds-lint-allow` is now per rule with a reason**: `ds-lint-allow: <rule-id>[,<rule-id>] (<reason>)` silences only the named rules on that line. A bare `ds-lint-allow` no longer suppresses anything and is reported as a `ds-lint-allow-bare` warning (never a hard fail), so existing screens can migrate. (#148)

## 0.78.0 — 2026-10-05
### Added
- **`<aha-stepper>`** — framework-free stepper (`stepper` page): numbered markers, a check on finished stages, the current stage marked with ink (outline + semibold, `aria-current="step"`), never the primary accent. `size="lg"` for a slide canvas, `navigable` for clickable stages, colours follow `currentColor` so it tracks the deck ink. (#147)
- **`<aha-autocomplete>`** — framework-free autocomplete (`autocomplete-field` page) on the `<aha-select>` chrome: ARIA 1.2 combobox with a list popup, filter-as-you-type with the match in bold, Arrow / Alt+Arrow / Enter / Escape keyboard model, free text allowed, `input` and `change` events. (#147)
- **Icons `system-sad-face` and `system-angry-face`** — on the 16px grid in the `system-smiley` style, for mood labels such as Sad and Mad. (#147)
- **Guide: "Using the design system in Vue 2"** (`guidelines/vue2`) — new UI in the presenter, audience and admin apps uses `<aha-*>`, never the `stpancras-storybook-app` kit; existing screens stay unless a task asks to migrate. Covers loading `all.js` + `tokens.css` once pinned to a tag, `Vue.config.ignoredElements`, `.prop` bindings and `CustomEvent` detail, with a worked example. (#147)
- **Judge criteria + eval cases**: canvas C23 and audience C35 (stage indicators and type-to-pick fields are `<aha-stepper>` / `<aha-autocomplete>`, current stage in ink), icons C7 (a glyph matches its word); the canvas and audience guidelines and guides now name both elements. (#147)

## 0.77.0 — 2026-10-05
### Added
- **`<aha-button size="xl">`** — 52px tall, 28px padding, 12px radius, 16px label (the web-component twin of React `<XLButtonScope>`), for presenter controls drawn inside a slide canvas and read from across the room. Size only through the attribute; never `::part(button)` height, padding or font-size. (#146)
- **Slide-canvas and audience rules that used to live only in the retired `aha-design-*` skills**, now in `guidelines/canvas.json`, `guidelines/audience.json`, the two guides and `llms.txt`: one accent per deck (`presentationColorPalette[0]` on `--aha-color-primary` at `:root`, same on canvas, audience and buttons; only label ink by contrast; semantic colours never as data colours); no slide-wide scrim on a framed photo deck; 1px neutral card hairline and 1.5px chip border; one dark ink `#1A1A1A`; motion tokens on persistent nodes. (#146)
- **Judge criteria + eval cases** for those rules: canvas C17–C22 and audience C31–C34 in `anti-slop/criteria.json`, with bad and good cases in both eval sets. (#146)
### Changed
- **Presenter controls on the Developer Platform render in-canvas.** Canvas C3/C4 and the guide now scope the host control bar to built plugins that declare manifest actions; build-less slide types render an in-canvas `<aha-button size="xl">` row. (#146)
- **Radius cap reconciled with the DS card.** Cards and panels are 12px (`--aha-radius-lg`), tiles, inputs and buttons 8px, nothing rectangular above 12px; the old "everything ≤ 8px" cap is gone from both guides. (#146)
- **Audience type scale no longer contradicts itself.** Primary copy, option and chip labels are 16px (`--aha-size-l`); 14px (`--aha-size-default`) is secondary metadata only; the guide and C19 now state that `--aha-size-sm` is 12px. (#146)

## 0.75.0 — 2026-10-05
### Added
- **Detail sections for expandable panels.** `DataTable.DetailSection` (and `DetailSection` from `createExpandableRows`) is one titled block of a detail panel; return one or several from `renderDetail` (e.g. a Questions sub-table above a Pages sub-table) and the panel stacks them 16 apart. The panel now owns sub-table styling too: every antd Table inside it is a white bordered card at one compact density (8 / 16 cells) whatever `size` it is given, so sub-tables need no margin, padding or `size` of their own. A new "report detail" case on the Data table page reproduces the eLearning Course report screen. (#141)
### Fixed
- **Expandable rows no longer misalign their own cells.** The 24px chevron / spacer sat on the text baseline, lifting the first-column text 2–3px above every other cell (header and body) and making decorated rows taller than plain ones (46px against 39px in a small table); the chevron now fits the 22px line, so every cell shares one baseline and one row height in detail, tree, DataTable and plain-Table modes. (#141)
- **No empty chevron column.** A table where no row can expand (e.g. a nested Questions table before anyone answers) no longer reserves a spacer column in its header and rows. (#141)
- **Expandable styles no longer leak into nested tables.** Row, tree-child and panel rules now target only the rows the hook owns, so a plain antd Table inside a panel keeps its own rows. (#141)
- **A wide sub-table can no longer stretch the parent table**, and an `ellipsis` first column still truncates after the chevron. DataTable stops forcing `scroll.x: 'max-content'` when a column uses `ellipsis` (and nothing is freezable or resizable), so ellipsis columns truncate instead of scrolling — callers no longer need `scroll={{ x: undefined }}`. (#141)
- **Sticky headers work in DataTable.** The rounded container clips with `overflow: clip` instead of `overflow: hidden`, which had made it a scroll container and broken `sticky`. (#141)

## 0.74.1 — 2026-10-05
### Changed
- `AGENTS.md` now points agents at the full `<aha-chart>` configuration docs (`docs/chart/README.md`, `contracts/chart.json`, Charts tab) (#145).

## 0.74.0 — 2026-10-01
### Changed
- **Charts is now its own top-level tab** next to Settings and Audience Library, built the same way (one page, shell sidebar replaced by the shared "On this page" anchor). It holds the chart examples, playground, "Choosing a chart" guide, API, install and spec, and moves out of the Components list and overview. The old `chart/index.html` URL redirects to `charts/index.html`; `chart.agent.json`, `chart.md`, `chart.llms.txt` and the llms.txt entry are unchanged. Docs search finds the page under Charts. (#142)
- **`<aha-chart>` now says which chart type to use.** `contracts/chart.json` `opinion.whenToUse` gains one row per type (bar, column, stacked, donut / pie, radial, treemap, quadrant, bell, radar, wordcloud, mindmap): the data shape it fits, the slide type it serves, its real limits (six-category fold into "Other (n)", column to bar fallback, 120 words, six bell statements) and what to use instead. The chart docs page gains a matching "Choosing a chart" table, and the generated feeds carry both. (#142)
- **Bell curve and Quadrant wording.** The bell use case now covers any distribution of answers on an ordered scale, not only Rating scale; the 2×2 matrix is called Quadrant across the docs page, the README and the contract, and the chart's accessible names read "Answer distribution" / "Phân bố câu trả lời" and "Biểu đồ góc phần tư". (#142)
- **Charts page: no Type row in the playground.** The Numbers and Highlight controls stay; each chart type is reached from its own section and the "On this page" nav. (#142)
- **Every chart type has a default snippet and its own Show code.** `contracts/chart.json` gains `typeDefaults` (11 minimal `<aha-chart>` snippets, one per type, in `parts/chart.default.<type>.html.txt`) that flow into `chart.agent.json` (`typeDefaults`), `chart.md` and the llms feeds; the contract note tells agents to start from the type's default and only add attributes. Each chart-type section on the Charts page now has a Show code widget with HTML, React and Vue 3 tabs (same tabbed widget as the Audience Library and Settings) plus the selected case, following the switcher; the React and Vue forms set data as a property and wire `wordcloud-hide` / `mindmap-change`, and `chart.agent.json` `typeDefaults` is now `{ type: { html, react, vue } }`; the page-level widget moved to Install and use. Opt-in-only behaviours are listed in `docs/chart/README.md`. The Charts page no longer repeats the "Install" heading. (#142)

## 0.73.0 — 2026-10-01
### Changed
- **CSAT matches the import-completion design (PRO38-77).** `<aha-csat>`: the prompt is 12px in #616161; the thumbs are 28×24 borderless buttons with 16px #4A4A4A icons (ghost fill and primary icon on hover) instead of bare 16px #8A8A8A icons, with Good / Not good tooltips; the feedback popover gains a small round X (closes only, keeps the rating), its Send button is secondary, reads "Send" and stays disabled until text is typed, the field clears after sending, and the "What could be better?" heading is gone unless `feedback-prompt` is set (**breaking** for anyone relying on the default heading). (#143)
### Added
- `<aha-csat feedback-button>` shows a Feedback chat icon beside the thumbs (tooltip Feedback) that opens the same popover with the `feedback-button-placeholder` (default "Share your thoughts") without rating. New `like-label`, `dislike-label` and `feedback-label` attributes localise the tooltips. (#143)
- The `feedback` event now carries the current rating (`'up'`, `'down'` or `null` when unrated) instead of always `'down'`, since the Feedback button can send without a thumbs-down. Esc and the X return focus to the control that opened the popover. (#143)

## 0.72.0 — 2026-10-01
### Added
- **Expandable rows for Table and DataTable (React).** New `@ahaslides-product/design/table-expandable` (`createExpandableRows({ React })` → `useExpandableRows`) gives a plain `tableTheme` Table and the shared DataTable one collapse / expand behaviour, replacing every hand-rolled antd `expandIcon` caret. Two shapes: a **detail panel** (`renderDetail(record)` — free content or a nested sub-table under the row) and **tree rows** (rows with `children` share the parent's columns). A leading 24px chevron button (`system-caret-right`, rotating 0 to 90 degrees on the motion tokens) with `aria-expanded` + `aria-controls`, Enter / Space and a visible focus ring; an aligned spacer on rows that cannot expand; whole-row click toggles too without double-toggling and without firing from links, buttons or inputs. Several rows can be open at once, an optional header toggle (`expandAllToggle`) expands / collapses all, and the expanded state is keyed by row key so it survives sort, filter and pagination (controlled or uncontrolled). The chevron sits inline in the first column in every mode, so detail panel and tree rows, DataTable and plain Table share one layout, indentation and motion. The open state is unmistakable without a fill on the parent: the open parent row keeps the plain surface with bold text and a primary chevron, while its panel or child rows take a gray-20 surface (the nested sub-table sitting in a white bordered card). Plus a loading slot (`loadingKeys` + `onExpand` for lazy fetches). DataTable takes it as the `expandableRows` prop; the Data table docs page shows detail panel, loading, tree and plain-Table cases. (#139)

## 0.71.0 — 2026-10-01
### Added
- **Public README for the chart library** (`docs/chart/README.md`, linked from the root README). A standalone guide for outside developers: copy-paste quick start from a pinned jsDelivr tag (no registry, no build step), ES module import, all 11 chart types with their data shapes, attributes, `options` and `chartOptionDefaults`, palettes, locale and `strings`, events, accessibility, empty state and browser support. (#140)

## 0.70.0 — 2026-10-01
### Added
- **`--aha-tooltip-max-width` (280px) — new layout token** (`layout.tooltipMaxWidth`). The tooltip bubble now wraps at 280px instead of 200px, closer to the Presenter app's 336px; the tooltip conformance check asserts the rendered cap. (#138)
- **Standards gate: new tokens need owner sign-off.** Any leaf token added to `tokens.canonical.json` fails the gate until its path is listed in `tokens.acknowledged.json`, so agent-proposed tokens get a visible one-line review. (#138)
- **Standards gate: raw spacing px.** A component whose source gains a `padding`/`margin`/`gap` literal above 1px fails the gate; existing cases are grandfathered per file in `standards.baseline.json` (ratchet down with `node standards.mjs --update-baseline`; justify one line with `ds-lint-allow: spacing`). (#138)
- **`version-drift.mjs` (`npm run drift`).** Lists the repos consuming `@ahaslides-product/design`, the version each pins and the latest published, with a `--line` mode for one report line. (#138)
### Changed
- Guideline pages no longer point at the retired `aha-design-*` plugin skills (the plugin now ships one `aha-design` skill); they reference the DS guide and anti-slop feed, and the gate rejects the old references. (#138)

## 0.69.1 — 2026-09-30
### Added
- **Anti-slop `charts` surface.** The judge now fails a result/data chart that is not `<aha-chart>` (C1: hand-rolled SVG/canvas or a third-party chart library; `@ant-design/plots` stays allowed for a chart type `<aha-chart>` does not ship) and a chart on the wrong palette (C2: `brand` on app screens, `deck` on the canvas), with a DS-authored eval set. `screen-lint.mjs` also hard-fails an import of Chart.js, Recharts, ECharts, D3, Highcharts, ApexCharts, Victory or Nivo (opt out per line with `ds-lint-allow: chart`). (#137)

## 0.69.0 — 2026-09-30
### Added
- **`<aha-chart>` — the AhaSlides chart library.** One framework-free element draws all 11 result types from the "AhaSlides Chart Slides" mockup: Bar (Poll, Ranking, images incl. image-only options, paging), Column (Poll, Pick Answer, images; turns into bars when labels can't fit), Stacked, Donut / Pie (leader lines or legend), Radial, Tree map, 2×2 matrix (quadrant), Bell curve, Radar (5 / 10 / 100 scales, compare subjects, 8 entrance effects), Word cloud (shapes, image masks, rotation, duplicate merging, click-to-hide with undo) and Mind map (collapse, +N paging, optional add / rename). `palette="brand"` (default) for Report and other app screens; `palette="deck"` + `colors` + `ink` on the presenting/audience canvas. Attributes: `number-format`, `sort`, `highlight-top`, `log-scale`, `legend`, `tooltip`, `max-items` ("Other (n)" past the cap), `page-size`, `correct` + `correct-style` (Pick Answer), `responses`; type-specific settings through the `options` property (defaults exported as `chartOptionDefaults`); `replay()`; `wordcloud-hide` and `mindmap-change` events. Empty results keep each track with a short series-coloured stub at its start (12px on a bar, a 16px full-width stub on a column, joined under its image card when there is one; bars, columns, stubs and image cards share --aha-radius-default) — no waiting text. Legends are compact rows centred against the plot; the tree map fits its box and drops to % only, then no chip, on small tiles. The Bell curve adds an optional grid, % axis and mean line; its % axis picks its step (10 / 20 / 25 / 50%) from the panel height so tick labels never crowd. The Chart docs page gives each chart type its own divided section with a case switcher (one variant shown at a time), plus a playground tab for all 11 types. Ships a text summary, a hidden data table and a polite live-region announcement on updates; built-in copy follows `locale` (en, vi) and takes the Presenter app's translations through `strings`. (#135)
- **`--aha-blur-md` (20px) — new effect token** for the frosted backdrop blur behind translucent chart surfaces (tracks, chips, legend hover, mind-map controls). (#135)
- **`--aha-viz-*` data-visualisation tokens** (series, tints, ink and neutral as aliases of semantic DS colour tokens: brand slots 1, 2, 4, 6, 5, 10 for the series, bg-accent / brand-12 / bg-positive / bg-warning-subtle / brand-11 / bg-informative for the tints, text-default, text-inverse, icon-muted; bar/column geometry incl. the empty-state stub length, the shortest non-zero bar and the column minimum height, ink mixes incl. axis and pressed) and **`--aha-motion-viz-*` / `--aha-ease-viz`**; inside the element every text size, weight, line-height, padding, margin, gap and radius uses the type, spacing and radius tokens, and secondary text, axes, grids, tracks and tooltips use the semantic text / border / bg tokens chart motion tokens, geometry values from the mockup, so a token owner can refine them without touching the element. `tokens.canonical.json` values may now be `{color.…}` aliases: `tokens.css` emits `var(--aha-…)`, and `tokens.js` resolves the hex and exports `tokenAliases`. (#135)
### Changed
- AGENTS.md / PRINCIPLES.md / canvas guide: result charts use `<aha-chart>`; `@ant-design/plots` stays for chart types it doesn't ship yet. The canvas guide flags the open Pick Answer decision (mockup green fill vs `correct-style="indicator"`). (#135)

## 0.68.5 — 2026-09-30
### Fixed
- **Tooltip bubble no longer collapses to one word per line.** A `help` (`?`) tooltip's bubble was sized against its 16px trigger, so a full-sentence hint (the eLearning SCORM "Tracking" tooltip) rendered about 70px wide. The bubble is now `max-content` wide up to the unchanged 200px cap, so short hints stay on one line and long ones fill the cap; all 12 placements and slotted triggers position as before. The Tooltip conformance gate now asserts a full-sentence help bubble is at least 150px wide. (#136)

## 0.68.4 — 2026-09-30
### Added
- **UX writing rule UXW-9 for tooltips.** One idea, one plain-text sentence of about 80 to 120 English characters (translations run 30 to 40% longer), no restating the label, no rich content, and never the only home for essential information. The Tooltip contract and the Settings `?` tooltip guidance point to it. (#136)

## 0.68.3 — 2026-09-29
### Fixed
- **Agents now discover the Settings pattern.** `llms.txt` gains a generated **Patterns** section above Components (one line per `guidelines/*.json`, with a when-to-read trigger) and lists `guidelines.llms.txt` in Feeds; the Settings entry says it applies to any options UI in any container and points at its `#ctrl-<slug>` control table. Settings-family component entries and `<slug>.agent.json` (`feeds.pattern`) link back to the Settings hub. The Settings guideline no longer refers to the removed `aha-design-settings` skills. (#134)

## 0.68.2 — 2026-09-29
### Fixed
- **Table row hover is one colour: gray-30 `#F1F1F1`.** `lib/table-theme.js` still set `rowHoverBg` to the brand-tint `#F9F5FF` while `contracts/table.json` and `<aha-data-table>` already used `#F1F1F1`; the theme now matches. The header filter-trigger hover is unchanged. (#133)

## 0.68.1 — 2026-09-28
### Fixed
- **Docs site shell is responsive at 360 / 768 / 1440.** The 268px sidebar forced horizontal page scroll on every component/guideline page below ~630px; it's now an off-canvas panel below 900px, opened via a new header toggle (closes on a nav click, the backdrop, or Escape). Two remaining generator-output overflow sources are fixed too: the playground's variant segmented control now wraps instead of forcing width, and the API prop table now scrolls in its own container (the documented "wide table scrolls" exception) instead of pushing the page wide. The header's top-nav tabs no longer need an internal scroll at 1440px (the site's own hidden-metadata breakpoint moved from 1279 to 1489). (#132)
### Changed
- **The house responsive contract's top check width moves from 1200px to 1440px.** `screen-lint.mjs --measure` now renders 360/768/1440 (was 360/768/1200); the AGENTS.md non-negotiable text updated to match. (#132)

## 0.68.0 — 2026-09-28
### Removed
- **Landing tab removed from the docs site.** It duplicated the rest of the system: its Button and Link blocks repeated Components (`<aha-button>`, including the `link` / `text-link` variants), and its Fonts, Spacing and Grid blocks repeated Foundations and the product Grid. Breaking for anyone reading the old feeds: `landing.llms.txt`, `landing.agent.json` and the per-block `landing/<slug>/<slug>.md` / `.agent.json` are gone. The old `landing/…` page URLs now forward to where each block lives. (#131)
### Changed
- **Hero and Section container move to Patterns → Marketing sections.** Same preview, paste-and-run HTML and token-load snippet; source is now `marketing/<slug>.json`, pages are `marketing/<slug>/index.html`, and the feeds are `marketing.llms.txt` / `marketing.agent.json`. (#131)
- **The Webflow-to-update audit is kept in the repo** at `docs/landing-webflow-scan.md` (was `landing/SCAN.md`; not a site page). It now records the three landing-only values not yet in the product system: the pink promotional button, the underlined prose link, and the Nunito Display/H1-only headline rule. (#131)

## 0.67.0 — 2026-09-28
### Added
- **UX writing rule UXW-8: no em dash or en dash in product copy.** Added to `guidelines/ux-writing.json` (rule + ref), the `ux-writing` composition guide (`parts/ux-writing.guide.md`), and the DS-owned anti-slop store as criterion `C8`, authored here in the DS (the plugin's ux-writing skill is retired in aha-design 2.0.0, so the DS is the only home for the rule). Fixed the one existing example in `guidelines/ux-writing.json` and `parts/ux-writing.guide.md` that used an em dash as punctuation, so the page's own copy follows its new rule (#128)
- **Eval set:** the ux-writing eval set gains a bad and a good case for C8, so the accuracy gate measures the new rule. (#128)

## 0.66.0 — 2026-09-28
### Added
- **An accuracy gate for the anti-slop store: all fifteen surfaces now ship a labelled eval set at `anti-slop/evals/<surface>/evals.json`.** The aha-design judge datasets (plugin v1.80.0) are ported for `audience`, `background`, `canvas`, `component-standard`, `feedback`, `icons`, `overlays`, `paywall`, `settings`, `shared-components`, `status-badges`, `table`, `typography` and `ux-writing` (canvas with its code fixtures), each case pinned to an explicit `expected` verdict keyed to the DS criterion ids. Cases that contradicted the live DS were remapped rather than copied, with the reason in each case's `source.remap`: typography no longer accepts Inter for a label role (the DS has no Inter), component-standard cases cite the live contracts and doc-site render instead of the plugin's frozen `contract.json` / `review.html`, the Button matrix is the live 10 variants × sm/md/lg, feedback banners are the DS `<aha-alert>` rather than the plugin's AhaAlert wrapper, shared-components cases name the 0.64.0 primitives (`<aha-field-error>`, `<aha-live-region>`, `<aha-progressbar>`, `<aha-viewport-switch>`, `<aha-error-page>`, `<aha-empty>`), and settings cases pinned to the judge's `CR` (reuse over rebuild), which the store does not carry, are re-keyed to C10 / C13 or listed under `notPorted`. `app-shell` has no plugin judge, so its set is DS-authored with code fixtures; `icons` C6, settings C5–C8 and the new shared-components primitives gain authored cases. Every store criterion now has at least one FAIL case. (#129)
- **`standards.mjs` gates the eval sets (no model call).** For every store surface: an eval set exists, every case is well-formed, every expected criterion id exists in `criteria.json`, both PASS and FAIL cases are present, every fixture resolves and no case cites a frozen plugin snapshot; plus a verdict-parser self-test. A new surface without an eval set now fails `npm run check`. (#129)
- **`npm run evals:anti-slop` — the live, model-in-the-loop scorer.** Hands the judge the store's own criteria for a surface, majority-votes over `--samples`, and prints per-case results, a per-criterion confusion table and overall accuracy (`--min-accuracy` to gate, `--dry-run` to print prompts). Documented in `anti-slop/README.md`. (#129)

## 0.65.0 — 2026-09-28
### Removed
- **Breaking: the `antd` anti-slop surface is gone.** The DS components already wrap AntD v6 with the house theme, so a separate "is this AntD styled right" judge duplicated them. The store now has 15 surfaces. `background` stays: it has its own guideline, and its criteria never depended on the antd judge. (#130)

## 0.64.0 — 2026-09-28
### Added
- **The a11y runtime primitives now ship in the DS — the `aha-design-shared-components` plugin registry resolves to real exports.** Five new components, each with a contract, doc page, HTML/React/Vue snippets and a render-gated conformance block:
  - **`<aha-field-error>`** (`./aha-field-error`) — the accessible field / validation error: a stable id for the input's `aria-describedby`, danger text, nothing rendered while empty (the a11y FieldError); `variant="respondent"` is the FieldErrorDisplay contract (`role="alert"`, assertive). (#127)
  - **`<aha-live-region>`** (`./aha-live-region`) — screen-reader announcements: assertive + atomic, stays mounted when empty, no `role="alert"`; `announce(text)` re-announces identical text; `politeness="polite"` and `visible` options. (#127)
  - **`<aha-progressbar>`** (`./aha-progressbar`) — the accessible bar over `<aha-progress>`: the host is `role="progressbar"` with your real `value`/`min`/`max`, a `label` and optional `value-text`; the visual bar is hidden from AT so it is announced once. (#127)
  - **`useIsMobile()`** (`./use-is-mobile`, React as an optional peer) + the framework-agnostic **`./viewport`** store (`MOBILE_MEDIA_QUERY` = `(max-width: 767.98px)`, `isMobileViewport`, `subscribeMobileViewport`) + **`<aha-viewport-switch>`** (`./aha-viewport-switch`) for HTML shape switches (`slot="mobile"` / `slot="desktop"`, `viewport-change` event). (#127)
  - **`<aha-error-page>`** (`./aha-error-page`) — the full-page error: `code` (404 · 403 · 500 · offline · generic) → DS Result with British-English copy and a "Try again" action for retryable codes, `role="alert"`, `error-page-view` telemetry and `action` events; `heading`/`body`/`action-label` take translations. (#127)
- **`<aha-input>` forwards its `aria-describedby` to the inner field** (as element references, re-resolved on focus), so a DS input can actually be described by an `<aha-field-error>` — an id reference cannot cross the shadow root on its own. (#127)
- **Shared-components pattern + anti-slop surface.** `guidelines/shared-components.json` is the registry (need → DS primitive → contract kept), and `anti-slop/criteria.json` gains `surfaces.shared-components` (C1–C4, seeded from the aha-design v1.80.0 judge), so the anti-slop feeds now carry this loop. The ux-writing pattern's `error-page` dependency is now available. (#127)

## 0.63.0 — 2026-09-28
### Added
- **Seven more anti-slop surfaces in the DS-owned store: `paywall`, `status-badges`, `settings`, `feedback`, `overlays`, `canvas` and `audience`.** Each was seeded from its aha-design judge (plugin v1.80.0) with `sync-skills.mjs import` — 85 binary criteria in all — so `anti-slop.md` / `anti-slop.agent.json` now carry sixteen surfaces and every guideline is wired (the "Not yet wired" list is gone). Feedback C4 now points at the DS `<aha-alert>` contract instead of the plugin's `references/alert.md`. (#123)
- **Each new surface declares its live DS `targets`.** The six pattern surfaces target their `guidelines/<name>.json` plus the contracts or tokens their criteria judge (e.g. `feedback` → toast, alert, CSAT; `overlays` → modal, drawer, popover); `paywall`, which has no guideline, targets `contracts/paywall.json`. Each wired pattern page, `.md` and `.agent.json` now links back to its anti-slop judge. (#123)
### Changed
- **The anti-slop gate also checks** that criterion ids are unique within a surface, a target is listed once, and a seeded surface records its own `seededFrom` + judge `skillRef`. Build-assertion refs (`SETTINGS-01`, `§2`, …) now warn once per guideline rather than once per rule. (#123)
### Fixed
- **`sync-skills.mjs import` seeds cleaner criterion text.** It reads only the paragraph under each criterion header (following a lead-in that ends in ":"), and cuts long text at a word boundary with "…" rather than mid-word. `ux-writing` C4 loses the stray example text an earlier import had cut mid-word. (#123)

## 0.62.0 — 2026-09-28
### Added
- **`DataTable` — a real, importable data-grid component (`@ahaslides-product/design/aha-data-table`).** Until now the DS shipped only `tableTheme`, so every app rebuilt the DataTable itself. `createDataTable({ React, antd })` binds the shared component to your own React + antd (zero runtime deps, works from a bundler or a CDN page) and brings the whole DS V3 table: white header that stays white when sorted, dividers only, radius 8, 16px cells, gray-30 hover, single-arrow sort (↓ → ↑ → none), checklist and min/max filter popovers with Reset / Apply, drag reorder (Alt+←/→ from the keyboard), right-click freeze (one column, pinned left), column resize, rows-per-page and an Edit columns checklist — icons from the DS library by name. Also exports `dataTableTheme` (the Vue path until the Vue twin lands) and `dataTableLabels` (i18n). New **Data table** docs page under Components · Data Display, linked from Table's *When to use*. `table-theme` and the Table page are unchanged. (#126)
### Fixed
- Composite doc pages' install block now shows the named imports (`import { … } from …`) instead of claiming the module registers a custom element. (#126)

## 0.61.1 — 2026-09-28
### Added
- **The package now ships the agent rules: `guidelines/`, `anti-slop/criteria.json` and `tokens.canonical.json`.** They were missing from `files`, so an agent that only installed `@ahaslides-product/design` never received the surface guidelines or the anti-slop judge criteria and could reach them only through the docs-site feeds. All three are now in the tarball and exported as `./guidelines/*`, `./anti-slop/criteria.json` and `./tokens.canonical.json` (import with `with { type: 'json' }`). (#120)

## 0.61.0 — 2026-09-28
### Added
- **Docs site: one global search in the header, on every page.** Searches the whole design system — components and patterns (by name, element tag, props and variant options), every icon, every `--aha-*` token (with its value and a colour swatch), guidelines, landing blocks, Audience Library sections, agent feeds and every docs section heading. Results are grouped by type and deep-link to the page or heading; icons open the gallery pre-filtered (`icons/index.html?q=…`), with a "See all N icons" row past the first 8. `/` or Ctrl/⌘ K focuses it; arrow keys + Enter to open, Esc to close (ARIA combobox + listbox). Collapses to an icon button that opens a full-width panel below 768px. The index (`search-index.json`) is crawled from the built site at generate time and loads on first open — no backend, no new dependency. (#125)
### Changed
- **Docs header reflows instead of widening the page:** the area tabs scroll horizontally when space runs out, the "React · Vue · Lit" label hides below 1280px, and the wordmark hides below 768px. Docs `h2`/`h3` headings now carry stable `id`s so any section can be linked to. (#125)

## 0.60.0 — 2026-09-28
### Added
- **Seven more anti-slop surfaces in the DS-owned store: `antd`, `component-standard`, `icons`, `typography`, `table`, `shared-components` and `background`.** Each was seeded from its aha-design judge (plugin v1.80.0) with `sync-skills.mjs import`, then reviewed so every binary criterion judges against the DS's **live** contracts and tokens instead of the plugin's frozen `contract.json` / `typography.json` snapshots. Where the live DS overrules the old snapshot, the criterion follows the DS — e.g. typography is Plus Jakarta Sans at weights 400/600 only, with no Inter label set. `anti-slop.md` / `anti-slop.agent.json` now carry all nine surfaces. (#121)
- **Surfaces declare `targets` — the live DS sources they are judged against.** Each target names a contract, `tokens.canonical.json`, the icon registry or a guideline, and the feeds publish it as its fetchable URL (`<slug>.agent.json`, `design.md`, `icons.agent.json`, …), so a consumer's judge never reads a stale copy. (#121)
- **`guidelines/background.json` — the Background pattern.** White by default; the sanctioned non-white exceptions (feedback tint, app-shell layout grey, interactive state fill, explicitly requested colour), each bound to an `--aha-bg-*` token; no gradients except the AI affordance's border; token-only colours. (#121)
### Changed
- **The anti-slop consistency gate covers the new surfaces.** A wired surface now needs a guideline **or** live targets; every target must be an existing DS source; no criterion may cite a frozen plugin snapshot; and judge ids may use the judge's own letter (typography's `J1..J7`). `seededFrom` provenance moved from the store root to each seeded surface, since surfaces are now seeded from different plugin versions. (#121)

## 0.59.7 — 2026-09-28
### Changed
- **Composite components no longer have a separate "Theme (shared)" code tab — the theme is wired inside the React and Vue code you copy.** Each snippet imports the real `<slug>Theme` from `@ahaslides-product/design/<slug>-theme` and passes it to `ConfigProvider` / `a-config-provider`, so one paste gives the themed component. The Table React/Vue snippets drop the fictional `@aha/ui-react` / `@aha/ui-vue` `DataTable` for the real antd v6 / ant-design-vue v4 `Table` + `tableTheme`, and `standards` now rejects those placeholder packages. (#124)

## 0.59.6 — 2026-09-28
### Changed
- **Table moves back to Components (Data Display).** It is a themed antd primitive, not an AhaSlides composition, so it no longer sits under Patterns · Data; the empty Data pattern group is gone and the contract's `group` is now `Data Display`. No component behaviour or API change. (#122)

## 0.59.5 — 2026-09-22
### Changed
- **Audience Library: the one-page nav is now the shared antd `Anchor` "On this page" component — the same one the Settings hub uses.** The audience gallery carried two hand-rolled navs (the shell left-sidebar of in-page `#` links **and** a header pill `chipnav`); both are replaced by the sticky antd `Anchor` island (via `noSidebar`), so every single-scroll DS area navigates through one component instead of a per-area re-implementation. Extracted the Settings hub's inline Anchor into shared `hubAnchor*` helpers (aside markup + React island + layout CSS) and pointed both pages at them. (#119)
### Fixed
- **The one-page `Anchor` actually mounts now — an esm.sh dep break had it silently falling back everywhere, including the live Settings page.** `esm.sh/antd@6` resolved its transitive `@ant-design/fast-color` as a separate module whose current build fails to export `FastColor`, which threw at eval time so the `Anchor` never hydrated and both hubs showed only the plain no-JS fallback. Switched the import to `?bundle-deps` (inlines the transitive deps); verified the real antd `Anchor` mounts and scroll-tracks on both pages. Also narrowed the group-header CSS to only true parent links (`:has(.ant-anchor-link)`), so a flat leaf list (Audience) renders as normal-case nav items rather than uppercased headers, and Settings' top-level overview links stop being uppercased. (#119)

## 0.59.4 — 2026-09-22
### Fixed
- **Audience Library: every demo glyph is a DS `<aha-icon>`, no more emoji or Unicode stand-ins.** The audience gallery mocks faked their iconography with raw characters and emoji — the InputNumber/DraggableOptions steppers were 9px `▲`/`▼` triangles (indistinguishable from a native `<input type=number>` spinner, the very thing the component says it replaces), the Select caret a `▾`, the drag grip `⋮⋮`, the AnswerOption verdicts `✓`/`✕`, and ImageUploader/SubmitButton/WaitingForHost/SubmittedCard used 🖼️/📷/🔒/⏳/✅. Each is now the design-system glyph called by name (`system-caret-up/down`, `system-drag`, `system-check`, `system-x`, `system-image-square`, `system-upload-simple`, `system-lock`, `system-hourglass-high`, `system-check-circle`) — the same `never-inline-an-SVG` rule the icon gallery enforces. The page now loads the shared `icons/registry.js` + `icons/aha-icon.js` runtime (PJAX-safe); verified all 54 icons render real SVGs (zero unknown-icon fallbacks) on both light and dark decks. AudienceIdentityStrip keeps its 🦊 — that glyph is the participant's real `audienceEmoji` avatar data, not chrome. (#118)

## 0.59.3 — 2026-09-22
### Fixed
- **The product face (Plus Jakarta Sans) now actually loads on the docs site.** The shell `@font-face` referenced `<base>fonts/PlusJakartaSans-{Regular,SemiBold}.woff2`, but those files were never added to the repo or copied into `dist/`, so every page 404'd the woff2 and silently fell back to `-apple-system` — including the shadow-DOM component previews, which is where it read as "wrong font". The two self-hosted weights (400/600) are now committed under `fonts/` and copied into `dist/fonts/` by the build (and shipped in the npm package), so `<base>fonts/…woff2` resolves and the whole site — previews included — renders in Plus Jakarta Sans. Verified the woff2 loads (200, `document.fonts` status `loaded`) and the previews compute the brand face. (#117)

## 0.59.2 — 2026-09-22
### Fixed
- **Settings page: every control shows its live preview again.** When the settings surface was consolidated onto one page, only `<aha-settings-list>` kept a live demo — the other 16 controls (setting group/row, sub-setting group, option row, question list, number-with-unit, image dropzone, card select, section header, mode field, counted input/textarea, add-item button, image-action button, info box, numbered item) were reduced to text-only blocks, so their previews disappeared from `settings/index.html`. Every control now renders its full inline treatment — live example + playground + framework code + API — identical to its per-component detail page, so an agent reading only the one page sees every component rendered. Each preview loads the real shipped `../lib/aha-*.js` element (module dedup keeps the shared imports single); verified all 17 previews upgrade non-blank in a headless render. (#116)
- **Settings page: the "On this page" nav reflects the whole page IA, not just the components.** The in-page antd `Anchor` (and its no-JS fallback) listed only the settings components, so the page-level sections above them were unreachable and the nav didn't mirror the page. The overview sections — *Choose the surface*, *Rules*, *Composed of* — now render inside the content column (so the sticky nav sits beside the whole page) and lead the Anchor as top-level items, followed by the *Composition* and *Controls* component groups. The nav is now a faithful top-to-bottom map of the page. (#116)

## 0.59.1 — 2026-09-22
### Fixed
- **Settings page: one nav, not two.** Dropped the shell left sidebar on `settings/index.html` — it duplicated the in-page "On this page" antd `Anchor` (same Composition/Controls items) and didn't match the reference IA. The Anchor is now the single navigation; the content reclaims the full width. (#115)

## 0.59.0 — 2026-09-22
### Added
- **Audience Library is now its own top-level area, on one scroll page.** A new **Audience Library** nav tab (alongside Landing) whose page — `audience/index.html` — is the audience component gallery, rendered inside the DS shell so it wears the standard top-nav + a scoped left sidebar (one anchor per component). Every component card shows its purpose, a USE WHEN / NOT FOR callout, side-by-side light/dark deck demos, and the DS collapsible HTML/React/Vue code panels. All colours/sizes/radii are DS `--aha-*` tokens; the reference UI is the marketplace audience-lab. Generated from `audience/library.json` (+ scoped `audience/audience.css`); absent-safe (no data file → no tab). Honest imports: audience components are marketplace Vue components at `@/iframe/audience`, not DS web components — no fabricated DS entries. (#114)

## 0.58.0 — 2026-09-21
### Changed
- **Settings is now genuinely one page under one URL — component nav is an in-page antd `Anchor`.** On `settings/index.html` every settings component is inline, grouped Composition then Controls exactly as the reference IA, and switching between them is an in-page scroll — it no longer loads another page or changes the URL. The per-section "full page →" away-links are gone, and the Settings sidebar now points at in-page anchors (`#ctrl-<slug>`) instead of per-component URLs. In-page navigation is built with the real Ant Design v6 `Anchor`, mounted as a small CDN-React island over the shared token theme (the DS composite pattern, as with Table), which tracks scroll and smooth-scrolls within the page; a no-JS/CDN-down fallback keeps the same in-page anchor list working. The underlying per-component contracts/pages are untouched — "one page" means the Settings page never routes away, not that any component was removed. (#113)

## 0.57.0 — 2026-09-21
### Added
- **Settings is now its own area, on one self-contained page.** A new top-level **Settings** nav area (alongside Components/Patterns) whose landing page — `settings/index.html` — gathers the entire settings surface INLINE on a single page: the composition pattern (surface choice, the full rule text, composed-of), the schema-driven `<aha-settings-list>` component with a live example, framework code and full API, and every settings control's summary, spec and API. Point an agent or a repo at that one URL and it has everything without following a link. Generated from `guidelines/settings.json` + the settings contracts (no hand-authored duplication). The settings controls move out of the Patterns group into this Settings area. (#111)

## 0.56.0 — 2026-09-18
### Added
- **Content max-width token.** The design system now defines a default max-width for centred app content: **`--aha-content-max-width: 1440px`** (source `tokens.layout.contentMaxWidth`). Cap the page/screen container to it and centre with auto side margins — `max-width: var(--aha-content-max-width); margin-inline: auto` — instead of hardcoding a content width. Surfaced on the Sizing foundations page and the `design.md` feed. (#108)
## 0.55.2 — 2026-09-18
### Changed
- **Gate hardening — three checks distilled from a settings-alignment retro.** (1) `standards.mjs` now fails a version that is **behind the latest release tag** — the "branched off a stale base" trap that let a PR cut ~18 versions behind master reuse an already-published version and would have reverted merged work. (2) `qa.mjs` conformance now compares colours **normalised to a canonical rgba tuple**, so `color-mix()` (which Chrome serialises as `color(srgb …)`) matches an `rgba()`/hex `expect` — removing a brittle string-compare that passed the local static gate but red-failed only in CI. (3) `qa.mjs` gains an **`expectMax`** upper-bound operator, and `option-row` now asserts a single-line row stays **≤56px** — the render-height guard that would have caught the OptionRow "2-lines-tall" regression the border-only conformance missed. (#107)

## 0.55.1 — 2026-09-18
### Fixed
- **OptionRow / CountedTextarea — single-line answer rows no longer render two lines tall.** The borderless counted `<textarea>` (the OptionRow answer field) auto-sized every row to ~82px: the native `<textarea>` defaults to `rows="2"`, so measuring `scrollHeight` at `height:auto` reported two lines even for one word, and the reserved 22px counter gutter compounded it. The textarea now carries `rows="1"` so auto-grow measures from a single line, and in the compact borderless (OptionRow) context the focus-only counter overlays the corner instead of reserving the full 22px gutter — a single-line answer row is now ~44px. Standalone CountedTextarea (descriptions, minRows 2) is unchanged. (#105)

## 0.55.0 — 2026-09-18
### Changed
- **Icon-name validation now gates every path an icon reaches the runtime — and reaches consumer CI.** Broken icon names kept shipping because the gate only checked `<aha-icon name="…">` tags: a name fed as DATA (a Menu row `{"icon":"system-chart-bar"}`, a playground option, a preview) was never validated. `standards.mjs` now also validates every `"icon":"…"` reference (in a component's source, snippets, preview and contract JSON), and `screen-lint.mjs` — the checker consumers run in their OWN CI — now hard-fails an unknown `<aha-icon name>` or menu `icon` on a consumer screen, so a bad name is caught at the consumer, not just inside the DS. (#106)
- **Icon names are enforced kebab-case at the source.** `build-icons.mjs` fails the build on any non-kebab SVG filename, so a future Figma import can't reintroduce an un-guessable name (a consumer types the kebab form, misses, ships a broken icon). Renamed `system-Medal` → `system-medal`, `system-PaperPlaneTilt` → `system-paper-plane-tilt`, `system-arrowCircleUp` → `system-arrow-circle-up`, `system-q&a` → `system-qa`. **Back-compat:** each old spelling still resolves as a deprecated alias, so a consumer that referenced the old name does not break — migrate to the kebab name. (#106)
- **The Menu showcase now replicates the real AhaSlides main navigation.** The headline Menu example is the actual app left-nav — Home · My Presentations · Template Library · Shared Presentations · My Plan · Integration Center · Team Management — each with a real DS glyph, so it is a faithful reference for implementers. The group/submenu/divider/danger/disabled feature demo is kept as a second example. No change to the `<aha-menu>` primitive. (#106)
### Fixed
- **`aha-menu` doc example referenced a non-existent icon** (`system-bar-chart` → `system-chart-bar`) — the DS was teaching a broken name; now gated so it can't recur. (#106)

## 0.54.0 — 2026-09-18
### Changed
- **Settings controls aligned to the settings-lab reference (the whole set).** Reconciled the settings component family against the product's canonical settings surface — the DS keeps its architecture (Shadow-DOM custom elements, `--aha-*` tokens, gates) and adopts settings-lab's function/visual, verified control-by-control with the settings Agent Fleet against the real rendered elements. **Input family** (`aha-counted-input`/`aha-counted-textarea`/`aha-select`/`aha-number-with-unit`): rest border `--aha-border-input` #D3D7E1, placeholder `--aha-text-placeholder` #999999, h40 (small 32 / large 48), single-line hover → full-primary #6A1EBB, solid 2px #D3B4FF focus ring; textarea keeps the lighter #D3B4FF hover at radius 6 / maxRows 5. `aha-number-with-unit`: the ▲/▼ stepper now sits **left of the unit** (a child-order render-gate assertion guards it), compact 4ch chip, unit stays the short `sec`. `aha-option-row`: success-green correct-answer row state (`--aha-border-success` + an 8% teal tint). `aha-checkbox` 16×16 / `--aha-border` #E3E3E3. `aha-segmented` label weight 400 / thumb radius 4 (the thumb no longer animates a layout property). `aha-card-select` card tokens + a `color-mix` selected fill (keeps the DS roving-arrow a11y). `aha-mode-field` outline-only active + hidden-mode controls disabled while hidden (a hidden mode can't leak into saved config). `aha-image-dropzone` 2px-dashed / 135px filled frame, `aha-image-action-button` thumbnail radius 4. `aha-dropdown` 40px items / neutral-grey hover. `aha-tooltip` `help` defaults to `bottom-start` + no arrow. `aha-info-box` success border → teal-50, warmer `--aha-bg-warning-subtle` warning fill, padding 12/16. New tokens: `--aha-border-input`, `--aha-text-placeholder`, `--aha-bg-warning-subtle` (in the token layer + JS export + CSS vars). (#104)

## 0.53.2 — 2026-09-17
### Fixed
- **Releases now publish automatically on merge — the registry can't drift behind master again.** `publish.yml` previously fired only on a hand-pushed `v*` tag, which nobody did, so GitHub Packages stalled at `v0.41.0` while `master` climbed to `0.53.x` (12 unpublished minor versions; `npm i` resolved a months-old build). It now runs on every push to `master`: it builds + runs the standards gate, and if `package.json` → `version` has no matching tag yet, publishes it, creates the `v<version>` tag, and verifies the version resolves in the registry (a silent publish failure turns the run red). Idempotent — a merge that didn't bump the version is a no-op; manual re-publish/backfill via `workflow_dispatch`. No more manual `git tag`; a correct version bump (already gated per PR) is the whole release. (#101)

## 0.53.1 — 2026-09-17
### Fixed
- **Agent onboarding docs** — `AGENTS.md` and `README.md` now name the correct host for each surface: docs + feeds are read from **GitHub Pages** at the site root (`https://ahaslides-product.github.io/ahaslides-design/llms.txt` is the single entry point — no `dist/` prefix), while jsDelivr `/gh/@master/lib/*.js` serves only the element source imported at runtime. Removes the misleading `dist/…`-path and "feeds on jsDelivr" wording that led agents to fetch 404 URLs. Adds a `lib/README.md` pointer so a wrong guess at that path redirects to the index. (#100)

## 0.53.0 — 2026-09-16
### Changed
- **Leaf components now inherit the host app's typography (library-wide).** A leaf that pinned the product font on its shadow content (`font-family:var(--aha-font-product,…)` on a `.class`) couldn't be re-themed — its text drifted off a host app's own font even when both used Plus Jakarta Sans (the `aha-alert`-in-AntD case, first fixed in #98). The product font is now set **once on `:host`** and every text-bearing content element uses `font-family:inherit`, so a themed host that sets `--aha-font-product` (or inherits a font into the element) gets matching text with **zero per-component config**. Standalone usage is unchanged — `:host` still supplies Plus Jakarta Sans. Normalized across 23 more leaves: `aha-add-item-button`, `aha-avatar`, `aha-badge`, `aha-button`, `aha-card`, `aha-card-select`, `aha-checkbox`, `aha-counted-input`, `aha-counted-textarea`, `aha-image`, `aha-image-action-button`, `aha-input`, `aha-number-with-unit`, `aha-progress`, `aha-radio`, `aha-rate`, `aha-segmented`, `aha-select`, `aha-status-badge`, `aha-switch`, `aha-tag`, `aha-tooltip`, `aha-user-info`. Font size/weight/line-height are unchanged. (#99)
### Added
- **Font-inheritance gate in `standards.mjs`.** The per-leaf source scan now hard-fails a `font-family` that pins `--aha-font-product` (or a bare literal font stack) on any selector other than `:host`, so the anti-pattern (the one #98 fixed) can't regress anywhere in the library. Allowed: `font-family:inherit` on content, the font on `:host`, and the mono/display/secondary tokens; a justified deviation carries a per-line `ds-lint-allow: font (why)`. Ships hard-fail with an empty `FONT_DEBT` grandfather map (same idiom as the motion/a11y/responsive gates). Plan: `plans/font-inheritance-normalization.md`. (#99)

## 0.52.1 — 2026-09-16
### Changed
- **Alert — inherit the host app's font instead of pinning it on the content.** `aha-alert`
  was the only leaf that set `font-family:var(--aha-font-product,…)` directly on `.alert`, so it
  could not pick up a consuming app's typography and its text drifted from the surrounding UI
  (different fallback chain / spacing) inside themed apps. Moved the branded default to `:host`
  and set the content to `font-family:inherit`, matching the `tabs`/`collapse`/`segmented` idiom —
  standalone alerts still get the DS product font, and host apps can now theme it via
  `--aha-font-product` (or plain inheritance). (#98)

## 0.52.0 — 2026-09-15
### Changed
- **Landing Button — tertiary is now the DS ghost button, and the page is restructured.** The
  Landing → Button page follows the requested structure: a short intro, then a Primary, Secondary
  and Tertiary section, each showing all three control sizes (sm 28px / md 36px / lg 40px) with its
  own paste-and-run snippet. The tertiary variant (`aha-btn--tertiary`) replaces the 0.51
  `aha-btn--text-link`: it now follows the product Button's `variant=tertiary` (a ghost — transparent,
  purple label, soft purple hover fill `#F9F5FF` / active `#F0E4FF`, per-tone soft focus ring), the
  shape the requester accepted, rather than the live Text link's colour-only hover. `landing/SCAN.md`'s
  Text link section is re-reconciled against the ghost tertiary — hover fill, active fill, focus style
  and focus radius are the Webflow-to-update deltas; label weight and hover colour are now matches. (#96)
### Added
- **Landing blocks — per-variant / per-size sections.** A landing block may declare a `variants`
  array (each with `sizes`) in `landing/<slug>.json`; `renderLandingBlock` renders one section per
  variant, each previewing every size with its own copy-paste snippet. Blocks without `variants`
  render exactly as before. (#96)

## 0.51.0 — 2026-09-15
### Added
- **Landing Button — fourth `text-link` variant.** Webflow's "Text link" component (the live
  site's tertiary CTA, `.text-link-wrapper`) is now reflected in `landing/button.json` as
  `aha-btn--text-link`: transparent, borderless, brand-purple label, bound to the product
  text-link colour tokens (`--aha-color-primary` / `--aha-text-link-hover`) and the shared
  `--aha-button-focus-ring`, at the landing button family's semibold weight. `landing/SCAN.md`
  gets a new Text link subsection (round 4) logging three Webflow-to-update deltas: the live
  label weight (`600` vs the DS text-link contract's `400`), the hover colour (one shade too
  dark), and the hard-border focus style (vs the DS soft ring). (#96)

## 0.50.1 — 2026-09-15
### Fixed
- **Landing Section container — definition pass against the live homepage.** Re-scanned the live
  marketing site's `--_spacing---section-p-*` custom properties: max-width and the padding-x cap
  already matched the DS tokens exactly, so fixed a one-token-off mobile padding-x floor
  (`--aha-space-20` &rarr; `--aha-space-16`, matching the live `1rem` mobile value) and a stale
  title font-family/line-height pair left over from before the round-3 Fonts decision (the title
  was forcing the H1/Display treatment onto what is an H2; now inherits the body face and
  `--aha-line-height-heading` like `landing/fonts.json`'s own H2). No Webflow-to-update items —
  the live geometry already agreed with the DS tokens everywhere a live counterpart exists.
  `landing/SCAN.md`'s Section container entry expanded to a full deep-pass table. (#97)
## 0.50.0 — 2026-09-15
### Changed
- **Landing Button preview — annotated items, no container box.** The Preview drops the bordered
  `landing-stage` container, and each variant now carries a caption annotation naming its class and
  role (`aha-btn--primary` — one main call-to-action per section, etc.). Annotations render in the
  Preview only via a new optional `previewHtml` field on landing blocks; the paste-and-run snippet
  stays the clean block. The annotated items stack vertically, one per row. Landing **Fonts** gets a
  `previewHtml` too — a Role/Size type-scale specimen table (each role rendered at its `--aha-size-*`
  token, with a size pill), mirroring the Foundations typography table. (#94)

## 0.49.0 — 2026-09-15
### Changed
- **CSAT — borderless single row only, with a thumbs-down feedback popover** (**breaking**, pre-1.0). `<aha-csat>` now renders one layout: the canonical borderless surface — prompt + two 16px thumb icons on one line, no chrome, a 400-weight prompt. The old boxed form is gone (the `card` attribute is removed), and the legacy `inline` attribute stays a no-op (a stray `<aha-csat inline>` renders the same row). **Thumbs-up** rates instantly (emits `rate`); **thumbs-down** registers the down rating (emits `rate`) *and* opens a feedback popover anchored to the down thumb — a short prompt, a free-text field and a primary Send button — reusing the shared `<aha-popover>` + `<aha-counted-textarea>` + `<aha-button>`; dismissing it (Esc / outside-click) keeps the down rating. New optional `feedback-prompt` / `feedback-placeholder` attributes theme the popover copy. Submitting emits a dedicated composed **`feedback`** event `{ rating: 'down', source, feedback }` (mapping to the pattern's distinct `CSAT_FEEDBACK_SUBMITTED`), then the opt-in `thanks` line cross-fades in over the same cell — replacing the prompt + thumbs in place rather than sitting beside them — shown instantly on an up rating, after submit on a down rating. (#90)
### Fixed
- **Popover — clicking inside the panel no longer closes it when the popover is nested in another element's shadow root.** The outside-click guard used `contains(event.target)`, but a document-level click is retargeted to the shadow host, so any click read as "outside" — closing the popover before an interactive control inside it (e.g. the CSAT feedback field) could be used. It now tests the composed event path. (#90)

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

