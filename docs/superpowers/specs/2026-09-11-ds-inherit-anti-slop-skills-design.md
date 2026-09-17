# Harden the generate workflow so the DS inherits the aha-design anti-slop skills

- **Status:** design approved (brainstorm), spec under review
- **Date:** 2026-09-11
- **Repo:** `ahaslides-design` (the AhaSlides Design System — generator + feeds)
- **End state:** the DS is **the single official AhaSlides anti-slop tool** — self-contained,
  authoritative, edited here. The `aha-design` plugin is a **Phase-1 seed**, not a permanent
  upstream: Phase 1 *inherits* its build+judge criteria to bootstrap; Phase 2 *owns* them and
  decouples from the plugin entirely (the dependency may later invert — aha-design reads from
  the DS, not the reverse).

## 1. Problem

A fresh external repo can consume this DS from the CDN and still produce **slop** — the
`ds-consumer-test` presenter/dashboard mock is built entirely from correct DS components
yet reads as a generic admin template: placeholder "A" logo, broken "Loading QR…",
evenly-spaced everything, no hierarchy, Title-Cased labels. The components are individually
right; the **composition and copy discipline** are missing.

That discipline already exists — in the `aha-design` plugin skills the user trained heavily.
Each surface is a **build skill** (rules + a machine-measured `references/contract.json`) paired
with a **judge skill** (binary PASS/FAIL across N criteria `C1..Cn`, no partial credit) that
closes a **build→judge→fix loop**. This DS is the *generator* those skills consume, and it
already distils them into `patterns/*.json` feeds (each rule tagged to a criterion via
`ref`, each pattern carrying a `skillRef` `{build, judge}`).

The break — why a connected consumer still produces slop:

1. **Feed-only consumers never receive the loop.** An agent connecting via the CDN gets
   `llms.txt` + per-component `agent.json` + `design.md` + `patterns.*`. It never receives the
   **judge criteria** or the **"build → self-judge → fix" instruction**. It builds blind and
   never self-checks.
2. **Inheritance is hand-maintained and already drifting.** The aggregate contract the skills
   ship is dated Aug 4; the DS dropped button variants Sep 11. `patterns/*.json` are
   hand-authored — nothing enforces that a rule's `ref` still resolves to a live criterion.
3. **No screen-composition / shell pattern.** Every existing pattern is a component-family or
   slide-canvas guide. There is no "how an AhaSlides *screen* is assembled" — precisely the
   layer the mock hand-rolled into generic slop.

## 2. Goal / non-goals

**Goal.** Make the DS **the single official AhaSlides anti-slop tool**: it carries the anti-slop
loop to feed-only consumers, generated and gated — a connecting agent pulls down the rules *and*
the binary judge for its surface, self-checks, and fixes before shipping. The anti-slop criteria
become a **canonical store owned by the DS** (`anti-slop/`), edited here, published in the feeds.

The `aha-design` plugin is the **Phase-1 seed only** (§9). Phase 1 imports its criteria once to
bootstrap the store and proves the loop; Phase 2 declares the DS store authoritative and removes
the coupling — after which changing an anti-slop rule means editing the DS, and the plugin has no
say. Inheritance in Phase 1 is provable and reviewable (a committed seed diff), not a live read.

**Non-goals (this slice / Phase 1).**
- Not authoring a brand-new app-shell *skill pair* back in `aha-design` (flagged as a follow-up;
  the shell pattern + its criteria are authored here — the DS is the owner).
- Not re-measuring or regenerating the aggregate skill `contract.json` (separate sync path).
- Not fixing the `ds-consumer-test` mock by hand — it is used only as the *proof* that the
  hardened feeds change consumer behaviour.
- Not fanning out to all seven existing patterns — MVP is one surface + the shell.
- Not retiring the `aha-design` plugin itself — that is an org decision; this spec only removes the
  DS's *dependency* on it.

## 3. Design principle

Apply the judges' own no-drift rule ("the judge never duplicates the contract; it reads the
one source of truth so it can't drift") — but relocate *the source of truth into the DS*. The
consumer-facing anti-slop feed is **generated from the DS's own `anti-slop/` store**, never
hand-written per-feed, and a **gate fails the build** if the feeds and the store disagree.

