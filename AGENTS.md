# AGENTS.md — how to work in this repo

**This repo is the AhaSlides design system: the single source of truth for product UI, covering BOTH design and code. The rule is REUSE, not rewrite.** Full charter in `PRINCIPLES.md`; the component recipe in `CONTRIBUTING.md`. Read them before building or changing a component.

## The one rule

When you build any AhaSlides product UI, **reuse the component from this system — never rewrite it.**

1. **Look it up first.** The generated feeds list every component, its API, and every icon name: `dist/<slug>.agent.json`, `dist/icons.agent.json`, `dist/llms.txt`, `dist/design.md`.
2. **Consume it — three ways, lead with HTML** (paste-and-run, no build step — served publicly from jsDelivr `/gh/@master`, so a merge to master is live automatically). Leaf: `import` the element from a CDN and write `<aha-button>` directly; React/Vue consume the *same* custom element (thin adapters). Composite (Table): the HTML form is a CDN-React runnable page (React + antd from a CDN) over the shared theme. Call an icon by name (`<aha-icon name="system-bell" size="16" />`); bind to a token. Never hand-roll a second Button, a raw `<table>`, an inline `<svg>`, or a hardcoded hex/px.
3. **Missing something? Add it HERE, once** — a contract + a real `lib/` entry point (or an SVG + `build-icons.mjs`) — so the next agent reuses it. Never solve it privately in a feature branch.

The ultimate goal: everyone crafts AhaSlides UI by consuming components from here. A UI built by rewriting components is a defect even if it looks right.

## You MUST run the gates before committing or opening a PR

```bash
npm run check    # build → standards gate (reusable) → render gate (qa)
```

- **`standards.mjs` — the reusability gate.** Every component must be complete, declare a real `reuse` entry point, import by its published package name, register (leaf) / export its artifact (composite), and ship a paste-and-run **HTML snippet — every component, no exception** (a leaf uses its custom element; a composite ships a CDN-React runnable page). **No component passes otherwise.** This also runs in CI on every PR — a red gate blocks the merge.
- **`qa.mjs` — the render gate.** Measures the real rendered UI against each contract (needs headless Chrome; run locally). If a `screenshot 0KB` line appears, that's local Chrome contention — re-run once settled; it is not a code failure.

A red gate means the work isn't done. **Fix it — don't work around it.** To add a component, copy an existing one of your tier: **Icon** / **Checkbox** (leaf), **Table** (composite), then follow `CONTRIBUTING.md`.

## House non-negotiables (detail in the `aha-design` skills)

- Ant Design v6 only (no MUI/Chakra/Radix/Mantine); charts via `@ant-design/plots`.
- No hardcoded hex/px in components — bind to tokens (`--aha-*`); radius only from 4 / 6 / 8 / 12 / 16.
- Tables → the shared DataTable, never a raw `<Table>`.
- Icons → the shared `<aha-icon>` **by name**, never Lucide/Heroicons/FontAwesome/@ant-design/icons or an inline `<svg>`.
- Backgrounds white by default; no gradients on backgrounds/fills.
- Buttons: size via the `size` prop or `<XLButtonScope>`; never inline height/padding/radius/fontSize.
