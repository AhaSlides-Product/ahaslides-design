# Paywall — composition guide

> This is the authoritative build ruleset for plan-gated / upsell UI, now OWNED by the
> design system as the single source of truth — the `aha-design-paywall` plugin skill is
> generated FROM this file. The skill still holds the narrative rationale, the worked
> BAD/GOOD examples, and the PASS/FAIL judge evals (`aha-design-paywall-judge`); when the
> two ever disagree, this artifact wins and the skill is regenerated.

Every pro-gated affordance routes through ONE shared `Paywall` popover
(`features/paywall/Paywall.tsx`), which mirrors the Presentation app's `UpgradePopover`
so the two products feel like one. When monetisation expands, only this component and the
upgrade URL evolve — never a second hand-rolled upsell. This pattern adds no new control;
it composes a popover, the custom crown badge, an Icon and a Button, and defines the
**conventions** that keep every upsell reading as one product.

## Pick the anchor first

| Surface | Use for |
| --- | --- |
| **Paywall popover on the affordance** | A locked control/action that already has its own clickable anchor |
| **`<PaywallCrownBadge>` as the anchor** | A feature with no natural clickable anchor (e.g. a field label) |
| **`onUpgrade` handler** | Upgrading inside the app instead of the pricing page — analytics still fires first |

**Scope:** any surface where a feature is locked behind a paid plan — editor affordances,
share/distribution options, results features, dashboard actions.

## Always the shared component

Do not hand-roll an upgrade prompt, tooltip, or modal for monetisation. Wrap the gated
affordance in `<Paywall>`, or use `<PaywallCrownBadge>` as the anchor when the feature has
no natural anchor of its own. A bespoke upsell drifts from the presenter app and breaks the
single-source-of-truth contract. *(`PAYWALL-01`)*

## Anatomy — three stacked parts

A paywall popover, top to bottom, is always:

1. **Header** — the purple circular **custom CrownBadge** (16×16 SVG) followed by the
   **feature label**. Never the generic Phosphor Crown — it lacks the circular background.
2. **Body** — a one-sentence value prop, then the line **"Unlock with the _\<Plan\> plan_."**
   (plan name bold).
3. **Footer** — a single full-width (`block`) primary **Upgrade** CTA.

No secondary "View plans" button, no dismiss link, no multi-paragraph body inside the
popover. *(`PAYWALL-02`, `PAYWALL-03`, `PAYWALL-04`)*

## Props contract

| Prop | Rule |
| --- | --- |
| `featureKey` | Stable `snake_case` token (e.g. `custom_survey_url`). Drives analytics + DOM hooks. **Required.** |
| `featureLabel` | Short noun phrase shown next to the crown. **Required.** |
| `body` | One sentence describing what unlocks. **Required.** |
| `requiredPlan` | `'essential'` or `'pro'`. Defaults to `'pro'`. Drives the unlock line + analytics plan prop. |
| `placement` | Popover side. Defaults to `'top'`. |
| `trigger` | `'click'` (default) or `'hover'`. |
| `onUpgrade` | Optional. Runs *instead of* opening the pricing page (e.g. an in-app upgrade modal). Analytics still fires first. |

*(`PAYWALL-05`, `PAYWALL-07`)*

## Copy rules

- **Feature label:** short noun phrase, the name of the locked feature. Not a sentence.
- **Body:** exactly one sentence, describing the *benefit* of unlocking — not "This is a Pro
  feature." Ends with a period.
- **Unlock line:** fixed format — "Unlock with the **\<Plan\> plan**." Do not reword.
- **CTA:** "Upgrade" by default; keep it a verb. Override via `ctaLabel` only with a clear reason.

*(`PAYWALL-03`, `PAYWALL-04`)*

## Analytics contract

The upsell funnel's denominator and conversion — never gate a feature without both events:

- **`PAYWALL_SHOWN`** fires when the popover opens — props `{ feature: featureKey, plan: requiredPlan }`.
- **`PAYWALL_UPGRADE_CLICKED`** fires when the CTA is clicked — same props — **before**
  navigation or `onUpgrade` runs.

*(`PAYWALL-06`)*

## Behaviour

- The default CTA opens `UPGRADE_URL` (`https://ahaslides.com/pricing`) in a new tab
  (`noopener,noreferrer`) and closes the popover.
- When `onUpgrade` is provided, it runs instead (analytics still fires) and the popover closes.
- The anchor is wrapped in a `<span>` so children don't need to forward refs.

## Visual

- Dark indigo surface (`color="#242442"`), 300px wide, 16px padding, 12px radius.
- The crown badge is the purple-circle custom SVG — do not substitute a glyph; it lacks the
  circular background.

## Crown-badge-only anchor

When a feature has no natural clickable anchor (e.g. a field label), use
`<PaywallCrownBadge>` as the visible anchor. It carries `role="img"` and an `aria-label`
(default "Upgrade required"). *(`PAYWALL-02`, `PAYWALL-08`)*

---

*Full detail, worked examples and the rationale live in the `aha-design-paywall` skill;
popover/placement mechanics are owned by `aha-design-overlays`. Self-check any built surface
with `aha-design-paywall-judge` and fix every FAIL before shipping.*
