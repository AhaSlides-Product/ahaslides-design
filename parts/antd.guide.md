# AntD conventions — composition guide

> The design system now OWNS this build ruleset — it is the single source of truth
> for the AntD mechanics every AhaSlides screen obeys, and the `aha-design-antd`
> plugin skill will later be generated FROM this artifact. The narrative rationale,
> the worked BAD/GOOD examples, the full token catalog, and the C1..C8 PASS/FAIL
> evals stay in the skill and its judge (`aha-design-antd-judge`); this guide is the
> shippable, enforceable checklist. When the two ever disagree, the skill wins and
> this file is regenerated.

These rules sit under every other pattern. They keep the whole product on **one**
component library, **one** theme, and **one** token system — so the app reads as a
single coherent surface instead of a patchwork of libraries and one-off styles. This
pattern ships no new control; it composes the shared primitives (Button, Checkbox,
Icon, the DataTable theme) and binds everything to `--aha-*` tokens. If a design mock
asks for something outside these rules, flag it rather than silently introducing a new
pattern.

## One component library — Ant Design v6

AhaSlides frontends are built on **Ant Design v6** (`antd: ^6.0.0`) with
`@ant-design/cssinjs`, `@ant-design/plots` (charts), and `@ant-design/x` (AI surfaces).
The library mandate is **eslint-enforced** — it fails CI, not just review.

