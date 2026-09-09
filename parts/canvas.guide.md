# Canvas — composition guide

> Distilled from `aha-design-canvas`. The skill holds the full rationale, worked
> BAD/GOOD examples, the §1–§9 sections, and the canonical `good-fill-in-the-blanks`
> fixture; the design system now OWNS this build ruleset (this guide is its single
> source of truth). The judge, its criteria (C1..C16), and the eval harness stay in the
> skill. When the two ever disagree, the skill wins and this file is regenerated.

The canvas is the **visual surface** of a slide type — what the audience and presenter
see. A slide type is an embedded iframe app that renders into one canvas in two states —
the **editor preview** and the **live presenting/casting screen** — sharing a single
iframe and differing only by the `presentation.presenting` flag. **Design for both at
once.** This pattern adds no new control; it reuses the shared Icon, the component-library
Button, and the semantic `--aha-color*` tokens, and defines the **conventions** that keep
every slide reading as one product on every theme.

Out of scope: the right-panel settings form (→ `aha-design-settings`), and the technical
wiring behind the visuals (how height is reported, how actions are delivered, how `setting`
flags are declared).

## Pick the container first

The choice lives in the **plugin manifest** (`plugin-manifest.json`) under
`setting.enableFullScreen`. Make it **explicit** — an absent setting reads as "we forgot",
not "we chose".

| Container | Use for |
| --- | --- |
| **Framed** (`enableFullScreen: false`) | A "question + answer area" slide that should look like every built-in type. The host renders the **title**, **description**, and **question image**; your iframe fills the rest. |
| **Full-canvas** (`enableFullScreen: true`) | A bespoke layout that owns the whole stage. The host hides its chrome (`xprops.fullCanvas = true`); **you** render the title/header yourself. |
| **Presenter control bar** (NCB, outside the iframe) | Slide-specific actions (Next / Summarise / Previous). **Declared** in the manifest, painted by the host — never rendered in-canvas. |

- **Never `enableFullScreen: true` + `enableQuestionTitle: true` together.** Full-canvas
  hides the host title bar, so the `enableQuestionTitle` value renders **nowhere** and
  vanishes. Pick **framed** (`enableFullScreen` off, `enableQuestionTitle` on) so the host
  paints the title, OR **full-canvas** (`enableFullScreen` on, render `slideProps.title`
  yourself, `enableQuestionTitle` off).
- **A framed slide's root stays transparent** — it must not render its own title (the host
  draws it) nor paint a slide-wide background/backdrop/scrim; let the deck theme show
  through. The only opaque fill it may paint is a surface **bounded to its content** (a
  card, a chip, a caption bar).
- **A full-canvas slide MUST render `slideProps.title`** (`slideProps.value?.title ?? ''`)
  — the host hides its title bar, so rendering only per-item prompts/labels silently drops
  the presenter's title.

## The stage is a 16:9 box

Slides render inside a **16:9 stage** (1280×720 reference) that the host `transform:
scale()`s as one unit to fit any screen. Design against the **proportions**, not pixels.

- **Responsive, nothing clipped.** Use responsive layout so content holds up scaled large
  (projector) or small (preview) and never overflows.
- **The iframe clips everything past its box — box-shadows and glows included.** Keep a
  shadowed element's shadow *inside* the stage padding: size it so its reach
  (offset + blur − spread) fits the margin, keep it near-symmetric, and don't let a
  scale-up animation grow the element into the padding the shadow needs. `0 34px 90px -26px`
  (~98px) on a card 40px from the edge WILL clip; `0 8px 32px -14px` (~30px) inside ~44px of
  padding does not.

## Colours & fonts come from xprops — never hard-code

The plugin runs in its **own iframe** (separate document, separate bundle) and reads host
state via Zoid xprops on `window.xprops`. Host CSS variables do **not** cross the iframe
boundary, and AntD's theme object isn't reachable — so "read the theme" means "read xprops".

