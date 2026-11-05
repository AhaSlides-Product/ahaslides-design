# Paywall — composition guide

> This is the authoritative build ruleset for plan-gated / upsell UI, now OWNED by the
> design system as the single source of truth — the DS `paywall` guide is
> generated FROM this file. The skill still holds the narrative rationale, the worked
> BAD/GOOD examples, and the PASS/FAIL judge evals (the DS anti-slop judge, `paywall` surface); when the
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
| **Crown beside its own button** | A locked control that keeps its own place and look (a locked setting, a card's button) and cannot be wrapped: the crown sits beside it and the control's click opens the same popover through `toggleLockedPaywall` |
| **`locked` row in a Dropdown** | A plan-gated action in an `<aha-dropdown>` menu: set `locked:true` (plus `plan`, `featureKey`, `upgradeBody`) on the item and the dropdown shows the crown and opens this Paywall beside the row; never wrap a menu row in your own popover |
| **`onUpgrade` handler** | Upgrading inside the app instead of the pricing page — analytics still fires first |

**Scope:** any surface where a feature is locked behind a paid plan — editor affordances,
share/distribution options, results features, dashboard actions.

## Always the shared component

Do not hand-roll an upgrade prompt, tooltip, or modal for monetisation. Wrap the gated
affordance in `<Paywall>`, use `<PaywallCrownBadge>` as the anchor when the feature has
no natural anchor of its own, or keep the control's own button with the crown beside it. A bespoke upsell drifts from the presenter app and breaks the
single-source-of-truth contract. *(`PAYWALL-01`)*

## Anatomy — three stacked parts

A paywall popover, top to bottom, is always:

1. **Header** — the Vivid Pink circular **custom CrownBadge** (16×16 SVG) followed by the
   **feature label**. Never the generic Phosphor Crown — it lacks the circular background.
2. **Body** — a one-sentence value prop, then the line **"Unlock with the _\<Plan\> plan_."**
   (plan name bold).
3. **Footer** — the shared `<aha-button>` **Upgrade** CTA (positive), alone by default. **See all
   plans** (secondary) is opt-in: set `show-plans` to add it beside Upgrade.

No further buttons, no dismiss link, no multi-paragraph body inside the popover. *(`PAYWALL-02`, `PAYWALL-03`, `PAYWALL-04`)*

## Props contract

| Prop | Rule |
| --- | --- |
| `featureKey` | Stable `snake_case` token (e.g. `custom_survey_url`). Drives analytics + DOM hooks. **Required.** |
| `featureLabel` | Short noun phrase shown next to the crown. **Required.** |
| `body` | One sentence describing what unlocks. **Required.** |
| `requiredPlan` | `'essential'` or `'pro'`. Defaults to `'pro'`. Drives the unlock line + analytics plan prop. |
| `placement` | Popover side: `'top'` (default), `'bottom'`, or `'left'` / `'right'` (beside the anchor, vertically centred). In a viewport too short for above or below, such as a report iframe, `fitPaywall` sits it beside the anchor, then scrolls it inside the taller side. |
| `width` | Popover outer width, padding included, for longer copy; defaults to 300px, never past 82vw. |
| `slot="body"` | Optional rich body: the same one sentence when it needs a link or emphasis. Replaces `body`; the unlock line and CTAs stay fixed. Slot a link directly (`<a slot="body">`) so it reads white on the dark surface. |
| `unlock-label` | Optional. The whole unlock line in the user's language; `{plan}` becomes the bold plan name. |
| `plan-label` | Optional. The displayed plan name ("Pro plan" by default), for translation. |
| `mark-label` | Optional. The accessible name of the crown upgrade mark ("Upgrade required. See details" by default), for translation. Applies only when the mark is the anchor. |
| `show-plans` | Optional boolean, off by default. Adds the secondary **See all plans** button beside Upgrade; without it the button is hidden and the footer is Upgrade alone. |
| `plans-label` / `plans-url` | Optional. The See all plans label and destination; they apply only with `show-plans`. |
| `trigger` | `'click'` (default) or `'hover'`. |
| `onUpgrade` | Optional. Runs *instead of* opening the pricing page (e.g. an in-app upgrade modal). Analytics still fires first. |

*(`PAYWALL-05`, `PAYWALL-07`)*

## Copy rules

- **Feature label:** short noun phrase, the name of the locked feature. Not a sentence.
- **Body:** exactly one sentence, describing the *benefit* of unlocking — not "This is a Pro
  feature." Ends with a period.
- **Unlock line:** fixed format in English — "Unlock with the **\<Plan\> plan**." Do not reword it
  in place. A translated product passes `unlock-label` with a `{plan}` token (for example
  `unlock-label="Mở khoá với gói {plan}."`) and, to translate the plan name, `plan-label`; the crown mark's accessible name is `mark-label`.
- **CTA:** "Upgrade" by default; keep it a verb. Override via `ctaLabel` only with a clear reason.

*(`PAYWALL-03`, `PAYWALL-04`)*

## Analytics contract

The upsell funnel's denominator and conversion — never gate a feature without both events:

- **`PAYWALL_SHOWN`** fires when the popover opens — props `{ feature: featureKey, plan: requiredPlan }`.
- **`PAYWALL_UPGRADE_CLICKED`** fires when the CTA is clicked — same props — **before**
  navigation or `onUpgrade` runs.
- **`paywall-plans`** fires when See all plans is clicked, only when `show-plans` is set — same props.

*(`PAYWALL-06`)*

## Behaviour

- The default CTA opens `UPGRADE_URL` (`https://ahaslides.com/pricing`) in a new tab
  (`noopener,noreferrer`) and closes the popover.
- When `onUpgrade` is provided, it runs instead (analytics still fires) and the popover closes.
- Escape closes the popover first, before any host handler: a drawer or modal around it never sees that key press, so the popover cannot be left floating after its host closes. It returns focus to the element that opened the popover, falling back to the anchor when that element is gone or refuses focus. `close()` is for a host closing the popover from code; it leaves focus alone when no opener was recorded and focus is not inside the popover. Click-away and the CTAs close without moving focus.
- The anchor is wrapped in a `<span>` so children don't need to forward refs.

## Visual

- Dark grey surface (`--aha-bg-dark-raised`, `#303030`), 300px outer width, padding included (opt-in `width`), 16px padding, 12px radius.
- The crown badge is the Vivid Pink circle custom SVG — do not substitute a glyph; it lacks the
  circular background.

## Crown-badge-only anchor

When a feature has no natural clickable anchor (e.g. a field label), use
`<PaywallCrownBadge>` as the visible anchor (`<aha-paywall>` with no slotted child). The mark is a
real focusable `<button>` with an accessible name (default "Upgrade required. See details";
`mark-label` translates it). *(`PAYWALL-02`, `PAYWALL-08`)*

## Crown beside its own button

When a locked control keeps its own place and look and cannot be wrapped (a locked setting, a
button in a card), the control stays outside `<aha-paywall>`. Set the crown mark beside it and send
the control's click to the same popover, so the crown and the button open one upsell:

```js
import { toggleLockedPaywall } from '@ahaslides-product/design/aha-paywall';

button.addEventListener('click', (event) => toggleLockedPaywall(crown, event));
```

- **`toggleLockedPaywall(paywall, event)`** works from any control, not only a disabled one: an
  enabled button, a whole row, or the wrapper of a disabled control (a disabled control fires no
  click of its own, so listen on its wrapper, as `<aha-setting-row>` does). Call it in the click
  listener: it stops the native click, fits the popover to the room around the crown, and records
  the focusable control on the click's path, up to the listener, as the opener. Escape and
  `close()` return focus there. React handles clicks at the root, so a parent `onClick` still
  fires: call `event.stopPropagation()` on the React event too.
- **`togglePopover({ source })`** is the same toggle from code. `source` is the element focus
  returns to, read only when opening. Use it directly only when there is no click event to pass.

*(`PAYWALL-01`, `PAYWALL-08`)*

---

*Full detail, worked examples and the rationale live in the DS `paywall` guide;
popover/placement mechanics are owned by the `overlays` guide. Self-check any built surface
with the DS anti-slop judge (`paywall` surface) and fix every FAIL before shipping.*
