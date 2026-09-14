---
name: aha-design-language-judge
description: "The verdict counterpart to the AhaSlides design-language charter ([[DESIGN-LANGUAGE]]) — a PAGE / SCREEN-level judge, not a component one. Invoke whenever you review, audit, or self-check a whole composed AhaSlides screen (a PR that adds/changes a page, view, dashboard, settings panel, slide/canvas, or audience view), or to close a build→judge→fix loop after composing UI. It FIRST routes the screen to its world (Product UI vs Canvas/Audience — applying the wrong world's rules is the #1 defect), then emits a binary PASS / FAIL per criterion (no partial credit) across the cross-cutting laws + that world's principles. Complements the per-component *-judge skills (which grade a single atom) by grading the composition between atoms — the layer those can't see. Trigger on 'review this screen', 'does this page feel like AhaSlides', 'audit this composition', 'is this on-language', 'judge this slide/canvas', 'PR review of a page/view'. Not for first-time building or single-atom checks — use [[DESIGN-LANGUAGE]] to build and the component *-judge skills for atoms."
---

# Judging an AhaSlides composed screen against the design language

The **judgment counterpart** to the [[DESIGN-LANGUAGE]] charter (which guides *composing* a
screen). Reach for it when reviewing a finished screen — a PR diff, a code review, or a
post-build self-check — to close a **build → judge → fix** loop. It grades the **composition
between components**, the layer the per-component `*-judge` skills can't see. Don't reach for it
to grade a single atom (use that atom's `*-judge`) or while first composing (use [[DESIGN-LANGUAGE]]).

> **The standard.** Every criterion below is the verdict form of a principle in
> [[DESIGN-LANGUAGE]]. Read the exact principle there; don't grade from memory. Product-UI
> criteria trace to `contracts/*.json`; cross-cutting and Canvas/Audience criteria trace to the
> named `aha-design` skill.

## How to use

1. **Route the screen (J0) — do this first.** Decide the world before grading anything else.
   Applying the wrong world's material is an automatic FAIL of the material criterion and usually
   several others. A screen that legitimately contains both (e.g. an editor with a live canvas
   preview) is graded **per region** — judge the operator chrome as Product UI and the preview as
   Canvas.
2. Grade **X1–X3** (cross-cutting, always) plus **only the routed world's** criteria
   (PU\* *or* CV\*). Don't grade a Product-UI screen against Canvas rules or vice-versa.
3. For each criterion, find the evidence in the code/render, decide **PASS** or **FAIL**, and
   capture one line of evidence (`file:line` where possible).
4. Emit the verdict using the exact template at the bottom — same shape every time.

**Why binary, no partial credit.** A screen either honours the principle or it doesn't —
"mostly calm" is a polite FAIL that lets drift accumulate. Binary keeps the judge consistent
across reviewers and runs.

**Burden of proof is on PASS.** If you can't point to evidence that a principle holds, mark FAIL
and say why — don't assume an unlabelled choice is "probably fine."

---

## J0. Surface routing → PRODUCT UI | CANVAS/AUDIENCE | MIXED (per-region)

**Rule.** Name the world before grading. **Product UI** = the operator's tools (editor,
dashboard, settings, admin, billing, docs). **Canvas/Audience** = the projected/cast slide and
the participant's phone. The two do **not** share a look (fixed violet-on-white vs. theme-driven).

**FAIL the whole review (redo routing) when:** a Canvas region is being graded with the
Product-UI material (expecting white bg / brand violet), or a Product-UI region is graded with
Canvas rules. Get this right or every downstream verdict is wrong.

---

## Cross-cutting — apply to BOTH worlds

### X1. Everything is a reused DS primitive → PASS / FAIL
**Rule.** Every element on the screen is the shipped component / token / icon, not a fresh
re-roll (L1). **FAIL when:** a hand-rolled button/table/tile-grid/icon-`<svg>` appears where a DS
primitive exists; a correct-but-bespoke reimplementation counts as FAIL.

