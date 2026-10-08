# Audience iframe — composition guide

> Distilled from the retired `aha-design-audience` plugin skill, which the DS now owns. This guide holds the full rationale, worked
> BAD/GOOD examples, the `AHAM-xxx` bug references, and the `C1..C34` judge criteria plus
> the pre-ship checklist; this guide is the shippable construction checklist. When the two
> ever disagree, this guide wins. Evals (the binary PASS/FAIL
> verdict) stay in the skill and the DS anti-slop judge (`audience` surface).

The audience iframe is what a participant sees in their own browser after joining via
`app.ahaslides.com/join/<code>` — the phone-side counterpart to the presenter canvas. It
ships no new component: it reuses Button, Checkbox and Icon, paints with the deck palette /
`textColour` / `fontFamily` the host forwards via `window.xprops`, and bundles semantic
state colours from the design-system package because no `--aha-*` vars cross the iframe
boundary. This pattern carries the **conventions** that keep every slide type's audience
view reading as one product.

**On the Developer Platform** (build-less slide types: `presenter.html` / `audience.html` /
`settings.html`) the audience iframe loads the audience entry `lib/audience.js` (one tag, pinned to a release tag: `<script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@__REF__/lib/audience.js"></script>`; it also exports `applyDeck`; `lib/all.js` is the everything option), so the DS elements **are** available
in it: consume `<aha-button>`, `<aha-counted-textarea>`, `<aha-input>`, `<aha-checkbox>`,
`<aha-radio>` and `<aha-tag>` as elements. Never "port 1:1" a component by copying its CSS —
the copy freezes at the version of the day it was built while the page loads a newer DS.
Keep a control custom only where the DS has no element yet, and build it on DS tokens.

## Pick the surface first

A plugin declares **three separate URLs** in its manifest — `canvasUrl`, `editorUrl`,
`audienceUrl` — and each is its own entry page. **Build the `audienceUrl` entry only.** Same
plugin repo, separate entry files; never branch one shared component with
`if (audience) mobile else canvas` — the host loads completely separate documents.

Then pick the mode via `setting.enableFullScreen` in the manifest:

| Surface | Use for |
| --- | --- |
| **Framed** (default) | Most slide types. Host paints the question image, title, description, audio button and countdown progress *above* your iframe; your iframe owns the answer area only. |
| **Full-canvas** (`enableFullScreen: true`) | A slide needing a bespoke header the host chrome can't give — an intro slide, a branded reveal, a fullscreen quote. You render the whole surface, including the title. |

Make the choice **explicit in the manifest**. Mixed mode (framed + your own title)
duplicates the host's title and looks broken.

## How the host talks to the iframe

The iframe runs in its own cross-origin document via the same Zoid model as the canvas,
**but the host forwards a smaller subset** through `window.xprops`.

**Forwarded (the raw materials you paint with):**

| `window.xprops` path | What it is |
| --- | --- |
| `xprops.slide.textColour` | Primary text colour |
| `xprops.presentation.fontFamily` | Deck's font (NAME only — see "Load the deck font") |
| `xprops.presentation.language` | Deck's locale code |
| `xprops.presentationColorPalette` | Accent palette — array of CSS colour strings |
| `xprops.presentationLighterColorPalette` | Lighter-shade palette sibling |
| `xprops.currentUser.presenterLanguage` | Fallback locale |

**NOT forwarded** — don't expect them: `baseColour` (you choose your own background),
`backgroundImage`, any AntD semantic token, any host CSS variable. `--aha-colorSuccess` and
friends **do not exist** inside this iframe.

