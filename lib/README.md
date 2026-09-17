# `lib/` — element source, not docs

This folder holds the **runnable component entry points** (`aha-button.js`, `aha-icon.js`, …)
that snippets import at runtime via jsDelivr:

```
https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@master/lib/<element>.js
```

**There is no agent feed, doc, or component API in this folder.** If you are an agent looking for
how to use this design system, fetch the hosted index instead (public, no auth):

```
https://ahaslides-product.github.io/ahaslides-design/llms.txt
```

It lists every component and links each machine feed (`<slug>.agent.json`), the visual language
(`design.md`), and the icon catalogue (`icons.agent.json`).

## Two hosts, two jobs

| You want to… | Host | URL shape |
|---|---|---|
| **Read** docs + feeds (start here) | GitHub Pages | `https://ahaslides-product.github.io/ahaslides-design/<file>` — site root, no `dist/` prefix |
| **Import** an element at runtime | jsDelivr | `https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@master/lib/<element>.js` |

`dist/` is a local build folder — gitignored, never a fetch path. Docs and feeds are **not** on
jsDelivr; the element source is **not** on GitHub Pages under a doc path.