In Phase 1 that store is *seeded* from the aha-design plugin (a one-time import, reviewed as a
committed diff). From Phase 2 on, the store **is** the source of truth: there is no external
skill to drift from, so "no-drift" means internal consistency (every feed derives from the store)
rather than agreement with the plugin.

## 4. Architecture

```
aha-design plugin (Phase-1 SEED)    THIS REPO (ahaslides-design) — THE OFFICIAL TOOL     CONSUMER (feed-only agent)
(build + judge, C1..Cn)             ──────────────────────────────────────────────      ──────────────────────────
  criteria  ──import (once, P1)──▶  anti-slop/criteria.json  (DS-OWNED canonical store)
     ⋮  (retired in Phase 2)            │  authored + seeded surfaces, edited HERE
                                        ▼
                                    generate.mjs  ──compiles──▶  dist/anti-slop.md
                                        │                         dist/anti-slop.agent.json  ──▶  "load rules →
                                        │                         llms.txt (step 0 pointer)         build → self-judge →
                                        ▼                         patterns/app-shell.* (new)        fix → repeat"
                                    standards.mjs (consistency gate)
```

### 4.1 Unit A — `anti-slop/criteria.json` (the DS-owned canonical store)

The canonical anti-slop store, **owned and edited by the DS**. One entry per surface wired this
slice (MVP: `ux-writing` + `app-shell`). Provenance is recorded but not authoritative:

```jsonc
{
  "owner": "ahaslides-design",           // the DS is the source of truth
  "seededFrom": {                        // Phase-1 provenance only; ignored by the gate after Phase 2
    "plugin": "aha-design",
    "version": "1.78.0",
    "importedOn": "2026-09-11"
  },
  "surfaces": {
    "ux-writing": {
      "surface": "copy",
      "origin": "seeded",                 // "seeded" (imported P1) | "authored" (born in the DS)
      "skillRef": {                       // back-ref / provenance, NOT a governance link
        "build": "aha-design:aha-design-ux-writing",
        "judge": "aha-design:aha-design-ux-writing-judge"
      },
      "criteria": [
        { "id": "C1", "title": "Casing — sentence case across all product UI text",
          "test": "sentence case, first letter only (+ proper nouns/acronyms); one canonical cased form per label" },
        { "id": "C2", "title": "Specific — names the object + what happened", "test": "…" }
        // …C3..C7, short verbatim test text, no rationale
      ]
    },
    "app-shell": {
      "surface": "shell",
      "origin": "authored",               // born here — no aha-design shell skill exists
      "skillRef": null,
      "criteria": [ /* SHELL-1..n authored in the DS */ ]
    }
  }
}
```

- **What it stores:** each surface's binary criteria (`id`, short title, one-line test) — the
  *enforceable subset*, not narrative/evals. This is the single thing the feeds + gate read.
- **Two origins:** `seeded` surfaces are imported once from the plugin (Phase 1); `authored`
  surfaces (like `app-shell`) are born in the DS. After Phase 2 the distinction is historical —
  every surface is edited here regardless of origin.
- **How `seeded` entries are produced (Phase 1, one-time):** `sync-skills.mjs import` reads the
  installed plugin's judge `SKILL.md` (parsing the `### Cn. <title> → PASS / FAIL` headers + the
  "The N criteria" block) and writes the criteria into the store. It is an **importer, not a
  perpetual sync** — run once to seed, review the committed diff, then the plugin is no longer
  consulted. (A maintainer may re-run it before Phase 2 to pull last-minute plugin fixes; from
  Phase 2 it is retired.)
- **Why owned + committed, not read live:** the DS must be self-contained (the official tool),
  and the plugin is absent in CI. Editing anti-slop = editing this file in the DS's git history.

### 4.2 Unit B — the consumer entrypoint feed (`generate.mjs`)

`generate.mjs` gains a `renderAntiSlop(store, patterns)` that emits two artifacts to `dist/`:

- **`dist/anti-slop.md`** — human/agent readable. Fixed preamble (the loop), then per-surface
  sections. Each section: the surface's pattern `rules[]` (already in `patterns/*.json`) + the
  judge's binary `criteria[]` (from the store) + the `selfCheck` list. The loop preamble:

  > You are generating AhaSlides product UI by consuming this design system. Before you write a
  > screen: (1) identify the surface(s) you're building; (2) read that surface's rules below;
  > (3) after building, run the surface's **binary judge** — every criterion is PASS/FAIL, no
  > partial credit; (4) fix every FAIL and re-judge; (5) ship only when all criteria PASS.