**Host UI utilities** (host renders them outside the iframe — use them, don't reinvent):
`showToastInfo` / `showToastSuccess` / `showToastError`, `openPluginModal` /
`closePluginModal`, `onSubmitButtonHeightChange(h)`, the `timeLimit` countdown,
`scrollTo(y)` / `getWindowHeight()`, and the **required** `onHeightChange(h)`.

There is **no shared UI kit** injected into the iframe. You build your own input components
with your stack — but **paint them with the palette / `textColour` / `fontFamily` the host
hands you** so they look native to AhaSlides.

## Shape — mobile-first, single column, height-by-content

- **One vertical column.** Question on top, answer area beneath, feedback after. No
  side-by-side panels. **No horizontal scroll at any width** — fit the narrowest phone (~320px).
- **Fluid width.** Host enforces a max-width (~710–840px framed); be fluid up to the cap,
  don't set or fight it.
- **Height by content.** Report via `onHeightChange(h)` on every size change so the host
  shrink-wraps the iframe. Use `min-height` for affordance and let content drive total
  height — **no fixed pixel heights** that assume a device. Wrong reports cause a scrollbar
  inside the iframe or empty padding around it.
- **Cold-start.** Guard colour-bearing UI behind a `themeReady` check
  (`!!textColour && palette.length > 0`) and render a neutral `color-mix` skeleton while
  `window.xprops` loads — never flash hex-fallback colours that then switch to the real
  palette. The only sanctioned literals are `#FFFFFF` for the surface and `'Plus Jakarta Sans'`
  for the font fallback.

**Native type scale — match it exactly (not "at least"):**

| Role | Value |
| --- | --- |
| Body / option / chip / button label | `16px` — `--aha-size-l` |
| Secondary metadata (vote count, percentage, counter) | `14px` — `--aha-size-default` |
| Help text / captions | `12px` — `--aha-size-sm` |
| Question / header | `22px` bold (host-painted in framed mode) |
| Form input (`<input>` / `<textarea>`) | `16px` — the one exception, dodges iOS auto-zoom-on-focus |
| Body line-height | `1.5` |

Spacing follows a multiple-of-8 rhythm (8 / 16 / 24).

**Token trap:** `--aha-size-sm` is **12px**, not the 14px that Tailwind calls `text-sm`. Map by
pixel value, not by name: primary copy is `--aha-size-l` (16px), and a "text-sm 14px" note means
`--aha-size-default`. Primary copy bound to `--aha-size-sm` is the classic miss (C19).

## Transforms and bounded scrolling stay inside the reported box

`onHeightChange` reports your **resting** layout box; the host paints nothing outside it.

- **A transform that paints outside the box** (swipe tilt, drag ghost, hover pop, settle
  bounce) gets clipped. Budget a little headroom and keep the transform small enough that
  its most-extreme frame's bounding box still fits the reported height. Prefer a cheap cap
  (an 8° tilt over 12°) over a bigger transform that forces a taller reported box.
- **A card that scrolls internally.** Default is no inner scroll — let the host shrink-wrap.
  The **one sanctioned exception** is a *bounded* card (a fixed-size swipe / flash / reveal
  card that must stay one screen): it MAY scroll its own overflow with **no page-level
  scroll**, and MUST show a **fade cue** on the still-hidden edge(s), dropped when it all
  fits. Fade with a CSS `mask-image` (fades to true transparency, works on any deck
  background) — **never a coloured gradient overlay** (there's no `baseColour` to match, so
  a coloured fade shows as a grey smear).

## Swipe / drag gestures must stay smooth (60 fps)

- **Drop expensive continuous effects while moving.** A `backdrop-filter: blur()`, a large
  `box-shadow`, or any `filter` on the dragged element is re-sampled every frame — the single
  biggest cause of a janky swipe. Track a `moving` flag (`dragging || flinging || springing-back`)
  and null the effect out while it's true; restore on settle. Animate **only compositor
  properties** — `transform` and `opacity`, never `width` / `height` / `top` / `left` /
  `margin`. Set `will-change: transform`.
- **Commit on velocity, not distance alone.** Track pointer velocity (px/ms across
  `pointermove`s) and commit when the gesture passes **either** the distance threshold **or**
  a flick-velocity threshold — so a fast flick flings instead of springing back.

## Theme — palette for chart, bundle semantic for state

The same two-jobs split as the canvas, with less theme forwarded.

- **Job 1 — chart / visualization layer.** Bar fills, ring segments, plot dots, selection
  highlights carry magnitude/proportion — pull from `xprops.presentationColorPalette` (or
  `presentationLighterColorPalette`); pick the shade that contrasts your chosen background.
- **Job 2 — state indicator layer.** Submitted ✓, error ✗, correct / incorrect, warning,
  info must **not depend on the deck palette** and must **not** come from `--aha-*` vars.
  Bundle the function tokens into the plugin build from the design-system package, so the
  audience sees the same success-green / error-red as the presenter canvas.

| Token | Where it goes |
| --- | --- |
| `colorSuccess` | ✓ icon, "submitted" badge, correct-answer indicator |
| `colorError` | ✗ icon, validation error, incorrect-answer indicator, destructive |
| `colorWarning` | caution, "are you sure?" prompt body |
| `colorInfo` | informational note |

- **Use the FUNCTION token, not a lookalike accent.** `colorSuccess` (#16C49A), `colorError`
  (#F5222D), `colorWarning`, `colorInfo` are the semantic functions. A bright brand accent
  that merely *looks* green/red (Bright Teal `#20E8B5` as a tick) is wrong and fails contrast
  (~1.58:1 on white). Even correct `colorSuccess` on white is only ~2.23:1 — below 3:1 — so
  put a light success/error glyph on a **bounded fill** (a filled badge with a white ✓), not
  straight onto the light surface.
- **`textColour` is for text, not borders.** Bind body text to `xprops.slide.textColour`.
  Derive hairlines from `color-mix(in srgb, currentColor 10%, transparent)`, never from
  `textColour` directly.
- **Choose your own background.** No `baseColour` is forwarded — default to white / very
  light (works on light and dark decks), or derive a surface from the luminance of
  `textColour`.
- **Load the deck font, don't just name it.** `fontFamily` is only the font's NAME; this
  cross-origin iframe does not inherit the host's `@font-face`, so naming the family without
  loading the face renders all text in the browser serif fallback (the AHAM-642 bug). Call
  `useDeckFont(fontFamily)` in **this** iframe — its own call, separate from the canvas —
  with `'Plus Jakarta Sans'` as the fallback.

**Selection controls track the deck** (AHAM-701):

- **One accent per deck.** `presentationColorPalette[0]` is published as `--aha-color-primary`
  on the iframe's `:root` (with `--aha-button-primary-bg-hover` / `-bg-press` / `-text`) — the
  same value and the same code as the presenter canvas (see the `canvas` guide). A checked
  **Radio / Checkbox**, a selected chip and the submit fill all read it, never Ant's fixed
  `colorPrimary` purple and never a 'toward-ink' selection variant. A local alias such as
  `--aha-control-accent` must be set from that same value. Only the label ink is picked by
  contrast (white or `#1A1A1A`, never `#000`), and a semantic colour is never a data colour (C31).
  A purple disc on a green deck is the FAIL.
- The **selected-answer ring / edge** takes the deck's **`textColour`** (not a near-black or
  a deepened accent) so it stays visible on a dark deck; the accent still marks the pick on
  the control and in label weight — the ring's only job is to stay visible.
- **Publishing the accent var is not optional.** Something in the render tree must actually
  **set** `--aha-control-accent` (inline `style` / `:style` on the control or an ancestor,
  from `presentationColorPalette[0]`). Referencing the var with only a purple fallback —
  never publishing it — ships purple on every deck.

**Sliders:**

- A slider / progress track is filled with the deck ink at 10% (the same value as every track and
  panel hairline) and a filled part carries that same 1px 10% hairline, so a coloured fill doesn't sink
  into a same-hue deck. Tracks and panel hairlines are the only 10% edges: a tappable chip, the dashed image drop area and the radio / checkbox control of an answer row take the ink at 20%.
- A horizontal slider's rail **lines up** with its min/max end labels — zero out Ant's
  default slider margin (~`margin: 10px 6px`), then either run the rail flush under the captions or
  inset it by the same intended amount on both sides (`<aha-scale-slider>` insets 16px); never an
  uneven leftover component margin.

**Section rhythm:** distinct labelled sections sit **≥24px apart** — wrap each section (its
label + its control) in its own tight `flex flex-col gap-2`, and space whole sections on the
outer column with `gap-6`. The 8px gap is for rows INSIDE one group; don't stand a per-label
`mt-2` / `mt-3` in for a real section break.

### Three tells that read as "AI-generated" — avoid all three

- **No pastel wash under same-hue ink.** Don't pair a pastel/tinted background with icon +
  text in the *same* hue. Bind ink to `textColour` (which tracks and contrasts), or pair a
  tint with genuinely high-contrast ink and clear hierarchy — not one hue at two brightnesses.
- **Corner radius on the DS scale.** Cards and panels **12px** (`--aha-radius-lg`, the DS card);
  option tiles, inputs and the submit button **8px**; nothing rectangular above 12px — including
  the OUTER wrapper, not just the tiles inside. 16 / 24px read toy-like. Intentionally circular elements (pills, chips, badges, avatars, dots,
  progress tracks) stay fully rounded.
- **No extra-bold weight.** Text uses weight **400 or 600 only** (the standard submit button is
  600). No 700 / 800 / 900.

**Borders are hairlines** (C32): a bounded white card **1px `--aha-border`** (#E3E3E3); a deck-owned
surface (field, track, panel) a **1px** `color-mix(in srgb, currentColor 10%, transparent)` on every deck, light or dark. The 20% controls: a tappable chip, the dashed image drop area and the radio / checkbox control of an answer row take the ink at 20% (the dashed image drop area is the one 2px edge, dashed).
No other 2px outline: never at heavy ink (55% `textColour` on a chip is the miss).

**One dark ink** (C33): `--aha-text-default` **#1A1A1A** on every surface — never `#1A1A2E`
(`--aha-brand-3` / `--aha-indigo-100`), never `#000` for the dark label on the accent.

## Text economy — say it once, in plain body text

- **Don't label a control with text the control already states.** Two labelled True / False
  buttons don't need a "True or False" header or an "OR" divider — the buttons *are* the
  prompt. Delete any label, header or divider that merely repeats an adjacent control; a word
  earns its place only if it says something the controls don't.
- **Micro-instructions are the shortest possible phrase, in the DEFAULT body.** A hint like
  "Tap or swipe to answer" is one line of **16px, regular (400), the deck's `textColour`** —
  never a full-width pill, tinted card, shadowed chip or button-shaped box, and never semibold
  or muted-grey. Use **ONE shared instruction component** across every slide so the line never
  drifts in size / weight / colour between slides.
- **Primary copy stays at 16px (`--aha-size-l`), never `text-sm`.** 14px (`--aha-size-default`)
  is legitimate ONLY on secondary metadata beside a label — a vote-count chip, a percentage, a
  counter — never on the answer-option label, a chip label or the question restatement. And
  never `--aha-size-sm` for any of them: that token is 12px.

## Plugin self-renders submitted / waiting / correct-incorrect

For plugins the host shows **no** generic "Waiting…" screen — your iframe stays mounted and
**you render** every post-submission state:

- **Just submitted** — call `xprops.showToastSuccess(t('audience.submitted'))` for the
  announcement (host paints a consistent toast outside the iframe); **don't** re-implement a
  "Submitted" banner inside the iframe. After the toast, transition to results bars / quiz
  feedback / waiting.
- **Waiting for the next slide** — a calm holding state on the same surface; gentle motion if
  any, no noisy spinners.
- **Quiz correct / incorrect** — pair the semantic colour with a non-colour cue (✓ / ✗ plus the
  answer text). Bar fills stay in palette colour; the indicator carries the state.
- **Pre-submission empty state** — show the input affordance with placeholder copy ("Tap an
  option to vote"), never a giant "0" or empty chart (reads as broken).

Transitions must be **smooth** — re-report height via `onHeightChange` when a state change
legitimately changes content height, but avoid layout jumps >16px between adjacent states.

**Every interactive state animates** (C34): hover, selected, pressed and expanded transition with
`--aha-motion-*` durations and `--aha-ease-*` curves on a **persistent** node. Keep the option
nodes and toggle a class; rebuilding the list with `innerHTML =` on every tap gives each node a
fresh start, so the transition never fires. Honour `prefers-reduced-motion`.

## The standard submit button — one spec

Every built-in audience slide type uses ONE submit-button look (the host's `aha-antd-button`
in the **primary-alt** variant). On the **Developer Platform** use the DS element the iframe
already loads — `<aha-button variant="primary" block>`, coloured by `--aha-color-primary` set to
the deck accent. A **built** plugin without the DS package cannot import the host component, so
it rebuilds the same spec:

**Visual spec**

- **Full-width** block, fills the answer area.
- **Height** ~44–48px (the touch-target range).
- **Soft rounded corners** 8px (`--aha-radius-default`) — no sharp 0px, no pill unless that's the deck style.
- **Background** = the deck's first palette colour `xprops.presentationColorPalette[0]` (or a
  `presentationLighterColorPalette` shade). **Never hard-code a brand colour, never leave a bare
  `type="primary"` on the fixed purple** (AHAM-701).
- **Text** = a readable ink chosen against the fill by luminance — white on a saturated/dark
  shade, dark ink on a light shade. **Don't hard-code white** (it disappears on a light shade).
  Semi-bold (600).
- **Edge** = a hairline at ~10% of `textColour`, so a purple button on a purple deck holds its shape.
- **Position** = end of the answer-area block, ~16px below (host may paint a sticky "Scroll to
  submit" pill above when you opt in).

**Interaction states — the part that breaks if skipped**

1. **Invalid input** → **disabled as a distinct NEUTRAL GREY surface** (grey fill + grey text),
   NOT the coloured fill at reduced opacity (a dimmed purple still reads enabled). No pointer
   cursor, `aria-disabled="true"`. Block submit until the user has picked / typed.
2. **Submitting** → an **inline spinner inside** the button — it does not disappear, change
   height, or move (no layout jump); lock it to prevent double-submit.
3. **Host `stopSubmission`** → a **locked state**: lock icon + i18n "submission closed" label
   replacing the submit label; button stays present (no reflow) but uninteractive.
4. **After submit completes** — scored quiz → a **circular badge** (green ✓ correct / red ✗
   incorrect, using the bundled semantic colours); non-scored → fire `showToastSuccess(...)` and
   transition to the plugin-rendered submitted / waiting state.

**Secondary actions** (Skip, Start voting) use a **lower-contrast variant** (surface + border,
or a desaturated palette shade), same height, same i18n discipline — the hierarchy must read
clearly as primary vs side option. Never paint two visually equal buttons.

**Wiring you must include**

- **`onSubmitButtonHeightChange(h)`** — the submit button's y-offset, so the host can paint the
  floating "Scroll to submit" pill when it sits below the fold.
- **`data-testid`** on every interactive element, kebab-case, scoped to the slide type
  (`audience-<slidetype>-submit-button`, `audience-<slidetype>-option-3`).
- **Label via `t(...)`** — never hard-coded "Submit" / "Send" / "Vote".

## Stage steppers and pickers — DS elements

On the Developer Platform a stage indicator is `<aha-stepper steps="…" current="…">` and a
type-to-pick field is `<aha-autocomplete size="large">` (16px text, 48px tall), both from
`lib/audience.js`. Never hand-roll the stepper dots or a `<div role="listbox">` under an `<input>`, and
never fill the current stage with the accent — the stepper marks it with ink, leaving the accent
on submit (C35). Mood glyphs are `system-smiley` / `system-sad-face` / `system-angry-face`.

## Host utilities — use them, don't reinvent

- **Toast** (`showToast*`) for any transient confirmation or lightweight error — if you need a
  toast, use the host's, never an in-iframe banner. Recommended for the "Submitted" notice so
  every slide type confirms the same way.
- **Bottom-sheet modal** (`openPluginModal` / `closePluginModal`) for any modal — host paints the
  chrome, you fill the body. Don't build a custom overlay inside the iframe (wrong layer).
- **Sticky "Scroll to submit"** via `onSubmitButtonHeightChange(h)`.
- **Countdown** (`timeLimit`): in framed mode the host already paints the countdown progress bar
  above the iframe — **don't duplicate** it; use `xprops.timeLimit` as **logic only** (e.g. lock
  submit when `timeLimit <= 0`). The **host owns the expiry notice** ("Time's up") — don't draw
  your own deadline card (it double-announces and drifts from the host clock). In the rare
  full-canvas case, render the countdown bound to the live `xprops.timeLimit`, never static text
  or your own `setInterval`. **Never** write static time text ("30 seconds", "1 phút", "đếm
  ngược 30s") anywhere.
- **Layout helpers** — `scrollTo(y)`, `getWindowHeight()`.

## Out of reach — don't reinvent or assume

Owned by the host; don't render them and don't assume they're broken if you can't reach them:

- **Edge states** — lost connection, poll closed, kicked, last slide, slide skipped: the host
  overlays its own screen. Don't draw your own.
- **Logo / watermark / branding / plan-gating** — host layers outside the iframe.
- **Locale source** — `xprops.presentation.language` (presenter's choice), not the audience
  browser. Don't override; just translate.
- **RTL flip** — the host does not flip layout by language; if your slide type needs RTL, handle
  it yourself (`dir="rtl"` on the root, logical CSS).
- **Background** — `baseColour` and `backgroundImage` don't reach the iframe.

## Touch targets + accessibility

- **Touch targets** roughly finger-sized (~44–48px, iOS 44pt / Android 48dp) — a recommended
  range. **≥8px between tappables** to avoid mis-taps.
- **WCAG AA** against your chosen background — 4.5:1 text, 3:1 large text and meaningful shapes —
  verified on **both** light and dark decks.
- **Focus visible** — keyboard users on tablets / laptops still join; don't remove the ring
  without replacing it.
- **No motion to convey meaning** — lost on bad connections and for `prefers-reduced-motion`.
- **Non-colour cue** paired with every colour-bearing signal — prefer an icon (✓ / ✗) over a
  verbose word chip; compact and language-neutral.
- **Honest chart geometry** — reserve a fixed-width slot on every row for a sometimes-present
  indicator (e.g. a leader trophy) so all bar tracks share width; a 55% bar must occupy 55%.

## Language — initialise from xprops, never browser

- The iframe has its **own** i18n instance (not inherited). Initialise locale from
  `xprops.presentation.language` with `xprops.currentUser.presenterLanguage` as fallback, and
  subscribe to host language changes mid-session.
- Format numbers / percentages with `Intl.NumberFormat(locale)` — not `.toFixed(...)` + `'%'`
  (some locales use `,` as the decimal separator).
- All user-visible text via `t(...)` — no hard-coded English in templates, buttons,
  placeholders, aria-labels, or tooltips.

---

*Full detail, screenshots, worked BAD/GOOD examples and the `AHAM-xxx` bug context live in the
the DS `audience` guide. Self-check any built audience surface with
the DS anti-slop judge (`audience` surface) — it emits a binary PASS/FAIL across the same contracts (C1..C22)
with a `Where / Evidence / Fix` block per failure — and fix every FAIL before shipping.*
