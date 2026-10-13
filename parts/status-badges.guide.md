# Status badges — composition guide

A status badge tells the **state of a domain object** (a survey, a presentation, a
course, a learner) in one glanceable, screen-reader-announced token. Every badge is the
DS element `<aha-status-badge>`; this guide says which look and marker a state takes,
what must never be mixed, and what is not a badge at all.

**Companion guides.** `icons` for the glyph a badge calls by name, the colour rules for
why no status has a hue, and `paywall` for the crown badge (that is upsell, not status).

## The box

One box for every badge: **22px** tall, **8px** side padding, radius **6px**, label
**12px semibold**, **6px** gap. Never override it. *(STATUS-02)*

## Four looks

| Look | Use it for | Background | Label | Dot |
| --- | --- | --- | --- | --- |
| **published** | live, or the successful end state | `--aha-bg-accent` | `--aha-text-link` | `--aha-vivid-pink-100` |
| **closed** | ongoing, or ended normally | `--aha-gray-35` | `--aha-text-default` | `--aha-icon-default` |
| **draft** | not begun, not yet live | `--aha-gray-35` | `--aha-text-tertiary` | `--aha-icon-disabled` |
| **archived** | retired, removed | `--aha-gray-25` | `--aha-text-disabled` | `--aha-icon-disabled` |

No status gets a hue of its own: no green, red, amber or blue. *(STATUS-03)*

```html
<aha-status-badge status="published">Published</aha-status-badge>   <!-- a built-in status -->
<aha-status-badge look="closed">Joined</aha-status-badge>           <!-- any other state: pick a look -->
```

Built-in `status` values: `draft`, `published`, `closed`, `archived`, `active`
(published look), `inactive` (archived look), `completed`, `in-progress`, `not-started`.

## Three markers

| Marker | When | How |
| --- | --- | --- |
| **Dot** (6px) | lifecycle states | the default for the four looks |
| **Icon** (12px, from the icon registry) | progress and other states an icon explains | `icon="system-check"` in place of the dot |
| **None** | a state that needs no marker | `marker="none"` |

Progress is built in: **Completed** = published look + `system-check`; **In progress** =
closed look + `system-hourglass-high`; **Not started** = draft look, no marker. Never a
dot and an icon together. *(STATUS-02)*

## Never mix marker families

Inside **one status dimension** (one column, one list, one card slot, one legend) use
**dots only**, or **icons and no-marker badges only**. Never both. A state added to an
icon dimension takes an icon or `marker="none"`. Two different dimensions on a screen
may differ. *(STATUS-07)*

## Default badge

Information that is **not a status** but sits where badges sit uses `look="default"`:
the same box, Gray 35 background, default ink, with or without an icon, never a dot.

```html
<aha-status-badge look="default">4/6</aha-status-badge>
<aha-status-badge look="default" icon="slidetype-match-pair">Match pairs</aha-status-badge>
<aha-status-badge look="default" icon="system-time-out">Time out</aha-status-badge>
```

Default badge or Tag? A **default badge** is read-only information about the object. A
**Tag** is a label the user adds, removes or filters by. *(STATUS-08)*

## When not to use a badge

- **A due date or deadline** is plain text. Use the primary colour only when it needs
  attention (due soon, due today, overdue); do not highlight on-time states. *(STATUS-09)*
- **A free-form label or keyword** is a Tag.
- **A count bubble or a notification dot** on another element is a Badge. *(STATUS-01)*

## App-supplied colours

An app that already owns an approved colour set for a result (Report: Correct, Partially
correct, Incorrect) keeps those colours and takes only the box, through
`--aha-status-badge-bg` and `--aha-status-badge-fg` set once in its stylesheet. Never use
them to tint a lifecycle or progress status, and never inline a hex on a badge. *(STATUS-03)*

## Labels and accessibility

- The label always comes from i18n, in sentence case. Adding a state means a translation
  key **and** one mapping to its look and marker. *(STATUS-04)*
- The element carries `role="status"` and an `aria-label` equal to the visible label.
  The label is always present; the dot or icon is decorative. *(STATUS-05, STATUS-06)*

## Build checklist

| # | Rule | Ref |
| --- | --- | --- |
| 1 | Only for a known status enum; free-form labels are Tags, counts on an element are Badges | STATUS-01 |
| 2 | Every badge is `<aha-status-badge>`; the box is never overridden | STATUS-02 |
| 3 | Colour comes from `status` or `look`; no status hue, no inline hex | STATUS-03 |
| 4 | The label comes from i18n | STATUS-04 |
| 5 | `role="status"` and an `aria-label` matching the label | STATUS-05 |
| 6 | The text label is always present; the marker is decorative | STATUS-06 |
| 7 | One marker family per status dimension: dots only, or icons and no marker only | STATUS-07 |
| 8 | Counters, types, Unanswered and Time out use the default look, never a dot | STATUS-08 |
| 9 | A due date is plain text, not a badge | STATUS-09 |

---

*Existing screens on the `aha-status-pill` class convention keep working and move to the
element when next touched. Self-check any built badge with the DS anti-slop judge
(`status-badges` surface) and fix every FAIL before shipping.*
