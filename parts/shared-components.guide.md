# Shared components — composition guide

> Seeded from the `aha-design-shared-components` plugin skill (aha-design v1.80.0). Every primitive
> that skill registered now ships **here** as a DS export, so this page is the registry: for each
> need, the component to reuse and the contract it already keeps. The binary judge criteria live in
> `anti-slop/criteria.json` → `surfaces.shared-components` (C1–C4).

A fresh-but-correct reimplementation still fragments the design system. A hand-rolled
`<div aria-live>` unmounts while empty and misses the announcement; a red `<span>` under an input has
no id to describe the field; a width-% bar has no role, value or name. Reach for the primitive.

## The registry

| Need | Reuse | Contract it keeps |
| --- | --- | --- |
| Field / validation error (forms) | `<aha-field-error>` | stable `id` for `aria-describedby`, danger text, renders nothing when empty |
| Field error (respondent renderers) | `<aha-field-error variant="respondent">` | `role="alert"` + `aria-live="assertive"` (the FieldErrorDisplay contract) |
| Screen-reader announcement | `<aha-live-region>` | assertive + atomic, stays mounted when empty, no `role="alert"`; `announce()` re-announces |
| Announced progress | `<aha-progressbar>` | host `role="progressbar"` + `aria-valuenow/min/max` + `aria-label`, drawn by `<aha-progress>` |
| Shape switch below 768px | `useIsMobile()` · `<aha-viewport-switch>` | one breakpoint, `(max-width: 767.98px)` |
| Full-page error | `<aha-error-page code>` | code → DS Result + copy, `role="alert"`, `error-page-view` telemetry |
| Empty state | `<aha-empty>` | says what is missing, one next step |
| Loading placeholder | `<aha-skeleton>` | mirrors the real layout, inside a `role="status"` `aria-busy="true"` container |

## Field errors

- **Pick the variant by context.** The default form variant is the a11y FieldError: a stable id,
  danger text, nothing rendered while `message` is empty. `variant="respondent"` is the
  FieldErrorDisplay contract for respondent element renderers — `role="alert"`, assertive.
- **Wire both halves.** The input sets `aria-invalid="true"` and `aria-describedby="<error id>"`. A
  DS `<aha-input>` does both: `status="error"` sets `aria-invalid` on its field, and it forwards its
  `aria-describedby` to the inner input (an id cannot cross a shadow root by itself).
- **Pass the translated string** as `message`. Say what is wrong and how to fix it — "Enter an email
  address, like name@example.com", not "Invalid".

```html
<aha-input id="email" status="error" aria-describedby="email-error"></aha-input>
<aha-field-error id="email-error" message="Enter an email address, like name@example.com"></aha-field-error>
```

## Announcements

- Mount **one** `<aha-live-region>` near the app root and keep it mounted, even while empty.
  Assistive tech must already be watching a region when its text changes.
- It is assertive + atomic by default and has **no** `role="alert"` (that would read the text twice).
  Use `politeness="polite"` for news that can wait.
- `announce(text)` clears, then writes on the next tick, so the same message announced twice is
  heard twice.

## Progress

- A bar a screen-reader user needs to hear is `<aha-progressbar>` — your real `value` / `min` /
  `max` and a `label`; add `value-text` when the raw number is not what a person would say
  ("Question 3 of 10").
- Plain `<aha-progress>` stays for a decorative bar that sits beside its own visible numbers.

## Responsive shape switches

- **Shape** changes (table → card list, sidebar → drawer) are gated on `useIsMobile()` in React
  (`@ahaslides-product/design/use-is-mobile`), the `./viewport` store elsewhere, or
  `<aha-viewport-switch>` with `slot="mobile"` / `slot="desktop"` in plain HTML.
- **Styling** changes use `@media (max-width: 767.98px)` directly — never the hook, never `768px` or
  `767px` (the `.98` avoids a sub-pixel gap at fractional device-pixel ratios).

## Full-page errors, empty states, loading

- A page that cannot render is `<aha-error-page code="404|403|500|offline">`. The default copy names
  what failed, gives a cause and a next step; pass translated `heading` / `body` / `action-label` to
  override. Listen for `error-page-view` (telemetry) and `action` (retry / navigate).
- No content is **not** an error: use `<aha-empty>` with one next step.
- Loading is `<aha-skeleton>` blocks that mirror the layout they stand in for, inside a container with
  `role="status"` and `aria-busy="true"` — never a lone spinner or a grey box shipped as final.

## Text and colour

- Visible text uses the DS text components (or AntD `Typography` in React), not raw `<span>` / `<p>`.
- Never convey state by colour alone — pair every status colour with text or an ARIA label.
