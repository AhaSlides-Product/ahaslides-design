# @ahaslides-product/design

The AhaSlides design system **for agents** — one source of truth, everything else generated.

Initiative: PRO38-1. This repo is the permanent home for the design-system-for-agents
(replaces the in-monorepo spike PR #118).

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
import '@ahaslides-product/design/icons';               // registers <aha-icon> (259 glyphs, call by name)
import { ICON_NAMES } from '@ahaslides-product/design/icons';   // discover valid names
import '@ahaslides-product/design/aha-checkbox';         // registers <aha-checkbox> (zero-dep element)
import { tableTheme } from '@ahaslides-product/design/table-theme';  // the shared DataTable theme
import { tokens } from '@ahaslides-product/design/tokens';           // canonical design tokens (JS)
import '@ahaslides-product/design/tokens.css';           // the --aha-* token layer (CSS)
```

`<aha-icon name="system-bell" size="16" />` — colour follows `currentColor`; never inline an `<svg>`.
`npm run standards` gates every component: it must be complete, declare a real `reuse` entry, import by its package name, and register/export — or the build fails.

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

## Commands

```bash
npm run generate     # build-icons + contracts + tokens → dist/ and lib/
npm run standards    # THE component gate: every component registers + is genuinely importable
npm run qa           # render + feed assertions on dist/ (headless, hang-proof)
npm run check        # generate + standards (gate) + qa (render)
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

Proven end-to-end and QA-green: **Icon** (259 glyphs imported from Figma DS V3, call-by-name via
the shared registry + `<aha-icon>`), **Checkbox** (leaf, zero-dep element), and **Table** (composite,
antd wrappers + shared theme) — render-verified (qa.mjs) and gated as reusable (standards.mjs — registers + importable).

**Distribution (D2 — decided):** the package is published to **GitHub Packages**
(`@ahaslides-product/design`); docs/feeds are hosted on **GitHub Pages** (public, no auth).
CI in `.github/workflows/`: `publish.yml` publishes on a `v*` tag (gated by build + standards,
using the built-in `GITHUB_TOKEN` — no npm secret needed); `pages.yml` deploys `dist/` on every
push to `master`. Maintainer one-time setup: set Pages → Source = "GitHub Actions". Consumers
add a scoped `.npmrc` (`@ahaslides-product:registry=https://npm.pkg.github.com`) + a
`read:packages` GitHub token before `npm i`.

Next: scale contracts, MCP/CLI query layer over the hosted feeds, full visual-regression vs the reference screenshots.