| xprops path | What it is |
| --- | --- |
| `xprops.slide.baseColour` | Slide background colour |
| `xprops.slide.textColour` | Primary text colour |
| `xprops.slide.backgroundImage` | Background image URL (largest variant), already composited with the host's overlay |
| `xprops.presentation.fontFamily` | Deck's font (NAME only) |
| `xprops.presentationColorPalette` | Accent palette — CSS colour strings, padded to 30 |
| `xprops.presentationLighterColorPalette` | Lighter-shade accent palette |

- **Never** hard-code hex colours, Tailwind colour utilities, or font families. Must look
  right on **light, dark, and image** backgrounds.
- Use the palette for **accents** so the slide feels part of the deck — but **never pair two
  palette entries as fill-and-text.** The palette is brand accents, not a fill/foreground
  pair, and has no guaranteed contrast (an all-blue deck makes both go blue and the label
  vanishes). When text sits on a coloured fill, derive the ink FROM the fill
  (`isLightColour(fill) ? darkToken : lightToken`) or fill with the item's own accent and
  contrast against that. The palette is safe for a **mark** (bar, dot), never for palette
  **text on a palette fill**.
- **Loading the font NAME is only half — you must LOAD the face.**
  `xprops.presentation.fontFamily` is only a name; the cross-origin iframe doesn't inherit
  the host's `@font-face` rules, so `font-family: <deck name>` alone falls back to **serif**
  (Times). Call the shared **`useDeckFont(fontFamily)`** helper (adds the Google-Fonts
  `<link>`, idempotent, no-ops for bundled Plus Jakarta Sans) in **every** role that renders
  text — the presenter Canvas AND the Audience / report iframes are separate documents.
- **Fallback when unset:** `baseColour #ffffff`, `textColour #313131`. The `textColour`
  fallback fires on the **common** case (default themes leave it unset). On the deck
  background the flat `#313131` is fine — but when the ink sits on a **bounded filled
  surface whose polarity can vary** (a disabled-grey box, a state-tinted card, a coloured
  chip), a *fixed* fallback is invisible on the opposite polarity. Derive it from that
  surface's own background with a luminance flip: `slide.textColour ?? readableInkOn(fill)`,
  not a constant. Bind every copy of the derived ink to **one** computed source.
- The host's `visibility` (overlay opacity) is **not** forwarded — it's already composited
  into the `backgroundImage` you receive.

### Two colour jobs — keep them separate

| Job | Layer | Colour source |
| --- | --- | --- |
| **Job 1 — chart / visualization** | bar fills, ring segments, plot dots, area shading | the accent palette (`presentationColorPalette` + lighter sibling). Charts **never** carry state meaning. |
| **Job 2 — state indicator** | the ✓/✗ icon, status badge, border accent, label chip that announces correctness | semantic **function tokens** bundled into the plugin's own build |

