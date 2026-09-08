# R1 — Canonical token reconciliation

Two "sources of truth" for AhaSlides tokens disagreed. This resolves them into **one** canonical set
(`tokens.canonical.json`) that the generator, feeds, and `design.md` all read.

## The three sources
1. **MEASURED** — `aha-design-component-standard/references/contract.json` — `getComputedStyle` over the real Storybook. *What actually ships.*
2. **EXPORT** — `AhaSlides Design System_extracted/tokens/*.css` — the Figma "Design System V3.fig" Brian handed over; its README calls it *"the sole source of truth."*
3. **SKILL** — `aha-design-antd/references/theme-tokens.md` + `aha-design-typography/references/typography.json` — extracted from a *different* Figma file/frame.

## Precedence (the rule that resolves every conflict)
> **MEASURED > EXPORT (brand/identity) > SKILL (rules/format).**
- **Measured wins for structural values** (radius, control heights, line-height, box sizes) — it's empirical; both token docs have transcription drift.
- **Export wins for brand identity** (font families, palette scales, semantic colour meaning, spacing, elevation) — authored brand decisions, and the stated SoT.
- **Skill wins for rules/format** where it's more correct (line-height as ratios; weights 400/600 only; the h6=18 and tiny=10 roles) — and it fills gaps. Its **Tailwind-neutral bolt-ons and black-alpha text tokens are discarded** (they contradict the export's brand grays).

## Conflict ledger

| # | Dimension | EXPORT | SKILL | Winner | Canonical | Why |
|---|---|---|---|---|---|---|
| 1 | **Label font** | Plus Jakarta only; Inter = "not a brand face, not loaded" | **Inter** for capitalized/small/tiny | **EXPORT** | no Inter; Plus Jakarta | Export is the SoT and explicitly rejects Inter; skill's rule is from another frame |
| 2 | **Weight 500** | defines `--aha-weight-medium:500` | 400/600 only (+700 Display) | **SKILL** | drop 500 | 500 is unused and off-scale |
| 3 | **Line-height** | px (default **22**, xl 28) + bug `tight:8px` | ratios (body **1.5**) | **SKILL+MEASURED** | ratios; body 1.5 (=21@14) | Shipped checkbox measures **21px** = 1.5, not the export's 22; px lh doesn't scale |
| 4 | **radius default** | `default:6`, `lg:8` | `default:8`, `sm:6`, `lg:12` | **MEASURED** | 4/6/**8**/12/16 | Button md / input / modal all measure **r8**; export mislabels default as 6 |
| 5 | **control height (fields)** | specimen 32/36/40 | root **32** (sm24/lg40) | **MEASURED** | root 32; fields 24/32/40 | contract input = 24/32/40; export specimen drifted up a step |
| 6 | **button heights** | md 36 | 28/36/40 (+xl 52) via `components.Button` | **AGREE** | 28/36/40/52 | root stays 32; Button overrides |
| 7 | **body text colour** | solid `#1A1A1A` (warm gray) | `rgba(26,26,46,.88)` (indigo-alpha) | **EXPORT** | `#1A1A1A` | Alpha text is the dark-surface-invisible trap aha-design-antd itself warns of |
| 8 | **borders** | `#E3E3E3` / `#F1F1F1` (brand grays) | `#d9d9d9` / `#f0f0f0` (antd default) | **EXPORT** | `#E3E3E3` / `#F1F1F1` | Brand gray scale, not antd defaults |
| 9 | **Tailwind neutrals** (`#6b7280`, `#111827`…) | — | present (bolt-on) | **EXPORT** | discard | Non-brand; not in the export palette |
| 10 | **Display / Nunito** | Nunito (display), Nunito Sans (secondary) present | omitted | **EXPORT** | keep (marketing/display only) | Product UI = Plus Jakarta; display is branding territory |
| 11 | **h6 = 18 / tiny = 10 roles** | no 18; size-tiny 8 | h6 18, tiny 10 | **SKILL** | add 18 + 10 | Real roles the export omitted |
| 12 | **colors primary/success/warning/error/info** | brand-60 steps | same hex | **AGREE** | as-is | ✓ |
| 13 | **spacing scale** | full 4-based + 6/10/14 | (antd size) | **EXPORT** | export scale | Rich, matches README |

## Open items — need a DS-owner decision (not mechanically resolvable)
1. **`encourage` button greens** (`#2CB268 / #168C4D / #12733F`) live in the export's `semantic.css` but exist in **no** palette scale, and the skill has no "encourage" concept → add green primitives + alias, or drop the variant.
2. **`radius-64`** is off the 4/6/8/12/16 scale; the export README documents an **80px** outlier, not 64 → confirm 80 or remove.
3. **`--aha-lh-tight:8px`** in the export is a broken value (smaller than any font) → discarded here; fix at the export source too.

## Status vs the built POC
The generator (`generate.mjs`) and both component entries **already conform** to this canonical set — radius default **8**, control height **32**, checkbox **14×14 r4** border `#B4BCCF`, solid grays, body line-height **1.5 (21@14)**, no Inter, no weight 500. R1 confirms the grounded layer the POC stands on is the reconciled one; scaling can proceed on it.
