# Feedback — composition guide

> The design system now OWNS this build ruleset — it is the single source of truth for how
> AhaSlides feedback surfaces are constructed, and the `aha-design-feedback` plugin skill is
> generated FROM this artifact. The judge criteria and evals stay in the skill
> (`aha-design-feedback-judge`); when the two ever disagree on construction, this file wins.

"Feedback" means any non-blocking signal that an action happened or how it turned out: transient
confirmations (toasts), inline banners (the DS V3 Alert), in-context result feedback
(correct/incorrect), and satisfaction prompts (CSAT) — **not** field-validation errors or blocking
dialogs. These surfaces reuse existing components — Icon, the semantic `--aha-color*` tokens — so
this pattern adds no new control; it defines the **conventions** that keep every feedback surface
reading as one product.

## Pick the surface first

| Surface | Use for |
| --- | --- |
| **Toast** (fixed bottom-right pill) | A transient, non-actionable confirmation that auto-dismisses (~3s) |
| **Alert** (inline banner) | A persistent, in-context message the user may need to act on; stays in layout |
| **Inline result panel** (correct/incorrect) | In-place result feedback shown after an answer |
| **CSAT thumbs widget** | A satisfaction (thumbs up/down) prompt with an optional follow-up |

## Toasts (transient confirmations)

- Use a toast only for a **transient, non-actionable confirmation** ("Thanks for your feedback", "Copied").
- Position: a small fixed pill at the **viewport bottom-right**; it rises up from below so it never shifts surrounding layout.
- **Auto-dismiss after ~3s** (the cross-product convention); **clear the timer on unmount**.
- Carry `role="status"` so it is announced without stealing focus.
- **Portal to `document.body`** via `createPortal(node, document.body)`. A `position: fixed` toast is clipped by any ancestor that establishes a containing block (`transform`, `filter`, `backdrop-filter`, `will-change`); portalling keeps it truly viewport-fixed from every mount point.
- For ordinary app-level success/info toasts, prefer AntD's `message` / `notification` APIs; reach for the bespoke fixed pill only when you need the specific bottom-right placement and custom content.

## Alert (inline banner)

The **Design System V3 Alert** — an inline banner for feedback that stays in the layout (unlike a toast). Full spec, tokens, size metrics, and Figma node IDs live in the skill's `references/alert.md`.

- **Do not ship a bare AntD `<Alert>`.** It cannot express the DS `branding` type, the `regular`/`small` sizes, the DS surface/border tokens, or the DS system glyphs. Build the thin `AhaAlert` wrapper the reference specifies.
- **Five types**, each with its own DS `bg-surface` / `border` / `icon` token **and a distinct glyph** — colour is never the only signal:

| Type | Glyph |
| --- | --- |
| `success` | check-circle |
| `error` | x-circle |
| `info` | info-circle |
| `warning` | warning-triangle |
| `branding` | lightbulb |

- **Two sizes:**

| | Regular | Small |
| --- | --- | --- |
| Padding | 12 vertical / 16 horizontal | 8 all sides |
| Border radius | 8 | 4 |
| Text size | 14 | 12 |

- **Font weight — 400 and 600 only.** Plus Jakarta Sans 400 (Regular) for the message and inline link; 600 (SemiBold) for the optional title. No 300 / 500 / 700 — snap any other weight to the nearest (title → 600, body → 400).
- **Heading is sentence case** — capitalize the first letter only (plus proper nouns). Never Title Case, never ALL CAPS.
- The spec is **token/role based**, so it applies unchanged to AntD, Vue, or plain CSS — wire the DS `--p-color-*` tokens onto whatever token layer the target app uses.
- **Alert vs toast:** use an Alert for a **persistent, in-context** message the user may need to act on; use a toast for a transient auto-dismissing confirmation.

## Inline post-action feedback (correct/incorrect)

For result feedback shown in place after an answer:

- `role="status"` with `aria-live="polite"` (it's informational, not urgent).
- Colour the container with **semantic tokens**: border `var(--aha-colorSuccess)` / `var(--aha-colorError)` and background `var(--aha-colorSuccessBg)` / `var(--aha-colorErrorBg)`. **Never hardcode hex.**
- Lead with a strong correct/incorrect label; show the correct answer and any explanation below when incorrect.
- Expose stable `data-*` hooks (`data-correct`, `data-element-id`) for testing.

## CSAT (satisfaction) prompts

- Use the shared **`Csat`** widget — a binary thumbs rating with an optional follow-up on thumbs-down. **Do not build a bespoke rating control.**
- Pass a **required `source`** token from the closed `CsatSource` union (one per placement) so Mixpanel sees a stable, typo-proof segmentation. Add a union member when adding a placement.
- It emits `CSAT_SHOWN` (once per mount — the response-rate denominator), `CSAT_RATED`, and `CSAT_FEEDBACK_SUBMITTED`. Tracking is **best-effort**: a throwing/uninitialised `track()` must never break rendering or block the thank-you toast.

## When NOT to use a toast

| Situation | Use instead |
| --- | --- |
| Error the user must act on | Inline **Alert** banner in context (or an overlay Alert) |
| Field validation error | `FieldErrorDisplay` / a11y `FieldError` (shared-components) |
| Destructive confirmation | A modal (`aha-design-overlays`) |
| Full-page failure (not found, expired) | `ErrorPage` (shared-components) |

A toast that auto-dismisses must never be the only place a required message lives.

---

*Full detail, the complete `references/alert.md` spec (tokens, size metrics, Figma node IDs), and
all `FEEDBACK-xx` assertions live in the `aha-design-feedback` skill. Self-check any built surface
with `aha-design-feedback-judge` and fix every FAIL before shipping.*
