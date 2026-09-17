# AhaSlides Design Language — the direction

> **DRAFT — derived, not invented.** Grounded in what this repo already ships (the canonical tokens
> `tokens.canonical.json` and the `opinion` field of `contracts/*.json`) **and** in the authoritative
> `aha-design` house-style skills (v1.78.0). Read `PRINCIPLES.md` for the mission (reuse-not-rewrite)
> and `TOKENS.canonical.md` for the values; this file names the **voice** those values add up to — the
> holistic layer the per-component gates can't see because it only exists in composition.

## Why this file exists

The gates (`standards.mjs`, `qa.mjs`) prove every **atom** is correct — right token, radius, motion.
But "does this whole screen feel like AhaSlides?" is a **composition** property, and nothing captured
it. An agent can assemble 100% on-token components into a screen that still reads wrong. Those are
*language* defects, not component defects. This file is the source of truth for that layer.

---

## First: there are TWO worlds, and they do not share a look

The single biggest thing to internalise. AhaSlides design language is **surface-split**. Applying the
wrong world's rules is the #1 way "correct components" still look wrong.

| | **Product UI** (the operator's world) | **Canvas / Audience** (the event's world) |
|---|---|---|
| **What** | editor, dashboard, settings, admin, billing, docs | the projected/cast slide + the participant's phone |
| **Palette** | fixed: violet `#6A1EBB` on white, warm-gray ink | **none fixed — read from the deck theme at runtime (`xprops`)** |
| **Background** | white/near-white, no gradient fills | **light, dark, OR a photo** — the frame is *transparent* |
| **Ink** | fixed `#1A1A1A` scale | **derived from the fill by luminance** (`readableInkOn(fill)`) |
| **Type** | Plus Jakarta 400/600, fixed px scale | legible-from-the-back: 16px floor, no `vh/vw` fonts |
| **Feel** | calm, quiet, gets out of the way | high-contrast, bold, readable across a room |

> The rest of this file is: **cross-cutting laws** (both worlds), then **Product-UI language**, then
> **Canvas/Audience language**. When they seem to conflict (white vs theme-driven), it's not a
> conflict — it's two worlds.

---

## Cross-cutting laws (both worlds, non-negotiable)

### L1 — Reuse the canonical primitive; a fresh-but-correct rewrite is still a defect
The meta-law behind the whole DS. Reach for the shipped component/token/icon; a re-derived version
fragments the system and silently drops house conventions even when it "looks right."
*Source: `PRINCIPLES.md`; aha-design-shared-components; aha-design-component-standard.*

### L2 — Accessibility is a law, not a finish-pass
- **Meaning is never carried by colour alone** — pair every semantic colour with a glyph, shape, or
  text label, so it survives colour-blindness and greyscale. (This is *why* principle P3 exists.)
- **Icon-only controls carry an accessible name** (`aria-label`, + tooltip when the glyph isn't
  self-evident); decorative icons are `aria-hidden`.
- **Roles and live state are declared** — progress → `role="progressbar"` + `aria-valuenow/min/max`;
  status → `role="status"`; field errors and live regions carry the right role/aria and stay mounted.
- **Contrast has a floor: WCAG AA** — 4.5:1 body text, 3:1 large text / meaningful shapes.
*Source: aha-design-icons; aha-design-shared-components §4; aha-design-canvas §3.*

### L3 — Motion animates, never snaps — and never carries meaning
Every interactive state transitions via the shared `--aha-motion-*` durations + `--aha-ease-*` curves
(ease-*out*, no elastic overshoot). It must run on a **persistent node** (toggle an attribute, don't
rebuild the subtree). Motion is polish, not signal: never *depend* on it to convey state, always
respect `prefers-reduced-motion`, and keep it at 60fps.
*Source: `PRINCIPLES.md`; aha-design-canvas §3.*

---

## Product-UI language — "calm, confident, quiet"

The operator's world. A violet accent on near-white; hierarchy from space; one clear action; words
and colour that mean exactly one thing. The UI gets out of the way so the content is the loudest thing.

### The material
- **Accent:** one violet — `--aha-color-primary` `#6A1EBB`, *rationed* (primary action, current
  nav/tab, links, active state). When everything is purple, nothing is.
- **Ground:** white (`--aha-bg-base`/`-container` `#FFFFFF`); app canvas `--aha-bg-layout` `#FFFFFF`.
  **No gradients on backgrounds/fills** (border-only AI-affordance is the sole exception).
- **Ink:** warm, **solid** gray — `#1A1A1A` / `#4A4A4A` / `#8A8A8A`. Never alpha-of-a-colour (it
  vanishes on tint).
- **Type:** Plus Jakarta Sans, **weights 400/600 only**; fixed size scale
  (12·14·16·18·20·24·32·40·48…). No in-between sizes, no medium weight.
- **Geometry:** radius from **4/6/8/12/16** (default 8, cards 12); spacing on the 4-based scale.

### The principles

