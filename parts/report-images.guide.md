# Report images — composition guide

A **report image** is a chart, a table, a number plate or a KPI tile rendered once to a PNG
and posted to Slack, an email or an export. It follows the same rules as the live DS
elements, `<aha-chart>` and `<aha-stat-tile>`, and the colour rules. What changes is that
nobody can hover, zoom, open a tooltip or switch a series off. Three things follow from that:

- **Every value a reader needs is written on the image**: end labels on lines, values on columns, the change on every plate.
- **Rows are told apart by striping.** An in-app table has a hover highlight that tracks the reader's row; an image has none, so a table in an image gets zebra rows and an in-app table does not. (C11)
- **Every glyph is a file from the DS.** A renderer that cannot run `<aha-icon>` takes the status glyphs from `lib/static-icons`, never a drawn shape or an emoji. (C13)

Companion guides: the colour rules (chart colours, text on Vivid Pink at 5%, rises and
falls), the Charts page for the live `<aha-chart>` line and column, the Stat tile page for
`<aha-stat-tile>`, and the Table page for in-app tables.

## Colour: how this sits inside the rules

Nothing here changes a colour rule; the static looks are the closest compliant reading of them.

| Choice | Rule it follows |
| --- | --- |
| A report image counts as **one screen**. Its row of plates is the screen's one highlighted panel in Vivid Pink at 5%. | 3.7: Vivid Pink at 5% is for hover and selected states, plus at most one highlighted panel per screen |
| Zebra rows in Vivid Pink at 5% stand in for the hover state an image cannot show. | 3.7: hover and selected states |
| Text on the plate card and on a pink row is **black**, never pink. | 6.5: text on Vivid Pink at 5% is black |
| A rise is black with an up arrow; a fall is white on a black pill with a down arrow. | 7.3, 8.5: no green or red for up and down |
| Series colours run Vivid Pink, black, Vivid Pink at 30%, light grey. | 8.1 to 8.3 |
| Each line has its own marker shape. | 8.4: the chart still reads in black and white |

An image that already carries a pink highlighted panel of its own (a callout box, say) uses
the **plain** plate look instead: white with a 1px `--aha-border-default` border and the same
pink top bar.

## Size and density (C1)

| | At 1x | Exported at 2x |
| --- | --- | --- |
| Full-width chart | 1,200 × 675 px | 2,400 × 1,350 px |
| Half-width chart or plate row | 800 px wide, height to fit | 1,600 px wide |
| Margin | 24 px, white | 48 px |
| Smallest text (ticks, notes) | 12 px | 24 px |
| Labels, values, table text | 14 px | 28 px |

One chart, table or plate row per image, on a white background, and under **1 MB** so Slack
shows the preview inline. Several of them make several images, posted together.

## Type (C2)

Plus Jakarta Sans only, loaded from the DS font files (`fonts/`), never a system fallback
for the Latin text. Two weights:

| Weight | Use |
| --- | --- |
| 400 | ticks, captions, notes, table body text, plate labels |
| 600 | titles, values, end labels, table headers, the change on a plate |

### Missing glyphs (C10)

Data can hold any script. Give the renderer a fallback font after Plus Jakarta Sans that
covers the scripts the data can contain (Noto Sans covers Vietnamese and most diacritics),
so a name never renders as empty boxes. Arrows and status marks are never font characters
or emoji: draw them from `lib/static-icons`.

## Charts

### Series order and the top 3 plus Other rule (C3)

Colour series in the chart order, main series first: Vivid Pink, black, Vivid Pink at 30%,
light grey `#A8A8A8`. A breakdown with more than four parts shows the **top three by value**
and folds the rest into **Other**, in light grey and last. Never more than four colours,
and an Other that already exists in the source joins the folded remainder rather than
taking a second slot.

### Lines: end labels, twin axes, gaps and zero runs

- **End labels** (C4). Every line carries its latest value at its right end, in 14 px semibold black, formatted like its axis. When two labels would touch, push them apart as a group around their points and join each moved label to its line with a short 1.25 px leader in the series colour. A line in Vivid Pink at 30% or grey is always labelled.
- **Markers** at labelled ticks and the last point only, one shape per series: circle, square, triangle, diamond.
- **Twin axis** (C5). Only when a series has a different unit (a rate beside a count). The right axis shares the left axis's grid lines, and the legend names each series' axis: `Sessions (left axis)`, `Conversion (right axis)`.
- **Gaps** (C6). A missing period breaks the line. Never plot it as zero and never join across it; a point with no neighbour keeps its marker.
- **Zero runs** (C7). A series that is really zero for three or more periods in a row gets a short note on the chart in 12 px secondary text, placed inside the plot near the run: `No sessions from 3 to 9 Oct`. Without it a reader takes the flat run for missing data.

`<aha-chart type="line">` already draws all of this live except the zero-run note; a static
renderer copies its geometry.

### Columns: negatives and a reference line

A negative value sits **below a zero baseline** drawn in `--aha-border-strong`, in the same
colour as a positive one: direction is position and shape (the rounded corners point away
from the baseline), never hue. A target or average is a 1px **dashed** line in
`--aha-text-secondary` with its label and value at the right end, outside the columns. This
is `<aha-chart type="column">` with a negative value or `options.reference`.

