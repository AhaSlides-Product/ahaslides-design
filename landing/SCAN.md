# Landing scan — what the live AhaSlides marketing site actually uses

> Scanned 2026-09-14 from the live Webflow-authored homepage (current A/B variant `home-2`):
> `https://ahaslides.com/homepage-test-july-2026/home-2/` (prod `https://ahaslides.com/` is byte-identical).
> Webflow inlines its CSS, so the design language was read from the page's inlined rules and CSS
> custom properties (`--_color---*`, `--_spacing---*`, `--_typography---*`). The only external
> stylesheet is Phosphor icons. This grounds the landing basics in what is genuinely shipped.

The locked decisions (this thread): **Webflow stays the builder that CONSUMES our tokens**, and
**Webflow components must FOLLOW the DS definitions**. So where the live page and the DS disagree,
**the DS value wins** and the difference is logged below as a *Webflow-to-update* item — never
silently reconciled to the Webflow value.

## What the live site uses

### Type
- **Primary family: `"Plus Jakarta Sans", sans-serif`** — the dominant family across the page.
  Matches DS `--aha-font-product` exactly.
- Weights seen: 400 (body), **500 (links)**, 600/700 (headings). System-ui fallback stack elsewhere.
- Text colours: heading `#11011f`, base `#1a1a2e`, most-frequent body `#1e293b` (slate-900-ish),
  secondary `#8a8a8a`, muted `#64748b` / `#475569`.

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

### Section container
- Full-bleed background band, centred content column, `max-width:1280px`, section padding-y ~64px,
  padding-x ~32px. This is the concrete pattern the `section-container` block encodes.

### Buttons
- `.btn` = `background:#6a1ebb; border-radius:8px; color:#fff; box-shadow:0 2px 5px #0003`.
- `.button-pink` = pink-bold background, base(white) text.
- Delta: the raw `box-shadow:0 2px 5px #0003` is an ad-hoc shadow → *Webflow-to-update* to the DS
  `--aha-button-elevate-primary` elevation token. Colour, radius and text already match the DS Button.

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
2. Bold pink `#ff4081` → nearest DS pink token (pink hover `#ff6996` already matches `--aha-pink-50`).
3. Off-scale radii `10px`/`14px` → DS scale `12`/`16`.
4. Ad-hoc button shadow `0 2px 5px #0003` → DS `--aha-button-elevate-primary`.
5. Link weight `500` → DS `--aha-weight-semibold` (600).

Everything else the live site uses is already on the DS foundations, so the landing basics below
bind to `--aha-*` tokens with no new brand source.
