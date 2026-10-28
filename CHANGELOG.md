# Changelog

All notable changes to `@ahaslides-product/design`, **newest first**.

**The rule:** every merge adds one entry here **and** bumps `version` in `package.json`.
The top entry's version MUST equal `package.json` → `version` — `standards.mjs` enforces it, so a
PR that forgets either goes red. The `v<version>` release tag (what `npm publish` ships) matches too.
The gate also rejects an unfilled `(#129)` placeholder in the top entry: link the **real** PR number.

**Format** — one entry per version:

```
## X.Y.Z — YYYY-MM-DD
### Added        ← new component / prop / token / export
### Changed      ← behaviour or API change to something that already shipped
### Fixed        ← bug / gate / doc fix, no API change
### Removed       ← a removed export / component / token
- one short bullet per change, written for a consumer; link the real PR: (#123) — never a bare (#125)
```

Include only the sections you touched. **Versioning is [SemVer](https://semver.org)** — pre-1.0:
an additive change (new component/prop/token) bumps **MINOR** (`0.x.0`); a fix with no API change
bumps **PATCH** (`0.0.x`); a breaking change also bumps MINOR until 1.0, and is called out in the bullet.

## 0.512.0 — 2026-10-28
### Changed
- Header: every layout has one button, the primary call to action. The white Learn more buttons and the Sign up with Google button on Split with form are gone.
- Header: no small label above any headline. The badge pill and the Badge switch on Split and Stacked are removed, with their `__badge` rules.
- Header → Hero image marquee and Gallery marquee rows: the Pause button is gone, like the Logos strip. The rows still pause while hovered or focused and stand still under reduced motion, in print and under `data-aha-motion="off"`. W9 and its criterion now say photo marquees carry no Pause button.
- Header → Gallery carousel: the Previous and Next buttons are gone, so every slider uses the same Carousel dots as Hero slideshow; swipe, scroll and arrow keys still move it.
- Header: on centred layouts the G2 stars and score line up on the left of the G2 block instead of each being centred.
- Revert: revert the PR; the second buttons, badge, Pause buttons, carousel arrows and centred stars come back (#NNN)

## 0.509.1 — 2026-10-28
### Fixed
- Header and Footer banner: every Button on a Vivid Pink surface (the Vivid Pink state of the nine Hero layouts and Page header, and the Footer banner) now carries `surface="brand"`, so its keyboard focus ring is white and reads on the pink. The Header code panes show `surface="brand"` in the Vivid Pink state only; the live preview sets it when the state is switched. State hooks `data-surface-<state>` sit next to `data-variant-<state>`.
- Revert: revert the PR; the Buttons go back to the Vivid Pink focus ring, which disappears on pink (#426)

## 0.509.0 — 2026-10-28
### Added
- Button: `surface="brand"` for a Button on a Vivid Pink band (marketing hero, footer banner). Keyboard focus draws a white ring (`--aha-white`) outside a Vivid Pink gap (`--aha-vivid-pink-100`), 4.51:1 against the pink, in place of the Vivid Pink ring that vanished there. It sets `--aha-button-focus-ring` and `--aha-button-focus-gap` on the host, so a page rule on the element still wins; fill, border and label are unchanged (#398)
- Revert: revert the PR; it removes one CSS line in `lib/aha-button.js`, the `surface` row and Focus sentence in the Button contract, and the test (#398)

## 0.508.1 — 2026-10-28
### Fixed
- CSAT: with `feedback-on="any"` and `feedback-button`, a thumbs-up after using the Feedback button now shows `feedback-placeholder` in the popover instead of `feedback-button-placeholder`; the React, Vue and preview snippets now show `feedback-on` and `confirmation` (#425)
- Revert: revert the PR; no contract or API change (#425)

## 0.508.0 — 2026-10-28
### Added
- Icon `system-youtube-logo`, the one-colour Phosphor bold glyph that completes the social set (`system-instagram-logo`, `-linkedin-logo`, `-facebook-logo`, `-reddit-logo`, `-whatsapp-logo`).
- Colour rule 2.6a: social-media links (follow us and join us rows, footers, share links) use the one-colour `system-<brand>-logo` glyph at currentColor, never a greyscale or filtered copy of the colour brand logo, and no brand colour on hover. Rule 2.6 stays for third-party tool logos. Also in `AGENTS.md`.
- Revert: revert the PR; one icon file and meaning entry, one rule in `brand/colour-rules.json` and one line in `AGENTS.md` (#421)

## 0.507.0 — 2026-10-28
### Added
- Website > Marketing > Header: five multi-image heroes — fanned photo stack (`aha-header-section-hero-photo-stack`), bento collage beside the copy (`aha-header-section-hero-bento-collage`), photo marquee under centred copy with a Pause button (`aha-header-section-hero-image-marquee`), crossfading slideshow with dot controls (`aha-header-section-hero-slideshow`) and floating framed photos either side of the copy (`aha-header-section-hero-floating-images`). Each ships White, Accent and Vivid Pink states (#394)
- Website > Marketing > Header: five gallery layouts under a centred page header — Gallery bento grid (`aha-header-section-gallery-bento`), Gallery masonry (`aha-header-section-gallery-masonry`), Gallery carousel with arrows and dots (`aha-header-section-gallery-carousel`), Gallery marquee rows with a Pause button (`aha-header-section-gallery-marquee-rows`) and Gallery tabbed images (`aha-header-section-gallery-tabs`). Each has White and Accent backgrounds (#394)
- Website > Marketing > Features: Sticky stack (`aha-features--sticky-stack`), four white step cards that stick near the top of the screen and slide over each other as the page scrolls; pure CSS, no script (#394)
- `lib/marketing-motion.js` arms `data-aha-gallery` slideshows, carousels, tabs and marquees: keyboard-reachable controls, nothing autoplays unless `data-aha-autoplay` is set, and all motion stops under reduced motion, `data-aha-motion="off"` and print (#394)
- A Marketing page may list `previewModules` to load extra scripts into its docs previews (#394)
### Changed
- Website guideline and judge, W6: one narrow exception for photos (never screenshots) in the Header's multi-image heroes and Gallery layouts and the Features Sticky stack — the photo stack and floating images may tilt a photo in the photo frame (8 px white border and 1 px ring, no shadow), and bento, collage and masonry cells may differ in size or ratio and fill with `object-fit: cover` (#394)
- Website guideline and judge, W9: the photo marquees (Hero image marquee, Gallery marquee rows) may loop like the Logos strip, keeping their pause while hovered or focused, their Pause button and their stop under reduced motion, print and `data-aha-motion="off"`; at most one looping photo band per page, never next to the Logos strip (#394)
- Header guidance: a Photo frame point records the frame rule — 8 px white border, `--aha-radius-xl` corner and 1 px ring in the layout's frame colour, no drop shadow; Layout by page goal and One moving band per page cover the Gallery layouts (#394)
- Revert: revert the PR; the W6 and W9 edits in `guidelines/website.json` and `anti-slop/criteria.json` (and its generated `agent/` copy), the five multi-image heroes and five Gallery layouts in `marketing/header.json`, one new layout in `marketing/features.json`, and an appended block at the end of `lib/marketing-motion.js` — the existing Header layouts are untouched (#394)

## 0.506.0 — 2026-10-28
### Added
- CSAT: two opt-in attributes so the presenter can collect more slide-type feedback. `feedback-on="any"` (default `down`) also opens the feedback popover after a thumbs-up, once per rating, and the `feedback` event then carries rating `up`. `confirmation="<text>"` shows a "received" line inline beside the thumbs (under them with `layout="stacked"`) once rated and again after a feedback Send, in a `role=status` live region, and draws the chosen thumb in colour-primary ink (#424)
- Revert: revert the PR; both attributes are opt-in, so a CSAT that sets neither renders and behaves as before (#424)

## 0.505.0 — 2026-10-28
### Added
- Website > Marketing > Comparison table: a new section page with one comparison table in five forms — two, three (with or without a highlighted column), four and five compared columns beside a feature column (`aha-comparison`). Grouped rows under a group heading, tick, cross or short text cells, and the Pricing Large table's highlighted-column outline with a Recommended tag. On a phone two and three columns stay a table; four and five scroll sideways with the feature column held in place (#395)
### Changed
- Website guideline and judge, W1: Comparison table joins the list of DS Marketing sections a page band may be (#395)
- Website guideline and judge, W8: one exception to no horizontal scroll — a Comparison table with four or five compared columns scrolls sideways inside its own table frame on a phone, feature column sticky, while the page never scrolls; the table's `ds-lint-allow` now cites W8 (#395)
- Revert: revert the PR; it adds `marketing/comparison.json`, its test and a gutter test entry, and the W1 and W8 edits in `guidelines/website.json` and `anti-slop/criteria.json` (with its generated `agent/` copy) (#395)

## 0.503.3 — 2026-10-28
### Changed
- All six file-type icons now use stroke glyphs: `filetype-presentation`, `filetype-survey`, `filetype-course`, `filetype-lesson` and `filetype-report` reuse `system-presentation-chart`, `system-form`, `system-book`, `system-file-text` and `system-chart-bar`, and `filetype-knowledge-base` is a new stroke bookshelf (narrow book, banded book, leaning book) drawn as the stroke version of the original solid glyph; the solid blobs are gone and names and meaning are unchanged (#422)
- Revert: revert the PR; six SVGs under `icons/svg/filetype/`, regenerated registry and the pairs in `icon-duplicates.intentional.json` (#422)

## 0.503.2 — 2026-10-28
### Changed
- Website rule W6 and its anti-slop criterion judge image size and ratio by the visible UI, not the file: a screenshot padded, letterboxed or placed on a plain canvas to match other files counts at its own size and ratio, so mixed-size screenshots padded to one file size need the Vivid Pink frame. An image never carries its own background margin; export each screenshot tight to its UI. The Features "Fill the slot, or frame mixed sizes" note says the same. Website eval 29 (fail) added for landscape tab screenshots of different sizes padded to one canvas (#423)
- Revert: restore the previous W6 text in `guidelines/website.json` and `anti-slop/criteria.json`, and remove eval 29 and `fixtures/fail-w6-padded-screenshots` (#423)

## 0.502.0 — 2026-10-27
### Added
- Colour rule 6.8 (product app only): at rest, Vivid Pink fills only the primary button of each region; text, borders and icons stay ink, and pink appears on hover, focus or selection. Rules that name their own pink (text links 6.6 and 6.7, tags, charts, logo, illustrations, focus ring, chat launcher, selected or on states, the one 5% highlighted panel of rule 3.7, and fills and marks a DS component ships at rest from its own contract) are listed as exceptions. Colour anti-slop criterion C9 and evals 13 (fail) and 14 (pass) added to match (#420)
- Revert: revert the PR; the change is one rule in `brand/colour-rules.json`, one criterion in `anti-slop/criteria.json` and two evals (#420)

## 0.501.0 — 2026-10-27
### Fixed
- The pill is back on the presenting canvas too. The canvas kit badge (`.canvas-lib .badge` in `canvas/canvas.css`) is `var(--aha-radius-pill)` again instead of 4px, the Canvas guideline and guide say avatars, dots, chips, badges and bar tracks may be fully rounded again, the canvas anti-slop evals and fixtures read as before 0.441.0 (999px bars and badges, 50% marks), and the canvas-only pill check in `standards.mjs` and the canvas pill rule in screen-lint are removed. `--aha-radius-pill` (999px) stays the one token. (#410)
- Marketing Header: the Hero split and Hero stacked badge is a pill again (`var(--aha-radius-pill)`), as every Header badge was before 0.441.0; it stayed at 6px when the Header layouts were merged into five. An audit of every radius against 0.440.0 found no other change: rounded rectangles keep their radius, and only what was fully round before is fully round again. Revert: revert the PR (#410)

## 0.498.1 — 2026-10-27
### Fixed
- `aha-input` and `aha-button` keep their `ElementInternals` only when it has the form API (`setFormValue`); jsdom's partial internals is treated as none, so `form` and `labels` fall back and `aha-input` no longer throws "this._internals.setFormValue is not a function" in consumer unit tests. Browsers are unchanged. No API change. Revert: revert this PR. (#419)

## 0.498.0 — 2026-10-27
### Changed
- `<aha-chart type="bar">`: new row layout. The label (one line, ellipsis, at least 16px clear of the value) and the value sit on one line above the bar, the track spans the row, and the image (or placeholder tile) moves to the end of the row. The label-to-bar gap goes from 4 to 8px (`--aha-space-8`) and the bar from 38 to 34px (28 in a dense chart), so the row and image tile stay 68px. In the Ranking variant (`sort="desc"`) the rank number takes the `<aha-leaderboard>` rank chip: a 32px neutral circle on the track colour with a 16px semibold tabular number, centred on the label line; the image tile grows with that line so it still lines up. Bar and column labels (stacked column too) go up one size, to `--aha-size-xl` (20px) (#412)
- `<aha-chart type="bar">`: when any option has an image, every row keeps the image column and an option without one shows a placeholder tile (`system-image-square` glyph on the track colour), so all bars start at the same x and stay comparable. Charts with no images are unchanged; column charts were already aligned (#412)
- `<aha-chart type="column">`: when the columns do not fill the width (two to four on a 16:9 stage), they sit together in the centre with the label-width slot between them, instead of spreading to the edges (two columns were 506px apart on a 1280 stage, now 172px); stacked columns keep their layout (#412)
- Charts docs page: every chart case sits in a 1280 × 720 stage frame at 1:1 (slide surface, 48px stage padding), scrolling inside its own container on a narrow viewport; new column case "Two options", new bar cases "Some without image" (#412)
- Revert: revert the PR; the change sits in `BarRenderer.draw` and the `.bar-*` and `.col-label` rules in `lib/aha-chart.js`, plus `parts/chart.preview.html` (#412)

## 0.497.2 — 2026-10-27
### Fixed
- `aha-input`: the `labels` getter falls back to an empty list when the environment's `attachInternals()` has no `labels` (jsdom), so `_syncName` no longer throws "this.labels is not iterable" in consumer unit tests. No API change. Revert: revert this PR. (#418)

## 0.497.1 — 2026-10-27
### Changed
- The Leaderboard docs page moves out of the global Components area into the Canvas Library: `contracts/leaderboard.json` gains `libraryArea: "canvas"`, so `/leaderboard/` opens with Canvas Library active and no Components sidebar, the docs search files it under Canvas Library, and `llms.txt` lists it under "Canvas and Audience Library components" instead of "Components" (it is also out of the `design.md` component list). The Canvas Library and Audience Library Leaderboard sections carry a "Full Leaderboard docs" link to `/leaderboard/`, which keeps its URL. The component and its API are unchanged. (#417)
### Fixed
- The Canvas Library Leaderboard demo fills the deck width; it had shrunk to its scores inside the wrapping deck row. (#417)

## 0.497.0 — 2026-10-27
### Changed
- Websites → Features: in the split layouts (`icon-list-photo`, `tabs-screenshots`, and an alternating section with a single row) the section button sits in the text column under the text, left aligned with it (`aha-features__column` and `aha-features__cta--start`), even under a centred heading, instead of centred under the whole row. Rule W18 says so.
- Websites → Testimonials: at most three testimonial or case cards per section, and quotes of similar length (the longest within about 1.5 times the shortest, none over 160 characters); the Quote cards sample's long middle quote is trimmed. Rule W19 and the Testimonials page carry both.
- Websites → new tab: the section link-out buttons (Read customer stories, Read the docs, and Browse all templates, See all integrations) open in a new tab with `rel="noopener"` and visually-hidden "(opens in a new tab)" text, Sign up and the hero's primary call to action stay in the same tab (W15, W18). In the Footer every link that leaves AhaSlides (the three G2 badges that had no `target`, the Training Magazine Network and DMCA badges, System status, the social channels) opens in a new tab with `rel="noopener"` and a new-tab cue in its label. Revert: revert this PR; no API change. (#357)

## 0.494.0 — 2026-10-27
### Removed
- No section on a website page carries an eyebrow (the small label above a heading, hero included): the Features, Numbers, Pricing and Header section layouts lose their `__eyebrow` element and CSS, and website rules W14 and W17 now say a heading block is the h2 and its lead. Card category labels (`aha-marketing-card__eyebrow`) stay. (#414)
### Added
- `screen-lint --surface=website` fails a page on four more checks: a section eyebrow (W14, W17), three white content bands in a row or two coloured bands touching (W5), page CSS that overrides a Marketing section's padding, margin or gap (W2), and a class of a layout the DS has removed (W1, list derived from release history in `marketing/data/removed-layouts.json`). (#414)
- Website eval fixture `fail-w14-eyebrow`. (#414)
- To revert: revert this commit; the removed eyebrow markup returns with it and the lint checks go away.

## 0.491.0 — 2026-10-27
### Added
- `<aha-leaderboard>`, one ranked list for the slide canvas and the audience phone: neutral rank circle, a bar per row in the deck palette colours (row n takes colour n and its ink) inside a full-width track, the score with its unit and the points gained, an optional heading with a player count, a stub for a zero score, an opt-in trophy, ties ranked 1, 2, 2, 4, every participant listed, the list scrolling inside the board with the heading fixed, on the phone the participant's own row marked with a plain "(you)" after the name and scrolled into view (never on the canvas, which everyone sees); text meets WCAG AA 4.5:1 against its composited background, teams, empty and loading states, and a row slide with score count-up (none under reduced motion); the audience phone shows row text at the body default size and draws no outline round the own row; a bar edge that falls mid-name splits the name between the palette ink and the deck ink; themed only by `--aha-deck-*` tokens; the bars follow the deck palette on both surfaces (`applyCanvasDeck` with `palette: xprops.presentationColorPalette`, `applyDeck` from `slide.presentationColorPalette`), falling back to the accent only where a deck has no palette, and the element re-reads the palette when the host applies the deck after the tag has loaded; with `bar="false"` the name is drawn whole in the deck ink; the canvas library snippet passes the palette and the HTML snippet shows the one-tag `lib/canvas.js` / `lib/audience.js` import (#390)
- Revert: revert the PR; a new component, nothing else changes (#390)

## 0.490.0 — 2026-10-27
### Added
- `applyDeck` (the audience phone) writes `--aha-deck-palette-<n>` and `--aha-deck-palette-<n>-ink` for each colour of `slide.presentationColorPalette`, the same pairs `applyCanvasDeck` writes (1-based, up to 24, the ink `#1A1A1A` or white by contrast); the pairs come from one shared `paletteVars` in `lib/deck.js`, so the canvas and the phone cannot drift. Without a palette nothing is written
- Revert: revert the PR; additive, no existing token changes (#391)

## 0.489.0 — 2026-10-27
### Added
- `<aha-question-list>` host API, so a slide type's settings use the list instead of hand-building it: `notices` (InfoBoxes with links that open a question), `accordion`, a cancelable `question-toggle` event, `setQuestionOpen(id, open)`, a `question-leave` event, `change` `detail.edit` naming each edit, `singlecorrect`, `multiline` (a 1 to 3 row prompt), `promptmaxlength` / `optionmaxlength`, per-question `current` and `untitled`, the `markAsCorrect` and plural `countZero` / `countTwo` / `countFew` / `countMany` strings, `testid` hooks and `data-question-id` / `data-option-id`. Every one is opt-in; without them the list behaves as before (#397)
### Changed
- `<aha-alert>` and `<aha-info-box>`: a plain `<a href>` written in the message is an inline text link: inherits the message size, weight 400 and line height, no padding, the DS text-link exactly as on white (Vivid Pink `--aha-text-link`, no underline at rest, underline and `--aha-text-link-hover` on hover and focus, the Button focus ring). Vivid Pink on the alert grey is 4.06:1 and on the branding fill 4.16:1: a recorded AA exception for these links only, colour rule 6.7 (#397) Hosts never put an `aha-button` in the sentence. `inlineLinkCss(selector)` is exported from `aha-alert.js` for hosts that wrap the message in their own element (#397)
- `<aha-question-list>` `notices`: the question links are now that inline `<a href="#<question id>">` (still open and announce the question, keyboard reachable) instead of `aha-button variant="link"`, so they no longer enlarge the first line or render black (#397)
- Setting `questions` again with the same question and option ids in the same order now updates the list in place, so focus and the caret survive a host that writes every edit back (#397)
- `<aha-question-list accordion>`: when a host writes back several open questions, only the first stays open, so at most one is open as the contract says
- llms.txt: a DS gap is never a ds-lint-allow reason; check the component at the latest release, bump the pin, and add what is still missing to the DS (#397)
- Revert: revert the PR; the changes sit in `lib/aha-question-list.js`, `lib/aha-alert.js`, `lib/aha-info-box.js`, their contracts, the feedback guideline and one llms.txt line in `generate.mjs` (#397)

## 0.486.0 — 2026-10-27
### Added
- Empty state guideline (`guidelines/empty-state.json`, Patterns badge): the full pattern (an `empty-*` spot illustration, a semibold title, one or two short sentences, at most one action, centred) at page scale (art 128, 16 px gaps, 18 px title) and panel scale (art 100, 144 px padding, 16 and 8 px gaps, 16 px title), when to use plain `<aha-empty>` instead (table bodies, lists, dropdowns, widgets; a card under 240 px takes the compact scale), copy rules, do and don't, and "no content is never an error". Built from the three approved Reports states; listed in `guidelines.llms.txt`, the guideline agent feed and the product route
- Eight illustrations in the `empty` family: `empty-report`, `empty-participants`, `empty-feedback` from the approved Reports states, and `empty-sessions`, `empty-slides`, `empty-insights`, `empty-leaderboard`, `empty-responses` drawn in the same flat pink-tint style for the other Report empty states (33 in the registry, up from 25)
### Changed
- Illustration, Empty, UX writing and Shared components prose point at the Empty state guideline; the Illustration contract counts say 33
- UX writing UXW-6 now says an empty state has at most one next action, matching the Empty state guideline; its composed-of list points at `empty` instead of a missing empty-state component
- A guideline can set `patternsNav` to list itself, and render, under the Patterns sidebar (group "Composition guides"); the Empty state guideline does, and its panel padding is `calc(var(--aha-space-80) + var(--aha-space-64))` so no value is off the token scale
- Empty state guideline also has a compact scale (art 64, `--aha-space-24` padding, 14 px title, 12 px body, no action) for a card under 240 px whose content is the empty thing, and a repeated-item caption rule: a small item repeated per slide or row shows a plain one-line caption ("No answer"), never the pattern (EMPTY-12, EMPTY-13)
- Revert: revert the PR; a new doc page and eight additive illustrations, no existing name or value changes (#388)

## 0.484.0 — 2026-10-27
### Added
- Docs site, Websites > Sections: the Header, Features, Pricing, Numbers, Testimonials and Cards pages open in a Grid view, a three-column gallery of live thumbnails (two columns on a tablet, one on a phone) captioned "layout name · page name", with a Grid / List switch and a search box that filters by layout name and "Use for" text. Clicking a card switches to List view at that layout's `#<slug>` anchor; a URL with a hash opens in List view, and the last choice is remembered per browser. List view is the previous page unchanged. Pages with fewer than two layouts are unchanged. Revert: revert the PR; the change is the `sectionGallery*` functions in `generate.mjs` plus one hook in each of the two marketing page renderers. (#409)
### Fixed
- `aha-segmented`: the selected pill is re-measured when the segments or the track resize (a font that loads late no longer leaves it narrower than its label, which clipped Grid to Gri at 375px). Revert: revert the PR; the `_observeSizes` and `_placeThumb` methods in `lib/aha-segmented.js`.

## 0.482.0 — 2026-10-27
### Added
- `--aha-radius-pill` (999px) is back in the foundation tokens, and the pill shape is back outside the presenting canvas: the components, contracts, guidelines, audience kit, marketing sections and screen-lint scale that 0.441.0 moved off the pill use it again. The switch track is `var(--aha-radius-pill)` like the others. The deck tokens and the canvas kit stay pill-free, and `standards.mjs` still fails a pill radius in canvas sources. (#407)

## 0.479.0 — 2026-10-27
### Changed
- Website > Marketing > Header: 24 layouts down to 5, one per structure: Hero split, Hero stacked, Hero card, Hero split form and Page header. Layouts that differed only by colour, alignment, picture or call to action are now switches on the one layout: every layout has a White / Accent / Vivid Pink surface switch; Hero split adds Image (Inset, Bleed), Call to action (Buttons, Email form) and Badge; Hero stacked adds Alignment (Centre, Left), Call to action and Badge; Page header adds Alignment (Left, Centre, Space between), Buttons and Tabs. Merged: Hero Pink, Hero Pale Pink, Hero split image 01, 03 and 05, Hero screen mockup 02 and 04, Hero iPhone mockup 03 and Hero card mockup 07 into Hero split; Hero Pink Vertical, Hero Pale Pink Vertical, Hero screen mockup 01, 03 and 05, Hero simple text 01 and Hero card mockup 08 into Hero stacked; Hero color card 04 is Hero card, Hero split form 01 is Hero split form; the six page headers are Page header. Class names change to `aha-header-section-<layout>`; pasted copies of the old classes keep working where they are. The Video slot moves to Hero stacked; the G2 reviews row stays on the three heroes. Choosing a header, the website guideline W2 and W5 sources follow.
- Website composition eval fixtures: the hero in every fixture page is now Hero split on its Vivid Pink surface (`aha-header-section-hero-split--brand`) instead of the removed Hero Pink, with `fixtures/sections.css` carrying the Hero split CSS; the good-control expected output names it.
- The Header previews fit their section: the preview box is as tall as the section (up to the old 640px cap) instead of a fixed 640px, so short layouts no longer sit above a blank area (a page header preview drops from 630px to 227px).
### Added
- `generate.mjs`: an optional `options` list on a marketing layout (each choice either adds a `--<value>` modifier or keeps the elements marked `data-choice="<value>"`), rendered as switches beside the surface switch, with one code tab per choice and the choices in the `.md` and `.agent.json` feeds; and an optional page-level `previewFit`. Pages without them render byte-identically.
- Revert: revert the PR; `marketing/header.json`, the `options` and `previewFit` branches in `generate.mjs` and two source lines in `guidelines/website.json`, the eval fixture heroes and `fixtures/sections.css` (#399)


## 0.472.0 — 2026-10-27
### Changed
- Website > Marketing > Features: the Compact tabs layout puts the Create your quiz free button in the text column of each panel, under Learn more and left aligned, instead of centred under the whole section. Uses the `aha-features__column` and `aha-features__cta--start` classes. (#406)

### Removed
- Website > Marketing > Features: five near-duplicate layouts, 16 down to 11. Compact: accordion beside one image and Compact: pick from a list (use Tabs with screenshots or Compact tabs), Feature card row with 3 cards (use Icon cards), Icons around a results screenshot (use Icons around a phone screenshot), Alternating with portrait screenshots (use Alternating with mixed-size screenshots; the portrait framing rule is unchanged). Revert: restore the five layouts from `marketing/features.json`. (#406)

## 0.455.1 — 2026-10-27
### Fixed
- `aha-checkbox`: with a multi-line label the box stays on the first line (centre of line 1) instead of floating to the middle of the label. Single-line rendering, and a checkbox with no label, are unchanged.
- Revert: revert the PR; the change is confined to `lib/aha-checkbox.js` and `contracts/checkbox.json` (#403)

## 0.455.0 — 2026-10-27
### Changed
- Marketing motion: parallax now moves the picture inside its frame instead of sliding the frame. The picture is drawn 112% of the frame, drifts at most 6% of the frame height (never more than 48 px) and is clipped by the frame, so the frame's box, radius and position stay still. A picture drifts only when it sits in an `aha-features__frame`, `aha-testimonials__frame` or `aha-numbers__frame`; screenshots get no frame wrapper and never drift. (#365)
- Marketing motion: the same framed picture now has an entrance as it scrolls into view. It fades in and settles from 1.08x down to its parallax scale, a beat after its row's reveal, on `--aha-motion-viz-enter` and `--aha-ease-out`, composed with the parallax in one transform inside the still frame. Off under reduced motion, `data-aha-motion="off"` and print. (#365)
- Features: new `aha-features__frame` clipping wrapper, used by Icon list with photo.
- Testimonials: the Simple left aligned photo sits in an `aha-testimonials__frame` wrapper (was a bare `<img>`); Numbers split-image: the image sits in an `aha-numbers__frame` inside the card. A page with the old markup simply does not drift.
Revert: restore `lib/marketing-motion.js`, `marketing/testimonials.json` and `marketing/numbers.json` and the wording in `guidelines/website.json` and `anti-slop/criteria.json`.

## 0.451.0 — 2026-10-27
### Added
- Icon library: `system-ai-credit`, a circle with a four-point spark, for AI credit usage and balances. Same stroke style as the other `system-*` glyphs; no existing icon changes
- Revert: revert the PR; one new SVG and its meaning words, nothing else references it (#400)

## 0.444.0 — 2026-10-27
### Added
- Colour rules v24: rule 2.1 allows the black logo and the black Splash (both #1A1A1A) for one-colour print on white only; new rule 2.11 and a Logo library section for the AhaSlides × Partner co-brand lockup (order, ×, spacing, sizes, greyscale at rest, white on Vivid Pink); new rules 4.10 and 4.11 for photography (real moments and relaxed portraits; avoid staged shots and stiff portraits) (#404)
- `aha-tag` `color="solid"`: a Vivid Pink fill with a white label (4.51:1), for a tag on white or on Vivid Pink at 5%. This is a visible addition to the Tag component (#404)
### Changed
- Rule 4.6 covers Vivid Pink at 5% surfaces and forbids Vivid Pink text on them (4.16:1); the Tag contract now states what `color="primary"` already renders, a black label on the 5% fill (#404)
- The contrast table names the app's light grey as #F7F7F7 (4.21:1 with Vivid Pink), not #FAFAFA (#404)
- `ahaslides-logo-black.svg` is #1A1A1A, the same black as `thesplash-black.svg` (was #000) (#404)
- `--aha-font-display` and `--aha-font-secondary` are deprecated aliases of Plus Jakarta Sans (were Nunito and Nunito Sans, never loaded); the canvas and audience library headings use `--aha-font-product` (#404)

## 0.443.0 — 2026-10-26
### Added
- `aha-input` is form-associated: its value submits under `name`, form reset restores the initial value, a disabled fieldset disables it, and Enter calls the form's `requestSubmit()` like a native text input, with a native default `<button>` or `<input>` as the submitter, deferred by one task so a host-level Enter keydown listener can veto it with `preventDefault()` (skipped for a disabled or loading default button, and for several fields with no submit button).
- `aha-input` `label` attribute: a visible label rendered as a real `<label for>` to the inner field; an external `<label for="host-id">` now focuses the field and names it.
- `aha-input` `aria-controls`: resolved to element references on the inner field where the browser supports ARIA element reflection (Chrome, Safari), so a field can point at a light-DOM results list.
### Fixed
- `aha-select`: Escape on the trigger closes the open list and keeps focus on the trigger, as a native select does; Escape from the list or the trigger no longer reaches a surrounding modal or drawer while the list is open, and does nothing when the list is closed.
- `aha-drawer` and `aha-audience-modal`: Escape pressed inside an open `aha-select` closes only the list, not the surrounding drawer or modal.
- `aha-button`: `aria-expanded`, `aria-controls`, `aria-pressed` and `aria-haspopup` on the host are copied to the inner button and follow later changes, so a disclosure toggle built on it announces open and closed.
- Revert: revert the PR; the input changes are additions in `lib/aha-input.js` and its contract, the select and button fixes are small additions in `lib/aha-select.js` and `lib/aha-button.js` (#393)

## 0.441.0 — 2026-10-26
### Removed
- **Breaking:** the `--aha-radius-pill` token (`radius.pill`, 999px) and the pill shape. AhaSlides has no pill: a true circle (avatar, dot, radio mark, slider thumb, spinner, count disc) is `border-radius: 50%`; every elongated shape (badge, count bubble, chip, tag, switch track, progress and slider tracks) takes a radius from the 4 · 6 · 8 · 12 · 16 scale. Consumers that read `--aha-radius-pill` fall back to their own value: replace it with `50%` or a scale token (#337).
- `<aha-image radius="pill">`: the option is gone, an unknown value keeps the default 8px frame (#337).
### Changed
- Components re-shaped: Badge count bubble 4px, Progress / Countdown / Uploader / background task tracks 4px, Stat tile fall chip 4px, Switch track 6px, tooltip help trigger 4px; avatars, dots, radio-like marks, thumbs and spinners are 50% circles. Skeleton `round` now softens corners to `radius-lg` (12px) and leaves the avatar a circle (#337).
- Audience and canvas kits, Marketing sections (Cards, FAQ, Header badges, Pricing slider) and the docs search chips follow the same rule; the Foundations Radius page, `design.md` and the canvas / audience / settings / feedback / report-image guidelines say there is no pill shape (#337).
- `standards.mjs` fails a 999px radius and any `--aha-radius-pill` reference in component source (#337).
- `screen-lint` fails a 999px or 9999px `border-radius` as `radius-off-scale` (#337).


## 0.437.0 — 2026-10-26
### Added
- `aha-setting-row` and `aha-settings-item`: a `badge` slot for a New or Beta tag (a DS `<aha-badge kind="new|beta">`). It sits in the label line after the "?" help or the locked crown, never beside the control; works inline and stacked, locked and unlocked. A stacked row's full-width rule now applies to the control slot only (#392)
### Fixed
- `aha-paywall`: only one upgrade popover is open at a time; opening any paywall (hover, focus, click, or the disabled control of a locked setting row) closes the one that was open (#392)
- `aha-paywall`: the first open no longer slides sideways. The align set just before the first open made the horizontal offset glide from its stale value (about 166 px on a start-aligned popover); the offset now sits in the non-animated translate property, so every open is a 4 px vertical lift (#392)
- Revert: revert the PR; the badge slot is additive in `lib/aha-setting-row.js` and `lib/aha-settings-list.js`, the paywall fixes are inside `lib/aha-paywall.js`, no existing API changes (#392)

## 0.434.0 — 2026-10-26
### Fixed
- `<aha-button>` keyboard focus is now an outline, a 2px solid ring 2px outside the button (`--aha-button-focus-ring`), with the gap still a box-shadow (`--aha-button-focus-gap`). The ring used to be a box-shadow, the same property as the elevation, so a box-shadow a consumer put on the button (a `::part(button)` rule built on `--aha-button-elevate-secondary`, for example) replaced it and a Tab-focused secondary button showed no ring. `secondary-deck` and `tertiary-deck` now draw the same ring instead of the browser's `outline:auto`. Default look, hover and press are unchanged; `--aha-button-focus-outline` and the new `--aha-button-focus-outline-offset` re-point the outline. (#372)
- The Button contract's Focus row and the deck variants' rows (and the audience tertiary-deck entry) describe the outline ring; the deck variants no longer say "the browser's own focus ring".
- `<aha-audience-submit>` keeps its focus ring 1px off the button (`--aha-button-focus-outline-offset:1px`), so it looks as before. The Button contract's hooks paragraph lists the new default outline and `--aha-button-focus-outline-offset`.

## 0.417.1 — 2026-10-26
### Changed
- `system-bug` redrawn after the Lucide bug icon (ISC, credits in `icons/svg/system/LUCIDE-CREDITS.md`): rounded head with two antennae, split body, three legs a side. Same name and size. (#402)

## 0.417.0 — 2026-10-26
### Added
- Icon library: `system-bug`, a beetle with antennae and legs, for reporting a bug or giving feedback. Same stroke style as the other `system-*` glyphs; no existing icon changes. No `-filled` pair: `system-chat-*` and the rest of `system-*` have none
- Revert: revert the PR; one new SVG and its meaning words, nothing else references it (#401)

## 0.403.1 — 2026-10-26
### Changed
- Website > Marketing pages: prose longer than about two lines is a closed disclosure with its heading still visible (Choosing a header, Which is which, video slot, Composed of, Details, and any long layout or card summary). Native `<details>`, keyboard accessible, opens when a link targets its anchor. The `.md` and llms feeds keep the full text.
- Revert: revert the PR; only the docs generator changed, no component or contract (#396)

## 0.396.0 — 2026-10-26
### Added
- Website > Marketing > Features: five Compact layouts that keep the section within one screen (about 560 to 800 px at 1440): accordion beside one image (`aha-features--compact-accordion`), tabs over one screenshot with a centred tab row (`aha-features--compact-tabs`), swipeable card scroller (`aha-features--compact-scroller`), pick from a list (`aha-features--compact-master-detail`) and top three with a See all features button (`aha-features--compact-see-all`). 48 px top and bottom padding on the shipped side gutters, the shipped closing call-to-action row, no intro sentence under the title, closed content stays in the HTML (#386)
- Revert: revert the PR; five new layouts in `marketing/features.json`, the 11 existing layouts are untouched (#386)

## 0.395.0 — 2026-10-26
### Added
- `applyCanvasDeck` takes an optional `palette` (the deck's `presentationColorPalette`) and writes `--aha-deck-palette-<n>` (the colour) and `--aha-deck-palette-<n>-ink` (`#1A1A1A` or white, whichever contrasts more, AA 4.5:1) for each colour, 1-based, up to 24; a slide type styles a palette container with tokens only. Without `palette` nothing changes
- `readableTextInk` is exported from the canvas and audience entries (`lib/canvas.js`, `lib/audience.js`)
- Revert: revert the PR; additive and opt-in, no existing caller changes (#387)

## 0.391.0 — 2026-10-24
### Added
- `<aha-canvas-play>`, the centred Play control for a slide canvas: a flat disc on `--aha-color-primary` with the white `system-play` glyph, sizes `md` (48), `lg` (64, default) and `hero` (96), the deck focus ring, no shadow; registered in the canvas bundle (#385)
- Revert: revert the PR; a new component, nothing else changes (#385)

## 0.390.0 — 2026-10-24
### Added
- Question list: `strings` (property or JSON attribute) translates every built-in string (count, Add question, Question, Options, Add option, Delete question, the accessible names and the option rows' placeholder, delete and drag-handle copy); cancelable `question-add` (`detail.index`) and `question-delete` (`detail.index`, `detail.question`) intent events let a host insert at its own position and offer Undo; the whole-list `change` event and the English copy are unchanged (#384)
- Option row: `correctlabel`, `deletelabel`, `deletehint`, `reorderlabel` and `reorderhint` carry the toggle, delete and drag-handle copy in the host's language (English defaults) (#384)
- Canvas count: `total` shows "12 of 30" with the name "12 of 30 answered" (answered-only form); `strings` translates the "of" copy and the accessible names; without `total` it renders exactly as before (#384)
- Collapse: `status="error"` or `"warning"` paints the panel border with `--aha-border-error` or `--aha-border-warning`; `selected` keeps the head on the hover background and sets `aria-current` on it, replacing a hand-set `::part(head)` background; without either attribute it renders exactly as before (#384)
- Settings entry (`lib/settings.js`) registers `aha-tag`, so screen-lint no longer reports it as an unregistered element in a settings panel (#384)
- Revert: revert the PR; all additions are opt-in and default to the previous behaviour (#384)

## 0.387.0 — 2026-10-24
### Changed
- Splash rules apply to any splash background in any medium, with no exceptions: colour rules 5.1 to 5.5, 5.7 to 5.11, 5.14, 5.15, 5.17 to 5.19, the splash layouts table and the Splash in CSS block now cover every environment, including report images, which draw a hero band splash with the Splash in CSS block on the band's own frame and never place it by hand; 5.6, 5.12, 5.13 and 5.16 keep their scope (#383)
- Background criterion C8 now also judges splash geometry on every surface that carries a splash: a DS layout drawn by the colour-rules geometry for its own frame, never hand-placed; fail and pass fixtures added to the background evals (#383)
- Revert: revert the PR; only environment tags, one criterion and two eval cases change, no rule id or rule text changed (#383)

## 0.386.1 — 2026-10-23
### Fixed
- Brand voice rules and Brand colour rules pages render inside the shared site shell (header, Foundations nav with its entry highlighted, search, footer) instead of as standalone documents; content and rule anchors unchanged (#381)
- Revert: revert the PR; only the two page templates, their render functions and the nav entry change

## 0.386.0 — 2026-10-23
### Added
- Brand voice rules: `brand/voice-rules.json` is the one source of the verbal brand (v2.2 why, positioning, audiences, messaging, opinions, spices, tone, writing rules, plus British spelling, one clear CTA, retired wording and which rules apply to which kind of communication). Rendered as `foundations/brand-voice-rules.html`, `voice-rules.md` and `voice-rules.agent.json`, listed in `llms.txt`, the Assets navigation and every environment's route, and exported as `@ahaslides-product/design/voice-rules.json` (#370)
- screen-lint copy rule `retired-wording`: fails a screen that describes AhaSlides with retired wording such as "interactive presentation software" (#370)
- Colour rules 2.8 to 2.10: logo clear space and isotype sizes, favicon and avatar use, from brand guidelines v2.2; mirrored on the Logo library page (#370)
### Fixed
- Contrast figures in the colour rules: Vivid Pink text on Vivid Pink at 5% is 4.16 to 1 (was 4.18), 86% white on Vivid Pink is 3.58 to 1 (was about 3.7) (#370)
- Page title example in `guidelines/page-title-favicon.json` uses the v2.2 description (#370)
- Revert: revert the PR; it adds new files and one lint rule, and no existing colour, button, hero, background, logo, font or icon rule changed (#370)

## 0.385.1 — 2026-10-23
### Fixed
- `<aha-question-nav>`: the current item's tint fallback is `#E70E680D` (5%), matching `--aha-bg-accent`, so it renders at the right tint without `tokens.css`; the contract summary says the current item is ringed, not filled. (#380)

## 0.385.0 — 2026-10-23
### Added
- `<aha-question-nav count current results>`: a numbered jump list for the questions of a report. The current question is ringed in the brand colour with `aria-current`; arrow keys, Home and End move focus (one tab stop), Enter or a click picks one and emits `change` `{value, index}`. A long list scrolls in the strip with scroll buttons that appear only on overflow, or `wrap`s onto lines. `results="correct|incorrect||correct"` adds an `<aha-answer-mark>` beside the number; the number stays ink (colour rule 11.3). It reuses the page cell of `aha-pagination`; segmented, pagination and tabs do not cover a per-question jump list with results. (#378)

## 0.384.0 — 2026-10-23
### Added
- `<aha-answer-result result="correct|incorrect|key" label>`: a read-only answer row for the Report and Session Report participant view. A wrong response is a 2px `--aha-answer-wrong` ring over the 5% wrong tint plus the answer mark (cross); a correct response is a 1px `--aha-answer-correct` edge over the 5% correct tint plus the mark (tick); the answer key (default) is plain, with no tint, edge or mark. The text stays the default ink at regular weight (colour rules 11.2 and 11.5). Stacked on #375 (`<aha-answer-mark>`): merge after it. (#379)

## 0.383.0 — 2026-10-23
### Added
- `<aha-badge kind="partial">`: a partially correct answer (some points, not all), such as a match pairs card with some pairs wrong. Label "Partially correct" in the default ink on the grey Beta fill, with a 16px neutral `system-minus` glyph; no answer colour (colour rules 11.1 and 11.4 keep green and red for a fully correct or wrong answer). Sizes `sm` (default) and `default`. (#377)

## 0.382.0 — 2026-10-23
### Added
- `<aha-drawer>`, the side Drawer as a web component for pages that cannot load antd (Vue 2 apps taking `<aha-*>`, plain HTML, standalone demos), which hand-drew the panel before. It copies the antd Drawer as themed by `drawerTheme`: white panel 378 wide (`size="large"` 736, or `width`), header padding 16 24 with a 16px SemiBold ink title and the shared dismiss ✕ (tertiary icon-only xs `aha-button`, `system-x`), body padding 24 that scrolls, a `footer` slot with padding 8 16, split-colour rules, the antd drawer shadow, the overlay mask and the 0.3s slide. `open`, `heading`, `placement` (right or left), `static`, `contained` and `inline` attributes; Escape, mask and ✕ emit a cancelable `close`, then `closed`; Tab is trapped, page scroll locked and focus returned to the opener; reduced motion switches the slide off. The antd Drawer is unchanged and still the choice where antd is loaded; both contracts now say when to use which. `lib/aha-audience-modal.js` now shares its open-overlay stack, page scroll lock and layer order with the drawer: it exports `openModals`, `lockPageScroll`, `unlockPageScroll`, `raiseLayer`, `lowerLayer`, `focusableWithin` and `deepActiveElement`, and a modal opened over a drawer (or a drawer over a modal) is the one that paints on top and takes Escape and Tab, in either DOM order. Revert: `git revert` the merge commit, which removes `lib/aha-drawer.js`, its contracts, parts and tests, the `package.json` and `all.js` lines, and the `lib/aha-audience-modal.js` changes. (#376)

## 0.381.0 — 2026-10-23
### Added
- Colour rule 11.5, weight: right and wrong carry equal weight (edge, 5% tint, mark), and on answer reveal and review screens (the audience reveal, the Report participant drawer) a wrong answer may add a 2px ring in the wrong red outside its edge. The answer key stays plain, and text never changes weight by verdict. Docs and agent guidance only. (#374)
### Fixed
- Feedback rule `inline-result-tokens` and judge criterion C2 colour an inline correct or incorrect result with the `--aha-answer-correct` / `--aha-answer-wrong` edge over the 5% tint, not `--aha-colorSuccess` / `--aha-colorError`, which are ink. The answer-option contract states the same.
- Status badge rule `app-colours` no longer lets the Report app keep its own Correct, Partially correct and Incorrect colours: answer results are excluded, Correct and Incorrect use `aha-badge` `kind="correct|incorrect"`, and Partially correct takes no answer colour.

## 0.380.0 — 2026-10-23
### Added
- `<aha-answer-mark result="correct|incorrect" size>`: the one mark for a correct or incorrect answer, a white `system-check` / `system-x` on a solid `--aha-answer-correct` / `--aha-answer-wrong` disc (colour rule 11.3). Sizes 16, 20 (default), 24 and 32, with a 12, 12, 16 or 24px glyph. Named "Correct" / "Incorrect" for screen readers (`label` to translate), or `decorative` beside visible text. (#375)

### Changed
- `<aha-answer-option>` shows the 20px answer mark on a revealed row, in the place of the 20px pick control, instead of a bare 16px tick or cross in the answer colour. Row height and gaps are unchanged. (#375)
- `<aha-badge kind="correct|incorrect">` leads with the 16px answer mark instead of the outline `system-check-circle` / `system-x-circle` in the answer colour, at both sizes (sm was a 12px icon). Fill, label, height and padding are unchanged. (#375)
- `<aha-canvas-count>` draws its verdict discs with the answer mark; the render is unchanged. (#375)
- `<aha-chart>` draws the correct option's disc with the answer mark (20px, 6px before the label); the render is unchanged. (#375)

## 0.374.2 — 2026-10-23
### Fixed
- The three canvas C24 eval fixtures (`bad-c24-drag-only-reorder`, `bad-c24-hover-only-dots`, `good-c24-keyboard-operable`) paint borders and the label background with the deck tokens (`--aha-deck-container-stroke`, `--aha-deck-modal-fill`) instead of product tokens, so they pass canvas C1 as evals 74-76 expect. The good fixture's label now fades in with `--aha-motion-mid` and `--aha-ease-out`, so it passes C22. Each fixture still fails or passes C24 as before. Evals only, no component change. (#373)

## 0.374.0 — 2026-10-23
### Added
- Canvas anti-slop criterion C24 "Keyboard-only operation": every presenter interaction must work with the keyboard alone (Tab order with a visible focus ring, hover also on focus, a keyboard alternative to any drag or pointer gesture, no trap, deck navigation keys never swallowed), per Slide Plugin Policy section 6. Three evals (hover-only result dots, drag-only reorder, a good control) and a Canvas guide section. C10 is unchanged. (#328)

## 0.373.0 — 2026-10-23
### Added
- `<aha-setting-row>` and `<aha-settings-item>` take `locked` (plus `plan`, `feature-key`, `upgrade-body`) for a setting that needs an upgrade. A locked row reads: the label, the shared `<aha-paywall>` crown in the place of the "?" help (the "?" is hidden), and the real control disabled. The label keeps its normal colour. The Paywall feature label is the row label.
- `<aha-paywall>` takes an opt-in `align` (`center` default, unchanged; `start` puts the popover's left edge on the anchor with the arrow under it; `end` mirrors it) and exports `fitPaywall(el)`, which picks align and placement from the room around the anchor and keeps the popover inside the viewport. Locked setting rows call it before the popover opens, so a short label in a narrow left-aligned panel no longer clips.
- Clicking the disabled control of a locked setting row (`<aha-setting-row>`, `<aha-settings-item>`, so also `<aha-settings-list>` rows) opens the same Paywall popover as the crown; the control stays disabled and unfocusable. `<aha-paywall>` gains `togglePopover()` and the `toggleLockedPaywall(el, event)` export.
- With `align`, the popover now hangs 12px past the anchor edge so its arrow sits 20px in, clear of the rounded corner, and points at the crown's centre.

### Changed
- The Setting row docs page gains a "Locked, in a right-hand panel" example: a narrow scrolling panel at the right edge, where the Paywall popover opens to the left of the crown. (#371)
- `<aha-settings-list>` schema rows with `locked: true` use the same layout and render their `control` disabled; before, the crown replaced the control on the right. New row keys `featureKey` and `upgradeBody` pass through to the Paywall. The settings guide, `plan-gated` guideline and criterion C6 describe the new layout. (#371)
### Fixed
- `<aha-paywall>`'s popover is no longer cut off by a scrolling or overflow-hidden ancestor, such as a right-hand settings panel. It now renders in the browser's top layer (`popover="manual"`, with `position:fixed` as the fallback where the Popover API is missing), is positioned from the anchor on open, follows the anchor on scroll and resize, and closes when the anchor scrolls out of view. Its text always starts at the left edge, even when the popover opens to the left of the anchor. The default look and the open and close motion are unchanged. (#371)

Revert: restore `lib/aha-paywall.js`, `contracts/paywall.json`, the paywall parts, `lib/aha-setting-row.js`, `lib/aha-settings-list.js`, the setting-row and settings-list contracts and parts, `guidelines/settings.json`, the C6 text in `anti-slop/criteria.json` and `tests/setting-row-locked.test.mjs` from git.

## 0.372.0 — 2026-10-23
### Added
- Deck tokens: a "Role to token" table says which `--aha-deck-*` token paints text, secondary text, divider, chip outline, fill, hover, pressed, panel, modal, frosted panel and a verdict mark on a hand-built canvas or audience element. The aha-design skill (step 13) now says any hand-built element calls `applyCanvasDeck` / `applyDeck` once and paints only with that ladder, never its own shade of the ink or a product colour token. (#363)
- screen-lint: new `canvas-off-deck-colour` warning on the canvas and audience surfaces for `color-mix()` and product colour tokens (`--aha-text-*`, `--aha-border-*`, `--aha-bg-*`, `--aha-surface-*`, `--aha-icon-*`, `--aha-color-*`, `--aha-link-*`) in a colour declaration. It never fails the build, so existing slide types are not blocked.
### Changed
- Anti-slop canvas and audience C1 now require colour on a hand-built element to come from the `--aha-deck-*` ladder written from xprops, and FAIL its own `color-mix` or opacity of the ink and product colour tokens. Two canvas evals added.

## 0.367.2 — 2026-10-22
### Fixed
- `<aha-button>` declares `formAssociated` as a static getter instead of a static class field, which Safari and iOS below 14.1 cannot parse. Behaviour is unchanged. The browser-syntax test now also fails on a static class field in any browser-shipped `lib/*.js` file. (#367)
Revert: restore `lib/aha-button.js` and the second test in `tests/browser-lib-syntax.test.mjs` from git.

## 0.367.1 — 2026-10-22
### Fixed
- `<aha-button>` no longer uses a regex lookbehind to build its link-form style, which Safari and iOS below 16.4 cannot parse (the chunk holding the button failed to load there). The rewritten rule produces a byte-identical stylesheet. A test now fails when any browser-shipped `lib/*.js` file contains a lookbehind. (#366)
Revert: restore `lib/aha-button.js` and remove `tests/browser-lib-syntax.test.mjs` from git.

## 0.367.0 — 2026-10-22
### Added
- Website guideline W2 now carries two spacing rules. Page gutter: every Marketing section keeps the same side padding, 64px on desktop, 24px at 767px and below, 16px at 479px and below (a section reads it as `--aha-web-gutter` on its inner element). Content to button: a button directly under its own text sits 32px below it (24px at 479px and below), a closing call to action after a list or grid sits 48px below (32px at 479px and below), buttons next to each other 12px. A new test (`tests/web-gutter.test.mjs`) fails when a section's side padding differs from the gutter at 375 and 600px. (#360)
### Changed
- Mobile side padding is now one value across Features, Numbers, Pricing, Testimonials, Cards, FAQ, Footer banner, Footer, Navigation, the 6 page headers, the 14 heroes and the 4 Hero Pink layouts: 24px at 767px and below, 16px at 479px and below (it was 32, 16, 64, 0 and 24 depending on the section). The Footer banner card also steps 24px / 16px inside. Desktop side padding of heroes, page headers, Hero Pink, Footer, Navigation and Cards is unchanged. (#360)
- Button spacing on desktop: Features and Numbers action row 16px to 32px under the text, the 14 heroes' action row and form 40px to 32px, Footer banner paragraph to button 24px to 32px. FAQ keeps its desktop layout and no longer uses `--aha-faq-gutter` (the Frequently asked questions heading and button spacing moved from the inner gap to margins). Revert: undo this release's `marketing/*.json` edits. (#360)
- The Webflow scan lists the live gutter and button gaps as consumer-to-update items. (#360)

## 0.365.0 — 2026-10-22
### Changed
- Colour rule 6.2: on Vivid Pink the button is the standard secondary Button; on Vivid Pink at 5% (light pink) and on white it is the primary Button. The white primary with a Vivid Pink label, and the paragraph that called it the one exception to "every button is the design system Button", are gone. Colour-rules version row v20.
- Header hero-pink, hero-pink-vertical, hero-pale-pink, hero-pale-pink-vertical and the Footer banner draw their call to action as `<aha-button variant="secondary">` on the solid Vivid Pink surface, with no `--aha-button-*` re-theme or `ds-lint-allow` line. The Pale Pink state of the four Hero Pink layouts is Vivid Pink at 5%, so its button is the primary: a `data-variant-pale="primary"` (Hero Pink, Hero Pink Vertical) or `data-variant-default="secondary"` (Hero Pale Pink, Hero Pale Pink Vertical) hook switches the variant per state in the live preview.
- The 15 other Header layouts with a Vivid Pink (`--brand`) state lose their `--aha-button-*` re-theme and `ds-lint-allow` lines too. Their primary buttons carry `data-variant-brand="secondary"`, so White and Accent (Vivid Pink at 5%) keep the primary and only the Vivid Pink state shows the secondary.
Revert: restore `brand/colour-rules.json`, `marketing/header.json`, `marketing/footer-banner.json`, the wording in `guidelines/website.json` and `anti-slop/criteria.json`, and the `data-variant-` line in the layout variant script of `generate.mjs` from git.

## 0.362.0 — 2026-10-22
### Added
- Button: `href` draws `<aha-button>` as a link (it renders `<a href>`, forwarding `target` and `rel`, so header Log in / Sign up and marketing calls to action navigate and are crawlable), and `type="submit"` / `"reset"` submits or resets its form; the Button is now form-associated, and Enter in a text field of the form submits it, as with a native submit button (not while the Button is disabled or loading) (#332).
- screen-lint: the `hand-rolled-button` rule hard-fails on every surface a button the screen draws itself (a `button` / `btn` / `cta` class, `<button>`, `[role=button]` or link painted with a fill and a button shape, or state fills) and any restyle of `<aha-button>` (a colour, fill, border, shadow, height or `:hover` / `:active` / `:focus` rule on it, its `::part` or a `--aha-button-*` token); only layout may be set on it. Opt-out: `ds-lint-allow: hand-rolled-button (why)` (#332).
- Websites → Website composition: rule and criterion W16 "Every button is the DS Button, never restyled", with a failing eval of the games.ahaslides.com header case; aha-design skill rule 12 (#332).
### Changed
- Marketing Navigation, Header (all layouts), Features, Numbers and Footer banner draw every button with `<aha-button variant size>` (Log in secondary, Sign up primary, Join `type="submit"`), and their own button CSS (`aha-header__button`, `aha-header__join-button`, `aha-header-section-*__button` / `__cta`, `aha-features__button`, `aha-numbers__button`, `aha-footer-banner__cta`) is removed. The label is now the Button's semibold; on a Vivid Pink surface the Button is made white through the `--aha-button-*` tokens, marked `ds-lint-allow: hand-rolled-button`, until the Button has an on-brand variant. Revert: revert this change; the bespoke classes come back with it (#332).
### Fixed
- Button: a submit or reset `<aha-button>` defers the form action with `setTimeout`, so a click listener on the host that calls `preventDefault()` cancels it for a real mouse click too.
- screen-lint: `hand-rolled-button` no longer flags a decorative `::before` / `::after` underline on a link, nor hyphenated names such as `a-card` and `aha-button-group`, nor a card or tile link (`a.card` with a fill and radius), nor any `::before` / `::after` rule such as `.btn::after`. (#332)

## 0.356.0 — 2026-10-22
### Removed
- Canvas status: the response count line (people glyph and "8 of 24 answered") is gone, along with the `answered`, `total` and `count-text` attributes; `<aha-canvas-status>` now shows only the status line. Consumers passing those attributes no longer see a count. Docs section renamed "Status line"; contract, canvas guideline and snippets updated. (#356)
### Changed
- Canvas count: the count is 16px / 600 (was 20px) and the rest steps down with it. The container is 40px tall (was 48), the verdict disc 20px with a 12px check or cross (was 24 with 16), the person glyph stays 16, padding is 8 on the disc side and 16 on the glyph side (was 12 / 20; `--aha-space-8` / `--aha-space-16` instead of the deck container padding), 6px inside a part and 8px between parts (was 8 / 12). Radius, fill, blur and deck inking are unchanged; no API change. (#356)

## 0.354.1 — 2026-10-22
### Fixed
- Anti-slop criteria: 22 judge rules in `anti-slop/criteria.json` stopped mid-sentence with "…" (canvas C2 stopped at its lead-in), so a judge saw only part of each rule. They now carry the whole rule from the aha-design judge they were seeded from: canvas C2, C7, C16; audience C4, C15, C24, C26 to C29; settings C5, C9, C10, C12, C14, C15; feedback C1, C2, C4, C5; overlays C1; paywall C2. Another 27 rules had been cut to their first two sentences without a "…" (canvas C12 kept only its scope, audience C13 ended at "Two facets: 1."); they now carry their whole rule too: canvas C8, C11, C12, C14; audience C2, C3, C7, C8, C11, C12, C13, C16, C17, C21, C23, C25; settings C2, C3, C7, C8; feedback C3; overlays C2, C4, C6; paywall C4, C6, C7. Wording the store had already changed stays. `standards.mjs` now fails a criterion whose test ends in "…", in a ":" or in a list number with nothing after it (#355)

## 0.354.0 — 2026-10-22
### Changed
- Marketing → Header: the optional Hero Video slot sizes to the clip's own aspect ratio (from its `width` and `height` attributes) instead of a fixed 16:9 frame, so wide demo clips no longer show dark bands. A height cap of `min(80vh, 40rem)` stops a tall clip taking over the hero. Still off by default; no other layout changes. (#352)

## 0.353.1 — 2026-10-22
### Fixed
- Icons: the dots in 23 system glyphs (smiley, sad-face, angry-face, question, question-mark, exclamation-mark, info, warning-circle, dots-three and others) no longer render as hollow rings on iOS Safari. Each dot was a tiny closed path with a 1.5 stroke wider than the shape; WebKit strokes it as an outer and an inverted inner contour. Each is now a plain filled circle of the same size, so desktop rendering is unchanged. The icon build fails if a source icon draws a stroked closed path smaller than its stroke width (#354)

## 0.353.0 — 2026-10-22
### Added
- Websites → Header: the G2 reviews row shows the G2 logo in a white rounded card (committed in `marketing/images/reviews/`) instead of five avatars, and is on by default: the layout html and css include it, the preview switch starts on On, and the agent feed and Markdown say it is removable. The row is baked into the layout before the section html and css are composed, so the paste-and-run code, `header.md` and the agent feed carry it. Layouts without `reviews` are unchanged. Revert: restore the previous `reviews` object, highlight and guidance line in `marketing/header.json`, remove `bakeMarketingReviews` from `generate.mjs` and delete `marketing/images/reviews/`. Environment: marketing-web (#345)

## 0.348.1 — 2026-10-22
### Changed
- Chart → Pick Answer: the correct option now uses the answer colour `--aha-answer-correct` in both palettes (the deck palette no longer turns it into the deck ink), and the correct mark beside the label is the DS tick disc: a white tick on a solid green disc, the label text stays ink. Incorrect options stay unmarked. (#346)

## 0.348.0 — 2026-10-22
### Added
- Screen-lint: three hard UX writing rules on every surface (product, settings, canvas, audience, website), reading user-visible UI strings only (HTML text nodes, `title`, `aria-label`, `aria-description`, `placeholder`, `alt`, `label` and `heading` attributes, and string literals under UI-text keys in scripts; never comments, CSS, URLs, identifiers, `<code>`, `<pre>` or `<kbd>`): `no-dash-punctuation` (UXW-8, em or en dash, raw or as an entity), `vague-error-copy` (UXW-2, "Something went wrong", "An error occurred", "Oops", "Unexpected error", "Some items could not be loaded") and `title-case-slide-name` (UXW-1, "Multiple Choice", "Word Cloud", "Open-Ended", "Spinner Wheel", "Rating Scale"). Opt out per line with `ds-lint-allow: <rule> (why)` or `ds-lint-allow: copy (why)`. Pass `path` to `lintHtml` for a `.js` or `.ts` file so it is read as script. Revert by reverting this commit; the rules are additive (#351)
### Changed
- UX writing guide and guideline say which rules `screen-lint` enforces; the Alert, Illustration and Spin snippets lose the em and en dashes the new gate found (#351)

## 0.346.0 — 2026-10-22
### Added
- Screen lint: `node screen-lint.mjs --surface=website <files>` for a whole website page of Marketing sections. It runs the product rules (raw hex, off-scale radius and weight, gradients, icons) and accepts the `min-width` breakpoints the shipped Marketing sections use (768 and 992, generated into `lib/marketing-breakpoints.js` from `marketing/*.json`) inside `@container` and `@media` conditions; any other `min-width` still fails `min-width-trap`. It adds two hard rules from the website guideline: `multiple-h1` (W4, one H1 per page) and `img-no-alt` (W6, every picture has alt). Product, canvas, audience and settings behave as before. Revert: remove `lib/screen-lint-website.js`, `lib/marketing-breakpoints.js`, their hooks in `lib/screen-lint.js` and `generate.mjs`, and the `website` entry in `screen-lint.mjs` (#348)

## 0.345.0 — 2026-10-22
### Added
- Foundations → Logo → Integrations: Canva, Zapier, D2L Brightspace and Cornerstone OnDemand join the integration logos (`logo/canva.svg`, `logo/zapier.svg`, `logo/d2l-brightspace.svg`, `logo/cornerstone-ondemand.svg`; full-colour originals in `logo/original/`). Each is taken from the brand's own site or brand page, with the source and fetch date in `logo/manifest.json`. (#350)

## 0.344.0 — 2026-10-22
### Added
- Marketing → Header: an optional Video slot (off by default) for Hero Pink Vertical and Hero Pale Pink Vertical: a `<video>` with native controls, poster, captions track and download fallback, never autoplaying or looping. The layout html and css are unchanged when it is off. Docs page section, markdown and `marketing.agent.json` `video` entry. (#347)
### Fixed
- Marketing → Header: Hero Pink Vertical and Hero Pale Pink Vertical show the image whole at its own ratio at every width instead of cropping it to a fixed 4:3 or 16:9 frame with `object-fit: cover` (on phones the crop was severe), as rule W6 requires. Header guidance names the Hero video and the uncropped image. (#347)

## 0.343.0 — 2026-10-22
### Added
- Deck: one shared deck token module, `@ahaslides-product/design/deck`, with `applyDeckTokens(target, { ink })` and `deckTokens(ink)`, re-exported from both `lib/audience.js` and `lib/canvas.js`. The canvas and the audience phone now write the same `--aha-deck-*` ladder; `applyCanvasDeck` adds only its button, container and modal variables and `applyDeck` only its accent set. Both signatures are unchanged. Environment: audience, product (#343)
- Audience: `applyDeck` now also writes `--aha-deck-ink-secondary`, `--aha-deck-stroke`, `--aha-deck-stroke-chip`, `--aha-deck-stroke-hover`, `--aha-deck-line` and the fill and surface tokens the canvas already had (#343)
### Changed
- Audience: secondary text (counts, captions, hints, sub-lines, eyebrows) moves from the ink at 65% to 76%, and panel and track hairlines from 10% to 12%, matching the canvas. Affects answer list, image upload, rank list, scale slider, submit button, submitted card, countdown, swipe card, waiting-for-host and identity strip; the 20% chip and control edge, the 60% hover edge and the surfaces are unchanged (#343)
- Docs: the Deck tokens page moves out of Canvas Library into Foundations, next to Tokens, and says the canvas and the audience share it. Its URL stays `deck-tokens/index.html` (#343)
### Deprecated
- `--aha-deck-ink-muted`, `--aha-deck-edge` and `--aha-deck-edge-hover` are still written, as aliases of `--aha-deck-ink-secondary`, `--aha-deck-stroke` and `--aha-deck-stroke-hover`; move to the new names. `audienceSurface` and `audienceBorder` stay exported as aliases of `deckSurface` and `deckStroke` (#343)

## 0.341.0 — 2026-10-22
### Added
- Marketing → motion script `lib/marketing-motion.js` (`@ahaslides-product/design/marketing-motion`): Marketing sections reveal on scroll with an 80 ms stagger, section photos drift up to 48 px against the scroll, and Numbers values count up from 0 once in view. Off under `prefers-reduced-motion`, per section or page with `data-aha-motion="off"`. (#341)
- Marketing → Features, Numbers, Testimonials and FAQ: every content section ends with a shipped call to action row (`__cta`, or `__actions` in a split header): the hero's call to action (sample label Sign up), or a link to the section's own page in Templates, Integrations, case-study and FAQ sections (W18); the FAQ links to the AhaSlides docs (`Read the docs`). Same tab, centred under a centred heading, left under a left heading. (#341)
- Websites → Website composition: rules and criteria W17 heading alignment, W18 section call to action and W19 testimonial author alignment, with failing evals and fixtures. (#341)

### Changed
- Websites → Website composition: W18 now says when a call to action is Sign up and when it goes to another page. Only the Templates, Integrations, case-study (testimonials included) and FAQ sections link out, to the template library, the integrations page, the case studies and the AhaSlides docs, with a label naming the destination; every other content section ends with the hero's primary call to action as a primary button, with the hero's own label (the page-specific label W4 asks for; Sign up in the snippets is only the example), so W4 and W18 never ask for different labels. W1 drops its limit of one mid-page Sign up. The pass fixtures' section calls to action repeat their hero label, master's W4 fixture gains the section call to action rows, and a test checks every fixture's section primary matches its hero. (#341)
- Websites → Website composition: W9 motion now asks for the staggered reveal, light photo parallax and count-up numbers from the DS script (it banned parallax before). (#341)
- Marketing → Testimonials: quote and author block left aligned in every layout, and quote cards share one author baseline through subgrid. (#341)
- Marketing → FAQ: the title centres itself with `text-align:center`, so a Webflow or page reset cannot pull it left. Numbers `actions-row` puts its actions below the stats under a centred header; Features, Numbers and Pricing symmetric layouts ship the `--center` header. (#341)

## 0.339.0 — 2026-10-22
### Changed
- Website rule W4: the Sign up / primary call to action label is written for the page's context (a verb plus what the visitor gets), with Get started free only as the fallback; the Footer banner repeats the hero's label. Header and Footer banner docs say the sample label is per page. New website eval case for a generic label; the pass fixtures use page-specific labels. (#344)

## 0.335.1 — 2026-10-22
### Fixed
- Chart: with `palette="deck"`, Pick Answer paints the correct mark (`correct-style=fill` bar or column, and the ✓ badge) with the deck ink instead of `--aha-color-success`, so it no longer disappears on a dark deck or turns unreadable on a blue one. Brand mode is unchanged. Revert: delete `--_correct:var(--_ink);` from the `.root.is-deck` rule in `lib/aha-chart.js`. Environment: product, audience (#342)

## 0.335.0 — 2026-10-22
### Changed
- Website FAQ: hovering a question with a mouse turns its text and the plus or minus Vivid Pink (`--aha-color-primary`) over `--aha-motion-fast`, and the plus/minus loses its circle outline (the two bars and their rotation stay). Real pointers only (`@media (hover:hover)`), open and closed rows, no layout shift; reduced motion stops the transition. (#340)

## 0.334.0 — 2026-10-22
### Added
- Canvas: `<aha-canvas-count>` (`@ahaslides-product/design/aha-canvas-count`), the answer count drawn on a slide canvas, with its own contract and docs page. `correct` and `wrong` show the verdict form (green tick disc, count and person glyph, a divider, red cross disc, count); `answered` alone shows how many people answered, with no verdict. A 48px small deck container (radius 8, padding 12 left and 20 right, 1.5 times the review page's), filled from the deck tokens with no stroke, frosted on a photo deck; one accessible group named by `label` (default "12 correct, 3 incorrect"). Environment: product (#338)
- Canvas: `<aha-canvas-status>` (`@ahaslides-product/design/aha-canvas-status`), the status line and response count: `text` (default "Waiting for answers…", empty hides it) above "N of M answered" from `answered` and `total` (or a translated `count-text`). Free-floating deck ink with no backing, a polite live region (#338)
- Canvas: deck token ladder from `applyCanvasDeck`, all aliases of the deck ink: `--aha-deck-ink-secondary` (76%), `--aha-deck-line` (24%), `--aha-deck-stroke-chip` (20%), `--aha-deck-fill-active` (16%), `--aha-deck-stroke` and `--aha-deck-fill-hover` (12%), `--aha-deck-fill` (8%), `--aha-deck-surface` (the opposite of the ink at 80%). Container set for rounded rectangles on any deck, white or black ink: `--aha-deck-container-fill`, `-stroke` (1px), `-stroke-empty` (1px dashed, an empty slot only), `-radius-lg` 12 and `-radius-sm` 8, `-padding-sm` 12, `-md` 20 and `-lg` 32, and for a canvas modal such as the presenter leaderboard `--aha-deck-modal-fill` (the opposite of the ink at 92%, so the slide behind barely shows) and `--aha-deck-modal-backdrop`. `applyCanvasDeck({ image: true })` makes the container fill the frosted surface on a photo deck. Canvas library: Correct / incorrect count, Status line and response count, Stepper and Deck containers and modals cards on light, dark and photo decks in both inks (#338)
- Canvas: `<aha-stepper>` is listed as a canvas component and reads the deck ladder when it sits inside a deck, so it is inked by the deck with no fork; with no deck tokens it renders exactly as before (#338)
### Changed
- Tokens: `--aha-viz-mix-*` steps are multiples of 4: axis 24 (was 26), track 8 (was 7), stroke 12 (was 10), hover 12 (was 8) and dim 40 (was 38); `secondary` 76, `grid` 12, `stroke-chip` 20 and `active` 16 already were. Charts shift by at most 4 points of opacity; `tertiary` 54 stays until the chart labels are reviewed. Revert: restore `viz.mix` in `tokens.canonical.json` and drop `lib/aha-canvas-count.js`, `lib/aha-canvas-status.js`, their contracts and parts and the ladder in `lib/canvas-deck.js` (#338)
- Docs: the Canvas Library dropdown is now Chart, Components and Deck tokens. Correct / incorrect count, Status line and Stepper are cards on Components (they no longer have their own entries in the Components sidebar; their `canvas-count` and `canvas-status` contract pages and agent feeds stay). The `--aha-deck-*` ink ladder and the container and modal tokens move to the new Deck tokens page at `deck-tokens/index.html`. `lib/canvas.js` already registers every canvas component and exports `applyCanvasDeck`, so the one CDN tag loads all three pages (#338)

## 0.325.1 — 2026-10-21
### Fixed
- Audience library: every example is in English. The answer list, rank list, text fields, slider, chips, image upload and audience modal demos had Vietnamese labels, options and placeholders. (#339)

## 0.325.0 — 2026-10-21
### Added
- Audience: `<aha-audience-modal>` (`@ahaslides-product/design/aha-audience-modal`), the audience phone's modal and the mobile twin of the DS Modal, with its own contract and docs page. One centred card in three types: `details` (one option in full, the default, opened from an expandable option), `action` (a heading, a task and its actions) and `confirmation` (a question, one line and two named answers, announced as an alertdialog, no close button, focus on its first non-`danger` action when it opens). Buttons in `slot="actions"` stay pinned below the scrolling body, stacked full width on a phone and in one row from a 400px card. A tap on a button with `data-action` emits a cancelable `action` event and closes with that value; every close fires `close` with `detail.returnValue` (`dismiss` for the close button, Escape or a tap outside), and `show()` returns a promise of it. `destructive` ignores the tap outside. It has no dark backdrop and no swipe to dismiss, so nothing is cut off inside an iframe: the card has a 1px border and a soft shadow, and closes on a tap outside it through an invisible layer. Audience library: the Modal card shows all three types in a phone frame, opened by a tap.

### Changed
- Audience: the option detail is the audience modal's `details` type, a centred card, instead of a bottom sheet that slid up from the screen edge. `<aha-bottom-sheet>` stays registered as a deprecated alias of the same element, so 0.307.0 consumers keep working. Breaking for those callers: no swipe-down to close, no `::part(backdrop)`, no slide-up bottom position or 75% height cap, `close` now carries `detail.returnValue`, and removing `open` from outside also fires `close`. Revert: restore `lib/aha-bottom-sheet.js` from 0.321.0 and drop `lib/aha-audience-modal.js`, its contract and parts (#334).

## 0.322.0 — 2026-10-21
### Added
- Websites → Website composition: three global rules and criteria, W11 balanced grids (a card or feature grid never leaves an empty column slot; the column count follows the item count), W12 no layout fatigue (at most 3 alternating rows in a section, never two alternating sections back to back, steps use the Steps row, neighbouring sections change layout) and W13 Testimonials and FAQ are the current DS sections pasted unchanged. Three new failing eval pages and `tests/website-composition.test.mjs`; the pass pages now use the current Testimonials and FAQ. Revert: remove W11 to W13, the three eval pages and the grid block at the end of the Cards and Features CSS; no existing class changed (#321)
- Marketing → Cards, Features and Numbers: the Cards grid, the Features icon grid and the Numbers stats (centred layout; the 4-up row at 3 stats) balance by item count with no modifier. At 992px and wider: 1 item is one centred column, 2 items 2 columns, 4 items 2 by 2, 5 or more 3 columns with the short last row centred; at 768 to 991px a lone last card is centred. The image-led grid and the Steps row are untouched. Environment: marketing-web
- Marketing → Features and Cards: `aha-features__photo--fill` and `aha-marketing-card__media--fill`. The image fills its container edge to edge at its own ratio (the slot takes the image's ratio), so a same-size image needs no crop and no frame. New Features layout "Alternating with mixed-size screenshots", Cards snippets "Use-case row, images fill" and "Mixed-size row with a Vivid Pink frame", and two placeholders, `marketing-assets/image-placeholder-wide.svg` (16:9) and `image-placeholder-tall.svg` (3:4). Environment: marketing-web (#321)
- Websites → Website composition: rule and criterion W15 content card links open in a new tab. Every Template, Testimonial or case-study, Integration, Article, Feature and Use-case card link and every Features `Learn more` link in the Marketing snippets now has `target="_blank" rel="noopener"` and a visually-hidden "(opens in a new tab)" (`aha-marketing-card__visually-hidden`, new `aha-testimonials__visually-hidden` and `aha-features__visually-hidden`); Sign up and other call-to-action buttons and the Navigation and Footer links stay in the same tab. New failing eval page `fail-w15-cards-same-tab` and a test. Revert: restore the snippet links without the attributes, remove the two hidden-text classes, W15, the eval page and the test. Environment: marketing-web (#321)
- Websites → Website composition: templates are always a 3 by n grid on desktop. Rule and criterion W10 carve templates out of the 2-column image-led layout and W11 out of count balancing: a grid of Template cards is 3 columns at 992 px and wider, a multiple of 3 templates (no 2 by 2 for four, no centred lone card), tablet and phone unchanged. Marketing → Cards: new `aha-marketing-cards__grid--templates` modifier and "Templates grid, 3 by n" snippet; the 992 px balancing rules skip it. New failing eval page `fail-w10-templates-two-columns` and a test. Revert: remove the modifier, the snippet, the `:not(...--templates)` additions, the eval page and test and restore the W10 and W11 text. Environment: marketing-web (#321)
- Websites → Website composition: rule and criterion W1 now say the Logos strip (customer logos, Trusted by) is always the band directly below the hero, never later in the page; the Top of the page / body examples, the Logos section highlights, one new failing eval page `fail-w1-logos-mid-page` and a test follow, and the other eval pages that placed Logos mid-page now put it directly below the hero. Revert: restore the W1 text and the guideline lines, remove the eval page, the Logos highlight and the test; no class changed (#321)
- Websites → Website composition: rule and criterion W14 one type ramp per page. Each text role uses one DS type token across every Marketing section: section heading (h2) `--aha-size-h2` 40 px (32 at 991 px and below, 24 at 479 px and below) semibold, line-height heading; section lead and quote text the lead clamp 16 to 20 px regular; alternating row title `--aha-size-h4` 24 px semibold; every item or card title `--aha-size-xl` 20 px semibold; body `--aha-size-l` 16 px regular; meta `--aha-size-default` 14 px; stat number 40 to 48 px semibold; all Plus Jakarta Sans. New failing eval page `fail-w14-mixed-type-ramp` and ramp tests in `tests/website-composition.test.mjs`. Revert: remove W14, its eval page and tests, and revert the Marketing CSS bullet under Changed (#321)

### Changed
- Marketing → every section follows the W14 type ramp by default: no section sets `--aha-font-display` (Nunito, which the DS never loads) any more, so the Hero title, every section h2, the alternating row titles, Numbers and Statistic card values and the Pricing card amount inherit Plus Jakarta Sans; section h2s use line-height heading (1.3) and FAQ and Footer banner titles step 40/32/24 px like the rest (FAQ was 36/28); Testimonials quote text in every layout is the lead size, regular (the large 32 px and the 18 px semibold Quote cards styles are gone; `--large` and `--card` stay in the markup with no type of their own); image-led card titles and FAQ questions are 20 px at every width (were 24 px, and FAQ 18 to 24 px); alternating row titles are 24 px (were 32); the Pricing benefit list is 20 px title and 16 px text (was 16 and 14); Numbers and Footer banner leads use the lead size. Environment: marketing-web (#321)
- Websites → Website composition: rule and criterion W5 say the section directly after the Logos strip (the customer logos band) is always full white, never the pale pink accent or another tint.
- Websites → Website composition: rule and criterion W6 use the Vivid Pink frame for any portrait image (taller than wide), even alone or when every image is the same size, and when a section holds more than one image of differing size or ratio; a landscape or square image, alone or among others of the same size, fills its container with no frame. New Features layout "Alternating with portrait screenshots" and Cards snippet "Portrait pictures, framed". Never crop a screenshot and one ratio per section stay. The "Alternating with screenshots" layout and the image-led Cards grids now show fill; the pink-frame examples show mixed sizes. Revert: remove the `--fill` classes, the new layout and snippets and restore the previous W6 text; no existing class changed

## 0.321.0 — 2026-10-21
### Added
- Settings: new rule "Labels: say what the setting does" and judge criterion C20 "Labels are self-explanatory". A first-time reader of only the label can say what changes; no coined term or lone abstract noun ("Opening", "Mode"), the conventional term, the unit in the label, one term per concept, and a `label | "Changing this …" sentence | tooltip` table in the PR. A worked-examples table of 14 real e-learning labels (before, after, which rule). UXW-10 points every form label at it. Eight new C20 evals (#336).
- Agent plugin: a second skill, `ahaslides-design:settings-design`, the one mandatory runbook for any settings UI (settings panel, page, modal or drawer, a slide type's `settings.*` panel, preferences, an options dialog). It sequences the work and points at the DS sources: hub control table, label rule, the required `label | "Changing this …" sentence | tooltip` table, grouping, `screen-lint --surface=settings`, the settings judge. The settings lines in `aha-design` move into it and `aha-design` routes there (#336).
- Agent plugin enforcement, no exception: the prompt hook adds a "load settings-design first" line on any settings prompt; the write guard blocks a Write or Edit to settings UI (a slide type's `settings.*` file, or a file routed to the `settings` surface) until the session has loaded the skill (fail-open without a transcript; `AHA_DESIGN_SETTINGS_SKILL_DISABLE=1` turns off only this block); the end-of-turn judge asks for the label table when a settings file changed (#336).

### Changed
- Settings C1, the settings guide and the group rule: "short noun phrase" becomes "clear noun phrase", and a name or group header may be a short when/who/what clause ("When the module opens", "Who can open this course") when that is clearer. Group headers go from 1–3 words to 2–6, so the old rules no longer contradict the new label rule (#336).

## 0.319.0 — 2026-10-21
### Added
- Question list: a body slot `body-<id>` puts interactive light-DOM content (a SettingRow with a time input and stepper, say) inside the open body of question `<id>`, above the "Question" row. Children stay focusable; clicks, keys and edits in the slot never toggle the collapse; a closed question hides it; it follows its question by id across reorder, add and delete. Native `input` / `change` events from slotted children now reach the list's host (the list's own `change` still carries `detail.questions`). Revert: remove the `.body-slot` holder, its CSS and the `slotted('body-slot', …)` call in `lib/aha-question-list.js`, and restore the `stopPropagation` guard to unconditional. (#335)


## 0.315.0 — 2026-10-21
### Removed
- Marketing → Sections: the standalone `Hero` page is removed (`marketing/hero.json`, its nav entry and generated page). The hero layouts on the `Header` page are unchanged. The old `landing/` and `landing/hero` stubs now forward to the `Header` page. No tokens, colours or components change. Revert: restore `marketing/hero.json` and point the `''` and `hero` entries of `LANDING_REDIRECTS` in `generate.mjs` back at `marketing/hero/index.html`. (#298)

## 0.314.0 — 2026-10-21
### Removed
- Marketing Features: the Icon list with video, Icon list with wide photo and Alternating with photos layouts, with the classes only they used (`aha-features__band`, `__frame--video`, `__play`, `__checks`, `__check`, `__photo--16x9` and others); the page now lists nine layouts (#331).

## 0.312.0 — 2026-10-21
### Removed
- Marketing → FAQ: the Accent background and its White / Accent switch. The FAQ always sits on white; the `aha-faq--accent` class is gone, so remove it from any page that added it (#330).

## 0.310.1 — 2026-10-21
### Fixed
- Marketing Footer banner: on a phone (479px and below) the card's left and right padding is 32px, equal to top and bottom (was 64px); tablet unchanged (#329).

## 0.309.0 — 2026-10-21
### Added
- `aha-option-row`: the drag handle is now an opt-in keyboard-operable reorder grip. Set `reorderable` (alongside `orderable`, on a non-`disabled` row) to make the handle a tab stop that emits composed `reorder-move` (`detail.direction` "up"/"down") on ArrowUp/ArrowDown, `reorder-grab` (`detail.{pointerId,clientX,clientY}`) on pointerdown, and `reorder-activate` (no detail) on Enter/Space; the row never reorders itself — a host reorders its list and calls the new `focusHandle()` to restore focus after moving the row element. Without `reorderable` the handle is unchanged (decorative, no tab stop, no events). (#327)

## 0.308.0 — 2026-10-21
### Added
- Question list: header slots keyed by question id — `start-<id>`, `marker-<id>` (in place of the number), `before-<id>`, `after-<id>` and `end-<id>`, each taking any number of children — and a per-question `status: { message, tone }` supporting line (FieldError) under the header, with a warning or error border on the card (#325).
### Changed
- Question list: the header prompt wraps to at most two lines, and the delete is OptionRow's — secondary small icon Button on the card's top-right corner, revealed on hover or keyboard focus and a Tab stop with the DS focus ring (was an always-visible tertiary trash) (#325).
- Option row: the delete is now a Tab stop (after the field, skipped when disabled), revealed when the row or the delete has keyboard focus; hover look and Backspace-when-empty unchanged (#325).

## 0.307.0 — 2026-10-21
### Added
- `<aha-bottom-sheet>`: an audience sheet that slides up to show one option in full, picture on top and the whole text below. It scrolls when long and closes on the backdrop, the close button, Escape and a swipe down; focus is trapped inside and returned to the opener. The close button is the audience close button (tertiary-deck icon-only md), which needs #317 to draw as designed (#319)
- `<aha-answer-option expandable>`: a long-text variant. The label clamps to 4 lines with More (a Button link in the deck ink) inside the card, the picture stays on the left like a default row and shows a dark overlay with an expand arrow on hover, and a one-line option lines up with a default row. More and the picture emit `expand` (#319)

- `<aha-rank-list expandable>`: the same long-text treatment for ranking rows: clamped label, More, picture on the left with the expand overlay, and an `expand` event (`detail.id`, `detail.source`) to open `<aha-bottom-sheet>`. Docs show a long option with a picture (#319)

### Changed
- `<aha-bottom-sheet>`: the top corners use the 8px radius (`--aha-radius-default`), and a new `contained` attribute slides the sheet up inside the nearest positioned ancestor instead of the viewport (#319)
- `<aha-answer-list expandable>`: forwards `expandable` to every row and re-emits `expand` with `detail.id` and `detail.source`, so the list gets More and the picture tap like a single `<aha-answer-option>` (#319)
- Audience library: the AnswerOption, AnswerOption List, Bottom sheet and DraggableOptions demos show the long-text rows inside a 360 by 640 phone frame; More or the picture slides the sheet up from the bottom of that frame over a backdrop (#319)
- Audience library: Bottom sheet is an Audience library entry only (no standalone component page); AnswerOption and DraggableOptions show the long-text and picture case beside their demos, with More and the picture opening the sheet; the BottomSheet demo shows a picture on top (#319)

### Fixed
- `<aha-rank-list>`: the end padding of a row is halved to 8px, so the drag handle sits closer to the edge (#319)
- Audience library: the light and dark deck columns shrink with the card, so a phone-frame demo is no longer cut off on the dark side (#319)
- `<aha-answer-option>`: the revealed tick and cross, and the correct / incorrect ring, use `--aha-answer-correct` and `--aha-answer-wrong` instead of the ink, so they read in light and dark decks (#319)
- `<aha-answer-option>` and `<aha-rank-list>`: the picture always fills its slot (cover, no slot background) whatever its ratio; long rank rows get equal top and bottom padding; the rank order badge steps down from 28px to 24px (12px numeral) (#319)
- `<aha-answer-option>` and `<aha-rank-list>`: a long text option centres its control, picture and badge vertically in the card instead of pinning them to the top (#319)
- `<aha-chart>`: the hover panel that shows a full label is wider (up to 480px or 90% of the chart) and now stays inside the viewport or iframe on every side, flipping above or below the pointer and shifting sideways (#319)

## 0.306.0 — 2026-10-21
### Added
- Audience → Close: a ✕ for a modal, sheet or overlay on the audience phone, `<aha-button variant="tertiary-deck" size="md" icon-only aria-label="Close">` with the 16px `system-x`. Drawn 36 × 36 (the foundation md icon-only square) instead of the 48 × 48 touch icon-only, with an invisible 44 × 44 hit area so the touch floor still holds; no other button changes. New `sheet` attribute for a white modal or sheet: the glyph is muted grey (`--aha-icon-muted`, 3.45:1 on white) and text-default on hover and press, because the deck ink can be white. Actions (Skip, Back, Remove) stay size touch. (#317)
### Fixed
- Audience → SubmittedCard: the check pip no longer sits on a grey square (the 10% deck-ink wash behind the glyph is removed), and the check is 32px, the size of the WaitingForHost hourglass. (#317)

## 0.303.0 — 2026-10-21
### Added
- Marketing → Testimonials, Pricing, Numbers, Header, FAQ, Logos and Hero: every section now has the same White / Accent background switch as Features. Add the section's `--accent` class (for example `aha-testimonials--accent`, or the layout's own `--accent` class on a Header layout) to lay the pale pink bgAccent surface over white. The pale pink icon squares and picture card in Numbers and the progress track in Hero turn white on Accent so they stay visible; plan cards, tables and testimonial cards stay white. The Hero Pink, Hero Pale Pink and brand Header layouts, the Pricing plan card styles gallery and the Numbers brand band have no switch because they are already coloured surfaces. Footer, Footer banner, Cards and Navigation are not full-width sections on a white page, so they have none. (#322)

### Changed
- Marketing → Testimonials: the Quote cards layout is now white by default, with the pale pink band as its Accent state, like every other section.

## 0.300.1 — 2026-10-21
### Changed
- Marketing → Cards: in the Steps row the optional 3:2 image now sits below the text (number, title, sentence, then image) ([#324](https://github.com/AhaSlides-Product/ahaslides-design/pull/324)).

## 0.300.0 — 2026-10-21
### Added
- Marketing → Cards: a steps row. `aha-marketing-cards__grid--row` lays three Step cards in one horizontal row (three across, `--aha-space-24` gap, one column below 768px, no two-column step), with a three-card example (Build your slides, Share the code, See every answer) beside the Step card. Each card in the row takes an optional 3:2 image above the number (an `<img>` in the card media block, filling it); drop the block for a text-only row. The Step card and every other card are unchanged ([#323](https://github.com/AhaSlides-Product/ahaslides-design/pull/323)).

## 0.294.1 — 2026-10-21
### Fixed
- Collapse: content of an open panel can now overflow it, so a `?` help tooltip, a select dropdown or a popover inside an open `aha-collapse` (ghost or bordered) is no longer clipped. The body is still clipped while it animates open or closed, and reduced motion lifts the clip at once. (#320)

## 0.294.0 — 2026-10-21
### Added
- Marketing → Features and Cards: a Vivid Pink image frame for screenshots and assets whose ratio differs from their slot, or that are light enough to fade into a white card. Add `aha-features__photo--pink-frame` (4:3 rows) or `aha-marketing-card__media--pink-frame` (3:2 cards): the picture is contained, never cropped, with an even inset on `--aha-vivid-pink-100` and the centre Splash from the Background library behind it (its CSS recipe, unchanged). Photos that fill the slot keep `object-fit: cover`. The Features "Alternating with screenshots" layout now uses it, and Cards gets a framed Template card.
- Marketing → Cards: an image-led grid layout, `aha-marketing-cards__grid--image-led`, for sections where readers compare the pictures: two columns at most on desktop, so every image is at least half the content width; four items make a 2 by 2 grid; an odd count makes the first item a wide feature card (image two thirds, title beside it); one column below 768px (a viewport `@media`, not a container query). Text-led sections keep three or four columns.
- Websites → Website composition: rule W10 and criterion W10 ("In an image-led section, is every image at least half the content width and uncropped?"), and the never-crop-a-screenshot and one-frame-ratio-per-section rule with the Vivid Pink frame added to W6.

### Changed
- Marketing → Cards: `.aha-marketing-cards` is transparent in every section, not only `aha-features--accent`; inside a Features section `.aha-marketing-cards__grid` drops its 64px padding and 72rem cap.
- Websites → Website composition: rule W5 now names the pale pink band as the `aha-features--accent` class, never an inline `background: var(--aha-bg-accent)` style. Revert: remove the new classes, rule W10 and criterion W10; the previous Cards and Features CSS is restored by reverting this change. (#318)

## 0.293.0 — 2026-10-21
### Added
- Marketing → Sections → Testimonials: a "Quote cards" layout cloned from the "What our users say" section of the ahaslides.com slide-type pages. A centred heading and lead on the pale pink band (`--aha-bg-accent`), then three equal white cards with the quote at the top and the avatar, name and role pinned to the bottom, stacking to one column at 767px. Three customer avatars are added to `marketing/images/testimonials/` and listed in its manifest. (#316)

### Removed
- Marketing → Sections → Testimonials: the layouts Simple centred 01 to 03, Split image 01 to 03, Card, Card split image and Abstract image, with the CSS only they used (single, caption, logos row, split, panel, media, overlay, collage, dots) and the 19 images only they used. The page now keeps Simple left aligned, Case study cards and the new Quote cards. (#316)

## 0.292.0 — 2026-10-21
### Added
- Websites → Features: every layout has two backgrounds, White (the default, unchanged) and Accent. Add `aha-features--accent` to the section to lay the pale pink `--aha-bg-accent` over white; the icon squares and check marks turn white and keep their pink glyph; cards stay white with their pink icon tile. The docs page gets a White / Accent switch and a code tab for each, plus a "Choosing a background" note: never place an Accent section next to another coloured section. The switch is an opt-in `states` key in `marketing/<page>.json`, off for every other marketing page. (#309)
- Websites → Features: a new layout, Feature card row with 3 cards: a header above one horizontal row of the same DS Feature card as Icon cards, stacking to one column at 767 px. For a row of four, use Icon cards. It supports the White and Accent backgrounds. Revert: remove the `icon-cards-row-3` entry from `marketing/features.json`. (#309)

## 0.290.0 — 2026-10-21
### Added
- Marketing → Sections → Header: an optional G2 reviews row on the 17 layouts whose copy block holds the buttons (Hero Pink, Hero Pink Vertical, Hero Pale Pink, Hero Pale Pink Vertical, Hero Split Image 01, 03 and 05, Hero Screen Mockup 01 to 05, Hero iPhone Mockup 03, Hero Color Card 04, Hero Card Mockup 07 and 08, Hero Simple Text 01). It is five avatars (`aha-avatar-group`), five stars (`aha-rate`, filled to 4.8) and "4.8 Based on 1000 reviews", with a visually hidden label, readable on White, Pale Pink and Vivid Pink. It is off by default: the layout code leaves it out. Hero Split Form 01 (the button sits in the sign-up card) and the six page headers (no button in the copy block) do not get it. (#302)
- Marketing → Sections → Header: a "G2 reviews: Off / On" switch beside the width and surface switches on each layout that has the row. `generate.mjs` gains one generic step: any `marketing/*.json` may carry a block-level `reviews` template and a per-layout `reviews` key. The md and agent.json feeds describe the row and how to turn it on. Other marketing pages are byte-identical. (#302)

### Changed
- Header guidance "Above the fold": the badge slot no longer carries a G2 rating; it points to the G2 reviews row instead. (#302)

## 0.289.0 — 2026-10-21
### Changed
- Icon library: `system-reveal-pinwheel` and `system-reveal-vortex` are redrawn as Bloom wedge (Variant 2), picked from a proposal because the previous pair looked identical to each other at 16–24px and read denser than Bloom, Radar sweep and Crystallise in the same row. Pinwheel is a solid hub with four arrows pointing outward and a clockwise arc above; Vortex is an open 270° clockwise ring with three arrows pointing inward to a centre dot. Names, wrapper attributes and colour are unchanged. The redraw no longer reads as near-identical (about 31% overlap, under the 86% near-duplicate threshold), so `icon-duplicates.intentional.json`'s Pinwheel/Vortex exemption is removed — the pair stands on its own in the near-duplicate gate like every other icon. (#314)

## 0.286.0 — 2026-10-20
### Changed
- Report tables (a report image or a read-only report page) keep the white and light grey zebra rows but drop the horizontal row dividers; the zebra already separates the rows and the lines only added clutter. Updated colour rule 3.11 (changelog v18), the report-images guideline and guide, and the C11 criterion and its evals. Screens of the product app (table surface C4) keep their dividers and plain rows. Requested by Dave Bui. (#313)

## 0.284.0 — 2026-10-20
### Changed
- Bar chart: the value column is now as wide as the widest final value in the chart (measured on data change, resize and font load, never on the count-up text), right-aligned, so every track still ends at the same x and the widest value sits one 12 px gap from the bar end. It was a fixed 100 px column, which left a large gap before short values such as `0`. The unused `--aha-viz-value-width` token (`viz.valueWidth`) is removed; nothing else read it. The gap between bar items goes from 24 to 32 px (`--aha-viz-bar-gap`, `viz.barGap`) and the label-to-bar gap from 8 to 4 px (bar chart only), so each label reads as belonging to the bar below it, not the one above; an image thumbnail, sized as bar + label gap + one label line, shrinks by the same 4 px, and the chart contract now says so. Revert: restore the token and the fixed `min-width` on `.bar-line .value`, `viz.barGap` space-24 and the 8 px label gap. (#312)

## 0.283.0 — 2026-10-20
### Added
- Guideline `Website` (Patterns, environment `web`): how a whole website page is composed from the Marketing sections. Nine rules, each citing the section, token or colour rule it comes from: every band is a DS section (a missing one is a DSN ticket), the padding each section ships, never overridden (96/64 px, 48/24 at 767 px, 32/16 at 479 px for Features, Numbers, Pricing and Testimonials; Hero, Logos and FAQ keep their own), with nothing between sections, 1280 px content and 720 px / 44ch heading blocks, one H1 and one primary action per section with the hero's call to action repeated at the end, band backgrounds by colour rules 3.2 to 3.5, 3.8 and 3.10 (a pale band is a page-level `background: var(--aha-bg-accent)`), real images and registry icons, the Navigation header with `<aha-product-lockup>`, checks at 1440, 768 and 375 px, and gentle motion only. (#310)
- Anti-slop surface `website` (W1 to W9) with its eval set (2 good controls, 10 bad examples on page fixtures, one shared `sections.css` built from the Marketing section CSS and the shipped Navigation markup). The `web` route lists the guideline and judges every website page on `website`, `colour` and `background`; the `aha-design` skill picks `website` for any web page. Anti-slop targets may now name the Marketing library (`marketing`, published as `marketing.llms.txt`). (#310)
### Changed
- Colour rule 3.5 keeps the white first screen for the product app and now lets a web page built from full-width sections open with a Vivid Pink hero (the Hero Pink header layout, Darker Pink Splash hooks per rule 5.1). That hero is one of the two Vivid Pink sections of rule 3.4; the body then alternates white and pale pink (Vivid Pink at 5%) starting with white, so rule 3.3 holds. Website guideline rule W5, the `website` W5 criterion and the Header colour guidance say the same; the eval fixtures now open with the pink hero, and a new bad example (a Darker Pink hero) joins the touching-bands and grey-band ones. Revert: restore rule 3.5, W5 and the fixtures from git. (#310)

## 0.282.1 — 2026-10-20
### Changed
- Canvas judge C5 and C18, the Canvas guideline and the canvas guide no longer tell a builder to put a scrim, chip, caption bar or card behind text. C5 keeps its contrast axis everywhere, including text over a deck background image (WCAG AA against the real composited background); a low-contrast fix is a `textColour` or photo that clears the floor, not a backing layer. C18's ban on a slide-wide scrim is unchanged. Canvas evals 5 (contrast axis restored, neutral fix), 59, 1171, 1198 and the C18 good control re-worded to match (#311).

## 0.282.0 — 2026-10-20
### Added
- The browser files (`lib/`, plus the `fonts/` and `logo/` folders `lib/` loads) are also published to the AhaSlides CDN on every release: `https://assets-cdn-public.ahaslides.com/ahaslides-design/latest/lib/<file>` (5-minute cache, invalidated on each release) and `https://assets-cdn-public.ahaslides.com/ahaslides-design/<version>/lib/<file>` (immutable). The files are byte-identical to jsDelivr's, so a page can switch hosts by changing the base URL only. jsDelivr keeps working unchanged. New workflow `.github/workflows/publish-cdn.yml` (same bucket, CloudFront distribution and AWS secrets as aha-slide-plugin's standalone SDK); `workflow_dispatch` re-publishes. Revert: delete the workflow. (#297)

## 0.281.0 — 2026-10-19
### Added
- Info message under Input, Textarea and InputNumber: help text that is not an error (for example `3 of 10 rows`). Text only, 12/18 in `--aha-text-secondary`, in the error slot with the same 4px gap; the border is unchanged and the field is not `aria-invalid`. Input takes `info-message`; Textarea and InputNumber take a sibling `<aha-field-error tone="info" message="…">`. The consumer passes the string, the DS computes nothing, and an error message replaces it, never stacked (#299)
- `@ahaslides-product/design/input-number.css`: InputNumber now copies Number with unit on antd v6 and ant-design-vue v4. A tertiary ▲/▼ stepper (`system-caret-up/down`) appears on hover or focus, 6px after the digits; `addonAfter` is the muted inline unit (14/21, `--aha-text-placeholder`) 4px after the stepper, inside the field, and `addonBefore` is the same muted text leading (#299)
### Changed
- Field error docs page: demos and snippets for the `icon` variant (under DS inputs) and `tone="info"` (help text), each labelled by when to use it; the default variant is labelled as the hand-built form and respondent one. No change to `aha-field-error.js` (#299)
- Field error glyph is now `system-warning-circle` (was `system-x-circle`) on Input, Select, Counted input, Counted textarea, Textarea, InputNumber, Number with unit and the antd Form error text (#299)
- Error and warning are merged on Input, Textarea and InputNumber: `status="error"` is the one invalid state. `status="warning"` stays as a deprecated alias that renders and behaves as error on Input and Counted textarea (including `aria-invalid` and the error message); on the antd Textarea and InputNumber themes it already renders identically, as both colour tokens are `#1A1A1A` (#299)

## 0.278.1 — 2026-10-20
### Changed
- Colour rules 5.3 and 5.4 (centre and right splash) now state the size basis in the rule itself: the icon's own 802-unit frame (the full 802 by 788 canvas of `logo/thesplash.svg`, margins included) is 4.5 times the shorter side, and a copy cropped to the hooks must be sized by its width over 802, so a hooks-only bounding box (731.4 units, 91.2%) is 4.104 times the shorter side, never 4.5. Both rules had left this to a note on the meeting point, and one port applied 4.5 to a cropped file and came out 9% too big.
- Colour rules section 5 gains "Centre and right in CSS": one copy-paste container-query block (`splash.cssRecipe` in `brand/colour-rules.json`) for the full icon, 4.5 times `min(100cqw, 100cqh)`, meeting point 414 / 802 and 336 / 802 of the icon width from its left and top, 55% down, growing by the square root of the aspect past 16:9 or 9:16 inside `@supports` (older browsers keep the base size), with `--splash-across` set to `.5` (centre) or `.75` (right). Rendered at 16:9, 21:9, 9:16 and 32:9 it differs from `build-splash.mjs` in under 0.01% of pixels. The block is also in `colour-rules.md` and the `splash` object of `colour-rules.agent.json`. A `css-recipe` block type in `colour-rules.mjs` renders it, and a test keeps its figures tied to the generator's. (#306)
Revert: restore rules 5.3 and 5.4 from git and delete `splash.cssRecipe`, the `css-recipe` block and heading in section 5, the `css-recipe` branch and "Splash in CSS" markdown in `colour-rules.mjs`, the `pre` rule in the template and the new test.

## 0.278.0 — 2026-10-20
### Added
- `screen-lint` hard-fails two misuses of the answer colours (colour rules section 11): `answer-colour-text` (11.2) when an `--aha-answer-*` token is a text colour (`color`, `-webkit-text-fill-color`, `caret-color`, a JS style object key, or a Tailwind `text-[…]` / `caret-[…]` value), and `answer-colour-context` (11.1) when one is used where nothing in the rule's selector, the element's attributes or the style object's line names an answer, a correct or wrong mark or a result (`correct`, `wrong`, `incorrect`, `answer`, `result`, `tick`, `cross`, `reveal`, `verdict`, `score`). Rules 11.3 and 11.4 stay with the judge. Opt out per line with `ds-lint-allow: answer-colour (why)`. Revert: delete `lib/screen-lint-answer.js` and its three hook lines in `lib/screen-lint.js`. (#307)

## 0.277.0 — 2026-10-20
### Changed
- Marketing section `Footer banner` is now a Vivid Pink card on the centre Splash background (Darker Pink hooks) with a white heading, white optional paragraph and a white Get started free button with Vivid Pink text, replacing the pale pink Webflow `bg-pink.png` illustration (no image URL left). Button hover, press and focus states are the Hero Pink ones; the section around the card stays white. (#308)

## 0.274.1 — 2026-10-20
### Changed
- Icon library: `system-reveal-pinwheel` and `system-reveal-vortex` are now 1:1 copies of the Radar slide's gen3 reveal icons (slide-type-creator `revealIcons.ts`, last changed in a2a102309), generated by running gen3's own functions: six spokes with open chevron heads, a filled hub (Pinwheel) or centre dot (Vortex), and gen3's clockwise top arc with an open chevron head on its end tangent. The art keeps gen3's `-4 -4 128 128` viewBox and stroke 10, with the ink as the DS source colour so it renders in `currentColor`; `<aha-icon>` still draws the stroke at each size's paired width, which equals gen3's stroke exactly at 32px. Names are unchanged, so consumers only bump the pin. The near-duplicate icon gate gains `icon-duplicates.intentional.json`: a list of exact pairs kept on purpose, each with a required written reason, and the gen3 Pinwheel / Vortex pair is its only entry; every other near-duplicate still fails and the shrink-only baseline is unchanged. An entry whose pair is no longer near-identical fails like a stale baseline entry. Revert: restore the two SVG files from 0.272.2 and re-run `node build-icons.mjs`, then delete `icon-duplicates.intentional.json` and the `intentional` hook in `evaluateDuplicateGate`. (#304)

## 0.274.0 — 2026-10-20
### Changed
- Option row → keyboard: the hover-revealed delete button is no longer a tab stop, so Tab goes from one row's text field straight to the next row's field. Backspace in an empty field of a row that can be deleted (`candelete` not `false`) is the keyboard delete: it emits the same `delete` event and the field declares `aria-keyshortcuts="Backspace"`. The Delete tooltip now reads "Delete (Backspace when empty)". `delete` now carries `detail.source`: `"keyboard"` for Backspace, `"pointer"` for a click, so a host can move focus to the previous row's field after a keyboard delete. `<aha-option-row>` gains a public `focus(options)` method that focuses its own text field, and `<aha-question-list>` uses it to put focus in the previous option's field after a keyboard delete. Mouse behaviour, the event name and `candelete` are unchanged. (#305)

## 0.272.2 — 2026-10-19
### Changed
- Select → caret: the composite Select now shows the same `<aha-icon name="system-caret-down" size="16">` as Select field (passed as `suffixIcon`, #8A8A8A) and flips up while open. `select-theme` exports `selectCaretCss` for the colour and flip; with a custom `suffixIcon` antd no longer swaps in its magnifier while searching. All four Select code flavours and the preview use it. (#301)
- Select field → dropdown: option rows now match Select (40px, 9px 12px padding, 14/22), the popup sits 4px below the control, and the hover and keyboard-active row is #F7F7F7 (`--aha-bg-hover`) instead of the brand tint, which was also the only state it had; hover had no style before. Both popups now use radius 8: Select's was antd's derived 10, off the radius scale (`borderRadiusLG: 8` in `selectTheme`, which also keeps the large control at 8). The selected row now matches Select too: #E70E680D background (`--aha-bg-accent`) with a #E70E68 semibold label, and the check is gone. (#301)

## 0.272.1 — 2026-10-19
### Fixed
- `aha-setting-row`: the "?" help bubble opens below the trigger and fits inside the viewport (start- or end-aligned, wrapping when narrow), so it no longer clips inside a 320 to 383px settings iframe. Slides can drop the `placement="bottom-start"` patch. (#303)
- `aha-option-row`: the inner field's `input` listener ignores any event whose `detail.value` is not a string, so the `value` attribute can never become "undefined" and plain-DOM hosts need no MutationObserver workaround. (#303)

## 0.271.0 — 2026-10-19
### Added
- Logo library: each third-party brand logo fetched from theSVG now also ships in its original colours at `logo/original/<file>`, beside the one-colour file (`originalFile` in `logo/manifest.json`; PDF has no original source and has none). The Foundations → Logo library page shows both files on every brand tile and gives the hover and focus pattern as copy-paste HTML and CSS. `recolour-art.mjs` leaves `logo/original/` alone, and `standards.mjs` checks that every original sits beside its one-colour file and is declared. The Model Context Protocol original is its mark in black, as the source file is the white mark for dark backgrounds. (#262)
### Changed
- Colour rule 2.6, third-party logos: in every interface, the presenter app and website headers and menus alike, a brand logo is one colour at rest and shows its own colours on hover and keyboard focus (a short fade, none under reduced motion), with the tool's name always beside it. A page that lists other products (Marketplace, integrations directory) keeps logos in their own colours at rest as content, in the DS white tile with a grey border, 32px at most; a tool not available yet is greyscale with a Coming soon tag (`<aha-tag color="primary" bordered>`). Brand colour never spreads beyond the logo. Customer logo strips stay one colour. Judge criterion C7, rule 9.4, the colour eval set (case 7 reworded, cases 11 and 12 added), AGENTS.md, PRINCIPLES.md, the `aha-design` skill and `llms.txt` say the same. (#262)
- The design system covers every AhaSlides website: there is no separate marketing web surface. The `marketing-web` environment is renamed `web` ("Websites": landing, pricing, blog, careers and campaign pages) and now routes like `product`: owner the design system team (#design-system-agents), plugin `ahaslides-design:aha-design`, judge `anti-slop.md`, lint `screen-lint.mjs --surface=product`. Breaking for any item that declares `marketing-web`: declare `web` instead. Video and social / ads keep their own route. (#262)
- Agent plugin: the `aha-design` skill description, the prompt mandate hook and the plugin description now send landing, pricing, blog and careers pages to `aha-design`; only brand voice, email, video and social / ads creative go to aha-marketing-skills. (#262)
- Typography judge J7: the DS type scale governs every screen and website page; a landing-page hero takes a display role instead of being treated as a separate brand surface. The matching eval now expects J2 and J7 to fail and a display role as the fix. (#262)
- Docs site: the "Marketing" header tab is renamed "Websites", matching the `web` environment; docs search labels those pages Websites too. The `marketing/` folder, its page URLs and the `marketing.*` feed names are unchanged. (#262)
- The old `marketing-web` id is still accepted for one release as a deprecated alias of `web`: items that declare it validate and route as `web`, and `colour-rules.agent.json` `rulesByEnvironment['marketing-web']` mirrors `web`. It is not a sixth environment and is not listed in `llms.txt` Routes. (#262)

## 0.270.0 — 2026-10-19
### Added
- Marketing → Sections → Header: a "Choosing a header" block (one goal and one primary button, layout by page goal, copy, above the fold, colour rule 3.5, one h1, measuring) and a "Use for" line on each of the 24 layouts. `generate.mjs` gains one generic step: any `marketing/*.json` may carry a page-level `guidance` block (`title`, `intro`, `points`) and a `useFor` line per layout, rendered on its docs page and added to its `.md` and `.agent.json` feeds; sections without them are unchanged. Environment: marketing-web. Every Vivid Pink surface on the Header page now carries the DS Splash, drawn to the exact frame in CSS rather than from a cropped file: a splash layer (`position:absolute; inset:0; overflow:hidden; container-type:size`) behind the copy holds one `<img>` of the new single-colour icon `backgrounds/splash-icon-pink.svg` (the real Splash icon in Darker Pink, built by `build-splash.mjs`, with a white twin and an `icons` list in `backgrounds/manifest.json`). Container units size it as the generator does (4.5 times the shorter side, growing by the square root of the aspect past 16:9) and put the meeting point 50% across (centre) or 75% across (right) and 55% down; at 1440x640, 1280x520 and 375x720 the position matches `buildSplash` within 0.01px. Right where the copy is on the left (Hero Pink, Hero Pale Pink, Hero split image 01, 03 and 05, Hero split form 01, Hero screen mockup 02 and 04, Hero iPhone mockup 03, Hero color card 04, Hero card mockup 07, Header left tabs, Header left brand and Header left tabs brand), centre for the rest; white and Pale Pink states are unchanged and the inline hook SVG is gone from Hero Pink and Hero Pink Vertical. `generate.mjs` also maps `/backgrounds/` to the build site. Revert: delete `guidance` and the `useFor` lines from `marketing/header.json`, the `guidance`/`useFor` branches in `generate.mjs`, the splash layer markup and rules in each layout, and the two icon files, `buildSplashIcon`/`iconSet` and their manifest and test entries (restore the two inline hook SVGs from git). (#300)
- Marketing → Sections → Header: a White / Vivid Pink switch beside the width switch on each layout (Hero Pink and Hero Pale Pink families: Vivid Pink / Pale Pink), driven by a per-layout `states` list in `marketing/header.json`. `generate.mjs` renders the switch only for a layout with more than one state, so every other marketing page is unchanged.

### Changed
- Header → every layout, every state: no image has a white or framed border any more. The white 12px card behind the image on Hero Pink, Hero Pink Vertical, Hero Pale Pink and Hero Pale Pink Vertical is gone, as are the padded, bordered frames on Hero Screen Mockup 01 and 03; each image keeps its own `--aha-radius-xl` corners and sits straight on the section surface. The dead `__card` rules on the image-only layouts are deleted. The sign-up form card on Hero Split Form 01 is kept (it holds a form, not an image). Colour rule 4.7 now reads "The key visual image sits directly on the surface with no white card, border or frame around it." (#300)

### Fixed
- Header → Hero Split Form 01, Vivid Pink state: the buttons inside the white sign-up card took the on-pink styling (white on white). They now keep the standard primary and secondary styling.
- Header → Hero Card Mockup 08, Vivid Pink state: the checklist heading was dark on Vivid Pink; it now uses the surface's ink colour.

## 0.268.0 — 2026-10-19
### Added
- Icon library: five reveal-pattern glyphs, drawn in the DS for the Radar slide's settings panel, as four diagonal arrows with solid wedge heads on the 16px grid (straight vertices on the 0.5 grid): `system-reveal-bloom` (four arrows outward from a solid hub), `system-reveal-pinwheel` (an X of outward arrows with a hub under a clockwise arc arrow), `system-reveal-radar-sweep` (a hexagon with a sweeping hand and a filled sector), `system-reveal-vortex` (four inward wedges under a clockwise arc arrow) and `system-reveal-crystallise` (four arrows inward to the centre). Wedge heads are filled paths with the stroke on top, as in `system-info`; `currentColor`, three or more meaning words each. The registry now holds 310 names (305 glyph files plus 5 aliases). `aha-card-select` icon-only mode now shows each card's label as an `<aha-tooltip>` bubble (the shared tooltip look), on mouse hover and keyboard `:focus-visible` only, never on a tap or pointer focus. The native `title` is dropped in that layout so the browser draws no second tooltip; `aria-label` stays. The bubble opens above the card, flips below near the top of the viewport and aligns to the grid edge near a side. The labelled layout is unchanged. Revert: delete the five `icons/svg/system/system-reveal-*.svg` files and their `icons/meaning.json` lines, restore the 305 count, re-run `node build-icons.mjs`; for the tooltip, revert `lib/aha-card-select.js` and delete `tests/card-select-tooltip.*`. (#296)

## 0.265.0 — 2026-10-18
### Changed
- Marketing → Sections: the site navbar is now its own `Navigation` page (`marketing/navigation.json`, one layout, `Site navbar`); the `Header` page keeps the four Hero Pink banners, the fourteen heroes and the six page headers (twenty-four layouts) and its summary and highlights no longer mention the navbar. The navbar's HTML, CSS and `aha-header__*` classes are byte-identical, so pasted code keeps working. The old `marketing/header/` URL stays valid and now shows the heroes. No new tokens, colours or components. Environment: marketing-web. Revert: delete `marketing/navigation.json` and move its `Site navbar` layout back to the front of `marketing/header.json`. (#292)

## 0.264.0 — 2026-10-18
### Changed
- Marketing → Sections: the buttons in `Hero`, the four header heroes (`Hero Pink`, `Hero Pink Vertical`, `Hero Pale Pink`, `Hero Pale Pink Vertical`) and `Features` now copy the Button contract's xl size per state: 52px high (`height`, line-height 1, no wrap), radius `--aha-radius-lg` instead of the pill (the header heroes were radius 8), primary elevate shadow and press colours, a 2px `--aha-bg-base` gap plus a 4px `--aha-button-focus-ring` focus ring, secondary with the elevate-secondary shadow, an inset pale-pink fill on hover and press and the contract's border-hover and border-press colours, and no press lift (the `translateY(1px)` is gone). The transition is on background, border-colour, shadow and colour only, and off under reduced motion. The white button on the pink header heroes keeps its colours: only shape and states change, and its focus ring stays white on the pink surface. ([#291](https://github.com/AhaSlides-Product/ahaslides-design/pull/291))

## 0.262.0 — 2026-10-16
### Added
- Marketing section `Testimonials` (Marketing → Sections), in the layouts of the Untitled UI testimonial sections the marketing team picked (layout only; no Untitled UI photo or asset): Simple centred 01-03, Simple left aligned, Split image 01-03, Card, Card split image, Case study cards and Abstract image. Each layout has its own labelled preview and paste-and-run snippet. Every placeholder (customer photos, split photo, collage, case study covers) is an `<img>` on a real image file with alt text, and every avatar an `<aha-avatar>` on a photo, listed with source and licence in `marketing/images/testimonials/manifest.json`. Every value comes from the DS: `<aha-rate readonly size="sm">` for the rating, `<aha-avatar>` (40 and 64) for avatars, `<aha-button variant="secondary" icon-only>` for arrows, the Cards page Testimonial and Case study cards for the quote, person and card anatomy, the Features section for the frame, header block, split grid, photo ratios and breakpoint padding, the Logos section for the greyscale logo row, and `carouselTheme` for the dots. What the DS does not define yet is listed under Composed of as missing, each with a DSN ticket (DSN-956 to DSN-963) and its stand-in. Carousel layouts are a native scroll-snap track, no autoplay, and a track that scrolls with the arrow keys. Company logos are trimmed copies of the Logos section data (no baked-in whitespace) rendered at one fixed 32px height with width auto, object-fit contain and the left edge on the text column, so every logo shares one alignment and optical size. `generate.mjs` gains one optional step and one small change for marketing sections: the `layouts` step of the Features section (#286) gains `layoutKind` and `classes` so another section can reuse it, and an `imagePath` field resolves the `{{images}}` and `{{logos}}` tokens to the docs site and ships `marketing/images`; a marketing section with `composedOf` gets a Composed of table, and the preview frames also load `aha-avatar` and `aha-rate`; sections without them are unchanged. Revert: delete `marketing/testimonials.json`, `marketing/images/` and the `imagePath` branch in `generate.mjs`. (#290)

## 0.261.0 — 2026-10-18
### Added
- Marketing section `Numbers` (Marketing → Sections), logged from the Webflow Numbers sections: five layouts, each with its own labelled preview and paste-and-run snippet, in the layouts of the Untitled UI metrics sections the marketing team picked (layout only; no Untitled UI photo or asset). Simple with actions 01 (header and buttons across the top, four numbers in a row), Simple with actions 02 (header and buttons beside a two-by-two grid with an icon), Simple centred text (centred icon and header, three numbers split by dividers), Split image 02 (picture beside a two-by-two grid) and Split image 02 brand (the same on the brand band). Every value is a DS token or the value an existing DS component ships. A number is the Statistic card's (display font, `--aha-size-h2` to `--aha-size-h1`, semibold, primary colour, the card's title and text). The buttons are the Button contract's xl size, state for state (52 high, `--aha-radius-lg`, 16px semibold, the primary and secondary hover, press and focus-ring values, no lift). The icon is the Feature card's (48px, `--aha-radius-default`, 24px glyph). The brand band is the Hero banner's solid Vivid Pink with its white text. The picture is the DS image placeholder (4:3, as in the Hero banner) in a card: pale pink on white and white on Vivid Pink, per colour rule 4.7. Classes are `aha-numbers` plus one `aha-numbers--<layout>` modifier, each section is a container-query block (991, 767 and 479 px). `generate.mjs` reuses the marketing `layouts` branch (its `layoutsIntro` names the Untitled UI metrics family, each layout names its `class`), plus one small change: a layout snippet points the placeholder image at the build. Revert: delete `marketing/numbers.json`; the snippet change is inert for the other sections. (#289)

## 0.259.0 — 2026-10-18
### Changed
- Marketing → Sections → `Header` is now one section with twenty-five layouts, each with its own name, labelled preview and paste-and-run code (the Features pattern): `Site navbar` (the existing header, unchanged), the four Hero Pink banners (`Hero Pink`, `Hero Pink Vertical`, `Hero Pale Pink`, `Hero Pale Pink Vertical`), fourteen heroes (`Hero split image 01`, `03`, `05`, `Hero split form 01`, `Hero screen mockup 01` to `05`, `Hero iPhone mockup 03`, `Hero color card 04`, `Hero card mockup 07`, `08` and `Hero simple text 01`) and six page headers (`Header centered`, `Header left tabs`, `Header centered brand`, `Header left brand`, `Header left tabs brand`, `Header space between buttons brand`; "brand" is our Vivid Pink surface). The heroes and headers are rebuilt from layout only, in DS tokens and the DS button and input styles (no third-party code, text or assets). Every picture, screenshot and phone or card visual is a real `<img>` of the DS placeholder image (`marketing-assets/image-placeholder.svg`), cropped to its slot by CSS; nothing is drawn in HTML. Dropped because the DS has no equivalent: avatar stacks, star ratings, logo rows, the grid and dot backdrops, and the decorative arrows. Each layout's classes are scoped to it (`aha-header-section-<layout>`), so any of them can share a page. They replace the separate `Header section` nav group and its four Hero Pink pages; the optional `group` field on a marketing section (0.222.0) is removed, as nothing else used it. `generate.mjs` lets a `layouts` entry carry an optional `class` and no `reference`; Features renders byte-identically. No new tokens, colours or components. Revert: restore `marketing/header.json` and the four `marketing/hero-*pink*.json` files and the `group` branch of the Marketing nav in `generate.mjs` from before this change. (#287)

## 0.258.0 — 2026-10-18
### Added
- Marketing section `Pricing` (Marketing → Sections) and a new `Pricing card` type on the Marketing Cards page, in the layouts of the Untitled UI pricing sections the marketing team picked (layout only; no Untitled UI image or art). The Pricing card (plan name, optional Most popular DS Tag, price and period, billing line, feature list, buttons) is one Cards type on the Card anatomy with the marketing radius and `--aha-*` tokens, with style modifiers (featured in Vivid Pink, centred, wide, gray, tint, badge, dot, accent line, icon offset, banner, callout, plan icon, second button). The Pricing page adds ten section layouts around it: Simple cards (icon, callout, features, wide), Featured cards (icon, callout, offset icon, benefits) and Large table (plain, and with a highlighted plan and a team-size slider), plus a gallery of the twelve single-plan Untitled UI styles as options of the one card. Plan buttons are the DS Button, tags the DS Tag, the billing toggle the DS Segmented control (DS Switch for the Abstract angles style) with a DS Tag for "Save 33%", Yearly selected first and only where the Untitled UI original has a toggle; comparison tables are semantic `table`s with DS Table values, a help DS Tooltip on each row, check and minus icons with hidden text, and one block per plan on phones, as in Untitled UI. Untitled UI dark surfaces are Vivid Pink surfaces (logged in `docs/landing-webflow-scan.md`). `generate.mjs` gains one optional step for marketing sections: `includeCards` prepends the named Cards snippets' CSS to the section; sections without it are unchanged, and the frame preview imports the Segmented, Tag, Switch and Tooltip components. Revert: delete `marketing/pricing.json`, the `pricing` snippet in `marketing/cards.json` and the `includeCards` step in `generate.mjs`. (#288)
### Changed
- `aha-switch` and `aha-segmented` forward a host `aria-label` to their inner `role="switch"` and `role="tablist"`, so a billing switch or toggle has an accessible name. No change when the attribute is absent. (#288)

## 0.255.0 — 2026-10-18
### Fixed
- `aha-scale-slider`: the thumb's hover ring only shows under `(hover: hover) and (pointer: fine)`, so a tap-then-stick hover on a touch screen no longer paints a ring clipped flat at the min/max ends; the keyboard focus indicator is unaffected. The live readout no longer repeats an end label that is just the value's own text (`5` instead of `5: 5`); a label that differs from the value still shows (`5: Always`). (#294)

## 0.244.0 — 2026-10-15
### Added
- Marketing > Components > Cards is now one block per card type: the card name, a live preview of that card at its real grid-column size (one cell of the 3 / 2 / 1 column grid, the other cells empty) with its own breakpoint switcher (Wide, Desktop, Tablet, Phone), then its Show code toggle (the card inside its grid wrapper). Each switcher resizes only its own preview. The page-top whole-grid preview and the "The whole grid" code section are gone; the Load the tokens once footer stays. (#272)

## 0.237.0 — 2026-10-16
### Added
- Usability review (Nielsen Norman Group's 10 heuristics) on top of the anti-slop judge: new `usability` surface (U1 to U10) in `anti-slop/criteria.json`, a "Usability review" section in the `aha-design` skill (tier 1 from the diff on every UI change, tier 2 from a rendered screenshot only for a new or reshaped screen, dialog, form or flow), and the Stop hook adds the surface to every judged UI change. `AHA_DESIGN_USABILITY_DISABLE=1` switches only this review off. (#293)

## 0.223.0 — 2026-10-16
### Added
- Marketing section `Features` (Marketing → Sections), logged from the Webflow Features sections: eleven layouts, each with its own labelled preview and paste-and-run snippet, in the layouts of the Untitled UI features sections the marketing team picked (layout only; no Untitled UI photo, device image or asset). Alternating with screenshots (Alternating layout 02), Alternating with photos (04), Icon grid (Simple icons 03), Icon list with photo (Icons and image 02), Icon list with video (03, poster and play button, no autoplay), Icon list with wide photo (04), Icon cards (Icon cards 01), Icon cards with side header (02), Icons around a phone screenshot (Icons and mockup 04), Icons around a results screenshot (05) and Tabs with screenshots (Tabs mockup 07, working WAI-ARIA tabs with arrow keys, Home and End, mapping onto the Webflow Tabs element). Every picture is a neutral image slot (4:3, 16:9 or portrait 3:4, the Cards and Hero banner ratios) to swap for a real image; nothing is recreated in HTML. Values follow what the DS already ships: the eyebrow, title, lead and buttons are the Hero section's, the icon square and Learn more link are the Feature card's, section padding and width are the Footer banner's and Cards', the framed overlap is the Hero banner's, and the tab rail follows the DS Tabs left rail. The two icon-card layouts reuse the DS Feature card from the Cards page unchanged and only add the grid. Classes are `aha-features` plus one `aha-features--<layout>` modifier, and each section is a container-query block stepping down at 991, 767 and 479 px. `generate.mjs` gains one optional step for marketing sections: a `layouts` list renders a preview and code panel per layout; sections without it are unchanged. Revert: delete `marketing/features.json` and the `layouts` branches in `generate.mjs`. (#286)

## 0.222.0 — 2026-10-16
### Changed
- Marketing → Sections: the four heroes are now four separate sections, each with its own name, nav entry, preview and code panel: `Hero Pink`, `Hero Pink Vertical`, `Hero Pale Pink` and `Hero Pale Pink Vertical` (replacing the single `Hero banner` page), listed together under a new left-nav group `Header section` (an optional `group` field on a marketing section; sections without it stay where they were). Markup, styles and tokens are identical to 0.221.0; the old `Hero` section is unchanged. The `variants` option added to `generate.mjs` in 0.221.0 is removed (nothing else used it). The image slot in each hero is a real `<img>` (with alt text) pointing at a new DS placeholder image, `marketing-assets/image-placeholder.svg` (served at `/marketing-assets/image-placeholder.svg`, published in the package), not a div. `generate.mjs` copies the folder to the site and points a section's placeholder URL at the build being previewed. Revert: restore `marketing/hero-banner.json` and the `variants` branches in `generate.mjs`, delete the four new JSON files and `marketing-assets/`. (#285)

## 0.221.1 — 2026-10-16
### Fixed
- **`<aha-chart>` column values moved inside a bar now read at 4.5:1 and stay within the bar.** The ink is whichever of the chart ink and solid white has the higher contrast ratio on the bar fill (`readableInkOn` assumed pure black, which left `#1A1A1A` at 3.86:1 on Vivid Pink); Vivid Pink always takes solid white (colour rule 6.4). A label is only placed inside when its text and padding fit the bar width, otherwise it sits just beyond the reference line. New "Signed decimals on the line" case on the chart page and tests at 358 px with two-digit and signed decimal values. (#284)

## 0.221.0 — 2026-10-16
### Added
- Marketing section `Hero banner` (Marketing → Sections), logged from the Webflow components Hero Pink and Hero Pink Vertical (Top sections): a Vivid Pink section with Darker Pink Splash hooks, white headline and body, a white Get started button and a white image card, with the image beside the copy or under centred copy (`--vertical`). Each layout also has a pale pink version (`--pale`: Vivid Pink at 5% surface, black text, the DS primary button, hooks in Vivid Pink at 5%), so one block gives four combinations. The existing `Hero` section is unchanged. Rule 3.5 (the first screen is white) clashes with a coloured hero; the clash is logged in `docs/landing-webflow-scan.md` and the colour rules are not edited. `generate.mjs` gains one optional step for marketing sections: a `variants` list shows every variant in the preview and adds a code panel for each; sections without it are unchanged. Revert: delete `marketing/hero-banner.json` and the `variants` branches in `generate.mjs`. (#280)

## 0.220.3 — 2026-10-16
### Fixed
- **`<aha-stat-tile>` shows whole numbers in its change.** A percentage-point change was one decimal ("0.3 pts"); it now rounds to whole points ("3 pts", singular "1 pt", "<1 pt" for a non-zero change under one point, arrow direction kept), and a relative change under 1% reads "<1%" instead of a decimal, as the Report images guideline (C8) requires. An unchanged value still reads "No change", never "0" or "-0". A new "Whole percentage points" demo on the stat tile page and `tests/stat-tile-whole-points.test.mjs` cover it. (#283)

## 0.220.2 — 2026-10-16
### Fixed
- **`<aha-chart>` column values no longer sit on the reference line.** When a value label's box would cross an OKR target or Average line, the label moves inside the top of its bar in whichever ink reads on that fill (or just beyond the line when the bar is too short), so the number stays readable. Negative columns mirror this; the line type is untouched. A new "Value on the line" case on the chart page and a `tests/column-reference-labels.test.mjs` contract check that no value label box intersects the line or its label. (#282)

## 0.220.1 — 2026-10-16
### Fixed
- **`screen-lint` and the judge no longer flag the Skeleton loading shimmer as a gradient fill.** A `linear-gradient` whose stops are only the neutral skeleton greys (`--aha-bg-hover`, `--aha-bg-container-secondary`, `--aha-split`, or their `#F7F7F7` / `#F1F1F1` values), in a rule that sets an `animation` swept by a `background-position` keyframe, is the DS Skeleton's sanctioned loading animation, so `lib/aha-card.js` and `lib/aha-statistic.js` pass unchanged and consumers vendoring them can drop their `ds-lint-allow` lines. Any static grey gradient, and any gradient with a coloured stop, still fails. No component's look changes; rule 3.10, the Background guideline and the judge criterion state the exception (#281)

## 0.220.0 — 2026-10-16
### Changed
- **Colour rules v15: rule 3.11 covers reports, not only images**, asked for by Dave Bui. A read-only report page that a report routine publishes (a dashboard opened from a link, never operated) looks the same as the static image of the same report: Vivid Pink at 5% number plates (`<aha-stat-tile look="accent">`, as many as the report needs) and table rows that alternate white and light grey `#F7F7F7` (`--aha-bg-container-secondary`, the light grey rule 3.6 allows for table surfaces). Report zebra rows were Vivid Pink at 5% in 0.215.0 and are light grey now: too much pale pink, Dave said. The `report-image` environment keeps its name and is now labelled "Reports: static images and read-only report pages"; the Report images guideline becomes "Report images and pages" (same URL), and the judge passes a report page with accent tiles and light grey zebra rows on the `background`, `table` and `report-images` surfaces and fails pale pink table rows (6 new eval cases). Screens of the product app, its Report screens included, are unchanged (rules 3.2 and 3.7) (#279)
### Fixed
- **`<aha-chart type="column">` labels no longer collapse to "1…" on a phone.** On a signed column chart (negative values or a reference line), labels that do not fit their columns on two lines stay on one line and show every Nth label, counted back from the latest, which is always labelled; a value label never overlaps a neighbouring bar or label (it steps down to 14px, then 12px, then only the clear values show, counted back from the latest), which also removes the square notch a neighbour's label cut into a bar; and dense charts keep the 8px phone gap, so 12 columns stay columns at 390px. Wide charts are unchanged (#279)
- **`screen-lint` no longer flags a one-colour gradient as `gradient-fill`.** A gradient whose stops are all the same colour (the `linear-gradient(tint, tint), white` idiom that lays a translucent tint flat over white) is a flat fill, so `lib/aha-chart.js` passes unchanged and consumers can drop their `ds-lint-allow` line; any gradient that changes colour still fails (#279)

## 0.216.0 — 2026-10-16
### Added
- **Counted Textarea variant (React antd v6 and Vue ant-design-vue v4).** The character count now sits inside the field, bottom-right, and shows the characters left (193 for 7 of 200) only while the field is focused, like `<aha-counted-textarea>`; the field reserves a 22px bottom gutter so revealing it never shifts text, resize is off and the count stops at 0. Opt in with `className="aha-textarea-counted"`, `showCount={{ formatter: textareaRemainingCount }}` and `import '@ahaslides-product/design/textarea-counted.css'`; the plain Textarea is unchanged. New exports `textareaRemainingCount`, `textareaCountedClassName` and `textarea-counted.css`. (#278)

## 0.215.1 — 2026-10-16
### Fixed
- **`<aha-stat-tile>` keeps a very long value inside the card.** The value now shrinks (32px down to 12px) to fit the tile's inner width, so a figure such as 1,234,567,890 or $1,234,567.89 no longer spills past the card edge in a 160px or 240px tile, and it never breaks mid-number; short values keep 32px wherever they fit. (#277)

## 0.215.0 — 2026-10-16
### Added
- **`<aha-chart type="line">`** for 1 to 4 series over time, in the chart colour order: end-value labels that never overlap (pushed apart, with a short leader in the series colour), one marker shape per series at labelled ticks and the last point, `null` breaking the line, x labels thinned back from the latest period, and an optional right axis (`axis: 'right'`) whose legend names each series' axis, with the end labels outside its ticks. Live data morphs the existing lines to the new values, and the axis picks the division count that wastes the least span (a top value of 50 reads 0 to 50). Options `height`, `endLabels`, `format` (number, compact, percent), `rightFormat`, `zero` (DSN-943) (#276)
- **Column charts take negative values and a reference line.** A negative value draws below a zero baseline in `--aha-border-strong`, same colour as a positive one, with direction shown by position and corner shape; `options.reference: { value, label }` adds a dashed `--aha-text-secondary` line with its label at the right end, or in a key above the plot when the label would take more than 30% of the width. Once a column chart has gone signed it stays signed, so live data crossing zero animates in place; on a narrow chart the column labels end in an ellipsis (DSN-944) (#276)
- **Report images guideline** (`guidelines/report-images.json`) and its judge surface `report-images` (13 criteria, 15 eval cases): size and density, type, series order and the top 3 plus Other rule, end labels, twin-axis legends, gaps, notes on real zero runs, tick density and K, M and whole-percent formats, sentence-case titles with no em or en dashes, missing-glyph fallback, zebra rows on static tables only (white and Vivid Pink at 5%, a 2px Vivid Pink header rule) and the number plate look (DSN-945) (#276)
- **`<aha-stat-tile>`**, a KPI tile: a large semibold value, the change against `previous` as an absolute number and a percent (percentage points for a percent value), and a comparison caption; a rise is black with an up arrow, a fall white on a black pill with a down arrow. Flat white card with a Vivid Pink top bar, or `look="accent"` (Vivid Pink at 5%) for a static report image or the one highlighted panel; 1 to 6 per row with `<aha-grid min="160px">`, wrapping as the row narrows (DSN-946) (#276)
- **Colour rules v14: a `report-image` environment and rule 3.11**, asked for by Dave Bui. In a static report image, table rows alternate white and Vivid Pink at 5% and a number plate sits on Vivid Pink at 5% with black text and a Vivid Pink top bar; rules 3.2 and 3.7 do not apply there (#276)
- **Static status glyphs** for images, email and exports: `lib/static-icons/<ink>/<size>/<name>.svg` (ink or white; 12, 16, 24, 32), ten registry glyphs under their registry names with the colour baked in and the `<aha-icon>` stroke width, generated by `build-static-icons.mjs` and checked by a test; also exported as `@ahaslides-product/design/static-icons/*` (DSN-947) (#276)

## 0.213.2 — 2026-10-15
### Changed
- Marketing section previews sit in a fixed-height container (640px, or 70% of the screen height when that is smaller): a tall section scrolls inside it and a short one is centred, so switching width or opening a menu no longer moves the rest of the page. (#275)

## 0.213.1 — 2026-10-15
### Changed
- Marketing pages: each Paste-and-run HTML, Load the tokens once and card-type block shows its one-line description and Show code on the same row; the button drops below the text on narrow screens. (#274)

## 0.213.0 — 2026-10-15
### Added
- Marketing section `Logos` (Patterns → Marketing sections, Webflow CMS collection list `div-block-250`), matched to the live ahaslides.com survey creator page at 1440px, 991px, 767px and 390px: a row of greyscale customer logos that slides left over 20s, linear and repeating, like the Webflow Infinite logo interaction, and stops under reduced motion. The loop shifts by one set plus the gap, so it restarts with no 40px jump (the live strip jumps), and the logos load eagerly so none is blank when it slides in. Below 768px the set grows to its content, so the logos no longer overlap the second copy (they do on live). The logos are not typed into the markup: the section renders them from `marketing/data/logos-cms.json`, the published CMS list with its source URL and fetch date. `generate.mjs` gains one optional step for marketing sections: a `dataFile` plus an `itemHtml` template expand `{{items}}` in the section HTML; sections without them are unchanged. (#267)
### Changed
- Logos strip: the logos are about 25% larger than live at every width (80px to 100px wide at most, 110px to 138px at 1920px, 40px to 50px tall at 991px and below, 60px to 75px tall at 479px and below); the loop shift is unchanged. Growth to align the live site. (#267)

## 0.211.1 — 2026-10-15
### Changed
- The Marketing sidebar lists Components above Sections, and the Marketing tab opens on the first component. (#273)

## 0.211.0 — 2026-10-15
### Changed
- Settings fields fill a stacked row: `<aha-setting-row layout="stack">` and the settings list's stacked item make every DS field in the control slot (input, counted input and textarea, number with unit, select) full width, also when the field sits inside a wrapper with helper text. Inline rows are unchanged (fields keep their 240px width). The fields read a new inherited `--aha-field-width` (fallback 240px). (#271)
- Settings fields have one size, the 40px default: no small and no large. `<aha-number-with-unit>` (settings only) drops its `size` attribute: `size="large"` now renders the 40px default. `<aha-input>`, `<aha-counted-input>`, `<aha-counted-textarea>` and `<aha-select>` keep `small` and `large`/`lg` for the audience field and other surfaces, but the Input, Counted input and Select field pages no longer show a small or large example (their size playground control is gone) and say a settings panel uses the default only. The AntD Select page is unchanged. (#271)
### Added
- `screen-lint --surface=settings` hard-fails `size="small"`/`"sm"`/`"large"`/`"lg"` on a settings field (rule `field-size`, markup, factory, schema and `setAttribute` forms) and `maxlength` on `<aha-input>` (rule `input-maxlength`; use `<aha-counted-input>`, counter inside the field on focus). The plugin blocks both at write time in a slide type's `settings.*`. (#271)
- Settings rule `field-size-and-width` and judge criterion C19: default size only, full width when stacked, counter inside the field shown on focus; the skill notes that an AntD or slide-type-creator `size="large"` field maps to the DS default, as does a `size="small"` one. (#271)
### Fixed
- The settings guideline described the CountedInput counter as a sibling beside the field; it is an overlay inside the field. `<aha-select>` (select field) now declares its environment. (#271)

## 0.209.0 — 2026-10-15
### Changed
- Right splash (Brand colour rules 5.4, 5.7 and the layouts table): the icon is now 4.5 times the shorter side and grows in frames wider or taller than 16:9 like the centre splash (1.41 times at 32:9, 1.15 times at 21:9). The meeting point moves to 75% across and 55% down. New `wideFrameAspectThreshold` and `wideFrameFollow` fields on `splash.layouts.right`. The six right files in the Background library are rebuilt. Rule 5.7 no longer says the right splash matches the PDF. Centre and minimal are unchanged. (#270)

## 0.206.0 — 2026-10-15
### Fixed
- Marketing section pages: an opened Show code block is capped at 70% of the screen height again and scrolls inside, as the code blocks did before 0.200.2. (#266)

## 0.204.0 — 2026-10-15
### Added
- Marketing → Components → Cards: eight meaning cards for the marketing sites (Testimonial card, Case study card, Template card, Feature card, Step card, Statistic card, Article card, Integration card), built on the Card anatomy with the marketing radius. Framework-free HTML and CSS bound to `--aha-*` tokens under the `aha-marketing-card` class with one `aha-marketing-card--<type>` modifier per card, one paste-and-run snippet per type plus the 3, 2 and 1 column grid (breaks at 991, 767 and 479px). Linked cards use one stretched link and lift on hover; Testimonial, Statistic and Step cards stay static. Images are neutral placeholders.
### Changed
- The Marketing sidebar is split into Sections (Header, Hero, FAQ, Footer banner, Footer) and Components. Section pages are unchanged. (#269)

## 0.203.1 — 2026-10-15
### Fixed
- Minimal splash: the longer side counts as at most twice the shorter side, so in very wide or tall frames (a 6:1 web hero) the hooks keep their 2:1 size and stay in their corners instead of crossing the middle. Frames between 1:2 and 2:1 and all ready-made backgrounds are unchanged. (#263)

## 0.203.0 — 2026-10-15
### Changed
- Centre splash (Brand colour rules 5.3, 5.7 and the layouts table): in frames wider or taller than 16:9 the icon grows by the square root of how far the frame goes past 16:9, so a 32:9 frame gets 1.41 times the size and a 21:9 frame 1.15 times, and the top-right hook no longer dominates. The meeting point now sits 50% across and 55% down in every centre frame. New `wideFrameAspectThreshold` and `wideFrameFollow` fields on `splash.layouts.centre`. The six centre files in the Background library are rebuilt. Right and minimal are unchanged. (#265)

## 0.202.0 — 2026-10-15
### Added
- `screen-lint.mjs --surface=settings` for a slide type's settings panel. On top of the product checks it hard-fails a raw `<button>`, `<input>`, `<select>`, `<textarea>` or `role="switch"` (`raw-control`) and any `<aha-*>` tag that `lib/settings.js` does not register (`unregistered-element`). The allowed tags are generated from the settings entry into `lib/settings-elements.js`, so the list cannot drift. A control the DS does not ship keeps its tag with `ds-lint-allow: raw-control (why)`. The settings anti-slop judge gains C18, "Settings controls come from lib/settings.js". The canvas, audience and product surfaces are unchanged. (#268)

## 0.200.2 — 2026-10-15
### Changed
- Marketing section pages (Marketing → every section) are shorter. The intro is one line, the first highlight. Paste-and-run HTML and Load the tokens once sit behind the docs' Show code toggle, and the remaining highlights move to a Details list at the end of the page. The paste-and-run code and the feeds are unchanged. (#264)

## 0.200.0 — 2026-10-15
### Added
- Marketing section `FAQ` (Patterns → Marketing sections, Webflow component FAQ, built on Relume `uui-faq01`), matched to the live ahaslides.com AI presentation maker page at 1440px, 768px and 375px: a centred heading over four question rows. Each row is a real button with `aria-expanded` and `aria-controls`, so Tab, Enter and Space work and the DS focus outline shows; the answer opens over 0.3s ease-out (`--aha-motion-slow`, `--aha-ease-out`) and the plus turns into a minus. All rows start closed and any number can be open at once. The motion stops under reduced motion. Side padding steps to 64px at 991px and 32px at 479px, the heading and question type step down at 991px and 767px, and every value is an `--aha-*` token. Where the DS still differs from Webflow is listed in `docs/landing-webflow-scan.md`. (#256)

## 0.198.2 — 2026-10-15
### Changed
- Canvas Library: the Chart and Components pages show the same single CDN tag, `lib/canvas.js`, which registers `<aha-chart>` and the canvas controls. `lib/aha-chart.js` still works on its own. (#261)

## 0.198.1 — 2026-10-15
### Fixed
- Marketing tab: the sidebar group heading reads "Sections" instead of repeating the tab name "Marketing". (#260)

## 0.198.0 — 2026-10-15
### Changed
- Marketing sections move out of the Patterns sidebar into their own header tab, "Marketing", placed right after Patterns. The tab has its own sidebar and breadcrumb and opens on the first section. Docs search labels them Marketing. Page URLs (`marketing/<slug>/`) and the marketing feeds are unchanged. (#259)

## 0.197.2 — 2026-10-15
### Fixed
- Button docs page: the playground controls drove the small Primary button in the Tones row, so choosing Danger turned it white and looked like a broken Primary. They now drive their own Live example button at the top of the examples, and the Tones row stays fixed. Choosing Danger, Positive or Primary alt shows a note, read from the contract, that each looks like Secondary or Primary on purpose (status carries no hue). No component change. (#253)

## 0.197.1 — 2026-10-15
### Fixed
- Marketing sections preview: with the Header's mobile drawer open at Phone 375, the preview frame no longer grows a step taller on every click or hover. Viewport-height elements such as the drawer are left out of the height measure, while their contents still count. (#258)

## 0.197.0 — 2026-10-15
### Added
- Image Dropzone draws its `hint` as a second line under the label (text-secondary, since the lab's #8A8A8A is 3.22:1 on the grey fill), as the settings lab shows "PNG, JPG, GIF, WebP"; the label itself is now text-default (#249).
- Image Action Button `variant="tertiary"`: no border or fill until hover, then the tertiary Button hover (Vivid Pink 5% fill, text-link-hover glyph). Option Row uses it for its per-option image (#249).
- Alert `icon`: a named DS icon in place of the type's status glyph (#249).
### Changed
- Secondary Button (and Danger, which renders as secondary) hover and active: the pale pink fill is now an inset tint over the button's own opaque fill (white), not a see-through fill, so the button no longer shows a non-white surface through it (an Option Row's hover delete over the row). The same fix is applied to Pagination's page and nav buttons, which use the same hover token. Components that alias or override the secondary tokens (Paywall plans button, Audience Image Upload buttons) keep their transparent rest fill and look unchanged (#249).
- Option Row focus on a correct row is a single 2px answer-correct border (was a 1px border plus a 1px outline); the padding drops by 1px on focus so the row does not move (#249).
- Numbered Item title is regular weight (400), was semibold (#249).
- Question List question header takes the settings lab's look through the Collapse's `head` part: 14/22 regular on `--aha-gray-15`, 52px high, a hairline under it when open. Scoped to Question List; Collapse is unchanged (#249).
- Setting Group: a group whose direct children are Option Rows sits them 8px apart (`--aha-space-8`), as the settings lab's answer list does, instead of the 24px between settings (#249).
- Alert dismiss runs once: a second click while it fades out is ignored, and the fallback timer is cleared once the fade ends (#249).
- Counted Input and Counted Textarea counters show the characters left (36 for 24 of 60) at every size, as the settings lab does, instead of used/max (#249).
- Number With Unit draws its error message with the shared `<aha-field-error icon>` (12px system-x-circle + the message), the same as Input and Counted Textarea, and links it through aria-describedby. The colour is unchanged (#249).
- Mode Field is composed from DS components instead of its own buttons: its mode control is the Radio-Button-Group (`<aha-radio variant="button">` in a role=radiogroup, regular 14/21, padding 0 16, hover = brand label with the border unchanged, arrow keys from the radio), as on the Radio page. The `seg-btn` part now names each `aha-radio` (#249).
- Add Item Button is the DS secondary Button (`<aha-button variant="secondary" size="md" block>`): solid 1px #E3E3E3 border, white fill, #1A1A1A 14/600 label, 36 high (was a 40px dashed row), with the Button's own hover, focus and disabled states (#249).
- Option Row: every part (drag handle, toggle, text, image) is centred on the row's vertical middle, in a 44px row; the correct toggle has a 1px outline at rest (was 2px); the hover delete is the secondary small icon Button (28px, radius 4) with a "Delete" tooltip, centred on the top-right corner, as the settings lab draws it (#249).
- Question List is laid out as the settings lab's: a Setting Row head with the "N questions" count, a bordered Collapse per question ("N. prompt" header, trash on its trailing edge), a "Question" field and "Options" rows inside, and full-width secondary "Add option" and "Add question" buttons. New `label`, `help` and `allowimage` attributes, and `open` per question in the model (#249).
- Card Select hover and selected follow the checkable Tag at size large: hover moves only the border to Vivid Pink, selected is the Vivid Pink 5% fill (bg-accent) with a Vivid Pink border and a text-link-hover label (#DB005B; text-link #E70E68 is 4.16:1 on that fill) (#249).
- Setting Group: groups sit 24px apart (was 32) and the header sits 8px above its rows (was 12), on the space tokens, as the settings lab does. The danger zone stays 48px (#249).
- state-check allows the correct-answer green and its 5% and 30% tints (colour rule 11), so an answer row may carry them (#249).
- Option Row correct state uses the answer colours of colour rule 11: an answer-correct edge over the answer-correct-tint-5 fill and the toggle filled answer-correct. Focused, a correct row keeps its 1px edge and adds a 1px answer-correct outline 2px outside it (3:1 or more on the page) (#249).
- Info Box is now a thin wrapper over Alert: its variants map to the Alert types, so it takes the Alert look (grey surface, no border, grey status glyph) and roles. Its API (`variant`, `icon`, `dismissible`, `dismiss`) is unchanged (#249).
- Image Dropzone hover softens only the dashed edge to Vivid Pink 30% (vivid-pink-30); the fill and text stay (#249).
### Removed
- Mode Field `variant="segmented"` (breaking): the mode control is always the Radio-Button-Group; a leftover `variant` attribute is ignored. No consumer repo used it (searched every repo in the fleet cache, including the four DS consumers) (#249).
- Numbered Item `variant="plain"` (breaking): the item is always the grey card; a leftover `variant` attribute is ignored. No consumer repo used it (searched every repo in the fleet cache, including the four DS consumers) (#249).
### Fixed
- Option Row no longer turns its text into "undefined" on the first keystroke: it read the textarea's native `input` event as well as the field's own, and the native one has no value. It now emits one `input` per keystroke (the field's own also leaked out, so listeners saw two). Question List had the same fault for its prompt and options, and no longer lets the inner fields' `change` escape as its own (#249).
- Image Action Button filled state: the pencil overlay is now positioned on the button, so it fills the frame's inner box concentrically (it was offset by the 4px line-box gap under the inline host); the thumbnail and overlay corners follow the frame's inner radius (#249).
- Mode Field docs playground: its controls had no labels and drew empty pills (#249).
- Setting Row, Settings Item, Counted Input and Number With Unit now carry the paragraph letter-spacing (`--aha-letter-spacing-paragraph`, 0.2px) on the row label, the field text and the unit, and the subtext letter-spacing (0.3px) on the counter and the error message, as the settings lab does. The tokens already existed; the components did not use them (#249).
- Setting Row and Settings Item `layout="stack"`: the slotted control now fills the row width (#249). The DS text fields (`aha-input`, `aha-select`, `aha-counted-input`, `aha-counted-textarea`) ship a 240px default width and stayed at it inside a stacked row, where the settings lab shows them full width. The Setting Row contract already said "control full-width".

## 0.196.0 — 2026-10-15
### Added
- Marketing sections preview (Patterns → Marketing sections, every page): a width switch above the preview ordered wide to narrow: Wide 1440, Desktop 1280, Tablet 768 and Phone 375, taken from the breakpoint and content-width tokens. The switch is the shared `aha-segmented`. The section renders in a frame at the chosen width, with the DS elements and Plus Jakarta Sans loaded, so media queries, container queries and `vw` sizes all respond as they would on a real page. Wider frames scale down to fit the docs column with a "1280 px · 56%" label, the choice is remembered across section pages, and arrow keys move within the switch. The paste-and-run code is unchanged. (#255)

## 0.194.0 — 2026-10-15
### Added
- Marketing section `Footer banner` (Patterns → Marketing sections, Webflow `card-based-section img-card-section`), matched to the live ahaslides.com word-cloud page at 1440px, 768px and 375px: the pale pink illustrated call-to-action card above the Footer with a centred heading and a Get started free button in the DS primary colours (Vivid Pink, `#DB005B` on hover, the DS focus outline). The card reflows at 991px and 479px, an optional paragraph slot covers the Enterprise variant, and an opt-in `aha-footer-banner--reveal` modifier reproduces the Compare page's scroll-in fade-up (skipped under reduced motion). Every value is an `--aha-*` token. Where the DS still differs from Webflow is listed in `docs/landing-webflow-scan.md`. (#257)

## 0.193.0 — 2026-10-15
### Added
- Marketing section `Header` (Patterns → Marketing sections, Webflow component Header, variant name "Variant"), matched to the live ahaslides.com at 1440px and 390px: a dark participant join bar that scrolls away above a sticky navigation; Products, Solutions and Resources mega-menus that open on hover with a fade and slide (Products in three columns with a preview slot, Solutions with use cases and integration logos, Resources in two columns); Pricing, Enterprise, a language menu that opens on click, and Log in / Sign up. At 991px and below a hamburger drawer slides down and its menus become an accordion. The brand mark is `<aha-product-lockup>`, icons are `<aha-icon>` by name, logos come from the Logo library, and every value is an `--aha-*` token. Where the DS still differs from Webflow is listed in `docs/landing-webflow-scan.md`. (#247)
- Icon `system-menu` (three lines), for a menu button. (#247)
- Slack and Model Context Protocol (MCP) logos in the Logo library, in greyscale. (#247)

## 0.191.0 — 2026-10-14
### Added
- Marketing section `Footer` (Patterns → Marketing sections, Webflow component Footer, built on Relume `uui-footer06`), matched to the live ahaslides.com at 1440px, 768px and 375px: the AhaSlides lockup above five link columns (Features, Resources, Integrations, Pricing, Company) with absolute ahaslides.com links. Links fade to Vivid Pink on hover over 0.3s and show the DS focus outline on keyboard focus. The columns reflow to three at 991px and below (Features spans two rows), spacing tightens at 767px, and at 479px there are two columns and a smaller lockup. Below the columns a grey band holds the four award badges (G2 and Training Magazine Network), eight contact and social icons, the System status link and the DMCA badge, then the copyright line; at 767px the band stacks and centres. The brand mark is `<aha-product-lockup>`, icons are `<aha-icon>` by name, and every value is an `--aha-*` token. Where the DS still differs from Webflow is listed in `docs/landing-webflow-scan.md`. (#254)
- Icons `system-linkedin-logo`, `system-facebook-logo`, `system-instagram-logo` and `system-reddit-logo`: single-colour outline brand glyphs (Phosphor) next to `system-whatsapp-logo`, for contact and social links. (#254)

## 0.189.0 — 2026-10-14
### Changed
- `<aha-chart>` brand palette: Vivid Pink 30 (series 3) is flattened to an opaque 30% pink over white (`#F8B7D2`) where the chart resolves its series colours, so every mark, legend swatch, tooltip and word looks the same on a white, grey, Vivid Pink or dark background. The `viz.series.3` token stays `#E70E684D`. `palette="deck"` charts are unchanged. (#252)

## 0.188.0 — 2026-10-14
### Added
- Correct and incorrect badges for the Report app: `<aha-badge kind="correct">` and `kind="incorrect"`, size sm by default and `size="default"` for the 28px box. The fill is the answer colour at 5% (`--aha-answer-correct-tint-5`, `--aha-answer-wrong-tint-5`), the label stays the default ink (rule 11.2), and a tick or cross circle icon (`system-check-circle`, `system-x-circle`) in `--aha-answer-correct` and `--aha-answer-wrong` (rule 11.3). For a correct or wrong answer only (rule 11.1). Contract row, docs examples, html, React and Vue snippets and render probes on the Badge page. (#250)

## 0.185.1 — 2026-10-14
### Fixed
- `<aha-chart>` treemap chip and bell-curve average badge: the translucent series tint now sits on an opaque white base, so the label keeps its contrast on a Vivid Pink tile (it fell to about 3.86:1 in 0.185.0). (#251)

## 0.185.0 — 2026-10-14
### Changed
- Vivid Pink 5 and Vivid Pink 30 are now the transparent values, `color.primitives.vividPink.5` `#E70E680D` and `.30` `#E70E684D`, not the flat `#FEF3F7` and `#F8B7D2`. `bgAccent`, `button.secondaryBgHover`, `button.tertiaryBgHover` and `button.tertiaryBgActive` alias the primitive, so there is one source. The tints now take the colour of the surface under them (a New badge on a hovered pink row stacks instead of vanishing); on white they look as before. Every `var(--aha-bg-accent,#FEF3F7)` fallback in `lib/`, the antd theme seeds and the contracts carry the transparent value, and contract `expect` colours read `rgba(231, 14, 104, 0.05)`. Illustration tints stay flat (illustrations are a separate palette), and deck-palette chart samples keep their flat customer colours. Twelve contracts now declare `environment`. (#248)
- Colour page and `design.md`: Vivid Pink 5 and 30 are described as transparencies, not as flat codes on white. (#248)

### Fixed
- Translucent tints that float over other content now sit on an opaque white backing, so nothing shows through: `<aha-avatar>` ground (stacked groups overlap by 10px), the wrapped `<aha-badge>` count and dot (soft 5% count, 30% warning dot), the `<aha-badge ribbon>` fill, and the `<aha-image-action-button>` hover fill over an image. (#248)
- Canvas Library dark-deck demo: its pale pink accent is a flat `#F8B7D2` (a customer deck colour, not the translucent token). `parseColour` (`lib/audience-deck.js`) accepts `#RRGGBBAA` and `#RGBA`, composited over white, so the transparent Vivid Pink tokens no longer fall back to white. Chart swatches (legend, tooltip, read-out rows) sit on an opaque container backing. On a grey playground surface the antd default button hover and active label is the default ink, not Darker Pink (4.35:1 there). (#248)
- Colour page, Text group: `textInverse` (`--aha-text-inverse`, white) was missing from the swatches. It is listed after `textDisabled`, and every swatch chip has a bottom divider so a white chip is visible on the white page. (#248)

## 0.183.0 — 2026-10-14
### Added
- Correct and wrong answer colours: `--aha-answer-correct` (`#008A05`) and `--aha-answer-wrong` (`#C7401E`), each with a 5% and a 30% tint (`-tint-5`, `-tint-30`), at `color.answer.*` in the tokens. For marking an answer correct or wrong only; no component uses them yet. (#245)
- Brand colour rules section 11, Correct and wrong answers: four short rules (11.1 to 11.4) in a collapsed Rules panel, and the colour table. `<aha-collapse>` on the Colour page, a native disclosure on the Brand colour rules page; the agent feeds keep the full text. The Colour page shows the tokens and the same Rules panel. (#245)
### Changed
- Rules 1.1, 7.1 and 8.5, the glance line on status, the `colour` C1 and C5 and `background` C5 judge criteria, the Background pattern and the canvas and audience guides now say the answer pair is the one exception and is for answers only. A quiz result chart colours the correct column green (rule 11.3). Still to decide moves to section 12. No existing rule id changed. (#245)

## 0.182.0 — 2026-10-14
### Added
- `<aha-badge size="default" | "sm">` on plan and session badges. `default` is 28px with 8px side padding, a 14px label, radius sm and a 16px icon; `sm` is 20px with 4px side padding, a 12px regular (400) label, radius xs and a 12px icon. Plan defaults to `default`; session defaults to `sm`. (#244)
- `<aha-badge kind="new" | "beta">`: a New tag (Vivid Pink 5% fill `--aha-bg-accent`, label in Darker Pink `--aha-text-link-hover` #DB005B, 4.65:1) and a Beta tag (grey fill, default text), size sm by default. (#244)
- `<aha-status-badge size="sm">`: the same 20px box as a small Badge, with a 4px dot (6px at the default size). The default stays 28px, so nothing changes for existing use. (#244)
- Badge docs page: a Default / sm switch at the top changes every badge on the page and is the only toggle left at the top; the Count colour and Ribbon placement toggles sit in their own sections next to the badge they control. The Default badge section comes first, before Count; the Status badges section is one section with its four looks and an Examples group inside it. (#244)

- Badge docs page: a Paid feature example (the crown mark alone, no text), the Paywall upgrade mark (16px Vivid Pink circle with the white crown, `<aha-paywall>` with no slotted child), reused rather than a new `<aha-badge>` preset. (#244)

### Changed
- Badge count `status="primary"` (Vivid Pink): the number is now `--aha-text-link-hover` #DB005B on a `--aha-bg-accent` #FEF3F7 fill (4.65:1, WebAIM Normal Text AA), was a white number on solid Vivid Pink. The default black count and the ribbon are unchanged. (#244)
- **Breaking:** Badge dot: limited to three colours, `status="default"` (default, `--aha-icon-strong` #1A1A1A), `"disabled"` (`--aha-icon-disabled` #B5B5B5) and `"active"` (`--aha-icon-active` #E70E68); other dot `status` values no longer apply. The dot is 6×6px (was 8px), or 4×4px with `size="sm"`. The hollow ring, pink edge and pulse shapes are gone. The Dot section of the docs page shows the three. A dot on a notification icon (the bell) is always the active pink dot; default and disabled dots are for neutral marks next to text. Count bubble and ribbon colours are unchanged. (#244)
- Plan badge (`<aha-badge plan>`): 28px tall, 14px / 600 label, radius `--aha-radius-sm` (6px, was a 22px pill), 8px side padding. Free, Edu, Essential and Pro are grey (`--aha-gray-30`, default text); Enterprise is on the Vivid Pink 5% fill (`--aha-bg-accent`). The crown on Pro and Enterprise is gone; no plan badge carries an icon. (#244)
- Session badge: grey (`--aha-gray-30`, default text), was a Vivid Pink tint. (#244)
- Count colour rule written into the Badge contract (spec, when-to-use, props, self-check; reaches `badge.agent.json`, `badge.md` and the page): every count is black by default (tabs, filters, inbox, totals); only `default` and `primary` are documented for counts (the page toggle is Default / Primary). The old count values `success`, `error`, `warning` and `default` stay accepted as deprecated aliases of black, and `processing` of primary; ribbon colours are unchanged. Vivid Pink (`status="primary"`) only for a new count that needs attention now (unread notifications on the bell, new responses since you last looked), at most one Vivid Pink count per screen. The default count colour is already black.
- Status badge docs folded into the Badge page as its own section (all options, rules, examples, code). `status-badge/index.html` now redirects to `badge/index.html#status-badge`; `<aha-status-badge>`, its contract, feeds and API are unchanged.

### Fixed
- Badge preset chips: the visible side padding is exactly 8px (default) and 4px (sm); a 1px transparent border had made it 9px and 5px. (#244)
- Status badge alert style: the inset border is the same grey as emphasis (`--aha-border-strong`, was black `--aha-border-warning`); the warning icon stays the only Vivid Pink. (#244)

### Removed
- **Breaking:** Badge `tone` attribute (danger, success, positive, essential, pro, branding, primary-alt label badges) and badge `href` (clickable link badges), with their docs sections, snippets and contract rows. Use a plan badge or the Status badge component. (#244)
- **Breaking:** Badge `rank` preset (`<aha-badge rank="1" | "2" | "3" | "4">`, the leaderboard medal badge), with its docs section, snippets and contract rows. The ordinal badges of `<aha-rank-list>` are unchanged. (#244)
- **Breaking:** Badge standalone status label (`<aha-badge status="…" text="…">` with no count or dot), its docs "Status" section, snippets and contract rows. Use the Status badge component for a state label. (#244)

## 0.181.1 — 2026-10-14
### Fixed
- `aha-product-lockup` writes every asset URL as an inline `new URL('<literal>', import.meta.url)`, so rspack and webpack bundle the Splash and font files instead of throwing "Cannot find module" and stopping `@ahaslides-product/design/all` from registering. A new unit test fails on any non-literal `import.meta.url` in `lib/`. (#246)

## 0.181.0 — 2026-10-14
### Added
- `<aha-status-badge look>` takes four styles: `quiet` (Gray 25, no border), `emphasis` (white, 1px `--aha-border-strong` inset border), `alert` (white, 1px `--aha-border-warning` inset border, a `system-warning-circle` icon in `--aha-icon-active`, the only pink on any badge) and `plain` (no box, Gray 80 regular text, optional icon). `look="default"` is accepted as a deprecated alias of `quiet`. (#240)
- `<aha-status-badge>` takes `marker` (`dot`, `icon`, `none`) and `icon` (a registry name, drawn at 16px before the label). (#240)
- New built-in statuses `scheduled` (quiet + calendar) and `live` (as published), and the progress statuses `not-started` (quiet + dashed circle), `in-progress` (quiet + half-dashed circle) and `completed` (quiet + check circle). Due states are a look and an icon, not new statuses: overdue `look="alert"`, due today `look="emphasis" icon="system-clock"`, due in N days `look="plain"`, on time `look="plain" icon="system-check"`, N days late `look="plain" icon="system-clock-late"`. (#240)
- Four icons: `system-clock`, `system-clock-late`, `system-archive-box` and `system-circle-half-dashed`. (#240)
- `--aha-status-badge-bg` and `--aha-status-badge-fg` let an app keep a colour set it already owns inside the shared box. The design system still ships no hue for status. (#240)
### Changed
- **Visible change for every `<aha-status-badge>`:** the box is now 28px tall with 8px side padding (was 10px), a 6px radius (was a full pill), a 14px semibold label (was 12px) and a 16px icon or a 6px dot. Published and active are the emphasis style with a dark dot (were white with black); closed is quiet with a light dot; draft is quiet with a pencil icon and archived quiet with an archive-box icon (both had a dot); inactive follows closed. Attribute names and the six existing `status` values are unchanged. Importing the element now also registers `<aha-icon>`. (#240)
- Status badges guideline and judge: the dot is only for the published / live and closed lifecycle states, so one column may mix icons and dots (criterion C6); due states are badges in this family, and counters and types use the quiet or plain style (C7); C1, C2 and C5 describe `<aha-status-badge>` instead of the hand-built `aha-status-pill` markup, which still passes on existing screens. (#240)

## 0.180.0 — 2026-10-14
### Added
- Canvas Library › Components: a new page (`canvas/index.html`), built like the Audience Library, for the in-canvas presenter controls: the light, dark and image deck demos (`<aha-button size="lg">`, `applyCanvasDeck`, the shortcut chip, `<aha-tooltip size="lg" shortcut>`), the Canvas rule from the Button spec, a copy-paste snippet and the one-tag `lib/canvas.js` box. (#243)

### Changed
- Docs header: one top-nav item, "Canvas Library", opens a two-link dropdown (Chart, then Components: the charts page and the canvas presenter-controls page, each page titled with its dropdown label) on hover, keyboard focus and click or tap (a disclosure button: Escape closes and returns focus, an outside click or focus leaving closes it). The item is active when either page is current; the page URLs are unchanged. (#243)
- The Button page no longer carries the canvas deck demo; one line links to Canvas Library › Components. The Button contract's `Canvas` spec row moved to the new page and its `canvas presenter controls` usage row now points there. The canvas guideline's presenter-controls rule and `llms.txt` point to the new page. Docs search finds it as Components.

## 0.173.0 — 2026-10-13
### Added
- `screen-lint`: a third surface, `--surface=audience` (`lintHtml(source, { surface: 'audience' })`), for a slide type's phone screen. It keeps the shared rules and the deck colour and font rules, and drops the canvas-only 16px and viewport-unit font rules, since 14px is legitimate on audience metadata. Lint `presenter.*` as `canvas`, `audience.*` as `audience` and `settings.*` as `product`. (#242)
- `screen-lint`, on `canvas` and `audience`: four new HARD rules for hand-made controls. `raw-button`: a raw `<button>`, `createElement('button')`, a DOM helper call such as `el('button', …)`, or `role="button"`. `button-size-xl`: `<aha-button size="xl">`. `button-hand-sizing`: height, padding, font-size or radius set through `::part(button)` or an inline style on `<aha-button>`. `hand-made-key-chip`: a `<kbd>` inside `<aha-button>` instead of its `shortcut` attribute. **These can fail a slide type that passed before.** A control the design system does not ship (a draggable tile, a seek-bar grip) keeps its tag with `ds-lint-allow: raw-button (why)` on that line; `button` and `shortcut` are the short group names. The product surface is unchanged. (#242)
- `screen-lint` warnings (never fail): `standalone-key-chip` for a `<kbd>` outside a button, and on `audience` `audience-button-size` (an `<aha-button>` size other than `touch`) and `audience-button-variant` (a product variant such as `secondary` where the phone uses `secondary-deck` / `tertiary-deck`). (#242)
- Agent plugin: the hooks now recognise a build-less slide type's files, with no `package.json` or `src/` folder: `presenter` / `audience` / `settings` `.html` and `.js` in a folder where one of those pages loads `ahaslides-design@` from the CDN or the `aha-slide-plugin` SDK. The write guard blocks a raw `<button>`, `role="button"` or `<aha-button size="xl">` added to `presenter.*` / `audience.*` (`.html` included); the end-of-turn judge trigger asks for the `canvas`, `audience` or `settings` judge on those files; the anti-slop floor covers the `.html` pages. Same-named files elsewhere (`models/audience.js`) are left alone. (#242)
### Changed
- Audience criteria C9 and C30 now say what holds on the build-less Developer Platform: the submit is `<aha-audience-submit>`, which takes the deck accent from `applyDeck`, never a raw `<button>`. The wording for built plugins is unchanged. (#242)
- The `audience` environment's lint route names both surfaces; the `aha-design` skill, `README.md` and `AGENTS.md` describe the new surface and rules. (#242)

## 0.172.0 — 2026-10-13
### Added
- `<aha-button shortcut="…">`: a display-only keyboard chip after the label, 8px from it — 24 × 24 square, radius 4, key 14px / 400; a longer key keeps the height and grows with 6px side padding. Keys: `M`, `Esc`, `Enter`, `Shift+Enter`, `Mod+Enter` (`Mod` is ⌘ on a Mac, Ctrl elsewhere; Mac glyphs or Windows words follow the presenter's machine; Enter is the DS icon `system-key-return`). The chip is `aria-hidden`, fades with the label when disabled, is not drawn on icon-only buttons, and updates in place when the attribute changes. White-label primary chip: black 20% (`--aha-button-primary-shortcut-bg`); every other variant: the label colour at 16%. At `size="lg"` the end padding drops to 8px for the chip. Buttons without `shortcut` render exactly as before. (#239)
- `<aha-tooltip size="lg">`, the canvas tooltip: 16px / 400 name on a 24px line, one line (no wrap at 280px), 6px / 12px padding (36px tall), no drop shadow, a 1px edge of white at 20% that runs round the arrow too, as one continuous outline (no seam across the tip base) for every placement. `<aha-tooltip size="lg" shortcut="…">` draws the same chip after the name on a 16% white wash (`shortcut` is for `size="lg"` only). The default size is unchanged. (#239)
- `applyCanvasDeck(target, { accent, ink, background })`, exported from `lib/canvas.js` (and `@ahaslides-product/design/canvas-deck`): themes every `<aha-button>` under `target` for the canvas — the deck accent as the primary, a black or white label by contrast, hover 12% and pressed 22% darker, no hover shadow (hover is a fill change only), the chip wash under a black label at ink 10%, and the focus ring in the deck ink. Nothing outside `target` changes. (#239)
- `@ahaslides-product/design/shortcut-key`: the shared chip helpers (`shortcutPieces`, `fillShortcutChip`, `isApplePlatform`). (#239)
### Changed
- Canvas rules: in-canvas presenter controls are `<aha-button size="lg">` (40px), not `size="xl"` (52px) — guide, `guidelines/canvas.json`, criterion C17 (an in-canvas `xl` now FAILs, and so does `tertiary-deck` on a photographic deck, where the action becomes a `secondary-deck`) and its evals. C10: an icon-only control's tooltip is the name followed by the shortcut chip, and its `aria-label` keeps "Mute music (M)". C13: the 14px / 400 shortcut key is the one exception to the 16px floor. The chip is stated as 24 × 24, radius 4. The `kbd-chip` and `tooltip` backlog entries are closed. AGENTS.md, PRINCIPLES.md and the `aha-design` plugin skill say the same. (#239)
- Button docs: an "On the canvas" section with the three variants and their chips on a light, a dark and an image deck, and the lg tooltip with its chip. (#239)
### Fixed
- `<aha-tooltip>`: the hint now reaches screen readers from a slotted trigger. It was wired with `aria-describedby` pointing at an id inside the tooltip's shadow root, which cannot resolve from the light DOM, so no description was announced. The tooltip now keeps a visually hidden copy of its text in its own light DOM (the trigger's tree, a 1px clipped node that adds nothing to layout) and appends that node's id to the trigger's `aria-describedby`, which every engine maps to the accessible description (unlike `aria-description`, which Safari does not read). An author's own `aria-describedby` ids are kept, and only the tooltip's id is removed when the text, the trigger or the tooltip goes away. `<aha-button>` now forwards its `aria-describedby` to its inner button by element reflection (`ariaDescribedByElements`), so both the tooltip's id and an author's own ids reach it; other custom-element triggers do not forward it. The description is skipped when the trigger's `aria-label` or text already contains the tooltip text, so "Mute music (M)" is not followed by "Mute music". The built-in `help` button keeps `aria-describedby` to the bubble (same shadow root). (#239)
- `<aha-tooltip>` meets WCAG 1.4.13: Esc dismisses a hover or focus tooltip without moving focus (it returns once the pointer and focus have both left), and the bubble is hoverable, so moving the pointer from the trigger onto it, across the 8px gap, keeps it open. Before, the bubble ignored the pointer, so it closed as the pointer reached it, and only a `click` tooltip closed on Esc. (#239)

## 0.171.0 — 2026-10-13
### Added
- **Page title and favicon** guideline (`guidelines/page-title-favicon.json`, [docs page](https://design.ahaslides.io/guidelines/page-title-favicon/index.html)): one rule for the browser tab title and the favicon on everything AhaSlides builds (product apps, audience and join pages, shared links, the marketing site, docs and help sites, internal tools). Titles are `<specific part> | AhaSlides`, brand last, one ` | ` separator, unique per page and updated on every client-side route change; only the marketing home page is brand-first. The favicon is The Splash set in `logo/favicon/`, with `/favicon.ico` answering at the site root. It says which of branding, search and usability wins where they disagree. Listed in `llms.txt` (header line, Patterns, and the `product`, `audience` and `marketing-web` routes) and in the agent plugin's build steps. Guidance only: no component, token or export changes. (#238)
### Fixed
- Docs site: every page now has its own tab title in that format (`Button | AhaSlides Design System`; the home page is `AhaSlides Design System`) instead of `AhaSlides Design System — for agents` on every page, and every page links the favicon set. `/favicon.ico` now exists at the site root (it was a 404). The build fails if two pages claim the same title. (#238)
### Changed
- Logo library → Favicon: the paragraph lists the four files and links to the new guideline for the tag set, instead of holding a second copy of the rule. (#238)

## 0.170.0 — 2026-10-13
### Added
- `<aha-csat layout="stacked">` (`row` default): the prompt on the top line and the buttons (thumbs, optional Feedback) on the line below, both left-aligned, for narrow side panels. Without the attribute the single row is unchanged. (#241)
- `<aha-csat feedback-placement="start">` (`end` default): the feedback popover opens start-aligned (left edge on the thumbs, extending right) instead of end-aligned, and still flips above at the bottom of the viewport. Without the attribute it stays `bottom-end`. Any other value falls back to the default. (#241)

## 0.166.0 — 2026-10-13
### Changed
- `<aha-number-with-unit>` is on the `aha-input` size scale: default 40px (was 32), large 48 (was 40), with no small size (the `size="small"` and `size="sm"` rule is removed), and the large field text is 16px like `aha-input`. Look is otherwise unchanged in every state. Any `size="large"` use grows 8px and the default grows 8px. (#237)

## 0.165.1 — 2026-10-13
### Fixed
- `<aha-tooltip>` edge-aligned placements (`top-end`, `bottom-end`, `left-end`, `right-start`, `right-end` and the rest): the arrow is the same 10px triangle as the centred placements. Before, `top-end` and `bottom-end` kept `left:50%` beside `right:16px` (a 26px stretched box), `left-end` kept `top:100%` beside `bottom:12px`, and `right-start` and `right-end` kept `left:50%` beside `right:100%`. Every inset is now reset before the placement sets its own. (#231)
- `<aha-tooltip>` edge-aligned placements: the arrow now points at the centre of the trigger instead of sitting a fixed 16px (12px on the vertical sides) from the aligned edge, so on a small icon button it no longer lands beside the button. The arrow keeps at least radius + 5px (11px) from the bubble corner; a trigger smaller than 22px shifts the bubble outward past its edge so the arrow still lands on it, and a trigger larger than the bubble clamps the arrow at the far inset, still over the trigger. `-end` stays the exact mirror of `-start`. The trigger size is measured once per resize into `--aha-tip-trigger-w` / `--aha-tip-trigger-h` on the persistent bubble node; the shadow DOM is not rebuilt. Cardinal placements are unchanged. (#231)
### Changed
- `<aha-tooltip help>`: the built-in `?` icon is `--aha-icon-muted` at rest and `--aha-icon-default` on hover and keyboard focus (was `--aha-text-tertiary`, brand on hover/focus). The 2px brand focus ring is unchanged. (#231)

## 0.165.0 — 2026-10-13
### Changed
- Audience library: the `SubmitButton`, `SecondaryButton` and `TertiaryButton` sections are now one `Button` section with three variants, Primary (`<aha-audience-submit>`), Secondary (`secondary-deck`) and Tertiary (`tertiary-deck`), each rule, state, demo and snippet carried across unchanged, shown as labelled variant blocks (a new optional `variants` list in `audience/library.json`, rendered by the audience page generator only). Docs-page change only: no tag, attribute, event, export or `lib/` file changes, so no slide type needs to change; the old `#SubmitButton`, `#SecondaryButton` and `#TertiaryButton` page anchors are gone. (#236)

## 0.164.6 — 2026-10-13
### Fixed
- The 0.164.5 entry links its real pull request (#234), and the placeholder example in the header is restored. (#235)

## 0.164.5 — 2026-10-13
### Fixed
- The app-shell eval fixture `pass-dashboard-shell` no longer sets the content region to `--aha-bg-layout`: the page body is white, as rule 3.6 and background criterion C2 require, and the join card is told apart by a `--aha-border-default` border. Rules, tokens and the other grey uses (sidebar, table header, editor workspace) are unchanged. (#234)

## 0.164.3 — 2026-10-13
### Changed
- Colour rules name the medium, never "marketing": rule 3.2, rule 5.6, the applied-usage heading and its lead line, the Button paragraph in section 6 and rule 9.5 now say a web page built from full-width sections, a social post, an ad, a slide, print or video. Section 3 opens with how to tell such a page from a screen of the product app. The environment ids are unchanged. (#233)
- The retired colours table and rule 1.3 (near-match colours) are tagged for every environment, as rule 1.1 already required; `rulesByEnvironment.product` and `.audience` in `colour-rules.agent.json` gain `1.3`. (#233)
- Rules 3.2 to 3.5 (coloured sections) and the applied-usage table now also carry the `product` tag: a web page built from full-width sections outside the public website, such as a help article or a sign-up or upgrade page, follows them. Rule 9.5 (a real product screenshot is never recoloured) carries `product` and `audience` too. The background judge criterion C3 now accepts pale pink sections on such a page and keeps the one-panel limit for screens of the product app, with a new eval (#11) and a matching line in the Background pattern. (#233)
- The agent feeds carry the explanatory paragraphs too, not only rules and tables: `colour-rules.md` prints them under each section heading and `colour-rules.agent.json` gains `notes`. Section 3's line on telling a sectioned web page from a product app screen now reaches agents. (#233)

## 0.164.2 — 2026-10-13
### Changed
- `<aha-radio variant="button">` states follow the new reference: the label is regular weight (400) in every state, hover turns the text brand and keeps the grey border, and the selected pill is a brand border with brand text on a white fill (was bg-accent tint with default text). A selected disabled pill now has a darker grey fill (`--aha-btn-disabled-bg`) than the unselected disabled pills, with no brand colour; hover on a disabled pill changes nothing. A selected or keyboard-focused pill now shows its brand border or focus ring on all four sides, in any position in the group (the neighbouring pill used to cover the shared edge). Dot and card variants are unchanged. Revert: revert this PR. (#232)

## 0.164.0 — 2026-10-12
### Added
- One source for the colour and background rules: `brand/colour-rules.json` (exported as `@ahaslides-product/design/colour-rules.json`). Every rule carries an id and the environments it applies to (`product`, `audience`, `marketing-web`, `video`, `social-ads`). It also holds what only the marketing skills had: applied usage per surface, no gradients, retired colours, the Splash generator's readings. (#227)
- Agent feeds from that source: `colour-rules.md` and `colour-rules.agent.json` (rules by environment, palette, Splash geometry and files, open points, and the judge criteria that check each rule). Both are in `llms.txt` and in every environment's route. (#227)
- Background library (Foundations): 18 ready-made Splash backgrounds in `backgrounds/` (centre, right and minimal at 16:9, 1:1 and 9:16, on white and on Vivid Pink) with `backgrounds/manifest.json`, and the generator `build-splash.mjs` (`npm run splash`, export `./build-splash`), which builds any size from `logo/thesplash.svg`. (#227)
- Anti-slop surface `colour` (8 advisory judge criteria, with its eval set): palette only, each colour in its role, text colour by background, the primary button, status without hue, chart colours, one-colour logos and file-type icons, borders and shadows. No new hard gate in `screen-lint.mjs` or `standards.mjs`. (#227)
### Changed
- The Brand colour rules page (`foundations/brand-colour-rules.html`, same address and look) is now generated from `brand/colour-rules.json`. No existing rule changed. "Still to decide" says "Nothing open." The minimal Splash is two copies of the largest hook, sized as if the icon were 1.15 times the longer side (each hook 0.73 of it), each pinned to its own corner with offsets measured against the longer side, so it works on any aspect ratio; colours are defined in RGB only (converted when something goes to print); and every button and text link, on any surface, is the design system Button component (there is no separate marketing button table), except the white primary button on Vivid Pink (rule 6.2), whose hover and focus outline the page now states. (#227)
- The Background pattern and the `background` anti-slop surface are rewritten to the colour rules (C1 to C8 replace C1 to C3). A consumer judged on the old criteria should re-read them: a grey page body (`--aha-bg-layout` behind the content) and a red or green status tint no longer pass, a colour "the human asked for" is no longer an exception, and the criteria add one pale pink panel per screen, black only for presenting and viewers, no dark mode, and where a Splash background is allowed. Tokens and components are unchanged. (#227)
### Removed
- `brand/visual-identity-colour-rules.html`, the hand-made page; `brand/colour-rules.json` and `brand/colour-rules.template.html` replace it. (#227)

## 0.162.0 — 2026-10-12
### Changed
- The audience field compositions now use the foundation fields at `size="lg"` (48px) instead of `size="touch"` (56px): `<aha-counted-input>` (line and number), `<aha-counted-textarea>` and `<aha-select>` inside `<aha-audience-field>`, in the element docs, contract, library entry and HTML/React/Vue snippets. The foundation `touch` rules stay for other consumers; buttons keep `size="touch"`. At `large`/`lg` the field text of `<aha-input>`, `<aha-counted-input>`, `<aha-counted-textarea>` and the `<aha-select>` trigger is now 16px (`--aha-size-l`) on a 24px line, so the audience field text stays at the 16px iOS focus-zoom floor; `<aha-counted-textarea>` gains a `large` rule for the text only (no fixed height). At lg the audience fields still show used/max in the counter, a 12px side padding (6px 12px on the textarea) and a white textarea counter fill. (#220)

## 0.157.0 — 2026-10-12
### Added
- Icon search by meaning: every glyph carries at least 3 meaning words (`icons/meaning.json`, copied into `icons/registry.json`), so "help" finds `system-question` and "delete" finds `system-trash`. Search with `npm run icon-search <words>` (in an app: `node node_modules/@ahaslides-product/design/icon-search.mjs <words>`), the Icon library search box (`icons/index.html?q=<words>`), `icons.agent.json` (each icon's `meaning`, plus a `search` key) or `icons.llms.txt` → Find by meaning; `llms.txt` points there. The runtime bundles carry no search words. (#229)
- Near-duplicate icon gate: `icon-similarity.mjs` draws every glyph as `<aha-icon>` does at 16px (pure JS, no browser) and `standards.mjs` fails a new or changed glyph at or above 86% overlap with an existing one; outline / `-filled` variants and aliases are exempt. The 30 pairs that predate the gate are listed in `icon-duplicates.baseline.json`, which may only shrink (`npm run icon-duplicates` prints them; `node icon-similarity.mjs --check <file.svg>` shows a candidate's closest glyphs). `standards.mjs` also fails a glyph with fewer than 3 meaning words. (#229)
- CI fails a pull request that adds a glyph under `icons/svg/` without an `Icon search:` line naming each close existing match, by look or by meaning, and why it does not fit (`.github/scripts/pr-icon-search.mjs`, new line in the pull request template). (#229)
- Agent plugin: the write guard blocks a hand-made icon in an app, an inline `<svg>` or a new `.svg` file, and points to the icon search. Markup files (`.tsx`, `.jsx`, `.vue`, `.svelte`, `.astro`) are always checked; `.ts`, `.js` and `.html` files only in a project whose `package.json` depends on `@ahaslides-product/design`. Test files, lines marked `ds-lint-allow: svg (why)`, `<svg>` tags already in the file, react-native-svg's `<Svg>`, and the design system's own glyph, illustration and logo sources are allowed. The aha-design skill's icon step names the search. (#229)

## 0.156.0 — 2026-10-12
### Removed
- Icon library: the `system-question-circle` glyph is gone. The name still resolves as a deprecated back-compat alias of `system-question`, so consumers that reference it keep working while they migrate; the alias is not listed as its own glyph on the Icon library page (which now lists only real glyphs). The registry still holds 305 names: 300 glyph files plus 5 back-compat aliases. (#228)

### Changed
- `<aha-tooltip help>` now draws `system-question` instead of `system-question-circle`. The tooltip, section-header, setting-row and setting-group contracts name `system-question` for the help glyph. (#228)

## 0.154.1 — 2026-10-12
### Changed
- Background task: the use case is now stated up front. It tracks one long-running process that keeps running while the user carries on working in the editor or dashboard, and applies only when all four hold: the user started it, it takes over 10 seconds, nothing is blocked, and it has a clear end (finished, cancelled or failed) with a result to point at. Not for a Toast, Notification, Modal or Spin, an Uploader or Progress, or anything the system does on its own (autosave). The rules lead the docs page intro and sit in the contract's summary and When to use, so `background-task.agent.json`, `background-task.md`, `design.md` and `llms.txt` carry them. Docs only, API unchanged. (#230)

## 0.154.0 — 2026-10-12
### Added
- Environments and routes: every contract, guideline and marketing or brand asset declares `environment` (one or more of `product`, `audience`, `marketing-web`, `video`, `social-ads`). The one table, `environments.json` (now in the package), holds each environment's route (guidelines, judge, lint, plugin, owner); `llms.txt` prints it under **Routes**, and index lines show an item's environment. Adding an environment or an item folder is a data change only. (#226)
- Every generated feed opens with a three-line route header pointing at `llms.txt` Routes, `anti-slop.md`, `guidelines.llms.txt` and the agent plugin (a `route` key in `icons.agent.json` and `anti-slop.agent.json`); per-component and marketing agent feeds carry `environment`. (#226)
- `standards.mjs` fails a new or changed item with no environment or an unknown one; the 146 older items wait in `environments.baseline.json`, which may only shrink. CI also fails a pull request that touches `contracts/`, `guidelines/`, `marketing/`, `brand/`, `logo/` or `illustrations/` without an `Environment:` line in its body matching the changed items (new pull request template). (#226)
- `npm run route-scan`: report-only scan (always exits 0, `--json` for routines) of items with no environment, an unknown one, or one their folder does not serve. The aha-design skill now picks the environment before the surface. (#226)

## 0.153.2 — 2026-10-12
### Fixed
- `standards.mjs` now fails a pull request whose `package.json` version is not strictly greater than the base branch's (read from `origin/<base>`, failing closed if it cannot be read); the existing check already requires the top CHANGELOG entry to equal `package.json`. Stops stale-base PRs from claiming an already-released version. (#173)

## 0.153.1 — 2026-10-12
### Fixed
- Icon docs: the registry count reads 305 (301 glyph files, 265 from Figma DS V3 and 36 Phosphor, plus 4 back-compat aliases) in the README, the Icon contract and the icon snippets, after `filetype-report` joined it (#225)

## 0.153.0 — 2026-10-12
### Added
- Icons: `filetype-report` joins the File type family beside Course, Knowledge base, Lesson, Presentation and Survey, drawn in the DS icon ink so it follows the text colour like the others (#224)

## 0.151.1 — 2026-10-12
### Changed
- Every text field now follows the `<aha-input>` look: rest border `--aha-border-default`, focus border `--aha-color-primary` with the soft `--aha-focus-ring-soft` ring (replaces the solid `--aha-border-focus` ring). Changed components: `<aha-counted-input>`, `<aha-counted-textarea>`, `<aha-select>`, `<aha-number-with-unit>`, `<aha-autocomplete>`, `<aha-option-row>` (ring only) and the audience `.field` rest border (#223)
- `<aha-counted-textarea>`: radius 8 (was 6) and the "textarea exception" is gone: focus now uses the primary border like the other fields (#223)

## 0.151.0 — 2026-10-09
### Added
- `<aha-product-lockup>`: the AhaSlides product lockup (The Splash, AhaSlides and a product name as one mark) for the top-left of every site, microsite and app header. `product`, `variant` (auto, full, compact, splash), `tone` (colour, inverse) and `size` (20px default, 18px minimum); auto flips to compact below a 480px header; the box keeps a 0.1em bleed so a clipping parent never cuts a glyph edge (#221)
- Logo library: a Product lockup section with the spec table and the don'ts (#221)
- screen-lint `hand-set-lockup` (warning): the AhaSlides logo or The Splash set by hand in a header or nav (#221)
### Changed
- `app-shell` C1 and its guideline rule: the header brand of any site or app is `<aha-product-lockup>` (#221)
- The design.ahaslides.io site header is `<aha-product-lockup product="Design System">` (full, compact below a 480px header) in place of The Splash beside hand-set text (#221)
- Agent plugin: every prompt carries the product lockup rule, including marketing-style pages; writing an AhaSlides logo file nudges toward the lockup (#221)

## 0.150.0 — 2026-10-09
### Fixed
- The React snippet for the date picker parses again when copied: the `size` note inside the `<DatePicker>` props is now a `//` comment, not a `{/* */}` child expression (#217)

## 0.148.0 — 2026-10-09
### Changed
- `<aha-icon>` now draws every stroke at the width paired with its size (12px 1px, 16px 1.5px, 24px 2px, 32px 2.5px), whatever the glyph's viewBox. Before, the pairing was declared but never applied, so the stroke scaled with the glyph's viewBox and size: 16-viewBox glyphs drew 1.25px at 16px, and 24-viewBox slide-type glyphs drew 1.25px at 24px and 1.67px at 32px. An off-grid size takes the nearest on-grid stroke. `lib/icons.js` now exports `LINE` and `strokeWidthFor`, and can be imported outside a browser. (#219)
- Every icon inside a component now sits on the 12 / 16 / 24 / 32 grid, so the size-paired stroke applies to it: the shared dismiss and remove ✕ (alert, info box, background task, CSAT follow-up, uploader, image preview, close button) and the carets (menu, dropdown, collapse), option-row trash, add-option, colour-picker tick and breadcrumb leading icon go 14 → 16; info-box glyph and image-action-button 18 → 16; card-select, list avatar and uploader add tile 20 → 24; uploader drop zone and skeleton image 28 → 24; paywall crown 10 → 12; tag and badge lead icons 14 → 12 (16 on the large badge); progress status glyph 14 → 12; avatar glyph is 12 / 24 / 32 for avatars up to 28 / 48 / larger; result status glyph 48 → 32; chart correct-answer tick 18 → 16, chart pager carets 20 → 16 and mind-map add and collapse 14 → 16; toast and notification status icons are drawn at 16 and 24 with the paired stroke. Layout shift: uploader drop zone and file list 4px shorter, card-select 4px taller, progress status row 2px shorter, result 16px shorter, tag with a lead icon 2px narrower; every other component keeps its size.
- The checkbox and option-row ticks draw at 1px (was 1.6px) because they render at 12px.
- Contract and guideline text names the 16px dismiss ✕, 16px image-action glyph and 32px result glyph; flavour snippets (button, collapse, empty, modal) use on-grid sizes.
### Added
- Icon library: a "Stroke by size" section showing one glyph at all four sizes with its stroke, and `tests/icon-stroke.test.mjs` measuring the rendered stroke for 16- and 24-viewBox glyphs at each size, and failing when any component, flavour snippet or docs template passes an off-grid size to `<aha-icon>`. The icon feeds (`icons.llms.txt`, `icons.agent.json`), contract and anti-slop wording state the rule. (#219)

## 0.147.0 — 2026-10-09
### Added
- `<aha-button variant="secondary-deck">`: a white-filled button whose edge is the dark text ink (`--aha-text-default`, #1A1A1A) at 10% and whose label is that ink solid (17.4:1 on white), on every deck, light or dark, never the deck accent; hover is a 5% ink wash, pressed 10%, focus the browser's own focus ring, disabled an ink-10% edge and ink-45% label. No new token. At `size="touch"` it is the audience phone's secondary action, the counterpart of the Submit button. `<aha-audience-image-upload variant="button">` now uses it, full width (#209)
- `--aha-deck-surface-deep` deck variable (and `audienceSurfaceDeep()`): the deep panel, the same as `--aha-deck-surface` on a light deck and Deep Space at 80% on a dark one
- `<aha-button variant="tertiary-deck">`: the audience phone's tertiary action at `size="touch"`. No edge, transparent fill, label and icon in the deck ink (`--aha-deck-ink`); ink 5% on hover and 10% pressed, the browser's own focus ring, ink 45% disabled. Text only, icon + text and icon only (48 x 48, `aria-label` required); `secondary-deck` takes the same three forms. Both are listed in the audience library with when-to-use lines (primary `aha-audience-submit`, secondary `secondary-deck`, tertiary `tertiary-deck`). Additive: every existing variant renders unchanged; to revert, delete the `tertiary-deck` rules in `lib/aha-button.js` and the two library entries (#209)
- `<aha-button>` hooks `--aha-button-primary-border` (primary edge, default the fill) and `--aha-button-focus-outline` (outline on keyboard focus, default none); with neither set nothing changes
### Changed
- Audience components are re-specified: `<aha-audience-chip>` is 48px high with 8px corners, a 1px edge at ink 20% (also on hover), the deep panel on a dark deck and a 2px ink focus outline; `<aha-scale-slider>` centres the readout above an 8px rail with 2px corners, inset 16px from the end captions, step label weight 600, captions on a 16px line; `<aha-audience-image-upload>` area is a 2px dashed ink-20% edge with 8px corners on the deep panel with a backdrop blur, a 14px hint, and its compact button is full width; `<aha-audience-submit>` has a 1px ink-10% edge in every state and a 2px focus outline 1px off the button; `<aha-waiting-for-host>` has 8px gaps and a 14px sub-line; `<aha-submitted-card>` has a 16px gap, 8px between its texts, the deep panel, a 14px subtitle and a pip on an ink-10% wash with the glyph in the 65% ink (#209)
- `<aha-swipe-card>` has 16px padding (was 24) and its `hint` is a 14px line below the statement with no arrows (was a 12px line above it between two arrows), so the card is 90px tall with a hint
- Contracts, conformance expectations, library entries and examples for these components match the new values
- Audience guidance matches the shipped components: rule `slider-rail-flush` and criterion C20 allow an equal intended rail inset (`<aha-scale-slider>` insets 16px) and only fail an uneven leftover Ant margin; rule `slider-fill-hairline`, C18, C32 and `border-weight` limit the one 10% value to tracks and panel hairlines and name the 20% edges (chip, dashed drop area, answer-row radio / checkbox control) (#209)
### Fixed
- The loading spinner in `<aha-button>` renders at its intended 16px. Its size shared a selector list with an invalid `::slotted(...) svg` selector, so the whole rule was dropped and the spinner measured 131px and stretched the host. This fixes every `<aha-button loading>` (and so `<aha-audience-submit>` while busy), not only the audience Submit button (#209)
- `state-check.mjs` counts the white second tone of the browser's own focus ring (`outline-style: auto`), which `getComputedStyle` does not expose, so that ring is no longer read as 1.00:1 on a dark deck; authored outlines are measured as before (#209)

## 0.146.0 — 2026-10-09
### Added
- Logo library: a Favicon section after The Splash, with `favicon-32.png`, `favicon-180.png` (apple-touch, white ground), `favicon-512.png` and `favicon.ico` (16, 32, 48), each with copy and download and a usage line; `node favicons.mjs` rebuilds them from `logo/thesplash.svg` (#218)

## 0.144.1 — 2026-10-09
### Fixed
- The React snippet for `aha-csat` parses again when copied: the tooltip-placement note moved out of the `return` line into a comment above it (#216)

## 0.144.0 — 2026-10-09
### Changed
- The docs site and every agent feed (`llms.txt`, `*.agent.json`, `design.md`, `variables.css`, the icon gallery) move from `ahaslides-product.github.io/ahaslides-design` to `https://design.ahaslides.io`, served at the domain root (staging at `/staging`); the old address stops being canonical at cut-over (#215)
- `design.ahaslides.io` is served by a small Cloudflare Worker (`ahaslides-design-docs`, in `domain/`) that proxies the GitHub Pages site; no DNS edit or Pages custom domain needed (#215)
- Docs pages opened on the old `ahaslides-product.github.io` address redirect to the same page on `design.ahaslides.io` (#215)

## 0.143.0 — 2026-10-09
### Added
- "For developers" page (`get-started/index.html`, top-nav tab) holds the install steps, token layer, CDN snippet and agent feeds that used to open the Overview (#214)
### Changed
- The Overview is now a short start page for non-developers: what the system is, and six cards into Colour, Typography, Button, Components, Patterns and Guidelines. The 100-odd component cards are gone from it; the Components tab still lists them (#214)
### Fixed
- Plus Jakarta Sans loads sooner and survives a failed fetch: every docs page preloads the Regular and SemiBold files, and each `@font-face` falls back to a jsDelivr copy pinned to the release tag (#214)

## 0.142.0 — 2026-10-09
### Changed
- `<aha-menu>` rows are Regular 400; the selected row is SemiBold 600 (#197)
- `<aha-chart type="donut">` (donut and pie): only slice 1 is series 1; later slices cycle series 2 to 4, so the last slice no longer repeats Vivid Pink beside the first. Slices are separated by a 2px gap in `--aha-viz-slice-gap` (default `--aha-bg-container`; on a deck palette the inverse ink) instead of the 10% ink hairline (#197)
- `<aha-button variant="text-link">` is underlined on hover, press and keyboard focus (no underline at rest) (#197)
- Toast and Notification status icons are the DS stroke glyphs (info, check-circle, warning-circle, x-circle) in `--aha-icon-default` `#4A4A4A`, not antd's filled ones; importing `toast-theme` / `notification-theme` adds the rule so default `message.success()` calls get them, and `dsToastIcon` / `dsNotificationIcon` return an `<aha-icon>` for the `icon` option (#197)
- Notification title is SemiBold 600 (was 400); `notification-theme` adds one `.ant-notification-notice-title` rule (#197)
- `modalTheme` and `drawerTheme`: the antd Button is 36px, the DS `md` size (it was 32px) (#197)
- `carouselTheme`: the active dot is Vivid Pink. antd drew a white overlay over it that no token reaches, so importing the module adds one `.ant-carousel .slick-dots` rule (`carouselDotsCss`); rest dots are grey 70 (#8A8A8A, 3.45:1 on white) and a focused dot shows the Vivid Pink focus outline (#197)
- `formTheme` validation messages use the field error row: a 12px x-circle glyph and 12px (`--aha-size-sm`) text, as Input; importing the module adds one `.ant-form-item-explain-error` rule (`formErrorCss`). `<aha-tag checkable size="large" checked>` labels are the link pink `--aha-text-link-hover` `#DB005B`, the step that passes 4.5:1 on the pale pink fill, as the secondary button hover (#197)
- `formTheme`: the antd Button is 36px, the DS `md` size (it was 32px) (#197)
- `<aha-badge>` status: error, warning and success no longer look alike. Success is a solid black dot, error a hollow black ring, warning Vivid Pink 30% (`#F8B7D2`) with a 1px Vivid Pink edge, processing stays Vivid Pink and pulsing, default stays grey; `dot` markers take the same shapes. A Vivid Pink count is `status="primary"`, now shown on the Badge page and in the playground (#197)
- `<aha-avatar-group>` rotates its members through Vivid Pink 5% (`#FEF3F7`), 30% (`#F8B7D2`) and 100% (`#E70E68`, white initials) so neighbours never share a ground; a member with its own `color` keeps it, and the +N chip sits on grey 25 (`#F3F3F3`) (#197)
- Form, Autocomplete, Date picker, Time picker and Textarea themes follow the same field scale: default 40px, large 48px (they were 32 / 40), so an Input, a counted input and these controls sit level in a form (#197)
- Input, Input number and Select: default height 40px, large 48px (small stays 24px); `<aha-input>` was 32 / 40, and `selectTheme` and `inputNumberTheme` set `controlHeight` 40 and `controlHeightLG` 48 (#197)
- `<aha-pagination>` page and prev / next hover and press take the secondary button's treatment: `#FEF3F7` fill, `#E70E68` border, `#DB005B` label (press: `#DB005B` border) (#197)
- Steps titles (`.ant-steps-item-title`) are SemiBold 600 (were 400); `steps-theme` adds the one rule when imported (#197)
- `<aha-alert>` status glyph is 16px in both sizes (it was 18px in regular). `<aha-dropdown>` items: hover is `--aha-bg-hover` `#F7F7F7` (was grey 40 `#E3E3E3`), the leading icon is `--aha-icon-default` `#4A4A4A` (danger and disabled rows keep their text colour), the label is Regular 400 (was 600) (#197)
- `<aha-alert>` info, success, warning and error sit on grey 25 (`--aha-gray-25`, `#F3F3F3`) with no border; branding keeps its pale pink surface, also with no border (#197)
- **Breaking (visual):** the 7 October 2026 colour rules replace the DS V3 palette. Vivid Pink `#E70E68` is the one primary (`--aha-color-primary`, buttons, focus, link hover, icon-active); Darker Pink `#DB005B` is hover and press; Vivid Pink at 5% (`#FEF3F7`) is the hover and selected background (`--aha-bg-accent`, button secondary and tertiary hover). Token names are unchanged, only values move (#197)
- **Breaking (visual):** status carries no colour. `--aha-color-success | warning | error | info`, the `--aha-text-positive | negative | warning` and `--aha-border-success | warning | error | info` tokens are the default ink `#1A1A1A`, each an alias of `--aha-text-default` so the two cannot drift (they were black `#000000`), the status backgrounds (`--aha-bg-positive | negative | warning | warning-subtle | informative`) are white, and the status buttons differ by shape (see the status-button entry below); every status keeps its icon and wording, and audience answer rows still tell correct from incorrect by the ✓ / ✗ glyph (#197)
- **Breaking (visual):** brand charts use four colours in order: Vivid Pink, black `#1A1A1A`, Vivid Pink at 30% (`#F8B7D2`), light grey `#A8A8A8` (`--aha-viz-series-1…4`; 5 and 6 repeat the first two); tints are Vivid Pink at 5% or grey. Deck-palette charts are unchanged (#197)
- Links are Vivid Pink `#E70E68`, underlined at rest (Button `text-link` has no underline at rest and is underlined on hover, press and keyboard focus, and `--aha-text-link-decoration: underline` restores it where the link takes the default ink), and turn Darker Pink `#DB005B` on hover (`--aha-text-link` aliases `--aha-color-primary`, `--aha-text-link-hover` aliases `--aha-color-primary-hover`; Button `link` and `text-link`, antd `colorLink`). Pink text passes contrast on white only (4.51:1), so on grey or Vivid Pink at 5% the screen sets `--aha-text-link` and `--aha-text-link-hover` to the default ink on that container (Button `link` does not detect its surface) and the link stays underlined, and on a dark surface it sets them to white; the docs site's note and back-link panels reach the same result by colouring their plain anchors the default ink directly. Text on Vivid Pink at 5% is the default ink: selected menu, select, radio button, card select, list avatar, dropdown, tabs, tag, badge, avatar, CSAT, uploader, table filter and number-step states no longer put pink text on the pale pink tint (#197)
- The primary button gains a soft pink shadow on hover (`--aha-button-elevate-primary-hover`) and drops it on press. Overlay, ink alphas (`--aha-bg-overlay` is now black at 40%, `--aha-ink-a*`) and popover, tooltip and colour-picker shadows are black instead of indigo (#197)
- Badge tones, plans and ranks drop coral, yellow, green and purple for Vivid Pink, pale pink, black and grey; rate stars are Vivid Pink (#197)
- The colour picker's first preset and the audience snippets' sample deck accent are Vivid Pink (#197)
- **Breaking (visual):** black is `#1A1A1A`, the same value as grey 100 and the default ink, since pure black is too harsh: `--aha-black` is an alias of `--aha-gray-100` (it was `#000000`), so the second chart series, the Pro plan badge and the docs composite badge soften with it. A pure black is never painted solid; shadows, the overlay scrim and the `--aha-ink-a*` alphas stay transparencies of it, where the difference cannot be seen (#197)
- **Breaking (visual):** the dark surfaces are neutral. `--aha-bg-dark` is black `#1A1A1A`, an alias of `--aha-black` (tooltip, chart tooltip, docs code blocks; was indigo `#1A1A2E`) and `--aha-bg-dark-raised` is grey 95 `#303030`, an alias of `--aha-gray-95`, one step above it (paywall popover; was `#242442`). On the paywall popover white text is 13.2:1, the See all plans border 3.8:1 and both focus rings 13.2:1; the Upgrade button's fill is 2.9:1 against the surface, its white label 4.51:1 on the fill. `--aha-border-input` is grey-50 `#D4D4D4` (was `#D3D7E1`) and `--aha-text-primary-ink` is grey-90 `#4A4A4A` (was `#3E3E5A`) (#197)
- The Colour page, `design.md` and the feeds list only the allowed palette: white, black, Vivid Pink, the grey ramp and the logo purple. The docs site's own badges, pills, notes, code panels and search highlight use those colours too (#197)
- **Breaking (visual):** status carries no hue, so `<aha-button variant="positive">` (Upgrade, encourage) is Vivid Pink like primary (it was black). `--aha-btn-positive-bg | -bg-hover | -bg-press` are `#E70E68 | #DB005B | #DB005B` and `--aha-btn-danger-bg` is an alias of `--aha-text-default` and `--aha-btn-danger-bg-hover | -bg-press` alias `--aha-gray-90 | --aha-gray-80` (#197)
- **Breaking (visual):** keyboard focus on `<aha-button>` is a 2px solid ring outside a 2px gap: Vivid Pink (4.51:1 on white). `--aha-btn-focus-ring` is `#E70E68` and `--aha-btn-focus-ring-success` and `--aha-btn-danger-ring` alias `--aha-text-default` (they were 30% and 20% alphas, 1.66:1 and 1.61:1). Set `--aha-button-focus-ring` and the new `--aha-button-focus-gap` on a dark surface (#197)
- **Breaking (visual):** every illustration, third-party brand logo and file-type icon is drawn in the allowed colours. The 25 illustrations are one hue, the illustration tints: Vivid Pink at 5, 10, 20, 30, 45, 60, 80 and 100% on white (`#FEF3F7`, `#FDE7F0`, `#FACFE1`, `#F8B7D2`, `#F493BB`, `#F16EA4`, `#EC3E86`, `#E70E68`) plus Darker Pink `#DB005B`, with white and the default ink for outlines and faces; each original colour maps to the tint nearest to it in lightness, so shading keeps its order. The 10, 20, 45, 60 and 80% tints are for illustrations only: they are not tokens and never colour UI; the 5% and 30% tints and Darker Pink keep their interface roles from the colour rules. The 18 coloured brand logos (PowerPoint, Excel, Word, Teams, OneDrive, Google, Drive, Slides, Zoom, YouTube and the rest) are greyscale, none darker than black `#1A1A1A`; the 5 file-type icons are one colour and now follow the text colour like every other icon (`recolorable: true`) (#197)
- **Breaking (visual):** the pink hooks of the AhaSlides logo and The Splash are Vivid Pink `#E70E68` (they were Radical Pink `#FF4081`) in `logo/ahaslides-logo.svg` and `logo/thesplash.svg`, and so in the docs header. The purple hooks and the wordmark are unchanged, and so are the black and white variants (#197)
- **Breaking:** the token `color.semantic.border` (`#E3E3E3`) is renamed `borderDefault`, so `--aha-border` is now `--aha-border-default` (JS key `borderDefault`), matching `--aha-text-default` and `--aha-icon-default`. `--aha-border` stays one release as a deprecated alias of `--aha-border-default` (as the renamed icon names and `<aha-progress-toast>` did), and is removed in the next release: migrate now. `--aha-border-input | -secondary | -strong | -disabled | -hover | -active | -error | -success | -warning | -info` are unchanged (#197)
- **Breaking (visual):** `<aha-alert>` info, success, warning and error draw their icon in `--aha-icon-default` (`#4A4A4A`), and no alert type or banner draws a border any more (#197)
- **Breaking (visual):** `<aha-button variant="danger">` renders exactly as `secondary` in every state (white fill, `#E3E3E3` border, pale pink hover with a Vivid Pink border, Darker Pink active border, disabled grey); the variant name is kept so callers do not break. the `--aha-button-danger-*` tokens stay defined: the dropdown danger item reads `--aha-button-danger-bg`, and nothing else in `lib/` reads the family (#197)
- **Breaking:** `<aha-button variant="success">` is removed (it was not used anywhere in the DS); use `secondary`, or `positive` for a Vivid Pink call to action. `--aha-btn-focus-ring-success` stays because `<aha-option-row>` reads it; its `--aha-button-focus-ring-success` alias stays too, though nothing in `lib/` reads the alias any more (#197)
- Fixed: the `loading` spinner on `<aha-button>` was invisible (0px wide) in every variant, because its size sat in one rule with an invalid `::slotted(...) svg` selector and the browser dropped the whole rule; it is now 16px in the label colour of each variant (#197)
- **Breaking (docs):** Popconfirm follows the rule that the safe choice is the primary button. Spread the new `destructiveConfirm` (from `popconfirm-theme`) on a Delete or Remove confirm: Cancel is the Vivid Pink primary and the confirm is the dark danger button. It replaces the `okType="danger"` recipe. The action buttons are the DS small button size (28px tall, 4px corners, 14px semibold), the header icon is `<aha-icon name="system-warning-circle">` in the default ink, and the examples trigger from an `<aha-button>` (#197)
- The Modal danger confirmation and the overlays guideline use the same roles: `cancelButtonProps={{ type: 'primary' }}` beside `okButtonProps={{ danger: true, type: 'primary' }}` (#197)
- Toast and notification status icons (success, info, warning, error) are the default ink; they were antd's green, blue and amber. An antd `Button` under any DS theme hovers like the DS secondary button (pale pink fill, Vivid Pink border, Darker Pink label) instead of antd's lighter pink, and its focus outline is Vivid Pink (#197)
- Error and warning focus on `<aha-input>`, `<aha-counted-input>`, `<aha-counted-textarea>`, `<aha-autocomplete>`, `<aha-select>` and `<aha-number-with-unit>` draws a solid 2px ring in the default ink (it was black at 20%, 1.61:1) (#197)
- `<aha-button variant="text">` press is a grey-50 fill; it was a pink label on grey (3.51:1). The question-list add buttons and the uploader drop zone turn their label the default ink on the pale pink hover (pink on pale pink is 4.16:1) (#197)
- The checked `<aha-tag checkable size="large">` filter chip from 0.117.0 is pale pink with a Vivid Pink border and a default-ink label (it shipped on the removed purple ramp) (#197)
- Demo placeholders use allowed colours: card and image covers are grey, sample deck accents and deck-palette chart examples are Vivid Pink, white, Vivid Pink at 30% and light grey, the colour-picker examples pick Vivid Pink, Darker Pink and black. The colour picker's 12 default presets are unchanged: they are colours a presenter picks for their own content (#197)
- Button `text-link` has no underline at rest (hover and active are #DB005B); new `--aha-text-link-decoration` (default `none`) lets a grey or Vivid Pink 5% surface restore it, and the docs note and back-link panels do. Button `link` and plain anchors stay underlined (#197)
- Button `secondary` and `tertiary`: on hover and active the label and icon are `--aha-text-link-hover` (#DB005B) on the existing pale pink fill (#FEF3F7), 4.66:1; on active the `secondary` border is `--aha-border-active` (#DB005B), `tertiary` has no border. New `--aha-button-default-text-hover` (aliases `--aha-text-link-hover`); `--aha-button-default-border-press` is `--aha-border-active`. The antd base theme matches (`defaultHoverColor`, `defaultActiveColor`, `defaultActiveBorderColor`). Dark and deck surfaces (Paywall, audience image upload) override the label token to keep their ink. Hover and active rules of every variant skip a disabled button, so a disabled label keeps the disabled ink. (#197)
- Docs site: every Show code toggle is the DS `<aha-button variant="secondary" size="sm">`; notes, hub hints and badges sit on grey instead of pale pink, and links inside them are the default ink, underlined (#197)
### Added
- Error message row: `error-message` on `<aha-input>`, `<aha-select>` and `<aha-counted-textarea>` shows a 12px error glyph and the message at `--aha-size-sm` below the field, linked by `aria-describedby` (with `aria-invalid` from `status="error"`). `<aha-field-error>` gains `icon` (the same row); antd Input number, Select and Textarea pair `status="error"` with a sibling `<aha-field-error icon>` (#197)
- `--aha-vivid-pink-5 | 30 | 100 | dark` primitives and `--aha-gray-65` (`#A8A8A8`, the chart light grey) (#197)
- `--aha-logo-purple` (`#6A1EBB`), the one purple left, for the logo only (#197)
- `standards.mjs` fails a colour token that is off the allowed list (Vivid Pink, Darker Pink, the two flat tints, white, black, neutral greys, and purple at `color.primitives.logoPurple` only) and fails the build when the Colour page shows any other colour (#197)
- `state-check.mjs`, an interactive-state gate that `qa.mjs` runs on every built page: it forces `:hover`, `:focus-visible` and `:active` on each control and fails text contrast under 4.5:1 (3:1 for large text and icons), a colour off the allowed list, or a focus indicator under 3:1. `node state-check.mjs <slug>` checks one page. Findings that predate the gate (87 element-and-state entries across 17 pages, mostly `--aha-text-tertiary` `#8A8A8A` labels at 3.45:1) are listed in `state-check.baseline.json` and can only shrink (#197)
- `@ahaslides-product/design/antd-base-theme`: `dsAntdTheme(theme)` and `antdBaseTheme`. antd derives hover, press, focus and status colours from its seeds; the base pins each one to an allowed colour. All 17 `*-theme` exports are built with it (#197)
- `recolour-art.mjs`: maps illustrations, third-party logos and file-type icons onto the allowed colours by rule (an illustration colour to the illustration tint nearest in lightness, a logo colour to a grey of the same lightness). Run it on the original export after a new Figma or brand import; `--check` lists what would change. Per-illustration exceptions sit in one table, `ILLUSTRATION_OVERRIDES` (#197)
- `standards.mjs` fails a colour token or a source that paints pure black solid, an AhaSlides logo file with a colour other than the logo purple and Vivid Pink, and a demo whose service or file mark is not a file in the Logo library (a raster or base64 image hides its colours from the gate). The illustration tints pass in illustration files only (#197)
- `standards.mjs` fails art that `recolour-art.mjs` would still change, an off-list colour in the icon or illustration registry, in a demo, contract, guideline or element source, or on the Colour page's inline SVG (only the header logo is skipped), and an antd theme that is not built on the shared base (#197)
### Removed
- **Breaking:** the DS V3 hue ramps are gone from `tokens.css`, `tokens.js`, `design.md` and every feed: `--aha-purple-*`, `--aha-pink-*`, `--aha-teal-*`, `--aha-coral-*`, `--aha-red-*`, `--aha-yellow-*`, `--aha-indigo-*`, `--aha-soft-indigo-*` and `--aha-lavender-*` (98 values). Use a semantic token; for the logo purple use `--aha-logo-purple` (was `--aha-purple-60`) (#197)
- **Breaking:** the 13 brand slots `--aha-brand-1` to `--aha-brand-13` are gone. A deck-palette chart or a sample deck passes its own colours as values, since a deck theme is presenter content (#197)
### Fixed
- `<aha-dropdown>` keyboard: Tab from the open trigger now lands on the first enabled item (Tab / Shift+Tab and the arrows step through items, Tab past the last closes). Keydown checks read the retargeted shadow event target, so trigger and item were never recognised, and the panel's delayed `visibility` also blocked focus on open (#197)
- A code snippet that names a Logo library file (`background-task` HTML, React and Vue) points at the build that printed it, so a staging page no longer shows a snippet that loads the released, still coloured PowerPoint mark (#197)
- `DataTable` used on its own (outside a `tableTheme` provider) gives Export and the filter Reset / Apply buttons the DS secondary hover, a Vivid Pink border on Vivid Pink 5%, where antd's derived Darker Pink label showed (#197)
- `state-check.baseline.json` lists one entry per element and state, and an entry the page no longer shows fails the gate until `node state-check.mjs --update-baseline` drops it, so known debt cannot quietly come back (#197)
- The shared antd base theme reaches composite previews as escaped data, so no theme value can close the inline script it is written into (#197)
- Paywall: the See all plans label stays white on hover and press. It turned `#1A1A1A` on the `#2C2C2C` hover fill (1.25:1) because the secondary button's hover rule set its label from `--aha-text-default` instead of the button's own `--aha-button-default-text`; it is now 13.96:1 in every state, with a white focus ring (#197)
- `<aha-button variant="primary">` and `variant="secondary"` show their focus ring. A later elevation `box-shadow` rule overrode it, so keyboard focus drew nothing (#197)
- `DataTable`: toolbar actions render inside the table's theme. They sat outside its `ConfigProvider`, so an antd `Button` there (Export) hovered in antd blue `#4096FF` (#197)
- `<aha-button>` fades its label with the fill, border and shadow: `color` and `text-decoration-color` join the one transition (`--aha-motion-mid`, `--aha-ease-in-out`), so the label no longer snaps on hover or press. `<aha-image-action-button>` also fades its fill with its border and label. A unit test fails if a button state rule changes a property that is not in the transition list, or if the properties use different timings (#197)
- The colour rules page (`brand/visual-identity-colour-rules.html`, v9) adds the illustration tints, lets illustrations use Darker Pink, says our own illustrations, customer and integration logos and file-type icons are not exempt, and writes black as `#1A1A1A` (#197)
- `<aha-answer-option>` keeps its keyboard focus ring (2px, offset 2px, the row ink) after the audience-lab merge dropped it; the default browser outline was 1.09:1 on the neutral dark deck (#197)

## 0.141.0 — 2026-10-09
### Added
- CSAT: opt-in `tooltip-placement="top|bottom"` attribute for the Good / Not good / Feedback tooltips. Default `top` is unchanged; `bottom` opens them below the buttons so they do not cover a title above the CSAT in a card. Any other value falls back to `top`; the feedback popover placement is unchanged (#213)

## 0.140.0 — 2026-10-09
### Changed
- Background task: a file task's 24px leading icon is now its file-type glyph (`<aha-icon slot="icon" name="system-file-ppt|xls|pdf|csv|doc|image|…" size="24" decorative>`, default icon colour, `system-file` as fallback) instead of a Logo-library brand logo. Contract, snippets and previews updated; API unchanged (#210)
- Background task: the inline `link` slot (Retry, Réessayer, …) follows the Button `link` variant: `--aha-text-link` at weight 400 with no underline at rest; on hover `--aha-text-link-hover` and an underline. It was weight 600 and always underlined. Focus ring and inline wrapping unchanged (#210)

## 0.139.1 — 2026-10-09
### Fixed
- The dismiss ✕ (tertiary icon-only size xs Button) is back to the previous close-button colours: muted #8A8A8A glyph at rest, hover turns it #1A1A1A on a #F7F7F7 fill over 100ms, no purple hover or press. Other tertiary buttons keep the purple hover; the focus ring is unchanged (#212)

## 0.139.0 — 2026-10-09
### Added
- Button: size `xs` for icon-only (20 × 20 hit area, radius 6) and a `corner` attribute that pins it to the first line of its flex row, 2px into the container's end padding. The dismiss ✕ is now documented here as a variant of the tertiary icon-only button (a "Close" section on the Button page) (#211)

### Changed
- The dismiss ✕ follows the tertiary Button: glyph #1A1A1A at rest (was muted #8A8A8A); hover fills #F9F5FF with the primary #6A1EBB glyph and press #F0E4FF (was #F7F7F7 fill, #1A1A1A glyph); focus is the soft Button ring. Size, radius, first-line pinning and the corner position are unchanged (#211)
- Alert, Info box, Background task, CSAT follow-up, Uploader, and Toast, Notification, Modal and Drawer (through `closeButtonRow`) render `<aha-button variant="tertiary" icon-only size="xs" corner>` directly. `::part(close)`, `::part(dismiss)` and `::part(remove)` now target the `<aha-button>` host (#211)
- Guidelines, contracts and the feedback anti-slop criterion C6 describe the ✕ as the tertiary icon-only button (#211)

### Removed
- The standalone "Close button" docs page and nav entry. `<aha-close-button>` stays as a deprecated alias that renders the xs tertiary icon-only button; `AhaCloseButton` and `defineAhaCloseButton` still resolve (#211)

## 0.133.0 — 2026-10-08
### Added
- Icon: 36 file glyphs from Phosphor Icons Regular (MIT) — `system-file-pdf`, `system-file-c-sharp`, `system-file-zip` and the rest of the `file-*` set — on the DS 16px grid with the 1.5 stroke, matching `system-file-xls`. Registry is now 304 glyphs. Licence and name list in `icons/svg/system/PHOSPHOR-CREDITS.md` (#208)

## 0.130.0 — 2026-10-08
### Changed
- Settings spacing: sibling settings sit 24px apart (was 16) in `aha-setting-group`, `aha-sub-setting-group` and `aha-settings-list`; a sub-setting group sits 16px below its parent (was 8) with the same 24px indent. Rule SETTINGS-13, criterion C5 and the sub-setting conformance probe follow (#192)
- Settings labels: a setting label is regular 400 in primary text; a label inside a sub-setting group is regular 400 in secondary text, set through `--aha-setting-label-color` on `aha-settings-item`, `aha-setting-row` and `aha-mode-field`. Stale "semibold row label" text removed from contracts (#192)
- Group header: no toggle, switch, input, select or button in the `aha-setting-group` / `aha-section-header` action slot, plain text such as a count only; the section-header demos and snippets no longer show a master switch. A group title is only for a real group of two or more settings (#192)
- Icons: criterion C2, the icon contract and the agent skill say a glyph may be drawn only when the library has no suitable icon, with strokes 12px 1, 16px 1.5, 24px 2, 32px 2.5 (#192)
- Settings list: the standing consequence line is documented and demoed as an opt-in variant, not the default (#192)
### Added
- Anti-slop criteria C16 (group title and header controls) and C17 (setting label weight and colour, sibling gap) on the settings surface (#192)

## 0.129.0 — 2026-10-08
### Changed
- Colour rules guideline (`brand/visual-identity-colour-rules.html`) is now v9: illustrations use Vivid Pink tints plus Darker Pink, white, ink and grey; our own illustrations, customer and integration logos and file-type icons follow the rules; black is `#1A1A1A` (#207)

## 0.121.0 — 2026-10-08
### Changed
- `<aha-csat>`: rating no longer collapses — both thumbs stay visible, the chosen one shows the active state (`aria-pressed` synced); clicking the other thumb switches the rating and fires `rate`, clicking the chosen thumb again un-rates (#206)
- `<aha-csat>`: feedback textarea allows 2000 characters (was 200). Opened from the Feedback button it defaults to "Share your thoughts"; thumbs-down keeps "How can we improve? Let us know!" (#206)
- `<aha-csat>`: the thumb and Feedback buttons sit 2px apart (was 4px) (#206)

## 0.119.1 — 2026-10-08
### Changed
- `<aha-answer-list>` / `<aha-answer-option>` follow the audience lab where the review chose it: rows are 48px tall (was 44), the list has a 16px margin above and below, radio and checkbox borders are 1px (ink at 20% unchecked, the deck accent checked) instead of 2px grey, the checked radio dot is 12px (was 10), the label is weight 400 and 600 only on my pick (was 600 everywhere), and keyboard focus shows the browser default ring instead of the 2px ink outline (#205)
- A wrong pick on a revealed row now carries a 2px error-colour ring (lab parity); the revealed-row muting, edge colours and dark-deck surface are unchanged
- `<aha-rank-list>` follows the audience lab with the closest DS token: rows 56px tall with 4/16 padding, 16px margin above and below the list, ordinal badge 28px with a 14px numeral, label weight 400, option thumbnail 44px with an 8px radius, 4px gap in the controls cluster, 16px move carets in the deck ink, a 24 × 32 drag grip
- `<aha-audience-field>` label is weight 400 with 8px between label and field (was 600 and 16px); `<aha-counted-input>` and `<aha-counted-textarea>` at `size="touch"` show the characters left instead of used/max, the counter line is 12px, the touch textarea counter has no white chip and its bottom gutter is 16px, and the textarea measures its lines from the real line height (3 rows are 114px, was 111). Other sizes are unchanged
- Contract spec, conformance expectations and token lists for these components match the new values

## 0.119.0 — 2026-10-08
### Added
- Per-surface CDN entries next to `lib/all.js`: `lib/audience.js` (26 elements, also exports `applyDeck`), `lib/settings.js` (63) and `lib/canvas.js` (7). One `<script type="module">` registers just the elements that surface uses, including shared controls such as `<aha-button>`; also exported as `@ahaslides-product/design/audience`, `/settings`, `/canvas`. `lib/all.js` is unchanged
- The entries are generated from `guidelines/<surface>.json` (`composedOf` plus a new `entryExtras` list), and `generate.mjs` fails when an element module belongs to no surface, so a new element is classified once
- `tests/surface-entry.test.mjs`: every element is in a surface entry, and each entry loads without error in a no-build page (headless Chrome)
### Changed
- The Audience, Settings and guideline pages, `llms.txt`, the README and the audience library snippets show the per-surface CDN link pinned to the release tag (#204)

## 0.118.0 — 2026-10-08
### Added
- Foundations → Brand colour rules (`foundations/brand-colour-rules.html`): the AhaSlides visual identity colour rules (palette, backgrounds, splash layouts, buttons and text, status, charts) served from the docs site at a permanent address, linked from the Foundations sidebar, cross-linked with the Colour token reference, and listed in `llms.txt`. Page content is published as written; tokens and components are unchanged and do not follow these rules yet (#203)

## 0.117.0 — 2026-10-08
### Added
- `<aha-tag controlled>`: for a checkable tag whose host owns the state. A click only emits `change` ({ checked } is the requested state) and the host sets or removes `checked`, so a framework binding (Vue `:checked`) no longer double-toggles. Without `controlled` the tag still flips its own `checked` (#201)
### Changed
- `<aha-tag checkable size="large">` (the filter chip): rest is `--aha-gray-15` fill, `--aha-border-input` border and `--aha-text-default` label; checked is `--aha-purple-15` fill with `--aha-purple-70` border and label. Height stays 36px (#201)
- `<aha-tag>` default height 24px to 20px (gap 4px and padding 0 6px unchanged) (#201)
- `<aha-rate>`: the filled star is `--aha-pink-60` (was `--aha-yellow-50`) and uses the old kit's rounded star glyph; empty stars, half fill and `precision="exact"` are unchanged (#201)

## 0.116.0 — 2026-10-08
### Removed
- Marketing pattern Section container (`marketing/section-container.json`) and its generated page, so Patterns → Marketing sections lists Hero only; layout rules (inner width, section spacing, breakpoints) belong to each consuming app (#202)

## 0.114.1 — 2026-10-08
### Fixed
- The Pages workflow caps the staging build at 15 minutes and the staging trigger at 5, so a hung staging branch cannot hold the production deploy queue (#200)

## 0.114.0 — 2026-10-08
### Added
- A staging copy of the docs site at `/staging/`: every Pages deploy also builds the `staging` branch into `dist/staging/`, so a pending change can be reviewed on a real web link before it merges. Staging pages are `noindex`, their live demos run from the staging build's own `lib/`, and their HTML-tab snippets pin `@staging` on jsDelivr instead of a release tag. Production at `/` is unchanged (#199)

## 0.113.0 — 2026-10-08
### Added
- `<aha-tag size="large">`: the 36px checkable filter chip (14px regular text, 12px padding, 8px radius) (#198)
- `<aha-tag color="branding">`: the pink "New" label, pale pink fill with black text and a Vivid Pink border (#198)
- `<aha-rate size="sm">` draws 16px stars with a 2px gap, and `<aha-rate readonly precision="exact">` fills the last star by the exact fraction, so 4.8 shows 80% of the fifth star (#198)
- `<aha-empty image="none">`: a text-only empty state with no illustration (#198)
- Icon `system-funnel-2`: a real funnel (16px, stroke `currentColor`); `system-funnel` is unchanged (#198)
### Changed
- `<aha-tag>` default label is now 24px high with 6px side padding and a 4px gap (was 22px, 8px, 6px) (#198)
- `<aha-input clearable>`: the clear control is a tertiary icon-only `<aha-button>` with a 16px `system-x-circle` (it was a bare 14px `system-x`); it is now a keyboard tab stop (#198)
- `<aha-collapse ghost>`: the header has no side padding, so its label lines up with the body (`icon-position="end"` already moves the caret after the label) (#198)
- `<aha-empty>` caption uses the default body type (`--aha-size-default`, `--aha-line-height-body`) in every image mode; `image="simple"` was 13/20 (#198)
### Fixed
- `<aha-rate>`: a value of exactly x.5 (for example 4.5) now fills half a star; it showed the star empty (#198)

## 0.111.0 — 2026-10-07
### Changed
- Every docs page's HTML tab (and `llms.txt`, the agent feeds and the "No build step?" block) now imports from the release tag that built it, `cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v<version>/lib/…`, instead of `@master`. A snippet pasted into a no-build page (a Developer Platform slide type, a vibe-coded deck) therefore never changes under that page; take a newer release by changing the tag. `AHA_CDN_REF=master` still previews unreleased element code locally (#191)
- The Audience Library's code tabs take the same pinned ref (they hard-coded `@master`), and the Pages deploy now waits, for up to 15 minutes, until `publish.yml` has created the `v<version>` tag its snippets point at, so a freshly deployed page never links a tag that does not exist yet (#191)

## 0.110.0 — 2026-10-07
### Added
- Audience library as framework-free elements for build-less slide types (Developer Platform iframes), each loaded by URL from `lib/all.js` with `tokens.css`: `<aha-answer-list>`, `<aha-answer-option>`, `<aha-rank-list>`, `<aha-audience-field>`, `<aha-countdown>`, `<aha-scale-slider>`, `<aha-audience-chip>`, `<aha-audience-image-upload>`, `<aha-audience-submit>`, `<aha-instruction-line>`, `<aha-waiting-for-host>`, `<aha-submitted-card>`, `<aha-identity-strip>` and `<aha-swipe-card>` (#194)
- `audience-deck` module: `applyDeck(root, xprops.slide)` gives every audience element the deck ink, accent and primary-button fill; `submissionLock(key)` backs the `lock-key` attribute, so a submitted answer stays locked across an iframe remount (#194)
- `<aha-button size="touch">`: the 48px audience-phone primary action (#194)
- `<aha-counted-input type="number">`, and `aria-label` forwarding on `<aha-input>`, `<aha-counted-input>`, `<aha-counted-textarea>` and `<aha-select>` (#194)
- `size="touch"` on `<aha-counted-input>`, `<aha-counted-textarea>` and `<aha-select>`: the 56px audience phone field with 16px text (#194)
- `--aha-deck-ink-muted` (the deck ink at 65%) for secondary audience copy, and a `hint` line on `<aha-swipe-card>` (#194)
### Changed
- One audience border rule on both decks: every audience border is 1px at the deck ink 10% (`--aha-deck-edge`, no 20% slider edge, no 1.5px chip, no 2px drop zone; the drop zone stays dashed), and the scale-slider rail and countdown track share one ink-10% fill (`--_track`, the countdown was 15%); the audience guideline and its criteria state the same rule and drop the slider-fill-hairline 20% split (#194)
- Audience Library page: every section names the element to use, its demos are the real elements on a light and a dark deck with the same content as before, and its HTML tab runs as pasted (#194)
- The audience elements match the Audience page's demos: 44px answer and rank rows, a 1px ink ring on my pick, the correct row ringed on reveal, solid accent chips, a check-circle submitted card, a centred swipe card, the slider value above the thumb, an m:ss clock (#194)

## 0.109.0 — 2026-10-07
### Changed
- Section container: the section sequence rule replaces "soft and dark variants alternate". Coloured bands (soft or primary) never sit next to each other, a full white section always sits between them, at most two primary-colour bands per page, and the first band (hero) is white; the demo now shows a white section between the soft and dark bands (#196)

## 0.106.2 — 2026-10-07
### Fixed
- CSAT: the thumbs and Feedback buttons sit 4px apart, so a selected or hovered background no longer touches its neighbour (#195)

## 0.106.1 — 2026-10-07
### Fixed
- CSAT: the thumbs and Feedback buttons are 28×28, the DS small icon button size (were 28×24), so the row is 28px high (#193)

## 0.103.1 — 2026-10-07
### Fixed
- Status icon: the usage note no longer says every state has its own glyph; not-started and completed share `system-check-circle` and differ by colour, so the accessible name carries the state (#190)

## 0.103.0 — 2026-10-07
### Added
- Icon: `system-circle-dashed`, the Phosphor CircleDashed (regular) glyph on the 16px stroke grid like the other system glyphs, for an in-progress state (#189)
- Status icon: new `<aha-status-icon status="not-started | in-progress | completed" size="12 | 16 | 24 | 32">`, a progress glyph for a lesson, task or step built on `<aha-icon>` with token colours (grey, primary, success) and an accessible name (`label`) that defaults to the state (#189)
## 0.102.2 — 2026-10-07
### Changed
- Every release now opens or refreshes one bump PR per consumer app (aha-report, aha-management-app, aha-elearning, stpancras-presenter-app) on a fixed `ds/auto-bump` branch against `staging`: exact version pin, lockfile regenerated with the app's own package manager, and the CHANGELOG entries since the app's current version in the PR body. Never auto-merged; each app's team merges. The list lives in `.github/ds-consumers.json`. Needs the `DS_BUMP_TOKEN` org/repo secret; without it the job warns and the release still succeeds (#188)

## 0.102.1 — 2026-10-07
### Fixed
- Popover: a closed panel is now `display:none` (the exit fade still plays, via a discrete `display` transition), so it no longer leaves an invisible box that scrolling ancestors count as overflow. It removes the empty space under CSAT's feedback button inside a scroll container (about 180px in the presenter editor's Content panel); open, `flip`, top layer and the fade are unchanged (#186)
## 0.102.0 — 2026-10-07
### Removed
- **Breaking (pre-1.0):** CSAT: the `thanks` attribute (the in-place thank-you line, its `thanks` part and `data-done` flag) is gone; the product has no such case. Migrate by showing the shared toast "Thank you for your feedback!" from the `feedback` event. The no-op `inline` attribute is no longer mentioned in the docs (#187)

## 0.100.4 — 2026-10-07
### Fixed
- Tooltip: the hint no longer sticks after a mouse click or a touch tap. It shows on mouse hover or keyboard focus only, so clicking a trigger hides it, CSAT's thumb no longer brings the hint back when the feedback popover closes, and a tap on touch no longer leaves it open. `trigger="focus"` still shows on any focus and `trigger="click"` is unchanged. (#183)

## 0.100.1 — 2026-10-07
### Fixed
- Background task: the `link` slot ("Retry") now flows inline with the description and wraps with it like a word, instead of sitting as a separate column beside a wrapped line (seen in French). It stays underlined in the DS link colour at rest. The examples cover French, German, Vietnamese and Russian. (#180)

## 0.100.0 — 2026-10-07
### Changed
- Close button: `<aha-close-button>` is back to the old Info box ✕ — a native 20 × 20 button (radius 6) with the 14px `system-x` in #8A8A8A, #1A1A1A on `--aha-bg-hover` over 100ms, top-pinned with its centre 2.5px above the first line's centre and 2px into the end padding (Info box: 15px from the right, 11px from the top). It no longer wraps a tertiary `<aha-button>`: `::part(button)` is now the native button and shrinks from 28 × 28 to 20 × 20. Alert, Info box, Background task, Toast, Notification, Modal and Drawer follow (#178)
- Every other ✕ takes the same spec: CSAT follow-up and Uploader remove now render `<aha-close-button>`; Input clear is the 14px `system-x` (was `system-x-circle`) in a 20 × 20 hit area; Image preview close is now the white 20 × 20 radius-6 square in the image's top-right corner (no more 32px disc), Tag remove takes the muted colour and hover; the Uploader row ✕ is centred on its row. The rule now says a ✕ is never circular. `closeButtonRow` no longer needs `containerPadding` (#178)
- Guidance: close-button contract, `one-dismiss-button` rule, anti-slop feedback C6 and its eval cases describe the new spec; the Button docs' icon-only example is a gear, not a ✕ (#178)

## 0.99.1 — 2026-10-07
### Fixed
- CSAT: a long rating question (e.g. a French translation) wraps onto a second line with the thumbs kept beside it, instead of running past the edge of its container. The background-task examples show the French case. (#179)

## 0.99.0 — 2026-10-07
### Changed
- CSAT: the thumbs' default tooltips are now Good / Not good (were Useful / Not useful), and each thumb's accessible name follows its tooltip, including a custom `like-label` / `dislike-label`. (#177)

## 0.98.5 — 2026-10-07
### Changed
- Logo library: the PDF icon is now the Design System V3 Figma export (red document with white Acrobat glyph) instead of the thesvg.org one (#176)

## 0.98.4 — 2026-10-07
### Changed
- `<aha-background-task>` file name (heading) is now 14px with a 1.5 line-height, the DS body size, instead of 12.5px; the leading icon and ✕ stay aligned (#175)

## 0.98.3 — 2026-10-07
### Fixed
- `<aha-background-task>` offline (frozen) bar is now neutral grey (track #F1F1F1, fill #B5B5B5) instead of lavender (#174)
- Cancelled-card previews now carry the PowerPoint logo like every other card, and no longer claim an invented failure reason (#174)

## 0.98.1 — 2026-10-02
### Changed
- Settings guidance, judge criterion C13 and evals now forbid restyling or replacing the NumberedItem number chip (#144)

## 0.98.0 — 2026-10-06
### Added
- `<aha-close-button>` (`@ahaslides-product/design/aha-close-button`): the one dismiss ✕ for Alert, Info box, Background task, Toast, Notification, Modal and Drawer. It is the tertiary button at small size (28 × 28) with the 16px `system-x` icon, sits 8px from the container's edge, and lines up with the first line of text and the leading icon, so it stays put when the text wraps. Modal and Drawer take it through dismissibleModalTitle / dismissibleDrawerTitle with `closable={false}`. Feedback guideline rule `one-dismiss-button`, judged by the new feedback anti-slop criterion C6. (#168)
- `dismissibleToast` (toast-theme) and `dismissibleTitle` (notification-theme) put the shared ✕ into antd's message and notification; `dismissibleModalTitle` (modal-theme) and `dismissibleDrawerTitle` (drawer-theme) put it into Modal and Drawer, which move from antd's own ✕ to the same 28 × 28 tertiary button, 8px from the edge. Pass `closable: false` (`closable={false}` on Modal and Drawer) so antd's own close is not drawn. (#168)
### Changed
- Alert `closable`, Info box `dismissible` and Background task now render `<aha-close-button>`: the Alert and Info box ✕ grows from a bare 16px or 20px glyph to the 28px tertiary button and turns brand on hover. Alert builds its shadow DOM once and updates it in place. `::part(close)` (Alert) and `::part(dismiss)` (Info box, Background task) now target the `<aha-close-button>` host, not a native button, so restyle overrides written against the old glyph button need checking. (#168)
- Docs: navigation and reading labels (sidebar groups, playground rows, API table headers, "On this page", settings and token group headings) are sentence case at 14px semibold instead of 11px grey capitals; only chips and badges stay in capitals. Component groups read "Data entry" and "Data display". (#168)
- Docs: the 148 example titles that listed variants with dots ("Sizes · small 24 · default 32…") are now short group titles ("Sizes"). (#168)

## 0.97.0 — 2026-10-06
### Changed
- Every logo use now points to the Foundations Logo library: one rule in AGENTS.md, PRINCIPLES.md, llms.txt, the `aha-design` skill and the app-shell anti-slop criterion C1 (#167)
- The docs header Splash is read from `logo/thesplash.svg` at build time, so it cannot drift from the library (#167)

## 0.96.0 — 2026-10-06
### Added
- Logo library → Brands: **Microsoft Word** and **PDF** (Adobe file-type mark) in the "Import, export and cloud" section, ordered Excel, Word, PDF, Google Drive, OneDrive. Both are the current default SVG from thesvg.org (`microsoft-word`, `pdf`); the Brands tab and its highlight now count 21 brands. `llms.txt` lists them. (#166)

## 0.95.0 — 2026-10-06
### Fixed
- Popover with `flip` (and so the `<aha-csat>` feedback popover) now opens in the browser top layer through the native Popover API (`popover="manual"`), so an `overflow`, `transform`, `filter` or `contain: paint` ancestor can no longer crop it and a sidebar or toast with a higher `z-index` can no longer cover it. Placement, flip, the 8px viewport clamp, the arrow, Esc and outside-click close, focus return and `aria-expanded` are unchanged; the panel still fades in and out. Browsers without the Popover API keep the previous fixed positioning. Popovers without `flip` are untouched. (#172)

## 0.94.1 — 2026-10-06
### Fixed
- Background task: the failed state keeps the task's leading `slot="icon"` (the file's Logo-library logo, or the default file glyph) instead of swapping it for the red x-circle; the dead status glyph markup and CSS are removed. The heading stays neutral, so failure is carried by the heading text and the Try again button. The failed description is short and names the object ("Couldn’t import your file."), with no "Please try again.". (#171)

## 0.94.0 — 2026-10-06
### Changed
- Background task: a file task's leading `slot="icon"` is now the file's brand logo from the Logo library (`logo/microsoft-powerpoint.svg`, `microsoft-excel.svg`, `pdf.svg`) as a 24px `<img>`, not an `<aha-icon>` glyph; the examples, snippets and contract say so. Cancelled and connection-lost cards keep the logo of the file they were importing; only the error state swaps to the x-circle glyph. The success check-circle drops from 16 to 12. Needs #166 (PDF logo) merged first. (#170)

## 0.93.0 — 2026-10-06
### Added
- Background task takes the refined export design, generalised to any process: the heading is the file name with its extension ("Quarterly review.pdf"), a `link` slot that ends the description for an inline action ("Download didn't start? Retry"), and `no-percentage` for a process with no real percentage (the bar eases towards 90%, `value` ignored). New `<aha-background-task-stack>` is the fixed bottom-right column (320 wide, 8px gap) for several processes, newest on top, one card each. (#169)
### Changed
- Background task: the leading icon is centred on heading and description together; the finished card's rating sits 12px under the description, spanning the card under a divider. The error recovery button is secondary ("Try again") in the examples. Once the bar is gone (success, cancelled, error) a `caption` moves up to the description line, so "40/40 slides imported" sits where "Download didn't start?" does. Existing attributes and events are unchanged.

## 0.90.0 — 2026-10-06
### Added
- Foundations → Logo library page (`foundations/logo.html`) with two tabs: **AhaSlides** (the logo, The Splash, and their white and black variants) and **Brands** (19 third-party logos scanned from what the presenter app renders: Google Slides, PowerPoint, Teams, Zoom, Excel, Google Drive, OneDrive, Google, Microsoft, PayPal, Stripe, ChatGPT, YouTube, Facebook, Instagram, LinkedIn, X, Reddit, Medium). Each brand is the current full-colour SVG fetched from thesvg.org; `logo/manifest.json` records source URL, fetch date and where the presenter app shows it. Search, copy-name and download; tiles work with Enter and Space, and a repeat click while "copied!" is showing no longer replaces the tile name. Logos sit on uniform square tiles and are chunked into labelled sections (Sign-in, Integrations, Import, export and cloud, Payments, Community and social; Logo and The Splash) from each manifest entry's `section`; search hides empty sections. SVGs ship in `logo/` and are served at `/logo/`. Listed in `llms.txt`. (#164)

## 0.89.0 — 2026-10-06
### Added
- Contracts, guidelines and marketing sections gain a `highlights` field (1–4 short bullets), rendered under the docs page title; `standards.mjs` requires it on contracts and guidelines (marketing sections are not gated). `summary` is unchanged, so the agent feeds (llms.txt, `*.md`, `*.agent.json`) read exactly as before. (#165)

### Changed
- Docs pages drop the small breadcrumb label above the H1 and show the passage under the title as a short bullet list (`highlights`) instead of one long paragraph. Applies to every component, pattern, guideline, marketing, foundations, feed, icon, settings and index page. (#165)

## 0.87.3 — 2026-10-06
### Fixed
- `<aha-background-task>`: the ✕ now sits on the leading icon's row (top-aligned, 2px optical offset for its 28px box) instead of drifting to the vertical centre of wrapped descriptions. (#163)

## 0.87.2 — 2026-10-06
### Fixed
- `<aha-background-task>` HTML example no longer auto-removes a finished card after 2s, and the JSDoc usage shows Cancel as a tertiary `<aha-button>` instead of a span. (#162)

## 0.87.1 — 2026-10-06
### Fixed
- `<aha-background-task>` contract, JSDoc and HTML example no longer describe the removed Cancel link, red error styling or 2s auto-dismiss. (#161)

## 0.87.0 — 2026-10-06
### Added
- `<aha-background-task>`: `rating-prompt` / `rating-source` attributes; the success state now always shows the DS `<aha-csat>` by default (a `footer` slot still overrides it). (#160)
### Changed
- Cancel is the DS tertiary `<aha-button size="sm">`, not a text link; the cancel-confirmation and connection-lost buttons are small and sit inside the card. (#160)
- Error state follows the DS feedback rules: `--aha-color-error` x-circle glyph, neutral title, no red border; docs add a Try again action. (#160)
### Fixed
- Cancelled / terminal cards no longer carry a dead gap under the heading; footer spacing on DS space tokens. (#160)

## 0.86.1 — 2026-10-06
### Fixed
- **Docs examples sit flush with the page, without a frame.** The bordered, rounded box and the side padding around each component's examples are gone, so group titles and previews align with the "Examples" heading. Card shadows are no longer clipped, the playground control bar is a rounded grey band of its own, and the "Show code" toolbar keeps its dashed divider. (#157)

## 0.86.0 — 2026-10-06
### Fixed
- **`<aha-popover flip>` no longer opens off-screen.** Builds on the 0.85.0 vertical flip. With `flip` it now measures on open and flips to the roomier side (top/bottom, left/right) when the requested side does not fit, clamps 8px inside the viewport edges, and re-measures on resize, scroll and panel resize while open. It is positioned with `position: fixed`, so an `overflow: hidden/auto` ancestor (side panel, scroll container) no longer clips it; the arrow follows the flip and the trigger. A `transform`/`filter`/`contain: paint` ancestor still clips (and is compensated for offset). The host reports a flipped side as `flipped` plus `data-flipped` (the side).
- **`<aha-csat>`'s feedback popover is always fully visible** — thumbs-down and the Feedback button both open above the thumbs when the CSAT sits at the bottom of the screen, via the popover fix above. The X close button is verified a rounded square (6px radius) at rest, hover, focus and press. (#159)

## 0.85.0 — 2026-10-06
### Changed
- **`<aha-csat>` now mimics the presenter's inline CSAT (`InlineCSATV2`).** Once rated, only the chosen thumb remains; clicking it again un-rates (both thumbs return, `value` is removed, `rate` fires with `rating: null`). The selected thumb uses the antd tertiary active look (fill #F0E4FF, icon #6A1EBB) and hover icons are purple-50. The feedback popover focuses its textarea on open, defaults to "How can we improve? Let us know!", and after Send does not re-open on thumbs-down until the rating changes again. Default tooltips are now "Useful" / "Not useful". (#155)
- **The feedback popover's X hover is a rounded square** (6px radius, like the info-box dismiss), no longer a circle.
- **The CSAT docs preview shows only the Feedback-button example.** The unrated / rated / thank-you row and the separate thumbs-down popover demo are gone; the State bar drives the one remaining example.
### Added
- **`<aha-popover>` gains an opt-in `flip` attribute, and `<aha-csat>` uses it.** When the preferred side has no room (viewport or nearest scrolling ancestor), the panel opens on the opposite side, arrow included, so the CSAT feedback text box (from the thumbs-down or the Feedback button) is never cut off at the bottom of the screen. Evaluated on every open; default behaviour is unchanged for other popovers.
- **The opt-in `feedback-button` now sits right beside the thumbs and stays visible after rating**, opening the popover without rating. `feedback-button-placeholder` falls back to `feedback-placeholder`.

## 0.84.0 — 2026-10-06
### Added
- **Donut, pie and tree map say "No responses yet" when there is no data.** One short text, centred in the plot, in the chart's own ink (legible on a dark deck). The donut centre count is hidden meanwhile, so only one text shows. It is not announced twice (the summary already says it) and goes away on the first response. Vietnamese copy included. Every other chart type is unchanged. The Chart docs gain a 0-response case for tree map. (#158)

## 0.82.1 — 2026-10-06
### Fixed
- **Docs preview group titles are readable and separated.** The `.lbl` headings above each group of examples were 11px grey uppercase and ran into one another. They are now sentence-case body-size semibold in secondary text colour, and every group after the first gets a top divider and spacing. `<aha-background-task>` preview titles are short ("In progress", "Cancel confirmation", "Finished", "Connection lost and error") instead of positional dot lists. (#156)

## 0.82.0 — 2026-10-05
### Changed
- **`<aha-progress-toast>` renamed `<aha-background-task>` and moved from Components to Patterns.** It is the pattern for any long-running process (import, export, upload, duplicate), with the presenter's Import as the reference implementation, not a general component, and it differs from Toast (a one-line confirmation). Element, entry (`@ahaslides-product/design/aha-background-task`), contract and docs page are now `background-task`; the page lives under Patterns · AhaSlides surfaces. The class is `AhaBackgroundTask` / `defineAhaBackgroundTask`; the API is unchanged. The `--aha-toast-*` CSS custom properties are unchanged. (#153)
### Deprecated
- `<aha-progress-toast>` (0.81.0) stays registered as an alias of the same element and its entry still resolves; migrate to `<aha-background-task>`. The old `progress-toast/` docs page is removed.

## 0.81.0 — 2026-10-05
### Added
- **`<aha-progress-toast>` (Feedback).** The presenter's Import notification as a shared primitive, matched 1:1 to `ImportProgressNotification.vue`: fixed bottom-right card (right 24, bottom 88), file icon, name, 5px bar with moving stripes, caption + Cancel link, and `progress` / `success` / `canceled` / `offline` / `error` states with a ✕ on success, canceled and error. `icon`, `action` and `footer` slots take the file-type icon, the Cancel link and the cancel confirmation, connection-lost buttons or the `<aha-csat>` completion rating. Values with no DS token are kept as built. Pure view: the consumer owns the task, copy and auto-dismiss. (#152)

## 0.80.1 — 2026-10-05
### Fixed
- **The agent plugin no longer ships Python bytecode.** `agent/hooks/__pycache__/*.pyc` committed in 0.80.0 is removed, and `__pycache__/` and `*.pyc` are now ignored; `npm test` fails if bytecode is tracked under `agent/` again. (#151)

## 0.80.0 — 2026-10-05
### Added
- **The DS ships its own Claude Code plugin.** This repo is now a plugin marketplace: `/plugin marketplace add AhaSlides-Product/ahaslides-design`, then enable `ahaslides-design@ahaslides-design`. The plugin (`agent/`) carries the `aha-design` skill and its hooks (prompt mandate, design guard incl. the Vue 2 new-file rule and storybook-kit block, end-of-turn judge, anti-slop floor), versioned with each release. Hooks read criteria from the installed package, else the plugin's own copy of `anti-slop/criteria.json` from the same release; no network. It replaces `aha-design` in `aha-claude-plugins` after a short overlap; enable one of the two. Setup is in the README, "Agent plugin". (#150)
- `standards.mjs` fails when `agent/.claude-plugin/plugin.json`'s version differs from `package.json` or the plugin's criteria copy differs from the store; `npm test` runs the hook suites. (#150)
### Fixed
- **`tokens.css` and element registrations survive tree-shaking.** `sideEffects` now covers every CSS file (`*.css`), `lib/all.js` and `lib/aha-loader.js`, so a webpack / vue-cli build no longer drops `import '@ahaslides-product/design/tokens.css'`. `standards.mjs` fails when an exported CSS file or a custom-element registration is missing from `sideEffects`. (#150)

## 0.79.1 — 2026-10-05
### Fixed
- **`@ahaslides-product/design/screen-lint` now resolves to `lintHtml`.** A duplicate `./screen-lint` key in `exports` (pointing at the CLI file) shadowed the new entry in 0.79.0; the CLI file stays importable as `./screen-lint.mjs`. A test now imports the documented path through the package name. (#149)
- **`ds-lint-allow` names exact rules.** Naming `raw-hex` no longer also silences `canvas-hardcoded-colour`; only the short group names (`hex`, `responsive`) cover more than one rule. (#149)

## 0.79.0 — 2026-10-05
### Added
- **`lintHtml(source, { surface, path? })`** — `screen-lint` as a pure importable function (`@ahaslides-product/design/screen-lint`): no fs, no process, no console, runs in Node and Cloudflare workerd, icon names bundled (`lib/icon-names.js`). Returns `{ findings: [{ rule, line, message, severity }] }`. The CLI is built on it and keeps its output and exit codes. (#148)
- **Unit tests** for `lintHtml` (`tests/screen-lint.test.mjs`, `npm run test`), run in CI and `npm run check`. (#148)
### Changed
- **`ds-lint-allow` is now per rule with a reason**: `ds-lint-allow: <rule-id>[,<rule-id>] (<reason>)` silences only the named rules on that line. A bare `ds-lint-allow` no longer suppresses anything and is reported as a `ds-lint-allow-bare` warning (never a hard fail), so existing screens can migrate. (#148)

## 0.78.0 — 2026-10-05
### Added
- **`<aha-stepper>`** — framework-free stepper (`stepper` page): numbered markers, a check on finished stages, the current stage marked with ink (outline + semibold, `aria-current="step"`), never the primary accent. `size="lg"` for a slide canvas, `navigable` for clickable stages, colours follow `currentColor` so it tracks the deck ink. (#147)
- **`<aha-autocomplete>`** — framework-free autocomplete (`autocomplete-field` page) on the `<aha-select>` chrome: ARIA 1.2 combobox with a list popup, filter-as-you-type with the match in bold, Arrow / Alt+Arrow / Enter / Escape keyboard model, free text allowed, `input` and `change` events. (#147)
- **Icons `system-sad-face` and `system-angry-face`** — on the 16px grid in the `system-smiley` style, for mood labels such as Sad and Mad. (#147)
- **Guide: "Using the design system in Vue 2"** (`guidelines/vue2`) — new UI in the presenter, audience and admin apps uses `<aha-*>`, never the `stpancras-storybook-app` kit; existing screens stay unless a task asks to migrate. Covers loading `all.js` + `tokens.css` once pinned to a tag, `Vue.config.ignoredElements`, `.prop` bindings and `CustomEvent` detail, with a worked example. (#147)
- **Judge criteria + eval cases**: canvas C23 and audience C35 (stage indicators and type-to-pick fields are `<aha-stepper>` / `<aha-autocomplete>`, current stage in ink), icons C7 (a glyph matches its word); the canvas and audience guidelines and guides now name both elements. (#147)

## 0.77.0 — 2026-10-05
### Added
- **`<aha-button size="xl">`** — 52px tall, 28px padding, 12px radius, 16px label (the web-component twin of React `<XLButtonScope>`), for presenter controls drawn inside a slide canvas and read from across the room. Size only through the attribute; never `::part(button)` height, padding or font-size. (#146)
- **Slide-canvas and audience rules that used to live only in the retired `aha-design-*` skills**, now in `guidelines/canvas.json`, `guidelines/audience.json`, the two guides and `llms.txt`: one accent per deck (`presentationColorPalette[0]` on `--aha-color-primary` at `:root`, same on canvas, audience and buttons; only label ink by contrast; semantic colours never as data colours); no slide-wide scrim on a framed photo deck; 1px neutral card hairline and 1.5px chip border; one dark ink `#1A1A1A`; motion tokens on persistent nodes. (#146)
- **Judge criteria + eval cases** for those rules: canvas C17–C22 and audience C31–C34 in `anti-slop/criteria.json`, with bad and good cases in both eval sets. (#146)
### Changed
- **Presenter controls on the Developer Platform render in-canvas.** Canvas C3/C4 and the guide now scope the host control bar to built plugins that declare manifest actions; build-less slide types render an in-canvas `<aha-button size="xl">` row. (#146)
- **Radius cap reconciled with the DS card.** Cards and panels are 12px (`--aha-radius-lg`), tiles, inputs and buttons 8px, nothing rectangular above 12px; the old "everything ≤ 8px" cap is gone from both guides. (#146)
- **Audience type scale no longer contradicts itself.** Primary copy, option and chip labels are 16px (`--aha-size-l`); 14px (`--aha-size-default`) is secondary metadata only; the guide and C19 now state that `--aha-size-sm` is 12px. (#146)

## 0.75.0 — 2026-10-05
### Added
- **Detail sections for expandable panels.** `DataTable.DetailSection` (and `DetailSection` from `createExpandableRows`) is one titled block of a detail panel; return one or several from `renderDetail` (e.g. a Questions sub-table above a Pages sub-table) and the panel stacks them 16 apart. The panel now owns sub-table styling too: every antd Table inside it is a white bordered card at one compact density (8 / 16 cells) whatever `size` it is given, so sub-tables need no margin, padding or `size` of their own. A new "report detail" case on the Data table page reproduces the eLearning Course report screen. (#141)
### Fixed
- **Expandable rows no longer misalign their own cells.** The 24px chevron / spacer sat on the text baseline, lifting the first-column text 2–3px above every other cell (header and body) and making decorated rows taller than plain ones (46px against 39px in a small table); the chevron now fits the 22px line, so every cell shares one baseline and one row height in detail, tree, DataTable and plain-Table modes. (#141)
- **No empty chevron column.** A table where no row can expand (e.g. a nested Questions table before anyone answers) no longer reserves a spacer column in its header and rows. (#141)
- **Expandable styles no longer leak into nested tables.** Row, tree-child and panel rules now target only the rows the hook owns, so a plain antd Table inside a panel keeps its own rows. (#141)
- **A wide sub-table can no longer stretch the parent table**, and an `ellipsis` first column still truncates after the chevron. DataTable stops forcing `scroll.x: 'max-content'` when a column uses `ellipsis` (and nothing is freezable or resizable), so ellipsis columns truncate instead of scrolling — callers no longer need `scroll={{ x: undefined }}`. (#141)
- **Sticky headers work in DataTable.** The rounded container clips with `overflow: clip` instead of `overflow: hidden`, which had made it a scroll container and broken `sticky`. (#141)

## 0.74.1 — 2026-10-05
### Changed
- `AGENTS.md` now points agents at the full `<aha-chart>` configuration docs (`docs/chart/README.md`, `contracts/chart.json`, Charts tab) (#145).

## 0.74.0 — 2026-10-01
### Changed
- **Charts is now its own top-level tab** next to Settings and Audience Library, built the same way (one page, shell sidebar replaced by the shared "On this page" anchor). It holds the chart examples, playground, "Choosing a chart" guide, API, install and spec, and moves out of the Components list and overview. The old `chart/index.html` URL redirects to `charts/index.html`; `chart.agent.json`, `chart.md`, `chart.llms.txt` and the llms.txt entry are unchanged. Docs search finds the page under Charts. (#142)
- **`<aha-chart>` now says which chart type to use.** `contracts/chart.json` `opinion.whenToUse` gains one row per type (bar, column, stacked, donut / pie, radial, treemap, quadrant, bell, radar, wordcloud, mindmap): the data shape it fits, the slide type it serves, its real limits (six-category fold into "Other (n)", column to bar fallback, 120 words, six bell statements) and what to use instead. The chart docs page gains a matching "Choosing a chart" table, and the generated feeds carry both. (#142)
- **Bell curve and Quadrant wording.** The bell use case now covers any distribution of answers on an ordered scale, not only Rating scale; the 2×2 matrix is called Quadrant across the docs page, the README and the contract, and the chart's accessible names read "Answer distribution" / "Phân bố câu trả lời" and "Biểu đồ góc phần tư". (#142)
- **Charts page: no Type row in the playground.** The Numbers and Highlight controls stay; each chart type is reached from its own section and the "On this page" nav. (#142)
- **Every chart type has a default snippet and its own Show code.** `contracts/chart.json` gains `typeDefaults` (11 minimal `<aha-chart>` snippets, one per type, in `parts/chart.default.<type>.html.txt`) that flow into `chart.agent.json` (`typeDefaults`), `chart.md` and the llms feeds; the contract note tells agents to start from the type's default and only add attributes. Each chart-type section on the Charts page now has a Show code widget with HTML, React and Vue 3 tabs (same tabbed widget as the Audience Library and Settings) plus the selected case, following the switcher; the React and Vue forms set data as a property and wire `wordcloud-hide` / `mindmap-change`, and `chart.agent.json` `typeDefaults` is now `{ type: { html, react, vue } }`; the page-level widget moved to Install and use. Opt-in-only behaviours are listed in `docs/chart/README.md`. The Charts page no longer repeats the "Install" heading. (#142)

## 0.73.0 — 2026-10-01
### Changed
- **CSAT matches the import-completion design (PRO38-77).** `<aha-csat>`: the prompt is 12px in #616161; the thumbs are 28×24 borderless buttons with 16px #4A4A4A icons (ghost fill and primary icon on hover) instead of bare 16px #8A8A8A icons, with Good / Not good tooltips; the feedback popover gains a small round X (closes only, keeps the rating), its Send button is secondary, reads "Send" and stays disabled until text is typed, the field clears after sending, and the "What could be better?" heading is gone unless `feedback-prompt` is set (**breaking** for anyone relying on the default heading). (#143)
### Added
- `<aha-csat feedback-button>` shows a Feedback chat icon beside the thumbs (tooltip Feedback) that opens the same popover with the `feedback-button-placeholder` (default "Share your thoughts") without rating. New `like-label`, `dislike-label` and `feedback-label` attributes localise the tooltips. (#143)
- The `feedback` event now carries the current rating (`'up'`, `'down'` or `null` when unrated) instead of always `'down'`, since the Feedback button can send without a thumbs-down. Esc and the X return focus to the control that opened the popover. (#143)

## 0.72.0 — 2026-10-01
### Added
- **Expandable rows for Table and DataTable (React).** New `@ahaslides-product/design/table-expandable` (`createExpandableRows({ React })` → `useExpandableRows`) gives a plain `tableTheme` Table and the shared DataTable one collapse / expand behaviour, replacing every hand-rolled antd `expandIcon` caret. Two shapes: a **detail panel** (`renderDetail(record)` — free content or a nested sub-table under the row) and **tree rows** (rows with `children` share the parent's columns). A leading 24px chevron button (`system-caret-right`, rotating 0 to 90 degrees on the motion tokens) with `aria-expanded` + `aria-controls`, Enter / Space and a visible focus ring; an aligned spacer on rows that cannot expand; whole-row click toggles too without double-toggling and without firing from links, buttons or inputs. Several rows can be open at once, an optional header toggle (`expandAllToggle`) expands / collapses all, and the expanded state is keyed by row key so it survives sort, filter and pagination (controlled or uncontrolled). The chevron sits inline in the first column in every mode, so detail panel and tree rows, DataTable and plain Table share one layout, indentation and motion. The open state is unmistakable without a fill on the parent: the open parent row keeps the plain surface with bold text and a primary chevron, while its panel or child rows take a gray-20 surface (the nested sub-table sitting in a white bordered card). Plus a loading slot (`loadingKeys` + `onExpand` for lazy fetches). DataTable takes it as the `expandableRows` prop; the Data table docs page shows detail panel, loading, tree and plain-Table cases. (#139)

## 0.71.0 — 2026-10-01
### Added
- **Public README for the chart library** (`docs/chart/README.md`, linked from the root README). A standalone guide for outside developers: copy-paste quick start from a pinned jsDelivr tag (no registry, no build step), ES module import, all 11 chart types with their data shapes, attributes, `options` and `chartOptionDefaults`, palettes, locale and `strings`, events, accessibility, empty state and browser support. (#140)

## 0.70.0 — 2026-10-01
### Added
- **`--aha-tooltip-max-width` (280px) — new layout token** (`layout.tooltipMaxWidth`). The tooltip bubble now wraps at 280px instead of 200px, closer to the Presenter app's 336px; the tooltip conformance check asserts the rendered cap. (#138)
- **Standards gate: new tokens need owner sign-off.** Any leaf token added to `tokens.canonical.json` fails the gate until its path is listed in `tokens.acknowledged.json`, so agent-proposed tokens get a visible one-line review. (#138)
- **Standards gate: raw spacing px.** A component whose source gains a `padding`/`margin`/`gap` literal above 1px fails the gate; existing cases are grandfathered per file in `standards.baseline.json` (ratchet down with `node standards.mjs --update-baseline`; justify one line with `ds-lint-allow: spacing`). (#138)
- **`version-drift.mjs` (`npm run drift`).** Lists the repos consuming `@ahaslides-product/design`, the version each pins and the latest published, with a `--line` mode for one report line. (#138)
### Changed
- Guideline pages no longer point at the retired `aha-design-*` plugin skills (the plugin now ships one `aha-design` skill); they reference the DS guide and anti-slop feed, and the gate rejects the old references. (#138)

## 0.69.1 — 2026-09-30
### Added
- **Anti-slop `charts` surface.** The judge now fails a result/data chart that is not `<aha-chart>` (C1: hand-rolled SVG/canvas or a third-party chart library; `@ant-design/plots` stays allowed for a chart type `<aha-chart>` does not ship) and a chart on the wrong palette (C2: `brand` on app screens, `deck` on the canvas), with a DS-authored eval set. `screen-lint.mjs` also hard-fails an import of Chart.js, Recharts, ECharts, D3, Highcharts, ApexCharts, Victory or Nivo (opt out per line with `ds-lint-allow: chart`). (#137)

## 0.69.0 — 2026-09-30
### Added
- **`<aha-chart>` — the AhaSlides chart library.** One framework-free element draws all 11 result types from the "AhaSlides Chart Slides" mockup: Bar (Poll, Ranking, images incl. image-only options, paging), Column (Poll, Pick Answer, images; turns into bars when labels can't fit), Stacked, Donut / Pie (leader lines or legend), Radial, Tree map, 2×2 matrix (quadrant), Bell curve, Radar (5 / 10 / 100 scales, compare subjects, 8 entrance effects), Word cloud (shapes, image masks, rotation, duplicate merging, click-to-hide with undo) and Mind map (collapse, +N paging, optional add / rename). `palette="brand"` (default) for Report and other app screens; `palette="deck"` + `colors` + `ink` on the presenting/audience canvas. Attributes: `number-format`, `sort`, `highlight-top`, `log-scale`, `legend`, `tooltip`, `max-items` ("Other (n)" past the cap), `page-size`, `correct` + `correct-style` (Pick Answer), `responses`; type-specific settings through the `options` property (defaults exported as `chartOptionDefaults`); `replay()`; `wordcloud-hide` and `mindmap-change` events. Empty results keep each track with a short series-coloured stub at its start (12px on a bar, a 16px full-width stub on a column, joined under its image card when there is one; bars, columns, stubs and image cards share --aha-radius-default) — no waiting text. Legends are compact rows centred against the plot; the tree map fits its box and drops to % only, then no chip, on small tiles. The Bell curve adds an optional grid, % axis and mean line; its % axis picks its step (10 / 20 / 25 / 50%) from the panel height so tick labels never crowd. The Chart docs page gives each chart type its own divided section with a case switcher (one variant shown at a time), plus a playground tab for all 11 types. Ships a text summary, a hidden data table and a polite live-region announcement on updates; built-in copy follows `locale` (en, vi) and takes the Presenter app's translations through `strings`. (#135)
- **`--aha-blur-md` (20px) — new effect token** for the frosted backdrop blur behind translucent chart surfaces (tracks, chips, legend hover, mind-map controls). (#135)
- **`--aha-viz-*` data-visualisation tokens** (series, tints, ink and neutral as aliases of semantic DS colour tokens: brand slots 1, 2, 4, 6, 5, 10 for the series, bg-accent / brand-12 / bg-positive / bg-warning-subtle / brand-11 / bg-informative for the tints, text-default, text-inverse, icon-muted; bar/column geometry incl. the empty-state stub length, the shortest non-zero bar and the column minimum height, ink mixes incl. axis and pressed) and **`--aha-motion-viz-*` / `--aha-ease-viz`**; inside the element every text size, weight, line-height, padding, margin, gap and radius uses the type, spacing and radius tokens, and secondary text, axes, grids, tracks and tooltips use the semantic text / border / bg tokens chart motion tokens, geometry values from the mockup, so a token owner can refine them without touching the element. `tokens.canonical.json` values may now be `{color.…}` aliases: `tokens.css` emits `var(--aha-…)`, and `tokens.js` resolves the hex and exports `tokenAliases`. (#135)
### Changed
- AGENTS.md / PRINCIPLES.md / canvas guide: result charts use `<aha-chart>`; `@ant-design/plots` stays for chart types it doesn't ship yet. The canvas guide flags the open Pick Answer decision (mockup green fill vs `correct-style="indicator"`). (#135)

## 0.68.5 — 2026-09-30
### Fixed
- **Tooltip bubble no longer collapses to one word per line.** A `help` (`?`) tooltip's bubble was sized against its 16px trigger, so a full-sentence hint (the eLearning SCORM "Tracking" tooltip) rendered about 70px wide. The bubble is now `max-content` wide up to the unchanged 200px cap, so short hints stay on one line and long ones fill the cap; all 12 placements and slotted triggers position as before. The Tooltip conformance gate now asserts a full-sentence help bubble is at least 150px wide. (#136)

## 0.68.4 — 2026-09-30
### Added
- **UX writing rule UXW-9 for tooltips.** One idea, one plain-text sentence of about 80 to 120 English characters (translations run 30 to 40% longer), no restating the label, no rich content, and never the only home for essential information. The Tooltip contract and the Settings `?` tooltip guidance point to it. (#136)

## 0.68.3 — 2026-09-29
### Fixed
- **Agents now discover the Settings pattern.** `llms.txt` gains a generated **Patterns** section above Components (one line per `guidelines/*.json`, with a when-to-read trigger) and lists `guidelines.llms.txt` in Feeds; the Settings entry says it applies to any options UI in any container and points at its `#ctrl-<slug>` control table. Settings-family component entries and `<slug>.agent.json` (`feeds.pattern`) link back to the Settings hub. The Settings guideline no longer refers to the removed `aha-design-settings` skills. (#134)

## 0.68.2 — 2026-09-29
### Fixed
- **Table row hover is one colour: gray-30 `#F1F1F1`.** `lib/table-theme.js` still set `rowHoverBg` to the brand-tint `#F9F5FF` while `contracts/table.json` and `<aha-data-table>` already used `#F1F1F1`; the theme now matches. The header filter-trigger hover is unchanged. (#133)

## 0.68.1 — 2026-09-28
### Fixed
- **Docs site shell is responsive at 360 / 768 / 1440.** The 268px sidebar forced horizontal page scroll on every component/guideline page below ~630px; it's now an off-canvas panel below 900px, opened via a new header toggle (closes on a nav click, the backdrop, or Escape). Two remaining generator-output overflow sources are fixed too: the playground's variant segmented control now wraps instead of forcing width, and the API prop table now scrolls in its own container (the documented "wide table scrolls" exception) instead of pushing the page wide. The header's top-nav tabs no longer need an internal scroll at 1440px (the site's own hidden-metadata breakpoint moved from 1279 to 1489). (#132)
### Changed
- **The house responsive contract's top check width moves from 1200px to 1440px.** `screen-lint.mjs --measure` now renders 360/768/1440 (was 360/768/1200); the AGENTS.md non-negotiable text updated to match. (#132)

## 0.68.0 — 2026-09-28
### Removed
- **Landing tab removed from the docs site.** It duplicated the rest of the system: its Button and Link blocks repeated Components (`<aha-button>`, including the `link` / `text-link` variants), and its Fonts, Spacing and Grid blocks repeated Foundations and the product Grid. Breaking for anyone reading the old feeds: `landing.llms.txt`, `landing.agent.json` and the per-block `landing/<slug>/<slug>.md` / `.agent.json` are gone. The old `landing/…` page URLs now forward to where each block lives. (#131)
### Changed
- **Hero and Section container move to Patterns → Marketing sections.** Same preview, paste-and-run HTML and token-load snippet; source is now `marketing/<slug>.json`, pages are `marketing/<slug>/index.html`, and the feeds are `marketing.llms.txt` / `marketing.agent.json`. (#131)
- **The Webflow-to-update audit is kept in the repo** at `docs/landing-webflow-scan.md` (was `landing/SCAN.md`; not a site page). It now records the three landing-only values not yet in the product system: the pink promotional button, the underlined prose link, and the Nunito Display/H1-only headline rule. (#131)

## 0.67.0 — 2026-09-28
### Added
- **UX writing rule UXW-8: no em dash or en dash in product copy.** Added to `guidelines/ux-writing.json` (rule + ref), the `ux-writing` composition guide (`parts/ux-writing.guide.md`), and the DS-owned anti-slop store as criterion `C8`, authored here in the DS (the plugin's ux-writing skill is retired in aha-design 2.0.0, so the DS is the only home for the rule). Fixed the one existing example in `guidelines/ux-writing.json` and `parts/ux-writing.guide.md` that used an em dash as punctuation, so the page's own copy follows its new rule (#128)
- **Eval set:** the ux-writing eval set gains a bad and a good case for C8, so the accuracy gate measures the new rule. (#128)

## 0.66.0 — 2026-09-28
### Added
- **An accuracy gate for the anti-slop store: all fifteen surfaces now ship a labelled eval set at `anti-slop/evals/<surface>/evals.json`.** The aha-design judge datasets (plugin v1.80.0) are ported for `audience`, `background`, `canvas`, `component-standard`, `feedback`, `icons`, `overlays`, `paywall`, `settings`, `shared-components`, `status-badges`, `table`, `typography` and `ux-writing` (canvas with its code fixtures), each case pinned to an explicit `expected` verdict keyed to the DS criterion ids. Cases that contradicted the live DS were remapped rather than copied, with the reason in each case's `source.remap`: typography no longer accepts Inter for a label role (the DS has no Inter), component-standard cases cite the live contracts and doc-site render instead of the plugin's frozen `contract.json` / `review.html`, the Button matrix is the live 10 variants × sm/md/lg, feedback banners are the DS `<aha-alert>` rather than the plugin's AhaAlert wrapper, shared-components cases name the 0.64.0 primitives (`<aha-field-error>`, `<aha-live-region>`, `<aha-progressbar>`, `<aha-viewport-switch>`, `<aha-error-page>`, `<aha-empty>`), and settings cases pinned to the judge's `CR` (reuse over rebuild), which the store does not carry, are re-keyed to C10 / C13 or listed under `notPorted`. `app-shell` has no plugin judge, so its set is DS-authored with code fixtures; `icons` C6, settings C5–C8 and the new shared-components primitives gain authored cases. Every store criterion now has at least one FAIL case. (#129)
- **`standards.mjs` gates the eval sets (no model call).** For every store surface: an eval set exists, every case is well-formed, every expected criterion id exists in `criteria.json`, both PASS and FAIL cases are present, every fixture resolves and no case cites a frozen plugin snapshot; plus a verdict-parser self-test. A new surface without an eval set now fails `npm run check`. (#129)
- **`npm run evals:anti-slop` — the live, model-in-the-loop scorer.** Hands the judge the store's own criteria for a surface, majority-votes over `--samples`, and prints per-case results, a per-criterion confusion table and overall accuracy (`--min-accuracy` to gate, `--dry-run` to print prompts). Documented in `anti-slop/README.md`. (#129)

## 0.65.0 — 2026-09-28
### Removed
- **Breaking: the `antd` anti-slop surface is gone.** The DS components already wrap AntD v6 with the house theme, so a separate "is this AntD styled right" judge duplicated them. The store now has 15 surfaces. `background` stays: it has its own guideline, and its criteria never depended on the antd judge. (#130)

## 0.64.0 — 2026-09-28
### Added
- **The a11y runtime primitives now ship in the DS — the `aha-design-shared-components` plugin registry resolves to real exports.** Five new components, each with a contract, doc page, HTML/React/Vue snippets and a render-gated conformance block:
  - **`<aha-field-error>`** (`./aha-field-error`) — the accessible field / validation error: a stable id for the input's `aria-describedby`, danger text, nothing rendered while empty (the a11y FieldError); `variant="respondent"` is the FieldErrorDisplay contract (`role="alert"`, assertive). (#127)
  - **`<aha-live-region>`** (`./aha-live-region`) — screen-reader announcements: assertive + atomic, stays mounted when empty, no `role="alert"`; `announce(text)` re-announces identical text; `politeness="polite"` and `visible` options. (#127)
  - **`<aha-progressbar>`** (`./aha-progressbar`) — the accessible bar over `<aha-progress>`: the host is `role="progressbar"` with your real `value`/`min`/`max`, a `label` and optional `value-text`; the visual bar is hidden from AT so it is announced once. (#127)
  - **`useIsMobile()`** (`./use-is-mobile`, React as an optional peer) + the framework-agnostic **`./viewport`** store (`MOBILE_MEDIA_QUERY` = `(max-width: 767.98px)`, `isMobileViewport`, `subscribeMobileViewport`) + **`<aha-viewport-switch>`** (`./aha-viewport-switch`) for HTML shape switches (`slot="mobile"` / `slot="desktop"`, `viewport-change` event). (#127)
  - **`<aha-error-page>`** (`./aha-error-page`) — the full-page error: `code` (404 · 403 · 500 · offline · generic) → DS Result with British-English copy and a "Try again" action for retryable codes, `role="alert"`, `error-page-view` telemetry and `action` events; `heading`/`body`/`action-label` take translations. (#127)
- **`<aha-input>` forwards its `aria-describedby` to the inner field** (as element references, re-resolved on focus), so a DS input can actually be described by an `<aha-field-error>` — an id reference cannot cross the shadow root on its own. (#127)
- **Shared-components pattern + anti-slop surface.** `guidelines/shared-components.json` is the registry (need → DS primitive → contract kept), and `anti-slop/criteria.json` gains `surfaces.shared-components` (C1–C4, seeded from the aha-design v1.80.0 judge), so the anti-slop feeds now carry this loop. The ux-writing pattern's `error-page` dependency is now available. (#127)

## 0.63.0 — 2026-09-28
### Added
- **Seven more anti-slop surfaces in the DS-owned store: `paywall`, `status-badges`, `settings`, `feedback`, `overlays`, `canvas` and `audience`.** Each was seeded from its aha-design judge (plugin v1.80.0) with `sync-skills.mjs import` — 85 binary criteria in all — so `anti-slop.md` / `anti-slop.agent.json` now carry sixteen surfaces and every guideline is wired (the "Not yet wired" list is gone). Feedback C4 now points at the DS `<aha-alert>` contract instead of the plugin's `references/alert.md`. (#123)
- **Each new surface declares its live DS `targets`.** The six pattern surfaces target their `guidelines/<name>.json` plus the contracts or tokens their criteria judge (e.g. `feedback` → toast, alert, CSAT; `overlays` → modal, drawer, popover); `paywall`, which has no guideline, targets `contracts/paywall.json`. Each wired pattern page, `.md` and `.agent.json` now links back to its anti-slop judge. (#123)
### Changed
- **The anti-slop gate also checks** that criterion ids are unique within a surface, a target is listed once, and a seeded surface records its own `seededFrom` + judge `skillRef`. Build-assertion refs (`SETTINGS-01`, `§2`, …) now warn once per guideline rather than once per rule. (#123)
### Fixed
- **`sync-skills.mjs import` seeds cleaner criterion text.** It reads only the paragraph under each criterion header (following a lead-in that ends in ":"), and cuts long text at a word boundary with "…" rather than mid-word. `ux-writing` C4 loses the stray example text an earlier import had cut mid-word. (#123)

## 0.62.0 — 2026-09-28
### Added
- **`DataTable` — a real, importable data-grid component (`@ahaslides-product/design/aha-data-table`).** Until now the DS shipped only `tableTheme`, so every app rebuilt the DataTable itself. `createDataTable({ React, antd })` binds the shared component to your own React + antd (zero runtime deps, works from a bundler or a CDN page) and brings the whole DS V3 table: white header that stays white when sorted, dividers only, radius 8, 16px cells, gray-30 hover, single-arrow sort (↓ → ↑ → none), checklist and min/max filter popovers with Reset / Apply, drag reorder (Alt+←/→ from the keyboard), right-click freeze (one column, pinned left), column resize, rows-per-page and an Edit columns checklist — icons from the DS library by name. Also exports `dataTableTheme` (the Vue path until the Vue twin lands) and `dataTableLabels` (i18n). New **Data table** docs page under Components · Data Display, linked from Table's *When to use*. `table-theme` and the Table page are unchanged. (#126)
### Fixed
- Composite doc pages' install block now shows the named imports (`import { … } from …`) instead of claiming the module registers a custom element. (#126)

## 0.61.1 — 2026-09-28
### Added
- **The package now ships the agent rules: `guidelines/`, `anti-slop/criteria.json` and `tokens.canonical.json`.** They were missing from `files`, so an agent that only installed `@ahaslides-product/design` never received the surface guidelines or the anti-slop judge criteria and could reach them only through the docs-site feeds. All three are now in the tarball and exported as `./guidelines/*`, `./anti-slop/criteria.json` and `./tokens.canonical.json` (import with `with { type: 'json' }`). (#120)

## 0.61.0 — 2026-09-28
### Added
- **Docs site: one global search in the header, on every page.** Searches the whole design system — components and patterns (by name, element tag, props and variant options), every icon, every `--aha-*` token (with its value and a colour swatch), guidelines, landing blocks, Audience Library sections, agent feeds and every docs section heading. Results are grouped by type and deep-link to the page or heading; icons open the gallery pre-filtered (`icons/index.html?q=…`), with a "See all N icons" row past the first 8. `/` or Ctrl/⌘ K focuses it; arrow keys + Enter to open, Esc to close (ARIA combobox + listbox). Collapses to an icon button that opens a full-width panel below 768px. The index (`search-index.json`) is crawled from the built site at generate time and loads on first open — no backend, no new dependency. (#125)
### Changed
- **Docs header reflows instead of widening the page:** the area tabs scroll horizontally when space runs out, the "React · Vue · Lit" label hides below 1280px, and the wordmark hides below 768px. Docs `h2`/`h3` headings now carry stable `id`s so any section can be linked to. (#125)

## 0.60.0 — 2026-09-28
### Added
- **Seven more anti-slop surfaces in the DS-owned store: `antd`, `component-standard`, `icons`, `typography`, `table`, `shared-components` and `background`.** Each was seeded from its aha-design judge (plugin v1.80.0) with `sync-skills.mjs import`, then reviewed so every binary criterion judges against the DS's **live** contracts and tokens instead of the plugin's frozen `contract.json` / `typography.json` snapshots. Where the live DS overrules the old snapshot, the criterion follows the DS — e.g. typography is Plus Jakarta Sans at weights 400/600 only, with no Inter label set. `anti-slop.md` / `anti-slop.agent.json` now carry all nine surfaces. (#121)
- **Surfaces declare `targets` — the live DS sources they are judged against.** Each target names a contract, `tokens.canonical.json`, the icon registry or a guideline, and the feeds publish it as its fetchable URL (`<slug>.agent.json`, `design.md`, `icons.agent.json`, …), so a consumer's judge never reads a stale copy. (#121)
- **`guidelines/background.json` — the Background pattern.** White by default; the sanctioned non-white exceptions (feedback tint, app-shell layout grey, interactive state fill, explicitly requested colour), each bound to an `--aha-bg-*` token; no gradients except the AI affordance's border; token-only colours. (#121)
### Changed
- **The anti-slop consistency gate covers the new surfaces.** A wired surface now needs a guideline **or** live targets; every target must be an existing DS source; no criterion may cite a frozen plugin snapshot; and judge ids may use the judge's own letter (typography's `J1..J7`). `seededFrom` provenance moved from the store root to each seeded surface, since surfaces are now seeded from different plugin versions. (#121)

## 0.59.7 — 2026-09-28
### Changed
- **Composite components no longer have a separate "Theme (shared)" code tab — the theme is wired inside the React and Vue code you copy.** Each snippet imports the real `<slug>Theme` from `@ahaslides-product/design/<slug>-theme` and passes it to `ConfigProvider` / `a-config-provider`, so one paste gives the themed component. The Table React/Vue snippets drop the fictional `@aha/ui-react` / `@aha/ui-vue` `DataTable` for the real antd v6 / ant-design-vue v4 `Table` + `tableTheme`, and `standards` now rejects those placeholder packages. (#124)

## 0.59.6 — 2026-09-28
### Changed
- **Table moves back to Components (Data Display).** It is a themed antd primitive, not an AhaSlides composition, so it no longer sits under Patterns · Data; the empty Data pattern group is gone and the contract's `group` is now `Data Display`. No component behaviour or API change. (#122)

## 0.59.5 — 2026-09-22
### Changed
- **Audience Library: the one-page nav is now the shared antd `Anchor` "On this page" component — the same one the Settings hub uses.** The audience gallery carried two hand-rolled navs (the shell left-sidebar of in-page `#` links **and** a header pill `chipnav`); both are replaced by the sticky antd `Anchor` island (via `noSidebar`), so every single-scroll DS area navigates through one component instead of a per-area re-implementation. Extracted the Settings hub's inline Anchor into shared `hubAnchor*` helpers (aside markup + React island + layout CSS) and pointed both pages at them. (#119)
### Fixed
- **The one-page `Anchor` actually mounts now — an esm.sh dep break had it silently falling back everywhere, including the live Settings page.** `esm.sh/antd@6` resolved its transitive `@ant-design/fast-color` as a separate module whose current build fails to export `FastColor`, which threw at eval time so the `Anchor` never hydrated and both hubs showed only the plain no-JS fallback. Switched the import to `?bundle-deps` (inlines the transitive deps); verified the real antd `Anchor` mounts and scroll-tracks on both pages. Also narrowed the group-header CSS to only true parent links (`:has(.ant-anchor-link)`), so a flat leaf list (Audience) renders as normal-case nav items rather than uppercased headers, and Settings' top-level overview links stop being uppercased. (#119)

## 0.59.4 — 2026-09-22
### Fixed
- **Audience Library: every demo glyph is a DS `<aha-icon>`, no more emoji or Unicode stand-ins.** The audience gallery mocks faked their iconography with raw characters and emoji — the InputNumber/DraggableOptions steppers were 9px `▲`/`▼` triangles (indistinguishable from a native `<input type=number>` spinner, the very thing the component says it replaces), the Select caret a `▾`, the drag grip `⋮⋮`, the AnswerOption verdicts `✓`/`✕`, and ImageUploader/SubmitButton/WaitingForHost/SubmittedCard used 🖼️/📷/🔒/⏳/✅. Each is now the design-system glyph called by name (`system-caret-up/down`, `system-drag`, `system-check`, `system-x`, `system-image-square`, `system-upload-simple`, `system-lock`, `system-hourglass-high`, `system-check-circle`) — the same `never-inline-an-SVG` rule the icon gallery enforces. The page now loads the shared `icons/registry.js` + `icons/aha-icon.js` runtime (PJAX-safe); verified all 54 icons render real SVGs (zero unknown-icon fallbacks) on both light and dark decks. AudienceIdentityStrip keeps its 🦊 — that glyph is the participant's real `audienceEmoji` avatar data, not chrome. (#118)

## 0.59.3 — 2026-09-22
### Fixed
- **The product face (Plus Jakarta Sans) now actually loads on the docs site.** The shell `@font-face` referenced `<base>fonts/PlusJakartaSans-{Regular,SemiBold}.woff2`, but those files were never added to the repo or copied into `dist/`, so every page 404'd the woff2 and silently fell back to `-apple-system` — including the shadow-DOM component previews, which is where it read as "wrong font". The two self-hosted weights (400/600) are now committed under `fonts/` and copied into `dist/fonts/` by the build (and shipped in the npm package), so `<base>fonts/…woff2` resolves and the whole site — previews included — renders in Plus Jakarta Sans. Verified the woff2 loads (200, `document.fonts` status `loaded`) and the previews compute the brand face. (#117)

## 0.59.2 — 2026-09-22
### Fixed
- **Settings page: every control shows its live preview again.** When the settings surface was consolidated onto one page, only `<aha-settings-list>` kept a live demo — the other 16 controls (setting group/row, sub-setting group, option row, question list, number-with-unit, image dropzone, card select, section header, mode field, counted input/textarea, add-item button, image-action button, info box, numbered item) were reduced to text-only blocks, so their previews disappeared from `settings/index.html`. Every control now renders its full inline treatment — live example + playground + framework code + API — identical to its per-component detail page, so an agent reading only the one page sees every component rendered. Each preview loads the real shipped `../lib/aha-*.js` element (module dedup keeps the shared imports single); verified all 17 previews upgrade non-blank in a headless render. (#116)
- **Settings page: the "On this page" nav reflects the whole page IA, not just the components.** The in-page antd `Anchor` (and its no-JS fallback) listed only the settings components, so the page-level sections above them were unreachable and the nav didn't mirror the page. The overview sections — *Choose the surface*, *Rules*, *Composed of* — now render inside the content column (so the sticky nav sits beside the whole page) and lead the Anchor as top-level items, followed by the *Composition* and *Controls* component groups. The nav is now a faithful top-to-bottom map of the page. (#116)

## 0.59.1 — 2026-09-22
### Fixed
- **Settings page: one nav, not two.** Dropped the shell left sidebar on `settings/index.html` — it duplicated the in-page "On this page" antd `Anchor` (same Composition/Controls items) and didn't match the reference IA. The Anchor is now the single navigation; the content reclaims the full width. (#115)

## 0.59.0 — 2026-09-22
### Added
- **Audience Library is now its own top-level area, on one scroll page.** A new **Audience Library** nav tab (alongside Landing) whose page — `audience/index.html` — is the audience component gallery, rendered inside the DS shell so it wears the standard top-nav + a scoped left sidebar (one anchor per component). Every component card shows its purpose, a USE WHEN / NOT FOR callout, side-by-side light/dark deck demos, and the DS collapsible HTML/React/Vue code panels. All colours/sizes/radii are DS `--aha-*` tokens; the reference UI is the marketplace audience-lab. Generated from `audience/library.json` (+ scoped `audience/audience.css`); absent-safe (no data file → no tab). Honest imports: audience components are marketplace Vue components at `@/iframe/audience`, not DS web components — no fabricated DS entries. (#114)

## 0.58.0 — 2026-09-21
### Changed
- **Settings is now genuinely one page under one URL — component nav is an in-page antd `Anchor`.** On `settings/index.html` every settings component is inline, grouped Composition then Controls exactly as the reference IA, and switching between them is an in-page scroll — it no longer loads another page or changes the URL. The per-section "full page →" away-links are gone, and the Settings sidebar now points at in-page anchors (`#ctrl-<slug>`) instead of per-component URLs. In-page navigation is built with the real Ant Design v6 `Anchor`, mounted as a small CDN-React island over the shared token theme (the DS composite pattern, as with Table), which tracks scroll and smooth-scrolls within the page; a no-JS/CDN-down fallback keeps the same in-page anchor list working. The underlying per-component contracts/pages are untouched — "one page" means the Settings page never routes away, not that any component was removed. (#113)

## 0.57.0 — 2026-09-21
### Added
- **Settings is now its own area, on one self-contained page.** A new top-level **Settings** nav area (alongside Components/Patterns) whose landing page — `settings/index.html` — gathers the entire settings surface INLINE on a single page: the composition pattern (surface choice, the full rule text, composed-of), the schema-driven `<aha-settings-list>` component with a live example, framework code and full API, and every settings control's summary, spec and API. Point an agent or a repo at that one URL and it has everything without following a link. Generated from `guidelines/settings.json` + the settings contracts (no hand-authored duplication). The settings controls move out of the Patterns group into this Settings area. (#111)

## 0.56.0 — 2026-09-18
### Added
- **Content max-width token.** The design system now defines a default max-width for centred app content: **`--aha-content-max-width: 1440px`** (source `tokens.layout.contentMaxWidth`). Cap the page/screen container to it and centre with auto side margins — `max-width: var(--aha-content-max-width); margin-inline: auto` — instead of hardcoding a content width. Surfaced on the Sizing foundations page and the `design.md` feed. (#108)
## 0.55.2 — 2026-09-18
### Changed
- **Gate hardening — three checks distilled from a settings-alignment retro.** (1) `standards.mjs` now fails a version that is **behind the latest release tag** — the "branched off a stale base" trap that let a PR cut ~18 versions behind master reuse an already-published version and would have reverted merged work. (2) `qa.mjs` conformance now compares colours **normalised to a canonical rgba tuple**, so `color-mix()` (which Chrome serialises as `color(srgb …)`) matches an `rgba()`/hex `expect` — removing a brittle string-compare that passed the local static gate but red-failed only in CI. (3) `qa.mjs` gains an **`expectMax`** upper-bound operator, and `option-row` now asserts a single-line row stays **≤56px** — the render-height guard that would have caught the OptionRow "2-lines-tall" regression the border-only conformance missed. (#107)

## 0.55.1 — 2026-09-18
### Fixed
- **OptionRow / CountedTextarea — single-line answer rows no longer render two lines tall.** The borderless counted `<textarea>` (the OptionRow answer field) auto-sized every row to ~82px: the native `<textarea>` defaults to `rows="2"`, so measuring `scrollHeight` at `height:auto` reported two lines even for one word, and the reserved 22px counter gutter compounded it. The textarea now carries `rows="1"` so auto-grow measures from a single line, and in the compact borderless (OptionRow) context the focus-only counter overlays the corner instead of reserving the full 22px gutter — a single-line answer row is now ~44px. Standalone CountedTextarea (descriptions, minRows 2) is unchanged. (#105)

## 0.55.0 — 2026-09-18
### Changed
- **Icon-name validation now gates every path an icon reaches the runtime — and reaches consumer CI.** Broken icon names kept shipping because the gate only checked `<aha-icon name="…">` tags: a name fed as DATA (a Menu row `{"icon":"system-chart-bar"}`, a playground option, a preview) was never validated. `standards.mjs` now also validates every `"icon":"…"` reference (in a component's source, snippets, preview and contract JSON), and `screen-lint.mjs` — the checker consumers run in their OWN CI — now hard-fails an unknown `<aha-icon name>` or menu `icon` on a consumer screen, so a bad name is caught at the consumer, not just inside the DS. (#106)
- **Icon names are enforced kebab-case at the source.** `build-icons.mjs` fails the build on any non-kebab SVG filename, so a future Figma import can't reintroduce an un-guessable name (a consumer types the kebab form, misses, ships a broken icon). Renamed `system-Medal` → `system-medal`, `system-PaperPlaneTilt` → `system-paper-plane-tilt`, `system-arrowCircleUp` → `system-arrow-circle-up`, `system-q&a` → `system-qa`. **Back-compat:** each old spelling still resolves as a deprecated alias, so a consumer that referenced the old name does not break — migrate to the kebab name. (#106)
- **The Menu showcase now replicates the real AhaSlides main navigation.** The headline Menu example is the actual app left-nav — Home · My Presentations · Template Library · Shared Presentations · My Plan · Integration Center · Team Management — each with a real DS glyph, so it is a faithful reference for implementers. The group/submenu/divider/danger/disabled feature demo is kept as a second example. No change to the `<aha-menu>` primitive. (#106)
### Fixed
- **`aha-menu` doc example referenced a non-existent icon** (`system-bar-chart` → `system-chart-bar`) — the DS was teaching a broken name; now gated so it can't recur. (#106)

## 0.54.0 — 2026-09-18
### Changed
- **Settings controls aligned to the settings-lab reference (the whole set).** Reconciled the settings component family against the product's canonical settings surface — the DS keeps its architecture (Shadow-DOM custom elements, `--aha-*` tokens, gates) and adopts settings-lab's function/visual, verified control-by-control with the settings Agent Fleet against the real rendered elements. **Input family** (`aha-counted-input`/`aha-counted-textarea`/`aha-select`/`aha-number-with-unit`): rest border `--aha-border-input` #D3D7E1, placeholder `--aha-text-placeholder` #999999, h40 (small 32 / large 48), single-line hover → full-primary #6A1EBB, solid 2px #D3B4FF focus ring; textarea keeps the lighter #D3B4FF hover at radius 6 / maxRows 5. `aha-number-with-unit`: the ▲/▼ stepper now sits **left of the unit** (a child-order render-gate assertion guards it), compact 4ch chip, unit stays the short `sec`. `aha-option-row`: success-green correct-answer row state (`--aha-border-success` + an 8% teal tint). `aha-checkbox` 16×16 / `--aha-border` #E3E3E3. `aha-segmented` label weight 400 / thumb radius 4 (the thumb no longer animates a layout property). `aha-card-select` card tokens + a `color-mix` selected fill (keeps the DS roving-arrow a11y). `aha-mode-field` outline-only active + hidden-mode controls disabled while hidden (a hidden mode can't leak into saved config). `aha-image-dropzone` 2px-dashed / 135px filled frame, `aha-image-action-button` thumbnail radius 4. `aha-dropdown` 40px items / neutral-grey hover. `aha-tooltip` `help` defaults to `bottom-start` + no arrow. `aha-info-box` success border → teal-50, warmer `--aha-bg-warning-subtle` warning fill, padding 12/16. New tokens: `--aha-border-input`, `--aha-text-placeholder`, `--aha-bg-warning-subtle` (in the token layer + JS export + CSS vars). (#104)

## 0.53.2 — 2026-09-17
### Fixed
- **Releases now publish automatically on merge — the registry can't drift behind master again.** `publish.yml` previously fired only on a hand-pushed `v*` tag, which nobody did, so GitHub Packages stalled at `v0.41.0` while `master` climbed to `0.53.x` (12 unpublished minor versions; `npm i` resolved a months-old build). It now runs on every push to `master`: it builds + runs the standards gate, and if `package.json` → `version` has no matching tag yet, publishes it, creates the `v<version>` tag, and verifies the version resolves in the registry (a silent publish failure turns the run red). Idempotent — a merge that didn't bump the version is a no-op; manual re-publish/backfill via `workflow_dispatch`. No more manual `git tag`; a correct version bump (already gated per PR) is the whole release. (#101)

## 0.53.1 — 2026-09-17
### Fixed
- **Agent onboarding docs** — `AGENTS.md` and `README.md` now name the correct host for each surface: docs + feeds are read from **GitHub Pages** at the site root (`https://ahaslides-product.github.io/ahaslides-design/llms.txt` is the single entry point — no `dist/` prefix), while jsDelivr `/gh/@master/lib/*.js` serves only the element source imported at runtime. Removes the misleading `dist/…`-path and "feeds on jsDelivr" wording that led agents to fetch 404 URLs. Adds a `lib/README.md` pointer so a wrong guess at that path redirects to the index. (#100)

## 0.53.0 — 2026-09-16
### Changed
- **Leaf components now inherit the host app's typography (library-wide).** A leaf that pinned the product font on its shadow content (`font-family:var(--aha-font-product,…)` on a `.class`) couldn't be re-themed — its text drifted off a host app's own font even when both used Plus Jakarta Sans (the `aha-alert`-in-AntD case, first fixed in #98). The product font is now set **once on `:host`** and every text-bearing content element uses `font-family:inherit`, so a themed host that sets `--aha-font-product` (or inherits a font into the element) gets matching text with **zero per-component config**. Standalone usage is unchanged — `:host` still supplies Plus Jakarta Sans. Normalized across 23 more leaves: `aha-add-item-button`, `aha-avatar`, `aha-badge`, `aha-button`, `aha-card`, `aha-card-select`, `aha-checkbox`, `aha-counted-input`, `aha-counted-textarea`, `aha-image`, `aha-image-action-button`, `aha-input`, `aha-number-with-unit`, `aha-progress`, `aha-radio`, `aha-rate`, `aha-segmented`, `aha-select`, `aha-status-badge`, `aha-switch`, `aha-tag`, `aha-tooltip`, `aha-user-info`. Font size/weight/line-height are unchanged. (#99)
### Added
- **Font-inheritance gate in `standards.mjs`.** The per-leaf source scan now hard-fails a `font-family` that pins `--aha-font-product` (or a bare literal font stack) on any selector other than `:host`, so the anti-pattern (the one #98 fixed) can't regress anywhere in the library. Allowed: `font-family:inherit` on content, the font on `:host`, and the mono/display/secondary tokens; a justified deviation carries a per-line `ds-lint-allow: font (why)`. Ships hard-fail with an empty `FONT_DEBT` grandfather map (same idiom as the motion/a11y/responsive gates). Plan: `plans/font-inheritance-normalization.md`. (#99)

## 0.52.1 — 2026-09-16
### Changed
- **Alert — inherit the host app's font instead of pinning it on the content.** `aha-alert`
  was the only leaf that set `font-family:var(--aha-font-product,…)` directly on `.alert`, so it
  could not pick up a consuming app's typography and its text drifted from the surrounding UI
  (different fallback chain / spacing) inside themed apps. Moved the branded default to `:host`
  and set the content to `font-family:inherit`, matching the `tabs`/`collapse`/`segmented` idiom —
  standalone alerts still get the DS product font, and host apps can now theme it via
  `--aha-font-product` (or plain inheritance). (#98)

## 0.52.0 — 2026-09-15
### Changed
- **Landing Button — tertiary is now the DS ghost button, and the page is restructured.** The
  Landing → Button page follows the requested structure: a short intro, then a Primary, Secondary
  and Tertiary section, each showing all three control sizes (sm 28px / md 36px / lg 40px) with its
  own paste-and-run snippet. The tertiary variant (`aha-btn--tertiary`) replaces the 0.51
  `aha-btn--text-link`: it now follows the product Button's `variant=tertiary` (a ghost — transparent,
  purple label, soft purple hover fill `#F9F5FF` / active `#F0E4FF`, per-tone soft focus ring), the
  shape the requester accepted, rather than the live Text link's colour-only hover. `landing/SCAN.md`'s
  Text link section is re-reconciled against the ghost tertiary — hover fill, active fill, focus style
  and focus radius are the Webflow-to-update deltas; label weight and hover colour are now matches. (#96)
### Added
- **Landing blocks — per-variant / per-size sections.** A landing block may declare a `variants`
  array (each with `sizes`) in `landing/<slug>.json`; `renderLandingBlock` renders one section per
  variant, each previewing every size with its own copy-paste snippet. Blocks without `variants`
  render exactly as before. (#96)

## 0.51.0 — 2026-09-15
### Added
- **Landing Button — fourth `text-link` variant.** Webflow's "Text link" component (the live
  site's tertiary CTA, `.text-link-wrapper`) is now reflected in `landing/button.json` as
  `aha-btn--text-link`: transparent, borderless, brand-purple label, bound to the product
  text-link colour tokens (`--aha-color-primary` / `--aha-text-link-hover`) and the shared
  `--aha-button-focus-ring`, at the landing button family's semibold weight. `landing/SCAN.md`
  gets a new Text link subsection (round 4) logging three Webflow-to-update deltas: the live
  label weight (`600` vs the DS text-link contract's `400`), the hover colour (one shade too
  dark), and the hard-border focus style (vs the DS soft ring). (#96)

## 0.50.1 — 2026-09-15
### Fixed
- **Landing Section container — definition pass against the live homepage.** Re-scanned the live
  marketing site's `--_spacing---section-p-*` custom properties: max-width and the padding-x cap
  already matched the DS tokens exactly, so fixed a one-token-off mobile padding-x floor
  (`--aha-space-20` &rarr; `--aha-space-16`, matching the live `1rem` mobile value) and a stale
  title font-family/line-height pair left over from before the round-3 Fonts decision (the title
  was forcing the H1/Display treatment onto what is an H2; now inherits the body face and
  `--aha-line-height-heading` like `landing/fonts.json`'s own H2). No Webflow-to-update items —
  the live geometry already agreed with the DS tokens everywhere a live counterpart exists.
  `landing/SCAN.md`'s Section container entry expanded to a full deep-pass table. (#97)
## 0.50.0 — 2026-09-15
### Changed
- **Landing Button preview — annotated items, no container box.** The Preview drops the bordered
  `landing-stage` container, and each variant now carries a caption annotation naming its class and
  role (`aha-btn--primary` — one main call-to-action per section, etc.). Annotations render in the
  Preview only via a new optional `previewHtml` field on landing blocks; the paste-and-run snippet
  stays the clean block. The annotated items stack vertically, one per row. Landing **Fonts** gets a
  `previewHtml` too — a Role/Size type-scale specimen table (each role rendered at its `--aha-size-*`
  token, with a size pill), mirroring the Foundations typography table. (#94)

## 0.49.0 — 2026-09-15
### Changed
- **CSAT — borderless single row only, with a thumbs-down feedback popover** (**breaking**, pre-1.0). `<aha-csat>` now renders one layout: the canonical borderless surface — prompt + two 16px thumb icons on one line, no chrome, a 400-weight prompt. The old boxed form is gone (the `card` attribute is removed), and the legacy `inline` attribute stays a no-op (a stray `<aha-csat inline>` renders the same row). **Thumbs-up** rates instantly (emits `rate`); **thumbs-down** registers the down rating (emits `rate`) *and* opens a feedback popover anchored to the down thumb — a short prompt, a free-text field and a primary Send button — reusing the shared `<aha-popover>` + `<aha-counted-textarea>` + `<aha-button>`; dismissing it (Esc / outside-click) keeps the down rating. New optional `feedback-prompt` / `feedback-placeholder` attributes theme the popover copy. Submitting emits a dedicated composed **`feedback`** event `{ rating: 'down', source, feedback }` (mapping to the pattern's distinct `CSAT_FEEDBACK_SUBMITTED`), then the opt-in `thanks` line cross-fades in over the same cell — replacing the prompt + thumbs in place rather than sitting beside them — shown instantly on an up rating, after submit on a down rating. (#90)
### Fixed
- **Popover — clicking inside the panel no longer closes it when the popover is nested in another element's shadow root.** The outside-click guard used `contains(event.target)`, but a document-level click is retargeted to the shadow host, so any click read as "outside" — closing the popover before an interactive control inside it (e.g. the CSAT feedback field) could be used. It now tests the composed event path. (#90)

## 0.48.0 — 2026-09-15
### Added
- **Responsive gate — one UI, every device.** Device responsiveness is now a house non-negotiable with a rule + gates, so a new component/pattern/screen can't ship a layout that traps on a phone. Product UI must be **fluid from a 360px floor up** (reflow, never a horizontal scroll) with **≥ 24px** touch targets (WCAG 2.5.8 AA). `standards.mjs` (component source) and `screen-lint.mjs` (consumer screens) now **hard-fail a fixed `min-width` ≥ 360px trap** — the zero-interpretation source tell that a layout can't fit a phone (a fixed *width* below the floor is fine; a per-line `ds-lint-allow: responsive (why)` overrides). `screen-lint.mjs` also gains an opt-in **`--measure`** pass that renders a real screen at **360 / 768 / 1200** and hard-fails a horizontal overflow — the render-side twin, Chrome-gated so the static path stays dependency-free for consumer CI. New **`measureAtViewports()`** in `cdp.mjs` sweeps several viewports in one Chrome launch. (The measured pass is scoped to *screens*, not component showcases — a single composed screen must fit a phone, whereas a doc/showcase page legitimately packs many wide variants; a wide data table that scrolls is the one exception.) (#95)

## 0.47.3 — 2026-09-15
### Changed
- **Landing Button — matches the buttons the site ships today.** `landing/button.json` reverts the
  round-3 XL-pill styling: the block now uses the DS default `8px` radius (`--aha-radius-default`)
  and the large control height (`--aha-control-height-button-lg`, 40px) with `20px` padding — the
  same shape and size as both the product `aha-button` and the live `.btn`, so the docs preview reads
  as the real buttons. The pink-accent variant now uses `--aha-pink-60` (`#FF4081`, the live bold
  pink) resting and `--aha-pink-50` on hover. The state fixes from 0.47.2 (focus ring, secondary
  hover/press) are kept. `landing/SCAN.md`'s radius/size/pink rows and Webflow-to-update items 2 and
  8 are corrected accordingly (`#ff4081` is on the DS pink scale; no pill to apply in Webflow).
- **Landing docs — preview labels + no block badge.** The Button preview now labels each variant by
  name (Primary / Secondary / Pink), and the `landing block` badge is removed from every landing
  page heading in `generate.mjs`. (#93)

### Fixed
- **Landing Button — re-scanned against the live Webflow homepage, closed the completeness gaps.**
  `landing/button.json`'s secondary variant was missing the hover text-colour and press-border
  states, and used a plain `outline` for focus instead of the product `aha-button.js`'s soft
  box-shadow ring (`--aha-button-focus-ring`) — both now match the canonical Button primitive
  exactly. `landing/SCAN.md`'s Buttons section is rewritten with a full per-property verdict table
  and 14 new Webflow-to-update deltas (primary press colour, focus-ring colour, pill radius vs the
  live site's square `8px`, label weight, and the secondary border/hover/font-size shades) — DS
  wins every one, nothing was reconciled down to the live site. (#92)

## 0.47.1 — 2026-09-15
### Fixed
- **Modal — responsive width on mobile.** `modalWidth(size)` capped the dialog at a fixed viewport fraction (`35vw`/`50vw`/`90vw`), so on a phone a `simple` modal collapsed to ~135px. It now resolves to `min(<target px>, calc(100vw − 32px))` — the tier's px width on desktop, and near-full-width (16px gutter each side) on mobile. Height caps (`75/80/90vh`) are unchanged. `modalMaxWidth` stays exported as the per-tier desktop reference (no longer used to compute the width). (#91)

## 0.47.0 — 2026-09-15
### Added
- **Modal — two types + viewport size cap.** Reworked the shared Modal to the DS V3 spec: **two types** (a Confirmation modal — five contexts default/confirm/warning/info/danger with a status icon, copy, a Learn-more link and Cancel/Apply — and an Action modal — a task surface with an optional divider), each **capped to the viewport in both axes** so it never grows bigger than the screen. New `modalWidth(size)`, `modalStyles(size)`, `modalMaxWidth`, `modalMaxHeight` exports on `@ahaslides-product/design/modal-theme` keyed by three sizes — **simple 504·35vw·75vh · complexity 720·50vw·80vh · rich 1280·90vw·90vh**: `width={modalWidth('complexity')}` caps the width (`min(target px, vw)`, stays centred) and `styles={modalStyles('complexity')}` caps the height (`auto` up to the cap, then the body scrolls while title + footer stay pinned). Every modal opens as a real overlay — portals to `<body>`, an always-on mask, page scroll locked, closes on mask/Esc/✕ (a destructive confirmation overrides to non-mask-closable). The Learn-more link is a `--aha-text-link` anchor whose external-link glyph shows only when it leaves AhaSlides. The doc playground **triggers each variant with a button**, and the HTML/React/Vue snippets show both types. (#89)

## 0.46.1 — 2026-09-14
### Fixed
- **Landing area links 404** — the Landing index page linked to its block pages with a doubled `landing/landing/<slug>/` path (it rendered as if hosted at the site root, one level too shallow), so every block link and the page's own nav/fonts 404'd. The index now resolves links from its real `landing/` depth. (#88)

## 0.46.0 — 2026-09-14
### Added
- **Landing basics** — the framework-free landing tier gains its core marketing blocks alongside Hero: **Section container** and **Grid** (Layout), **Button** and **Link** (Elements), and the **Spacing** and **Fonts** Foundations-usage references. Each is a paste-and-run `landing/<slug>.json` bound entirely to the shared `--aha-*` tokens (no second brand source): Button follows the product `aha-button` contract in an XL marketing register, Spacing/Fonts reference the shared scales, and every value was grounded against the live AhaSlides Webflow homepage (see `landing/SCAN.md`). (#87)

## 0.45.0 — 2026-09-14
### Added
- **Landing** — a new top-level area for the AhaSlides landing/marketing sites, alongside Components and Patterns. It shares Foundations (the same `--aha-*` tokens) and is a separate tier from the product-app Patterns: framework-free, paste-and-run HTML+CSS marketing sections a landing builder drops into Webflow/WordPress/a static page. One artifact per block in `landing/<slug>.json`; the generator emits the scoped sidebar, a gallery, a doc page per block, and the `landing.llms.txt` / `landing.agent.json` feeds. First block: **Hero**. (#87)
- **Type & spacing tokens as CSS vars** — the canonical `size`, `space`, `weight`, `lineHeight`, `letterSpacing`, `controlHeight` and `breakpoints` scales are now emitted as `--aha-*` custom properties (e.g. `--aha-size-h1`, `--aha-space-24`, `--aha-weight-semibold`, `--aha-radius-marketing`, `--aha-font-secondary`), so framework-free surfaces and components can bind every dimension to a token instead of hardcoding px. Values are derived from `tokens.canonical.json`; no new numbers authored. (#87)

## 0.44.0 — 2026-09-14
### Added
- **Screen-lint** — a mechanical composition gate (`node screen-lint.mjs --surface=product|canvas <files>`; `./screen-lint` export, `npm run lint:screen`, now in `npm run check`). It's the **static companion to the anti-slop self-judge**: before the binary judge, it hard-fails the zero-interpretation defects on a consumer screen — raw hex / off-scale radius / off-scale font-weight / gradient fills / icon-only-without-an-accessible-name (product surface); hardcoded colour / sub-16px + viewport-unit fonts (canvas surface). `--surface` routes the world first, like the judge. Statically-undecidable rules (token-layer contrast, copy, right-instrument) stay the self-judge's job. (#86)
### Changed
- **Type scale** — weights are now **400/600 only**; `700` is dropped from the product type scale (Display uses 600, not Bold). The one remaining literal `font-weight:700` is the measured `aha-tabs` primary-tab label, grandfathered pending re-measure; screen-lint hard-fails any other weight. (#86)
### Fixed
- **Badge snippet** — the paste-and-run example set a raw `background:#fff`; now bound to `var(--aha-bg-container,#fff)` (the first defect screen-lint caught). (#86)

## 0.43.2 — 2026-09-14
### Fixed
- **Foundations · Typography** — the ROLE column specimen font-size was capped at 28px, so display1/display2/h1/h2/h3/h4 all rendered at the same size and the type scale looked flat; each role now renders at its true token size (display1 64px down to bodySM 12px). (#85)

## 0.43.1 — 2026-09-11
### Fixed
- **Tooltip** — a full-sentence `?` help hint now wraps inside the bubble's 240px max-width instead of laying out as one long `nowrap` line that overflowed and got clipped near a panel edge (the settings-label help tooltip, e.g. on Mode field, was getting cut off). (#83)
### Changed
- **Mode field** — the active option's body now renders as de-emphasised help text (secondary colour, regular weight, 13/20) so the field label stays the primary line; and its `?` help tooltip now opens below the label (`bottom-start`) so it clears the panel top instead of being clipped above. (#83)

## 0.43.0 — 2026-09-11
### Added
- **Anti-slop consumer feeds** — the DS now ships the official AhaSlides build→judge→fix loop to any agent that connects: `anti-slop.md` + `anti-slop.agent.json` carry, per surface, the composition rules and a **binary self-judge** (PASS/FAIL each, no partial credit), and `llms.txt` points a connecting agent at them first. A new **App shell** guideline closes the screen-composition gap (real brand mark, no dead placeholders, deliberate hierarchy, tokenised chrome, animated nav state). Criteria live in the DS-owned `anti-slop/criteria.json` — the DS is the single source of truth for anti-slop, seeded once from the aha-design skills. `standards.mjs` gains a consistency gate over the store + feeds. (#82)

## 0.42.0 — 2026-09-11
### Added
- **Loader** — `<aha-loader>`, the full-surface branded loading *screen* shown while a new environment boots (workspace → editor, editor → presenting). Fills its container on a white ground and cycles five branded illustration tiles with a staggered soft-flow (fade + slide + unblur in, hold, out). Reuses the shared `<aha-illustration>` spot art (`loader-award`/`-wand`/`-plane`/`-ballot`/`-chart`, added to the illustration registry), themed by `--aha-*` tokens, `role="status"`, and stills under `prefers-reduced-motion`. Lands under **Patterns · AhaSlides surfaces**. Distinct from `<aha-spin>` (the inline indeterminate spinner). (#78)

## 0.41.0 — 2026-09-11
### Changed
- **Screen heading** — the page title now renders via the reused `<aha-breadcrumb size="page-title">` instead of a hand-rolled `<h1>`, for BOTH a plain `title` (a single-crumb page title) and a `breadcrumb` trail (the heading with its ancestor path in front) — so a sub-page header is now a real page-title-size heading, not a 13px default trail. The DS's single page-heading owner is the breadcrumb; the only local `<h1>` left is the accent-name greeting (`highlight`), which the breadcrumb can't express. No API change. (#81)

## 0.40.0 — 2026-09-11
### Added
- **Settings list — `visible_if` conditional visibility (the Shopify model).** A schema row can declare a trigger: it is shown ONLY when its trigger setting is on and hidden when off, updating live as the trigger changes. Structured form `visibleIf: { key, equals?, in?, not? }` or the Shopify string `visible_if: "{{ settings.<key> }}"` / `"{{ settings.mode == 'advanced' }}"`. A dependent row renders NESTED — indented 24, bound tighter to its parent, de-emphasised label — and when hidden is `display:none` so it leaves no phantom gap (SETTINGS-07/14/19). (#80)

## 0.39.1 — 2026-09-11
### Changed
- **Settings — setting label weight.** A member setting's label is now regular (400), not semibold — only the group/section header (`aha-section-header` / `aha-setting-group` / `settings-list` group header) carries weight (600). Restores the header-vs-member hierarchy (SETTINGS-37) on `aha-setting-row` and `<aha-settings-list>` rows. (#79)
