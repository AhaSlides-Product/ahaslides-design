# Anti-slop consumer-behaviour proof (Task 8 evidence)

**Claim under test:** the hardened DS feeds change consumer output — a feed-only agent that
connects to the DS now receives a *binary self-judge* it can run before shipping, catching slop the
old feeds (component APIs only) never surfaced.

**Method:** take the existing consumer mock (`/private/tmp/ds-consumer-test-85740/`, built by
consuming the DS via CDN *before* this change) and run the shipped `app-shell` + `ux-writing`
criteria — straight from `dist/anti-slop.agent.json` — against its Dashboard surface
(`std-dash.png` + `presenter.html`). Binary PASS/FAIL per criterion, evidence per line.

## Verdict — Dashboard surface, BEFORE the loop

| Criterion | Verdict | Evidence |
|---|---|---|
| app-shell **C1** — Real brand identity, never a placeholder | **FAIL** | Top bar renders a flat purple **"A" letter-tile**; the rail mark is a generic glyph. Neither is the real AhaSlides flower/pinwheel mark + wordmark. |
| app-shell **C2** — No dead placeholder as a final state | PASS (this screen) | No "Loading…"/spinner on the dashboard. (The "Loading QR…" C2 failure is on the Present-mode lobby, a different surface.) Flat solid-colour template covers are a weak-hierarchy smell, not a dead placeholder. |
| app-shell **C3** — Deliberate hierarchy, one primary per region | **WEAK/FAIL** | A filled-purple **"Present" button repeats on every table row**, plus uniform equal-weight flat template cards — the one-primary-per-region intent is diluted; reserve the filled primary for "New presentation" and demote per-row actions. |
| app-shell **C4** — Shell chrome tokenised + reuses DS components | **FAIL** | Per the consumer's own `NOTES-presenter.md` self-audit, the nav rail is a hand-rolled `<aside>` + `<button class="nav-item">` (the DS ships no shell/nav leaf). C4 flags exactly this. |
| app-shell **C5** — Active nav state animates on a persistent node | PASS (tentative) | `NOTES-presenter.md` claims nav rows animate via motion tokens on a persistent node; not verifiable from a static render. |
| ux-writing **C1** — Sentence case across product UI | PASS | Labels are genuinely sentence-case ("New presentation", "My files", "Access code", "Recently edited"). The Title-Case slop hypothesised in the plan is not present in this render — reported honestly. |

**Result:** 2 clear FAILs (C1, C4) + 1 weak (C3) on concrete, nameable evidence.

## Prescribed fixes (what the loop tells the consumer to do)

- **C1:** replace the "A" tile with the real AhaSlides brand mark — an `<aha-icon>` brand glyph /
  the shipped logo — plus the wordmark.
- **C4:** fill nav-item glyphs with `<aha-icon>` and the rail CTA with `<aha-button>` (the mock
  already does the CTA); the residual hand-rolled `<button class="nav-item">` is the DS **shell-leaf
  gap** the `app-shell` guideline documents — a backlog item to close in the DS, not to hand-roll
  privately.
- **C3:** demote per-row "Present" to a secondary/tertiary or icon-button; keep one filled-purple
  primary per region.

## Why this proves the claim

The *old* feeds shipped component APIs + a component index — nothing told a connecting agent to
verify a real brand mark, avoid hand-rolled nav, or reserve one primary per region, and there was
no binary gate to self-run. The *new* `anti-slop.agent.json` + `anti-slop.md` carry those exact
criteria and the build→judge→fix loop, and `llms.txt` points the agent at them first. Running the
shipped judge against the pre-change mock catches the slop the old feeds let through — which is the
behaviour change the CTO goal asks for.

> Honesty note: this is a *before* judgement of an existing artifact, not a re-rendered *after*. The
> "after" is the consumer's job once they run the loop; the evidence here is that the shipped judge
> flags real, specific slop that the previous feeds did not.
