# AGENTS.md — how to work in this repo

**This repo is the AhaSlides design system: the single source of truth for product UI, covering BOTH design and code. The rule is REUSE, not rewrite.** Full charter in `PRINCIPLES.md`; the component recipe in `CONTRIBUTING.md`. Read them before building or changing a component.

> **Agents start here →** fetch **`https://ahaslides-product.github.io/ahaslides-design/llms.txt`** (public, no auth). That one URL indexes every component and links each machine feed (`<slug>.agent.json`) — it is the entire entry point. **Read the matching pattern (llms.txt → Patterns) BEFORE picking components** — building any UI where a user configures options (settings page, editor panel, modal, drawer) means the **Settings** pattern first; its hub control table maps each setting type to its DS control. **Do not guess file paths, and do not fetch docs/feeds from jsDelivr.** Two hosts, two jobs: **GitHub Pages** (`ahaslides-product.github.io/ahaslides-design/…`) serves everything you *read* (docs + feeds, at the site root — no `dist/` prefix); **jsDelivr** (`cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v<version>/lib/<element>.js`, pinned to a release tag) serves only the element source you *import at runtime*. `dist/` is a local build folder — gitignored, never a fetch path.

## The one rule

When you build any AhaSlides product UI, **reuse the component from this system — never rewrite it.**

1. **Look it up first.** The generated feeds list every component, its API, and every icon name — all hosted on **GitHub Pages** (public, no auth), so fetch them directly at the site root (no `dist/` prefix):
   - Index (start here): `https://ahaslides-product.github.io/ahaslides-design/llms.txt`
   - Per component: `https://ahaslides-product.github.io/ahaslides-design/<slug>.agent.json`
   - Icons: `https://ahaslides-product.github.io/ahaslides-design/icons.agent.json`
   - Visual language: `https://ahaslides-product.github.io/ahaslides-design/design.md`

   (`dist/` is only the local build folder — gitignored, never a URL. The old `dist/<slug>.agent.json` form is a filesystem path, not something you can fetch.)