| Token | Where it goes |
| --- | --- |
| `colorSuccess` (#16C49A) | ✓ icon, correct-answer badge, validation-passed border |
| `colorError` (#F5222D) | ✗ icon, incorrect-answer badge, destructive-action chip |
| `colorWarning` | caution icon, "are you sure?" prompt |
| `colorInfo` | informational badge |

- **Bundle the semantic tokens** into the plugin's build (import from the DS package, or
  plugin-local constants matching it) — AntD's `theme.useToken()` isn't available in this
  Vue stack, `--aha-*` vars don't cross the iframe, and xprops doesn't forward them.
- **Use the FUNCTION token, not a lookalike brand accent.** A bright brand accent that
  merely *looks* green (Bright Teal `#20E8B5` as a "correct" tick) is wrong — it drifts per
  brand and usually fails contrast (~1.58:1 on white).
- **The #1 mistake: applying state colours to the chart.** Painting the "correct" bar
  green-success fights the deck's brand and conveys state *through* the chart. Move the green
  to a **✓ icon** next to the bar; leave the bar in palette colours.
- **Job 2 ≠ any emphasis.** Poll-leader, leaderboard-winner, featured item are accents
  *without* a right/wrong axis — they stay in **palette** colours (bar AND icon). Don't tint
  a poll-leader bar with `colorSuccess`; it falsely implies "correct".
- **A ✓/✗ glyph is a verdict, never decorative.** Use it only where there's a real verdict
  (quiz answer, validation pass/fail). Don't drop a ✓ on an opinion poll / This-or-That /
  word cloud as a "done" ornament — use a neutral affordance (hide the countdown chip, a
  plain "done", or nothing).

### Per-option metrics — attach, don't float

When a datum belongs to one option (a vote count, a tally, a share), put it **on that
option's card** — a bounded **corner responder-count badge** (a darker tint of the option's
own accent, e.g. `color-mix(in srgb, <accent> 50%, <space>)`, with white ink). A bounded
surface is contrast-safe by construction. Don't float a detached legend keyed by colour, and
don't hand-draw a second redundant rendering (a colour-split "progress" bar) of a share the
cards already state.

### Four "AI-generated" tells to avoid

- **No pastel wash under same-hue ink.** A card at `color-mix(<accent> 14%, white)` with
  `<accent>`-coloured text reads monotone, low-contrast, "AI". Let the surface be
  deck-owned (transparent, ink from `slide.textColour`) or pair a tint with genuinely
  high-contrast ink — not one hue at two brightnesses.
- **Corner radius tops out at 8px.** Rectangular content containers (cards, answer boxes,
  option tiles, panels, buttons) use **≤ 8px** (`rounded-lg`); `rounded-2xl`/`3xl`/`20px`
  reads toy-like. Intentionally circular elements (pills, chips, badges, avatars, dots,
  progress tracks/fills) stay fully rounded (`999px`).
- **No extra-bold weight.** Display text is **400 or 600 only**; 700/800/900 reads heavy and
  "AI" (a count number at 800 is the classic tell).
- **No decorative brand watermark or meaningless chrome.** The host owns branding — never
  paint a faux `ahaslides.com` badge, a logo chip, a "Powered by…" tag, or an ornamental
  pill. Every on-canvas element must carry a real datum; if it says nothing, delete it.

## Accessibility — readable from across the room (WCAG)

A slide is read from a distance, often on a glare-washed projector. **Design for the worst
seat** — the same bar applies to the small editor preview.

- **Contrast:** WCAG AA floor — **4.5:1 for text, 3:1 for large text and meaningful
  shapes** — checked against the **real composited background** (`baseColour` blended with
  `backgroundImage`). Add a scrim behind text on busy photos. Go higher when you can.
  - **A slide-painted surface re-anchors the check** against that composited surface. Two
    traps: a **translucent tint** is not a contrast guarantee (only an opaque surface is);
    and any **fixed-colour mark** on it (a semantic `✓`/`✗` token, a palette accent, a
    border) must clear the floor on **both** a light and a dark deck.
  - **A light semantic token on a light surface still fails:** `colorSuccess #16C49A` on
    white ≈ 2.23:1, below the 3:1 mark floor. Put it on a bounded fill (a `colorSuccess`
    circle with a white ✓) or use it on a dark surface.
- **Type scale — fixed logical px.** The stage transform scales everything as one unit, so a
  **fixed logical px** scales proportionally on every screen. Use the preset roles:

  | role | class | px @720 |
  | --- | --- | --- |
  | caption (floor) | `text-base` | 16 |
  | body (default) | `text-lg` | 18 |
  | subhead | `text-2xl` | 24 |
  | title | `text-5xl` | 48 |
  | hero | `text-7xl` | 72 |

  - **Primary content (title / question / answer) sits at body (18px) or larger;** only
    secondary meta may touch the 16px floor. Text below 16px is illegible on a projector.
  - **Never a `vh`/`vw` font-size** — `vh` resolves against the framed iframe viewport
    (~498px, not 720), so `text-[2.3vh]` renders ~11px, and its basis wobbles by framing.
  - **No `clamp()` px floor** — a px floor pins an absolute size while siblings scale,
    breaking proportion on the transform-scaled canvas. A plain fixed px needs no floor.
  - **Never `text-xs`/`text-sm`** (12/14px) and no arbitrary `text-[…]` font-size — pick a
    role. (`em` is fine — a relative multiplier of a role-sized parent.)
