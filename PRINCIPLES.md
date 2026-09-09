# AhaSlides Design System — Core Values

> The charter. Read this before building, extending, or reviewing anything here.
> If a change violates one of these, the change is wrong — not the value.

## Why this exists (the mission)

**This is the single source of truth for AhaSlides product UI — covering BOTH the design and the code.**
Not a spec that developers re-interpret. Not a screenshot library. One place that holds:

- **The visual language** — tokens (colour, type, spacing, radius), the measured component standard, UX-writing rules.
- **The real, reusable components** — the actual Button, Checkbox, Table, Icon… that ship the UI.

Design and code are the same artifact here, generated from one source, so they can never drift apart.

## The one rule for every AhaSlides agent

**When you build any AhaSlides product UI, REUSE the component from this design system. Do not rewrite it.**

Every new task starts the same way:

1. **Look it up here first.** Read the feeds (`llms.txt`, `<slug>.agent.json`, `design.md`, `icons.agent.json`) to find the component and its exact API — the component name, props, tokens, and the icon/glyph names.
2. **Consume it — don't recreate it.** Import the component. Call the icon by name. Bind to the token. Never hand-roll a second Button, a raw `<table>`, an inline `<svg>`, or a one-off hex colour.
3. **Missing something? Add it here, once.** If the component or glyph genuinely doesn't exist, add it to this repo (contract + part, or `icons/svg/` + `build-icons.mjs`) so the *next* agent reuses it. Never solve it privately in a feature branch.

**The ultimate goal: everyone — every human, every agent — crafts AhaSlides UI by consuming components from here.** A UI built by rewriting components from scratch is a defect, even if it looks right.

## What that demands of this repo (non-negotiable)

- **Reuse must be real, not aspirational.** Every component this DS advertises must be genuinely *consumable* — importable code + a portable data source — not a reference snippet that only runs in the docs. A "copy this SVG / re-implement this" answer defeats the entire mission.
- **Every component has a paste-and-run HTML form — no exception — and the docs/feeds lead with it.** It's the lowest-friction reuse path (no build step), the fast path for end-users vibe-coding decks/courses/hubs. A leaf's HTML *is* its web component (`<aha-*>` + a CDN import); a composite with no framework-free element ships a **CDN-React runnable page** (React + antd from a CDN, mounting the shared-themed grid). React and Vue remain first-class alongside it — not a competing implementation. *(The public-CDN import is pending hosting — open Q3 — while the package ships to GitHub Packages; the snippets say so.)*
- **One source → everything generated.** Edit a token or a contract; the docs, feeds, and machine artifacts regenerate together. Never hand-maintain an agent-facing doc.
- **Discovery layer + reuse layer.** The generated feeds are how an agent *finds* the right component and name; the components/registry are how it *uses* them. Both must stay in sync with the source.

## The house non-negotiables (the fixed system)

These come from the `aha-design` skills — follow the owning skill, then self-check with its judge.

- **Library:** Ant Design v6 only (no MUI/Chakra/Radix/Headless/Mantine); charts via `@ant-design/plots`.
- **No hardcoded hex/px in components** — bind to theme tokens (`theme.useToken()` / `--aha-*`); radius only from the 4 / 6 / 8 / 12 / 16 scale.
- **Tables:** the shared DataTable, never a raw AntD `<Table>`.
- **Icons:** the shared Icon component — **call a glyph by name** from the registry, never inline an `<svg>` or pull Lucide/Heroicons/FontAwesome/@ant-design/icons.
- **Backgrounds** white by default; no gradients on backgrounds/fills (AI-affordance border-only exception).
- **Buttons:** size via the `size` prop or `<XLButtonScope>`; never inline height/padding/radius/fontSize.
- **Typography:** Plus Jakarta Sans, weights 400/600 (Display 700), fixed DS V3 scale.

## The bar for "done" — enforced by two gates

A component ships only when it is: contract-authored → built → themed by tokens → judged against the owning skill → and passes **both gates** (`npm run check`):

- **`standards.mjs` — the reusability gate.** Every component must be complete, declare a real `reuse` entry point, import by its published package name, and register (leaf) or export its artifact (composite). No component passes if it hasn't met the standard.
- **`qa.mjs` — the render gate.** Measures the *real rendered UI* against the contract, not the source.

Anything less is a doc, not a design system. See `CONTRIBUTING.md` for the recipe both gates enforce.
