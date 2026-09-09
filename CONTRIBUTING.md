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
- **Hosting (live-on-merge):** the snippets import the element ESM publicly from **jsDelivr `/gh/`** — `https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@__REF__/lib/…`. This serves the repo's committed `lib/*.js` directly (no npm needed; the published package is GitHub-Packages-only). **Author the ref as the `@__REF__` placeholder — never a hardcoded tag** (the gate enforces this); `generate.mjs` injects the real ref from one place (`CDN_REF`, default `master`). So a merge to master is live automatically: `pages.yml` redeploys the docs and `/gh/@master` serves the current element code — no per-release tag bump. (Set `AHA_CDN_REF` to a release tag if an immutable pin is ever wanted; public npm / a branded CDN remain optional later polish.)
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
- **Leaf element — motion must be token-bound, and it must actually fire.** If the element has interactive states (`:hover`, `:focus`, `:checked`, `[open]`, a close affordance…), those states MUST **animate, not snap**, using the shared motion tokens — `--aha-motion-*` durations + `--aha-ease-*` curves (AntD's motion; e.g. `transition: transform var(--aha-motion-mid) var(--aha-ease-in-out-circ)`). The gate flags **three** ways motion gets dropped:
  1. **Snap** — an interactive element with no `transition` at all.
  2. **Bare literal** — a `transition` timed `.12s`/`150ms` instead of a token (it drifts), rejected like a bare hex.
  3. **Dead transition** — the element declares a transition but **rebuilds its whole subtree** (`this.shadowRoot.innerHTML = …` in `attributeChangedCallback`) on the very state attribute (`checked`/`open`/…) the transition animates. The browser gets a brand-new node with no "from" state, so it jumps — the transition is dead **even when the CSS is correct** (this is why the Switch still didn't animate on click after its motion was re-tuned). **Fix: toggle the attribute/class and mutate in place on a persistent node; don't re-render on state change.**
  4. **Example out of sync** — `parts/<slug>.preview.html` is a self-contained copy of the component (it's what `qa.mjs` renders + measures), so it drifts from `lib/` and the example ends up showing different motion than the shipped element. The gate flags any `transition` the element ships that the preview is missing. **When you change a component's motion, change its preview to match.**
  Escape hatch `ds-lint-allow: motion (why)`. A purely static marker with no interactive state (e.g. Badge) needs no transition and isn't flagged. **Currently WARN (`MOTION_HARD_FAIL` in `standards.mjs`); flips to a hard fail once the re-rendering leaves are restructured.**
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

## Changelog + version (every merge)

Shipping a component isn't the last step — **every merge also adds a `CHANGELOG.md` entry and bumps the version.** `standards.mjs` gates this (the `repo` section), so it goes red like any other miss. Before you open the PR:

1. Add your change to the **top** of `CHANGELOG.md`:
   ```
   ## X.Y.Z — YYYY-MM-DD
   ### Added | Changed | Fixed | Removed
   - one short bullet per change, written for a consumer (#PR)
   ```
   Include only the sections you touched. A new component/export is an **Added**.
2. Bump `version` in `package.json` to that same `X.Y.Z`. [SemVer](https://semver.org), pre-1.0: a new component/prop/token/export → **MINOR** (`0.x.0`); a fix with no API change → **PATCH** (`0.0.x`); a breaking change → MINOR too (until 1.0), and say so in the bullet.

The top changelog version must equal `package.json` → `version`; the release tag `v<version>` (what `npm publish` ships) matches. Full recipe lives at the top of `CHANGELOG.md`.