**P1 — One loud thing per view.** The most important action is `primary`; everything else steps down,
recursively. *button "one per screen"; form "one primary submit"; screen-heading "one primary action";
empty "one action — a nudge, not a menu".* **Tell:** two purple buttons competing → one is wrong.

**P2 — Hierarchy is space, not lines or boxes.** Group with whitespace first; a border/container is a
last resort; a box-in-a-box is a defect. *settings-list "hierarchy is spacing, never lines or boxes"
(16 sibling / 32 group); option-row "never a box-in-a-box"; divider "whitespace before a rule".*
**Tell:** nested cards; a bordered field inside a bordered row.

**P3 — Colour means one thing; reserve it.** Semantic colour is a signal, never decoration, and never
the *sole* signal (see L2). *tag "reserve success/warning/error for real states"; alert "over-using
red trains people to ignore it".* **Tell:** a red chip that isn't an error.

**P4 — Words are quiet, exact, and consistent.**
- **Sentence case, name the thing:** noun phrases for things, verbs for actions; product nouns keep
  their form (Q&A, Word cloud). *card "'Live results', not 'LIVE RESULTS'"; modal "'Delete slide', not
  'OK'"; settings-list "noun phrase, no leading verb".*
- **One canonical label everywhere:** the same action is *not* "View Report" / "View report" / "view
  report" in three places — that's a bug regardless of which is nicer; pick one, incl. the analytics
  label. *aha-design-ux-writing #1 (Consistent).*
- **Failure/empty copy has an anatomy:** OUTCOME + CAUSE (when it helps) + NEXT + ACTION. Never
  dead-end (an outcome with no next step); ban "Something went wrong / Oops / Failed"; be blameless
  (no raw codes as the headline); an **empty state is not an error**. *aha-design-ux-writing.*

**P5 — Guide, don't interrogate.** Pre-fill the recommended value; make the wrong value un-pickable
rather than validating after; disable at the limit instead of erroring. *radio/select "pre-select the
default"; datepicker "constrain with disabledDate"; option-row "delete disables at minimum".*

**P6 — Quiet until needed (progressive disclosure).** Chrome stays out of the way until relevant:
counters appear on focus; explanation is a `?` tooltip or nothing; panels stay shallow; one level of
flyout. *counted-input "never a permanent counter"; info-box "callouts rare"; collapse "keep shallow";
dropdown "deeper nesting is a menu smell".*

**P7 — Use the right instrument, at the right weight.**
- **Component:** each contract's `whenToUse` (Input vs Select; Tag vs Badge vs Status pill; a Tag is a
  label, not a control).
- **Surface, by weight:** a blocking decision → **modal**; a longer edit/detail → **drawer**; a small
  anchored hint → **popover**; workspace/account scope → a **page**; a transient confirmation →
  **toast**. Wrong-weight placement is a defect. *aha-design-overlays §1; aha-design-settings §8.*

**P8 — Feedback is transient and honest about where it lives.** A toast confirms ("Copied", past
tense, one line, bottom-right, ~3s, `role="status"`) — it is **not** for errors the user must act on,
validation, or destructive confirms. **A required/actionable message never lives only in a thing that
auto-dismisses** — surface failures **inline where the user acted** so they can retry.
*aha-design-feedback §1/§5; aha-design-overlays §7.*

**P9 — Destructive actions are set apart, confirmed, and danger-on-the-button.**
- Irreversible settings live **last**, in a danger zone separated by the largest gap.
- Danger tone lives on the **confirm button**, never on the label/title (a red label reads as an error
  state). *aha-design-settings §7; aha-design-overlays §5.*
- A destructive overlay **does not dismiss on outside/mask click** — Esc + X only — and its async
  action is **busy-guarded, awaited, and stays open on failure** (only success closes). State resets
  between opens (`destroyOnHidden`). *aha-design-overlays §2/§3/§6.*

**P10 — Gate gracefully.** A plan-locked feature stays **visible** in a distinct locked state (crown
badge), never hidden; every upsell routes through the one shared Paywall with a **single** Upgrade CTA.
*aha-design-paywall §1/§2; aha-design-settings §6.*

**P11 — Match every state and every sub-part.** A component is more than its outer box (a modal =
header + body + footer + close). Reproduce **every** interaction state (rest/hover/focus/active/
disabled) on the **same property** the standard uses (tag active = outline, radio checked = the tick,
toggle on = fill — not always the background). Control heights/paddings/icon sizes are the measured
values, not eyeballed per screen. *aha-design-component-standard; aha-design-icons.*

---

## Canvas / Audience language — "legible from the back of the room"

The event's world: the slide on the projector and on the participant's phone. Bold, high-contrast,
theme-driven. **The product-UI material above does NOT apply here** — do not reach for the brand violet
or a white stage.

### The material
- **No fixed palette.** Background, text colour, font, and the accent palette all read from the deck at
  runtime (`xprops.slide.*` / `xprops.presentation*`). Hard-coding any hex or font is a defect.
