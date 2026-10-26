# Landing scan — what the live AhaSlides marketing site actually uses

> **Status (0.140.0): this scan predates the colour rules of 7 October 2026.** It compares Webflow
> with the purple DS V3 palette; the `--aha-purple-*`, `--aha-pink-*` and other hue-ramp tokens it names
> were removed in 0.140.0, so every colour row needs a re-scan against Vivid Pink before it is acted on.
>
> **Status (0.68.0): the Landing tab is gone.** This audit is kept as the Webflow-to-update record;
> it is not a docs-site page. The marketing-only **Section container** now lives under the
> **Marketing** tab (source: `marketing/<slug>.json`); the standalone **Hero** page was removed in
> 0.315.0 and the hero layouts live on the Marketing **Header** page. The landing
> Button, Link, Fonts, Spacing and Grid blocks were removed as duplicates of Components/Foundations;
> they remain in git history at `v0.67.0` under `landing/`.
>
> Removed in 0.116.0: the Section container marketing pattern is gone; layout rules (inner width, section spacing, breakpoints) belong to each consuming app, not the design system.
>
> Values those blocks carried that are **not** in the product system yet (kept here so none is lost):
>
> - **Pink promotional button** — `.aha-btn--pink{background:var(--aha-pink-60);color:var(--aha-white)}`,
>   hover `var(--aha-pink-50)`. The product `<aha-button>` has no pink variant; adding one is a product
>   API decision, so it was not folded in.
> - **Inline prose link** — `.aha-link`: `--aha-color-primary`, semibold, a `1px` `--aha-purple-30`
>   bottom border that turns `--aha-color-primary-hover` on hover; and `.aha-link--quiet`
>   (`--aha-text-secondary` + `--aha-border-default` underline, primary on hover). The product Button's
>   `link` / `text-link` variants cover the action link, not an underlined link inside running copy.
> - **Two-face headline rule** — Nunito (`--aha-font-display`) for Display and H1 only; H2 and below
>   on the body face. The tokens are on Foundations → Typography; the rule itself was only stated on
>   the landing Fonts page.
>
> Button sizes (sm 28 / md 36 / lg 40) were identical to the product Button, Spacing used only the
> shared `--aha-space-*` scale, and the marketing Grid's auto-fit columns are covered by the product
> Grid (`columns`, `min`, `gap`, `responsive`), so nothing else needed folding.

> Scanned 2026-09-14, re-scanned 2026-09-15 (round 3, Buttons + Fonts; round 4, Section container
> + the Text link component — see those sections for each deep pass) from the live Webflow-authored
> homepage (current A/B variant
> `home-2`): `https://ahaslides.com/homepage-test-july-2026/home-2/` (prod `https://ahaslides.com/`
> is byte-identical). Webflow inlines its CSS, so the design language was read from the page's
> inlined rules and CSS custom properties (`--_color---*`, `--_spacing---*`, `--_typography---*`).
> The only external stylesheet is Phosphor icons. This grounds the landing basics in what is
> genuinely shipped.

The locked decisions (this thread): **Webflow stays the builder that CONSUMES our tokens**, and
**Webflow components must FOLLOW the DS definitions**. So where the live page and the DS disagree,
**the DS value wins** and the difference is logged below as a *Webflow-to-update* item — never
silently reconciled to the Webflow value.

## What the live site uses

### Type — re-scanned 2026-09-15 (round 3), reading `:root`'s `--_typography---*` custom
properties directly rather than per-section overrides, for the full weight/size/colour set.

- **Primary family: `"Plus Jakarta Sans", sans-serif`** — the ONLY family the page loads; used
  for body **and** every heading (`--_apps---typography--heading-font:var(--font-family)`, same
  value as body). No Nunito/serif/display face exists anywhere on the live page.
- Weights seen: 400 (body, `.btn.is-pink` label), 500 (links, and the base `h2`/`h3`/`h6` template
  rule), 600 (most section `.heading-*` overrides, `h6` in places), 700 (one `h6` override). No
  single weight is used consistently for headings — Webflow's own CSS disagrees with itself.
- **Sizes — `:root`'s `--_typography---size--*` scale matches the DS size scale exactly, token for
  token:** h1 `48px`, h2 `40px`, h3 `32px`, h4 `24px`, h5 `20px`, h6 `18px`, text-l `16px`, text-m
  `14px`, text-s `12px` (plus a separate `text-xl` slot also at `18px`). This is a genuine 1:1
  match with the DS `size.*` tokens (`48/40/32/24/20/18/16/14/12`) — no delta.
- Line-heights: body `150%` = DS `--aha-line-height-body` (`1.5`) exact match. Heading-large
  `129%` ≈ DS `--aha-line-height-heading` (`1.3`) — 1pt off, not worth chasing. Component-label
  `100%`, long-p `161%` — landing/no-DS-equivalent, informational only.
- Letter-spacing: headings carry **no** extra tracking (`normal`/unset) = DS
  `--aha-letter-spacing-headlines` `0px` — exact match. The only tracked type on the page is small
  chip/eyebrow labels (`.blog-category` `.05em`, `.aha-section-label-1` `.2px`) — close to DS
  `--aha-letter-spacing-subtext` (`0.3px`), no action.
- Text colours: heading `#11011f`, base `#1a1a2e`, most-frequent body `#1e293b` (slate-900-ish),
  secondary `#8a8a8a`, muted `#64748b` / `#475569`. None of the muted/slate tones equal DS
  `--aha-text-secondary` (`#4A4A4A`) exactly — see Webflow-to-update.

