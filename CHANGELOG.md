# Changelog

All notable changes to `@ahaslides-product/design`, **newest first**.

**The rule:** every merge adds one entry here **and** bumps `version` in `package.json`.
The top entry's version MUST equal `package.json` → `version` — `standards.mjs` enforces it, so a
PR that forgets either goes red. The `v<version>` release tag (what `npm publish` ships) matches too.

**Format** — one entry per version:

```
## X.Y.Z — YYYY-MM-DD
### Added        ← new component / prop / token / export
### Changed      ← behaviour or API change to something that already shipped
### Fixed        ← bug / gate / doc fix, no API change
### Removed       ← a removed export / component / token
- one short bullet per change, written for a consumer; link the PR: (#123)
```

Include only the sections you touched. **Versioning is [SemVer](https://semver.org)** — pre-1.0:
an additive change (new component/prop/token) bumps **MINOR** (`0.x.0`); a fix with no API change
bumps **PATCH** (`0.0.x`); a breaking change also bumps MINOR until 1.0, and is called out in the bullet.

## 0.14.0 — 2026-09-10
### Added
- **Progress** (`aha-progress`) — a determinate line bar; a persistent fill node animates its width on the motion tokens, `status` recolours it (success/warning/error). Import `@ahaslides-product/design/aha-progress`.
- **Result** (`aha-result`) — a full-block outcome state (success/error/info/warning/404) with a DS `<aha-icon>` glyph, title, subtitle and a `slot="extra"` for actions. Import `@ahaslides-product/design/aha-result`.
- **Skeleton** (`aha-skeleton`) — a loading placeholder (text/title/button/avatar) with an opacity-pulse shimmer (no gradient fill). Import `@ahaslides-product/design/aha-skeleton`.
- **Spin** (`aha-spin`) — a brand-coloured pure-CSS loading spinner (small/default/large) with an optional tip. Import `@ahaslides-product/design/aha-spin`.
- **Status badge** (`aha-status-badge`) — the reusable form of the status-badges pattern: a lifecycle pill (draft/published/closed/archived) with a coloured dot plus a text label and `role="status"`. Import `@ahaslides-product/design/aha-status-badge`.
- **CSAT** (`aha-csat`) — the shared binary thumbs-up/down satisfaction prompt from the feedback pattern; emits a `rate` event with a stable `source`, thumbs from the DS icon library. Import `@ahaslides-product/design/aha-csat`.
- **Settings list** (`aha-settings-list` + `aha-settings-item`) — the reusable form of the settings pattern: spacing-only rows (label left, control right) that compose existing DS controls via a `control` slot; no divider lines or boxes. Import `@ahaslides-product/design/aha-settings-list`.
- **Popconfirm** (`popconfirmTheme`) — the composite inline-confirmation popover: a shared antd v6 / ant-design-vue theme (radius-8 popover, primary confirm, #E3E3E3 cancel border). Import `@ahaslides-product/design/popconfirm-theme`.
### Changed
- **Settings list** (`aha-settings-list`) — built out into a schema-driven settings surface. Set `.schema` (`{ sections:[{ label, description?, rows:[{ key, label, description?, control }] }] }`) and it renders the rows, instantiating each `control` from an existing DS element (`aha-switch` / `aha-checkbox` / `aha-input` …) and emitting a `change` event `{ key, value, name }`. The by-hand slot form is unchanged. (#40)
### Fixed
- **Progress** (`aha-progress`) — now exposes `role="progressbar"` with `aria-valuemin`/`aria-valuemax`/`aria-valuenow` (and `aria-valuetext`) synced to `percent`, so a quiz-timer bar is announced to assistive tech. `percent`/`status` are now `observedAttributes` with an `attributeChangedCallback` that re-syncs the ARIA state, so an external attribute change can't desync the announced value. (#40)
- **CSAT** (`aha-csat`) — the thumbs are toggle buttons but exposed no selection state to assistive tech (only a `.selected` CSS class). They now carry `aria-pressed`, synced to `value` in `_update()`, so a screen reader announces which thumb is chosen. (#40)

## 0.13.0 — 2026-09-10
### Added
- **Alert** (`aha-alert`, leaf) — an inline contextual banner (info / success / warning / error) with an optional bold heading and a `closable` dismiss that animates out on a persistent node and emits a composed `close`. Status glyph summoned by name from the DS icon library; tones bound to the DS V3 semantic families. Ships HTML / React / Vue. (#PRO38-8)
- **Carousel** (`carousel-theme`, composite) — a swipeable set of slides through the shared `carouselTheme` (brand active dot, radius-8 panels), keeping antd's built-in slide motion. Ships HTML / React / Vue. (#PRO38-8)
- **QR code** (`qr-code-theme`, composite) — a scannable code through antd's QRCode + the shared `qrCodeTheme`, ink modules on white in a 1px radius-8 DS frame. Ships HTML / React / Vue. (#PRO38-8)
- **Toast** (`toast-theme`, composite) — antd's imperative `message` API themed once by the shared `toastTheme` (white pill, radius 8, ink text), keeping antd's enter/leave motion. Ships HTML / React / Vue. (#PRO38-8)
- **Notification** (`notification-theme`, composite) — antd's imperative `notification` API themed by the shared `notificationTheme` (white 384-wide card, radius 8, ink title + description). Ships HTML / React / Vue. (#PRO38-8)
- **Modal** (`modal-theme`, composite) — a focused blocking dialog through the shared `modalTheme` (white content, radius 8, ink 18/600 title), keeping antd's built-in motion. Ships HTML / React / Vue. (#PRO38-8)
- **Drawer** (`drawer-theme`, composite) — a slide-in side panel through the shared `drawerTheme` (white panel, ink title, brand actions), keeping antd's built-in slide motion. Ships HTML / React / Vue. (#PRO38-8)
### Fixed
- **Toast / Notification Vue snippets** — swapped the static `message.success()` / `notification.open()` calls for ant-design-vue's `useMessage()` / `useNotification()` hooks (with the returned `contextHolder` rendered inside `<a-config-provider>`), matching the React snippets. The static calls ignored `<a-config-provider>` theming, so a consumer wrapping them in the DS theme shipped un-themed toasts/notifications on Vue. (#PRO38-8)
- **Alert** (`aha-alert`) — the banner was hardcoded `role="alert"` (assertive) for every tone, so informational/success alerts rudely interrupted a screen reader. It now uses `role="alert"` only for `error`/`warning` and `role="status"` (polite) for `info`/`success`. (#37)

## 0.12.0 — 2026-09-10
### Added
- `aha-card` — a bordered surface that groups related content behind a title, with an optional `hoverable` lift that animates on the shared motion tokens. Shared Lit web component, consumed unchanged by React and Vue. (#38)
- `aha-list` — a bordered, evenly-divided column of uniform rows; each light-DOM child becomes a row and rows highlight on hover. Shared Lit web component. (#38)
- `aha-collapse` — a single expandable panel whose `open` state animates the body height + chevron on a persistent node (no subtree rebuild, so the transition always fires). Emits a composed `toggle` event. (#38)
- `aha-descriptions` — a read-only label/value grid summarising one entity's fields; each child supplies a row via its `label` attribute. Shared Lit web component. (#38)
- `aha-statistic` — a single headline number with a caption, optional prefix/suffix, and an up/down trend colour. Static display marker. (#38)
- `aha-empty` — the placeholder for a surface with no data: a line-art illustration, a caption slot, and an optional action slot. Shared Lit web component. (#38)
- `aha-image` — a framed image with rounded corners and a hover mask that scales the picture and fades in a preview label, both on the shared motion tokens. Shared Lit web component. (#38)
### Fixed
- `aha-image` — the hover mask now keeps its promise: clicking (or Enter/Space on) the frame opens a real modal preview dialog (role=dialog, aria-modal, focus moved in and restored on close), dismissed by Escape, a close button, or a backdrop click. The overlay is a persistent node faded/scaled in on the shared motion tokens. (#39)
- `aha-collapse` — `open` is now an observed attribute, so setting it as a controlled prop keeps the header's `aria-expanded` in sync with the visuals — a screen reader no longer hears a frozen state. (#39)

## 0.11.0 — 2026-09-10
### Added
- `aha-rate` — a star rating (leaf web component) for capturing or displaying a score out of `max`. Selection and hover-preview toggle a class on persistent star nodes, so the fill animates via the shared motion tokens. (PRO38-8)
- `aha-color-picker` — a leaf colour picker: a trigger swatch opening a persistent panel of preset colours (the brand ramp by default, overridable via `swatches`). (PRO38-8)
- `aha-uploader` — a leaf click-or-drag file drop zone; hover and drag-over animate the persistent zone's border and tint. Emits the selected `File[]`. (PRO38-8)
- `aha-avatar` — a leaf identity marker showing a photo (`src`) or the initials of `name` on a tinted ground, in circle or square shape. (PRO38-8)
- `aha-popover` — a leaf click-triggered floating panel for rich content, closing on outside-click and Escape; fade + lift animate on a persistent panel. (PRO38-8)
- `aha-tabs` — a leaf line-style tab bar over slotted panels (each child labelled via `data-tab`); active colour and underline animate on persistent tab nodes. (PRO38-8)
- `aha-segmented` — a leaf single-choice segmented control; selection slides a persistent thumb via the shared motion tokens. (PRO38-8)
### Fixed
- `aha-popover` — the `document` `keydown` (Escape) listener is now removed in `disconnectedCallback`, alongside the outside-click one, so it no longer leaks across mount/unmount. (#36)
- `aha-tabs`, `aha-segmented`, `aha-rate` — full keyboard contracts: roving tabindex, ArrowLeft/Right (and Home/End) to move and select, with `aria-selected`/`aria-checked` and (tabs) `aria-controls`/`role="tabpanel"` kept in sync with the rendered state. (#36)
- `aha-tabs`, `aha-segmented`, `aha-rate` — now `observedAttributes:['value']` + an `attributeChangedCallback` that re-syncs the aria state, so a controlled (framework-bound) `value` no longer desyncs the announced state from the visuals. (#36)
- `aha-color-picker` — the swatch palette is now `role="group"` (a set of labelled buttons) rather than `role="listbox"`, matching its keyboard model (each swatch a tab-stop) instead of announcing a roving widget it did not implement. (#36)
- `aha-color-picker` — each swatch button now carries `aria-pressed`, synced to the current value in `_paint()`, so a screen reader can tell which colour is selected (previously only a `.on` CSS class changed). (#36)

## 0.10.0 — 2026-09-10
### Fixed
- **Radio** (`aha-radio`) — implement the WAI-ARIA radiogroup keyboard contract: the host is now the accessible `role="radio"` with synced `aria-checked`, one tabbable radio per group (roving tabindex), Arrow keys move to and select the next/previous option (wrapping), and Space selects the focused option. Snippets wrap the set in a `role="radiogroup"` container. (#35)
### Added
- **Radio** (`aha-radio`) — shared leaf web component: a mutually-exclusive choice for a small set. Radios sharing a `name` clear their siblings on select; the inner dot scales in on the shared motion tokens on a persistent node. Importable at `@ahaslides-product/design/aha-radio`. (#38)
- **InputNumber** (composite) — bounded numeric field with steppers, min/max, step and precision. Themed by the shared `inputNumberTheme` (`@ahaslides-product/design/input-number-theme`). (#38)
- **Textarea** (composite) — multi-line free text with autosize and char count, on Ant's `Input.TextArea`. Themed by the shared `textareaTheme` (`@ahaslides-product/design/textarea-theme`). (#38)
- **AutoComplete** (composite) — free-text input with type-ahead suggestions, on Ant's Select internals. Themed by the shared `autocompleteTheme` (`@ahaslides-product/design/autocomplete-theme`). (#38)
- **TimePicker** (composite) — hour/minute/second picker on Ant's DatePicker internals, 12/24-hour and minute-step. Themed by the shared `timePickerTheme` (`@ahaslides-product/design/time-picker-theme`). (#38)
- **Slider** (composite) — drag-to-set value/range with marks. Brand track + handle, gray-30 rail. Themed by the shared `sliderTheme` (`@ahaslides-product/design/slider-theme`). (#38)
- **Steps** (composite) — ordered-progress indicator for wizards/onboarding, horizontal or vertical. Brand current/finished step. Themed by the shared `stepsTheme` (`@ahaslides-product/design/steps-theme`). (#38)

## 0.9.1 — 2026-09-10
### Fixed
- In-app navigation now renders live demos without a reload. A demo page registers its `<aha-*>` element from a `<script type="module">` that lives inside `<main>`, and a script moved into the page via `DOMParser`/`replaceWith` never executes — so after a swap the destination element was never defined and its demos stayed blank until a full reload (the `0.8.1` regression). The swap now re-creates and runs the swapped-in `<main>`'s scripts (after `pushState`, so relative `import`s resolve), with a one-time idempotent shim on `customElements.define` so re-registering an already-defined element on revisit is a safe no-op instead of an "already defined" throw. (#43)

## 0.9.0 — 2026-09-10
### Added
- **Divider** — a thin separator: a full-width rule, an optional centred/left/right label, or a vertical hairline; `dashed` variant. Shared Lit leaf, bound to the `border`/`text-secondary` tokens. (PRO38-8)
- **Flex** — a flexbox container with the DS gap scale baked into `gap` (small/middle/large = 8/16/24, or a raw px), plus direction/align/justify/wrap. Shared Lit leaf, layout-only. (PRO38-8)
- **Grid** — a CSS-grid container: a fixed `columns` count or a responsive `min` auto-fit, with the DS `gap` scale. Shared Lit leaf, layout-only. (PRO38-8)
- **Space** — an even, DS-scale gap between a small inline set of items (`size` small/middle/large or a raw px), row or vertical. Shared Lit leaf, layout-only. (PRO38-8)
- **Breadcrumb** — an ancestor trail ending in the current page; links animate on hover via the motion tokens, the separator is the DS `system-caret-right` glyph, and it emits a composed `navigate` event. Shared Lit leaf. (PRO38-8)
- **Dropdown** — a trigger that reveals a floating action list; open/close animates on a persistent panel via the motion tokens, the caret rotates, and it closes on outside-click/Escape, emitting a composed `select`. Shared Lit leaf. (PRO38-8)
- **Menu** — a vertical list of selectable options; the selected row is brand-tinted and hover/selection animate on persistent nodes (a class toggle, never a rebuild), emitting a composed `select`. Shared Lit leaf. (PRO38-8)
- **Pagination** — prev / numbered pages with ellipsis / next; the current page is brand-filled, hover animates via the motion tokens, prev/next use the DS caret glyphs, and it emits a composed `change`. Shared Lit leaf. (PRO38-8)
### Fixed
- **Breadcrumb** — a link click now calls `preventDefault()` before emitting `navigate`, so a real `<a href>` no longer races the SPA event with a native full-page reload; the trail renders as a semantic `<ol>`/`<li>` with `aria-current="page"` on the current item. (PRO38-8)
- **Menu** / **Dropdown** — implemented the full `role="menu"` keyboard contract: roving `tabindex`, arrow-key focus movement, Home/End, Enter/Space to activate, Escape to close and return focus to the trigger (Dropdown), and `aria-checked` (Menu) / `aria-expanded` kept in sync with state. (PRO38-8)

## 0.8.1 — 2026-09-10
### Changed
- Docs site now navigates in-app: clicking a sidebar/top-nav/card link fetches the target and swaps only the `<main>` pane instead of doing a full page reload, so the header and left nav (and its scroll position) stay put — no white flash, no scroll reset. Same-area moves keep the sidebar node and just re-tint the active item; switching area swaps the sidebar too. Progressive enhancement: `pushState` + `fetch` with a thin top progress bar (animated via `transform`, not layout), `popstate`/back-forward support, `#anchor`-aware scroll, and a hard fallback to a normal page load if the fetch fails or the browser lacks the APIs. Respects `prefers-reduced-motion`. (#42)
- Docs perf: in-app navigation now prefetches a page on link hover/focus (cached, deduped) so the click swaps instantly. (#42)
- Docs readability: prose measure tightened from 82ch to 72ch (closer to the ideal reading line length) and the page title snapped from an off-scale 30px to 32px on the DS V3 heading scale. (#42)

## 0.8.0 — 2026-09-10
### Added
- Accessibility is now gated. `qa.mjs` proves a component renders + animates but nothing about its a11y, so interactive components could ship gate-green yet be unusable by keyboard/screen-reader (PRO38-8 review). `standards.mjs` now scans element source and **hard-fails a new component** on: a **roving-widget role** (`radio`/`tab`/`menuitem`/`option`/…) declared with no arrow-key navigation; a **`document`/`window` listener** added on connect with no matching `removeEventListener` on disconnect (a mount/unmount leak); and a dynamic **`aria-*` state** set imperatively without `observedAttributes` (so an external attribute change desyncs the announced state — the controlled-`collapse` case). It also flags a **static imperative overlay** in a snippet (`message.success()`/`notification.open()`/`Modal.confirm()`) that renders outside `ConfigProvider` un-themed — use the `useMessage`/`useNotification`/`useModal` hook. Per-line opt-out `ds-lint-allow: a11y (why)`; `A11Y_DEBT` grandfathers pre-gate debt (empty today — the gate is fully hard). (#41)

## 0.7.1 — 2026-09-09
### Fixed
- Dead-transition bug cleared on every grandfathered leaf: `aha-switch`, `aha-checkbox`, `aha-tooltip` and `aha-paywall` now build their shadow subtree **once** and mutate persistent nodes on a state change, instead of re-rendering the subtree in `attributeChangedCallback`. The state attribute drives `:host([checked])`/`:host([open])` CSS on the live `.knob`/`.box`/`.bubble`, so the declared transition finally animates on toggle (it was dead — a freshly-rebuilt node has no "from" value). `aha-checkbox` bakes both glyphs and toggles them with CSS (no subtree swap); `aha-paywall` gains the house `--aha-motion-mid`/`--aha-ease-in-out` transition on its Upgrade CTA. Behaviour, events, ARIA and keyboard unchanged; previews kept in sync. Verified mid-interpolation in headless Chrome (knob at ~3px of its 0→20px travel shortly after toggle). (#34)
### Changed
- `MOTION_DEBT` in `standards.mjs` is now **empty** — with every grandfathered leaf restructured, the motion gate (snap / bare-literal / dead / out-of-sync / bounce) is fully hard with no exceptions. (#34)

## 0.7.0 — 2026-09-09
### Added
- Icon library is now gated: `standards.mjs` proves every `<aha-icon name="…">` a component references (in its source, snippets, preview, or contract) resolves to a real glyph in `icons/registry.json` — the published [icon gallery](https://ahaslides-product.github.io/ahaslides-design/icons/index.html) — and flags an inline `<svg>` glyph in element source as a library bypass (genuine sub-glyph chrome opts out per-line with `ds-lint-allow: svg`). A typo or non-DS icon now fails the gate instead of rendering a runtime error box. (#30)

## 0.6.0 — 2026-09-09
### Changed
- Motion checks now **hard-fail a new component** (they were warn-first). A leaf can't merge with a snap, a bare-literal timing, a dead transition, an out-of-sync preview, or a bounce easing. The only grace is `MOTION_DEBT` in `standards.mjs` — a small, explicit allow-list of components that shipped a defect before the gate existed (`aha-switch`/`aha-checkbox`/`aha-tooltip` = dead, `aha-paywall` = snap), kept WARN until restructured; it shrinks to zero as Fleet fixes them (PRO38-5). (#33)
- Dead-transition detection broadened so a new component can't dodge it by swapping the rebuild mechanism (`innerHTML`/`replaceChildren`/`render()`, via `attributeChangedCallback` **or** a property setter). Scoped to the toggle-states that pair with `:host([x])` animation, to avoid false-positives on fields like Input. (#33)

## 0.5.0 — 2026-09-09
### Changed
- `aha-tooltip` pop no longer uses a bounce/overshoot easing — it now decelerates on `--aha-ease-out` (AntD-faithful; real AntD tooltips don't bounce). `lib/` + the preview updated together. (#32)
### Removed
- `--aha-ease-out-back` token (the overshoot curve) — unused after the tooltip fix, and overshoot easing is now disallowed. (#32)
### Added
- Standards gate: a **5th motion check** — bounce/elastic easing. Any `cubic-bezier` whose control-point Y leaves `0–1` overshoots ("back"/elastic) and is flagged; use an exponential ease-out (`--aha-ease-out`/`--aha-ease-in-out`). Turns the craft-floor "no bounce" heuristic into an enforced DS rule. (#32)

## 0.4.1 — 2026-09-09
### Fixed
- Button docs (`button.html.txt`/`.react.txt`/`.vue.txt`/`.preview.html`): the icon-slot examples (add/close/more) were hand-rolled inline `<svg>` — a direct violation of the icon contract's "call by name, never inline SVG" rule, and inconsistent with the Icon component's own docs. Swapped to `<aha-icon name="system-plus|system-x|system-dots-three">`. (#PR)

## 0.4.0 — 2026-09-09
### Added
- Standards gate: a **motion rule** on leaf sources, so a dropped transition can't pass. It flags four ways motion gets lost — (1) an interactive element with no `transition` (snap), (2) a `transition` timed with a bare literal instead of a motion token (drift), (3) a **dead** transition: the element rebuilds its subtree via `innerHTML=` on the state attribute the transition animates, so it never fires **even with correct CSS** (why the Switch didn't animate on click after its motion was re-tuned), and (4) an **example out of sync**: `parts/<slug>.preview.html` (the copy `qa.mjs` measures) is missing a transition the element ships, so the rendered example shows different motion than the component. Escape hatch `ds-lint-allow: motion (why)`. Ships **warn-first** behind `MOTION_HARD_FAIL`; flips to hard fail once the re-rendering leaves (switch/checkbox/tooltip) are restructured. Mirrors the colour/radius enforcement. (#27)
### Changed
- AGENTS / PRINCIPLES / CONTRIBUTING: motion is now a documented house non-negotiable — animate interactive states via `--aha-motion-*` / `--aha-ease-*`, never snap, never a bare literal, and keep the transition on a persistent node (don't re-render the subtree on a state change). (#27)

## 0.3.0 — 2026-09-09
### Added
- `aha-input` `size` prop (`sm` 24 · `md` 32 · `lg` 40), matching the measured DS V3 field scale; radius stays 8. (#PR)
- Motion token layer: `--aha-motion-fast/-mid/-slow` and the Ant eases `--aha-ease-in-out`, `--aha-ease-out`, `--aha-ease-in-out-circ`, `--aha-ease-out-back`, emitted from `generate.mjs` into the `--aha-*` variables. (#PR)
- Changelog is now surfaced in the generated DS: a browsable **Changelog** page (`/feeds/changelog.html`, linked from the header version badge), a fetchable raw feed at `/CHANGELOG.md`, the current version + changelog URL in `llms.txt` and `design.md` headers, and the full log appended to `llms-full.txt`. Agents and humans both see what changed per release. (#23)
### Changed
- DS V3 conformance: field default height corrected 36 → 32 across Input, Select, Form and DatePicker (controlHeight root 32). (#PR)
- `aha-switch` aligned to the measured DS V3 toggle: track 44×22, 1px `#D4D4D4` border, off `#F7F7F7`, disabled 40% opacity. (#PR)
- `aha-tag` radius 6 → 4, matching the measured DS V3 tag (`--aha-radius-xs`). (#PR)
- Leaf transitions (input, tag, badge, switch, tooltip, button, checkbox) re-tuned to Ant's motion system: controls `.2s` ease-in-out, switch `.2s` ease-in-out-circ, tooltip pop `.2s` ease-out-back; `lib/` and the inline `parts/*.preview.html` copies kept in sync. (#PR)
### Fixed
- `tag.preview.html` had drifted to no transition at all — restored and matched to `lib/aha-tag.js`. (#PR)

## 0.2.1 — 2026-09-09
### Changed
- Components nav: the planned-inventory catalog now spans the full AntD v6 taxonomy (General / Layout / Navigation / Data Entry / Data Display / Feedback) merged with the AhaSlides surfaces (Paywall, Status badge, CSAT, Settings list) — 57 planned, live pages still from `contracts/`, the rest greyed "soon". Datepicker nav slug aligned to its shipped contract. (#23)

## 0.2.0 — 2026-09-09
### Added
- Changelog + version rule: every merge now adds a dated entry to `CHANGELOG.md` and bumps `package.json` → `version`. `standards.mjs` gates it (top entry must match the package version, be dated, and carry ≥1 bullet).

## 0.1.0 — 2026-09-08
### Added
- Initial design system: `--aha-*` tokens, the `<aha-icon>` call-by-name registry, the `aha-checkbox` / `aha-button` / `aha-paywall` leaf elements, the shared DataTable composite (antd theme), the generated agent feeds in `dist/`, and the standards + render gates (`npm run check`).
