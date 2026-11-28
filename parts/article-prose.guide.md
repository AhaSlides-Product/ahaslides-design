## Load it

Link `lib/tokens.css`, then `lib/article.css`, once in the page head (or `import '@ahaslides-product/design/tokens.css'` and `import '@ahaslides-product/design/article.css'` in a bundled app). Put the whole article body inside ONE element with the class `aha-article-prose`. The class layer needs no Marketing container and no `<aha-*>` element: it sizes itself to a 720 px measure and steps its headings down at 767 px and 479 px viewport widths.

- The public library article page: the element that renders the article HTML gets `class="aha-article-prose"`.
- The article editor canvas: the editable root gets the class (with TipTap, `editorProps.attributes.class`), so the canvas shows the body exactly as the page will.

## Element map

| Element | Markup |
|---|---|
| Paragraph | `<p>` |
| Section heading with an anchor | `<h2 id="slug">` (lands 96 px below the top of the window when the anchor is followed) |
| Sub-heading | `<h3>` (and `<h4>` when a body needs a third level) |
| Lists | `<ul>` and `<ol>`, nested lists inside an `<li>` |
| Quote | `<blockquote><p>…</p><cite>Name, role</cite></blockquote>`, the cite is optional |
| Picture | `<figure><img src alt><figcaption>…</figcaption></figure>`, the caption is optional |
| Image gallery | `<figure class="aha-article-gallery">` holding `<div class="aha-article-gallery__grid">` with 2 to 4 `<figure class="aha-article-gallery__item"><img src alt><figcaption>…</figcaption></figure>`, then one `<figcaption>` for the whole gallery. Both kinds of caption are optional |
| Picture sizes | `<figure>` alone is the content width; add `aha-article-figure--wide`, `--full` or `--small` |
| Pull quote | `<blockquote class="aha-article-pullquote"><p>…</p><cite>Name, role</cite></blockquote>`, the cite is optional |
| Callout | `<aside class="aha-article-callout aha-article-callout--info">` (or `--tip`, `--warning`) holding `<aha-icon class="aha-article-callout__icon">` and `<div class="aha-article-callout__body">` |
| Promo callout | `<aside class="aha-article-callout">` with an `<h3>`, a `<p>` and one `<aha-button>` |
| Divider | `<hr>` |
| Inline | `<b>` or `<strong>`, `<i>` or `<em>`, `<code>`, `<s>` or `<del>`, `<a href>` |
| Code block | `<pre><code>…</code></pre>` |
| Table | `<div class="aha-article-prose__table" tabindex="0" role="region" aria-label="…"><table><thead>…</thead><tbody>…</tbody></table></div>` |
| Video | `<figure class="aha-article-video">` holding `<div class="aha-article-video__frame">` with one `<button class="aha-article-video__play">` (see Video below) |
| Chart | `<figure class="aha-article-chart">` with a title, an optional unit, `<aha-chart>`, the Show data table and a source line (see Chart figure below) |

## Picture sizes

The size classes go on any direct child `<figure>` of the prose root (a picture, a gallery, a video or a chart). A video takes content width, wide or full bleed; a chart takes content width or wide. Neither takes small: a 40% video is too small to watch and a 40% chart too small to read.

| Size | Class | Result |
|---|---|---|
| Content width | none | The width of the text column |
| Wide | `aha-article-figure--wide` | Breaks out of the text column to the page container, up to 1280 px |
| Full bleed | `aha-article-figure--full` | Edge to edge of the page area, with square corners; the caption keeps the page gutter |
| Small | `aha-article-figure--small` | 40% of the column, floated at the start with the text wrapping beside it; the full column below 480 px. Headings, quotes, other figures, tables and callouts start below it |

Wide and full bleed need to know how wide the page is, so wrap the prose root in one `<div class="aha-article-frame">`:

`<div class="aha-article-frame"><article class="aha-article-prose">…</article></div>`

- The frame fills the page area, centres the text column and owns the side gutter (64 px, 24 px below 768 px, 16 px below 480 px). Do not add side padding around it. If the host already pads the page, set `--aha-article-gutter: 0px` on the frame (keep the unit); full bleed then stops at the host's padding.
- Without a frame, or when the figure is not a direct child of the prose root, wide and full bleed stay at the content width, so nothing overflows.
- In a two-column page (a table of contents beside the body), put the frame in the body column: wide and full bleed then stop at that column's edges.
- On the editor canvas, wrap the editable root in the frame too. The heading, spacing and column steps follow the window width, not the canvas width.

## Gallery

Two or four pictures sit in two columns, three in three columns, and all become one column below 480 px. In columns, each picture sits in a 4:3 box on the light grey fill and is never cropped; in one column it keeps its own shape.

## Callout tones

Each tone is carried by its icon, never by a new colour. Info and warning sit on the light grey fill, tip sits on Vivid Pink at 5%, and every tone icon is the default icon ink at 24 px.

| Tone | Class | Icon |
|---|---|---|
| Info | `aha-article-callout--info` | `system-info` |
| Tip | `aha-article-callout--tip` | `system-lightbulb-filament` |
| Warning | `aha-article-callout--warning` | `system-warning-circle` |

## Video

A video is a facade until the reader clicks it (W9): the poster, a centred play button and the title, all one `<button>`. Nothing loads from the provider before the click except the poster image, and nothing plays by itself.

```html
<figure class="aha-article-video">
  <div class="aha-article-video__frame">
    <button type="button" class="aha-article-video__play" data-provider="youtube" data-video-id="cVfaZNj-T-c" aria-label="Play video: How to set up an interactive poll">
      <img class="aha-article-video__poster" src="https://i.ytimg.com/vi/cVfaZNj-T-c/hqdefault.jpg" alt="">
      <span class="aha-article-video__icon"><aha-icon name="system-play" size="32"></aha-icon></span>
      <span class="aha-article-video__title">How to set up an interactive poll</span>
    </button>
  </div>
  <figcaption>Optional caption.</figcaption>
</figure>
```

