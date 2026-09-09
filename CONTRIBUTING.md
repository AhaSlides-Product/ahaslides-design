# Contributing a component

Read `PRINCIPLES.md` first. The rule that governs this repo: **components here must be reusable — real, importable code, not reference snippets.** Two gates enforce it, and `npm run check` runs both:

- **`standards.mjs`** — *the reusability gate.* For every contract it proves the component is complete, declares a real package entry point, imports by its published name, and registers/exports. No component passes if it hasn't met the standard. (Node-only, fast, deterministic.)
- **`qa.mjs`** — *the render gate.* Headless-measures the real rendered UI against each contract's `conformance` block.

A component is **done** only when both are green.

## The recipe (what the gate checks, in order)

### 1. Contract — `contracts/<slug>.json`
Required fields: `name, slug, group, tier, summary, props (≥1), spec (≥1), snippets (≥2), opinion, surfaces (≥1), preview, conformance`.
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
- `<slug>.react.txt` / `<slug>.vue.txt` — snippets that **import the real `@ahaslides-product/design/<entry>`**. No `@aha/design/*` placeholders, no `lucide`/`heroicons`/`fontawesome`/`@ant-design/icons`, no `@mui`/`@chakra-ui`/`@radix-ui`/`@mantine`.
- `<slug>.preview.html` — the live-preview harness the doc page renders and `qa.mjs` measures.

### 4. Conformance
Add a `conformance` block (`ready`, `measure`, `expect`) that measures the real rendered UI. Leaf → measured on the doc page; composite → add a `conformancePart` + `_conformance.html` harness (see `table`).

## Run the gates

```bash
npm run standards   # the reusability gate — must say "N components meet the standard / 0 fail"
npm run qa          # the render gate — must say "N groups pass / 0 fail"
npm run check       # generate + both gates, end to end
```

If `standards` fails, it prints the exact rule and how to fix it, per component. Fix it — don't work around it. Copy an existing component that matches your tier: **Icon** (leaf, registry-backed), **Checkbox** (leaf, single element), **Table** (composite, shared theme).