### Colour
| Role | Live Webflow | DS token | Verdict |
|------|--------------|----------|---------|
| Brand purple (bold) | `#6a1ebb` (`--_color---fg--purple`, `.btn`) | `--aha-color-primary` `#6A1EBB` | **exact match** |
| Purple hover | `#8644d4` (`--_color---fg--purple-hover`) | `--aha-purple-50` `#8644D4` (= `--aha-button-primary-bg-hover`) | **exact match** |
| Purple soft bg | `#f9f5ff` (`--_color---bg--purple-soft`) | `--aha-purple-10` `#F9F5FF` | **exact match** |
| Pink accent (hover) | `#ff6996` | `--aha-pink-50` `#FF6996` | **exact match** |
| Pink accent (bold) | `#ff4081` (`--_color---fg--pink`) | — (off DS scale) | *Webflow-to-update* → nearest DS pink |
| Border | `#d4d4d4` (`--_color---fg--border`) | `--aha-border-strong` `#D4D4D4` | **exact match** |
| Body text | `#1e293b` / `#1a1a2e` (slate) | `--aha-text-default` `#1A1A1A` (neutral) | *Webflow-to-update* → DS neutral wins |
| Secondary text | `#8a8a8a` | `--aha-text-tertiary` `#8A8A8A` | match (DS labels it tertiary) |

The brand core (purple, purple-hover, purple-soft, pink hover, border) is **already on the DS
palette** — the marketing site and the DS do not drift on colour. The only real colour deltas are
the slate body-text tint and the bold-pink `#ff4081`.

### Spacing rhythm
Webflow's own spacing scale (`--_spacing---*`) is rem multiples of 8/16 and maps cleanly onto the
DS `--aha-space-*` scale:
- section padding-x `2rem` = 32 → `--aha-space-32`; padding-y `4rem` = 64 → `--aha-space-64`
- half-section `3rem` = 48 → `--aha-space-48`; card padding `2rem`/`3rem` = 32/48
- list gap `1.5rem` = 24 → `--aha-space-24`; nested-container gap `4rem` = 64 → `--aha-space-64`
- content **max-width `1280px`** (`--_spacing---max-width`, also `80rem`) = DS `--aha-breakpoint-desktop`

No delta — the marketing rhythm is expressible entirely in DS space tokens.

### Radius
- `.btn` border-radius `8px` = DS `--aha-radius-default` — match.
- `--radius:10px` and `--radius-lg:14px` are **off the DS scale** (4/6/8/12/16/20).
  *Webflow-to-update* → snap to `--aha-radius-lg` (12) / `--aha-radius-xl` (16).

### Section container — re-scanned 2026-09-15 (round 4, deep pass), reading `body`'s
`--_spacing---section-p-*` custom properties and the `@media (max-width:991px)` override directly,
plus every `bg-purple`/`x-compact-section`/`x-section` band on the page for the soft-tint pattern.