### Ticks and number formats (C8)

| | Rule |
| --- | --- |
| y axis | 3 to 6 divisions on round steps (1, 2, 2.5 or 5 times a power of ten; whole steps for percentages), starting at zero for counts |
| x axis | thin the labels until none overlap, counting back from the latest period so it is always labelled |
| Thousands and above | K or M with at most one decimal: 12K, 1.3M |
| Below a thousand | plain digits: 940 |
| Percentages | whole numbers: 46% |
| Consistency | the same format on the axis, the end labels and any table beside the chart |

## Titles (C9)

Sentence case, saying what and when: `Weekly sign-ups, last 12 weeks`. No em or en dashes
anywhere on the image: use a comma, or "to" for a range (`3 to 9 Oct`). No full stop at the
end of a title, and no all-caps labels.

## Static tables (C11)

| Part | Spec |
| --- | --- |
| Rows | zebra, alternating white and Vivid Pink at 5% (`#FEF3F7` on white), starting white |
| Dividers | 1px `--aha-border-default` (`#E3E3E3`) under every row, kept on the pink rows |
| Header | labels in black semibold 14 px over a **2px Vivid Pink** rule; no fill |
| Figures | black, tabular numerals, aligned right; formats as in C8 |
| Text | black 400, aligned left; long text wraps, never truncated |
| Row height | 36 px at 1x, 12 px side padding |
| Not allowed | vertical rules, coloured status cells, a grey header fill |

Zebra rows are for images only. An in-app table (`ConfigProvider theme={tableTheme}`) keeps plain rows: it
has a hover highlight that does the zebra's job. Do not add zebra rows to an app screen, and
do not drop them from an image.

## Number plates and KPI tiles (C12)

A number plate is the static form of `<aha-stat-tile>`, drawn to the same spec:

| Part | Spec at 1x |
| --- | --- |
| Card | flat, Vivid Pink at 5% (`#FEF3F7` on white), 8 px corners, a 4 px Vivid Pink bar across the top, no shadow, no border |
| Padding | 20 px top and sides, 16 px bottom; 8 px between rows |
| Label | 14 px, 400, black, sentence case |
| Value | 32 px, 600, black, tabular numerals, formats as in C8 |
| Change | 14 px, 600: the absolute change and a whole percent of the previous value, `1,460 (13%)`; percentage points for a percentage value, `5 pts` |
| Rise | black text with `system-arrow-up` 16 px, ink |
| Fall | white text on a black pill (fully rounded, 6 px left and 8 px right padding) with `system-arrow-down` 16 px, white |
| No change | the words `No change`, black, no arrow |
| Caption | 14 px, 400, `--aha-text-secondary` (`#4A4A4A`), after the change: `vs previous week` |
| Row | 1 to 6 plates per row, 16 px apart, equal widths, at least 200 px each; more plates wrap to a second row |

On an app screen the same tile is the live element: `<aha-stat-tile label="Weekly active users" value="12480" previous="11020" caption="vs previous week">`, laid out 1 to 6 to a row in `<aha-grid columns="N" responsive gap="middle">` (Stat tile page).

## Static status glyphs (C13)

Single-colour SVG files, generated from the icon registry under the same names, with the
colour baked in (a PNG renderer cannot resolve `currentColor`) and the stroke drawn at the
width `<aha-icon>` uses at that size.

| | |
| --- | --- |
| Path in the package | `lib/static-icons/<ink>/<size>/<name>.svg` |
| Ink | `ink` (#1A1A1A) or `white` (#FFFFFF) |
| Size | 12, 16, 24 or 32 |
| From the CDN | `https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v<version>/lib/static-icons/ink/16/system-arrow-up.svg` |
| From npm | `@ahaslides-product/design/static-icons/ink/16/system-arrow-up.svg` |
| List | `lib/static-icons/manifest.json` |

| Name | Use |
| --- | --- |
| `system-arrow-up` | rise, beside the number (ink) |
| `system-arrow-down` | fall, on the black pill (white) |
| `system-minus` | no change |
| `system-trend-up`, `system-trend-down` | a trend over several periods |
| `system-warning-circle` | a figure needs attention, or data is incomplete |
| `system-hourglass-high` | pending: a source is still loading |
| `system-circle-dashed`, `system-circle-half-dashed`, `system-check-circle` | not started, in progress, completed |

A glyph that is not in the set is added to `build-static-icons.mjs` from the registry, never
drawn by hand.

## Before you post

- 2x export, text at least 12 px at 1x, white background, under 1 MB
- Plus Jakarta Sans 400 and 600 only; a fallback font for any script in the data
- Series in the chart order; top 3 plus Other past four parts
- End labels on every line, never overlapping; gaps break the line; zero runs carry a note
- A twin axis is named in the legend; 3 to 6 round divisions; K, M and whole-percent formats
- Sentence-case titles with no em or en dashes
- Tables: zebra rows, dividers, black semibold header over a 2px Vivid Pink rule
- Plates: Vivid Pink at 5% card, pink top bar, black text, rise and fall by shape
- Every status mark is a file from `lib/static-icons`
