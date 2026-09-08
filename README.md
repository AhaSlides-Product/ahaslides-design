# @ahaslides/design

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
The DS ships as a **real importable package** (`@ahaslides/design`, resolved via `exports`) —
not reference-only snippets:

```js
import '@ahaslides/design/icons';               // registers <aha-icon> (259 glyphs, call by name)
import { ICON_NAMES } from '@ahaslides/design/icons';   // discover valid names
import '@ahaslides/design/aha-checkbox';         // registers <aha-checkbox> (zero-dep element)
import { tableTheme } from '@ahaslides/design/table-theme';  // the shared DataTable theme
import { tokens } from '@ahaslides/design/tokens';           // canonical design tokens (JS)
import '@ahaslides/design/tokens.css';           // the --aha-* token layer (CSS)
```

`<aha-icon name="system-bell" size="16" />` — colour follows `currentColor`; never inline an `<svg>`.
Agents discover names/APIs from the generated feeds (`dist/icons.agent.json`, `<slug>.agent.json`, `llms.txt`).
`npm run test:import` proves every entry point resolves and works.

## Commands

```bash
npm run generate     # build-icons + contracts + tokens → dist/ and lib/
npm run test:import  # proves @ahaslides/design/* resolves and the elements register/render
npm run qa           # render + feed assertions on dist/ (headless, hang-proof)
npm run check        # generate + test:import + qa
```

## Adding a component

1. Add `contracts/<slug>.json` (meta, props, spec, opinion, surfaces, snippet + preview refs).
2. Add `parts/<slug>.*` — the copyable React/Vue snippets and the live-preview harness
   (leaf = the Lit element + consumers; composite = the antd/ant-design-vue theme + table demo).
3. `npm run check`.

## Status

Proven end-to-end and QA-green: **Icon** (259 glyphs imported from Figma DS V3, call-by-name via
the shared registry + `<aha-icon>`), **Checkbox** (leaf, zero-dep element), and **Table** (composite,
antd wrappers + shared theme) — render-verified, and **importable** (`npm run test:import`, 13 checks).
Next: scale contracts, publish/version the package, MCP/CLI query layer over `dist/`, full
visual-regression vs the reference screenshots.