- **Text is for reading, not decorating.** A real word renders as normal running text —
  never stack its letters vertically, rotate it, or over-track it into a mark (the
  stacked-"OR" pill is the classic miss). If a divider must be compact, keep the word
  horizontal at a smaller in-scale role (never below 16px) or let it wrap.
- **Never colour alone** — pair colour with a non-colour cue. **Prefer an icon** (trophy,
  ✓/✗) over a spelled-out chip; use words only when no glyph conveys the meaning ("Closed",
  "Beta"), and almost never stack icon + word.
- **Chart geometry stays honest.** A decorative indicator (leader chip, trophy) must not
  change a row's spatial accuracy — reserve a fixed-width decoration slot on **every** row
  (empty when undecorated) or render it as a positioned overlay, or the decorated row's track
  is narrower and the chart lies.
- **Borders are ornament — never derive them directly from `textColour`.** Use a subtle
  theme-aware hairline `color-mix(in srgb, currentColor 10%, transparent)`. Fix a marginal
  contrast check at the bar or the scrim, not with a darker border. Pick the palette shade
  (saturated on light themes, the lighter sibling on dark themes) that actually clears the
  floor on the current background.
- **Motion:** don't depend on fast or subtle motion to convey meaning.

## The presenter control bar (NCB)

Slide-specific actions (Idea board's **Previous** / **Next: vote** / **Summarise**) render
in the presenter control bar (`PresenterControlBarNew.vue`, centre region `ncb-center`, via
`NcbPluginActions.vue`) — **outside** the iframe, and also on the projector during
presenting. You **declare** the action data in the manifest; the host paints each as
`<aha-antd-button>`. The reason is **consistency** (theming, shortcut chips, sound), not
audience visibility. **Declare, don't render.**

Levers per declared action:

| Lever | Type | Use it for |
| --- | --- | --- |
| `id` | `string` | Required, for action callbacks. |
| `label` | `string` (optional) | Short verb-first text ("Summarise"); omit for an icon-only square button. **Raw text**, not a function. |
| `icon` (+ `iconViewBox`) | `string` (optional) | A design-system glyph; set `iconViewBox` for non-square icons. |
| `variant` | `'primary' \| 'secondary'` (default `'secondary'`) | At most one primary = the obvious next step; the rest secondary. |
| `disabled` / `loading` | `boolean` (optional) | Reflect state. **A boolean, never a function.** |
| `shortcut` | `'Enter' \| 'Shift+Enter'` (optional) | Keyboard hint chip. |

- **`secondary` is a solid WHITE button, never a ghost/outline** — white fill, subtle
  border, dark label. The correct resting style for almost every slide action (Show correct
  answer, Group by themes, Hide votes). Declare `variant: 'secondary'` (or omit it) and the
  host renders the white button; never hand-render a transparent/border-only button inside
  the canvas.
- **A repeated per-round stepper is `secondary`, not `primary`.** Reserve the one `primary`
  for a genuinely singular climax (reveal final result, finish activity). Workhorse
  navigation clicked over and over ("Next pair", per-question "Next") is `secondary`, or no
  primary at all.
- **Footgun — `disabled`/`loading` are NOT function-typed.** The host coerces with
  `Boolean(action.disabled)`; a function literal is always truthy, so `disabled: () => votes
  === 0` makes the button **permanently disabled**. Pass a reactive boolean.
- **Feature-flag caveat.** Action buttons are gated behind `canUsePluginActionButtons`. When
  the flag is off, the host doesn't expose `setActionButtons`/`onActionInvoke`, so keep an
  in-canvas button fallback.
- **Reuse the library component — never hand-roll a control.** Any control you render
  (the in-canvas fallback, or any button/input/select/toggle/tooltip/modal) comes from the
  project's component **library** (this app ships **Ant Design Vue**, themed via its
  `ConfigProvider` tokens), not a bespoke `<button>`/`<div>`/`<input>` with hand-written
  fill/border/radius CSS. Reproduce the host's white secondary with your **own** Ant
  `<Button>` under `ConfigProvider`, placed **bottom-centre** so it reads as a slide action.

