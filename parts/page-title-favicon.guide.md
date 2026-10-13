## What this covers

The document title is the text in the browser tab. The same text names the page in history, in bookmarks, in the task switcher, in a shared link's preview and in a search result, and it is the first thing a screen reader says when the page loads. The favicon is the small mark beside it. Both are set in the page's `<head>`, so they are easy to forget: a product can ship with one title on every route and nobody notices until they have six identical tabs open.

This is not the heading on the page. The on-page title is `<aha-breadcrumb size="page-title">` and its rule has not changed. The tab title repeats that heading and adds the brand.

## The format

- **Specific part first.** The page's own name, or the name of the thing that is open: `Pricing`, `My presentations`, `Team quiz`.
- **One separator.** A vertical bar with a space on each side.
- **Site name last.** `AhaSlides` for the product and the marketing site. `AhaSlides Design System`, `AhaSlides Help`, `AhaSlides Careers` for a named site, the same words as the product lockup in its header.
- **A middle part only to tell two pages apart.** `Team quiz | Report | AhaSlides` when the report and the editor of the same presentation can be open together. Three parts at most.
- **Home pages.** The marketing home page is `AhaSlides | <what it is, in a few words>`. The home page of a named site is the site name alone: `AhaSlides Design System`.

## Three angles, and which one wins

Branding wants the name on every tab, spelt one way. Search wants a unique, specific title that fits in a result. Usability wants the tab to be findable among twenty others. They agree on most of it: a unique title that starts with the page's own name serves all three. Where they pull apart:

| Where | What wins | So |
| --- | --- | --- |
| Brand first or brand last | Usability and search | A narrow tab shows only the start of a title. With the brand first, every AhaSlides tab reads the same. The brand goes last, where it still shows in history, bookmarks and search results. |
| The marketing home page | Branding | A person searching for the name should see the name first. It is the only brand-first title. |
| A screen behind a login | Usability | Search engines never see it, so keywords and the 60 character limit do not apply. Name the screen or the open object, nothing else. |
| An indexable page that is too long | Search, then branding | Shorten the specific part until the whole title fits in 60 characters. The brand stays. |
| A name a person typed | Usability | Their own name for the presentation comes first, even when it is long or says nothing to a search engine. |
| Unread counts and live sessions | Usability, on app screens only | The state goes at the very front, where a narrow tab still shows it. An indexable page never carries state, or the count ends up in a search result. |
| Telling staging from production | Branding for the icon, usability for the title | The favicon is the logo and is not altered. The environment goes in the title, in square brackets. |

## Good and bad titles

Good:

- `Pricing | AhaSlides`: the page's name, then the brand.
- `15 interactive presentation ideas | AhaSlides`: an article keeps its headline and gains the brand.
- `Team quiz | AhaSlides`: the open presentation by the name its owner gave it.
- `Button | AhaSlides Design System`: a named site ends with its own name.
- `(3) Inbox | AhaSlides`: a count a person can read on a narrow tab.
- `[staging] My presentations | AhaSlides`: the environment in words.

Bad:

- `Live Audience Engagement Platform - AhaSlides` on every route: a tagline is not a page name, and every tab reads the same.
- `AhaSlides Features - The best Polling, Quizzes, Q&A platform`: brand first on an inner page, a hyphen as separator, title case, a keyword list.
- `Pricing — Free & Paid Plans for Interactive Presentations | AhaSlides`: two different separators and 73 characters, so the brand is cut from the search result.
- `15 interactive presentation ideas to engage your audience`: no brand, so a bookmark or a shared link does not say whose page it is.
- `Aha Slides`, `Ahaslides`, `AHASLIDES`: the brand is one word with two capitals.
- `React App`, `localhost:3000`, an empty title or `Loading…`: a default nobody replaced.
- `🔴 LIVE!!! Team quiz`: an emoji is read aloud by its name and drawn differently on every system; say `Live:`.

## Titles that change

