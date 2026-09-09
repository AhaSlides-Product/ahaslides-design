# Contributing a component

Read `PRINCIPLES.md` first. The rule that governs this repo: **components here must be reusable — real, importable code, not reference snippets.** Two gates enforce it, and `npm run check` runs both:

- **`standards.mjs`** — *the reusability gate.* For every contract it proves the component is complete, declares a real package entry point, imports by its published name, registers/exports, and **ships a paste-and-run HTML snippet — every component, no exception** (a leaf uses its custom element; a composite ships a CDN-React runnable page). It also gates **patterns** (composition guides — see below). No artifact passes if it hasn't met the standard. (Node-only, fast, deterministic.)
- **`qa.mjs`** — *the render gate.* Headless-measures the real rendered UI against each contract's `conformance` block.

A component is **done** only when both are green.

## The recipe (what the gate checks, in order)

### 1. Contract — `contracts/<slug>.json`
Required fields: `name, slug, group, tier, summary, props (≥1), spec (≥1), snippets (html lead + react + vue), opinion, surfaces (≥1), preview, conformance`.
Every `snippets` array MUST **lead with an `html` entry** (see §3) — HTML first, then React, then Vue. No exceptions: a leaf's HTML uses its custom element; a composite's HTML is a CDN-React runnable page.
Plus the reuse declaration — **this is the reusability contract**:

```jsonc
// leaf primitive (ships a custom element):
"reuse": { "entry": "./my-thing", "registers": "aha-my-thing", "exportsNamed": ["AhaMyThing", "defineAhaMyThing"] }

// composite (ships a shared artifact — e.g. an antd theme):
"reuse": { "entry": "./my-theme", "exportsNamed": ["myTheme"] }
```

`entry` MUST be a key in `package.json` → `exports`.

### 2. The importable module — `lib/<entry>.js`
This is the thing that makes reuse real. It must resolve as `@ahaslides-product/design/<entry>` and:
- **Leaf:** define + auto-register the custom element (`customElements.define('aha-my-thing', …)`), zero runtime deps, themed only by `--aha-*` tokens. Export the class + a `defineAhaMyThing()` helper.
- **Composite:** export the shared artifact (theme/config object) both framework wrappers consume.

Then add the subpath to `package.json`:
```jsonc
"exports": { "./my-thing": "./lib/my-thing.js", … }
```

### 3. Doc parts — `parts/<slug>.*`
Every component ships a paste-and-run **`<slug>.html.txt` listed FIRST in `snippets`** — no exceptions — plus React and Vue. HTML isn't a replacement; it's the build-step-free form the docs and feeds lead with (the fast path for end-users vibe-coding decks/courses/hubs). How HTML is realised depends on tier:
- **Leaf — the custom element is the native form.** A CDN ESM `import` of the element (`…/@ahaslides-product/design/lib/<entry>.js`) + `tokens.css`, then plain `<aha-*>` markup. Save as `.html`, open, it renders.
- **Composite — a CDN-React runnable page.** No framework-free element exists, so the HTML file loads React + antd from a CDN (`esm.sh`, `React.createElement` → no JSX/build) and mounts the shared-themed grid, consuming the same `@ahaslides-product/design` artifact (e.g. `tableTheme`). Still opens-and-renders with no build step. (See `parts/table.html.txt`.)
- **Hosting caveat (open Q3):** the snippets import from a public CDN (`jsdelivr`/`esm.sh`), but the package currently publishes to **GitHub Packages (authed)**, which public CDNs don't serve — so paste-and-run is **pending** a public-CDN/npm publish. The snippets say so; swap the CDN base once DevOps resolves hosting.
- `<slug>.react.txt` / `<slug>.vue.txt` — **still required; unchanged.** Leaf: thin adapters over the same element that **import the real `@ahaslides-product/design/<entry>`** (React <19 ref wrapper; Vue binds the custom element natively). Composite: the two real vendor libraries through the shared DataTable + theme. No `@aha/design/*` placeholders, no `lucide`/`heroicons`/`fontawesome`/`@ant-design/icons`, no `@mui`/`@chakra-ui`/`@radix-ui`/`@mantine`.
- `<slug>.preview.html` — the live-preview harness the doc page renders and `qa.mjs` measures.

### 4. Conformance
Add a `conformance` block (`ready`, `measure`, `expect`) that measures the real rendered UI. Leaf → measured on the doc page; composite → add a `conformancePart` + `_conformance.html` harness (see `table`).