- **`dist/anti-slop.agent.json`** — the machine mirror: `{ loop, surfaces: { <surface>: { rules,
  criteria, selfCheck, skillRef } } }`. Derived from the *same* store + patterns, so the two
  can't diverge.

Both are **generated** from `anti-slop/criteria.json` + `patterns/*.json`. No rule text is authored
in `generate.mjs`.

### 4.3 Unit C — `llms.txt` step 0

`llms.txt` today is a bare component index. Prepend a short **"Before you build"** block pointing
at `anti-slop.md` / `anti-slop.agent.json` and stating the loop in one sentence, so any agent that
enters at the index hits the discipline before selecting components. (Also add the `<link
rel="alternate">` + `dist/feeds` card, matching how `design.md` / `llms-full.txt` are surfaced.)

### 4.4 Unit D — `patterns/app-shell.json` (the composition gap)

A new pattern, same shape as the existing seven (`skillRef`, `composedOf`, `rules[]`,
`selfCheck`, `surfaces`, `reuse: null` doc-only). It documents how an AhaSlides *screen* is
assembled from DS components — the layer the mock hand-rolled:

- **Regions:** left nav rail (brand mark + wordmark at top, nav items, primary CTA), top bar
  (title/context left, actions/avatar right), content region, and a canvas/stage region where
  relevant — each mapped to the DS components that fill it (`aha-button`, `aha-icon`, `aha-avatar`,
  `aha-badge`, DataTable, …) and the tokens that space them.
- **Anti-slop rules** derived from the mock's failures (each tagged to a criterion or to a
  locally-authored `SHELL-n` assertion since no aha-design shell judge exists yet):
  - Real brand mark + wordmark, never a placeholder letter tile.
  - No "loading…"/empty placeholder shipped as final state (QR, thumbnails) — render a real
    asset or a proper empty state, never a dead spinner label.
  - Deliberate hierarchy: one primary action per region; type roles from the scale; not uniform
    grey-on-white cards with equal weight.
  - Nav/topbar spacing and radius from tokens, active state on a persistent node via motion tokens.
- **`skillRef`** points at the shell criteria set authored in `anti-slop/criteria.json` under a
  `app-shell` key and **flags the missing aha-design shell skill** as a follow-up to backfill.

### 4.5 Unit E — consistency gate (extend `standards.mjs`)

New checks, red on failure (same tier as the existing standards):

1. **Criterion resolves.** For every `patterns/*.json` rule `ref` that names a judge criterion
   (`C\d+`), that id must exist in the referenced skill's `criteria` in `anti-slop/criteria.json`.
   (Build-assertion refs like `UXW-1` / `§2` are validated against the build assertion-id list
   where present, else warn — the pattern already uses both numbering systems.)
2. **Coverage.** Every skill wired into `anti-slop.agent.json` has ≥1 rule referencing ≥1 of its
   criteria, and the app-shell pattern's `SHELL-n` refs all resolve to its local criteria set.
3. **Feed built from the store.** `anti-slop.md` / `.agent.json` exist and were regenerated this
   run from `anti-slop/criteria.json` (banner check, mirroring the existing `generated from …` gate).
4. **Seed freshness (Phase 1 only; warn, not fail; removed in Phase 2).** While any surface is
   still `origin: "seeded"` and an `aha-design` plugin is installed newer than `seededFrom.version`,
   warn to re-run `sync-skills.mjs import` — so a maintainer can pull last-minute plugin fixes
   before decoupling. Once all surfaces are `authored` (Phase 2) this check is deleted; the DS
   owes the plugin nothing. Never blocks a plugin-less CI.

## 5. MVP slice (one surface + shell, end-to-end)

- **Paired existing surface: `ux-writing`.** Chosen because it has a mature build+judge pair,
  its `patterns/ux-writing.json` already exists, and it touches every label on the Dashboard —
  the Title-Case slop (`New Presentation` vs `New presentation`) is exactly what feed-only
  consumers ship today. It exercises the full plumbing (store → entrypoint feed → llms.txt →
  gate) on real criteria (`C1..C7`).
