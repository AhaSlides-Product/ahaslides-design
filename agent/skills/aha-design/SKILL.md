---
name: aha-design
description: "Build or review AhaSlides product UI against the AhaSlides design system (@ahaslides-product/design) — the one source of truth for components, tokens, composition guidelines and the binary anti-slop judge criteria. Reads the DS from the installed npm package when the repo has it, else from its hosted feeds (llms.txt, anti-slop.agent.json, guidelines, per-component agent.json), then runs the build -> judge -> fix loop: pick the DS surface(s), read their rules and criteria, build with DS components and tokens, run the DS mechanical gate, judge every criterion PASS/FAIL, fix every FAIL, re-judge. Use whenever an agent designs, plans, builds, edits or reviews an AhaSlides functional / application surface — the product apps (presenter, editor, dashboard, settings, audience, slide-type canvas), docs / help-centre UI, internal tools, admin / back-office, ops consoles: a screen, page, component, form, table / data grid, chart / graph / data-viz / results visualisation (bar, column, donut, radar, word cloud, treemap), modal / drawer / popover, toast / alert, status badge, icon, paywall / upsell, settings modal / drawer / panel / page (course, presentation or account settings, preferences, options dialog), empty / error state, typography, colour or background, or in-app UI copy and casing. Also for 'review / judge / audit this UI', 'does this follow our design system', 'is this table / modal correct', or a self-check after building. Do NOT trigger for marketing / brand surfaces (landing pages, public pricing page, blog, email, social, ads, key art, brand voice) — that is aha-marketing-skills; for UI/UX design user research lookups (what users have said about a feature) — that is aha-uiux-user-research; or for backend, data, CLI or analytics work with no UI. In a legacy Vue 2 project (the nearest package.json declares vue 2.x, e.g. the presenter and audience apps) it applies to NEW screens, components and features only, built with the DS web components and never the old storybook kit; existing screens are left untouched unless the task asks to change them."
---

# Building and judging AhaSlides UI with the design system

This skill ships inside the AhaSlides design system itself (`@ahaslides-product/design`, repo
`ahaslides-design`, plugin `ahaslides-design`), released with the same version as the rules it
points at. The DS owns every rule: which components exist, the tokens, the composition guidelines per surface, and the
**anti-slop criteria** — binary PASS/FAIL judge checks, one set per surface, each measured by
the DS's own eval sets. This skill does not restate any of it. It tells you where to read it and
how to run the loop. **Never judge from memory** — if you cannot read the DS, say so and stop.

## 0. Does this apply?

In a **legacy Vue 2 project** (the nearest `package.json` to the files you are touching declares
`vue` at major 2: `^2.6.10`, `~2.7`, …) the design system applies to **new work only**:

- **New screens, components and features** are built with the design system's real components:
  the framework-free web components (`<aha-*>`) from the DS `lib/all.js`. Never import a component
  from the old `@ahaslides-product/stpancras-storybook-app` kit for new design, and never
  hand-roll a look-alike. The DS has no Vue 2 wrapper package; the web components are the way in.
- **Existing screens and components stay untouched.** Do not migrate or restyle them, and do not
  swap their kit components, unless the task explicitly asks you to change them. When it does, the
  person directing the work (dev lead or workspace owner) decides the scope: take a clear request
  at face value, do not ask for proof, and touch only what they named.
- **One-time setup per app** (skip if the app already has it):
  1. Load `lib/all.js` and `lib/tokens.css` once, pinned to a tag: from jsDelivr's GitHub path
     (`https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@<tag>/lib/all.js`, never
     `@master`; the package is not on npm) or from the installed `@ahaslides-product/design`.
  2. Tell Vue 2 the tags are custom elements, before the root instance is created:
     `Vue.config.ignoredElements = [/^aha-/]`.
  3. Bind props as attributes (`:value="x"`) or DOM props (`:prop.prop="x"`) and listen to the
     components' custom events (`@change`, `@aha-…`) as the component's `<slug>.agent.json` names
     them; `v-model` does not work on custom elements.
- The DS carries its own Vue 2 how-to page; find it through `llms.txt` (§1) and follow it rather
  than this summary. Everything else (surfaces, criteria, build, judge, fix) in §2 to §5 applies to
  the new files as normal.

This plugin's hooks follow the same split: in Vue 2 they run on new files (untracked or added in the
working diff) and stay silent on edits to existing files. If you are asked to change an existing
Vue 2 file to the DS, run the loop below by hand for it.

Vue 3 and other projects are covered as normal.

## 1. Find the DS

Prefer the installed package — it is the exact version the repo builds against. Without it, use
the hosted feeds. The plugin also carries `anti-slop/criteria.json` from its own release (the
hooks fall back to it); it is the same file as the package's, so read it when the network is out.

