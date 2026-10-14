# Status badges — composition guide

A status badge tells the **state of a domain object** (a survey, a presentation, a
course, a learner) or of a **deadline** in one glanceable, screen-reader-announced token.
Every badge is the DS element `<aha-status-badge>`; this guide says which style and marker
a state takes, where the dot belongs, and what is not a badge at all.

**Companion guides.** `icons` for the glyph a badge calls by name, the colour rules for
why no status has a hue, and `paywall` for the crown badge (that is upsell, not status).

## The box

One box for every boxed badge: **28px** tall, **8px** side padding, radius **6px**, label
**14px semibold** on a 28px line in `--aha-text-default`, **6px** gap, a **16px** icon in
`--aha-icon-default` or a **6px** dot before the label. Never override it. *(STATUS-02)*

## Four styles

| Style | Use it for | Background | Border | Label |
| --- | --- | --- | --- | --- |
| **quiet** | most states, and information that is not a status | `--aha-gray-25` | none | `--aha-text-default` |
| **emphasis** | the live state, and anything due now | `--aha-bg-container` | inset 1px `--aha-border-strong` | `--aha-text-default` |
| **alert** | something the user must act on (overdue) | `--aha-bg-container` | inset 1px `--aha-border-warning` | `--aha-text-default`, warning icon in `--aha-icon-active` |
| **plain** | information that needs no box | none, no padding | none | `--aha-gray-80`, regular 400 |

Pink appears only on the **alert** icon. No status gets a hue of its own: no green, red,
amber or blue. `look="default"` is a deprecated alias of `quiet`. *(STATUS-03)*

```html
<aha-status-badge status="published">Published</aha-status-badge>                 <!-- a built-in status -->
<aha-status-badge look="emphasis" icon="system-clock">Due today</aha-status-badge>  <!-- any other state: a style and an icon -->
```

## Built-in states

| Group | `status` | Style | Marker |
| --- | --- | --- | --- |
| Survey | `draft` | quiet | `system-pencil-simple` |
| Survey | `scheduled` | quiet | `system-calendar-dot` |
| Survey | `published`, `live`, `active` | emphasis | dot, `--aha-icon-strong` |
| Survey | `closed`, `inactive` | quiet | dot, `--aha-icon-disabled` |
| Survey | `archived` | quiet | `system-archive-box` |
| Progress | `not-started` | quiet | `system-circle-dashed` |
| Progress | `in-progress` | quiet | `system-circle-half-dashed` |
| Progress | `completed` | quiet | `system-check-circle` |

`marker` (`dot`, `icon`, `none`) and `icon` override the marker; never a dot and an icon
together. *(STATUS-02)*

## The dot is for published / live and closed only

The 6px dot marks the **published / live** and **closed** lifecycle states (and `active` /
`inactive`, which follow them). Every other state takes an icon or no marker. So one
column can hold Draft (pencil), Published (dot), Closed (dot) and Archived (archive box);
a dot on Draft, Archived or a progress state is wrong. *(STATUS-07)*

## Due state

A due state is a badge in this family, set with `look` and `icon` rather than a `status`:

| Due state | Markup |
| --- | --- |
| 5 days overdue | `look="alert"` (the warning icon comes with it) |
| Due today, due soon | `look="emphasis" icon="system-clock"` |
| Due in 9 days | `look="plain"` |
| On time | `look="plain" icon="system-check"` |
| 4 days late | `look="plain" icon="system-clock-late"` |

Map the due state to its style and icon once, in one place; the label carries the count
from i18n. *(STATUS-09)*

## Information that is not a status

A counter (`4/6`), a slide or question type with its icon, Unanswered or Time out uses
`look="quiet"` (or `plain`), with or without an icon, never a dot.

```html
<aha-status-badge look="quiet">4/6</aha-status-badge>
<aha-status-badge look="quiet" icon="slidetype-match-pair">Match pairs</aha-status-badge>
```

Quiet badge or Tag? A **badge** is read-only information about the object. A **Tag** is a
label the user adds, removes or filters by. A count bubble or a notification dot on
another element is a **Badge**. *(STATUS-01, STATUS-08)*

## App-supplied colours

An app that already owns an approved colour set for a result (Report: Correct, Partially
correct, Incorrect) keeps those colours and takes only the box, through
`--aha-status-badge-bg` and `--aha-status-badge-fg` set once in its stylesheet. Never use
them to tint a lifecycle, progress or due state, and never inline a hex on a badge. *(STATUS-03)*

## Labels and accessibility

- The label always comes from i18n, in sentence case. Adding a state means a translation
  key **and** one mapping to its style and marker. *(STATUS-04)*
- The element carries `role="status"` and an `aria-label` equal to the visible label.
  The label is always present; the dot or icon is decorative. *(STATUS-05, STATUS-06)*

## Build checklist

| # | Rule | Ref |
| --- | --- | --- |
| 1 | Only for a known status or due enum; free-form labels are Tags, counts on an element are Badges | STATUS-01 |
| 2 | Every badge is `<aha-status-badge>`; the box is never overridden | STATUS-02 |
| 3 | Colour comes from `status` or `look`; pink only on the alert icon; no status hue, no inline hex | STATUS-03 |
| 4 | The label comes from i18n | STATUS-04 |
| 5 | `role="status"` and an `aria-label` matching the label | STATUS-05 |
| 6 | The text label is always present; the marker is decorative | STATUS-06 |
| 7 | The dot only on published / live / active and closed / inactive | STATUS-07 |
| 8 | Counters, types, Unanswered and Time out use the quiet or plain style, never a dot | STATUS-08 |
| 9 | Due states use alert, emphasis with a clock, or plain, from one mapping | STATUS-09 |

---

*Existing screens on the `aha-status-pill` class convention keep working and move to the
element when next touched. Self-check any built badge with the DS anti-slop judge
(`status-badges` surface) and fix every FAIL before shipping.*
