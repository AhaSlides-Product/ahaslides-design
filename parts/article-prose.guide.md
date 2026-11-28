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
| Callout | `<aside class="aha-article-callout aha-article-callout--info">` (or `--tip`, `--warning`) holding `<aha-icon class="aha-article-callout__icon">` and `<div class="aha-article-callout__body">` |
| Promo callout | `<aside class="aha-article-callout">` with an `<h3>`, a `<p>` and one `<aha-button>` |
| Divider | `<hr>` |
| Inline | `<b>` or `<strong>`, `<i>` or `<em>`, `<code>`, `<s>` or `<del>`, `<a href>` |
| Code block | `<pre><code>…</code></pre>` |
| Table | `<div class="aha-article-prose__table" tabindex="0" role="region" aria-label="…"><table><thead>…</thead><tbody>…</tbody></table></div>` |

## Callout tones

Each tone is carried by its icon, never by a new colour. Info and warning sit on the light grey fill, tip sits on Vivid Pink at 5%, and every tone icon is the default icon ink at 24 px.

| Tone | Class | Icon |
|---|---|---|
| Info | `aha-article-callout--info` | `system-info` |
| Tip | `aha-article-callout--tip` | `system-lightbulb-filament` |
| Warning | `aha-article-callout--warning` | `system-warning-circle` |

## Compose with

These blocks are DS components or sections, never new article classes. Each one sits between paragraphs as a direct child of the prose root, except the FAQ.

- FAQ: the Marketing FAQ section (`marketing/faq`, linked with `lib/marketing/faq.css`). Close the prose root before it and open a new one after it, so the article headings rules never restyle the FAQ title and questions.
- Chart: one `<aha-chart>` with `palette="brand"` and a `label`, wrapped in a `<figure>` when it has a caption.
- Course and game cards: `<aha-card>` with `<aha-tag>` labels, laid out by `<aha-grid min="220" gap="middle">`.
- Video: a `<figure>` wrapping an `<iframe>` with a `title`. The class layer gives the frame the full width, a 16:9 ratio and the default radius: `<figure><iframe src="https://www.youtube-nocookie.com/embed/<id>" title="…" allowfullscreen></iframe><figcaption>…</figcaption></figure>`.
