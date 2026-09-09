# Status badges — composition guide

> The design system now OWNS this build ruleset — it is the single source of truth,
> and the `aha-design-status-badges` plugin skill is generated FROM this pattern. The
> skill keeps the rationale, worked BAD/GOOD examples, and the judge verdicts / evals
> (`aha-design-status-badges-judge`); this guide is the shippable checklist. When the
> two ever disagree, this pattern wins and the skill is regenerated.

A status pill communicates the **lifecycle state of a domain object** — a survey,
presentation, or collector — in one glanceable, screen-reader-announced token. Its
canonical form is the `StatusBadge` component and the `aha-status-pill` class family
(`features/dashboard/StatusBadge.tsx`). This pattern adds no new control; it defines
the **markup, class, i18n and accessibility conventions** that keep every state
indicator reading as one product.

**Companion skills.** Use `aha-design-icons` for any glyph rendered beside a status,
the `aha-branding:*` colour skill for the semantic colour each state maps to, and
`aha-design-paywall` for the crown badge (that is upsell, not status).

## When to use a status pill

Use it to reflect a value from a known **status enum** (e.g. `SurveyStatus`: draft /
published / closed / archived). Do **not** use it for:

- free-form labels,
- counts, or
- notification dots.

Those are AntD `Badge` / `Tag` territory, not a status pill. *(STATUS-01)*

## Anatomy

A status pill is a single inline element containing exactly two parts, in order:

| Part | Class | Role |
| --- | --- | --- |
| **Dot** | `aha-status-pill__dot` | carries the state colour; decorative only |
| **Label** | — (text node) | the localised label text; the source of truth |

```tsx
<span
  className={`aha-status-pill aha-status-pill--${status}`}
  aria-label={label}
  role="status"
  data-testid={`status-badge-${status}`}
>
  <span className="aha-status-pill__dot" />
  {label}
</span>
```

*(STATUS-02)*

## Class convention

- Base class `aha-status-pill` plus a **modifier per state**: `aha-status-pill--{status}`.
- The modifier — **not** an inline style or a one-off prop — controls the colour of the
  pill and its dot. This keeps every state's colour in one stylesheet and on semantic
  tokens.
- **Never** set the colour inline with a hardcoded hex. *(STATUS-02, STATUS-03)*

## Labels come from i18n

- The label is always `t(\`survey_status.${status}\`)` — or the equivalent namespace for
  the object. **Never hardcode** the visible string.
- Adding a new state means adding **both** a translation key **and** a `--{status}`
  modifier class. Neither alone is complete. *(STATUS-03, STATUS-04)*

## Accessibility

- `role="status"` and an `aria-label` **equal to the visible label**, so the state is
  announced and not conveyed by colour alone.
- The dot is **decorative** — the text label is the source of truth, never the dot
  colour by itself. State is never conveyed by dot colour alone; the text label is
  always present. *(STATUS-05, STATUS-06)*

## Build checklist

| # | Rule | Ref |
| --- | --- | --- |
| 1 | Renders only for a known status enum — not free-form labels, counts, or notification dots | STATUS-01 |
| 2 | Markup is `aha-status-pill` + `aha-status-pill--{status}`, with a dot span and a text label | STATUS-02 |
| 3 | Colour is driven by the `--{status}` modifier class — no inline/hardcoded hex | STATUS-03 |
| 4 | The visible label is sourced from i18n (`t('<namespace>.<status>')`), never a hardcoded string | STATUS-04 |
| 5 | The element carries `role="status"` and an `aria-label` matching the visible label | STATUS-05 |
| 6 | State is not conveyed by dot colour alone — the text label is always present | STATUS-06 |

---

*Full rationale, screenshots, and worked examples live in the `aha-design-status-badges`
skill. Self-check any built pill with `aha-design-status-badges-judge` and fix every FAIL
before shipping.*