- **New pattern: `app-shell`.** The composition gap that made the mock generic.
- Deliver Units A–E for these two surfaces only. Everything else (canvas, audience, settings,
  overlays, feedback, status-badges) stays as-is; the entrypoint feed lists them as "not yet
  wired" so the fan-out is an obvious, mechanical next step.

## 6. Proof (acceptance)

1. `npm run generate` produces `dist/anti-slop.md`, `dist/anti-slop.agent.json`, the `llms.txt`
   step-0 block, and the `app-shell` pattern pages/feeds.
2. `npm run check` is green — the new consistency gate passes (all `ux-writing` C1..C7 + `app-shell`
   SHELL-n refs resolve; feeds regenerated).
3. **Consumer-behaviour proof:** re-run the `ds-consumer-test` dashboard build *following the
   `anti-slop.md` loop*, then run the `ux-writing` + `app-shell` self-judge against the result.
   The judge must FAIL the current mock on the concrete slop (placeholder logo → SHELL brand-mark
   criterion; Title-Case labels → C1; "Loading QR…" → SHELL no-dead-placeholder), and PASS after
   the fixes the loop prescribes. This is the evidence the hardened feeds change consumer output.
4. A `CHANGELOG.md` entry + `package.json` MINOR bump (new feeds/pattern = new API surface),
   PR ref filled once open (per the repo's changelog gate).

## 7. Risks & mitigations

- **Seed misparse from the plugin** → `sync-skills.mjs import` writes a reviewable diff into the
  committed store; a maintainer eyeballs it before merge. It runs once, not on every build, so a
  parser edge case can't silently corrupt CI.
- **Two numbering systems** (judge `C1..Cn` vs build `UXW-1`/`§n`) → the gate validates `C\d+`
  refs strictly against the store criteria; other refs warn-only, so the pattern's existing
  mixed refs don't hard-fail the build.
- **Store diverges from the plugin during Phase 1** → acceptable and expected: the DS is becoming
  the owner. The seed-freshness warning (§4.5.4) is the only nudge, and it disappears at Phase 2.
- **generate.mjs is large (~105 KB)** → add `renderAntiSlop` + the store loader as a focused,
  self-contained block near the other feed renderers; no rewrite of existing renderers.
- **Shared worktree WIP** → stage only the files this work adds/changes, by path; never `git add -A`.

## 8. Open questions (resolved)

- *Which surface first?* ux-writing + app-shell (§5).
- *Read the plugin live or own a store?* Own a committed store (`anti-slop/criteria.json`); seed it
  once from the plugin via `sync-skills.mjs import`, then edit it here (§4.1, §9).
- *Fail or warn on seed lag?* Warn, Phase 1 only; hard-fail only on unresolved criterion refs and
  un-regenerated feeds (§4.5).

## 9. Phasing & ownership transfer

The plugin is a launch ramp, not a tether. Two phases, each independently shippable:

**Phase 1 — Inherit & prove (this slice).** Seed `anti-slop/criteria.json` from the aha-design
plugin for `ux-writing` (via `sync-skills.mjs import`); author the `app-shell` surface + pattern
natively; build the entrypoint feed, `llms.txt` step-0, and the consistency gate; prove the loop
changes the consumer mock (§6). Surfaces carry `origin: "seeded" | "authored"`; the seed-freshness
warning is active. Deliverable: the DS *emits* the official anti-slop loop, still crediting the
plugin as source.

**Phase 2 — Own & decouple.** Fan the seed-import across the remaining surfaces (canvas, audience,
settings, overlays, feedback, status-badges), review each diff, then flip every surface to
`origin: "authored"`: delete `sync-skills.mjs` + the seed-freshness check, keep `skillRef` only as
historical provenance. From here the DS is the **single source of truth** — an anti-slop rule
changes by editing this repo, CI needs no plugin, and the aha-design plugin (if it survives) can be
re-pointed to *consume* the DS feeds instead of defining them. Deliverable: the DS is the single
official AhaSlides anti-slop tool, plugin-independent.

*Boundary between phases:* Phase 1 must not hard-depend on the plugin at build/CI time (the seed is
already committed), so Phase 2 is a *removal*, not a migration — nothing consuming the feeds changes
when the plugin coupling is cut.