| Property | Live Webflow (`--_spacing---section-*`, root + `≤991px`) | DS token / `marketing/section-container.json` | Verdict |
|---|---|---|---|
| Content max-width | `--_spacing---max-width:1280px` (unchanged at every breakpoint seen) | `--aha-breakpoint-desktop` `1280px` | **exact match** |
| Section padding-x (desktop, `>991px`) | `--_spacing---section-p-x:2rem` = `32px` | `.aha-section` padding-x clamps `16px`&rarr;`32px` (`--aha-space-16`&rarr;`--aha-space-32`), capping at `32px` from ~`800px` viewport up | **match at the cap** |
| Section padding-x (`≤991px`) | `--_spacing---section-p-x:1rem` = `16px` | same clamp floors to `--aha-space-16` (`16px`) below ~`400px` viewport | **match at the floor** — round-4 fix: the floor was `--aha-space-20` (`20px`), one token off the live `16px` mobile value; corrected to `--aha-space-16` |
| Section padding-y (every breakpoint) | `--_spacing---section-p-y:4rem` = `64px`, **flat** — Webflow never reduces it on mobile | `.aha-section` padding-y clamps `48px`&rarr;`96px` (`--aha-space-48`&rarr;`--aha-space-96`) | **deliberate DS-wins delta** — Webflow ships one fixed value at every width; the DS landing register instead scales the band fluidly (per this repo's house responsiveness rule: bind to a fluid range, never a fixed pixel), giving less vertical padding on a phone and more on very large screens. Not logged as *Webflow-to-update*: it is a responsiveness improvement, not a correction of a wrong Webflow value. |
| Soft band background | `.x-compact-section.bg-purple{background-color:var(--_color---bg--purple-soft)}` = `#f9f5ff` | `.aha-section--soft{background:var(--aha-purple-10)}` = `#F9F5FF` | **exact match** (already logged under Colour, above) |
| Dark band | not present on the current live homepage variant — no section on the page uses a dark/inverse background | `.aha-section--dark{background:var(--aha-bg-dark);color:var(--aha-icon-inverse)}` | **no live counterpart to check** — kept as a DS-provided variant (a high-contrast closing band is a reasonable marketing pattern even where this particular page doesn't use one yet); not a delta since there is no live value to disagree with |
| Section title font (h2 in the block's markup) | n/a — the live page's own headings all render in the body face, `"Plus Jakarta Sans"` (see Type, above; item 15 in Webflow-to-update) | was `--aha-font-display` (Nunito) | **DS-internal bug, fixed this round** — the locked round-3 Fonts decision reserves `--aha-font-display` for Display/H1 only; H2/H3 stay on the body face (the former `landing/fonts.json` (removed in 0.68.0) `.aha-type__h2` carries no family override). `section-container.json` predates that decision (written in round 5 of PRO38-14, before the round-3 Fonts deep pass) and still forced its `<h2>` title onto the display face. Removed the override so the title inherits `--aha-font-product` from `.aha-section`, matching `fonts.json`'s own H2 treatment. |
| Section title line-height | n/a (see Type, above: heading-large `129%` &asymp; DS `--aha-line-height-heading` `1.3`) | was `--aha-line-height-tight` (`1.2`, the H1/Display line-height) | **DS-internal bug, fixed this round** — same drift as the font-family: the title is an H2, so it should carry `--aha-line-height-heading` (`1.3`, what `fonts.json`'s `.aha-type__h2` uses), not the tighter H1/Display value. Corrected. |
| Section eyebrow/lead type | eyebrow: size-sm/semibold/uppercase/primary-colour; lead: size-l/body line-height/secondary colour | unchanged, already token-bound and matching the `header.json` hero eyebrow/lead treatment | **match** — no change |

**Verdict: the block already matched the live geometry (max-width, padding cap, soft-band colour) with
no drift; the two genuine findings were internal** — a stale font-family/line-height pair left over from
before the round-3 Fonts decision locked H2 onto the body face, and a one-token-off mobile padding-x
floor. Both fixed in `marketing/section-container.json` this round; no new *Webflow-to-update* items — the
live site's own geometry already agrees with the DS token values wherever a live counterpart exists.

### Buttons — re-scanned 2026-09-15 (round 3): the real buttons on the page are `.btn.is-pink`
(primary CTA — "Get started", "Sign up", "Try it now") and `.btn.is-secondary` ("Log in", "See our
pricing"), layered over a `.btn` base. `.button`/`.button-pink` are separate, unrelated classes:
`.button-pink` is unused on this page (sitewide leftover CSS); `.button.topbar-btn` is the small
promo-bar "Join" pill — a nav micro-utility outside the marketing CTA register, not reconciled here.

| Property | Live Webflow (`.btn.is-pink` / `.btn.is-secondary`) | DS token / the former `landing/button.json` (removed in 0.68.0) | Verdict |
|---|---|---|---|
| Primary bg | `#6a1ebb` | `--aha-button-primary-bg` `#6A1EBB` | match |
| Primary hover bg | `#8644d4` | `--aha-button-primary-bg-hover` (purple-50) `#8644D4` | match |
| Primary active/press bg | `#d92b6b` (a **pink** shade, copy-paste from `pink-bold-hover`) | `--aha-button-primary-bg-press` (purple-80) `#5715A0` | **Webflow-to-update** — wrong hue entirely |
| Primary `:focus` bg | `#5715a0` (darkens the fill) | no bg change on focus, ring only | **Webflow-to-update** — focus shouldn't restyle the fill, that's the press colour |
| Primary label weight | `400` | `--aha-weight-semibold` `600` | **Webflow-to-update** |
| Primary label colour | `#fff` | `--aha-button-primary-text` (gray-10) `#FDFDFD` | match (negligible hex diff) |
| Radius (all buttons) | `8px` (`.btn` base) | `--aha-radius-default` `8px` | **match** — the landing block now uses the DS default 8px radius, the same as both the live `.btn` and the product `aha-button`; the earlier round's `--aha-radius-pill` was an unrequested marketing embellishment and has been reverted |
| Size / height | default CTA `40px`, hero `52`/`64`; padding `0 20px` | `--aha-control-height-button-lg` `40px`, padding `0 var(--aha-space-20)` `20px` | **match** — reflects the live default button; the earlier round's XL-pill size has been reverted |
| Pink-accent bg | bold pink `#ff4081` (`--_color---fg--pink`) | `--aha-pink-60` `#FF4081` | **match** — `#ff4081` is exactly DS `--aha-pink-60`, so it is on the DS scale (correcting round 3's "off-scale → snap to pink-50"); the block uses pink-60 resting, pink-50 hover |
| Secondary bg | `#fff` | `--aha-button-default-bg` (white) | match |
| Secondary border (default) | `#d4d4d4` | `--aha-button-default-border` (gray-40) `#E3E3E3` | **Webflow-to-update** — a press-tier shade used as the default |
| Secondary border (hover) | `#8644d4` (purple-50) | `--aha-button-default-border-hover` (purple-40) `#A96FF0` | **Webflow-to-update** — one shade too dark |
| Secondary border (active) | `#6a1ebb` (brand purple) | `--aha-button-default-border-press` (gray-50) `#D4D4D4` | **Webflow-to-update** — DS press border is neutral grey, not purple |
| Secondary bg (hover) | `#f9f5ff` | `--aha-button-default-bg-hover` (purple-10) `#F9F5FF` | match |
| Secondary text (hover) | `#8644d4` | `--aha-color-primary` `#6A1EBB` (per `aha-button.js`) | close — DS wins the exact shade |
| Secondary elevation | `0 2px #0000000a` (subtle) | *(missing — added this round)* → `--aha-button-elevate-secondary` | DS gap, now closed |
| Secondary font-size | `18px` | `--aha-size-l` `16px` (lg/xl tier per the product Button contract) | **Webflow-to-update** |
| Focus ring (secondary) | `box-shadow:0 0 0 4px #d3b4ff4d` | `--aha-button-focus-ring` `rgba(211,180,255,.3)` = `#D3B4FF4D` | **exact colour match** — DS landing button used a plain `outline` before this round; switched to the product `aha-button.js` box-shadow-ring pattern (spread 2px vs Webflow's 4px — cosmetic, not chased) |
| Focus ring (primary) | `box-shadow:0 0 0 4px #6a1ebb33` (purple @ 20%) | same `--aha-button-focus-ring` (lavender, applies to every variant per DS V3) | **Webflow-to-update** — off-DS custom ring colour |

DS wins on every delta row above (the "Webflow-to-update" list below is the fix-in-Webflow work).
Two DS-side gaps closed this round (secondary hover text-colour + press border, and the box-shadow
focus ring) — both taken verbatim from `lib/aha-button.js`, the canonical product Button.

### Text link (tertiary) — scanned 2026-09-15 (round 4), reconciled round 5: the requester named
this Webflow's "tertiary" — the third button-family CTA style, `.text-link-wrapper` (+
`.text-link-label-child` / `.text-link-icon-child`, 5 live instances on the scanned page). This is
a separate component from `.btn.is-pink` / `.btn.is-secondary` (Buttons, above) and from the plain
body-copy `a` (Links, below). Per the locked doctrine (DS wins) it is reflected in
the former `landing/button.json` (removed in 0.68.0) as the DS **ghost tertiary** variant `aha-btn--tertiary` — the same shape as
the product Button's `variant=tertiary` (transparent → soft purple hover fill `#F9F5FF` / active
`#F0E4FF`), keeping the live Text link's purple label and purple-50 hover *colour* (both already on
the DS scale). The Webflow Text link's own hover behaviour (colour only, no fill) and hard-border
focus disagree with that ghost definition, so the DS value wins and the diffs are logged below.

| Property | Live Webflow (`.text-link-wrapper`) | DS ghost tertiary (`aha-btn--tertiary` / `aha-button.js` `variant=tertiary`) | Verdict |
|---|---|---|---|
| Colour (resting) | `#6a1ebb` (`--_color---fg--purple`) | `--aha-color-primary` `#6A1EBB` | **match** |
| Background (resting) | transparent | transparent | **match** |
| Border | none | none (inherited `.aha-btn` transparent border) | **match** |
| Padding | `0` | — (landing block keeps the `.aha-btn` family padding for row alignment; not chased) | informational, no action |
| Font size | `1rem` = `16px` | `--aha-size-l` `16px` (lg) | **match** |
| Font weight | `600` | `--aha-weight-semibold` `600` | **match** |
| Line-height | `1.5` | `--aha-line-height-body` `1.5` | **match** |
| Icon↔label gap | `4px` | `--aha-space-8` (button family gap) | minor, not chased |
| `:hover` colour | `#8644d4` (`--_color---fg--purple-hover`, purple-50) | `--aha-purple-50` `#8644D4` | **match** |
| `:hover` background | none (colour-only, no fill) | soft purple fill `--aha-button-ghost-bg-hover` `#F9F5FF` | **Webflow-to-update** — a ghost button fills on hover; the DS wins |
| `:active` background | none | `--aha-button-ghost-bg-press` `#F0E4FF` | **Webflow-to-update** — no pressed state live; DS adds the ghost press fill |
| `:focus` colour | stays purple (no change) | n/a | match |
| `:focus-visible` | `1px solid #6A1EBB` border | `--aha-button-focus-ring` box-shadow (shared `.aha-btn:focus-visible`) | **Webflow-to-update** — a hard border instead of the DS soft ring |
| `:focus-visible` radius | `2px` | off the DS radius scale (4/6/8/12/16) | **Webflow-to-update** — the soft ring has no radius |
| Inverse (dark-band) variant | `w-variant-bb449d6f…`: colour = inverse-base (white-ish), hover `#f0f0f0` | on-dark register, no DS token yet | informational only, no DS action |

Colour, background, border, size, weight, line-height and hover *colour* all already match the DS —
the live Text link and the DS ghost tertiary agree on the palette. DS wins on the four delta rows
(hover fill, active fill, focus style, focus radius) — folded into the Webflow-to-update list below,
continuing its numbering.

### Links
- `a{ color:var(--_color---fg--purple); font-weight:500 }` — purple text, medium weight, no underline.
- Delta: **weight 500** — the DS type scale is 400/600 only. *Webflow-to-update* → DS `link` uses
  `--aha-weight-semibold` (600). Colour (`--aha-color-primary`) already matches.

### Grid
- Live grids are plain `grid-template-columns` of `1fr` / `1fr 1fr` / `1fr 1fr 1fr` / `repeat(4,1fr)`
  with gap `1rem`–`1.5rem`, collapsing to one column on phone. The `grid` block encodes this as
  responsive auto-fit plus explicit 2/3/4-column variants on the DS space gap scale.

## Webflow-to-update list (DS is authoritative)
1. Body text tint `#1e293b`/`#1a1a2e` → DS neutral `--aha-text-default` `#1A1A1A`.
2. Bold pink `#ff4081` is already exactly DS `--aha-pink-60` (and `#ff6996` = `--aha-pink-50`) — on the DS scale, no Webflow change needed. The landing block uses pink-60 resting, pink-50 hover.
3. Off-scale radii `10px`/`14px` → DS scale `12`/`16`.
4. Ad-hoc button shadow `0 2px 5px #0003` → DS `--aha-button-elevate-primary`.
5. Link weight `500` → DS `--aha-weight-semibold` (600).
6. Primary button active/press colour `#d92b6b` (pink) → DS press `#5715A0` (purple-80) — genuine
   colour-family bug, not just an off-token shade.
7. Primary button `:focus` darkens the fill to `#5715a0` → remove; focus should only add the ring,
   never restyle the fill (that's what `:active` is for).
8. Primary/CTA button radius `8px` — no change. The DS landing register uses the DS default 8px
   radius (`--aha-radius-default`), matching the live `.btn` and the product `aha-button`; the pill
   proposed in round 3 was reverted as an unrequested embellishment.
9. Primary button label weight `400` → DS `--aha-weight-semibold` (600).
10. Secondary button default border `#d4d4d4` → DS default border `#E3E3E3` (gray-40); reserve
    `#D4D4D4` for the pressed state only.
11. Secondary button hover border `#8644d4` → DS hover border `#A96FF0` (purple-40, one shade lighter).
12. Secondary button active border `#6a1ebb` (purple) → DS press border `#D4D4D4` (neutral grey,
    not brand purple).
13. Secondary button font-size `18px` → DS `16px` (`--aha-size-l`, the lg/xl button-label size).
14. Primary button focus ring colour `#6a1ebb33` (purple @ 20%) → DS `--aha-button-focus-ring`
    (`rgba(211,180,255,.3)`), the one ring colour every button variant uses.
15. Headings (h1–h6) render in the body face (`Plus Jakarta Sans`) everywhere → DS reserves
    `--aha-font-display` (Nunito) for Display and H1; adopt it there (H2/H3 correctly stay on the
    body face already).
16. Heading colour `#11011f` → DS `--aha-text-default` `#1A1A1A` (no separate near-black heading tint).
17. Heading weight is inconsistent (base template `500`, most sections `600`, one `h6` at `700`) →
    standardise on DS `--aha-weight-semibold` (`600`) everywhere; the DS scale has no `700` role.
18. Muted/secondary paragraph tones (`#475569`, `#64748b`, `#8a8a8a`) → DS `--aha-text-secondary`
    `#4A4A4A` for secondary copy (`#8a8a8a` already matches `--aha-text-tertiary` — keep that one).
19. Text link / tertiary `:hover` is colour-only (no background) → the DS ghost tertiary fills the
    background on hover with `--aha-button-ghost-bg-hover` `#F9F5FF` (`.aha-btn--tertiary` /
    `aha-button.js` `variant=tertiary`). A ghost button gains a soft tint on hover; the DS wins.
20. Text link / tertiary has no pressed state live → the DS ghost tertiary adds an `:active`
    background `--aha-button-ghost-bg-press` `#F0E4FF`.
21. Text link / tertiary `:focus-visible` — a hard `1px solid #6A1EBB` border at a `2px` radius
    (off the DS 4/6/8/12/16 scale) → the DS soft box-shadow `--aha-button-focus-ring`, the one
    focus treatment every button-family variant (including `aha-btn--tertiary`) uses.

Everything else the live site uses is already on the DS foundations, so the landing basics below
bind to `--aha-*` tokens with no new brand source. Sizes, line-heights and letter-spacing for type
are a genuine 1:1 match with the DS scale (see Type, above) — no action needed there.

### Header (Webflow component Header, variant "Variant") — added with DESY-196
Matched to the live ahaslides.com (1440px and 390px, every menu open). What the DS section still does differently, for Growth to align on Webflow:
22. Third-party integration logos (Solutions → Integrations) are in full brand colour live → the DS shows them in greyscale from the Logo library, per colour rule 2.6 (customer and integration logos in one colour). Slack and Model Context Protocol were added to the Logo library for this.
23. Weight 500 (medium) on the menu entries, the participant label and the Log in / Sign up labels → the DS type scale has 400 and 600 only, so these take `--aha-weight-regular`.
24. Join bar text sizes `11px` (url, code field) and `13.6px` (Join) → `--aha-size-sm` (12px) and `--aha-size-default` (14px). Join button `#3A3A3A`, hover `#535353` and the field fill `#ffffff14` → `--aha-gray-90`, `--aha-gray-80` and `--aha-bg-dark-raised`; dropdown text greys `#757575` and `#1E293B` → `--aha-text-tertiary` / `--aha-gray-80` and `--aha-text-default`; panel border `#EAECF0` → `--aha-border-default`.
25. Sign up press is purple `#61139B` with a lilac ring, and Log in press has a lilac ring → the DS primary press is Darker Pink and the ring is `--aha-focus-ring-soft`. The live code field and links show no keyboard focus → the DS focus outline on every control.
26. The menu icon is three Webflow divs that morph into a cross → the new `system-menu` glyph and `system-x`, swapped without the morph.
27. The Products preview plays a Webflow video per slide type → the DS section has a preview slot (a slide-type icon on the light pink fill) for the consumer's own media.
28. Hidden live items (Quiz, Poll, Idea Board, View more in Interactive slides) are left out, since the live site does not show them.
29. A second live variant (light join bar `#E4E9F6`, white field, grey menu text) is served to some visitor segments; the DS section matches the default dark variant.
30. Live bug: on `www.ahaslides.com` the Plus Jakarta Sans files are fetched from `ahaslides.com` without an `Access-Control-Allow-Origin` header, so the browser blocks them and the page falls back to a system font. `ahaslides.com` (no www) loads them.
31. Webflow collapses the nav at the `medium` breakpoint (991px), the join bar stacks at 479px and the side padding drops to 16px at 767px; the DS section uses the same widths.

### Footer (Webflow component Footer, Relume uui-footer06) — added with DESY-202
Matched to the live ahaslides.com at 1440px, 768px and 375px (columns, spacing, type, hover, breakpoints at 991, 767 and 479px). What the DS section still does differently, for Growth to align on Webflow:
32. The logo is a Webflow image of the Vivid Pink wordmark file (186 x 42px) → the DS `<aha-product-lockup>` (the Splash plus live type), at about 176 x 43px.
33. Weight 500 (medium) on the column headings → the DS type scale has 400 and 600 only, so they take `--aha-weight-regular`.
34. Greys `#757575` (links, and headings at 1440px and up), `#1A1A2E` (headings below 1440px) and the footer border `#D4D4D4` → `--aha-gray-80`, `--aha-text-default` and `--aha-border-strong`. The link hover `#E70E68` is `--aha-color-primary`, the same colour.
35. The live keyboard focus is the browser's grey outline → the DS focus outline on every link and the logo.
36. Webflow media queries (991, 767, 479px and a 1440px heading size) → the same widths as container queries on the footer, so the section also reflows inside a narrow docs frame.
37. Live column placement at 991px and below is set per column by Webflow grid IDs → named column classes carry the same placement.
38. The social and contact glyphs are Phosphor outline icons in `#8A8A8A` on live → all eight are `<aha-icon>` outlines in `--aha-icon-muted`: `system-envelope`, `system-whatsapp-logo`, `system-users-three`, `slidetype-youtube`, and the new `system-linkedin-logo`, `-facebook-logo`, `-instagram-logo`, `-reddit-logo` (the live Phosphor paths, DSN-933). Resolved except the DS envelope draws its diagonal creases, the DS WhatsApp phone is drawn slightly differently, and the DS strokes are 2px at 24px where live is about 2.25px.
39. The award badges (three G2 and the Training Magazine Network winner) and the DMCA badge are third-party raster images; the section keeps the live absolute image URLs on ahaslides.com and does not host copies.
40. Live bug: the DMCA badge links to the G2 reviews page; the section keeps the live link until Growth decides the right target.
41. The icon links carry live aria-labels that begin "link to" (for example "link to AhaSlides LinkedIn channel"), which screen readers read after announcing a link; kept verbatim, Growth may shorten them. The community link drops the live `_gl` tracking query.
42. Live icon links show no hover or focus state (the email glyph only changes an unused colour) → the icons also have none on hover, and take the DS focus outline on keyboard focus.
43. The grey band `#F7F7F7`, the copyright grey `#667085` and the System status grey `#757575` → `--aha-bg-hover`, `--aha-gray-80` and `--aha-gray-80`; the band and copyright line sit outside Webflow's `<footer>` element on live and inside the footer here.

### Footer banner (Webflow `.section-container > .card-based-section.img-card-section`) — added with DESY-205
The pre-footer call-to-action card, matched to the live word-cloud page (https://ahaslides.com/slide-types/word-cloud/, the same Webflow element as on /features/ and /compare/) at 1440px, 768px and 375px: card position and size, padding, radius, background art, heading and button measure the same bar the scrollbar width. What the DS section still does differently, for Growth to align on Webflow:
44. The card background is a Webflow-hosted 1920 x 1080 PNG (`bg-pink.png`, a pale pink with a large curve) → since DESY-265 the DS card is Vivid Pink (`--aha-vivid-pink-100`) on the centre Splash background (rules 5.1 and 5.3: Darker Pink hooks, `splash-icon-pink.svg` from design.ahaslides.io/backgrounds), the same mechanism as Hero Pink; no image is hosted or linked from ahaslides.com. Live still shows the pale pink PNG.
45. The heading is `#11011F` at weight 600 with a 129% line height on live → white (`--aha-text-inverse`) on the Vivid Pink card at weight 600 and `--aha-line-height-heading` (130%, 52px vs 51.6px at 40px). The optional paragraph is white too.
46. The button is a Webflow `a.btn.is-pink` at 18px weight 500 (400 at 479px and below) → an anchor in the same 40px box, white fill with Vivid Pink text (`--aha-color-primary`, `--aha-color-primary-hover` on hover and press) at weight 400 (the DS scale has 400 and 600). `<aha-button>` has no link form, so the section does not nest it inside an `<a>`.
47. The button rest shadow `0 2px 5px rgba(0,0,0,.2)` → `--aha-button-elevate-primary` (`0 2px 0 rgba(0,0,0,.04)`), the DS primary button elevation. The label, fill `#E70E68` and the 0.2s hover fade to `#DB005B` already match.
48. Live press and keyboard-focus turn the button purple (`#5715A0` with a purple ring, a copy-paste from the old purple button) → press darkens the label to `--aha-color-primary-hover`; keyboard focus is a white ring over a Vivid Pink gap (the Hero Pink recipe).
49. Live breakpoints are media queries (991, 479px) → the same widths as container queries on the section: padding 96/64px becomes 96/24px at 767px and 96/16px at 479px (the DS page gutter, DESY-312), the card padding 64/0px becomes 32/64px and the heading 40px becomes 32px at 991px.
50. The scroll-in reveal (a Webflow interaction: the heading fades up from 10% below over 0.5s, the card fades in 0.3s later) exists on /compare/ only; the word-cloud and features pages show the card at rest → an opt-in `aha-footer-banner--reveal` modifier plus a small inline script reproduces it, once, and is skipped under `prefers-reduced-motion`. Webflow's exact trigger offset is not published; the script fires when 20% of the section is visible.
51. The Enterprise variant adds a paragraph between heading and button ("Talk to our experts" button) → an optional `aha-footer-banner__text` slot (20px, centred); copy and link stay per-page content.

Consumer to update: the live Webflow footer banner (`.card-based-section.img-card-section` on ahaslides.com) still shows the pale pink `bg-pink.png` card with dark heading and pink button. Growth must change it to the Vivid Pink card described in items 44-48 (DESY-265); until then the DS and live differ.

### FAQ (Webflow component FAQ, Relume uui-faq01) — added with DESY-206
Matched to the live ahaslides.com AI presentation maker page at 1440px, 768px and 375px (box geometry equal to the pixel at all three, breakpoints at 991, 767 and 479px, 24px type step at 1920px). What the DS section still does differently, for Growth to align on Webflow:
52. Weight 500 (medium) on the question text → the DS type scale has 400 and 600 only; semibold keeps the same line breaks as live at 375px (regular wrapped one question differently), but reads slightly heavier.
53. Blue-grey `#1E293B`, `#101828`, `#222B37`, `#EAECF0` and `#98A2B3` (heading, questions, answers, row border, plus/minus icon) → `--aha-text-default`, `--aha-border-default` and `--aha-icon-muted`; the DS greys are neutral.
54. The 36px and 28px heading sizes are not on the DS size scale → `calc(--aha-size-h3 + --aha-space-4)` and `calc(--aha-size-h4 + --aha-space-4)`; the 1.4 mobile line height has no token and is written as a number.
55. Live opens with Webflow IX2 on a bare div (not focusable, no ARIA, one shared `data-w-id` on all four rows) → real buttons with `aria-expanded`/`aria-controls`, a `role="region"` answer and a CSS-only height animation (grid rows 0fr to 1fr, 0.3s ease-out, same as the measured live motion); the plus-to-minus turn is a 90 degree rotation of the vertical bar over the same 0.3s.
56. Live answer 4 is a `<p>` with a 24px line height while answers 1 to 3 are bare text at 28px; kept as live, Growth may unify.
57. Webflow media queries (991, 767, 479px, and 1920px for the question size) → the same widths as container queries on the section.

### Logos (Webflow CMS collection list `div.div-block-250`, Infinite logo interaction) — added with DESY-214
Matched to the live ahaslides.com survey creator page (https://ahaslides.com/product/free-survey-creator/, the block after `</main>`) at 1920px, 1440px, 991px, 767px and 390px, except that the logos are now about 25% larger than live (requester's call, DESY-214 round 8): 100px wide at most (live 80px), 138px at 1920px (live 110px), 50px tall at 991px and below (live 40px), 75px tall at 479px and below (live 60px). Growth to align Webflow. The loop is compared against live with it frozen at its start. What the DS section still does differently, for Growth to align on Webflow:
58. The loop is a Webflow IX2 "Infinite logo" interaction that moves both list wrappers 0 to -100% over 20s, linear, repeating, started at page load → the same movement as one CSS animation on each copy of the list, started when the section is parsed, but shifted by one set plus the gap (`translateX(0)` to `translateX(calc(-100% - 40px))`, 20s linear infinite; 40px = the 240px gap minus the -200px margin) so the DS restarts with no jump. Live jumps back by 40px at each restart; the DS closes it.
59. Live keeps the loop running under reduced motion → the DS stops it under `prefers-reduced-motion` (the requester's default; revisit if live must be matched exactly).
60. The logo list is a Webflow CMS collection, read from the published page (no API access): the DS keeps it as `marketing/data/logos-cms.json` (alt text, image URL, order, source URL and fetch date). It is a snapshot, so a CMS change needs the file refreshed; image URLs stay on the live Webflow host and the images are not recoloured.
61. Live renders the list twice as two collection lists with identical alt text → the second copy is `aria-hidden`, so a screen reader reads the logos once; the list is a real `ul` with `li` items and the section carries `aria-label="Customer logos"`.
62. Live has no hover, focus or click behaviour on the logos → none added.
63. Webflow media queries (1920px, 991px, 479px) → the same widths as container queries on the section. Live also carries `.homev4` variants of the strip, positioned absolutely inside the home hero, which are not part of this section.
64. Live switches to 110px logos (the DS uses 138px) at a 1920px viewport (a media query); the DS keys it on the section's own width, so a 1920px browser window with a 15px scrollbar (section 1905px wide) still shows 100px logos, while a 1920px frame without a scrollbar, such as the docs preview, shows 138px (live 110px; the logos are larger than live, see above).

### Hero Pink, Hero Pink Vertical and their pale pink versions (Webflow components, group Top sections) — added with DESY-226
Read through the Webflow Designer API on the production site (6 instances of Hero Pink, 3 of Hero Pink Vertical); not yet compared against a live ahaslides.com page, so sizes marked "approximated" are for Growth to confirm. What the DS section does differently, for Growth to align on Webflow:
65. Colour clash: the first screen is white (colour rule 3.5) but a Vivid Pink hero is a coloured first section → the DS ships the block as built and does not edit the rule; the pale pink version (Vivid Pink at 5%) is the alternative if the rule is to hold. Needs the rules owner's call.
66. Webflow surface is a background image (the Splash hooks as a bitmap, `cover`) on `.hero-template` → solid Vivid Pink with the four Splash hooks as inline SVG in Darker Pink (right layout, meeting point 75% across and 55% down, per the Splash rules); the centre layout (50% across) when the image is stacked under the copy.
67. Hex colours on the Webflow button (`#fff` fill, `#d4d4d4` border, `#1a1a2e` text) → white fill and Vivid Pink text (`--aha-color-primary`) per the Vivid Pink surface column, no border, hover keeps the white fill and turns the text Darker Pink (`--aha-color-primary-hover`), since the 5% accent fill would read as transparent on Vivid Pink, and a white focus ring (a Vivid Pink ring would vanish on the surface).
68. Button height 52px, padding 12px 20px, 18px text → `--aha-control-height-button-xl`, `--aha-space-20`, `--aha-size-h6`; corner radius moves to the DS default (`--aha-radius-default`).
69. Image: no card in Webflow (radius 12px, max width 680px, grey placeholder) → a white card (`--aha-radius-xl`, 12px padding) around the image at 12px radius, as colour rule 4.7 asks.
70. Headline and body text sizes come from Webflow variables the API does not expose (the `h1` tag style and `--body-text` size) → approximated as `--aha-size-h1` (48px) at desktop, `--aha-size-h3` at 991px and below, `--aha-size-h4` at 479px and below, semibold; body `--aha-size-l`. The 2px body letter spacing has no token → `--aha-letter-spacing-paragraph`.
71. Spacing: container 1280px, 4rem padding and gap, copy 720px, 2rem under the copy block, 1rem top padding at 479px → `--aha-space-64`, 720px and 1280px kept, `--aha-space-32`; at 479px the DS pads 32px at the sides and 64px at the bottom (as `.hero-template` there) and keeps a 32px top, where live has 1rem on the hero and 2rem on the container. The stacked (vertical) image card is capped at 960px and 16:9 so it does not fill the 1280px container (live caps the image at 680px).
72. Webflow media queries (991px, 767px, 479px) → container queries on the section at 991px and 479px (767px has no change on these components except a 1rem gap, folded into the 991px layout).
73. Left out, as off by default in Webflow: the second button, the G2 rating row (avatar, stars, "4.8 Based on 1000 reviews") and, on the vertical component, the breadcrumb (origin, delineator, current page). Each is a boolean prop, so Growth keeps them in Webflow; adding them to the DS needs the requester's call.
74. The headline is an `h1` in both components, as in Webflow; a page with a second hero should demote it.

### Pricing (Untitled UI pricing sections, for the Webflow Pricing page) — added with DESY-229
75. Untitled UI dark and purple surfaces (Primary dark badge, the Most popular banner, the Large table 02 outline) → Vivid Pink surfaces (`--aha-color-primary`, `--aha-bg-accent`); there is no dark marketing surface in the colour rules.
76. Untitled UI's green ticks → the DS check glyph (`system-check`) in Vivid Pink, and dashes → `system-minus`, so the table meaning is carried by shape plus hidden text, not colour; the colour rules give status no green.
77. The hand-drawn curved "Most popular!" arrow → a Vivid Pink label with the DS `system-arrow-down` glyph (the DS has no curved arrow; logged as a missing asset).
78. Untitled UI's Monthly/Annual switch → the DS Segmented control with the DS Tag for "Save 33%"; Yearly is selected first. A toggle is shown only where the Untitled UI original has one (the two large tables and seven of the twelve single-plan styles; the Abstract angles style uses the DS Switch); the eight card layouts show fixed prices.
79. The plan card in every layout is the new Pricing card of the Cards page (marketing radius, `--aha-*` tokens); Untitled UI shadows, radii, greys and Inter type are not carried over.
80. Phones: the comparison tables become one block per plan (name, price, button, grouped Feature and Included rows, button), as in Untitled UI; Untitled UI has no sticky header and none is added. Row values follow the DS Table (60 px rows, divider only, no zebra, grey hover) where Untitled UI shades alternate rows.
81. The Large table 02 range is a two-thumb size picker that leaves prices unchanged, as in Untitled UI; the DS has no framework-free Slider, so it is native range inputs on DS token values (DSN-953). The comparison table itself has no framework-free DS component (DSN-954); the Button has no link form and the DS has no border-width token (DSN-955). The Abstract angles art becomes a flat Vivid Pink band.
82. Plan names, prices (Free $0, Essential $8 yearly or $12 monthly, Pro $16 or $24, Enterprise custom), periods and features are sample content for Growth to replace in Webflow.

## Mobile gutter and button spacing (DESY-312)

Consumer to update: the live Webflow sections still use their own side padding (32px at 479px and 991px in several sections) and button gaps (16px, 24px, 40px). Growth must move them to the DS page gutter (64px desktop, 24px at 767px and below, 16px at 479px and below) and the two button steps (32px under its own text, 24px at 479px; 48px for a closing call to action, 32px at 479px) until then the DS and live differ.