A single-page app has one `<head>` for every screen, so the title only changes if the router changes it. Set `document.title` in the same step as the URL change. The browser files the title under the current history entry, so a title set before the URL changes renames the page being left, and a title set seconds later leaves the tab and the Back menu misnamed in between.

While a screen loads its data, show the screen's static name (`Presentation | AhaSlides`), then the object's name once it is known. A person who opens five presentations in new tabs should never see five tabs called `Loading…`.

State is a short prefix: `(3) ` for an unread count, `Live: ` for a running session. Update it when the state changes and remove it when the state ends. A title that blinks or alternates on a timer is a distraction for everyone and noise for a screen reader user who returns to the tab.

## Names people typed

A presentation name can be 200 characters, contain line breaks or look like markup. Collapse the whitespace, cut the name to 60 characters on a word boundary and end it with `…`, then add the separator and the brand. Set it as text, never as HTML. When the name is empty, use the same fallback label the screen itself shows, so the tab and the page agree.

## Languages

The specific part and the state word are translated with the interface. The separator, the order of the parts and the word `AhaSlides` are the same in every language, right-to-left languages included: the browser handles the direction. German and Vietnamese titles run longer than English ones, so the 60 character limit is checked per language on indexable pages.

## The favicon set

All four files are in `logo/favicon/` of the Logo library and are built from The Splash by `node favicons.mjs`. Do not redraw, recolour or crop them.

| Tag | File | Why |
| --- | --- | --- |
| `<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48">` | `favicon.ico`, copied to the site root | The file every browser and crawler understands. It carries 16, 32 and 48 pixel images. |
| `<link rel="icon" type="image/png" sizes="32x32" href="…/favicon-32.png">` | `favicon-32.png` | A sharp tab icon on a high-density screen. |
| `<link rel="apple-touch-icon" sizes="180x180" href="…/favicon-180.png">` | `favicon-180.png` | The iOS home screen and share sheet. The ground is white because iOS fills transparency with black. |
| `<link rel="manifest" href="/site.webmanifest">` | `favicon-512.png`, listed in the manifest | Only for an app a person can install or add to a home screen. `name` and `short_name` are `AhaSlides`. |
| `<meta name="theme-color" content="…">` | none | Apps only. The page background colour, white in the product, never Vivid Pink. |

`/favicon.ico` must also answer at the root of the origin, not only where the `<link>` points. A browser asks for that exact path whenever a response has no `<head>`: a PDF, a downloaded feed, a text or JSON file opened in a tab, an error page from a proxy. A site that hosts its icons on a file server or a content network still needs the root file. Search results show the favicon too, so on an indexable site the file stays at one address and is not blocked from crawlers.

A site on a platform we do not build (Webflow, a help desk, a community forum) uploads the same files in that platform's settings. `rel="shortcut icon"` and `rel="mask-icon"` are legacy and are not needed.

## Dark browser chrome

The product has no dark mode, but a person's browser can be dark. The tab icon is The Splash on a transparent ground, the same mark on light and dark tab strips. Measured against Chrome's dark tab strip, the pink arms keep about 3.6:1 contrast on the inactive strip and 2.7:1 on the active tab, and the purple arms drop to about 1.9:1 and 1.5:1. The mark is still recognisable by its shape and its pink half, but it is weaker than on a light strip.

This guideline does not add a dark variant. Switching to the white or black Splash would make the icon vanish on the opposite theme, and a file chosen by the system colour scheme does not follow a browser theme that differs from the system. A favicon on its own light ground would fix it and is a new asset for the Logo library to decide on, not something to improvise in an app.

## Environments

Staging, preview and local builds use the production favicon. The logo is never recoloured or tinted, and a grey or striped Splash in a bookmark bar is the wrong thing to teach people. The title carries the environment instead: `[staging] My presentations | AhaSlides`. Square brackets put the environment at the start, where a narrow tab still shows it, and cannot be mistaken for part of a presentation name. Every build that is not production is also `noindex`, so the bracketed title never reaches a search result.