### X2. Accessibility is honoured → PASS / FAIL
**Rule (L2).** Meaning is **never colour alone** (every semantic colour paired with glyph/shape/
text); icon-only controls carry an accessible name; live/progress/status carry the right
role + `aria-*`; contrast ≥ **WCAG AA** (4.5:1 text, 3:1 large/shapes). **FAIL when:** any state
is signalled by colour only; a bare icon-button has no `aria-label`; contrast is below AA.

### X3. Motion animates and never carries meaning → PASS / FAIL
**Rule (L3).** Interactive states transition via `--aha-motion-*` + `--aha-ease-*` (ease-out) on a
**persistent node**; `prefers-reduced-motion` respected; meaning never *depends* on motion.
**FAIL when:** a state snaps; a bare-literal duration (`.12s`); the subtree is rebuilt on the
animated state (dead transition); reduced-motion is ignored.

---

## Product-UI criteria — "calm, confident, quiet" (grade only if J0 = Product UI)

### PU1. One loud thing per view → PASS / FAIL
**Rule (P1).** At most **one** primary (violet) action in the main region; the rest step down.
**FAIL when:** two primary buttons compete in one region.

### PU2. Hierarchy is space, not lines or boxes → PASS / FAIL
**Rule (P2).** Groups separated by whitespace; borders/containers are a last resort; no
box-in-a-box. **FAIL when:** nested cards; a bordered field inside a bordered row; a divider doing
a job whitespace could.

### PU3. Colour is reserved and semantic → PASS / FAIL
**Rule (P3).** Semantic colour marks a real state, never decoration. **FAIL when:** a red/green/
amber element that isn't the state it implies; brand violet spent on non-primary chrome.

### PU4. Words are quiet, exact, consistent → PASS / FAIL
**Rule (P4).** Sentence case; nouns for things / verbs for actions; product nouns in canonical
form; **one canonical label** for the same action everywhere; failure/empty copy = OUTCOME + NEXT
(never dead-end; "empty ≠ error"; no "Something went wrong"). **FAIL when:** Title Case / ALL CAPS;
"OK/Submit" where the action has a name; the same action worded differently in two places; an
error with no recovery step.

### PU5. Guide, don't interrogate → PASS / FAIL
**Rule (P5).** Inputs pre-filled with sensible defaults; constrain the wrong value rather than
validating after; disable at limits. **FAIL when:** an empty required field with an obvious
default; an error a constraint could have prevented.

### PU6. Quiet until needed → PASS / FAIL
**Rule (P6).** Progressive disclosure — counters on focus, explanation as `?`/nothing, shallow
panels, one flyout level. **FAIL when:** permanent counters/help on every field; three-deep menus.

### PU7. Right instrument, right surface-weight → PASS / FAIL
**Rule (P7).** Correct component per its `whenToUse`; correct surface by weight — blocking →
modal, longer edit/detail → drawer, small hint → popover, workspace scope → page, transient
confirm → toast. **FAIL when:** a component does a neighbour's job; a decision placed in the
wrong-weight surface.

### PU8. Feedback is transient and honest → PASS / FAIL
**Rule (P8).** Toasts confirm (one line, past tense, bottom-right, ~3s, `role="status"`), never
carry an action the user must take; a **required/actionable message never lives only in something
that auto-dismisses**; failures surface **inline where the user acted**. **FAIL when:** an
actionable error is a disappearing toast; a toast holds a required action.

### PU9. Destructive & gated actions are disciplined → PASS / FAIL
**Rule (P9/P10).** Irreversible actions set apart (danger zone, last), **confirmed**, with danger
tone on the **button** not the label; destructive overlays **don't dismiss on outside/mask click**
(Esc + X only) and are **busy-guarded + stay open on failure**; a plan-locked feature stays
**visible** (crown) with a **single** upgrade CTA. **FAIL when:** a red label/title; one-click
destroy with no confirm; an overlay that closes on stray click or fires-and-forgets; a hidden
locked feature or a second upsell CTA.