| Don't reach for | Use instead |
| --- | --- |
| MUI / Chakra / Radix / Headless UI / Mantine / the React Bootstrap and React Aria wrappers | **Ant Design v6** |
| recharts / victory / chart.js | `@ant-design/plots` |
| Any non-DS icon pack (third-party outline sets, or Ant's own icon package) | the shared **Icon** by name (Phosphor-backed) — see the Icon component |

Even **Ant Design's own icon set is off-limits**: glyphs come from the shared Icon
by name, never an inline `<svg>`.

## Theme & the dual source-of-truth rule

The theme lives in `frontend/src/theme/index.ts` — a single AntD `ThemeConfig`
(`token` + a small `components` block) — and is mounted **once** at the app root via
`<AppConfigProvider>` (a thin `ConfigProvider` wrapper). Every token is **mirrored**
in `frontend/src/theme/variables.css` as an `--aha-*` CSS var so non-AntD CSS reads
the same values.

- **Byte-align the two files.** Change a JS token and you MUST update its matching
  `--aha-*` var, and vice-versa. Splitting them is the fastest way to make AntD
  components and raw CSS disagree.
- **Consume tokens, never hardcode.** Read tokens via `theme.useToken()` in
  components; use the `--aha-*` vars in CSS. A literal `14px` or `#6a1ebb` is drift.
- **Mount `ConfigProvider` once.** Don't scatter ad-hoc providers; the only
  sanctioned nested one is `<XLButtonScope>` (the hero-CTA height override).

> **The `token` const in `theme/index.ts` is a PARTIAL seed, not the full derived
> set.** It defines `size*`, `borderRadius`, `controlHeight`, `paddingInline*` — but
> NOT `padding`/`paddingSM`/`paddingLG`/`paddingXS` and **no `margin*`**. AntD derives
> those at runtime, so `theme.useToken()` returns them — but a `components.<X>`
> override in the same file that references the sibling `token` const gets
> **`undefined`** for those keys and the CSS silently collapses (a padding becomes
> `0px`). In an override, use a literal or a defined `size*` token, never
> `token.padding*`/`token.margin*`; at call sites always read the fully-derived
> `theme.useToken()`. Verify any spacing change by **measuring computed style**, not a
> screenshot.

## Colour — semantic tokens, never raw hex

| Token | Value | Role |
| --- | --- | --- |
| `colorPrimary` | `#6a1ebb` (Violet Purple) | Interactive, links, focus ring, CTA fill |
| `colorSuccess` | `#16c49a` | Success states |
| `colorWarning` | `#ff7747` | Warnings |
| `colorError` | `#f5222d` | Errors / danger CTA |
| `colorInfo` | `#9bb3e9` | Info |
| `colorLink` | `#6a1ebb` | Links (AntD default blue overridden to brand purple) |

- The primary/CTA button fill is **`colorPrimary #6a1ebb`** — the same brand purple
  used for links and focus. White text on it clears WCAG AA (≈8.3:1), so there is
  **no** separate darker CTA shade.
- **Never hardcode hex in a component** — bind to a token or `--aha-*` var.

### Backgrounds are white by default

Surfaces are **white**: `colorBgBase` / `colorBgContainer` / `colorBgElevated` =
`#ffffff`. The only non-white default is the app-shell `colorBgLayout` (`#f5f5f5`)
behind the `Layout`.

- **Don't** give a surface (card, panel, modal, section, page) a coloured, tinted, or
  gradient background **unless the user explicitly asks.** White-first is the default.
- When a non-white background *is* requested, use a brand token (`--brand-*` /
  `--aha-*`), never an arbitrary hex.

### Gradients: AI-only, border-only

Gradients are **banned on any background or fill.** The single sanctioned use is the
**AI affordance**, and even then the gradient sits on the **border only** — the fill
stays white. The canonical technique layers a white fill (`padding-box`) behind a
conic-gradient border (`border-box`), driven by the `--aha-ai-gradient-1/2/3` tokens
and the animated `--aha-ai-gradient-angle`. Legacy gradient backgrounds are violations
being migrated — don't add more; use a flat brand colour.

## Typography

**Plus Jakarta Sans only** — self-hosted (latin + vietnamese), set as `fontFamily` /
`--aha-fontFamily`; `system-ui` is the final fallback only. Don't introduce another
typeface. Size text from the tokens (`fontSize` 14 base, `fontSizeSM` 12, `fontSizeLG`
16, the heading ramp), not magic px.

## Buttons (eslint-enforced)

- **Size via the `size` prop:** `small | middle | large` (28 / 36 / 40px). For the
  **single** most-prominent hero CTA on a screen, wrap it in `<XLButtonScope>` (52px)
  — the one sanctioned per-region `ConfigProvider`.
- **Never** set `height`/`minHeight`/`padding*`/`borderRadius`/`fontSize` via inline
  `style` on a `<Button>` — eslint blocks it.
- **Never** add per-feature `aha-*-btn` classNames — also blocked. Fix the gallery
  (the `/__button-gallery` route), not the call site.
- **Optical centring is a theme fix.** An icon+label Button must render the glyph on
  the label's optical centre. The common failure is *inherited* — a baseline-aligned
  glyph sits a few px low. Fix it once in the theme layer
  (`.ant-btn { display:inline-flex; align-items:center; justify-content:center }`),
  never at the call site. Don't add a `gap` unless measured — the library already
  spaces `.anticon + span` and a `gap` doubles the distance.

## Border radius — a fixed scale, never an ad-hoc number

Pick the step by element, not by eye. These are the values the component standard
**measures on shipped components** — the source of truth; where an AntD token emits a
different number, migrate the token to match.

| px | AntD token | Used by |
| --- | --- | --- |
| **4** | `borderRadiusXS` | Tag, checkbox corner, Tooltip, small Alert, uploader dropzone, Button `sm` |
| **6** | `borderRadiusSM` | Vertical-tab active pill, chips |
| **8** | `borderRadius` (default) | Inputs, Select, menus/Dropdown, Modal / Drawer / Popover, upload item, regular Alert, Button `md` |
| **12** | `borderRadiusLG` (+ `components.Card`) | Cards & panel containers, Button `xl` |
| **16** | `borderRadiusXL` *(to add)* | Large surfaces — hero cards, sheets, shells |

Two off-scale shape escapes, used intentionally: `50%` for a true circle (avatar, icon
button) and a full **pill** (`999px`) for a capsule (toggle track, radio). The DS V3
Alert is `8px` regular / `4px` small.

- **Never hardcode a radius** — no `border-radius: 12px`, no `borderRadius: 8`. Bind to
  the token or `--aha-*` var. Off-scale values (`14 / 20 / 32 / 44`) are drift; collapse
  to the nearest step.
- **Let AntD components keep their token radius** — don't override a Modal/Card/Button
  corner at the call site; fix shape at the theme.
- **Custom / non-AntD containers** must still pull from this scale — a bespoke box is
  the most common source of radius drift.
- **`10` and `2` are retired.** Bind to the **target** component-standard value, not the
  stale token output; close the token gaps (`borderRadiusXL 16` new; retune
  `borderRadiusXS 2 → 4`, `borderRadiusLG 10 → 12`; Modal/Drawer/Popover to `8`) and
  mirror **every** step as an `--aha-*` var — today only `--aha-borderRadius` (8px) is
  exposed.

## Hierarchy from whitespace, not dividers

Hierarchy and grouping come from the **size of the gap**, on the `--aha-size*` scale
(`4 · 8 · 16 · 32 · 48`) — the bigger the conceptual break, the bigger the gap.

- **Don't add a divider line** — no `<Divider>`, no `<hr>`, no `border-top`/
  `border-bottom` rule dropped between sections, groups, rows, or field clusters to
  signal a break. Use a spacing step instead.
- **Only add a divider when the user explicitly asks** — like a coloured background,
  it's request-only.
- **No card/tinted box to fence off plain content** — wrapping a group in a bordered or
  filled container is the same anti-pattern (and mis-reads as a *selectable* object);
  group with spacing.
- **Exempt:** these are *not* the banned divider — the shared `DataTable`'s
  dividers-only row separators, the own-edge an AntD component ships (a `Card`/`Input`
  border, a `Menu` item rule, a `Modal`/`Drawer` header underline), and the subtle
  deck-ink hairline on a filled audience control.

## Key surfaces

Most components inherit the root tokens — leave them alone unless the theme says
otherwise.

- **Radii are token-driven** — see *Border radius* above; no ad-hoc corners.
- **Control heights are shared.** `Input` / `Select` / `DatePicker` inherit the root
  `controlHeight` (32px) — **don't grow them per-instance.** Only `<Button>` (gallery
  sizes) and `<XLButtonScope>` override heights.
