# Overlays — composition guide

> Distilled from `aha-design-overlays`. The DS now **owns this build ruleset** — it is
> the single source of truth for how an overlay is constructed, and the plugin skill is
> generated from it. The rationale, worked examples, and the judge/evals stay in the
> skill; this guide is the shippable checklist. When the two ever disagree, regenerate
> this file from the owning ruleset.

Overlays — modals, drawers, popovers — are transient surfaces layered over the page, and
they are where a stray backdrop click can destroy data. They reuse existing components —
the shared Button, the `AhaAlert` banner, `useIsMobile()` — so this pattern adds no new
control; it defines the **house rules** that keep dismiss behaviour, state reset, and
error handling consistent and safe across every AhaSlides product surface. Overlays are
built on AntD v6 `Modal` / `Drawer` / `Popover`.

## Pick the surface first

| Surface | Use for |
| --- | --- |
| **Modal** | A focused decision or short flow that should block the page — confirmations, destructive actions, one-time config |
| **Drawer** | A detail view or medium-complexity panel that supplements the page without fully replacing it — a record's report, distribution settings |
| **Popover** | A small, anchored, contextual snippet — quick info, a compact input, an upsell. **Not** for multi-step flows |

## Dismiss behaviour (safety-critical)

- **Destructive overlays MUST NOT dismiss on outside/mask click.** Set `mask={{ closable: false }}` on the Modal. Keep `keyboard` (Esc) and the X button as the only dismiss paths, so a stray backdrop click can't trigger destruction.
- Non-destructive overlays **may** allow mask-close.
- While an async action is in flight (`busy`), **disable cancel and suppress `onCancel`/`onClose`** so the user can't dismiss mid-operation.

## State reset

- Always set `destroyOnHidden` (Modal) / `destroyOnClose` (Drawer) so transient state — form input, error text, busy flag — resets between opens.
- On open, also clear local error and busy state explicitly — don't rely on unmount alone if the instance can stay mounted.

## Drawer conventions

- Default `placement="right"`.
- **Responsive width:** `width={isMobile ? '100%' : 720}` via `useIsMobile()` — full-bleed on mobile, fixed panel on desktop. Do not gate this through CSS; the width is a prop.
- Put navigation/actions (prev/next, retry, position indicator) in the drawer `footer`.
- Use `styles={{ body: { padding: 0 } }}` when the body renders its own padded content.

## Modal conventions

- For confirmations, the **title is a question** — "Delete this survey permanently?".
- Destructive confirm button: `okButtonProps={{ danger: true, loading: busy }}` — the danger styling lives on the **action button, never the title or body**.
- Disable cancel while busy: `cancelButtonProps={{ disabled: busy }}`.

## Async confirm pattern

`onConfirm` returns a promise. The overlay:

1. **Guards re-entry** (`if (busy) return`), sets `busy`, clears prior error.
2. `await`s the action.
3. On **rejection**, **stays open** and surfaces the error inline (see below), then clears `busy`.
4. On **success**, the caller closes the overlay.

Never close a destructive overlay before its action resolves, and **never fire-and-forget**.

## Errors stay inline

- Surface failures **inside** the overlay with an inline **DS V3 Alert** (`AhaAlert type="error"` — the banner component and its styling are owned by `aha-design-feedback`; do **not** drop in a bare AntD `<Alert>`). This pattern owns *where* the error goes (inline, in the overlay); feedback owns *what it looks like*.
- **Never** stack a second modal on top, and **never** downgrade the error to a transient toast.
- The overlay **remains open on failure** so the user can retry without re-opening.

---

*Full detail, the `DeleteSurveyConfirmModal` / `RespondentReportDrawer` references, and the
`OVERLAY-01..08` assertions live in the `aha-design-overlays` skill. Self-check any built
overlay with `aha-design-overlays-judge` and fix every FAIL before shipping.*
