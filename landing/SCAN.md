# Landing scan — what the live AhaSlides marketing site actually uses

> Scanned 2026-09-14, re-scanned 2026-09-15 (round 3, Buttons + Fonts; round 4, Section container —
> see those sections for each deep pass) from the live Webflow-authored homepage (current A/B variant
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

| Property | Live Webflow (`--_spacing---section-*`, root + `≤991px`) | DS token / `landing/section-container.json` | Verdict |
|---|---|---|---|
| Content max-width | `--_spacing---max-width:1280px` (unchanged at every breakpoint seen) | `--aha-breakpoint-desktop` `1280px` | **exact match** |
| Section padding-x (desktop, `>991px`) | `--_spacing---section-p-x:2rem` = `32px` | `.aha-section` padding-x clamps `16px`&rarr;`32px` (`--aha-space-16`&rarr;`--aha-space-32`), capping at `32px` from ~`800px` viewport up | **match at the cap** |
| Section padding-x (`≤991px`) | `--_spacing---section-p-x:1rem` = `16px` | same clamp floors to `--aha-space-16` (`16px`) below ~`400px` viewport | **match at the floor** — round-4 fix: the floor was `--aha-space-20` (`20px`), one token off the live `16px` mobile value; corrected to `--aha-space-16` |
| Section padding-y (every breakpoint) | `--_spacing---section-p-y:4rem` = `64px`, **flat** — Webflow never reduces it on mobile | `.aha-section` padding-y clamps `48px`&rarr;`96px` (`--aha-space-48`&rarr;`--aha-space-96`) | **deliberate DS-wins delta** — Webflow ships one fixed value at every width; the DS landing register instead scales the band fluidly (per this repo's house responsiveness rule: bind to a fluid range, never a fixed pixel), giving less vertical padding on a phone and more on very large screens. Not logged as *Webflow-to-update*: it is a responsiveness improvement, not a correction of a wrong Webflow value. |
| Soft band background | `.x-compact-section.bg-purple{background-color:var(--_color---bg--purple-soft)}` = `#f9f5ff` | `.aha-section--soft{background:var(--aha-purple-10)}` = `#F9F5FF` | **exact match** (already logged under Colour, above) |
| Dark band | not present on the current live homepage variant — no section on the page uses a dark/inverse background | `.aha-section--dark{background:var(--aha-bg-dark);color:var(--aha-icon-inverse)}` | **no live counterpart to check** — kept as a DS-provided variant (a high-contrast closing band is a reasonable marketing pattern even where this particular page doesn't use one yet); not a delta since there is no live value to disagree with |
| Section title font (h2 in the block's markup) | n/a — the live page's own headings all render in the body face, `"Plus Jakarta Sans"` (see Type, above; item 15 in Webflow-to-update) | was `--aha-font-display` (Nunito) | **DS-internal bug, fixed this round** — the locked round-3 Fonts decision reserves `--aha-font-display` for Display/H1 only; H2/H3 stay on the body face (`landing/fonts.json` `.aha-type__h2` carries no family override). `section-container.json` predates that decision (written in round 5 of PRO38-14, before the round-3 Fonts deep pass) and still forced its `<h2>` title onto the display face. Removed the override so the title inherits `--aha-font-product` from `.aha-section`, matching `fonts.json`'s own H2 treatment. |
| Section title line-height | n/a (see Type, above: heading-large `129%` &asymp; DS `--aha-line-height-heading` `1.3`) | was `--aha-line-height-tight` (`1.2`, the H1/Display line-height) | **DS-internal bug, fixed this round** — same drift as the font-family: the title is an H2, so it should carry `--aha-line-height-heading` (`1.3`, what `fonts.json`'s `.aha-type__h2` uses), not the tighter H1/Display value. Corrected. |
| Section eyebrow/lead type | eyebrow: size-sm/semibold/uppercase/primary-colour; lead: size-l/body line-height/secondary colour | unchanged, already token-bound and matching the `hero.json` eyebrow/lead treatment | **match** — no change |

**Verdict: the block already matched the live geometry (max-width, padding cap, soft-band colour) with
no drift; the two genuine findings were internal** — a stale font-family/line-height pair left over from
before the round-3 Fonts decision locked H2 onto the body face, and a one-token-off mobile padding-x
floor. Both fixed in `landing/section-container.json` this round; no new *Webflow-to-update* items — the
live site's own geometry already agrees with the DS token values wherever a live counterpart exists.

### Buttons — re-scanned 2026-09-15 (round 3): the real buttons on the page are `.btn.is-pink`
(primary CTA — "Get started", "Sign up", "Try it now") and `.btn.is-secondary` ("Log in", "See our
pricing"), layered over a `.btn` base. `.button`/`.button-pink` are separate, unrelated classes:
`.button-pink` is unused on this page (sitewide leftover CSS); `.button.topbar-btn` is the small
promo-bar "Join" pill — a nav micro-utility outside the marketing CTA register, not reconciled here.

| Property | Live Webflow (`.btn.is-pink` / `.btn.is-secondary`) | DS token / landing/button.json | Verdict |
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

Everything else the live site uses is already on the DS foundations, so the landing basics below
bind to `--aha-*` tokens with no new brand source. Sizes, line-heights and letter-spacing for type
are a genuine 1:1 match with the DS scale (see Type, above) — no action needed there.