- `data-provider` is `youtube`, `vimeo` or `loom`, and `data-video-id` the provider's id (YouTube 11 characters, Vimeo digits, Loom 32 hex characters). An unlisted Vimeo video adds `data-video-hash`.
- The poster is YouTube's still, `https://i.ytimg.com/vi/<id>/hqdefault.jpg`, with an empty `alt` (the button's label names the video). Vimeo and Loom have no stable poster URL: leave the `<img>` out and the button sits on the neutral light grey tile.
- The accessible name is `Play video: <title>`, and the same title shows on the poster in a white label (two lines at most, one below 768 px). Enter and Space work because it is a real button.
- States: on hover the play circle turns from Vivid Pink to its hover shade, on press to its press shade; keyboard focus draws the focus ring around the whole 16:9 frame, on the button and then on the player it opens. The colour change is a short transition, off under `prefers-reduced-motion`.

**The click.** Load `lib/article-video.js` once (`<script type="module" src=".../lib/article-video.js">`, or `import '@ahaslides-product/design/article-video'`). It listens for clicks on the document, so it also covers videos rendered later (the editor preview). On a click it replaces the button with the player and moves focus into it:

```html
<div class="aha-article-video__frame">
  <iframe src="https://www.youtube-nocookie.com/embed/cVfaZNj-T-c?autoplay=1&rel=0" title="How to set up an interactive poll" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
</div>
```

| Provider | Player URL after the click |
|---|---|
| YouTube | `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0` |
| Vimeo | `https://player.vimeo.com/video/<id>?autoplay=1&dnt=1` (plus `&h=<hash>` when unlisted) |
| Loom | `https://www.loom.com/embed/<id>` |

The click is the reader's own press of play, so YouTube and Vimeo start at once, with sound, exactly as pressing play inside the player would. No player is ever on the page before that click, so nothing autoplays with sound. Loom has no documented autoplay parameter and opens on its own play button, so a Loom video takes a second click. Every player shows its own controls.

**Vue and React.** Both consumers render the same markup. A component that keeps the loaded state itself (a React editor preview, where the DOM belongs to React) calls `event.preventDefault()` in its own click handler and renders the iframe from `articleVideoEmbedUrl(provider, id, hash)`; the script then leaves that button alone. `articleVideoPosterUrl(provider, id)` gives the poster URL, and returns `null` for providers without one. The server-rendered page needs only the script.

## Chart figure

A chart figure carries its numbers twice: drawn by `<aha-chart>`, and as a plain HTML table the server renders, so crawlers and readers without the chart still get the data.

```html
<figure class="aha-article-chart" aria-labelledby="chart-warmups">
  <p class="aha-article-chart__title" id="chart-warmups">Favourite warm-up question</p>
  <p class="aha-article-chart__unit">Votes</p>
  <aha-chart type="column" palette="brand" label="Favourite warm-up question" number-format="count" data='[{"label":"Two truths and a lie","value":42},{"label":"Rate your weekend","value":31},{"label":"Emoji check-in","value":18}]'></aha-chart>
  <details class="aha-article-chart__data">
    <summary><span class="aha-article-chart__show">Show data</span><span class="aha-article-chart__hide">Hide data</span><aha-icon name="system-caret-down" size="16"></aha-icon></summary>
    <div class="aha-article-prose__table" tabindex="0" role="region" aria-label="Data for Favourite warm-up question">
      <table>
        <thead><tr><th scope="col">Question</th><th scope="col">Votes</th></tr></thead>
        <tbody><tr><td>Two truths and a lie</td><td>42</td></tr><tr><td>Rate your weekend</td><td>31</td></tr><tr><td>Emoji check-in</td><td>18</td></tr></tbody>
      </table>
    </div>
  </details>
  <figcaption class="aha-article-chart__source">Source: a poll of 91 people at a team meeting</figcaption>
</figure>
```

- `type` is `column`, `bar`, `line` or `donut`, always with `palette="brand"`, and `label` repeats the title (it is the chart's accessible name). Load `<aha-chart>` from `lib/aha-chart.js`. Data shapes are on the [Chart](../../chart/index.html) page.
- The unit line is optional; leave the `<p>` out when the numbers need no unit. The source line is the figure's `figcaption`, last, and starts with `Source:`.
- The table holds the same numbers as the chart, one row per bar, slice or period, with one header row. Its region label is `Data for <title>`. It is rendered closed, so the page shows the chart and a Show data link; opening it shows the table and the label turns to Hide data.
- **Before the chart upgrades** (no JavaScript, or `lib/aha-chart.js` not loaded yet), the empty `<aha-chart>` is hidden and the table shows open in its place, with no summary. This uses `aha-chart:not(:defined)` and the `::details-content` pseudo-element, in browsers that support it. In a browser without it the table stays closed under Show data, still one click away, and crawlers read it either way. Once the chart is defined, the chart shows and the table folds away under Show data.

## Compose with

These blocks are DS components or sections, never new article classes. Each one sits between paragraphs as a direct child of the prose root, except the FAQ. Videos and charts have their own figures, above.

- FAQ: the Marketing FAQ section (`marketing/faq`, linked with `lib/marketing/faq.css`). Close the prose root before it and open a new one after it, so the article headings rules never restyle the FAQ title and questions.
- Course and game cards: `<aha-card>` with `<aha-tag>` labels, laid out by `<aha-grid min="220" gap="middle">`.