The render gate is only as strong as this block, so `standards.mjs` now enforces that it **actually pins the look**, not just that it exists:
- **Coverage** — `expect` must measure **≥4 properties** (leaf) / **≥6** (composite), including **≥1 colour** and **≥1 dimension (px)**. A one-line block that passes `qa` trivially is rejected.
- **On the scale / on the palette** — every measured radius must be on **4 / 6 / 8 / 12 / 16**, and every measured colour must be a **canonical token value** (no off-palette hex). Off-standard values fail here, before `qa` ever runs.
- **Real tokens** — every DS-style entry in `tokensUsed` (kebab, e.g. `btn-primary-bg`) must resolve to a real `--aha-*` custom property. (AntD theme-token names like `colorPrimary` are the AntD layer's vocabulary and aren't resolved here.)

### 4b. The visual standard on your `lib/` source (enforced)
The house non-negotiables aren't just skill guidance any more — `standards.mjs` scans the module your `reuse.entry` points at, classified by tier:
- **Leaf element** — colour must **bind to a `--aha-*` token**: no bare hex outside a `var(--aha-…, fallback)`, and any literal `border-radius` must be on the scale. A genuinely decorative exception (a sub-pixel tick radius, a white checkmark stroke) uses an auditable, greppable escape hatch on that line: `ds-lint-allow: hex,radius (why)`.
- **Composite theme** — literals are expected (you're mapping the DS into a vendor theme), but **every hex must stay on-palette**, so the theme can't drift off the system.
- **Token/registry definition layers** (`tokens.*`, the icon registry) are the value *source* — not scanned.

## Contributing a pattern (composition guide)

A **pattern** is the other artifact type. It ships **no new primitive** — it documents how to *compose existing components* for a use case (settings, paywall, overlays), distils the enforceable essence of an `aha-design` skill, and links back to that skill for the "why". The narrative stays single-sourced in the skill; the repo carries only what it can enforce. `standards.mjs` gates patterns too — copy `patterns/settings.json` as the template.

### 1. Contract — `patterns/<slug>.json`
Required fields: `name, slug, kind: "pattern", summary, skillRef, surfaces, composedOf, rules`.

- **`skillRef`** — `{ "build": "aha-design:aha-design-<x>", "judge": "…-judge" }`. The design skill this pattern distils; the gate requires `skillRef.build`.
- **`composedOf`** — the reuse graph: each entry `{ ref, as, use, status }`.
  - `as: "component"` + `status: "available"` → `ref` **must be a real `contracts/<slug>`** (the gate resolves it; a wrong slug fails).
  - `as: "component"` + `status: "missing"` → a **backlog** component the DS doesn't ship yet. This **warns** (the pattern still lands) — add the component here to clear it. *(Flip `PATTERN_BACKLOG_HARD_FAIL` in `standards.mjs` to make backlog a hard fail.)*
  - `as: "token"` → `ref` must be an `--aha-*` token.
- **`rules`** — the shippable checklist. Each `{ rule, ref: ["SETTINGS-xx", …] }`; **every rule must trace to a skill assertion** via `ref`.
- **`reuse`** — omit (or `null`) for a doc-only pattern. If the pattern *ships a composition wrapper*, add a `reuse` block exactly like a composite (`entry` in `exports`, `exportsNamed`) — it's then import-gated the same way.

### 2. Guide — `parts/<slug>.guide.md`
The narrative body (distilled from the skill): pick-the-surface, the rules with do/don'ts, tables. It renders on the pattern doc page and is scanned for banned libraries. No HTML/React/Vue snippets required — a pattern is guidance, not a shippable element.

There is **no HTML-snippet requirement** for patterns (that's a leaf/composite rule), and patterns are excluded from the `qa.mjs` render gate — they're validated by `standards.mjs` only.

## Run the gates

```bash
npm run standards   # the reusability gate — must say "N components meet the standard / 0 fail"
npm run qa          # the render gate — must say "N groups pass / 0 fail"
npm run check       # generate + both gates, end to end
```

If `standards` fails, it prints the exact rule and how to fix it, per component. Fix it — don't work around it. Copy an existing component that matches your tier: **Icon** (leaf, registry-backed), **Checkbox** (leaf, single element), **Table** (composite, shared theme).