```ts
// AFTER — the per-round stepper is secondary (This or That "Next pair")
actions: [
  { id: 'previous', icon: 'arrow-left',           variant: 'secondary', shortcut: 'Shift+Enter' },
  { id: 'next',     label: 'thisOrThat.nextPair', variant: 'secondary', shortcut: 'Enter' },
];
// BEFORE — WRONG: shipped as a primary CTA, so every pair shouts the accent
//   { id: 'next', label: 'thisOrThat.nextPair', variant: 'primary' }  // should be secondary
```

## Keyboard-shortcut affordances — for controls you render in-canvas

§5's host-painted actions get shortcut chips, focus order, and sound for free. A slide that
renders its **own** interactive controls (a bespoke overlay, a play/pause, a mute button, a
settings popover) owns those affordances — skipping any is a defect.

- **a. A modal/overlay/popover traps focus.** Move focus to an element **inside** it on
  open, keep `Tab`/`Shift+Tab` cycling **within** it (the presenter can't tab out to the
  page behind), and **return focus to the trigger** on close. An overlay that opens but
  leaves focus behind is invisible to keyboard and screen-reader users.
- **b. Every actionable button shows its shortcut; a single character is a SQUARE.** Render
  the key in a small `<kbd>` chip. A **one-character** key is a **square** (equal width and
  height, small rounded corners ~4px), **never** a wide pill — a pill reads as a tag, a
  square reads as a key; multi-char keys grow wider.
- **c. A labelled button shows its shortcut INLINE next to the label**, always visible —
  never hidden in a hover-only `title="Press X"` tooltip (which makes the presenter hunt and
  hides it from touch).
- **d. An icon-only button carries a name + shortcut tooltip.** Its **tooltip** (and
  `aria-label`) is the button's **name plus the shortcut in parentheses** — `Mute music (M)`.
  A bare icon, or a tooltip that drops the name or `(shortcut)`, leaves the control
  undiscoverable.

(The buttons above still come from the component library per §5 — the affordance rules are
additive, not a licence to hand-roll the element.)

## Language

Display in the **presentation's language**, not a fixed one. The plugin runs its own i18n
instance and does **not** inherit the host's locale. Initialise the locale from
`xprops.presentation.language` (or `xprops.currentUser.presenterLanguage`) at startup and
update it when the host emits a change. No hard-coded English; use `Intl.NumberFormat(locale)`
for percentages and counts, not `.toFixed()` with an assumed `.`-as-decimal separator.

## Right panel

The right-panel settings form is **out of scope** — hand it off to `aha-design-settings`.

---

*Full detail, worked BAD/GOOD examples, and the canonical `good-fill-in-the-blanks` fixture
live in the `aha-design-canvas` skill. Self-check any built canvas with
`aha-design-canvas-judge` — it emits a binary PASS/FAIL across the same contracts
(theme tokens, semantic state colours, NCB control bar, WCAG, non-colour cues,
framed-vs-full-canvas, the full-canvas host title, the on-canvas size floor, i18n,
keyboard-shortcut affordances) — and fix every FAIL before declaring the work `OK TO SHIP`.*
