# Report images and pages — composition guide

A **report** comes in two forms that look the same:

- a **report image**: a chart, a table, a number plate or a KPI tile rendered once to a PNG and posted to Slack, an email or an export;
- a **report page**: a read-only page (a dashboard) that a report routine publishes. People open it from a link to read it; they never operate it.

Both follow the same rules as the live DS elements, `<aha-chart>` and `<aha-stat-tile>`, and the
colour rules. A report page is built from those elements; a report image copies them. What an
image changes is that nobody can hover, zoom, open a tooltip or switch a series off. Three things
follow:

- **Every value a reader needs is written down**: end labels on lines, values on columns, the change on every plate. A report page keeps them too, so it reads the same as its image.
- **Rows are told apart by striping.** A table in a report, image or page, gets zebra rows: a report is read, not worked in. A table on a screen of the product app keeps plain rows, because people work in it with a hover highlight. (C11)
- **Every glyph is a DS glyph.** A report page calls `<aha-icon>`; a renderer that cannot run it takes the same glyphs from `lib/static-icons`, never a drawn shape or an emoji. (C13)

A screen of the product app, including its Report screens, is not a report page: it keeps the
product rules (plain rows, white tiles, pale pink only for hover, selected and one highlighted panel).

Companion guides: the colour rules (chart colours, text on Vivid Pink at 5%, rises and
falls), the Charts page for the live `<aha-chart>` line and column, the Stat tile page for
`<aha-stat-tile>`, and the Table page for tables in the product app.

## Colour: rule 3.11

Reports are their own environment in the colour rules, `report-image` (Reports: static images and read-only report pages). Rule 3.11, asked for by Dave Bui, gives them their colour: number plates sit on Vivid Pink at 5% with black text and a Vivid Pink top bar, as many as the report needs, and table rows alternate white and light grey, the light grey rule 3.6 allows for table surfaces. Pale pink is never used for table rows: too much of it was too much (Dave Bui). The same report looks the same as an image and as a page. Rules 3.2 and 3.7, which keep pale pink to section-built web pages, hover and selected states and one highlighted panel, do not apply in a report. Every other colour rule still holds:

| Choice | Rule |
| --- | --- |
| Plate cards in Vivid Pink at 5% | 3.11 |
| Zebra rows in white and light grey `#F7F7F7`, never pale pink | 3.11, 3.6 |
| Text on the plate card and on a pink row is black, never pink | 6.5 |
| A rise is black with an up arrow; a fall is white on a black pill with a down arrow | 7.3, 8.5 |
| Series colours run Vivid Pink, black, Vivid Pink at 30%, light grey | 8.1 to 8.3 |
| Each line has its own marker shape, so the chart reads in black and white | 8.4 |

On a screen of the product app the same pale pink is not free: the live `<aha-stat-tile>` is white (`look="plain"`) by default, and `look="accent"` is for the one highlighted panel rule 3.7 allows. On a report page every plate is `look="accent"`.

## Size and density (C1)

### Report images

| | At 1x | Exported at 2x |
| --- | --- | --- |
| Full-width chart | 1,200 × 675 px | 2,400 × 1,350 px |
| Half-width chart or plate row | 800 px wide, height to fit | 1,600 px wide |
| Margin | 24 px, white | 48 px |
| Smallest text (ticks, notes) | 12 px | 24 px |
| Labels, values, table text | 14 px | 28 px |

One chart, table or plate row per image, on a white background, and under **1 MB** so Slack
shows the preview inline. Several of them make several images, posted together.

### Report pages

A report page is a white page with the same text sizes (12 px smallest, 14 px for labels, values
and table text). It holds as many charts, tables and plate rows as the report needs, and reflows
from a 360 px phone up with no horizontal scroll: plates in `<aha-grid min="160px" gap="middle">`,
charts at full width (`<aha-chart>` thins its x labels on a phone, counting back from the latest
period), and a wide table as the one thing that may scroll sideways. Check it at 390 and 1280 px.

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
anywhere in the report: use a comma, or "to" for a range (`3 to 9 Oct`). No full stop at the
end of a title, and no all-caps labels.

## Report tables (C11)

| Part | Spec |
| --- | --- |
| Rows | zebra, alternating white and light grey (`#F7F7F7`, `--aha-bg-container-secondary`), starting white; never pale pink |
| Dividers | 1px `--aha-border-default` (`#E3E3E3`) under every row, kept on the pink rows |
| Header | labels in black semibold 14 px over a **2px Vivid Pink** rule; no fill |
| Figures | black, tabular numerals, aligned right; formats as in C8 |
| Text | black 400, aligned left; long text wraps, never truncated |
| Row height | 36 px at 1x, 12 px side padding |
| Not allowed | vertical rules, coloured status cells, a grey header fill |

Zebra rows are for reports, image and page alike. A table on a screen of the product app
(`ConfigProvider theme={tableTheme}`) keeps plain rows: it has a hover highlight that does the
zebra's job while people work in it. Do not add zebra rows to an app screen, and do not drop
them from a report, whether it is posted as an image or opened as a page.

On a report page, the zebra is a plain HTML `<table>` styled with tokens:
`tbody tr:nth-child(even) td { background: var(--aha-bg-container-secondary) }`, dividers in
`--aha-border-default`, the header rule `2px solid var(--aha-color-primary)`.

## Number plates and KPI tiles (C12)

On a report page a number plate is `<aha-stat-tile look="accent">`, one per KPI, as many as the
report needs. In an image it is drawn to the same spec:

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

On a screen of the product app the same tile is white by default: `<aha-stat-tile label="Weekly active users" value="12480" previous="11020" caption="vs previous week">`, laid out in `<aha-grid min="160px" gap="middle">` so the row wraps to fewer columns on a narrow screen (Stat tile page).

## Status glyphs (C13)

On a report page, call the glyph with `<aha-icon name="…" size="16">`. In an image, take the
single-colour SVG files, generated from the icon registry under the same names, with the
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

## Before you post or publish

- Image: 2x export, text at least 12 px at 1x, white background, under 1 MB
- Page: white, reflows from 360 px with no horizontal scroll, checked at 390 and 1280 px
- Plus Jakarta Sans 400 and 600 only; a fallback font for any script in the data
- Series in the chart order; top 3 plus Other past four parts
- End labels on every line, never overlapping; gaps break the line; zero runs carry a note
- A twin axis is named in the legend; 3 to 6 round divisions; K, M and whole-percent formats
- Sentence-case titles with no em or en dashes
- Tables: white and light grey zebra rows (never pink), dividers, black semibold header over a 2px Vivid Pink rule
- Plates: Vivid Pink at 5% card (`<aha-stat-tile look="accent">` on a page), pink top bar, black text, rise and fall by shape
- Every status mark is a DS glyph: `<aha-icon>` on a page, a file from `lib/static-icons` in an image