- **Layout** uses `headerBg #ffffff`, `bodyBg #f5f5f5`.
- **Charts → `@ant-design/plots`** (not recharts/victory/chart.js).
- **Tables → the shared `DataTable`.** A data grid renders through the one canonical DS
  V3 `DataTable` (white header, dividers-only, single-arrow sort, canonical
  filter/freeze, `components.Table` theme) — never a raw AntD `<Table>` with its own
  `bordered`/`size`/`rowClassName`, and never an HTML `<table>`.

## Focus & accessibility

- A global keyboard focus ring is defined once:
  `:focus-visible { outline: 2px solid #6a1ebb; outline-offset: 2px }`. **Never override
  it with `outline: none`.**
- **Don't convey state with colour alone** — pair a colour change with a shape/text
  change so it survives colour-blindness and greyscale.

### Contrast — AntD covers it; *custom* components are on you

Stock AntD ships **WCAG AA**-passing contrast when you leave the tokens alone. The gap
is the **bespoke component** — the moment you hand-pick colours, nothing checks the
ratio for you.

The bar (the WCAG AA floor): **4.5:1** body text, **3:1** large text (≥18.66px bold /
≥24px) and meaningful non-text (icon glyphs, chart series, input borders, focus rings).
AA is the floor, not the target.

- **Dark surfaces are the #1 trap — every text token inverts from safe to invisible.**
  AhaSlides has real dark fills (the dark presenting stage, `colorBgSpotlight`
  `rgba(26,26,46,0.85)`, `--brand-deep-space #1a1a2e`). **Every** `colorText*` token
  derives from the black-alpha `colorTextBase #1a1a2e` tuned for white, so `colorText`
  lands ~1.2:1 on a dark fill — invisible. Flip text to **`colorWhite` (`#fff`) /
  `--brand-white`** and re-check. There is **no** inverse text token and **no** inverse
  fill token — for a dark-surface chip use a translucent white scrim
  (`rgba(255,255,255,0.12)`) and flag that the theme should gain a proper inverse var.
- **The layered text tokens are tuned for white.** `colorTextSecondary/Tertiary/
  Quaternary` collapse on a tinted, brand-coloured, gradient, image, *or dark*
  background — switch to a token that actually clears 4.5:1 against *that* fill.
- **Check against the *real* rendered background**, including any tint/overlay/image —
  add a solid scrim behind text over busy backgrounds.
- **Brand purple text** on white clears AA, and white text on that same `colorPrimary`
  fill clears AA too (≈8.3:1) — which is why the CTA uses it directly.
- **Disabled / placeholder** are AA-exempt by spec, but keep them perceivable — don't
  push faint-on-faint just because the linter won't flag it.

---

*Full detail, the token catalog (`references/theme-tokens.md`), worked examples, and the
C1..C8 verdicts live in the `aha-design-antd` skill. Self-check any built surface with
`aha-design-antd-judge` and fix every FAIL before shipping.*