- **The frame is transparent.** A framed slide must not paint its own background — the deck theme
  (light, dark, or a photo) shows through. Painting a solid "stage" fill is a bug (AHAM-617).
- **Ink is derived, not constant.** Compute a readable ink from the fill by luminance
  (`readableInkOn(fill)` / `isLightColour`) so text stays legible on any theme.
- **Type is sized for distance.** A canvas scale (≈16/18/24/48/72 logical px) with a hard **16px
  floor**, primary content 18px+. **Never a `vh`/`vw`/`clamp()` font-size** (they resolve wrong under
  the stage transform). Audience mirrors native mobile sizes (16px inputs to dodge iOS zoom).

### The principles

**C1 — Colour comes from the deck; verify contrast against the *composited* background.** Read colour
from `xprops`; then check it against the real background (`baseColour` blended with any
`backgroundImage`) to a **WCAG AA floor**, adding a scrim over busy photos. Contrast is derived and
verified, never assumed.

**C2 — Never pair two palette entries as fill-and-text.** The accent palette is a set of brand *marks*
(bar, dot, ring), not a background/foreground pair — palette-text-on-palette-fill has no guaranteed
contrast and vanishes on a same-hue deck (AHAM-642).

**C3 — Semantic/state colour lives on an indicator, never on the chart.** Chart fills pull the deck
palette so the chart feels native to the deck; right/wrong/success lives only on a separate ✓/✗ badge
or border. Painting a "correct" bar green is the #1 canvas mistake.

**C4 — Meaning is never colour alone — and the audience is far away and may be colour-blind.** Pair
every colour signal with a shape/label; a ✓/✗ glyph is itself the verdict, never decoration. (L2,
intensified for distance.)

**C5 — The host owns the chrome; the slide renders only its own data.** No faux `ahaslides.com`
watermark, logo, or "Powered by"; the host owns title, countdown, "Time's up", "Submitted", and the
disconnected/closed edge states. Every on-canvas element must carry a real datum.

**C6 — Text is for reading, not decoration.** A real word is normal running text — no
stacked/rotated/over-tracked letters that trade legibility for a flourish that fails from the back.

**C7 — Motion survives the constraints.** 60fps under the stage transform (animate only
`transform`/`opacity`; drop `backdrop-filter`/`box-shadow` while moving); respect
`prefers-reduced-motion`; keep transforms inside the reported/clipped iframe box.

---

## The smell test

Run on a whole **screen**, not a component. A "no" is a language defect even when every atom passes.

**Any surface (cross-cutting):**
- [ ] Is every semantic colour paired with a **non-colour cue** (glyph/text/shape)?
- [ ] Do icon-only controls have an **accessible name**; is contrast at least **AA**?
- [ ] Is every component the **reused primitive**, not a fresh re-roll?
- [ ] Does interactive state **animate** (persistent node), degrade under reduced-motion, and never *depend* on motion for meaning?

**If Product UI:**
- [ ] Exactly **one** primary (purple) action in the main region?
- [ ] Groups separated by **space** — no box-in-a-box, no divider whitespace could replace?
- [ ] Labels **sentence case**, noun/verb correct, **one canonical form**; failures name the object and offer a **next step** (empty ≠ error)?
- [ ] Inputs **pre-filled** and constraining rather than validating-after; secondary chrome hidden until needed?
- [ ] Right component **and right surface-weight** (page/modal/drawer/popover/toast)?
- [ ] Destructive action **set apart + confirmed**, danger on the **button** not the label, overlay won't dismiss on stray click?
- [ ] Backgrounds **white/near-white**, no gradient fills; radii **4/6/8/12/16**; type **400/600** on the fixed scale?

**If Canvas / Audience:**
- [ ] Colour/font read from the **deck theme** (`xprops`), nothing hard-coded; frame **transparent**?
- [ ] Ink **derived from the fill**; contrast verified against the **composited** background (scrim over photos)?
- [ ] No palette-on-palette text; state colour on an **indicator**, not the chart?
- [ ] Type **≥16px**, no `vh/vw` fonts; text is running words, not decoration?
- [ ] **No faux brand chrome** — every element carries real data; host owns title/countdown/edge states?

---

## How to make this stick (not just a doc)

This file is the *description*. To hold direction, pair it with the two enforcement moves:

1. **Ship composed scaffolds** (a product-UI settings/dashboard/list-detail template; a canvas
   slide-frame template) as real reusable artifacts — agents *fill* a layout instead of inventing one.
2. **A page-level judge** — the smell test above run as a critique pass against golden full-screen
   references, per world, the way the `*-judge` skills already work per component.

---

*Maintenance: hand-authored charter (like `PRINCIPLES.md`), but every claim traces to a generated
source or a named `aha-design` skill. Product-UI claims cite `contracts/*.json`; house-law and
canvas/audience claims cite the owning skill. When a skill or contract changes the language, update the
matching principle here.*
