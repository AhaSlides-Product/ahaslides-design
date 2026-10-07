# @ahaslides-product/design

The AhaSlides design system **for agents** — one source of truth, everything else generated.

> **Agents start here →** fetch **`https://ahaslides-product.github.io/ahaslides-design/llms.txt`** (public, no auth). That one URL lists the composition **Patterns** (read the matching one before picking components — a settings UI → Settings) and indexes every component, linking each `<slug>.agent.json`. Two hosts, two jobs: **GitHub Pages** (`ahaslides-product.github.io/ahaslides-design/…`) serves everything you *read* (docs + feeds, at the site root — no `dist/` prefix); **jsDelivr** (`.../gh/ahaslides-product/ahaslides-design@v<version>/lib/<element>.js`, pinned to a release tag) serves only the element source you *import at runtime*. `dist/` is a gitignored local build folder — never a fetch path.

Initiative: PRO38-1. This repo is the permanent home for the design-system-for-agents
(replaces the in-monorepo spike PR #118).

> **Just want the charts?** The `<aha-chart>` library works from a plain HTML page via a public CDN, with no registry access and no build step: see **[docs/chart/README.md](docs/chart/README.md)**, or browse every chart live on the **[Charts tab](https://ahaslides-product.github.io/ahaslides-design/charts/index.html)**.

## The idea

**Never hand-maintain agent-facing docs.** One token source + one contract per component →
a generator emits the human doc page, the `.md` feed, the `llms.txt` entry, `design.md`, and a
machine `agent.json` (with React **and** Vue snippets). Edit a contract or a token and everything
regenerates together, so they cannot drift.

```
tokens.canonical.json  ─┐   R1 — the reconciled token source (skill ↔ DS-export)
contracts/<slug>.json  ─┼─→ generate.mjs ─→ dist/
parts/*  (authored)    ─┘        │
                                 ├─ variables.css          --aha-* token layer (single source)
                                 ├─ design.md              machine-readable visual language
                                 ├─ index.html             browsable component index
                                 ├─ llms.txt / llms-full.txt   agent feeds
                                 └─ <slug>/ index.html · <slug>.md · <slug>.agent.json · <slug>.llms.txt
```

## Architecture — hybrid, by tier

- **Leaf primitives** (button, checkbox, input, tag, badge, switch) → ONE shared **Lit web component**,
  imported unchanged by React and Vue. Same code + shadow-DOM CSS → zero drift, themed only by `--aha-*` tokens.
- **Composites** (table, form, datepicker, select-with-search) → **antd v6** (React) + **ant-design-vue v4** (Vue)
  wrappers, themed by the same tokens; residual drift caught by visual regression.

Token precedence when sources disagree: **measured component-standard > DS export (brand) > aha-design skill (rules)**.
See `TOKENS.canonical.md` for the full reconciliation ledger.

## Consume it (the point — reuse, don't rewrite)

See `PRINCIPLES.md`: every AhaSlides agent reuses components from here instead of rebuilding them.
The DS ships as a **real importable package** (`@ahaslides-product/design`, resolved via `exports`) —
not reference-only snippets. It's published to **GitHub Packages**, so point the
`@ahaslides-product` scope at that registry once (with a GitHub token that has
`read:packages`), then install:

```bash
# .npmrc  (once, per consumer)
@ahaslides-product:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}   # a GitHub token with read:packages
```

```bash
npm i @ahaslides-product/design
```

```js
import '@ahaslides-product/design/tokens.css';           // the --aha-* token layer — once, at the app root
import '@ahaslides-product/design/icons';               // registers <aha-icon> (267 glyphs, call by name)
import { ICON_NAMES } from '@ahaslides-product/design/icons';   // discover valid names
import '@ahaslides-product/design/aha-checkbox';         // registers <aha-checkbox> (zero-dep element)
import { tableTheme } from '@ahaslides-product/design/table-theme';  // the shared Table theme
import { tokens } from '@ahaslides-product/design/tokens';           // canonical design tokens (JS)
import '@ahaslides-product/design/tokens.css';           // the --aha-* token layer (CSS)
```

Agent-facing rules ship in the package too, so an agent that only installs it still gets them:

```js
import criteria from '@ahaslides-product/design/anti-slop/criteria.json' with { type: 'json' };  // anti-slop judge criteria
import settings from '@ahaslides-product/design/guidelines/settings.json' with { type: 'json' };  // any guidelines/*.json
import canonical from '@ahaslides-product/design/tokens.canonical.json' with { type: 'json' };    // raw token source
```

`<aha-icon name="system-bell" size="16" />` — colour follows `currentColor`; never inline an `<svg>`.
`npm run standards` gates every component: it must be complete, declare a real `reuse` entry, import by its package name, and register/export — or the build fails.

### No build step? One tag registers everything

For a CDN / no-build page (a vibe-coded deck, a quick prototype), you don't need npm or a per-element
import — the **all-in-one entry** registers every `<aha-*>` element in a single tag. Save as `.html`,
open in a browser:

```html
<!-- token layer (once) + every element in one tag -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.108.0/lib/tokens.css">
<script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.108.0/lib/all.js"></script>

<aha-button variant="primary">Save changes</aha-button>
<aha-input placeholder="Your name"></aha-input>
<aha-icon name="system-bell" size="16"></aha-icon>
```

Pin the tag (`@v0.108.0` here; take the newest from the [tags page](https://github.com/ahaslides-product/ahaslides-design/tags)),
never `@master`: a pinned page never changes under you. Every doc page's HTML tab is already pinned to
the release that built it.

It's **additive** — bundled apps should keep importing per-element (above) so unused elements
tree-shake out; `all.js` intentionally pulls the whole set.

### Agent feeds — hosted, self-describing

The docs site + every feed are generated together and deployed to GitHub Pages on each merge,
so an agent can read one page and learn exactly how to connect — the feeds themselves are
public (no auth). Installing the package is the one step that needs auth: point the
`@ahaslides-product` scope at GitHub Packages with a `read:packages` token first (the feeds
carry the exact `.npmrc` lines). Absolute URLs:

| Feed | URL |
|------|-----|
| Index (start here) | `https://ahaslides-product.github.io/ahaslides-design/llms.txt` |
| Full docs | `https://ahaslides-product.github.io/ahaslides-design/llms-full.txt` |
| Visual language | `https://ahaslides-product.github.io/ahaslides-design/design.md` |
| Token layer | `https://ahaslides-product.github.io/ahaslides-design/variables.css` |
| Per component | `https://ahaslides-product.github.io/ahaslides-design/<slug>.agent.json` |

Each `agent.json` carries the exact `install` / `import` lines — including the `registry`,
`scope`, and `.npmrc` needed for GitHub Packages — and links to the sibling feeds, so discovery
is fully self-serve. The docs pages also embed the install block and `<link rel="alternate">`
+ `<meta name="aha:*">` discovery tags (`aha:package`, `aha:registry`, `aha:install`) in `<head>`.

### Agent plugin — Claude Code

The DS ships its own Claude Code plugin from `agent/`, released with every version of this repo
(its `version` always equals `package.json`). It carries the `aha-design` skill (build → judge →
fix against the DS) and the hooks that make it fire: a prompt mandate, a write-time design guard
(it also blocks the old storybook kit in new Vue 2 files), an end-of-turn judge trigger and an
anti-slop floor. Hooks read criteria from the installed package, else the plugin's own copy of
`anti-slop/criteria.json` from the same release, so skill, hooks and rules are always one version.

Install once per machine:

```
/plugin marketplace add AhaSlides-Product/ahaslides-design
/plugin install ahaslides-design@ahaslides-design
```

Or commit it to a project's `.claude/settings.json`, so everyone working there gets it:

```json
{
  "extraKnownMarketplaces": {
    "ahaslides-design": {
      "source": { "source": "github", "repo": "AhaSlides-Product/ahaslides-design" }
    }
  },
  "enabledPlugins": {
    "ahaslides-design@ahaslides-design": true
  }
}
```

The skill is then `ahaslides-design:aha-design`. It replaces the `aha-design` plugin in
`aha-claude-plugins`; enable one of the two, not both, or every hook fires twice. Change a rule
in `anti-slop/` or `guidelines/`, never in `agent/` (see `agent/CONTRIBUTING.md`).

### Lint a screen from code — `lintHtml`

`screen-lint.mjs` is also an importable, pure function (no fs, no process, no console), so it runs
in Node and Cloudflare workerd. The icon names it needs are bundled.

```js
import { lintHtml } from '@ahaslides-product/design/screen-lint';

const { findings } = lintHtml(html, { surface: 'product' });   // or 'canvas'
// findings: [{ rule, line, message, severity: 'hard' | 'warn' }]
```

`path` (optional) is echoed back; `iconNames` (optional) overrides the bundled icon list. Any
`hard` finding fails the CLI (`node screen-lint.mjs --surface=… <files>`), which is built on the same function.

**Opt-out** — per line, per rule, with a reason:
`<!-- ds-lint-allow: hex,radius (brand logo, no token) -->`. Only the named rules are silenced on that
line (a rule id such as `raw-hex`, or its short group name such as `hex`). A bare `ds-lint-allow`
suppresses nothing and is reported as a `ds-lint-allow-bare` warning.

## Commands

```bash
npm run generate     # build-icons + contracts + tokens → dist/ and lib/
npm run standards    # THE component gate: every component registers + is genuinely importable
npm run qa           # render + feed assertions on dist/ (headless, hang-proof)
npm run test         # unit tests (screen-lint lintHtml)
npm run check        # generate + standards (gate) + unit tests + qa (render)
```

## Adding a component

Full recipe in `CONTRIBUTING.md`. In short — the gate (`standards.mjs`) will not let it pass unless:

1. `contracts/<slug>.json` — meta, props, spec, opinion, surfaces, snippet + preview refs,
   a `conformance` block, **and a `reuse` block** naming its package entry point:
   `"reuse": { "entry": "./my-thing", "registers": "aha-my-thing" }` (leaf) or
   `"reuse": { "entry": "./my-theme", "exportsNamed": ["myTheme"] }` (composite).
2. `lib/<entry>.js` — the **real importable module**: a leaf registers its custom element; a
   composite exports its shared artifact. Add the subpath to `exports` in `package.json`.
3. `parts/<slug>.*` — snippets that import the real `@ahaslides-product/design/<entry>` (no fakes,
   no non-DS icon sets or component libraries) + the live-preview harness.
4. `npm run check` — runs the standards gate **and** the render gate. Both must be green.

## Status

Proven end-to-end and QA-green: **Icon** (267 glyphs imported from Figma DS V3, call-by-name via
the shared registry + `<aha-icon>`), **Checkbox** (leaf, zero-dep element), and **Table** (composite,
antd wrappers + shared theme) — render-verified (qa.mjs) and gated as reusable (standards.mjs — registers + importable).

**Distribution (D2 — decided):** the package is published to **GitHub Packages**
(`@ahaslides-product/design`); docs/feeds are hosted on **GitHub Pages** (public, no auth).
CI in `.github/workflows/`: `publish.yml` **publishes automatically on every merge to `master`**
whose `version` is new (gated by build + standards, tags the release, verifies it resolved —
using the built-in `GITHUB_TOKEN`, no npm secret; run it via `workflow_dispatch` to re-publish
or backfill), so the registry can never drift behind master. `pages.yml` deploys `dist/` on every
push to `master`. After each real release, its `bump-consumers` job opens or refreshes one
`ds/auto-bump` PR per app listed in `.github/ds-consumers.json` (exact pin + regenerated lockfile,
never auto-merged; needs the `DS_BUMP_TOKEN` secret). Bumping `version` (which the standards gate requires per PR) is therefore all a
merge needs to ship — no manual `git tag`. Maintainer one-time setup: set Pages → Source =
"GitHub Actions". Consumers add a scoped `.npmrc`
(`@ahaslides-product:registry=https://npm.pkg.github.com`) + a `read:packages` GitHub token before `npm i`.

Next: scale contracts, MCP/CLI query layer over the hosted feeds, full visual-regression vs the reference screenshots.
