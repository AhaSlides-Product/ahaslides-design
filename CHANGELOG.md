# Changelog

All notable changes to `@ahaslides-product/design`, **newest first**.

**The rule:** every merge adds one entry here **and** bumps `version` in `package.json`.
The top entry's version MUST equal `package.json` → `version` — `standards.mjs` enforces it, so a
PR that forgets either goes red. The `v<version>` release tag (what `npm publish` ships) matches too.
The gate also rejects an unfilled `(#PR)` placeholder in the top entry: link the **real** PR number.

**Format** — one entry per version:

```
## X.Y.Z — YYYY-MM-DD
### Added        ← new component / prop / token / export
### Changed      ← behaviour or API change to something that already shipped
### Fixed        ← bug / gate / doc fix, no API change
### Removed       ← a removed export / component / token
- one short bullet per change, written for a consumer; link the real PR: (#123) — never a bare (#PR)
```

Include only the sections you touched. **Versioning is [SemVer](https://semver.org)** — pre-1.0:
an additive change (new component/prop/token) bumps **MINOR** (`0.x.0`); a fix with no API change
bumps **PATCH** (`0.0.x`); a breaking change also bumps MINOR until 1.0, and is called out in the bullet.

## 0.34.0 — 2026-09-11
### Added
- **Breadcrumb** — `size="page-title"` turns the current crumb into the page heading (a real `<h1>`, `heading-level` picks h1–h6): a single-item trail is the standalone page title (24/600), a longer trail is that heading with its ancestor path in front (18/600). Plus a `size="mini"` (12/18) compact scale. This is now the DS page-title — reach for it instead of a hand-rolled `<h1>`; the breadcrumb *is* the page title. (#PR)

## 0.33.1 — 2026-09-11
### Fixed
- **Docs site** — CDN-React composite previews (TimePicker, Select, Table, Modal, Form, and the other `text/babel` demos) rendered blank when reached via in-app (PJAX) navigation, only appearing after a full page reload. The swap now re-runs each preview's external scripts in order and re-triggers Babel so the JSX transpiles on navigation, not just on reload.

## 0.33.0 — 2026-09-10
### Removed
- **Button** — dropped the plan / brand tone variants `essential`, `pro`, and `branding`. `variant` is now `primary | secondary | tertiary | link | danger | success | positive | primary-alt | text | text-link`. Plan gating belongs to the Paywall crown badge / Badge `plan` families, not a button tone. **Breaking.** (#68)

## 0.32.0 — 2026-09-10
### Added
- **Illustration** — new `<aha-illustration name="…" size="…">` element + a call-by-name library of 20 multi-colour spot illustrations (empty states, onboarding, plan tiers, offers, mascots) from a shared registry, sized by a single edge with aspect ratio preserved (`./illustrations` export). (#67)
- **User info** — new leaf `<aha-user-info>`: an avatar + name row with an optional email, reusing the shared `<aha-avatar>`. (#67)
- **Screen heading** — new leaf `<aha-screen-heading>`: a product page header — a title/greeting (with an optional brand-accent `highlight`) or a `›` breadcrumb trail (reusing `<aha-breadcrumb>`), plus a right-hand `actions` slot for `<aha-button>`s; responsive desktop/tablet/phone. (#67)
- **Badge** — new families on `<aha-badge>`: a tinted `tone` palette (danger · success · positive · essential · pro · branding · primary-alt), `plan` presets (free · edu · essential · pro · enterprise + monthly/yearly), leaderboard `rank` (1st–4th) and `session` chips. A chip given `href` becomes a real `<a>` link (hover-animated), never a button. (#67)
- **Tooltip** — new `help` attribute on `<aha-tooltip>`: a built-in, focusable `?` help trigger (DS `system-question-mark` icon) that shows the tooltip on focus as well as hover. (#67)
- **Paywall** — an upgrade-mark → upsell popover on `<aha-paywall>`: a plan-gated affordance that opens a themed popover carrying the plan message and Upgrade / See all plans actions. (#67)
- **CSAT** — new `inline` variant on `<aha-csat>`: a compact single-row layout (prompt + thumbs-up/down icons, no card). (#67)

## 0.31.0 — 2026-09-10
### Removed
- **Button** — dropped the `xl` (52px) and `2xl` (60px) sizes. `size` is now `sm | md | lg`. Migrate any `size="xl"` / `size="2xl"` to `size="lg"`. **Breaking.** (#66)
### Changed
- **Button** — the default `size` is now **lg (40px)** (was `md`). Buttons with no explicit `size` grow from 36px to 40px; pin `size="md"` to keep the old height. (#66)

## 0.30.0 — 2026-09-10
### Added
- **Settings controls (10 new leaves + composites)** — the settings-lab composition family graduates into the DS as real, reusable elements: `<aha-counted-textarea>` (multi-line focus-only counter, autogrow minRows→maxRows), `<aha-number-with-unit>` (digit input + inline unit-in-full + hover stepper, clamped, `role=spinbutton`), `<aha-card-select>` (single-select icon+label card grid, roving `radiogroup`), `<aha-mode-field>` (label + inline exclusive mode control, body swaps in place), `<aha-info-box>` (bespoke tinted callout info/success/warning/error, optional dismiss, `role=status`), `<aha-numbered-item>` (numbered composite-item wrapper, chip + hover delete + grey container), `<aha-image-action-button>` (per-option image control, empty/loading/thumbnail + Change/Edit/Delete, emits intents), `<aha-image-dropzone>` (full-width dashed image field, emits intents), `<aha-option-row>` (repeatable option row: drag handle + borderless counted textarea + optional correct-toggle/image + hover delete), `<aha-question-list>` (collapsible questions composing NumberedItem + OptionRow, add/remove). Each ships contract + `lib/` element + HTML/React/Vue snippets + preview, is registered and exported, and flips its `patterns/settings.json` `composedOf` entry from `missing → available`. The `<aha-counted-input>` reference (from the branch) ships in this release too. (#65)

## 0.29.0 — 2026-09-10
### Added
- **Select field** — a new leaf `<aha-select>`: a native-`<select>`-backed one-of-many field (DS V3 chrome — small 24 / default 32 / large 40, radius 8, brand focus border, `#8A8A8A` placeholder, error/warning status, caret via `<aha-icon name="system-caret-down">`). It inherits the OS keyboard + AT model for free, so it embeds inside shadow-DOM surfaces the composite Select can't reach. Registered element, `./aha-select` export, HTML/React/Vue snippets + playground. (#64)
- **Settings list** — schema rows now support `control.type:"select"`, reusing the new `<aha-select>` leaf (a row can render a one-of-many picker, not just switch/checkbox/input). Object/array control props (e.g. a select's `options`) now serialise to a JSON attribute. (#64)
### Changed
- **Select (composite)** — a one-line cross-link to the new leaf Select field: reach for the leaf for a short/known set or a shadow-DOM row; the composite is for search / tags / multi / virtualised lists. (#64)

## 0.28.0 — 2026-09-10
### Added
- **Badge** — `ribbon` variant: a corner ribbon banner wrapping a card, start/end placement, colour from `color`/`status` (default primary), with a token-bound triangular fold. (#63)

## 0.27.0 — 2026-09-10
### Added
- **Button** — introduce the named `--aha-button-*` semantic-token layer (primary/default/ghost/danger/positive/disabled + focus-ring + elevation), a pure indirection over the core tokens (e.g. `--aha-button-primary-bg: var(--aha-color-primary)`), so button theming can move independently of the core palette. `<aha-button>` now binds to it. No visual change — rendered colours are byte-identical. (#57)

## 0.26.0 — 2026-09-10
### Added
- **Dropdown: nested submenus** — a submenu-parent item (`children:[…]`) opens an adjacent flyout panel with keyboard nav (Up/Down within the flyout, ArrowRight/Enter to open, ArrowLeft/Escape to close back to the parent) and edge-collision flip when it would overflow the viewport. The parent carries `aria-haspopup="menu"` + a trailing `system-caret-right`, and each flyout fades/scales on its own persistent node. Flat dropdowns are unchanged. (#56)

## 0.25.0 — 2026-09-10
### Added
- **Tooltip & Popover** — 8 edge-aligned placements (`top-start` … `right-end`, AntD naming) on both `<aha-tooltip>` and `<aha-popover>`: the overlay sits on the same side but aligns to the trigger's start/end edge with the arrow offset near that edge. The 4 cardinal placements are unchanged. (#55)

## 0.24.0 — 2026-09-10
### Added
- **Tabs** — `tab-position="left"`: a vertical left-rail orientation with the panel to the right, the active indicator moving from a 2px bottom underline to a 2px color-primary side border (card keeps its pill), and roving arrow-key nav switching to up/down (Home/End unchanged). Top orientation, `type` and `size` unchanged. (#59)

## 0.23.0 — 2026-09-10
### Added
- **Radio** — new `variant="card"`: the whole bordered card is the selectable target (radio dot + title + optional `description`), and the selected card gets a brand border + a subtle brand-tint (`bg-accent`) fill. Supports `size` and `direction`, stays mutually-exclusive within a `name` group, and is keyboard-operable exactly like the dot variant (roving arrow-key nav). (#61)

## 0.22.3 — 2026-09-10
### Changed
- **Settings pattern** — the settings-lab `@/iframe/settings` library is now mapped one-per-component to its DS form: a canonical mapping table in `parts/settings.guide.md` (mapped DS component / documented convention / backlog gap), replacing the ad-hoc `reuseNote` list. The 11 composed controls the DS doesn't yet ship (ModeField, CountedInput, CountedTextarea, CardSelect, NumberWithUnit, OptionRow, NumberedItem, QuestionList, ImageDropzone, ImageActionButton, InfoBox) are now tracked as `composedOf` backlog so the gap is explicit and buildable-by-reuse, and a `map-composed-controls` rule bars hand-rolling a library control. (#58)
### Fixed
- **Settings pattern + Settings list** — align docs to the shipped element and the canonical library: the group/section header is **semibold (600)**, not "bold", and guidance's one home is the `?` tooltip (the must-see-consequence help line stays the DS's narrow, near-zero exception). (#58)

## 0.22.2 — 2026-09-10
### Fixed
- **Standards gate — pattern guide ↔ reuse graph.** A pattern's guide and its `composedOf` must now agree: every shipped DS element the guide points authors at (a `<aha-*>` tag that resolves to a real contract) has to be declared in `composedOf`, so the machine-readable reuse graph can't drift from the human-readable mapping. Sub-parts the DS doesn't ship as a contract (e.g. `<aha-settings-item>`) are ignored. (#62)

## 0.22.1 — 2026-09-10
### Fixed
- **Standards gate — CHANGELOG PR ref.** The repo gate now rejects an unfilled `(#PR)` placeholder in the top changelog entry (any digit-less `(#…)` ref), closing the hole that let placeholders ship green. Rule text in `AGENTS.md`/`CHANGELOG.md` updated to require the real PR number. (#60)

## 0.22.0 — 2026-09-10
### Added
- **AhaSlides surfaces + General/Forms → DS V3 matrix + playgrounds.** The final audit group — every component now ships an interactive playground over its full DS V3 matrix. (#53)
- **Button** — the full matrix: 13 variants (primary, secondary, tertiary, success, danger, link, essential, pro, text, text-link, primary-alt, branding, positive) × 5 sizes (sm–2xl), plus `loading` and `block`; a variant × size × state playground. (#53)
- **Checkbox** — `indeterminate` (`aria-checked="mixed"`), a host `role="checkbox"` + Space-to-toggle keyboard contract, and disabled parity. (#53)
- **Icon** — a smart-widget playground (size + glyph), importing the real icon runtime. (#53)
- **Status badge** — `active`/`inactive` statuses and an `aria-label` synced from the label (the state is announced, not colour-alone). (#53)
- **CSAT** — a `thanks` confirmation state (`role="status"`, `aria-live`); keeps the aria-pressed thumb contract. (#53)
- **Settings list** — schema rows now honour `disabled` and `locked`/plan-gated rows (reusing `<aha-paywall>`), plus a `compact` density. (#53)
- **Paywall** — a `required-plan` (essential/pro) playground; the preview imports the real element. (#53)
### Fixed
- **Progress / Rate / Uploader** — the fill/reveal now animates a compositor-friendly property (`transform: scaleX` for the progress + upload bars, `clip-path` for the rate star) instead of `width`, so the animation no longer thrashes layout. (#53)

## 0.21.0 — 2026-09-10
### Added
- **Feedback + Overlays group → DS V3 matrix + playgrounds.** Each feedback component widens to its full DS V3 matrix, with real code parity + an interactive playground. (#52)
- **Alert** — a `branding` type, regular/small `size`, `banner` mode, an icon toggle, and an `action` slot. (#52)
- **Progress** — a `circle` type, `steps` (segmented), `size`, the full `status` set (with ✓/✕ glyphs), and `showInfo`; keeps `role="progressbar"` + `aria-valuenow`. (#52)
- **Result** — `403`/`500` statuses and a custom `icon`. (#52)
- **Skeleton** — `paragraph` rows (last row shorter), `input`/`image` variants, `rows`, and `round`. (#52)
- **Spin** — a wrapper/overlay mode (dim + blur over slotted content), `size`, and `tip`. (#52)
- **Popover** — a `title` + `content`, `placement`, `trigger` (hover/click/focus), and an `arrow` toggle. (#52)
### Changed
- **Modal / Drawer / Notification / Popconfirm / Toast** — interactive React playgrounds over the shared theme (type · placement · size axes), using the themed hooks (`useModal`/`useNotification`/`useMessage`), never the static calls. (#52)

## 0.20.0 — 2026-09-10
### Added
- **Data Display group → DS V3 matrix + playgrounds.** Each display component widens from a thin example to its full DS V3 matrix, with real code parity + an interactive playground. (#51)
- **Card** — `size`, `bordered`, `hoverable`, `loading`, and `cover`/`extra`/`actions` slots. (#51)
- **List** — `size`, `bordered`, `split`, header/footer, a structured `items` model (avatar/meta/actions), and `loading`. (#51)
- **Collapse** — `accordion`, `ghost`/bordered, `size`, expand-icon position, a `disabled` panel, and an `extra` slot. (#51)
- **Descriptions** — `column` count, `bordered`, `size`, `layout` (horizontal/vertical), and per-item `span`. (#51)
- **Statistic** — `precision`, prefix/suffix icons, a `trend` (up/down arrow + success/error colour), and `loading`. (#51)
- **Empty** — a `simple` image variant, a `description` toggle, and a custom-image slot. (#51)
- **Avatar** — `shape`, named + numeric `size`, icon/text/image content, and a new `<aha-avatar-group>` (stacked overlap + `+N` overflow). (#51)
- **Badge** — a `count` over a wrapped child, `overflowCount`, `dot`, the full `status` set (+ a processing pulse), a custom `color`, and `showZero`. (#51)
- **Tag** — preset `color`s, `bordered`, a leading `icon`, `closable` (animated ✕), and a `checkable` toggle. (#51)
- **Tooltip** — `placement` (top/bottom/left/right), `color` (dark/brand), an `arrow` toggle, and `trigger` (hover/focus/click). (#51)
- **Image** — a `preview` toggle, `radius`, a loading `placeholder`, and a broken-src `fallback` (keeps the click-to-zoom dialog). (#51)
### Changed
- **Carousel** — interactive playground: dot position · effect (slide/fade) · autoplay · arrows. (#51)
- **QR code** — interactive playground: size · error level · status · bordered. (#51)

## 0.19.0 — 2026-09-10
### Changed
- **Data Entry composites → interactive playgrounds.** The antd-composite fields now render interactive React playgrounds over the shared theme, so the full DS V3 matrix is explorable (not one static case). Contracts gain `dsv3` notes + matrix `props`/`spec`. (#50)
- **Select** — size · status (error/warning) · mode (single/multiple/tags) · allowClear · loading · disabled. (#50)
- **AutoComplete** — size · status · allowClear · grouped options · disabled. (#50)
- **InputNumber** — size · status · steppers · min/max/step/precision · prefix/addons · readOnly · disabled. (#50)
- **TextArea** — size · status · autoSize · showCount + maxLength · readOnly · disabled. (#50)
- **DatePicker** — picker (date/week/month/quarter/year) · size · status · range · showTime · presets · disabled. (#50)
- **TimePicker** — size · status · 12/24-hour format · range · allowClear · disabled. (#50)
- **Slider** — range · marks · vertical · step/dots · disabled. (#50)
- **Form** — layout (horizontal/vertical/inline) · size · validation states · requiredMark · disabled. (#50)

## 0.18.0 — 2026-09-10
### Added
- **Data Entry controls → DS V3 matrix + playgrounds.** The leaf input controls gain interactive playgrounds and the props to back the full matrix. (#49)
- **Input** — `size` (small/default/large), `status` (error/warning), `readonly`, `prefix`/`suffix` affixes (icon or text), `clearable`, and a password reveal toggle. (#49)
- **Radio** — a `variant="button"` segmented pill group, `size` (default/small), and group `direction` (horizontal/vertical). (#49)
- **Rate** — `allow-half`, `allow-clear`, a `count`, and a custom `icon` character (any DS glyph by name). (#49)
- **Color picker** — `size` (small/default/large) and `disabled`, a richer preset ramp, and a check on the selected swatch. (#49)
- **Switch** — `size` (default/small), `loading` (a spinner in the knob), and in-track `on-text`/`off-text` or `on-icon`/`off-icon`. (#49)
- **Uploader** — `listtype` (text / picture-card), a managed item list with uploading/done/error states and a remove control, and `maxcount`. (#49)
### Fixed
- **Radio** — the shadow root was built via `insertAdjacentHTML`, which `ShadowRoot` doesn't implement (it extends `DocumentFragment`, not `Element`), so the element rendered blank in a real browser; it now builds from an appended fragment. (#49)

## 0.17.0 — 2026-09-10
### Added
- **Layout group → DS V3 matrix + playgrounds.** The layout primitives gain interactive playgrounds and the props to back the full matrix. (#48)
- **Divider** — `plain` (plain vs heading label emphasis), alongside orientation (horizontal/vertical), `dashed`, and left/center/right text alignment. (#48)
- **Flex** — the `vertical` shorthand, alongside direction/justify/align/gap/wrap. (#48)
- **Grid** — an asymmetric gutter (`gap="h v"`), row `justify`/`align`, and `responsive` (fixed columns collapse as the container narrows). (#48)
- **Space** — `split` (a tokenised divider ruled between items), alongside direction/size/align/wrap. (#48)

## 0.16.0 — 2026-09-10
### Added
- **Interactive component playgrounds (the "smart widget").** A component's Examples now render a compact control bar that drives the live element's variants (Mode · Size · Content · …), so you explore the whole matrix instead of reading one static case — driven by a new `playground` block in the contract. First shipped across the Navigation group. (#47)
- **Menu** — the full DS V3 Menu family: leading `icon`s, `{type:"group"}` titles, `{type:"divider"}` rules, inline **submenus** (`children`, expand/collapse), `danger` and `disabled` rows, and `mode` = `vertical`/`inline`/`horizontal`, with roving arrow-key navigation across the tree. (#47)
- **Dropdown** — the overlay takes the same item vocabulary (icons, danger, dividers, groups, disabled) plus `placement` (bottom/top × left/right) and `trigger` (click/hover). (#47)
- **Tabs** — `type` (line/primary/card), `size` (default/small), per-tab leading `icon`s, and `disabled` tabs. (#47)
- **Segmented** — `size` (small/medium/large), icon+label / icon-only options, per-option `disabled`, and `block` (full-width). (#47)
- **Breadcrumb** — leading `icon`s, a `separator` (caret/slash), and `maxItems` middle-collapse into an ellipsis. (#47)
- **Pagination** — `size` (default/small), `simple` mode, whole-control `disabled`, and a direct `pages` count. (#47)
- **Steps** — the example is now an interactive React playground (direction · size · numbered/dot · `error` status). (#47)
### Changed
- Component previews now **import the shipped element** from `lib/` rather than inlining a copy, so an example can never drift from the real component. `standards.mjs` recognises an importing preview and skips the copy-sync check — a stronger guarantee than a kept-in-sync copy. (#47)

## 0.15.1 — 2026-09-10
### Fixed
- In-app navigation now carries each page's own CSS. A page inlines its page-specific styles (`extraCss`: the icon-library grid/cards/search, the foundations token pages, the pattern pages) in its `<head><style>`, but the swap replaced only `<main>` and kept the previous page's `<head>` — so navigating to such a page dropped its styles and the content fell back to unstyled defaults (e.g. the icon library collapsed into cramped inline chips) until a full reload. The swap now syncs the document `<style>` to the destination page's; shared token/shell CSS is identical across pages, so replacing it whole is safe. (#44)

## 0.15.0 — 2026-09-10
### Added
- Accessibility gate: a **fourth check** — a silent toggle button. A `<button>` that toggles a selection class (`selected`/`active`/`pressed`/`on`) on state but exposes no `aria-pressed`/`aria-checked` reads as a plain button to a screen reader (the selection is invisible) — it now hard-fails. A button carrying a roving/selectable role (`radio`/`tab`/`menuitem`/`option`) is exempt (it syncs its own aria); per-line opt-out `ds-lint-allow: a11y (why)`. Caught the CSAT thumbs and colour-picker swatches, both now fixed. (#45)

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
- Button docs (`button.html.txt`/`.react.txt`/`.vue.txt`/`.preview.html`): the icon-slot examples (add/close/more) were hand-rolled inline `<svg>` — a direct violation of the icon contract's "call by name, never inline SVG" rule, and inconsistent with the Icon component's own docs. Swapped to `<aha-icon name="system-plus|system-x|system-dots-three">`. (#47)

## 0.4.0 — 2026-09-09
### Added
- Standards gate: a **motion rule** on leaf sources, so a dropped transition can't pass. It flags four ways motion gets lost — (1) an interactive element with no `transition` (snap), (2) a `transition` timed with a bare literal instead of a motion token (drift), (3) a **dead** transition: the element rebuilds its subtree via `innerHTML=` on the state attribute the transition animates, so it never fires **even with correct CSS** (why the Switch didn't animate on click after its motion was re-tuned), and (4) an **example out of sync**: `parts/<slug>.preview.html` (the copy `qa.mjs` measures) is missing a transition the element ships, so the rendered example shows different motion than the component. Escape hatch `ds-lint-allow: motion (why)`. Ships **warn-first** behind `MOTION_HARD_FAIL`; flips to hard fail once the re-rendering leaves (switch/checkbox/tooltip) are restructured. Mirrors the colour/radius enforcement. (#27)
### Changed
- AGENTS / PRINCIPLES / CONTRIBUTING: motion is now a documented house non-negotiable — animate interactive states via `--aha-motion-*` / `--aha-ease-*`, never snap, never a bare literal, and keep the transition on a persistent node (don't re-render the subtree on a state change). (#27)

## 0.3.0 — 2026-09-09
### Added
- `aha-input` `size` prop (`sm` 24 · `md` 32 · `lg` 40), matching the measured DS V3 field scale; radius stays 8. (#47)
- Motion token layer: `--aha-motion-fast/-mid/-slow` and the Ant eases `--aha-ease-in-out`, `--aha-ease-out`, `--aha-ease-in-out-circ`, `--aha-ease-out-back`, emitted from `generate.mjs` into the `--aha-*` variables. (#47)
- Changelog is now surfaced in the generated DS: a browsable **Changelog** page (`/feeds/changelog.html`, linked from the header version badge), a fetchable raw feed at `/CHANGELOG.md`, the current version + changelog URL in `llms.txt` and `design.md` headers, and the full log appended to `llms-full.txt`. Agents and humans both see what changed per release. (#23)
### Changed
- DS V3 conformance: field default height corrected 36 → 32 across Input, Select, Form and DatePicker (controlHeight root 32). (#47)
- `aha-switch` aligned to the measured DS V3 toggle: track 44×22, 1px `#D4D4D4` border, off `#F7F7F7`, disabled 40% opacity. (#47)
- `aha-tag` radius 6 → 4, matching the measured DS V3 tag (`--aha-radius-xs`). (#47)
- Leaf transitions (input, tag, badge, switch, tooltip, button, checkbox) re-tuned to Ant's motion system: controls `.2s` ease-in-out, switch `.2s` ease-in-out-circ, tooltip pop `.2s` ease-out-back; `lib/` and the inline `parts/*.preview.html` copies kept in sync. (#47)
### Fixed
- `tag.preview.html` had drifted to no transition at all — restored and matched to `lib/aha-tag.js`. (#47)

## 0.2.1 — 2026-09-09
### Changed
- Components nav: the planned-inventory catalog now spans the full AntD v6 taxonomy (General / Layout / Navigation / Data Entry / Data Display / Feedback) merged with the AhaSlides surfaces (Paywall, Status badge, CSAT, Settings list) — 57 planned, live pages still from `contracts/`, the rest greyed "soon". Datepicker nav slug aligned to its shipped contract. (#23)

## 0.2.0 — 2026-09-09
### Added
- Changelog + version rule: every merge now adds a dated entry to `CHANGELOG.md` and bumps `package.json` → `version`. `standards.mjs` gates it (top entry must match the package version, be dated, and carry ≥1 bullet).

## 0.1.0 — 2026-09-08
### Added
- Initial design system: `--aha-*` tokens, the `<aha-icon>` call-by-name registry, the `aha-checkbox` / `aha-button` / `aha-paywall` leaf elements, the shared DataTable composite (antd theme), the generated agent feeds in `dist/`, and the standards + render gates (`npm run check`).