2. **Consume it — three ways, lead with HTML** (paste-and-run, no build step). The runnable snippets `import` the element source from **jsDelivr** — `https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v<version>/lib/<element>.js` (jsDelivr `/gh/` serves what's committed to git at that tag — the `lib/*.js` elements). Every doc page's HTML tab is pinned to the release that built it, so a pasted snippet never changes under the page; take a newer release by changing the tag. Keep the split straight: **feeds/docs on GitHub Pages (step 1); runtime element imports on jsDelivr `/gh/@v<version>/lib`.** Leaf: `import` the element from a CDN and write `<aha-button>` directly; React/Vue consume the *same* custom element (thin adapters). Composite (Table): the HTML form is a CDN-React runnable page (React + antd from a CDN) over the shared theme. Call an icon by name (`<aha-icon name="system-bell" size="16" />`); bind to a token. Never hand-roll a second Button, a raw `<table>`, an inline `<svg>`, or a hardcoded hex/px.
3. **Missing something? Add it HERE, once** — a contract + a real `lib/` entry point (or an SVG + `build-icons.mjs`) — so the next agent reuses it. Never solve it privately in a feature branch.

The ultimate goal: everyone crafts AhaSlides UI by consuming components from here. A UI built by rewriting components is a defect even if it looks right.

## You MUST run the gates before committing or opening a PR

```bash
npm run check    # build → standards gate (reusable) → render gate (qa)
```

- **`standards.mjs` — the reusability gate.** Every component must be complete, declare a real `reuse` entry point, import by its published package name, register (leaf) / export its artifact (composite), and ship a paste-and-run **HTML snippet — every component, no exception** (a leaf uses its custom element; a composite ships a CDN-React runnable page). **No component passes otherwise.** This also runs in CI on every PR — a red gate blocks the merge.
- **`qa.mjs` — the render gate.** Measures the real rendered UI against each contract (needs headless Chrome; run locally). If a `screenshot 0KB` line appears, that's local Chrome contention — re-run once settled; it is not a code failure.

### Every merge ships a changelog entry + a version bump

Before you open a PR, add your change to the **top** of `CHANGELOG.md` and bump `version` in `package.json` to match. `standards.mjs` gates this — a missing/mismatched/undated entry goes red, same as any other standard, **and so does a leftover `(#PR)` placeholder**: fill in the real PR number (`(#58)`) once the PR is open. Format (newest first, [SemVer](https://semver.org); full recipe in `CHANGELOG.md`):

```
## X.Y.Z — YYYY-MM-DD
### Added | Changed | Fixed | Removed
- one short bullet per change, written for a consumer (#<PR-number>)
```

Pre-1.0 bump rule: a new component/prop/token/export → **MINOR** (`0.x.0`); a fix with no API change → **PATCH** (`0.0.x`); a breaking change → MINOR too (until 1.0), and say so in the bullet. The top version must equal `package.json` → `version`. **Publishing is automatic:** on merge to `master`, `publish.yml` ships the new `version` to GitHub Packages and creates the matching `v<version>` tag — you never tag or publish by hand, and a merge that bumped the version is a live release. So a correct `version` bump is the whole job. Each release then opens or refreshes one `ds/auto-bump` PR per consumer app in `.github/ds-consumers.json` (add an app there, one line); the app's team merges it.

A red gate means the work isn't done. **Fix it — don't work around it.** To add a component, copy an existing one of your tier: **Icon** / **Checkbox** (leaf), **Table** (composite), then follow `CONTRIBUTING.md`.

## Claude Code: the DS agent plugin

This repo is also a Claude Code plugin marketplace. `agent/` is the `ahaslides-design` plugin (skill `aha-design` + hooks), released with every version: `/plugin marketplace add AhaSlides-Product/ahaslides-design`, then enable `ahaslides-design@ahaslides-design` (settings.json snippet in `README.md`, "Agent plugin"). Changing it: every release bumps `package.json` and `agent/.claude-plugin/plugin.json` to the same version, keep rules in `anti-slop/` and `guidelines/` (the skill points at them), and run `npm run generate` so `agent/anti-slop/criteria.json` stays the store's copy. `standards.mjs` gates all three; the hook suites run in `npm test`.

## House non-negotiables (detail in the `aha-design` skill)

- Ant Design v6 only (no MUI/Chakra/Radix/Mantine); charts via `@ant-design/plots` — **except result/data charts, which use the DS `<aha-chart>`** (Bar, Column, Stacked, Donut, Radial, Tree map, Quadrant, Bell curve, Radar, Word cloud, Mind map; framework-free SVG/HTML with `palette="brand"` for app screens such as Report and `palette="deck"` on the presenting/audience canvas). Reach for `@ant-design/plots` only for a chart type `<aha-chart>` does not ship yet. Full config (every `type`, `options` key, entrance and update animation, `palette`, `locale`, events) is in `docs/chart/README.md`, `contracts/chart.json` and the hosted Charts tab.
- No hardcoded hex/px in components — bind to tokens (`--aha-*`); radius only from 4 / 6 / 8 / 12 / 16.
- Motion: every interactive state (hover/focus/checked/open/close) must animate via the shared motion tokens (`--aha-motion-*` durations + `--aha-ease-*` curves, AntD's motion), never snap, never a bare duration literal (`.12s`). And the transition must live on a **persistent node** — toggle an attribute/class, don't rebuild the subtree (`innerHTML=`) on the state change, or the transition is dead (it never fires, even with correct CSS — the Switch-click trap). The standards gate flags all three: snap, bare literal, dead transition.
- Responsive: product UI is **one UI for every device** — it must be **fluid from a 360px phone floor up**, reflowing (wrap/stack), never forcing a **horizontal scroll**, and never trapping its width with a fixed `min-width` ≥ 360px (bind to a fluid width — `max-width`/`%`/`min()` — or the grid/flex primitives + antd breakpoints). Interactive controls carry a **≥ 24px** touch target (WCAG 2.5.8 AA). Two gates enforce it: `standards.mjs` (component source) and `screen-lint.mjs` (consumer screens) **hard-fail a fixed `min-width` ≥ 360px trap** statically; and `screen-lint.mjs --measure` **renders a real screen at 360 / 768 / 1440 and hard-fails a horizontal overflow** (the render-side twin — Chrome-gated, so the static path stays dependency-free for consumer CI). A wide data table that scrolls is the one legitimate exception. (A per-line override is auditable and names the rule plus a reason: `ds-lint-allow: responsive (why)`; a bare `ds-lint-allow` suppresses nothing. `screen-lint` is also importable as `lintHtml` from `@ahaslides-product/design/screen-lint`.)
- Accessibility: an interactive component must be **operable, not just drawn** (qa proves the render, never the a11y). Carry the keyboard/aria contract of the role you declare — a **roving role** (`radio`/`tab`/`menuitem`/`option`/…) needs arrow-key navigation (not just a click); a **global listener** (`document`/`window`) added on connect must be removed on disconnect; a dynamic **`aria-*` state** needs `observedAttributes` so it can't desync. Declare the *right* role (a progress bar is `role="progressbar"` + `aria-valuenow`; a control with no role is invisible to AT), and theme imperative overlays via the **hook** (`useMessage`/`useNotification`/`useModal`), never the static `message.success()` that renders un-themed. `standards.mjs` hard-fails a new component on roving-role-without-arrows, a leaked global listener, dynamic-aria-without-`observedAttributes`, and a static-overlay call in a snippet.
- Tables → antd `Table` wrapped in `ConfigProvider theme={tableTheme}`, never restyled per call site. A grid that needs the DS V3 behaviours (single-arrow sort, checklist / range filters, reorder, freeze, resize, edit columns) uses the shared `DataTable` from `@ahaslides-product/design/aha-data-table` — never a per-app rebuild of them.
- Icons → the shared `<aha-icon>` **by name** from the DS [icon library](https://ahaslides-product.github.io/ahaslides-design/icons/index.html), never Lucide/Heroicons/FontAwesome/@ant-design/icons or an inline `<svg>`. `standards.mjs` gates this: every `<aha-icon name="…">` a component references must resolve in `icons/registry.json`, and an inline `<svg>` glyph in element source fails. Missing a glyph? Add the SVG under `icons/svg/**` and re-run `build-icons.mjs`.
- **Logos:** every logo — the AhaSlides logo / The Splash or a third-party brand — comes from the [Logo library](https://ahaslides-product.github.io/ahaslides-design/foundations/logo.html) (files at `https://ahaslides-product.github.io/ahaslides-design/logo/<file>`), never redrawn, inlined as a hand-made `<svg>`, recoloured, or swapped for an icon or letter tile.
- Backgrounds white by default; no gradients on backgrounds/fills.
- Buttons: size via the `size` prop (`sm` / `md` / `lg` / `xl` / `touch` on `<aha-button>`; `touch` 48px is the audience phone's primary action; `xl` 52px is for in-canvas presenter controls) or React `<XLButtonScope>`; never inline height/padding/radius/fontSize, never `::part(button)` sizing.
- Page titles → `<aha-breadcrumb size="page-title">`, never a hand-rolled `<h1>`/heading. The DS has **no separate page-title component** — the breadcrumb IS the page title: give it the current page as the only item for a top-level page, or the full ancestor path for a sub-page (`heading-level` picks h1–h6). A plain heading drifts off the type scale and drops the trail, `aria-current`, and the `navigate` event. For the full header row (title + right-aligned actions), wrap it in `<aha-screen-heading>`.
