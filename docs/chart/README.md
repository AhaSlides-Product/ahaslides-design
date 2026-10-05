# `<aha-chart>` — the AhaSlides chart library

One framework-free web component that draws eleven kinds of result chart: bar, column, stacked bar, donut and pie, radial, tree map, quadrant, bell curve, radar, word cloud and mind map.

Live examples, the playground and the "Choosing a chart" guide are on the hosted **[Charts tab](https://ahaslides-product.github.io/ahaslides-design/charts/index.html)**.

- No build step, no framework, no dependencies. One `<script type="module">` and one HTML tag.
- Works in plain HTML, React, Vue, Svelte, Angular or anything else that can render a custom element.
- Accessible by default: every chart has a text summary, a hidden data table and polite live announcements.
- Animates live data in place and respects `prefers-reduced-motion`.

> The npm package `@ahaslides-product/design` is published to GitHub Packages, which needs authentication. You do not need it. Everything below loads from a public CDN straight from this repository.

## Quick start (copy, paste, open in a browser)

Save this as `index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>aha-chart quick start</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.70.0/lib/tokens.css">
  <script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.70.0/lib/aha-chart.js"></script>
</head>
<body style="max-width: 720px; margin: 2rem auto; font-family: sans-serif">
  <aha-chart type="bar" sort="desc" label="Q4 priorities"
    data='[{"label":"Better onboarding","value":258},
           {"label":"Google Slides integration","value":219},
           {"label":"Advanced reports","value":164}]'></aha-chart>
</body>
</html>
```

That is the whole setup. The `@v0.70.0` part pins a release tag so your page never changes under you. Newer tags are listed on the [releases and tags page](https://github.com/ahaslides-product/ahaslides-design/tags); bump the number when you want newer features. Avoid `@master` in production because it moves.

What each line does:

| Line | Purpose |
|---|---|
| `lib/tokens.css` | Optional. Defines the `--aha-*` design tokens (fonts, spacing, colours) so the chart matches AhaSlides exactly. Without it the chart still draws, using built-in fallback colours and a generic sans-serif font. |
| `lib/aha-chart.js` | Registers the `<aha-chart>` element. It imports `aha-live-region.js` and `icons.js` from the same folder, so nothing else needs to be loaded. |

The chart never paints a background. It sits on whatever surface you put it on.

## ES module import

If you prefer to import in your own script (for example to set data from JavaScript):

```html
<aha-chart id="results" type="column" label="Votes"></aha-chart>

<script type="module">
  import 'https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.70.0/lib/aha-chart.js';

  document.getElementById('results').data = [
    { label: 'Yes', value: 42 },
    { label: 'No', value: 17 },
  ];
</script>
```

The module also has named exports, useful if you use a bundler or import maps:

```js
import { AhaChart, defineAhaChart, chartStrings, chartOptionDefaults, readableInkOn }
  from 'https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.70.0/lib/aha-chart.js';
```

| Export | What it is |
|---|---|
| `AhaChart` | The element class. |
| `defineAhaChart(tag = 'aha-chart')` | Registers the element under another tag name. |
| `chartStrings` | The built-in copy per language (`en`, `vi`). Copy a language and edit it to translate. |
| `chartOptionDefaults` | The default `options` for each type that has any. |
| `readableInkOn(colour)` | Returns a readable text colour for a given fill colour. |

You can also self-host: download the files `aha-chart.js`, `aha-live-region.js`, `icons.js` and `tokens.css` from the [`lib/` folder](https://github.com/ahaslides-product/ahaslides-design/tree/master/lib) of this repository into one directory and point your `<script>` at your copy. The three `.js` files must sit side by side.

## Setting data

Two ways, which take the same shapes:

```html
<!-- 1. A JSON attribute: fine for static pages -->
<aha-chart type="bar" data='[{"label":"A","value":3}]'></aha-chart>

<!-- 2. A property: best for live results. Setting it again animates the change. -->
<script type="module">
  const chart = document.querySelector('aha-chart');
  chart.data = [{ label: 'A', value: 3 }];   // later: votes arrive → chart.data = [...] again
</script>
```

Charts that take a lot of settings use the `options` property (or a JSON `options` attribute). Whatever you pass is merged over the defaults for that type.

## Choosing a chart

Pick the type from the shape of the data. Types that fold extras into "Other (n)" keep six categories by default; `max-items` changes that.

| Type | Use it for | Serves | Not for |
|---|---|---|---|
| `bar` | Counts across categorical options: long labels, many options, ranking (`sort="desc"`), image options | Poll, Ranking, Pick Answer | Part-to-whole of one question (donut); time series (`@ant-design/plots`) |
| `column` | The same comparison with a few short options; turns into bars when the labels do not fit | Poll, Pick Answer correct reveal | Long labels or many options (bar); part-to-whole (donut) |
| `stacked` | Composition of several groups or statements side by side, each row split by the same series (up to 6) | Grouped results | A single question (donut) |
| `donut` / pie | Part-to-whole of one question with few categories (up to 6; `variant: 'pie'` for no centre hole) | Poll, Split the points | Many slices or close values (bar) |
| `radial` | A few shares or percentages shown compactly as rings (up to 6) | Split the points | Many items or exact comparison (bar) |
| `treemap` | Part-to-whole across many categories of very different size (up to 6 tiles) | Poll, Split the points | Precise comparison of close values (bar) |
| `quadrant` | Items scored on two axes, such as effort against impact (four labelled quadrants, up to three colour groups) | — | One-dimensional scores (bar) |
| `bell` | How answers are distributed on an ordered or numeric scale (spread, skew, split, not just the average), one curve per statement (up to 6) | Any question where you want the distribution of answers, e.g. Rating scale | Categorical options (bar) |
| `radar` | Several criteria on the same scale (5, 10 or 100), comparing the profile of one or a few subjects | Rating scale | Criteria on unrelated scales (bar) |
| `wordcloud` | Frequency of short free-text answers (up to 120 words, duplicates merged) | Word cloud | Exact counts (bar) |
| `mindmap` | Grouped or hierarchical ideas (default 5 levels, 6 branches) | Brainstorm, Mind map | Quantities (bar, donut) |

A single headline number is a `Statistic`, and a time series, line or area chart is `@ant-design/plots` (`<aha-chart>` does not draw them).

## Default snippet per type

Every chart type has one default snippet: the minimal `<aha-chart type="…">` markup and data shape that already renders the full intended look and behaviour (entrance animation, live-update motion, tooltip, auto legend, empty state, text summary, hidden data table, live-region announcement) with no opt-in attribute. Start from it and only add attributes or `options`; never strip behaviour from it. The 11 snippets are in `contracts/chart.json` (`typeDefaults`) and each type's "Show code" on the Charts page.

Opt-in only (off until you set it): ranking (`sort="desc"`), Pick Answer (`correct`), `page-size`, `highlight-top`, `log-scale`, bell `showGrid` / `showYAxis` / `showMeanLine` / `showStepLabels`, radar `showTable` / `showScaleTicks` / `hollowCentre`, word cloud `showCounts` / `foldDiacritics` / `shape` / `rotation` / `maskSrc`, and an editable mind map (`editable`).

## Chart types and their data

Set `type` to one of the values below. The default is `bar`. An unknown value falls back to `bar`.

### `bar` and `column`

```js
chart.data = [
  { label: 'Better onboarding', value: 258 },
  { label: 'Advanced reports', value: 164, correct: true },
  { image: 'https://example.com/logo.png', value: 40 },   // label may be omitted when image is set
];
```

- `label` (string), `value` (number), optional `image` (URL) and optional `correct` (boolean).
- When `label` is omitted, screen readers and tooltips say "Option N".
- A `column` chart turns into bars when its labels cannot fit.
- With zero responses, every bar keeps its track and shows a short coloured stub at its start.

### `stacked`

```js
chart.data = {
  series: ['Salary', 'Team'],
  rows: [
    { label: 'Designers', values: [31, 16] },
    { label: 'Engineers', values: [24, 22] },
  ],
};
```

### `donut`

```html
<aha-chart type="donut" label="Budget"
  data='[{"label":"Trips","value":34},{"label":"Insurance","value":27},{"label":"Courses","value":18}]'></aha-chart>
```

`[{ label, value }]`. Options: `variant` (`'donut'` or `'pie'`), `labels` (`'auto'` and others), `maxSize` (pixels). With room (480px wide or more) up to five slices get leader-line callouts; otherwise a legend is shown.

### `radial`

`[{ label, value }]`. Concentric 270° rings on a rounded scale. Options: `maxSize`.

### `treemap`

`[{ label, value }]`. Squarified tree map. Options: `height`.

### `quadrant`

```js
chart.data = {
  x: { title: 'Effort', low: 'Low', high: 'High', min: 0, max: 10 },
  y: { title: 'Impact', low: 'Low', high: 'High', min: 0, max: 10 },
  zones: ['Quick wins', 'Big bets', 'Fill-ins', 'Money pit'],
  groups: ['Team A', 'Team B'],
  points: [{ label: 'Dark mode', x: 2, y: 8, group: 'Team A' }],
};
```

Four zone labels, up to three colour groups (more than three and every point uses one colour). Options: `maxSize`.

### `bell`

```js
chart.data = {
  scale: [1, 2, 3, 4, 5],
  anchors: ['Disagree', 'Agree'],
  series: [{ label: 'I enjoy my work', counts: [1, 2, 6, 12, 9] }],
};
```

A smooth distribution curve per statement (up to six) with an average badge. `counts` has one entry per `scale` step. Options: `height`, `showFill`, `showPoints`, `showAverage`, `showEndLabels`, `showAnchorLabels`, `showTooltip`, `showStepLabels`, `showGrid`, `showYAxis`, `showMeanLine`.

### `radar`

```js
chart.data = {
  dimensions: ['Speed', 'Quality', 'Cost', 'Support'],
  scale: 5,                                   // 5, 10 or 100
  subjects: [
    { label: 'Product A', scores: [4.2, 3.8, 3.1, 4.5], responses: [20, 20, 19, 20] },
  ],
  people: 20,
};
```

Options: `height`, `form` (`'filled'` and others), `grid` (`'polygon'` or circle), `rings`, `scoreStyle`, `reveal` (entrance effect, eight to choose from), `pace`, `showAxisLabels`, `showScores`, `showPoints`, `showTooltip`, `showLegend`, `showTable`, `showScaleTicks`, `hollowCentre`. See `chartOptionDefaults.radar` for the defaults.

### `wordcloud`

```js
chart.data = ['Together', 'Creative', 'Together', 'Fun'];          // one string per response
chart.data = [{ label: 'Together', value: 3 }, { label: 'Fun', value: 1 }];   // or counted words
chart.options = { shape: 'cloud', rotation: 'mixed' };
```

Options: `height`, `shape` (`'rect'` default; also ellipse, cloud, speech bubble, heart, bulb, or a custom image mask via `maskSrc`), `rotation`, `colour` (`'palette'` default; also top-3 and ink), `fontScale` (`'sqrt'` default; also linear and log), `removable`, `showTooltip`, `showCounts`, `group` (merge duplicates ignoring case and punctuation), `foldDiacritics`, `maxWords`.

### `mindmap`

```js
chart.data = {
  label: 'Team offsite',
  children: [
    { label: 'Venue', children: [{ label: 'Beach' }, { label: 'Mountains' }] },
    { label: 'Food' },
  ],
};
chart.options = { editable: true };
```

A balanced two-sided layout (one-sided, then an outline when narrow). Options: `pageSize` (ideas shown before a "+N ideas" pager), `maxDepth` (default 5), `maxBranches` (default 6), `editable` (let people add and rename ideas).

## Attributes

All attributes are optional except that charts need `data`.

| Attribute | Values | Default | What it does |
|---|---|---|---|
| `type` | the 11 types above | `bar` | Chart type. |
| `data` | JSON | none | The data. Also available as the `data` property. |
| `options` | JSON object | `chartOptionDefaults[type]` | Type-specific settings. Also a property. |
| `palette` | `brand`, `deck` | `brand` | Colour source. See [Palettes](#palettes). |
| `colors` | comma-separated colours | none | Series colours when `palette="deck"`. Also a property taking an array. |
| `ink` | a CSS colour | `--aha-viz-ink` | Text colour when `palette="deck"`. |
| `number-format` | `count`, `percent`, `both` | `both` | What each value shows. Percentages use largest-remainder rounding, so they total 100%. |
| `sort` | `none`, `desc`, `asc` | `none` | Order. `desc` also shows rank numbers on a bar chart. An "Other" bucket always stays last. |
| `highlight-top` | number | `0` | Dim everything below the top N. |
| `correct` | index list, for example `"1"` | none | Marks the correct option(s) for a quiz. Or set `correct: true` on a data item. |
| `correct-style` | `fill`, `indicator` | `fill` | `fill` paints the correct mark green and the rest neutral. `indicator` keeps palette colours and marks the answer with a tick only. |
| `page-size` | number | all | Bar charts: options per page, with a ‹ › pager. Ranks carry across pages. |
| `log-scale` | boolean attribute | off | Logarithmic lengths for bar and column when values span orders of magnitude. |
| `legend` | `on`, `off` | auto | Auto means on for stacked, tree map, quadrant groups, multi-subject radar and a donut without callouts. |
| `tooltip` | `on`, `off` | `on` | Hover tooltip with the full label and value. |
| `max-items` | number | bar and column: all; donut, radial, tree map and stacked series: 6 | Cap before the smallest items fold into "Other (n)". |
| `responses` | number | sum of the values | Respondent count for the summary and the donut centre. |
| `locale` | BCP 47 tag | `<html lang>`, else `en` | Built-in copy (`en`, `vi`) and number formatting. |
| `label` | string | the type name | The accessible name and the data-table caption. |

Properties without an attribute form: `strings` (object, see [Locale](#locale-and-strings)) and `colors` as an array.

Method: `chart.replay()` re-runs the entrance animation with the current data.

Examples:

```html
<aha-chart type="bar" number-format="percent" sort="desc" page-size="5" max-items="8" tooltip="off"
  label="Favourite feature" data='[...]'></aha-chart>

<aha-chart type="column" correct="1" correct-style="indicator" label="Capital of Australia"
  data='[{"label":"Sydney","value":22},{"label":"Canberra","value":29},{"label":"Perth","value":2}]'></aha-chart>
```

### The `options` property and `chartOptionDefaults`

`options` holds the settings that are specific to a type (listed under each type above). Pass only what you want to change:

```js
chart.options = { shape: 'heart', maxWords: 60 };   // other word-cloud options keep their defaults
```

The full default set is exported, so you can inspect it:

```js
import { chartOptionDefaults } from '.../lib/aha-chart.js';
console.log(chartOptionDefaults.wordcloud);
// { height: 380, shape: 'rect', maskSrc: null, rotation: 'none', colour: 'palette', fontScale: 'sqrt',
//   removable: true, showTooltip: true, showCounts: false, group: true, foldDiacritics: false, maxWords: 120 }
```

Types with defaults: `donut`, `radial`, `treemap`, `quadrant`, `bell`, `radar`, `wordcloud`, `mindmap`.

## Palettes

| `palette` | Use it for | Colours come from |
|---|---|---|
| `brand` (default) | Dashboards, reports and any normal app screen | The `--aha-viz-series-1` to `--aha-viz-series-6` tokens from `tokens.css` (with built-in fallbacks if you skip it). More than six bar or column options share series 1. |
| `deck` | A presentation or full-screen canvas with its own colour scheme | `colors`: your own list, in order. `ink`: your text colour. Text that sits on a fill picks a readable colour automatically. |

```html
<div style="background:#1A1A2E; padding:24px">
  <aha-chart type="donut" palette="deck"
    colors="#20E8B5,#FF4081,#FF9068,#BFD2FF" ink="#FFFFFF" label="Budget"
    data='[{"label":"Trips","value":34},{"label":"Insurance","value":27},{"label":"Courses","value":18},{"label":"Lunch","value":13}]'></aha-chart>
</div>
```

From JavaScript: `chart.colors = ['#20E8B5', '#FF4081']`.

## Locale and strings

Built-in text (summaries, "Other", pager labels, word-cloud hints and so on) is available in English (`en`) and Vietnamese (`vi`). Numbers are formatted with `Intl` for the locale.

```html
<aha-chart type="bar" locale="vi" data='[...]'></aha-chart>
```

To use another language or reword anything, pass `strings`. Keys you leave out fall back to English; see `chartStrings.en` for every key and its `{placeholders}`.

```js
chart.setAttribute('locale', 'fr');
chart.strings = { other: 'Autres', otherCount: 'Autres ({count})', nextPage: 'Page suivante' };
```

## Events

Events bubble and cross the shadow boundary, so you can listen on the chart or any ancestor.

| Event | Type | `event.detail` | Fired when |
|---|---|---|---|
| `wordcloud-hide` | word cloud with `removable: true` (default) | `{ hidden: string[] }`, every word currently hidden | Someone hides, undoes or restores words. |
| `mindmap-change` | mind map with `editable: true` | `{ tree }`, the full new tree in the same shape as `data` | An idea is added or renamed. |

```js
cloud.addEventListener('wordcloud-hide', (e) => console.log('hidden:', e.detail.hidden));
map.addEventListener('mindmap-change', (e) => save(e.detail.tree));
```

## Live data

Set `chart.data` again whenever new results arrive. Bars grow, resize and re-rank in place, values count up, and a polite announcement summarises the change for screen readers (throttled so it never chatters). Call `chart.replay()` to play the entrance animation again, for example when a slide becomes visible.

## Accessibility

- The host has `role="figure"` and an `aria-label` from `label` (or the type name).
- Each chart has a text summary and a visually hidden data table (a nested list for the mind map).
- Changes are announced through a polite live region.
- Interactive parts (pager, legend toggles, words, mind-map nodes, quadrant points, radar axes) are real buttons with labels and keyboard support.
- Hover tooltips also appear on keyboard focus.
- Animation is switched off under `prefers-reduced-motion`.

Always set `label` to something meaningful, for example the question being answered.

## Empty state

With no responses (`data` empty or all zeros) the chart does not show placeholder bars or "waiting" text. Every bar, column and stacked row keeps its track and shows a short coloured stub at its start; donut and tree map keep their track; the radar breathes its entrance effect until the first response arrives.

## Browser support

Current versions of Chrome, Edge, Firefox and Safari (desktop and mobile). The chart needs native custom elements, shadow DOM, ES modules and `Intl`. Internet Explorer is not supported.

## Licence

This repository's `package.json` currently declares the licence as `UNLICENSED` and the repository has no `LICENSE` file. The licensing terms for external use have not been decided yet, so please do not assume this library is free to use, copy or redistribute. This section will be updated once the terms are confirmed.

## More

- Component contract (the source of truth for attributes and data): [`contracts/chart.json`](../../contracts/chart.json)
- Element source and API comments: [`lib/aha-chart.js`](../../lib/aha-chart.js)
- Design-system site and agent feeds: <https://ahaslides-product.github.io/ahaslides-design/>
