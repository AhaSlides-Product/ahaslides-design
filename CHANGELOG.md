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

## 0.145.0 — 2026-10-09
### Added
- `<aha-button variant="secondary-deck">`: a white-filled button whose edge and label take the dark text ink (`--aha-text-default`, #1A1A1A, 16.7:1 on white) on every deck, light or dark, never the deck accent; hover is a 5% ink wash, pressed 10%, focus a 2px ink ring, disabled an ink-20% edge and ink-45% label. No new token. At `size="touch"` it is the audience phone's secondary action, the counterpart of the Submit button. `<aha-audience-image-upload variant="button">` now uses it, full width (#209)
- `--aha-deck-accent-text` and `--aha-deck-accent-text-hover` deck variables: the accent deepened until text on white reads at 4.5:1
- `--aha-deck-surface-deep` deck variable (and `audienceSurfaceDeep()`): the deep panel, the same as `--aha-deck-surface` on a light deck and Deep Space at 80% on a dark one
- `<aha-button variant="tertiary-deck">`: the audience phone's tertiary action at `size="touch"`. No edge, transparent fill, label and icon in the deck ink (`--aha-deck-ink`); ink 5% on hover and 10% pressed, ink 55% focus ring, ink 45% disabled. Text only, icon + text and icon only (48 x 48, `aria-label` required); `secondary-deck` takes the same three forms. Both are listed in the audience library with when-to-use lines (primary `aha-audience-submit`, secondary `secondary-deck`, tertiary `tertiary-deck`). Additive: every existing variant renders unchanged; to revert, delete the `tertiary-deck` rules in `lib/aha-button.js` and the two library entries (#209)
- `<aha-button>` hooks `--aha-button-primary-border` (primary edge, default the fill) and `--aha-button-focus-outline` (outline on keyboard focus, default none); with neither set nothing changes
### Changed
- Audience components are re-specified: `<aha-audience-chip>` is 48px high with 8px corners, a 1px edge at ink 20% (also on hover), the deep panel on a dark deck and the browser focus ring; `<aha-scale-slider>` centres the readout above an 8px rail with 2px corners, inset 16px from the end captions, step label weight 600, captions on a 16px line; `<aha-audience-image-upload>` area is a 2px dashed ink-20% edge with 8px corners on the deep panel with a backdrop blur, a 14px hint, and its compact button is full width; `<aha-audience-submit>` has a 1px ink-10% edge in every state and a 2px focus outline 1px off the button; `<aha-waiting-for-host>` has 8px gaps and a 14px sub-line; `<aha-submitted-card>` has a 16px gap, 8px between its texts, the deep panel, a 14px subtitle and a pip on an ink-10% wash with the glyph in the 65% ink (#209)
- `<aha-swipe-card>` has 16px padding (was 24) and its `hint` is a 14px line below the statement with no arrows (was a 12px line above it between two arrows), so the card is 90px tall with a hint
- Contracts, conformance expectations, library entries and examples for these components match the new values
- Audience guidance matches the shipped components: rule `slider-rail-flush` and criterion C20 allow an equal intended rail inset (`<aha-scale-slider>` insets 16px) and only fail an uneven leftover Ant margin; rule `slider-fill-hairline`, C18, C32 and `border-weight` limit the one 10% value to tracks and panel hairlines and name the 20% edges (chip, dashed drop area, answer-row radio / checkbox control) (#209)
### Fixed
- The loading spinner in `<aha-button>` renders at its intended 16px. Its size shared a selector list with an invalid `::slotted(...) svg` selector, so the whole rule was dropped and the spinner measured 131px and stretched the host. This fixes every `<aha-button loading>` (and so `<aha-audience-submit>` while busy), not only the audience Submit button (#209)
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

