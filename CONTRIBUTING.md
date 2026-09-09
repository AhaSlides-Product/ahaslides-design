# Contributing a component

Read `PRINCIPLES.md` first. The rule that governs this repo: **components here must be reusable — real, importable code, not reference snippets.** Two gates enforce it, and `npm run check` runs both:

- **`standards.mjs`** — *the reusability gate.* For every contract it proves the component is complete, declares a real package entry point, imports by its published name, registers/exports, and — for a leaf — **ships a paste-and-run HTML snippet** (a composite declares `htmlExempt` instead). It also gates **patterns** (composition guides — see below). No artifact passes if it hasn't met the standard. (Node-only, fast, deterministic.)
- **`qa.mjs`** — *the render gate.* Headless-measures the real rendered UI against each contract's `conformance` block.

A component is **done** only when both are green.

## The recipe (what the gate checks, in order)

### 1. Contract — `contracts/<slug>.json`
Required fields: `name, slug, group, tier, summary, props (≥1), spec (≥1), snippets (≥2), opinion, surfaces (≥1), preview, conformance`.
A **leaf** `snippets` array MUST **lead with an `html` entry** (see §3) — HTML first, then React, then Vue; a **composite** instead declares `"htmlExempt": "<why>"`.
Plus the reuse declaration — **this is the reusability contract**:

```jsonc
// leaf primitive (ships a custom element):
"reuse": { "entry": "./my-thing", "registers": "aha-my-thing", "exportsNamed": ["AhaMyThing", "defineAhaMyThing"] }

// composite (ships a shared artifact — e.g. an antd theme):
"reuse": { "entry": "./my-theme", "exportsNamed": ["myTheme"] }
```

`entry` MUST be a key in `package.json` → `exports`.

### 2. The importable module — `lib/<entry>.js`
This is the thing that makes reuse real. It must resolve as `@ahaslides/design/<entry>` and:
- **Leaf:** define + auto-register the custom element (`customElements.define('aha-my-thing', …)`), zero runtime deps, themed only by `--aha-*` tokens. Export the class + a `defineAhaMyThing()` helper.
- **Composite:** export the shared artifact (theme/config object) both framework wrappers consume.

Then add the subpath to `package.json`:
```jsonc
"exports": { "./my-thing": "./lib/my-thing.js", … }
```

### 3. Doc parts — `parts/<slug>.*`
A leaf ships **three** snippets over the **same element** — HTML leads, React and Vue remain. HTML is not a replacement; it's the element's native, build-step-free form, so it's the default the docs and feeds lead with (the fast path for end-users vibe-coding decks/courses/hubs).
- **`<slug>.html.txt` — REQUIRED for a leaf, and listed FIRST in `snippets`.** Paste-and-run HTML: a CDN ESM `import` of the element (`…/@ahaslides/design/lib/<entry>.js`) + `tokens.css`, then plain `<aha-*>` markup. Save as `.html`, open, it renders — no build step. (The CDN base is `jsdelivr` for now; swappable once DevOps picks a branded URL.) A **composite** has no framework-free element — omit this file and declare `htmlExempt` on the contract instead.
- `<slug>.react.txt` / `<slug>.vue.txt` — **still required; unchanged.** Thin adapters over the same element that **import the real `@ahaslides/design/<entry>`** (React <19 ref wrapper; Vue binds the custom element natively). No `@aha/design/*` placeholders, no `lucide`/`heroicons`/`fontawesome`/`@ant-design/icons`, no `@mui`/`@chakra-ui`/`@radix-ui`/`@mantine`.
- `<slug>.preview.html` — the live-preview harness the doc page renders and `qa.mjs` measures.

### 4. Conformance
Add a `conformance` block (`ready`, `measure`, `expect`) that measures the real rendered UI. Leaf → measured on the doc page; composite → add a `conformancePart` + `_conformance.html` harness (see `table`).

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

There is **no HTML/`htmlExempt` requirement** for patterns (that's a leaf/composite rule), and patterns are excluded from the `qa.mjs` render gate — they're validated by `standards.mjs` only.

## Run the gates

```bash
npm run standards   # the reusability gate — must say "N components meet the standard / 0 fail"
npm run qa          # the render gate — must say "N groups pass / 0 fail"
npm run check       # generate + both gates, end to end
```

If `standards` fails, it prints the exact rule and how to fix it, per component. Fix it — don't work around it. Copy an existing component that matches your tier: **Icon** (leaf, registry-backed), **Checkbox** (leaf, single element), **Table** (composite, shared theme).
