# Empty state — composition guide

An empty state is what a surface shows when **nothing has gone wrong and there is simply
nothing to show yet**: a session with no data, a Participants tab nobody has joined, a
Feedback tab nobody has answered. It tells the user what is missing and, when they can fix it
from here, the one step that fills it.

This guide is built from three states the Reports team approved in the report app
(Session detail with no data, the Participants tab, the Feedback tab) and from the DS
Illustration and Empty contracts. It ships no new element: the pattern is
`<aha-illustration>`, text and, at most, one `<aha-button>`.

**Companion guides.** `ux-writing` for the words (UXW-6), `shared-components` for
`<aha-error-page>` and `<aha-empty>`, and the Illustration contract for the
art. (EMPTY-01 to EMPTY-13)

## Full pattern or plain `<aha-empty>`

| The surface is | Use | Why |
| --- | --- | --- |
| A whole page with no content | Full pattern, **page scale** | The page is the empty thing, so it needs a clear next step |
| A tab panel or card that is the main content of its area, 240 px tall or more | Full pattern, **panel scale** | Enough room for the art; the tabs and card stay |
| A card or panel under 240 px whose content is the empty thing (Session detail Insights card) | Full pattern, **compact scale** | The card is the empty thing; small art, no action |
| A table body with no rows | `<aha-empty>` with `empty-table` in its `image` slot at 64 px, one caption | A small pink table names what is missing; DataTable shows it by default |
| A list, dropdown or widget | Plain `<aha-empty>` (`image="simple"` when tight) | Grey line art stays out of the way of the items |
| A small item repeated per slide or row (an answer card per skipped slide) | A plain one-line caption, `No answer`, no art | The same picture on every item is noise |
| A failed request, a missing page, a denied page | `<aha-error-page>` or `<aha-result>` | Something went wrong: not an empty state |

Never put the full pattern inside a table row or repeat it per item, and never leave a whole page on a grey
`<aha-empty>` or a bare table placeholder. (EMPTY-01)

## Anatomy

One centred column, in this order, and nothing else (EMPTY-02):

- The spot illustration, `<aha-illustration name="empty-…">`
- A title
- A body, one or two short sentences
- At most one action

## The illustration

Call an `empty-*` name from the registry; the art is pink, in the fixed Illustration tints,
and names what is missing. Never inline SVG, never a PNG, never recoloured. (EMPTY-03)

| Name | Use for |
| --- | --- |
| `empty-report` | a session or report with no data |
| `empty-sessions` | no sessions hosted, or none in the chosen period |
| `empty-slides` | no slide results, or no interactive slides |
| `empty-insights` | no insights found |
| `empty-leaderboard` | nobody on a leaderboard yet |
| `empty-responses` | no responses or answers from a participant |
| `empty-participants` | no participants yet |
| `empty-feedback` | no feedback yet |
| `empty-presentation-list` | no presentations |
| `empty-templates` | no templates |
| `empty-trash` | an empty trash |
| `empty-table` | a table body with no rows, inside `<aha-empty>` at 64 px |

Search the registry first. When no `empty-*` fits, add the missing one under
`illustrations/svg/empty/` as the Illustration contract describes. Never borrow art that
shows a different thing.

## Three scales

| | Page scale | Panel scale | Compact scale |
| --- | --- | --- | --- |
| Where | the whole content area (Session detail) | inside a card or tab panel (Participants, Feedback) | a card or panel under 240 px (Insights card) |
| Placement | centred both ways, fills the area height | centred, with `calc(var(--aha-space-80) + var(--aha-space-64))` (144 px) padding above and below | `--aha-space-24` (24 px) on every side |
| Illustration | size 128 | size 100 | size 64 |
| Illustration to title | 16 px | 16 px | 16 px |
| Title to body | 16 px | 8 px | 8 px |
| Body to action | 16 px | 16 px | no action |
| Title | 18 px (`--aha-size-h6`), semibold | 16 px (`--aha-size-l`), semibold | 14 px (`--aha-size-default`), semibold |
| Body | 14 px (`--aha-size-default`), regular, centred, up to 480 px wide | the same | 12 px (`--aha-size-sm`), regular, centred |
| Action | one secondary button | usually none | none |