| What | Installed package (`node_modules/@ahaslides-product/design/…`) | Hosted feed (public, no auth) |
|---|---|---|
| Index of every component | `package.json` exports + `lib/` | `https://design.ahaslides.io/llms.txt` |
| Anti-slop criteria, per surface | `anti-slop/criteria.json` | `…/anti-slop.agent.json` (criteria + rules + live targets) · `…/anti-slop.md` |
| Composition guideline, per surface | `guidelines/<surface>.json` | `…/guidelines.llms.txt` → `…/guidelines/<surface>/<surface>.agent.json` |
| One component's contract | — | `…/<slug>.agent.json` |
| Tokens | `tokens.canonical.json`, `lib/tokens.css` | `…/design.md`, `…/variables.css` |
| Mechanical gate | `screen-lint.mjs` (export `./screen-lint`) | — |

Find the package with `ls node_modules/@ahaslides-product/design/anti-slop/criteria.json` (walk
up to the workspace root in a monorepo). Without it, fetch the feeds. The feed's
`surfaces.<key>.targets[].url` are the live DS pages each surface is judged against — read them,
never a frozen snapshot.

## 2. Pick the surface(s)

The surface keys are the keys of `surfaces` in `criteria.json` (e.g. `table`, `overlays`,
`feedback`, `settings`, `icons`, `typography`, `ux-writing`, `canvas`, `audience`, `app-shell`).
Read the list from the DS each time — surfaces get added.

- Pick by what the UI **contains**, not its container. A modal, drawer, page or editor panel that
  holds settings, options or preferences is the `settings` surface (plus `overlays` for the
  modal / drawer shell). For `settings`, read the hub page
  `https://design.ahaslides.io/settings/index.html` first — its control
  table (`#ctrl-<slug>`) decides which DS control each setting type uses (e.g. an image setting →
  image action button / dropzone), so do not reach for a generic component.
- A product-app screen (React / AntD, or the DS web components) is always judged on
  `background` and `component-standard`, plus every surface it touches.
- UI copy or labels changed → add `ux-writing`.
- A slide-type iframe is `canvas` (presenter stage) or `audience` (participant phone) — a
  separate runtime; the product-app baseline does not apply.

## 3. Build

1. For a from-scratch build or redesign, **brainstorm first**: clarify scope and inspect the
   current UI before writing code.
2. Read each surface's guideline (`rules`, `selfCheck`) and criteria.
3. Build from DS components (`llms.txt` → `<slug>.agent.json` for the API) and bind every
   colour, radius and spacing to DS tokens. If the DS lacks a component you need, say so — do not
   hand-roll a look-alike.
4. Every logo (the AhaSlides logo / The Splash, or a third-party brand such as Google, Zoom or
   Microsoft) comes from the Logo library: `https://design.ahaslides.io/foundations/logo.html`, files at
   `https://design.ahaslides.io/logo/<file>`. Never redraw one, inline a
   hand-made SVG, recolour it, or substitute an icon or letter tile.
5. Any data or result chart (bar, column, stacked, donut / pie, radial, treemap, quadrant, bell,
   radar, word cloud, mind map) is `<aha-chart>` from the DS: read
   `https://design.ahaslides.io/chart.agent.json` first, use
   `palette="brand"` on app screens and `palette="deck"` on the presenting / audience canvas. Never
   a hand-rolled SVG, another chart library or a generic dataviz skill. Only a type `<aha-chart>`
   does not ship falls back to `@ant-design/plots` (the DS charter) — flag it as a gap.
6. Icons come from the registry by name. Draw one only when the library has no suitable icon, and
   then use the paired stroke: 12px 1px, 16px 1.5px, 24px 2px, 32px 2.5px.
7. Settings: 24px between sibling settings, a sub-setting group 16px below its parent and indented
   24px, setting labels regular 400 (primary text; secondary text inside a sub-setting group), and
   no toggle, switch, input, select or button in a group header.

## 4. Judge

1. **Mechanical gate first** (when the package is installed):
   `node node_modules/@ahaslides-product/design/screen-lint.mjs --surface=<product|canvas> <files>`
   — fix every HARD finding before judging.
2. **Binary judge**, per surface: for every criterion, read its `test`, find the evidence in the
   code (`file:line`) and decide **PASS**, **FAIL**, or **N/A** (only when the criterion cannot
   apply to this code). No partial credit. **Burden of proof is on PASS** — a criterion you cannot
   verify from the code is a FAIL, with the reason.
3. Emit exactly this report per surface (the shape the DS eval harness grades):

```
### <surface> — <files>
| # | Criterion | Verdict |
|---|---|---|
| C1 | <title> | PASS / FAIL / N/A — <evidence> |

**Overall: OK TO SHIP** or **Overall: NEEDS FIX**
```

## 5. Fix and re-judge

Fix every FAIL, re-run the mechanical gate and the judge on the changed files, and repeat until
every surface is **OK TO SHIP**. After three rounds with a FAIL left, stop and report the
remaining FAILs and why they resist — do not ship quietly.

**Reviewing someone else's work** (a PR, "is this correct?"): run §4 only and report — do not
edit their code unless asked.

## When the DS and the code disagree

The DS wins. If a DS rule looks wrong for a real case, flag it (the change goes into
`ahaslides-design`: `anti-slop/criteria.json`, `guidelines/`, or the component contract), and
follow the DS until it changes.