### PU10. Material is on-system → PASS / FAIL
**Rule (material).** Backgrounds white/near-white, **no gradient fills**; radius on
**4/6/8/12/16**; type Plus Jakarta **400/600 only** on the fixed size scale; **no
hardcoded hex/px** — bound to `--aha-*`. **FAIL when:** a gradient fill; an off-scale radius; an
in-between font size or any weight other than 400/600 (500 or 700); a raw hex in place of a token.

---

## Canvas / Audience criteria — "legible from the back of the room" (grade only if J0 = Canvas)

### CV1. Colour is theme-driven; the frame is transparent → PASS / FAIL
**Rule (C1 / material).** Background, text colour, font, accent all read from the deck at runtime
(`xprops.*`); the slide frame paints **no** background. **FAIL when:** any hex/font is hardcoded;
the frame paints a solid/white "stage" (AHAM-617).

### CV2. Ink is derived; contrast verified against the composited background → PASS / FAIL
**Rule (C1).** Ink derived from its fill by luminance (`readableInkOn`); contrast checked against
`baseColour` blended with any `backgroundImage` to a **WCAG AA** floor, with a scrim over busy
photos. **FAIL when:** a constant ink colour; contrast assumed rather than verified against the
real background.

### CV3. Palette used as marks, not as fill-and-text; state off the chart → PASS / FAIL
**Rule (C2/C3).** Accent palette entries are marks (bar/dot/ring), never palette-text-on-palette-
fill; chart fills use the deck palette; right/wrong/success lives on a **separate ✓/✗ indicator or
border**, never painted onto the chart. **FAIL when:** palette text on a palette fill (AHAM-642);
a "correct" bar tinted green.

### CV4. Type is sized for distance → PASS / FAIL
**Rule (C4 / material).** A **16px floor**, primary content 18px+; **no `vh`/`vw`/`clamp()`
font-sizes** (they resolve wrong under the stage transform); mobile inputs ≥16px (iOS zoom).
**FAIL when:** sub-16px canvas text; a viewport-unit font size.

### CV5. The host owns the chrome → PASS / FAIL
**Rule (C5).** No faux `ahaslides.com` watermark/logo/"Powered by"; the host owns title,
countdown, "Time's up", "Submitted", disconnected/closed states; every on-canvas element carries a
real datum. **FAIL when:** the slide repaints branding/title chrome or shows meaningless
placeholder chrome.

### CV6. Text reads; motion survives the constraints → PASS / FAIL
**Rule (C6/C7).** Real running words — no stacked/rotated/over-tracked letters; motion holds 60fps
(animate only `transform`/`opacity`; drop `backdrop-filter`/`box-shadow` while moving), respects
reduced-motion, and stays inside the clipped iframe box. **FAIL when:** decorative letter-stacking/
rotation; motion that janks or paints outside the reported frame.

---

## The verdict report (emit exactly this shape)

```
## Design-language verdict — <screen name>

**World (J0):** Product UI | Canvas/Audience | Mixed (region: …)

### Cross-cutting
- X1 Reuse-the-primitive — PASS/FAIL — <evidence>
- X2 Accessibility — PASS/FAIL — <evidence>
- X3 Motion — PASS/FAIL — <evidence>

### <Product-UI | Canvas> principles
- PU1/CV1 … — PASS/FAIL — <evidence>
- …  (grade only the routed world's criteria)

### Verdict
- **<n> PASS / <m> FAIL**
- **Top fixes (ordered):**
  1. <criterion> — <the one change that flips it to PASS>
  2. …
```

**One FAIL = the screen is off-language.** List the fixes in priority order (biggest
language impact first). A screen passes the design language only when every graded criterion is
PASS.