The columns are the values in EMPTY-04, EMPTY-05 and EMPTY-12.

## A repeated small item

An item repeated per slide or per row (an answer card for every skipped slide) shows a plain
one-line caption such as "No answer", with no illustration, title or body. Never repeat the
pattern: the same picture on every card is noise. (EMPTY-13)

## The title is semibold

The report app renders the Session detail title bold and the Participants and Feedback
titles regular. The rule is **semibold (600) at every scale**, so the three states match.
The title is short and friendly, in sentence case, with at most one exclamation mark and no
full stop. The approved title is "All quiet here!". (EMPTY-06)

## Copy

- **Body: what is missing, then the step that fills it.** "No participants found yet. Run a presentation to see participant data here." (EMPTY-07)
- British English, sentence case, from i18n, no exclamation mark in the body.
- Encouraging, never an apology, never blame (UXW-6).
- **One action at most**, a sentence-case verb ("Open the presentation"), only when the user can fill the state from this screen. When the next step is on another screen the body names it and there is no button. (EMPTY-08)

## Do and don't

| Do | Don't |
| --- | --- |
| A Participants tab with no rows shows the pattern at panel scale | A Slides tab that renders nothing when it has no slides (EMPTY-10) |
| A whole page with no data shows the page-scale pattern | A grey table placeholder on a full page (EMPTY-01) |
| A failed list shows an error with the object named and Retry | A 500 that falls back to an empty table, hiding Retry (EMPTY-09) |
| "No feedback yet. Ask your audience to share their thoughts to see it here." | "Oops, nothing here!" or "No data" with no next step |
| One secondary button | Two buttons, or a button plus a link |
| An `empty-*` illustration by name | An inline SVG, a PNG, or a recoloured copy |

## Not an error

An absence of content is never an error, and an error is never drawn as an absence. A request
that failed takes `<aha-error-page>` or an inline alert that names the object and offers
Retry; the empty state has no red, no warning icon and no error wording. A list that errored
must not fall back to "No sessions". (EMPTY-09, UXW-2, UXW-3, UXW-6)

## Accessibility

The illustration repeats what the text says, so it is `decorative`. The title is plain heading
text, not a control. When an empty state replaces content after a filter or a search, announce
it through the live region. (EMPTY-11)

## Build checklist

| # | Rule | Ref |
| --- | --- | --- |
| 1 | Full pattern for a page, a panel of 240 px or more, or a compact card; `<aha-empty>` with `empty-table` at 64 px in a table body; plain `<aha-empty>` in lists, dropdowns and widgets | EMPTY-01 |
| 2 | Illustration, title, body, at most one action, one centred column | EMPTY-02 |
| 3 | An `empty-*` illustration by name, never inline SVG or PNG | EMPTY-03 |
| 4 | Page scale: art 128, 16 px gaps, 18 px title | EMPTY-04 |
| 5 | Panel scale: art 100, padding of 80 + 64 px tokens, 16 and 8 px gaps, 16 px title | EMPTY-05 |
| 6 | Title semibold, sentence case, no full stop | EMPTY-06 |
| 7 | Body: what is missing, then the next step, British English | EMPTY-07 |
| 8 | At most one action, a secondary button | EMPTY-08 |
| 9 | A failure is an error page or an alert with Retry, never an empty state | EMPTY-09 |
| 10 | No tab, list or panel renders blank when empty | EMPTY-10 |
| 11 | Decorative art; announce changes after a filter | EMPTY-11 |
| 12 | Compact scale: art 64, 24 px padding, 14 px title, 12 px body, no action | EMPTY-12 |
| 13 | A repeated small item shows a one-line caption, no art | EMPTY-13 |
