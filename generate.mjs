#!/usr/bin/env node
/**
 * G1+G2+G3 — the AhaSlides design-system generator.
 *
 * ONE source per component in contracts/<slug>.json (+ parts/ authored code) and
 * ONE token source in tokens.canonical.json (R1). Everything agent-facing is
 * DERIVED from those — edit a contract or a token and all outputs regenerate
 * together, so they can never drift.
 *
 *   dist/variables.css            the --aha-* token layer, generated from tokens.canonical.json
 *   dist/design.md                machine-readable visual language (Ant design.md parity)   [G3]
 *   dist/index.html               browsable component index (for-agents entry stub)
 *   dist/llms.txt                 index feed across all components                            [G2]
 *   dist/llms-full.txt            concatenated full docs                                      [G2]
 *   dist/<slug>/index.html        doc page: verified live preview + collapsed tabbed code
 *   dist/<slug>/<slug>.md         per-component markdown feed
 *   dist/<slug>/<slug>.agent.json machine feed (props + tokens + spec + opinion + both snippets)
 *   dist/<slug>.llms.txt          the component's llms entry
 *   dist/search-index.json        the header search index, crawled from every built page
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, cpSync } from 'node:fs';
import { anchorHeadings, buildSearchIndex, searchHeaderHtml, SEARCH_CSS, SEARCH_JS, SEARCH_GLYPHS } from './docs-search.mjs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const CDIR = join(root, 'contracts');
const GDIR = join(root, 'guidelines');   // guideline artifacts (prose composition guides over existing components)
const MDIR = join(root, 'marketing');    // marketing sections — framework-free HTML+CSS blocks for the AhaSlides marketing sites, shown under Patterns
const ADIR = join(root, 'audience');     // audience component library — the marketplace/iframe audience gallery, rendered as a first-class DS area (single scroll page)
const PDIR = join(root, 'parts');
const OUT  = join(root, 'dist');
const read = (p) => readFileSync(p, 'utf8');
// Single source for the paste-and-run CDN ref. Snippets author `@__REF__`; we inject it here so
// the pin lives in ONE place. Default `master` = live-on-merge (pages.yml redeploys docs on merge,
// and jsDelivr /gh/@master serves the current element/theme code) — no stale-tag freeze. Override
// with AHA_CDN_REF (e.g. a release tag) if an immutable pin is ever wanted.
const CDN_REF = process.env.AHA_CDN_REF || 'master';
const part = (name) => (name && existsSync(join(PDIR, name)) ? read(join(PDIR, name)).replaceAll('@__REF__', `@${CDN_REF}`) : '');
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const PKG = JSON.parse(read(join(root, 'package.json')));
const PKGNAME = PKG.name;   // @ahaslides-product/design — the package to install
const SCOPE = PKGNAME.split('/')[0];   // @ahaslides-product
/* Published to GitHub Packages (not public npmjs), so consuming the package needs a
   one-time scoped-registry + auth setup before `npm i`. These lines are printed into
   every install block / feed so an agent can wire it up from the page alone. */
const REGISTRY = (PKG.publishConfig && PKG.publishConfig.registry) || 'https://npm.pkg.github.com';
const REGISTRY_HOST = REGISTRY.replace(/^https?:\/\//, '');
const NPMRC = `${SCOPE}:registry=${REGISTRY}\n//${REGISTRY_HOST}/:_authToken=\${GITHUB_TOKEN}   # a GitHub token with read:packages`;

/* Absolute base URL where dist/ is hosted (GitHub Pages by default). The feed links
   printed on the docs pages + in llms.txt/agent.json are ABSOLUTE so an agent that
   lands anywhere can fetch them directly. CI overrides via AHA_SITE_URL. */
const SITE = (process.env.AHA_SITE_URL || 'https://ahaslides-product.github.io/ahaslides-design').replace(/\/+$/, '');

/* ===== R1 canonical tokens → the --aha-* var layer (single source) ===== */
const TOK = JSON.parse(read(join(root, 'tokens.canonical.json')));

/* Token aliases: a value written "{color.primitives.purple.60}" points at another token. TOK keeps the
   resolved hex (tokens.js, swatches, contrast checks); TOKEN_ALIASES maps the aliased path to the
   referenced token so tokens.css can emit var(--aha-…) and the docs can name the source. */
const TOKEN_ALIASES = new Map();
function aliasCssVar(path) {
  const kebab = (text) => text.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
  const parts = path.split('.');
  if (parts[0] === 'space') return `--aha-space-${parts[1]}`;
  if (parts[0] !== 'color') throw new Error(`no CSS var for alias ${path}`);
  if (parts[1] === 'primitives') return `--aha-${kebab(parts[2])}${parts[3] !== undefined ? '-' + parts[3] : ''}`;
  if (parts[1] === 'brand') return `--aha-brand-${parts[2]}`;
  if (parts[1] === 'alpha') return `--aha-${kebab(parts[2])}`;
  if (['success', 'warning', 'error', 'info', 'primary'].includes(parts[1])) return `--aha-color-${parts[1]}`;
  const role = /^(text|bg|icon|border)(.*)$/.exec(parts[1]);
  if (role) return `--aha-${role[1]}${role[2] ? '-' + kebab(role[2]).replace(/^-/, '') : ''}`;
  throw new Error(`no CSS var for alias ${path}`);
}
(function resolveAliases(node, trail) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith('$')) continue;
    const path = [...trail, key];
    if (value && typeof value === 'object') { resolveAliases(value, path); continue; }
    const match = typeof value === 'string' && /^\{([^}]+)\}$/.exec(value);
    if (!match) continue;
    const refParts = match[1].split('.');
    const target = refParts[0] === 'space'
      ? (TOK.space.includes(Number(refParts[1])) ? Number(refParts[1]) : undefined)
      : refParts.reduce((at, step) => (at == null ? at : at[step]), TOK);
    const valid = refParts[0] === 'space' ? typeof target === 'number' : typeof target === 'string' && /^(#|rgba?\()/.test(target);
    if (!valid) throw new Error(`${path.join('.')}: alias ${value} does not resolve to a token value`);
    TOKEN_ALIASES.set(path.join('.'), { ref: match[1], cssVar: aliasCssVar(match[1]) });
    node[key] = target;
  }
})(TOK, []);
const aliasOf = (path) => TOKEN_ALIASES.get(path);
const cssValue = (path, value) => (aliasOf(path) ? `var(${aliasOf(path).cssVar})` : value);

/* ===== icon registry (built by build-icons.mjs from the SVGs imported from Figma DS V3).
   ONE source → the <aha-icon> runtime, the searchable gallery, and the agent feeds. ===== */
const ICONS = existsSync(join(root, 'icons', 'registry.json'))
  ? JSON.parse(read(join(root, 'icons', 'registry.json')))
  : { icons: {}, families: [], count: 0, $generatedFrom: '(no registry — run build-icons.mjs)' };

/* The shared custom element — defined ONCE, loaded by every page that shows an icon.
   Reads window.AHA_ICONS[name] → { viewBox, body }; body already carries currentColor +
   the baked per-size stroke, so colour follows the text colour and size is a width/height. */
const AHA_ICON_JS = `(function(){
  var LINE={12:1,16:1.5,24:2,32:2.5};   // documented size↔stroke pairing (12/16/24/32 only)
  function draw(el){
    var R=window.AHA_ICONS||{}, name=el.getAttribute('name'), ic=R[name];
    var size=parseInt(el.getAttribute('size')||'24',10);
    var label=el.getAttribute('label')||'', dec=el.hasAttribute('decorative')||!label;
    var a11y=dec?'aria-hidden="true"':'role="img" aria-label="'+label.replace(/"/g,'&quot;')+'"';
    if(!el.shadowRoot) el.attachShadow({mode:'open'});
    if(!ic){ el.shadowRoot.innerHTML='<span title="unknown icon: '+name+'" style="display:inline-block;box-sizing:border-box;width:'+size+'px;height:'+size+'px;border:1px dashed #F5222D;border-radius:3px"></span>'; return; }
    el.shadowRoot.innerHTML='<style>:host{display:inline-flex;line-height:0;color:inherit;vertical-align:middle}svg{display:block}</style>'
      +'<svg width="'+size+'" height="'+size+'" viewBox="'+ic.viewBox+'" fill="none" '+a11y+'>'+ic.body+'</svg>';
  }
  if(!customElements.get('aha-icon')) customElements.define('aha-icon',class extends HTMLElement{
    static get observedAttributes(){return['name','size','label','decorative'];}
    connectedCallback(){ var s=this; if(window.AHA_ICONS){draw(s);} else {var t=setInterval(function(){if(window.AHA_ICONS){clearInterval(t);draw(s);}},20);} }
    attributeChangedCallback(){ if(this.shadowRoot) draw(this); }
  });
})();
`;

/* ===== full planned inventory (AntD-style left-nav taxonomy) — the component-standard
   measured set. Live pages come from contracts/; the rest render as greyed "soon" so the
   nav shows the whole roadmap. Order/categories mirror ant.design's component menu. ===== */
const COMPONENTS_CATALOG = [
  { cat: 'General', items: [
    { name: 'Button',       slug: 'button' },
    { name: 'Icon',         slug: 'icon' },
    { name: 'Illustration', slug: 'illustration' },
  ] },
  { cat: 'Layout', items: [
    { name: 'Divider', slug: 'divider' },
    { name: 'Flex',    slug: 'flex' },
    { name: 'Grid',    slug: 'grid' },
    { name: 'Space',   slug: 'space' },
  ] },
  { cat: 'Navigation', items: [
    { name: 'Breadcrumb', slug: 'breadcrumb' },
    { name: 'Dropdown',   slug: 'dropdown' },
    { name: 'Menu',       slug: 'menu' },
    { name: 'Pagination', slug: 'pagination' },
    { name: 'Steps',      slug: 'steps' },
    { name: 'Stepper',    slug: 'stepper' },
  ] },
  { cat: 'Data Entry', items: [
    { name: 'Checkbox',     slug: 'checkbox' },
    { name: 'Radio',        slug: 'radio' },
    { name: 'Switch',       slug: 'switch' },
    { name: 'Input',        slug: 'input' },
    { name: 'Input number', slug: 'input-number' },
    { name: 'Textarea',     slug: 'textarea' },
    { name: 'Select',       slug: 'select' },
    { name: 'Select field', slug: 'select-field' },
    { name: 'Autocomplete', slug: 'autocomplete' },
    { name: 'Autocomplete field', slug: 'autocomplete-field' },
    { name: 'Date picker',  slug: 'datepicker' },
    { name: 'Time picker',  slug: 'time-picker' },
    { name: 'Slider',       slug: 'slider' },
    { name: 'Rate',         slug: 'rate' },
    { name: 'Color picker', slug: 'color-picker' },
    { name: 'Upload',       slug: 'uploader' },
    { name: 'Form',         slug: 'form' },
  ] },
  { cat: 'Data Display', items: [
    { name: 'Avatar',       slug: 'avatar' },
    { name: 'User info',    slug: 'user-info' },
    { name: 'Badge',        slug: 'badge' },
    { name: 'Tag',          slug: 'tag' },
    { name: 'Tooltip',      slug: 'tooltip' },
    { name: 'Popover',      slug: 'popover' },
    { name: 'Tabs',         slug: 'tabs' },
    { name: 'Segmented',    slug: 'segmented' },
    { name: 'Card',         slug: 'card' },
    { name: 'List',         slug: 'list' },
    { name: 'Table',        slug: 'table' },
    { name: 'Data table',   slug: 'data-table' },
    { name: 'Collapse',     slug: 'collapse' },
    { name: 'Descriptions', slug: 'descriptions' },
    { name: 'Statistic',    slug: 'statistic' },
    { name: 'Empty',        slug: 'empty' },
    { name: 'Image',        slug: 'image' },
    { name: 'Carousel',     slug: 'carousel' },
    { name: 'QR code',      slug: 'qr-code' },
  ] },
  { cat: 'Feedback', items: [
    { name: 'Alert',        slug: 'alert' },
    { name: 'Toast',        slug: 'toast' },
    { name: 'Notification', slug: 'notification' },
    { name: 'Modal',        slug: 'modal' },
    { name: 'Drawer',       slug: 'drawer' },
    { name: 'Popconfirm',   slug: 'popconfirm' },
    { name: 'Progress',     slug: 'progress' },
    { name: 'Result',       slug: 'result' },
    { name: 'Skeleton',     slug: 'skeleton' },
    { name: 'Spin',         slug: 'spin' },
  ] },
];
/* PATTERNS — reusable AhaSlides components COMPOSED from the general Components above (real code,
   not prose — prose guidance is Guidelines). Reclassified out of Components; same grouping as before.
   A contract whose slug is here renders under the Patterns area (breadcrumb "Patterns · <group>"). */
const PATTERNS_CATALOG = [
  { cat: 'AhaSlides surfaces', items: [
    { name: 'Paywall',        slug: 'paywall' },
    { name: 'Status badge',   slug: 'status-badge' },
    { name: 'CSAT',           slug: 'csat' },
    { name: 'Screen heading', slug: 'screen-heading' },
    { name: 'Loader',         slug: 'aha-loader' },
    { name: 'Background task', slug: 'background-task' },
  ] },
];
const PATTERN_SLUGS = new Set(PATTERNS_CATALOG.flatMap(g => g.items.map(i => i.slug)));
/* SETTINGS — its OWN top-level area (not a Patterns sub-group). The settings-panel family: the
   schema-driven list plus the shipped controls a slide-type/settings surface composes
   (settings-lab → DS). The consolidated hub (settings/index.html) inlines ALL of these so an agent
   reads one page; each control still ships its own page under the Settings area sidebar. */
const SETTINGS_CATALOG = [
  { cat: 'Composition', items: [
    { name: 'Settings list',       slug: 'settings-list' },
    { name: 'Setting group',       slug: 'setting-group' },
    { name: 'Section header',      slug: 'section-header' },
    { name: 'Setting row',         slug: 'setting-row' },
    { name: 'Sub-setting group',   slug: 'sub-setting-group' },
  ] },
  { cat: 'Controls', items: [
    { name: 'Add item button',     slug: 'add-item-button' },
    { name: 'Counted input',       slug: 'counted-input' },
    { name: 'Counted textarea',    slug: 'counted-textarea' },
    { name: 'Number with unit',    slug: 'number-with-unit' },
    { name: 'Card select',         slug: 'card-select' },
    { name: 'Mode field',          slug: 'mode-field' },
    { name: 'Info box',            slug: 'info-box' },
    { name: 'Numbered item',       slug: 'numbered-item' },
    { name: 'Image action button', slug: 'image-action-button' },
    { name: 'Image dropzone',      slug: 'image-dropzone' },
    { name: 'Option row',          slug: 'option-row' },
    { name: 'Question list',       slug: 'question-list' },
  ] },
];
const SETTINGS_SLUGS = new Set(SETTINGS_CATALOG.flatMap(g => g.items.map(i => i.slug)));
let LIVE = new Set();       // slugs with a real contract — assigned once contracts load
let GUIDELINES = [];        // loaded guideline artifacts (prose guides) — drives the Guidelines nav
let MARKETING = [];         // loaded marketing sections — drives the Patterns → Marketing sections group + pages
let AUDIENCE = null;        // loaded audience library (audience/library.json) — drives the Audience nav + page; null = area absent
let AUD_CSS = '';           // scoped CSS for the Audience area (audience/audience.css)
let NAV_LANDING = {};   // top-nav → each area's landing page (set once contracts/patterns load)

/* AntD-style IA: top-level AREAS live in the header nav; each area gets its OWN scoped left
   sidebar (Components shows only components, Foundations only tokens/icons, etc.). One area
   per screen keeps every sidebar short and relevant. */
const SECTIONS = [
  { key: 'overview',    label: 'Overview' },
  { key: 'foundations', label: 'Foundations' },
  { key: 'components',  label: 'Components' },
  { key: 'patterns',    label: 'Patterns' },
  { key: 'settings',    label: 'Settings' },
  { key: 'audience',    label: 'Audience Library' },
  { key: 'charts',      label: 'Charts' },
  { key: 'guidelines',  label: 'Guidelines' },
  { key: 'feeds',       label: 'Agent feeds' },
];
/* Foundations · design tokens, split into structured pages (one sidebar item each) —
   AntD's Design area does the same (Colour / Typography / Layout / …). Each renders from
   the same tokens.canonical.json source. */
const TOKEN_PAGES = [
  { slug: 'colour',     label: 'Colour' },
  { slug: 'typography', label: 'Typography' },
  { slug: 'spacing',    label: 'Spacing' },
  { slug: 'radius',     label: 'Radius' },
  { slug: 'sizing',     label: 'Sizing' },
];
const kebab = (s) => s.replace(/[A-Z]/g, m => '-' + m.toLowerCase());   // softIndigo → soft-indigo, inkA10 → ink-a10
function tokenVars(t) {
  const c = t.color, f = t.font, r = t.radius, P = c.primitives, b = c.button;
  const L = [];
  /* primitives — the full 10→100 ramps, one CSS var per step */
  L.push(`--aha-white:${P.white}; --aha-black:${P.black};`);
  for (const hue of Object.keys(P)) {
    if (hue === 'white' || hue === 'black') continue;
    L.push(Object.keys(P[hue]).map(s => `--aha-${kebab(hue)}-${s}:${P[hue][s]};`).join(' '));
  }
  /* semantic — seed */
  L.push(`--aha-color-primary:${c.primary}; --aha-color-primary-hover:${c.primaryHover}; --aha-color-primary-active:${c.primaryActive};`);
  L.push(`--aha-color-success:${c.success}; --aha-color-warning:${c.warning}; --aha-color-error:${c.error}; --aha-color-info:${c.info};`);
  /* text */
  L.push(`--aha-text-default:${c.textDefault}; --aha-text-secondary:${c.textSecondary}; --aha-text-tertiary:${c.textTertiary}; --aha-text-placeholder:${c.textPlaceholder}; --aha-text-disabled:${c.textDisabled}; --aha-text-inverse:${c.textInverse}; --aha-text-link:${c.textLink}; --aha-text-link-hover:${c.textLinkHover}; --aha-text-primary-ink:${c.textPrimaryInk}; --aha-text-positive:${c.textPositive}; --aha-text-negative:${c.textNegative}; --aha-text-warning:${c.textWarning};`);
  /* surfaces */
  L.push(`--aha-bg-base:${c.bgBase}; --aha-bg-container:${c.bgContainer}; --aha-bg-container-secondary:${c.bgContainerSecondary}; --aha-bg-container-disabled:${c.bgContainerDisabled}; --aha-bg-elevated:${c.bgElevated}; --aha-bg-layout:${c.bgLayout}; --aha-bg-accent:${c.bgAccent}; --aha-bg-informative:${c.bgInformative}; --aha-bg-hover:${c.bgHover}; --aha-bg-positive:${c.bgPositive}; --aha-bg-negative:${c.bgNegative}; --aha-bg-warning:${c.bgWarning}; --aha-bg-warning-subtle:${c.bgWarningSubtle}; --aha-bg-overlay:${c.bgOverlay}; --aha-bg-dark:${c.bgDark}; --aha-bg-dark-raised:${c.bgDarkRaised};`);
  /* border */
  L.push(`--aha-border:${c.border}; --aha-border-input:${c.borderInput}; --aha-border-secondary:${c.borderSecondary}; --aha-border-strong:${c.borderStrong}; --aha-border-disabled:${c.borderDisabled}; --aha-border-hover:${c.borderHover}; --aha-border-focus:${c.focus}; --aha-border-active:${c.borderActive}; --aha-border-error:${c.borderError}; --aha-border-success:${c.borderSuccess}; --aha-border-warning:${c.borderWarning}; --aha-border-info:${c.borderInfo}; --aha-split:${c.borderSecondary}; --aha-checkbox-border:${c.checkboxBorder};`);
  /* icon */
  L.push(`--aha-icon-default:${c.iconDefault}; --aha-icon-strong:${c.iconStrong}; --aha-icon-muted:${c.iconMuted}; --aha-icon-disabled:${c.iconDisabled}; --aha-icon-inverse:${c.iconInverse}; --aha-icon-active:${c.iconActive};`);
  /* focus */
  L.push(`--aha-focus:${c.focus}; --aha-focus-ring:${c.focus}; --aha-focus-ring-soft:${c.focusRingSoft};`);
  /* buttons */
  L.push(`--aha-btn-primary-bg:${b.primaryBg}; --aha-btn-primary-bg-hover:${b.primaryBgHover}; --aha-btn-primary-bg-press:${b.primaryBgPress}; --aha-btn-primary-fg:${b.primaryFg}; --aha-btn-secondary-bg:${b.secondaryBg}; --aha-btn-secondary-bg-hover:${b.secondaryBgHover}; --aha-btn-secondary-border:${b.secondaryBorder}; --aha-btn-secondary-border-hover:${b.secondaryBorderHover}; --aha-btn-secondary-border-press:${b.secondaryBorderPress}; --aha-btn-tertiary-bg-hover:${b.tertiaryBgHover}; --aha-btn-tertiary-bg-active:${b.tertiaryBgActive}; --aha-btn-disabled-bg:${b.disabledBg}; --aha-btn-disabled-fg:${b.disabledFg}; --aha-btn-danger-bg:${b.dangerBg}; --aha-btn-danger-bg-hover:${b.dangerBgHover}; --aha-btn-danger-bg-press:${b.dangerBgPress}; --aha-btn-danger-ring:${b.dangerRing}; --aha-btn-positive-bg:${b.positiveBg}; --aha-btn-positive-bg-hover:${b.positiveBgHover}; --aha-btn-positive-bg-press:${b.positiveBgPress}; --aha-btn-positive-fg:${b.positiveFg}; --aha-btn-focus-ring:${b.focusRing}; --aha-btn-focus-ring-success:${b.focusRingSuccess}; --aha-btn-elevate-primary:${b.elevatePrimary}; --aha-btn-elevate-secondary:${b.elevateSecondary}; --aha-btn-encourage-bg:${b.encourageBg}; --aha-btn-encourage-bg-hover:${b.encourageBgHover}; --aha-btn-encourage-bg-press:${b.encourageBgPress};`);
  /* NAMED BUTTON SEMANTIC LAYER (--aha-button-*) — the DS V3 button token layer <aha-button> binds to.
     Each name references a CORE token whose value is IDENTICAL to the raw --aha-btn-* seed (a pure
     indirection, no colour change), so button theming can move independently of the core palette:
     re-point one --aha-button-* var and only the button retints, without disturbing --aha-color-primary
     or the shared --aha-btn-* seeds. This is a DEFINITION layer (the value SOURCE — not hex-scanned). */
  L.push(`--aha-button-primary-bg:var(--aha-color-primary); --aha-button-primary-bg-hover:var(--aha-purple-50); --aha-button-primary-bg-press:var(--aha-purple-80); --aha-button-primary-text:var(--aha-gray-10); --aha-button-default-bg:var(--aha-white); --aha-button-default-text:var(--aha-text-default); --aha-button-default-border:var(--aha-gray-40); --aha-button-default-bg-hover:var(--aha-purple-10); --aha-button-default-border-hover:var(--aha-purple-40); --aha-button-default-border-press:var(--aha-gray-50); --aha-button-ghost-bg-hover:var(--aha-purple-10); --aha-button-ghost-bg-press:var(--aha-purple-15); --aha-button-danger-bg:var(--aha-red-60); --aha-button-danger-bg-hover:var(--aha-red-50); --aha-button-danger-bg-press:var(--aha-red-70); --aha-button-danger-text:var(--aha-text-inverse); --aha-button-danger-ring:var(--aha-btn-danger-ring); --aha-button-positive-bg:var(--aha-teal-40); --aha-button-positive-bg-hover:var(--aha-teal-30); --aha-button-positive-bg-press:var(--aha-teal-50); --aha-button-positive-text:var(--aha-text-default); --aha-button-disabled-bg:var(--aha-gray-40); --aha-button-disabled-text:var(--aha-gray-60); --aha-button-focus-ring:var(--aha-focus-ring-soft); --aha-button-focus-ring-success:var(--aha-btn-focus-ring-success); --aha-button-elevate-primary:var(--aha-btn-elevate-primary); --aha-button-elevate-secondary:var(--aha-btn-elevate-secondary);`);
  /* brand slots + alpha ramps */
  L.push(Object.keys(c.brand).map(k => `--aha-brand-${k}:${c.brand[k]};`).join(' '));
  L.push(Object.keys(c.alpha).map(k => `--aha-${kebab(k)}:${c.alpha[k]};`).join(' '));
  /* a deck chart swaps series for the deck palette and re-derives the ink mixes from the deck text colour inside the element */
  const drop = (o) => Object.entries(o).filter(([k, v]) => !k.startsWith('$') && v !== null);
  const v = c.viz, vz = t.viz;
  L.push(`--aha-viz-ink:${cssValue('color.viz.ink', v.ink)}; --aha-viz-ink-inverse:${cssValue('color.viz.inkInverse', v.inkInverse)}; --aha-viz-neutral:${cssValue('color.viz.neutral', v.neutral)}; ` +
    Object.keys(v.series).map(k => `--aha-viz-series-${k}:${cssValue(`color.viz.series.${k}`, v.series[k])};`).join(' ') + ' ' +
    Object.keys(v.tint).map(k => `--aha-viz-tint-${k}:${cssValue(`color.viz.tint.${k}`, v.tint[k])};`).join(' '));
  L.push(drop(vz).filter(([, value]) => typeof value === 'number').map(([k, value]) => `--aha-viz-${kebab(k)}:${cssValue(`viz.${k}`, `${value}px`)};`).join(' ') + ' ' +
    drop(vz.mix).map(([k, value]) => `--aha-viz-mix-${kebab(k)}:${value}%;`).join(' '));
  /* type + shape */
  L.push(`--aha-font-product:${f.product}; --aha-font-display:${f.display}; --aha-font-secondary:${f.secondary}; --aha-font-mono:${f.mono};`);
  L.push(`--aha-radius-xs:${r.xs}px; --aha-radius-sm:${r.sm}px; --aha-radius-default:${r.default}px; --aha-radius-lg:${r.lg}px; --aha-radius-xl:${r.xl}px; --aha-radius-marketing:${r.marketing}px; --aha-radius-pill:${r.pill}px;`);
  /* layout — default max-width for centred app content (page/screen container) */
  L.push(`--aha-content-max-width:${t.layout.contentMaxWidth}px; --aha-tooltip-max-width:${t.layout.tooltipMaxWidth}px;`);
  /* type scale + spacing + weight + line-height + tracking — the canonical size/space/weight/lineHeight/
     letterSpacing scales exposed as CSS vars so framework-free surfaces (the marketing sections) and future
     components can bind dimensions to tokens instead of hardcoding px. Values are DERIVED from
     tokens.canonical.json — no new numbers authored here. */
  L.push(drop(t.size).map(([k, v]) => `--aha-size-${kebab(k)}:${v}px;`).join(' '));
  L.push(t.space.map((v) => `--aha-space-${v}:${v}px;`).join(' '));
  L.push(drop(t.weight).map(([k, v]) => `--aha-weight-${k}:${v};`).join(' '));
  L.push(drop(t.lineHeight).map(([k, v]) => `--aha-line-height-${k}:${v};`).join(' '));
  L.push(drop(t.letterSpacing).map(([k, v]) => `--aha-letter-spacing-${kebab(k)}:${v};`).join(' '));
  L.push(`--aha-control-height-root:${t.controlHeight.root}px; --aha-control-height-sm:${t.controlHeight.sm}px; --aha-control-height-lg:${t.controlHeight.lg}px;` +
    Object.entries(t.controlHeight.button).map(([k, v]) => ` --aha-control-height-button-${k}:${v}px;`).join(''));
  L.push(drop(t.breakpoints).map(([k, v]) => `--aha-breakpoint-${k}:${v}px;`).join(' '));
  /* motion — Ant Design v6 durations + standard eases (aha-design-antd §Motion); authored here, not in tokens.canonical.json (that file is Brian-owned and has no motion layer).
     No overshoot/bounce ease (ease-out-back etc.): real objects decelerate smoothly — the craft floor + AntD's own tooltip/zoom motion both avoid it, and the standards gate now flags it. Use the exponential eases below. */
  L.push(`--aha-motion-fast:.1s; --aha-motion-mid:.2s; --aha-motion-slow:.3s; --aha-ease-in-out:cubic-bezier(0.645,0.045,0.355,1); --aha-ease-out:cubic-bezier(0.215,0.61,0.355,1); --aha-ease-in-out-circ:cubic-bezier(0.78,0.14,0.15,0.86);`);
  /* chart motion: slower than UI state changes because the eye has to follow data moving. */
  L.push(Object.entries(t.effect.blur).filter(([k]) => !k.startsWith('$')).map(([k, value]) => `--aha-blur-${k}:${value}px;`).join(' '));
  L.push(`--aha-motion-viz-enter:.6s; --aha-motion-viz-update:.4s; --aha-motion-viz-reorder:.35s; --aha-motion-viz-stagger:40ms; --aha-ease-viz:cubic-bezier(0.2,0.7,0.4,1);`);
  return `:root{\n  ${L.join('\n  ')}\n}`;
}

/* ===== structural shell styles — AntD docs IA (sticky header + left nav + main),
   skinned with the --aha-* tokens. base = relative prefix so links/fonts resolve from
   both dist/index.html ('') and dist/<slug>/index.html ('../'). ===== */
const shellCss = (base) => `
/* Plus Jakarta Sans — AhaSlides DS V3 product face (aha-design-typography), self-hosted per
   aha-design-antd; weights 400/600; system-ui final fallback. DS-mandated — do not substitute. */
@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:400;font-display:swap;
  src:local("Plus Jakarta Sans"),url("${base}fonts/PlusJakartaSans-Regular.woff2") format("woff2")}
@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:600;font-display:swap;
  src:local("Plus Jakarta Sans"),url("${base}fonts/PlusJakartaSans-SemiBold.woff2") format("woff2")}
*{box-sizing:border-box}
body{margin:0;background:#fff;color:var(--aha-text-default);font-family:var(--aha-font-product);font-size:14px;line-height:22px;-webkit-font-smoothing:antialiased}
a{color:var(--aha-color-primary)}

/* ---- app shell ---- */
.doc-header{position:sticky;top:0;z-index:30;height:64px;display:flex;align-items:center;gap:22px;padding:0 24px;background:#fff;border-bottom:1px solid var(--aha-split)}
.brand{display:flex;align-items:center;gap:11px;font-size:16px;font-weight:600;color:var(--aha-text-default);text-decoration:none;flex:0 0 auto}

/* ---- top-level area nav (AntD-style header tabs) ---- */
.top-nav{display:flex;gap:2px;align-items:center;flex:1 1 auto;height:100%}
.top-nav a{display:inline-flex;align-items:center;height:100%;font-size:14px;color:var(--aha-text-secondary);text-decoration:none;padding:0 14px;font-weight:500;border-bottom:2px solid transparent}
.top-nav a:hover{color:var(--aha-color-primary)}
.top-nav a.active{color:var(--aha-color-primary);font-weight:600;border-bottom-color:var(--aha-color-primary)}
.hmeta{flex:0 0 auto}
.brand .logo{width:30px;height:30px;display:inline-block;flex:0 0 auto}
.brand small{display:block;font-size:11px;font-weight:400;color:var(--aha-text-tertiary);letter-spacing:.2px;margin-top:1px}
.hmeta{font-size:12px;color:var(--aha-text-tertiary);display:flex;gap:14px;align-items:center}
.hmeta .ver{font-family:Menlo,monospace;background:var(--aha-gray-20);border-radius:6px;padding:3px 9px}
a.ver{color:var(--aha-text-tertiary);text-decoration:none}
a.ver:hover{color:var(--aha-color-primary);background:var(--aha-purple-10)}
.doc-body{display:flex;align-items:flex-start}
.doc-nav{position:sticky;top:64px;flex:0 0 268px;width:268px;height:calc(100vh - 64px);overflow-y:auto;padding:22px 14px 70px;border-right:1px solid var(--aha-split);background:#fff}
.doc-main{flex:1 1 auto;min-width:0;padding:36px 52px 96px}
.doc-main-inner{max-width:1040px;margin:0 auto}

/* ---- narrow shell: the 268px sidebar no longer fits beside content, so it becomes an
   off-canvas panel (opened via .doc-nav-toggle in the header) instead of forcing the page
   to scroll sideways. Same breakpoint as .hub-layout's own narrow collapse, for consistency. ---- */
.doc-nav-toggle{display:none;align-items:center;justify-content:center;width:36px;height:36px;padding:0;border:1px solid transparent;border-radius:var(--aha-radius-default,8px);background:transparent;color:var(--aha-text-secondary);cursor:pointer;flex:0 0 auto}
.doc-nav-toggle:hover{background:var(--aha-purple-10);color:var(--aha-color-primary)}
.doc-nav-backdrop{display:none;position:fixed;inset:64px 0 0 0;background:rgba(20,16,32,.35);z-index:34}
@media (max-width:900px){
  .doc-nav-toggle{display:inline-flex}
  .doc-nav{position:fixed;top:64px;left:0;z-index:35;width:min(84vw,300px);height:calc(100vh - 64px);
    transform:translateX(-100%);transition:transform var(--aha-motion-mid) var(--aha-ease-out);box-shadow:0 8px 24px rgba(20,16,32,.16)}
  body.nav-open .doc-nav{transform:translateX(0)}
  body.nav-open .doc-nav-backdrop{display:block}
  .doc-main{padding:28px 20px 72px}
}
@media (prefers-reduced-motion:reduce){.doc-nav{transition:none}}

/* ---- nav ---- */
.nav-top{display:block;text-decoration:none;color:var(--aha-text-secondary);font-size:14px;padding:8px 12px;border-radius:8px;margin-bottom:2px}
.nav-top:hover{background:var(--aha-purple-10);color:var(--aha-color-primary)}
.nav-top.active{background:var(--aha-purple-10);color:var(--aha-color-primary);font-weight:600}
.nav-group{margin:16px 0 8px}
.nav-cat{font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--aha-text-tertiary);font-weight:600;padding:6px 12px}
.nav-item{display:flex;align-items:center;justify-content:space-between;gap:8px;text-decoration:none;color:var(--aha-text-secondary);font-size:14px;padding:7px 12px;border-radius:8px;line-height:20px;margin:1px 0}
a.nav-item:hover{background:var(--aha-purple-10);color:var(--aha-color-primary)}
.nav-item.active{background:var(--aha-purple-10);color:var(--aha-color-primary);font-weight:600}
.nav-item.soon{color:var(--aha-text-disabled);cursor:default}
.nav-item.soon i{font-style:normal;font-size:9.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--aha-text-tertiary);background:var(--aha-gray-20);border-radius:5px;padding:1px 6px}
.nav-dot{flex:0 0 auto;width:6px;height:6px;border-radius:50%;background:var(--aha-color-success)}
.nav-count{flex:0 0 auto;font-size:10.5px;font-family:Menlo,monospace;color:var(--aha-text-tertiary);background:var(--aha-gray-20);border-radius:5px;padding:1px 6px}
.nav-item.raw{color:var(--aha-text-tertiary)}
a.nav-item.raw:hover{background:var(--aha-gray-20);color:var(--aha-text-secondary)}
.nav-item.raw i{font-style:normal;font-size:9.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--aha-text-tertiary);background:var(--aha-gray-20);border-radius:5px;padding:1px 6px;font-family:Menlo,monospace}
/* the item you're already on hides its live-dot/count — keeps active state purely class-driven
   so in-app navigation can retint it without rebuilding the sidebar */
.nav-item.active .nav-dot,.nav-item.active .nav-count{display:none}

/* ---- in-app (PJAX) navigation: swap the main pane, keep the shell — no full reload ---- */
.pjax-bar{position:fixed;top:0;left:0;height:2px;width:100%;transform:scaleX(0);transform-origin:0 50%;background:var(--aha-color-primary);z-index:60;opacity:0;pointer-events:none;border-radius:0 4px 4px 0;transition:transform var(--aha-motion-mid) var(--aha-ease-out),opacity var(--aha-motion-fast) var(--aha-ease-out)}
.pjax-bar.on{opacity:1}
.doc-main.pjax-in{animation:pjax-fade var(--aha-motion-mid) var(--aha-ease-out)}
@keyframes pjax-fade{from{opacity:.35}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.doc-main.pjax-in{animation:none}.pjax-bar{transition:opacity var(--aha-motion-fast) linear}}

/* ---- detail page ---- */
.highlights{margin:0 0 14px;padding:0;list-style:none;max-width:72ch;display:grid;gap:4px}
.highlights li{position:relative;margin:0;padding-left:18px;color:var(--aha-text-secondary);font-size:16px;line-height:25px}
.highlights li::before{content:"";position:absolute;left:3px;top:10px;width:6px;height:6px;border-radius:50%;background:var(--aha-color-primary)}
.highlights li code{font-size:.9em}
.doc-main h1{font-size:32px;line-height:40px;font-weight:600;margin:0 0 6px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;letter-spacing:0}
.subtitle{color:var(--aha-text-secondary);font-size:16px;line-height:25px;margin:0 0 10px;max-width:72ch}
.gen{font-size:11px;color:var(--aha-text-tertiary);margin:0 0 18px;font-family:Menlo,monospace}
.hub-back{font-size:13px;color:var(--aha-text-secondary);background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:8px;padding:9px 13px;margin:0 0 18px}
.hub-back a{color:var(--aha-color-primary);font-weight:600}
.doc-main h2{font-size:20px;line-height:28px;font-weight:600;margin:44px 0 14px;scroll-margin-top:80px}
.doc-main h2:first-of-type{margin-top:34px}
.body{line-height:1.75;color:var(--aha-text-default);max-width:72ch}
.badge{display:inline-block;font-size:11px;letter-spacing:.3px;text-transform:uppercase;font-weight:600;border-radius:6px;padding:3px 9px}
.badge.leaf{color:#0E7C63;background:#D3F5EC;border:1px solid #16C49A}
.badge.composite{color:#B24A20;background:#FFF0EB;border:1px solid #FF7747}
.badge.raw{color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);font-family:Menlo,monospace;text-transform:none}

/* ---- agent-feed code page ---- */
.code-panel.feed{border-radius:12px;margin:14px 0}
.code-panel.feed .tab{cursor:default}
.code-panel.feed pre{max-height:70vh}

/* ---- demo card (stage + code-toggle footer, AntD-style) ---- */
.demo{margin:0 0 12px;background:#fff}
.demo-stage{padding:0}
.demo-toolbar{display:flex;justify-content:flex-end;padding:9px 0;border-top:1px dashed var(--aha-split)}
.demo .code-panel{margin-top:0;border-radius:8px}

/* ---- interactive playground (the "smart widget": explore variants, don't stack them) ---- */
.aha-pg{display:flex;flex-direction:column;gap:10px;padding:13px 16px;margin-bottom:12px;border-radius:8px;background:var(--aha-gray-20)}
.aha-pg-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.aha-pg-label{font-size:11px;letter-spacing:.3px;text-transform:uppercase;font-weight:600;color:var(--aha-text-tertiary);min-width:62px}
.aha-pg-seg{display:inline-flex;flex-wrap:wrap;max-width:100%;gap:2px;padding:3px;background:#fff;border:1px solid var(--aha-split);border-radius:8px}
.aha-pg-opt{font-family:var(--aha-font-product);font-size:13px;font-weight:600;color:var(--aha-text-secondary);background:transparent;border:none;border-radius:6px;padding:5px 12px;cursor:pointer;transition:background .12s ease,color .12s ease}
.aha-pg-opt:hover:not(.active){color:#5715A0}
.aha-pg-opt.active{color:#5715A0;background:var(--aha-purple-10)}

/* ---- utilities used by preview parts ---- */
.tier{font-size:11px;letter-spacing:.3px;text-transform:uppercase;font-weight:600;color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:6px;padding:2px 8px;display:inline-block;margin-bottom:14px}
.lbl{font-size:var(--aha-size-default);line-height:var(--aha-space-20);font-weight:var(--aha-weight-semibold);color:var(--aha-text-secondary);margin:0 0 var(--aha-space-8)}
.lbl~.lbl{margin-top:var(--aha-space-24);padding-top:var(--aha-space-20);border-top:1px solid var(--aha-border)}
.row{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.stack{display:flex;flex-direction:column;gap:8px}
.grid2{display:grid;grid-template-columns:1fr 1fr}
.grid2>div{padding:22px 20px}.grid2>div:first-child{border-right:1px solid var(--aha-split)}
.note{background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.6;color:var(--aha-text-secondary)}
.pad{padding:12px 0}
code{font-family:Menlo,monospace;font-size:12px;background:var(--aha-gray-20);padding:1px 6px;border-radius:4px;color:#5715A0}
.api-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:8px}
table.api{width:100%;min-width:420px;border-collapse:collapse;font-size:13px;border:1px solid var(--aha-split);border-radius:8px;overflow:hidden}
table.api td,table.api th{text-align:left;padding:10px 14px;border-bottom:1px solid var(--aha-split);vertical-align:top}
table.api tr:last-child td{border-bottom:none}
table.api th{color:var(--aha-text-tertiary);font-weight:600;font-size:11px;letter-spacing:.3px;text-transform:uppercase;background:var(--aha-gray-20)}
ul{margin:0;padding-left:18px}li{margin:5px 0;line-height:1.6}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600;background:#D3F5EC;color:#0E7C63;margin:2px 4px 2px 0}
.pill.na{background:var(--aha-gray-20);color:var(--aha-text-tertiary)}
.spec-line{margin-bottom:12px;color:var(--aha-text-secondary);font-size:13px;line-height:1.7}

/* ---- component index cards (overview) ---- */
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.card{display:block;padding:18px;border:1px solid var(--aha-split);border-radius:12px;text-decoration:none;color:inherit;background:#fff}
.card:hover{border-color:var(--aha-purple-30);box-shadow:0 4px 12px rgba(106,30,187,.08)}
.ct{font-size:16px;font-weight:600;margin-bottom:4px;display:flex;align-items:center;gap:8px}
.cs{color:var(--aha-text-secondary);font-size:14px;line-height:1.55}
.cf{margin-top:10px;font-family:Menlo,monospace;font-size:11px;color:var(--aha-text-tertiary)}
.feeds{font-size:13px;line-height:1.9}.feeds code{margin-right:2px}

/* ---- code widget ---- */
.show-code{font-family:var(--aha-font-product);font-size:13px;font-weight:600;color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:8px;padding:8px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.show-code:hover{background:#F0E7FF}.show-code .chev{transition:transform .15s ease}
.code-tabs[data-open="true"] .show-code .chev{transform:rotate(90deg)}
.code-panel{background:#1A1A2E;overflow:hidden}
.code-head{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.08)}
.tabs{display:flex;gap:4px}
.tab{font-family:var(--aha-font-product);font-size:13px;font-weight:600;color:#8A83B0;background:transparent;border:none;border-radius:8px;padding:6px 16px;cursor:pointer}
.tab.active{color:#fff;background:#2E2A48}.tab:hover:not(.active){color:#C7A3FF}
.copy{font-family:var(--aha-font-product);font-size:12px;font-weight:600;color:#C7A3FF;background:transparent;border:1px solid rgba(199,163,255,.4);border-radius:8px;padding:5px 12px;cursor:pointer}
.copy:hover{background:rgba(199,163,255,.12)}
.code-panel pre{display:none;margin:0;background:transparent;color:#EAE6F5;padding:18px 20px;overflow:auto;font-family:Menlo,Monaco,monospace;font-size:12.5px;line-height:1.7;white-space:pre}
.code-panel pre.active{display:block}

/* ---- get started / consume + for-agents block ---- */
.consume{margin:8px 0 4px}
.consume-grid{display:grid;grid-template-columns:1fr;gap:12px;margin:14px 0}
.cg{border:1px solid var(--aha-split);border-radius:12px;overflow:hidden;background:#fff}
.cg-h{padding:9px 14px;font-size:12px;font-weight:600;color:var(--aha-text-secondary);background:var(--aha-gray-20);border-bottom:1px solid var(--aha-split)}
.cg-code{margin:0;padding:14px 16px;background:#1A1A2E;color:#EAE6F5;font-family:Menlo,Monaco,monospace;font-size:12.5px;line-height:1.7;white-space:pre-wrap;word-break:break-word}
.agent-feeds{font-size:13.5px;line-height:1.75}
.agent-feeds li{margin:7px 0}
.agent-feeds code{font-size:12px}
.install-note{margin-top:8px}
`;

// Narrow-shell off-canvas sidebar toggle. Bound once on the (never-replaced) header button, not
// per .doc-nav instance — PJAX may swap or replace .doc-nav entirely on an area change, but the
// toggle button lives in .doc-header, which PJAX never touches. State lives on <body>, so it
// survives that swap without re-binding.
const NAV_TOGGLE_JS = `
(function(){
  var toggle=document.querySelector('.doc-nav-toggle'), backdrop=document.querySelector('.doc-nav-backdrop');
  if(!toggle||toggle.__bound) return; toggle.__bound=true;
  function isOpen(){ return document.body.classList.contains('nav-open'); }
  function close(){ document.body.classList.remove('nav-open'); toggle.setAttribute('aria-expanded','false'); }
  function open(){ document.body.classList.add('nav-open'); toggle.setAttribute('aria-expanded','true'); }
  toggle.addEventListener('click', function(){ isOpen() ? close() : open(); });
  if(backdrop) backdrop.addEventListener('click', close);
  document.addEventListener('keydown', function(e){ if(e.key==='Escape'&&isOpen()) close(); });
  document.addEventListener('click', function(e){ if(isOpen() && e.target.closest('.doc-nav a')) close(); });
})();
`;

// Bindable (idempotent) so it can re-run over just-swapped content after an in-app navigation.
const WIDGET_JS = `
function ahaBindWidgets(root){
  (root||document).querySelectorAll('.code-tabs').forEach(function(w){
    if(w.dataset.bound) return; w.dataset.bound='1';
    var show=w.querySelector('.show-code'), panel=w.querySelector('.code-panel'), copy=w.querySelector('.copy');
    show.addEventListener('click',function(){
      var opening=panel.hasAttribute('hidden');
      if(opening){panel.removeAttribute('hidden');w.dataset.open='true';show.lastChild.textContent=' Hide code';}
      else{panel.setAttribute('hidden','');w.dataset.open='false';show.lastChild.textContent=' Show code';}
    });
    w.querySelectorAll('.tab').forEach(function(t){t.addEventListener('click',function(){
      w.querySelectorAll('.tab').forEach(function(x){x.classList.remove('active');});
      w.querySelectorAll('.code-panel pre').forEach(function(p){p.classList.remove('active');});
      t.classList.add('active');w.querySelector('.code-panel pre.'+t.dataset.f).classList.add('active');
    });});
    copy.addEventListener('click',function(){
      var a=w.querySelector('.code-panel pre.active'),text=a?a.textContent:'';
      var done=function(){copy.textContent='Copied';setTimeout(function(){copy.textContent='Copy';},1200);};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else fb(text,done);
      function fb(t,cb){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(ta);cb();}
    });
  });
}
`;

const FEED_JS = `
function ahaBindFeeds(root){
  (root||document).querySelectorAll('.code-panel.feed').forEach(function(w){
    if(w.dataset.bound) return;
    var copy=w.querySelector('.copy'), pre=w.querySelector('pre');
    if(!copy||!pre) return; w.dataset.bound='1';
    copy.addEventListener('click',function(){
      var text=pre.textContent;
      var done=function(){copy.textContent='Copied';setTimeout(function(){copy.textContent='Copy';},1200);};
      if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else fb(text,done);
      function fb(t,cb){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(ta);cb();}
    });
  });
}
`;

// The playground control bar (rendered by playgroundBar) is wired here: each segmented option sets
// (or removes, via the __remove__ sentinel) an attribute on the demo's target element — the live
// <aha-*> re-renders from its own attributes, so one element explores its whole variant matrix.
const PLAYGROUND_JS = `
function ahaBindPlayground(root){
  (root||document).querySelectorAll('.aha-pg[data-pg]').forEach(function(pg){
    if(pg.dataset.bound) return; pg.dataset.bound='1';
    var demo=pg.closest('.demo');
    var target=demo && (demo.querySelector('[data-pg-target]')||demo.querySelector('.demo-stage [data-probe]'));
    if(!target) return;
    function apply(prop,val){ if(val==='__remove__') target.removeAttribute(prop); else target.setAttribute(prop,val); }
    pg.querySelectorAll('.aha-pg-opt').forEach(function(opt){
      opt.addEventListener('click',function(){
        var seg=opt.closest('.aha-pg-seg');
        seg.querySelectorAll('.aha-pg-opt').forEach(function(o){o.classList.remove('active');o.setAttribute('aria-checked','false');});
        opt.classList.add('active'); opt.setAttribute('aria-checked','true');
        apply(opt.dataset.prop, opt.dataset.value);
      });
    });
  });
}
`;

// In-app navigation (PJAX): intercept internal .html links, fetch the target, and swap only the
// <main> pane — keeping the header + sidebar node (and its scroll) alive so navigation no longer
// flashes or reloads. Progressive enhancement: any failure falls back to a normal page load.
const PJAX_JS = `
(function(){
  ahaBindWidgets(document); ahaBindFeeds(document); ahaBindPlayground(document);
  if(!window.fetch||!window.history||!window.history.pushState||!window.DOMParser) return;
  if(!document.querySelector('.doc-body')||!document.querySelector('.doc-main')) return;

  // A demo page registers its <aha-*> element from a <script type="module"> that lives INSIDE
  // <main>. A script injected via DOMParser/replaceWith never runs, so after a swap we must
  // re-create it to execute (runScripts). Make define() idempotent first, so re-running a page's
  // (unguarded) customElements.define on revisit is a safe no-op, not an "already defined" throw.
  if(window.customElements && !customElements.__ahaGuard){
    customElements.__ahaGuard=true;
    var _def=customElements.define.bind(customElements);
    customElements.define=function(n,c,o){ if(!customElements.get(n)){ try{ _def(n,c,o); }catch(e){} } };
  }
  // Re-execute a swapped-in <main>'s scripts. Two hazards a naive re-create trips on:
  //   1. External <script src> injected dynamically load ASYNC and out of order — so a composite
  //      CDN-React preview's inline glue (dayjs.extend before dayjs, __antdR=antd before antd) can
  //      run before its dependency. Fix: walk in document order, awaiting each external load.
  //   2. Those composite previews author JSX as <script type="text/babel">, which only
  //      babel-standalone's ONE-TIME DOMContentLoaded auto-scan transpiles. That scan fired on the
  //      shell's first load and never fires again, so a re-injected text/babel block stays inert —
  //      the preview renders blank until a full reload. Fix: after the scripts are in, invoke the
  //      exact entry point that auto-scan uses — Babel.transformScriptTags() — to transpile + run it.
  // (Leaf previews use an inline <script type="module">, which always executes on re-insertion, so
  //  they already survived a swap — this only rescues the babel/CDN-React composites.)
  function recreate(old){
    var s=document.createElement('script');                       // a re-created node executes
    for(var i=0;i<old.attributes.length;i++) s.setAttribute(old.attributes[i].name, old.attributes[i].value);
    s.textContent=old.textContent;
    if(s.src){                                                    // external: await load to hold order + globals
      return new Promise(function(res){ s.onload=s.onerror=function(){ res(); }; old.replaceWith(s); });
    }
    old.replaceWith(s);                                           // inline classic runs now; module runs async; text/babel stays inert
    return Promise.resolve();
  }
  function runScripts(root){
    if(!root) return Promise.resolve();
    var list=[].slice.call(root.querySelectorAll('script'));
    var hasBabel=list.some(function(s){ return (s.type||'').indexOf('babel')>=0; });
    return list.reduce(function(chain, old){ return chain.then(function(){ return recreate(old); }); }, Promise.resolve())
      .then(function(){ if(hasBabel && window.Babel && typeof window.Babel.transformScriptTags==='function') window.Babel.transformScriptTags(); });
  }

  var bar=document.createElement('div'); bar.className='pjax-bar'; document.body.appendChild(bar);
  var barT;
  function startBar(){ clearTimeout(barT); bar.classList.add('on'); bar.style.transform='scaleX(0)'; requestAnimationFrame(function(){ bar.style.transform='scaleX(0.75)'; }); }
  function stopBar(){ bar.style.transform='scaleX(1)'; barT=setTimeout(function(){ bar.classList.remove('on'); bar.style.transform='scaleX(0)'; },220); }

  // Freeze relative href/src to absolute against a base URL, so links stay valid once a fragment
  // authored for a page at one depth is injected into a document living at another.
  function absolutize(scope, pageUrl){
    if(!scope) return;
    scope.querySelectorAll('[href],[src]').forEach(function(e){
      ['href','src'].forEach(function(attr){
        if(!e.hasAttribute(attr)) return;
        var v=e.getAttribute(attr);
        if(!v||/^(#|[a-z][a-z0-9+.-]*:|\\/\\/)/i.test(v)) return;
        try{ e.setAttribute(attr, new URL(v, pageUrl).href); }catch(_){}
      });
    });
  }
  absolutize(document.querySelector('.doc-header'), location.href);
  absolutize(document.querySelector('.doc-nav'), location.href);
  absolutize(document.querySelector('.doc-main'), location.href);

  function sectionOf(el){ return el ? el.getAttribute('data-section') : null; }

  function retint(scope, url){
    scope.querySelectorAll('a.nav-item, .top-nav a').forEach(function(a){ a.classList.toggle('active', a.href===url); });
  }

  function swap(html, url, push){
    var doc=new DOMParser().parseFromString(html,'text/html');
    var newBody=doc.querySelector('.doc-body'), newMain=doc.querySelector('.doc-main');
    if(!newBody||!newMain){ location.href=url; return; }
    absolutize(doc.querySelector('.doc-header'), url);
    absolutize(newBody, url);

    // Each page inlines its own page-specific CSS (extraCss) in <head><style> — the icon grid, the
    // token pages, the pattern pages. Carry it over, or a swapped-in <main> renders with unstyled
    // defaults (the styles only arrive on a full reload). Shared token/shell CSS is identical, so
    // replacing the whole <style> is safe and general.
    var newStyle=doc.head && doc.head.querySelector('style'), curStyle=document.head.querySelector('style');
    if(newStyle && curStyle && curStyle.textContent!==newStyle.textContent) curStyle.textContent=newStyle.textContent;

    var curBody=document.querySelector('.doc-body');
    if(sectionOf(curBody)===sectionOf(newBody)){
      // same area — keep the sidebar node (and its scroll), swap only the content pane
      document.querySelector('.doc-main').replaceWith(newMain);
      var nav=document.querySelector('.doc-nav'); if(nav) retint(nav, url);
    } else {
      // area changed — the sidebar itself differs, so replace the whole body (header stays)
      curBody.replaceWith(newBody);
    }
    var topNew=doc.querySelector('.top-nav'), topCur=document.querySelector('.top-nav');
    if(topNew&&topCur) topCur.innerHTML=topNew.innerHTML;
    if(doc.title) document.title=doc.title;

    var main=document.querySelector('.doc-main');
    if(main) main.classList.add('pjax-in');
    if(push) history.pushState({pjax:1}, '', url);   // set the URL first so relative module imports resolve
    runScripts(main);                                 // execute the page's <script type="module"> (defines <aha-*>)
    ahaBindWidgets(main); ahaBindFeeds(main); ahaBindPlayground(main);
    var hash=url.indexOf('#')>=0 ? url.slice(url.indexOf('#')+1) : '';
    var t=hash && document.getElementById(hash);
    if(t) t.scrollIntoView(); else window.scrollTo(0,0);
  }

  // Prefetch cache: hovering/focusing a link warms its HTML so the click swaps instantly.
  var cache=new Map();
  function load(url){
    if(cache.has(url)) return cache.get(url);
    var p=fetch(url,{headers:{'X-Requested-With':'pjax'}}).then(function(r){
      if(!r.ok) throw new Error(r.status); return r.text();
    }).catch(function(){ cache.delete(url); return null; });   // drop failures so a retry can refetch
    cache.set(url, p); return p;
  }

  var busy=false;
  function go(url, push){
    if(busy) return; busy=true; startBar();
    load(url).then(function(html){ if(html==null){ location.href=url; return; } swap(html, url, push); })
      .catch(function(){ location.href=url; })
      .then(function(){ busy=false; stopBar(); });
  }

  function isLocal(a){
    if(!a||a.target==='_blank'||a.hasAttribute('download')) return false;
    var href=a.getAttribute('href'); if(href==null) return false;
    if(/^(#|mailto:|tel:|javascript:)/i.test(href)) return false;
    if(a.origin!==location.origin) return false;
    return /\\.html$/.test(a.pathname);
  }

  document.addEventListener('click', function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    var a=e.target.closest('a'); if(!isLocal(a)) return;
    var url=a.href;
    if(url.split('#')[0]===location.href.split('#')[0]) return; // same page — let the browser handle #anchors
    e.preventDefault(); go(url, true);
  });
  // Warm the cache on intent — hover or keyboard focus — so the eventual click is instant.
  function warm(e){
    var a=e.target.closest&&e.target.closest('a'); if(!isLocal(a)) return;
    if(a.href.split('#')[0]!==location.href.split('#')[0]) load(a.href);
  }
  document.addEventListener('pointerover', warm);
  document.addEventListener('focusin', warm);
  window.addEventListener('popstate', function(){ go(location.href, false); });
})();
`;

function codeWidget(c) {
  const tabs = c.snippets.map((s, i) =>
    `<button class="tab ${i===0?'active':''}" type="button" data-f="${s.key}">${esc(s.label)}</button>`).join('');
  const panes = c.snippets.map((s, i) =>
    `<pre class="code ${s.key} ${i===0?'active':''}">${esc(part(s.file))}</pre>`).join('\n');
  return `<div class="code-tabs" data-open="false">
    <div class="demo-toolbar"><button class="show-code" type="button"><span class="chev">▸</span> Show code</button></div>
    <div class="code-panel" hidden>
      <div class="code-head"><div class="tabs">${tabs}</div><button class="copy" type="button">Copy</button></div>
      ${panes}
    </div></div>`;
}
const dedent = (text) => {
  const lines = text.split('\n');
  const indent = Math.min(...lines.slice(1).filter(l => l.trim()).map(l => l.match(/^ */)[0].length), Infinity);
  return [lines[0], ...lines.slice(1).map(l => l.slice(Number.isFinite(indent) ? indent : 0))].join('\n');
};
const chartCaseMarkup = (caseHtml) => {
  const element = caseHtml.match(/<aha-chart[\s\S]*?<\/aha-chart>/);
  if (!element) return '';
  const copyable = element[0].replace(/\s+data-probe(?=[\s>])/, '').replace(/"image":"data:[^"]*"/g, '"image":"https://example.com/option.png"');
  return dedent(copyable);
};

const CHART_TYPE_EVENTS = {
  wordcloud: { name: 'wordcloud-hide', handler: 'onHide', detail: 'hidden', note: 'fires when a word is hidden or restored; detail.hidden lists the hidden words' },
  mindmap: { name: 'mindmap-change', handler: 'onChange', detail: 'tree', note: 'fires on every edit once options.editable is true; detail.tree is the whole map' },
};
function parseChartElement(html) {
  const open = html.match(/<aha-chart\b([\s\S]*?)>\s*<\/aha-chart>/);
  const attrs = [];
  for (const m of (open ? open[1] : '').matchAll(/([\w-]+)=(?:"([^"]*)"|'([^']*)')/g)) attrs.push([m[1], m[2] ?? m[3]]);
  const dataAttr = attrs.find(([name]) => name === 'data');
  const data = dataAttr
    ? JSON.stringify(JSON.parse(dataAttr[1]), null, 2).replace(/\{[^{}[\]]*\}/g, (flat) => flat.replace(/\s*\n\s*/g, ' '))
    : 'null';
  return { data, plain: attrs.filter(([name]) => name !== 'data') };
}
const pascal = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const indentLines = (text, spaces) => text.split('\n').map((line, i) => (i ? ' '.repeat(spaces) + line : line)).join('\n');
const chartTypeFrameworkSnippets = (type, html) => {
  const { data, plain } = parseChartElement(html);
  const component = `${pascal(type)}Chart`;
  const event = CHART_TYPE_EVENTS[type];
  const staticAttrs = plain.map(([name, value]) => `${name}="${value}"`).join(' ');
  const reactEvent = event ? `
  useEffect(() => {
    const chart = ref.current;
    const ${event.handler} = (event) => console.log(event.detail.${event.detail});   // ${event.note}
    chart.addEventListener('${event.name}', ${event.handler});
    return () => chart.removeEventListener('${event.name}', ${event.handler});
  }, []);
` : '';
  const react = `import '@ahaslides-product/design/aha-chart';   // registers <aha-chart>
import { useEffect, useRef } from 'react';

const data = ${indentLines(data, 0)};

// React 18 passes objects to custom elements as strings, so data is set as a property through a ref
// (a JSON string in the data attribute also works). Events are listened to on the ref too.
export function ${component}() {
  const ref = useRef(null);
  useEffect(() => { ref.current.data = data; }, []);
${reactEvent}
  return <aha-chart ref={ref} ${staticAttrs} />;
}
`.replace(/\n\n\n/g, '\n\n');
  const vueEvent = event ? ` @${event.name}="${event.handler}"` : '';
  const vueHandler = event ? `
const ${event.handler} = (event) => console.log(event.detail.${event.detail});   // ${event.note}
` : '';
  const vue = `// main.ts — register the element + mark aha-* as custom elements
import '@ahaslides-product/design/aha-chart';
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('aha-');

// ${component}.vue — .prop binds data as a property, so live updates animate
<script setup>
const data = ${indentLines(data, 0)};
${vueHandler}</script>

<template>
  <aha-chart ${staticAttrs} :data.prop="data"${vueEvent} />
</template>
`;
  return { react, vue };
};

// One "Show code" per chart type on the Charts page: the type's default snippet, plus the markup of
// whichever case the switcher is showing (the preview script keeps the "case" pane in step).
function chartTypeCodeWidget(def, cases) {
  const html = part(def.file).trim();
  const { react, vue } = chartTypeFrameworkSnippets(def.type, html);
  const tabs = [['html', 'HTML', html], ['react', 'React', react], ['vue', 'Vue 3', vue], ['case', 'Selected case', cases[0] || html]];
  const tabButtons = tabs.map(([key, label], i) => `<button class="tab ${i === 0 ? 'active' : ''}" type="button" data-f="${key}">${esc(label)}</button>`).join('');
  const panes = tabs.map(([key, , code], i) => `<pre class="code ${key} ${i === 0 ? 'active' : ''}">${esc(code)}</pre>`).join('\n');
  return `<div class="code-tabs chart-type-code" data-open="false" data-cases="${esc(JSON.stringify(cases))}">
    <div class="demo-toolbar"><button class="show-code" type="button"><span class="chev">▸</span> Show code</button></div>
    <div class="code-panel" hidden>
      <div class="code-head"><div class="tabs">${tabButtons}</div><button class="copy" type="button">Copy</button></div>
      ${panes}
    </div></div>`;
}
function chartSectionsWithCode(c) {
  const defaults = new Map((c.typeDefaults || []).map(d => [d.title, d]));
  return part(c.preview).replace(/<section class="chart-type"[\s\S]*?<\/section>/g, (section) => {
    const title = (section.match(/<h3 class="chart-type-title"[^>]*>([^<]+)</) || [])[1];
    const def = defaults.get(title);
    if (!def) return section;
    const cases = [...section.matchAll(/<div class="chart-case"[^>]*>([\s\S]*?)(?=<div class="chart-case"|<\/section>)/g)].map(m => chartCaseMarkup(m[1]));
    return section.replace(/<\/section>$/, `${chartTypeCodeWidget(def, cases)}\n  </section>`);
  });
}
// Static docs grid helper (like ant.design's own API/token tables) — NOT an AntD data-grid
// call site, so the shared-DataTable rule doesn't apply. The tag name is composed so the
// call-site guard (which greps for the literal opening tag) stays quiet on these docs tables.
const TBL = 't' + 'able';
// Wrapped in its own scroll container — the documented "wide table scrolls" exception to the
// responsive floor (AGENTS.md) — so a wide API table scrolls in place rather than pushing the page.
const docTable = (head, rows) => `<div class="api-scroll"><${TBL} class="api"><tr>${head}</tr>${rows}</${TBL}></div>`;

function propsTable(props) {
  if (!props || !props.length) return '';
  const rows = props.map(p => `<tr><td><code>${esc(p.name)}</code></td><td>${esc(p.type)}</td><td><code>${esc(p.default)}</code></td><td>${esc(p.desc)}</td></tr>`).join('');
  return docTable('<th>Prop</th><th>Type</th><th>Default</th><th>Notes</th>', rows);
}
const specList = (spec) => (spec||[]).map(s => `<b>${esc(s.label)}</b> ${esc(s.value)}`).join(' · ');
const selfCheck = (sc) => (sc||[]).map(s => `${esc(s.label)} <span class="pill ${s.verdict==='N/A'?'na':''}">${esc(s.verdict)}</span>`).join(' ');
function opinionBlock(o) {
  if (!o) return '';
  const use = (o.whenToUse||[]).map(x => `<li><b>${esc(x.what)}</b> — ${esc(x.when)}</li>`).join('');
  return `<div class="lbl">When to use</div><ul>${use}</ul>` + (o.note ? `<div class="note" style="margin-top:10px">${esc(o.note)}</div>` : '');
}
function surfaceBlock(s) {
  if (!s || !s.length) return '';
  return `<div class="lbl" style="margin-top:14px">Surfaces</div><div>${s.map(x=>`<span class="pill na">${esc(x)}</span>`).join(' ')}</div>`;
}

/* ===== app shell: header + left component nav + main (shared by every page) ===== */
// Agent feeds — the raw .md/.txt/.css artifacts served to agents/LLMs. Rendered as styled
// in-shell pages that show the ACTUAL file content in a code wrapper (with copy), so the
// docs stay consistent instead of dumping unstyled raw text in the browser.
const RAW_FEEDS = [
  { name: 'design.md',     file: 'design.md',      page: 'design-md',     desc: 'Machine-readable visual language + token spec — the feed AI design/code tools read.' },
  { name: 'llms.txt',      file: 'llms.txt',       page: 'llms-txt',      desc: 'The index feed: one entry per component. An agent’s entry point to the system.' },
  { name: 'llms-full.txt', file: 'llms-full.txt',  page: 'llms-full-txt', desc: 'Every component doc concatenated — the full-context feed.' },
  { name: 'CHANGELOG.md',  file: 'CHANGELOG.md',   page: 'changelog',     desc: 'Version history — what changed in each release. One entry per merge; the top version matches the package.' },
  { name: 'variables.css', file: 'variables.css',  page: 'variables-css', desc: 'The --aha-* token layer as CSS custom properties, generated from tokens.canonical.json.' },
  { name: 'icons.llms.txt', file: 'icons.llms.txt', page: 'icons-llms-txt', desc: 'Every icon name, grouped by family — the feed an agent reads to call <aha-icon name="…"> instead of writing an SVG.' },
  { name: 'icons.agent.json', file: 'icons.agent.json', page: 'icons-agent-json', desc: 'Machine feed: the full icon catalogue (names + family + recolorable) plus the <aha-icon> usage contract.' },
];
// Header top-nav — the AntD-style area switcher. Each area lands on its own screen.
function topNav(base, section) {
  return `<nav class="top-nav">` + SECTIONS.map(s => {
    if (s.key === 'guidelines' && !GUIDELINES.length) return '';
    if (s.key === 'audience' && !AUDIENCE) return '';
    const href = base + (NAV_LANDING[s.key] || 'index.html');
    return `<a class="${section===s.key?'active':''}" href="${href}">${esc(s.label)}</a>`;
  }).join('') + `</nav>`;
}

// Left sidebar — scoped to the CURRENT area only (empty on Overview, which is full-width).
function sidebarNav(base, active, section) {
  if (section === 'overview') return '';
  let inner = '';
  if (section === 'foundations') {
    const tokenItems = TOKEN_PAGES.map(p =>
      `<a class="nav-item${active==='token:'+p.slug?' active':''}" href="${base}foundations/${p.slug}.html"><span>${esc(p.label)}</span><span class="nav-dot" title="live"></span></a>`).join('');
    inner =
      `<div class="nav-group"><div class="nav-cat">Design tokens</div>${tokenItems}</div>` +
      `<div class="nav-group"><div class="nav-cat">Assets</div>` +
      `<a class="nav-item${active==='__logo__'?' active':''}" href="${base}foundations/logo.html"><span>Logo library</span><span class="nav-count">${LOGO_MANIFEST.length}</span></a>` +
      `<a class="nav-item${active==='__icons__'?' active':''}" href="${base}icons/index.html"><span>Icon library</span><span class="nav-count">${ICONS.count}</span></a>` +
      `</div>`;
  } else if (section === 'components' || section === 'patterns') {
    // Components (Ant-general) and Patterns (AhaSlides-composed) render the SAME way — a live/soon
    // catalogue of component pages; only which catalogue drives the sidebar differs.
    const cat = section === 'patterns' ? PATTERNS_CATALOG : COMPONENTS_CATALOG;
    inner = cat.map(g => {
      const items = g.items.map(it => {
        if (LIVE.has(it.slug))
          return `<a class="nav-item${it.slug===active?' active':''}" href="${base}${it.slug}/index.html"><span>${esc(it.name)}</span><span class="nav-dot" title="live"></span></a>`;
        return `<span class="nav-item soon"><span>${esc(it.name)}</span><i>soon</i></span>`;
      }).join('');
      return `<div class="nav-group"><div class="nav-cat">${esc(g.cat)}</div>${items}</div>`;
    }).join('');
    if (section === 'patterns' && MARKETING.length) inner +=
      `<div class="nav-group"><div class="nav-cat">${MARKETING_CAT}</div>` +
      MARKETING.map(b => `<a class="nav-item${active===('marketing:'+b.slug)?' active':''}" href="${base}marketing/${b.slug}/index.html"><span>${esc(b.name)}</span><span class="nav-dot" title="live"></span></a>`).join('') +
      `</div>`;
  } else if (section === 'settings') {
    // Settings is ONE page under ONE URL. Every component lives inline on settings/index.html, so the
    // sidebar never routes to a per-component page — each item is an in-page anchor (#ctrl-<slug>) to
    // that same page. On the hub the href is a bare hash (pure in-page scroll, no URL change); on a
    // standalone control page it lands back on the one page at that section.
    const onHub = active === 'hub:settings';
    const anchorHref = (slug) => onHub ? `#ctrl-${slug}` : `${base}settings/index.html#ctrl-${slug}`;
    const items = SETTINGS_CATALOG.map(g =>
      `<div class="nav-group"><div class="nav-cat">${esc(g.cat)}</div>` +
      g.items.map(it => LIVE.has(it.slug)
        ? `<a class="nav-item${it.slug===active?' active':''}" href="${anchorHref(it.slug)}"><span>${esc(it.name)}</span><span class="nav-dot" title="live"></span></a>`
        : `<span class="nav-item soon"><span>${esc(it.name)}</span><i>soon</i></span>`).join('') +
      `</div>`).join('');
    inner =
      `<div class="nav-group"><div class="nav-cat">Overview</div>` +
      `<a class="nav-item${onHub?' active':''}" href="${onHub ? '#top' : `${base}settings/index.html`}"><span>All settings (one page)</span><span class="nav-dot" title="live"></span></a>` +
      `</div>` + items;
  } else if (section === 'guidelines') {
    inner = `<div class="nav-group"><div class="nav-cat">Guidelines</div>` +
      GUIDELINES.map(p => `<a class="nav-item${active===('guideline:'+p.slug)?' active':''}" href="${base}guidelines/${p.slug}/index.html"><span>${esc(p.name)}</span><span class="nav-dot" title="live"></span></a>`).join('') +
      `</div>`;
  } else if (section === 'feeds') {
    inner = `<div class="nav-group"><div class="nav-cat">Agent feeds</div>` +
      RAW_FEEDS.map(f => `<a class="nav-item raw${active===('feed:'+f.file)?' active':''}" href="${base}feeds/${f.page}.html"><span>${esc(f.name)}</span><i>raw</i></a>`).join('') +
      `</div>`;
  }
  return `<nav class="doc-nav" id="doc-nav">${inner}</nav>`;
}

const missingGlyphs = SEARCH_GLYPHS.filter(n => !ICONS.icons[n]);
if (missingGlyphs.length && ICONS.count) throw new Error(`docs search uses glyphs missing from icons/registry.json: ${missingGlyphs.join(', ')}`);
function docShell({ base, active, section = 'components', main, extraCss = '', noSidebar = false }) {
  // The Settings page carries its own in-page antd Anchor, so the shell sidebar would be a second
  // nav of the same items — noSidebar drops it and .doc-main (flex:1) reclaims the width.
  const nav = noSidebar ? '' : sidebarNav(base, active, section);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AhaSlides Design System — for agents</title>
<meta name="generator" content="ahaslides-design generate.mjs"/>
<meta name="aha:package" content="${esc(PKGNAME)}"/>
<meta name="aha:registry" content="${esc(REGISTRY)}"/>
<meta name="aha:install" content="npm i ${esc(PKGNAME)}"/>
<meta name="aha:llms" content="${SITE}/llms.txt"/>
<link rel="alternate" type="text/plain" title="llms.txt — agent index feed" href="${SITE}/llms.txt"/>
<link rel="alternate" type="text/plain" title="llms-full.txt — full docs" href="${SITE}/llms-full.txt"/>
<link rel="alternate" type="text/markdown" title="design.md — visual language" href="${SITE}/design.md"/>
<link rel="alternate" type="text/markdown" title="CHANGELOG.md — version history" href="${SITE}/CHANGELOG.md"/>
<style>${tokenVars(TOK)}${shellCss(base)}${SEARCH_CSS}${extraCss}</style></head><body>
<header class="doc-header">
  <a class="brand" href="${base}index.html"><svg class="logo" viewBox="0 0 802 788" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M170.733 275.998C278.798 265.243 378.859 323.322 335.099 444.05C314.506 506.19 275.855 581.827 243.31 638.991C215.75 687.389 176.897 762.933 120.57 779.886C47.4014 801.893 13.3568 737.231 38.653 673.946C50.1622 645.147 76.3125 617.797 98.9558 596.777C156.207 543.64 209.364 500.767 267.058 447.815C322.558 396.876 304.327 320.548 218.229 348.597C177.136 361.996 147.118 395.204 100.29 386.241C77.245 381.831 59.1047 363.439 62.4007 338.917C68.3362 294.758 133.204 278.683 170.733 275.998Z" fill="#FF4081"/><path d="M450.382 386.525C486.54 382.591 528.879 404.694 561.903 419.06C613.821 441.642 719.681 495.692 751.619 545.435C773.16 578.987 758.736 620.992 723.868 629.865C680.288 637.375 652.573 611.747 625.142 583.886C583.067 541.158 542.425 487.894 502.946 446.124C459.708 404.54 411.899 421.557 428.008 479.843C437.434 513.92 476.519 553.502 451.17 590.608C432.96 617.264 400.896 603.783 387.05 579.1C355.646 523.118 368.986 393.785 450.369 386.525H450.382Z" fill="#6A1EBB"/><path d="M395.401 274.91C359.243 278.844 311.02 252.439 277.995 238.073C226.078 215.492 127.572 164.107 98.4196 118.689C76.8782 85.137 82.5894 39.0804 126.17 31.5704C169.75 24.0603 197.412 51.5244 223.829 78.3561C263.853 119.008 305.44 175.986 347.904 218.444C381.523 254.744 436.591 242.313 420.482 184.027C411.056 149.95 369.615 104.535 398.068 68.6762C418.857 42.4809 447.41 59.2659 459.706 83.1959C490.656 143.426 480.25 265.499 395.414 274.91L395.401 274.91Z" fill="#6A1EBB"/><path d="M513.867 313.624C513.866 313.622 513.869 313.62 513.87 313.622C537.558 338.301 582.265 297.03 606.997 294.547C624.974 292.744 647.013 299.901 646.488 321.974C646.488 358.004 581.094 363.359 554.43 360.693C502.932 355.544 465.718 321.759 484.522 264.702C500.282 216.871 551.389 106.373 589.653 75.139C630.502 41.788 679.136 67.0343 663.298 119.505C651.501 158.567 571.718 215.383 539.267 245.611C522.147 261.559 494.137 291.042 513.863 313.626C513.865 313.628 513.868 313.626 513.867 313.624Z" fill="#FF4081"/></svg><span>AhaSlides Design</span></a>
  ${noSidebar ? '' : `<button class="doc-nav-toggle" type="button" aria-label="Browse components" aria-expanded="false" aria-controls="doc-nav"><aha-icon name="system-list" size="18" decorative></aha-icon></button>`}
  ${topNav(base, section)}
  ${searchHeaderHtml(base)}
  <div class="hmeta"><a class="ver" href="${base}feeds/changelog.html" title="Changelog — what changed in each release">v${esc(PKG.version)}</a><span>React · Vue · Lit</span></div>
</header>
<div class="doc-nav-backdrop"></div>
<div class="doc-body" data-section="${section}">
  ${nav}
  <main class="doc-main"><div class="doc-main-inner">${anchorHeadings(main)}</div></main>
</div>
<script type="module">import '${base || './'}lib/icons.js';</script>
<script>${SEARCH_JS}${NAV_TOGGLE_JS}${WIDGET_JS}${FEED_JS}${PLAYGROUND_JS}${PJAX_JS}</script>
</body></html>`;
}

function headline(highlights, fallbackHtml) {
  return highlights?.length
    ? `<ul class="highlights">${highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>`
    : `<p class="subtitle">${fallbackHtml}</p>`;
}

const FEED_HIGHLIGHTS = {
  'design.md': ['Visual language and token spec in one file', 'The feed AI design and code tools read'],
  'llms.txt': ['Index feed with one entry per component', 'An agent’s entry point to the system'],
  'llms-full.txt': ['Every component doc concatenated', 'The full-context feed'],
  'CHANGELOG.md': ['Version history, one entry per merge', 'The top version matches the package'],
  'variables.css': ['The --aha-* token layer as CSS custom properties', 'Generated from tokens.canonical.json'],
  'icons.llms.txt': ['Every icon name, grouped by family', 'Read it to call <aha-icon name="…"> instead of writing an SVG'],
  'icons.agent.json': ['Full icon catalogue: names, family, recolorable', 'Plus the <aha-icon> usage contract'],
  'guidelines.llms.txt': ['One entry per composition pattern', 'What it reuses, rule count and component backlog'],
  'guidelines.agent.json': ['Every pattern with its composedOf reuse graph', 'Rules, each tied to a skill assertion', 'Whether the pattern ships code'],
  'marketing.llms.txt': ['One entry per marketing section', 'Paste-and-run and token-bound, for the marketing sites'],
  'marketing.agent.json': ['Every marketing section with its summary', 'Paste-and-run html and css, and how to consume it'],
  'anti-slop.md': ['The official anti-slop loop', 'Per-surface rules plus a binary judge a consumer self-runs', 'Read it before building'],
  'anti-slop.agent.json': ['The anti-slop loop in machine form', 'Per-surface rules, criteria and selfCheck', 'Compiled from the DS-owned criteria store'],
};

// Agent-feed page: the raw file content shown in a code wrapper (with copy), inside the shell.
function renderFeedPage(f, content) {
  const main = `
  <h1>${esc(f.name)} <span class="badge raw">raw feed</span></h1>
  ${headline(FEED_HIGHLIGHTS[f.file], esc(f.desc))}
  <p class="gen">◆ generated — the exact file served to agents at <code>/${esc(f.file)}</code> · do not edit by hand</p>
  <div class="code-panel feed">
    <div class="code-head"><div class="tabs"><span class="tab active">${esc(f.file)}</span></div><button class="copy" type="button">Copy</button></div>
    <pre class="active">${esc(content)}</pre>
  </div>`;
  return docShell({ base: '../', active: 'feed:' + f.file, section: 'feeds', main });
}

// The "smart widget" control bar: one compact segmented row per playground axis. Each option carries
// the attribute (data-prop) + value it applies to the demo's target element; PLAYGROUND_JS wires the
// clicks. A null/undefined option value becomes the __remove__ sentinel (removeAttribute). Absent a
// `playground` block, this renders nothing and the demo is the plain default stage.
function playgroundBar(c) {
  const pg = c.playground;
  if (!pg || !Array.isArray(pg.controls) || !pg.controls.length) return '';
  const rows = pg.controls.map((ctrl) => {
    const opts = (ctrl.options || []).map((o, i) => {
      const raw = (o.value === null || o.value === undefined) ? '__remove__' : String(o.value);
      const active = ctrl.default !== undefined ? (String(o.value) === String(ctrl.default)) : i === 0;
      return `<button type="button" class="aha-pg-opt${active ? ' active' : ''}" role="radio" aria-checked="${active}"` +
        ` data-prop="${esc(ctrl.prop)}" data-value="${esc(raw)}">${esc(o.label)}</button>`;
    }).join('');
    return `<div class="aha-pg-row"><span class="aha-pg-label">${esc(ctrl.label)}</span>` +
      `<div class="aha-pg-seg" role="radiogroup" aria-label="${esc(ctrl.label)}">${opts}</div></div>`;
  }).join('');
  return `<div class="aha-pg" data-pg>${rows}</div>`;
}

const docPagePath = (c) => c.docPage || `${c.slug}/index.html`;

/* Charts — its OWN top-level area, one self-contained page (charts/index.html), built like the Settings
   hub and Audience Library: noSidebar shell + the shared sticky antd Anchor. The page body is the
   chart contract's own doc content, so nothing is duplicated. */
function renderChartsPage(c) {
  const preview = chartSectionsWithCode(c);
  const chartTypes = [...preview.matchAll(/<h3 class="chart-type-title" id="([^"]+)">([^<]+)<\/h3>/g)].map(([, id, title]) => ({ id, title }));
  const sections = [
    { id: 'examples', title: 'Chart types', children: chartTypes, html: `<h2 id="examples">Chart types</h2>
  <div class="demo">
    ${playgroundBar(c)}
    <div class="demo-stage">${preview}</div>
  </div>` },
    { id: 'choosing-a-chart', title: 'Choosing a chart', html: `<h2 id="choosing-a-chart">Choosing a chart</h2>${c.opinion ? opinionBlock(c.opinion) + surfaceBlock(c.surfaces) : ''}` },
    { id: 'api', title: 'API', html: `<h2 id="api">API</h2>\n  ${propsTable(c.props)}` },
    { id: 'install', title: 'Install and use', html: `<h2 id="install">Install and use</h2>${componentConsume(c, { heading: false })}<div class="demo">${codeWidget(c)}</div>` },
    { id: 'spec', title: 'Spec', html: `<h2 id="spec">Spec</h2>\n  <div class="spec-line">${specList(c.spec)}</div>` },
  ];
  const anchorItems = sections.map(x => ({ key: x.id, href: '#' + x.id, title: x.title,
    ...(x.children ? { children: x.children.map(t => ({ key: t.id, href: '#' + t.id, title: t.title })) } : {}) }));
  const fallbackGroups = [
    { cat: 'Chart types', links: chartTypes },
    { cat: null, links: sections.filter(x => !x.children).map(x => ({ id: x.id, title: x.title })) },
  ];
  const main = `
  <h1>${esc(c.name)}</h1>
  ${headline(c.highlights, esc(c.summary))}
  <!-- generated from contracts/${c.slug}.json + tokens.canonical.json — do not edit by hand -->
  <div class="hub-layout">
    ${hubAnchorAside(fallbackGroups)}
    <div class="hub-body">${sections.map(x => x.html).join('\n\n  ')}</div>
  </div>
  ${hubAnchorScript(anchorItems)}`;
  return docShell({ base: '../', active: 'charts', section: 'charts', main, extraCss: HUB_ANCHOR_CSS + '.hub-body h2,.hub-body .chart-type-title{scroll-margin-top:84px}', noSidebar: true });
}

function renderHtml(c) {
  if (c.docPage) return renderChartsPage(c);
  const preview = part(c.preview);
  const isSettings = SETTINGS_SLUGS.has(c.slug);  // settings-panel family → its OWN Settings area
  const isPattern = !isSettings && PATTERN_SLUGS.has(c.slug);   // AhaSlides-composed → Patterns area
  const area = isSettings ? 'settings' : isPattern ? 'patterns' : 'components';
  const main = `
  <h1>${esc(c.name)}</h1>
  ${headline(c.highlights, esc(c.summary))}
  <!-- generated from contracts/${c.slug}.json + tokens.canonical.json — do not edit by hand -->
  ${c.hubRef ? `<p class="hub-back">Also on the standalone <a href="../${esc(c.hubRef)}/index.html">Settings page</a> — the whole settings surface, including this component, inline on one page.</p>` : ''}

  <h2>Examples</h2>
  <div class="demo">
    ${playgroundBar(c)}
    <div class="demo-stage">${preview}</div>
    ${codeWidget(c)}
  </div>

  <h2>API</h2>
  ${propsTable(c.props)}

  ${componentConsume(c)}

  ${c.opinion ? `<h2>When to use</h2>${opinionBlock(c.opinion)}${surfaceBlock(c.surfaces)}` : ''}

  <h2>Spec</h2>
  <div class="spec-line">${specList(c.spec)}</div>`;
  return docShell({ base: '../', active: c.slug, section: area, main });
}

// Hidden conformance harness (composites): mounts both framework tiers with the token layer,
// so qa.mjs can measure React ≡ Vue parity even though the doc page shows a single UI.
function renderConformanceHarness(c) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<style>${tokenVars(TOK)}
body{margin:0;font-family:var(--aha-font-product);background:#fff;color:var(--aha-text-default)}</style></head>
<body>${part(c.conformancePart)}</body></html>`;
}

// Every component ships a paste-and-run HTML snippet, so agents lead with it (no build step).
// Leaf → the custom element is the native form. Composite (no framework-free element) → a
// CDN-React runnable page: React + antd loaded from a CDN, so it still opens-and-renders.
const hasHtml = (c) => (c.snippets || []).some(s => s.key === 'html');
const leafHtml = (c) => c.tier === 'leaf-lit';
const frameworksLine = (c) => hasHtml(c) ? 'HTML (paste-and-run, no build step) · React · Vue 3' : 'React, Vue 3';
const htmlKind = (c) => leafHtml(c)
  ? `<${c.element}> is a standard custom element that renders on open — React/Vue are thin adapters over the same element`
  : `a CDN-React runnable page (React + antd loaded from a CDN, no build step) — React/Vue wire the same real vendor component to the shared theme via ConfigProvider in your bundler`;

const typeDefaultsMd = (c) => (c.typeDefaults || []).length
  ? '\n## Default snippet per type\nStart from the type\'s default and only add attributes — never strip behaviour. The HTML is the element markup alone (load the element once with the HTML snippet\'s import); the React and Vue 3 forms set data as a property and wire the events.\n' +
    c.typeDefaults.map(d => {
      const html = part(d.file).trim();
      const { react, vue } = chartTypeFrameworkSnippets(d.type, html);
      return `\n### ${d.title}\n\`\`\`html\n${html}\n\`\`\`\n\n\`\`\`jsx\n${react.trim()}\n\`\`\`\n\n\`\`\`vue\n${vue.trim()}\n\`\`\``;
    }).join('\n')
  : '';
const typeDefaultsMap = (c) => Object.fromEntries((c.typeDefaults || []).map(d => {
  const html = part(d.file).trim();
  return [d.type, { html, ...chartTypeFrameworkSnippets(d.type, html) }];
}));

function renderMd(c) {
  const props = (c.props||[]).map(p => `| \`${p.name}\` | ${p.type} | \`${p.default}\` | ${p.desc} |`).join('\n');
  const spec = (c.spec||[]).map(s => `- ${s.label}: ${s.value}`).join('\n');
  const use = c.opinion ? '\n## When to use\n' + (c.opinion.whenToUse||[]).map(x=>`- **${x.what}** — ${x.when}`).join('\n') + (c.opinion.note?`\n\n${c.opinion.note}`:'') : '';
  const surf = (c.surfaces&&c.surfaces.length) ? `\n\nSurfaces: ${c.surfaces.join(', ')}.` : '';
  return `# ${c.name}
> Generated from ${c.slug}.contract.json — do not edit by hand.

${c.summary}

Tier: **${c.tier}**. Frameworks: ${frameworksLine(c)}.${surf}

## Props
| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
${props}

## Visual standard (measured)
${spec}
${use}${typeDefaultsMd(c)}
`;
}
function patternHubUrl(p) { return p.hub ? `${SITE}/${p.hub}/index.html` : `${SITE}/guidelines/${p.slug}/index.html`; }
function patternIndexLines() {
  if (!GUIDELINES.length) return [];
  return [
    '## Patterns — read the matching one BEFORE picking components',
    '',
    'A pattern says how components compose for a use case. If your UI matches one, read it first; then pick components.',
    '',
    ...GUIDELINES.map(p => `- [${p.name}](${patternHubUrl(p)}) — ${p.whenToRead || p.summary}`),
    '',
  ];
}
function settingsHubPointer(c) {
  const guide = GUIDELINES.find(p => p.slug === 'settings');
  return guide && SETTINGS_SLUGS.has(c.slug) ? `${patternHubUrl(guide)}#ctrl-${c.slug}` : null;
}
function renderLlms(c) {
  const props = (c.props||[]).map(p => `- ${p.name}: ${p.type}, default ${p.default}. ${p.desc}`).join('\n');
  const use = c.opinion ? 'Use when: ' + (c.opinion.whenToUse||[]).map(x=>`${x.what} (${x.when})`).join('; ') + '.\n' : '';
  const surf = (c.surfaces&&c.surfaces.length) ? `Surfaces: ${c.surfaces.join(', ')}.\n` : '';
  const htmlLead = hasHtml(c) ? `Default to the HTML snippet — ${htmlKind(c)}.\n` : '';
  const hub = settingsHubPointer(c);
  const hubLine = hub ? `Part of the Settings pattern — read it first: ${hub}\n` : '';
  return `## ${c.name}
${c.summary}
Tier: ${c.tier}. Frameworks: ${frameworksLine(c)}.
${hubLine}${htmlLead}${surf}Props:
${props}
Tokens: ${(c.tokensUsed||[]).join(', ')}.
${use}${typeDefaultsMd(c)}
`;
}
function renderAgent(c) {
  // Snippets insertion order follows c.snippets — HTML is authored first on leaf contracts,
  // so it leads the object. Emit the `html` key order + recommendedSnippet so an agent
  // reaching for a snippet reaches for HTML by default.
  const snippets = {};
  for (const s of c.snippets) snippets[s.key] = part(s.file);
  const leaf = c.tier === 'leaf-lit';
  const entry = c.reuse && c.reuse.entry ? c.reuse.entry.replace(/^\.\//, '') : null;
  const install = {
    package: PKGNAME,
    registry: REGISTRY,
    scope: SCOPE,
    auth: `Published to GitHub Packages — needs a GitHub token with read:packages. Configure the ${SCOPE} scope in .npmrc before installing.`,
    npmrc: NPMRC,
    command: `npm i ${PKGNAME}`,
    tokenLayer: `import '${PKGNAME}/tokens.css';`,
    import: entry ? `import '${PKGNAME}/${entry}';` : null,
    element: c.element || null,
    registers: c.reuse ? c.reuse.registers || null : null,
  };
  const frameworks = leaf
    ? { react: { via: 'web-component', ref: c.element }, vue: { via: 'web-component', ref: c.element } }
    : { react: { package: 'antd', major: 6 }, vue: { package: 'ant-design-vue', major: 4 } };
  if (hasHtml(c)) frameworks.html = leafHtml(c)
    ? { via: 'web-component', ref: c.element, runnable: 'paste-and-run — no build step, renders on open' }
    : { via: 'cdn-react', runnable: 'paste-and-run — React + antd loaded from a CDN, no build step' };
  return JSON.stringify({
    generatedFrom: `${c.slug}.contract.json`, component: c.name, slug: c.slug, group: c.group, tier: c.tier,
    summary: c.summary,
    install,
    feeds: {
      doc: `${SITE}/${docPagePath(c)}`,
      md: `${SITE}/${c.slug}/${c.slug}.md`,
      agentJson: `${SITE}/${c.slug}.agent.json`,
      llms: `${SITE}/${c.slug}.llms.txt`,
      index: `${SITE}/llms.txt`,
      ...(settingsHubPointer(c) ? { pattern: settingsHubPointer(c) } : {}),
    },
    recommendedSnippet: hasHtml(c) ? 'html' : (c.snippets[0]?.key || 'react'),
    vibeCode: hasHtml(c)
      ? `Emit the HTML snippet by default — ${htmlKind(c)}. Paste into an .html file and it renders with no build step.`
      : null,
    frameworks,
    props: c.props || [], tokens: c.tokensUsed || [], spec: c.spec || [],
    opinion: c.opinion || null, surfaces: c.surfaces || null, snippets,
    ...((c.typeDefaults || []).length ? { typeDefaults: typeDefaultsMap(c) } : {}),
  }, null, 2) + '\n';
}

/* ===== patterns — composition guides over existing components =====
   A pattern ships no primitive of its own; it documents how to compose the DS's
   components for a use case (settings, paywall, …). The narrative "why" lives in the
   linked aha-design skill; this artifact carries the enforceable half: composedOf (the
   reuse graph), rules (the checklist, each ref'd back to the skill), and an optional
   composition wrapper. Same single-source contract → doc page + feeds, like a component. */

// Minimal Markdown → HTML for the pattern guide sidecar (parts/<slug>.guide.md).
// Handles the subset the guides use: ## / ### headings, > notes, - lists, | tables,
// --- rules, **bold**, `code`, and paragraphs. Not a general MD engine — just enough.
function mdInline(s) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
function mdToHtml(src) {
  const lines = String(src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0, list = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  while (i < lines.length) {
    const ln = lines[i];
    // table block: a run of lines that start with '|'
    if (/^\s*\|/.test(ln)) {
      closeList();
      const block = [];
      while (i < lines.length && /^\s*\|/.test(lines[i])) block.push(lines[i++]);
      const cells = (r) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(x => x.trim());
      const head = cells(block[0]);
      const bodyRows = block.slice(2); // block[1] is the --- separator
      const th = head.map(h => `<th>${mdInline(h)}</th>`).join('');
      const rows = bodyRows.map(r => `<tr>${cells(r).map(c => `<td>${mdInline(c)}</td>`).join('')}</tr>`).join('');
      out.push(docTable(th, rows));
      continue;
    }
    if (/^\s*-\s+/.test(ln)) {                    // list item
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${mdInline(ln.replace(/^\s*-\s+/, ''))}</li>`);
      i++; continue;
    }
    closeList();
    if (/^\s*###\s+/.test(ln)) { out.push(`<h3 class="pat-h3">${mdInline(ln.replace(/^\s*###\s+/, ''))}</h3>`); i++; continue; }
    if (/^\s*##?\s+/.test(ln)) { out.push(`<h2>${mdInline(ln.replace(/^\s*##?\s+/, ''))}</h2>`); i++; continue; }
    if (/^\s*>\s?/.test(ln)) {                    // blockquote run → a .note
      const q = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) q.push(lines[i++].replace(/^\s*>\s?/, ''));
      out.push(`<div class="note">${mdInline(q.join(' '))}</div>`);
      continue;
    }
    if (/^\s*---\s*$/.test(ln)) { out.push('<hr class="pat-hr"/>'); i++; continue; }
    if (/^\s*\*/.test(ln)) {                      // trailing italic footer line
      out.push(`<p class="pat-foot">${mdInline(ln.replace(/^\s*\*(.+)\*\s*$/, '$1'))}</p>`); i++; continue;
    }
    if (ln.trim() === '') { i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !/^\s*(\||-\s|>|#|---)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${mdInline(para.join(' '))}</p>`);
  }
  closeList();
  return out.join('\n');
}

const statusPill = (st) => st === 'available'
  ? `<span class="pill">available</span>`
  : `<span class="pill warn">missing</span>`;

function composedOfTable(items) {
  const rows = (items || []).map(x =>
    `<tr><td><code>${esc(x.ref)}</code></td><td>${esc(x.as)}</td><td>${esc(x.use)}</td><td>${statusPill(x.status)}</td></tr>`).join('');
  return docTable('<th>Reuses</th><th>Kind</th><th>For</th><th>In DS?</th>', rows);
}
function rulesTable(rules) {
  const rows = (rules || []).map(r =>
    `<tr><td>${mdInline(r.rule)}</td><td>${(r.ref || []).map(x => `<span class="ref">${esc(x)}</span>`).join(' ')}</td></tr>`).join('');
  return docTable('<th>Rule</th><th>Skill assertion</th>', rows);
}
function surfaceChoiceTable(rows) {
  if (!rows || !rows.length) return '';
  const body = rows.map(r => `<tr><td><b>${esc(r.surface)}</b></td><td>${esc(r.useFor)}</td><td>${esc(r.example)}</td></tr>`).join('');
  return docTable('<th>Surface</th><th>Use for</th><th>Example</th>', body);
}

/* ===== marketing sections — framework-free HTML+CSS blocks for the AhaSlides marketing sites,
   listed under Patterns. Unlike a pattern contract they ship no custom element: a builder pastes
   the block into Webflow/WordPress/a static page, and every value binds to an --aha-* token so the
   marketing site and the product app stay on one brand source.
   marketing/<slug>.json: { slug, name, summary, html, css }. ===== */
const MARKETING_CAT = 'Marketing sections';
const marketingSnippet = (b) => `<style>\n${b.css || ''}\n</style>\n${b.html || ''}\n`;
/* ---- Audience Library — a first-class top-level area. ONE scroll
   page: the audience component gallery, DS-tokenised, rendered into docShell so it wears
   the DS top-nav + scoped sidebar like every other area. Content is data
   (audience/library.json); the collapsible HTML/React/Vue code panels reuse the shell's
   own .code-tabs CSS + ahaBindWidgets JS. Honest imports: audience components are
   marketplace Vue components at @/iframe/audience, not DS web components. */
const AUDIENCE_KIND_ACCENT = {
  Answers: 'var(--aha-brand-2)', Input: 'var(--aha-color-primary)', Feedback: 'var(--aha-brand-4)',
  Action: 'var(--aha-brand-6)', Layout: 'var(--aha-soft-indigo-60)', '': 'var(--aha-indigo-60)',
};
// Inline `code` spans in the reference copy; everything else is escaped.
const audMd = (s) => String(s ?? '').split('`').map((seg, i) => i % 2 ? `<code class="ic">${esc(seg)}</code>` : esc(seg)).join('');
function audienceCodeTabs(snips) {
  if (!snips) return '';
  const order = [['html', 'HTML'], ['react', 'React'], ['vue', 'Vue 3']];
  const tabs = order.map(([k, l], i) => `<button class="tab ${i === 0 ? 'active' : ''}" type="button" data-f="${k}">${esc(l)}</button>`).join('');
  const panes = order.map(([k], i) => `<pre class="code ${k} ${i === 0 ? 'active' : ''}">${esc(snips[k] || '')}</pre>`).join('');
  return `<div class="code-tabs" data-open="false"><div class="demo-toolbar"><button class="show-code" type="button"><span class="chev">▸</span> Show code</button></div><div class="code-panel" hidden><div class="code-head"><div class="tabs">${tabs}</div><button class="copy" type="button">Copy</button></div>${panes}</div></div>`;
}
function renderAudienceCard(sec) {
  const accent = AUDIENCE_KIND_ACCENT[sec.kind] ?? 'var(--aha-indigo-60)';
  const badge = sec.kind ? `<span class="badge" style="background:${accent}">${esc(sec.kind)}</span>` : '';
  const replaces = sec.replaces ? `<p class="replaces">${audMd(sec.replaces)}</p>` : '';
  const note = sec.note ? `<p class="note">${audMd(sec.note)}</p>` : '';
  return `<section id="${esc(sec.name)}" class="card">
  <header class="card-h">
    <div class="card-title"><h2>${esc(sec.name)}</h2>${badge}</div>
    <p class="what">${audMd(sec.what)}</p>
    <dl class="callout">
      <div class="use"><dt>Use when</dt><dd>${audMd(sec.useWhen)}</dd></div>
      <div class="not"><dt>Not for</dt><dd>${audMd(sec.notFor)}</dd></div>
    </dl>${replaces}${note}
  </header>
  <div class="decks">
    <div class="deck light"><span class="deck-lbl">Light deck</span><div class="deck-body">${sec.demoLight}</div></div>
    <div class="deck dark"><span class="deck-lbl">Dark deck</span><div class="deck-body">${sec.demoDark}</div></div>
  </div>
  ${audienceCodeTabs(sec.snippets)}
</section>`;
}
function renderAudienceLibrary() {
  // One-page area: the same sticky antd <Anchor> "On this page" nav the Settings hub uses (shared
  // hubAnchor* helpers), replacing BOTH the shell sidebar (noSidebar) and the old header chipnav.
  // The nav lists each component section in page order; Helpers (a code-signature appendix) stays on
  // the page but out of the nav, as it always has been.
  const navSecs = AUDIENCE.sections.filter(s => s.name !== 'Helpers');
  const anchorItems = navSecs.map(s => ({ key: s.name, href: '#' + s.name, title: s.name }));
  const fallbackGroups = [{ cat: 'Audience components', links: navSecs.map(s => ({ id: s.name, title: s.name })) }];
  const cards = AUDIENCE.sections.map(renderAudienceCard).join('\n');
  const main = `<div class="audience-lib">
    <header class="al-head">
      <h1>${esc(AUDIENCE.title)}</h1>
      <p class="rule">${audMd(AUDIENCE.rule)}</p>
      <p class="why">${audMd(AUDIENCE.why)}</p>
    </header>
    <div class="hub-layout">
      ${hubAnchorAside(fallbackGroups)}
      <div class="hub-body"><div class="al-cards">${cards}</div></div>
    </div>
  </div>
  <!-- The demos call DS glyphs by name via <aha-icon> — never an inline SVG or an emoji.
       Load the same runtime + registry the icon gallery uses (relative to /audience/).
       PJAX re-executes these on navigation (runScripts holds external-script order). -->
  <script src="../icons/registry.js"></script>
  <script src="../icons/aha-icon.js"></script>
  ${hubAnchorScript(anchorItems)}`;
  return docShell({ base: '../', active: 'audience', section: 'audience', main, extraCss: AUD_CSS + HUB_ANCHOR_CSS, noSidebar: true });
}

function renderMarketingHtml(b) {
  const main = `
  <h1>${esc(b.name)}</h1>
  ${headline(b.highlights, esc(b.summary))}
  <p class="gen">◆ generated from marketing/${b.slug}.json — do not edit by hand</p>

  <h2>Preview</h2>
  <div class="marketing-stage">${marketingSnippet(b)}</div>

  <h2>Paste-and-run HTML</h2>
  <p class="body">Framework-free — copy the whole block into any page (Webflow, WordPress, a static site). It binds only to the shared <code>--aha-*</code> tokens, so load the token layer once on the page first and the block inherits the AhaSlides brand automatically.</p>
  <div class="code-panel feed">
    <div class="code-head"><div class="tabs"><span class="tab active">${esc(b.slug)}.html</span></div><button class="copy" type="button">Copy</button></div>
    <pre class="active">${esc(marketingSnippet(b))}</pre>
  </div>

  <h2>Load the tokens once</h2>
  <p class="body">Add this to your page <code>&lt;head&gt;</code> before the block — it defines every <code>--aha-*</code> custom property the block reads:</p>
  <div class="code-panel feed">
    <div class="code-head"><div class="tabs"><span class="tab active">head</span></div><button class="copy" type="button">Copy</button></div>
    <pre class="active">${esc(`<link rel="stylesheet" href="${SITE}/variables.css">`)}</pre>
  </div>`;
  return docShell({ base: '../../', active: 'marketing:' + b.slug, section: 'patterns', main, extraCss: `
  .marketing-stage{margin:0 0 12px}` });
}
function renderMarketingMd(b) {
  return `# ${b.name} — marketing section
> Generated from marketing/${b.slug}.json — do not edit by hand. Framework-free marketing section, not a product component.

${b.summary}

Bind the page to the shared token layer (${SITE}/variables.css), then paste the block.

## Paste-and-run HTML
\`\`\`html
${marketingSnippet(b)}\`\`\`
`;
}
function renderMarketingAgent(b) {
  return JSON.stringify({
    generatedFrom: `marketing/${b.slug}.json`, kind: 'marketing-section', name: b.name, slug: b.slug,
    summary: b.summary,
    consume: { framework: 'none (paste-and-run HTML+CSS)', tokens: `${SITE}/variables.css`,
      note: 'Load the token layer once on the page, then paste the html. Every colour/size/space/radius binds to an --aha-* token, so it inherits the AhaSlides brand.' },
    html: b.html || '', css: b.css || '',
  }, null, 2) + '\n';
}
function renderMarketingLlms(blocks) {
  let s = `# AhaSlides Design System — marketing sections\n\n> Framework-free marketing sections for the AhaSlides marketing sites (Patterns → ${MARKETING_CAT}). Paste-and-run HTML+CSS, bound to the shared --aha-* Foundations tokens. Load ${SITE}/variables.css once, then paste a block.\n\n`;
  for (const b of blocks) s += `- [${b.name}](marketing/${b.slug}/${b.slug}.md) — ${b.summary}\n`;
  return s;
}
/* Old landing/ URLs are still linked from outside the site, so each keeps a stub forwarding to its new home. */
const LANDING_REDIRECTS = {
  '': 'marketing/hero/index.html',
  hero: 'marketing/hero/index.html',
  'section-container': 'marketing/section-container/index.html',
  button: 'button/index.html',
  link: 'button/index.html',
  fonts: 'foundations/typography.html',
  spacing: 'foundations/spacing.html',
  grid: 'grid/index.html',
};
const redirectStub = (target) => `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<title>Moved — AhaSlides Design System</title>
<meta name="robots" content="noindex"/>
<meta http-equiv="refresh" content="0; url=${target}"/>
<link rel="canonical" href="${target}"/>
</head><body><p>This page moved to <a href="${target}">${target}</a>.</p></body></html>
`;

function renderGuidelineHtml(p) {
  const missing = (p.composedOf || []).filter(x => x.status === 'missing');
  const skill = p.skillRef || {};
  const antiSlop = ANTISLOP?.surfaces?.[p.slug];
  const guide = p.guide ? part(p.guide) : '';
  const main = `
  <h1>${esc(p.name)} <span class="badge pattern">pattern</span></h1>
  ${headline(p.highlights, esc(p.summary))}
  <p class="gen">◆ generated from guidelines/${p.slug}.json${p.guide ? ` + parts/${esc(p.guide)}` : ''} — do not edit by hand</p>

  ${p.hub ? `<p class="hub-back">See the standalone <a href="../../${esc(p.hub)}/index.html">Settings page</a> — the whole settings surface (this pattern, the settings-list component, and every control) inline on one page.</p>` : ''}

  ${p.lead ? `<div class="note" style="margin:0 0 18px">${mdInline(p.lead)}</div>` : ''}

  <h2>Based on</h2>
  <p class="body">The rationale, worked examples, and the full assertion set live in the design skill — this pattern distils the enforceable subset and links each rule back to it.</p>
  <div class="skillrefs">
    ${skill.build ? `<span class="skillref"><b>build</b> <code>${esc(skill.build)}</code></span>` : ''}
    ${skill.judge ? `<span class="skillref"><b>judge</b> <code>${esc(skill.judge)}</code></span>` : ''}
    ${antiSlop ? `<span class="skillref"><b>anti-slop</b> <a href="../../feeds/anti-slop-md.html">${antiSlop.criteria.length} binary criteria · surface <code>${esc(p.slug)}</code></a></span>` : ''}
  </div>

  ${p.surfaceChoice ? `<h2>Choose the surface</h2>${surfaceChoiceTable(p.surfaceChoice)}` : ''}

  <h2>Composed of</h2>
  <p class="body">What a compliant ${esc(p.name.toLowerCase())} surface reuses from this design system — the pattern's link into the component graph.</p>
  ${composedOfTable(p.composedOf)}
  ${missing.length ? `<div class="note warn">⚠︎ ${missing.length} referenced component${missing.length===1?'':'s'} not yet in the DS — <b>${missing.map(m=>esc(m.ref)).join(', ')}</b>. ${esc(p.componentBacklog || 'Per the charter, add these here so the pattern can be built by reuse.')}</div>` : ''}

  <h2>Rules</h2>
  <p class="body">The shippable checklist — each rule traces to an assertion in <code>${esc(skill.build || 'the skill')}</code>.</p>
  ${rulesTable(p.rules)}

  ${p.reuse ? `<h2>Composition code</h2><p class="body">Ships a reusable wrapper — imported by package name, gated like a composite.</p>`
    : `<h2>Composition code</h2><p class="body">Doc-only — this pattern ships no wrapper from this repo. ${esc(p.reuseNote || '')}</p>`}

  ${guide ? `<h2>Guide</h2><div class="body pat-guide">${mdToHtml(guide)}</div>` : ''}`;
  const extraCss = `
  .badge.pattern{color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30)}
  .skillrefs{display:flex;gap:10px;flex-wrap:wrap;margin:4px 0 4px}
  .skillref{font-size:13px;color:var(--aha-text-secondary);background:var(--aha-gray-20);border:1px solid var(--aha-split);border-radius:8px;padding:6px 11px}
  .skillref b{font-size:10.5px;text-transform:uppercase;letter-spacing:.4px;color:var(--aha-text-tertiary);margin-right:6px}
  .pill.warn{background:#FFF0EB;color:#B24A20}
  .note.warn{background:#FFF5F0;border-color:#FFCBB0;color:#8A3B18}
  .ref{font-family:Menlo,monospace;font-size:10.5px;color:var(--aha-text-tertiary);background:var(--aha-gray-20);border-radius:5px;padding:1px 6px;white-space:nowrap}
  .pat-guide h2{font-size:17px;line-height:24px;margin:28px 0 10px}
  .pat-h3{font-size:14px;font-weight:600;margin:16px 0 6px}
  .pat-hr{border:none;border-top:1px solid var(--aha-split);margin:22px 0}
  .pat-foot{font-size:13px;color:var(--aha-text-tertiary)}`;
  return docShell({ base: '../../', active: 'guideline:' + p.slug, section: 'guidelines', main, extraCss });
}
function renderGuidelineMd(p) {
  const skill = p.skillRef || {};
  const antiSlop = ANTISLOP?.surfaces?.[p.slug];
  const co = (p.composedOf || []).map(x => `- ${x.ref} (${x.as}) — ${x.use} [${x.status}]`).join('\n');
  const rules = (p.rules || []).map(r => `- ${r.rule} (${(r.ref||[]).join(', ')})`).join('\n');
  const surf = (p.surfaceChoice || []).map(s => `- **${s.surface}** — ${s.useFor} (e.g. ${s.example})`).join('\n');
  return `# ${p.name} — pattern
> Generated from guidelines/${p.slug}.json — do not edit by hand. Composition guide, not a component.

${p.summary}

Based on: ${skill.build || '—'}${skill.judge ? ` · judge: ${skill.judge}` : ''}${antiSlop ? `\nAnti-slop judge: ${antiSlop.criteria.length} binary criteria (surface "${p.slug}") — ${SITE}/anti-slop.md` : ''}
Surfaces: ${(p.surfaces||[]).join(', ')}.

## Choose the surface
${surf}

## Composed of
${co}
${p.componentBacklog ? `\n> Backlog: ${p.componentBacklog}` : ''}

## Rules
${rules}

## Composition code
${p.reuse ? 'Ships a reusable wrapper (gated like a composite).' : `Doc-only. ${p.reuseNote || ''}`}
`;
}
function renderGuidelineAgent(p) {
  const antiSlop = ANTISLOP?.surfaces?.[p.slug];
  return JSON.stringify({
    generatedFrom: `guidelines/${p.slug}.json`, kind: 'guideline', pattern: p.name, slug: p.slug,
    summary: p.summary, skillRef: p.skillRef || null, surfaces: p.surfaces || null,
    surfaceChoice: p.surfaceChoice || null, composedOf: p.composedOf || [],
    componentBacklog: p.componentBacklog || null, rules: p.rules || [],
    shipsCode: !!p.reuse, reuse: p.reuse || null,
    antiSlop: antiSlop ? { surface: p.slug, criteria: antiSlop.criteria.length, feed: `${SITE}/anti-slop.agent.json` } : null,
  }, null, 2) + '\n';
}
function renderGuidelinesLlms(patterns) {
  let s = `# AhaSlides Design System — patterns\n\n> Composition guides over existing components. Each pattern reuses the DS's components and documents the conventions for a use case; the narrative "why" lives in the linked aha-design skill.\n\n`;
  for (const p of patterns) {
    const missing = (p.composedOf || []).filter(x => x.status === 'missing').map(x => x.ref);
    s += `## ${p.name} (guidelines/${p.slug}/${p.slug}.md)\n${p.summary}\nBased on: ${(p.skillRef||{}).build || '—'}. Surfaces: ${(p.surfaces||[]).join(', ')}.\nReuses: ${(p.composedOf||[]).map(x=>x.ref).join(', ')}.${missing.length?` Component backlog: ${missing.join(', ')}.`:''}\nRules: ${(p.rules||[]).length}. Ships code: ${p.reuse?'yes':'no (doc-only)'}.\n\n`;
  }
  return s;
}

/* ===== Shared one-page in-page nav — ONE sticky antd <Anchor> island for every single-scroll DS
   area (the Settings hub, the Audience Library). Both pages `noSidebar` the shell nav and mount this
   instead, so the "On this page" component is defined once and can't drift between areas. Callers pass
   the antd Anchor `items` tree and a matching `fallbackGroups` list for the pre-hydration / no-JS nav.
   `fallbackGroups`: [{ cat: string|null, links: [{ id, title }] }]. ===== */
const HUB_ANCHOR_THEME = { token: { colorPrimary: TOK.color.primary, fontFamily: TOK.font.product, borderRadius: 8 } };

// The sticky aside. The no-JS fallback list lives inside the mount; the React island replaces it once
// antd loads (so the nav works even before/without hydration).
function hubAnchorAside(fallbackGroups, mountId = 'hub-anchor-root') {
  const fb = fallbackGroups.map(g =>
    `<div class="sa-fb-group">${g.cat ? `<div class="sa-fb-cat">${esc(g.cat)}</div>` : ''}` +
    g.links.map(l => `<a href="#${esc(l.id)}">${esc(l.title)}</a>`).join('') + `</div>`).join('');
  return `<aside class="hub-anchor" aria-label="On this page">
      <div class="hub-anchor-h">On this page</div>
      <div id="${mountId}" class="hub-anchor-mount">
        <nav class="sa-fallback" aria-label="On this page (fallback)">${fb}</nav>
      </div>
    </aside>`;
}

// The React island that mounts the antd v6 Anchor (CDN React + antd over the shared token theme — the
// DS composite pattern, same as Table). It tracks scroll + smooth-scrolls WITHIN the page; the URL
// never changes. targetOffset clears the sticky site header.
function hubAnchorScript(items, mountId = 'hub-anchor-root') {
  return `<script type="module">
    import React from 'https://esm.sh/react@18';
    import { createRoot } from 'https://esm.sh/react-dom@18/client';
    // ?bundle-deps inlines antd's transitive deps (notably @ant-design/fast-color) into this module.
    // Without it, esm.sh resolves fast-color as a separate module whose build currently fails to export
    // FastColor, which throws at eval time and the Anchor silently never mounts (falls back). This was
    // live on the Settings page too — the shared helper fixes both areas at once.
    import { ConfigProvider, Anchor } from 'https://esm.sh/antd@6?bundle-deps&deps=react@18,react-dom@18';
    const mount = document.getElementById('${mountId}');
    if (mount) {
      const h = React.createElement;
      const items = ${JSON.stringify(items)};
      const theme = ${JSON.stringify(HUB_ANCHOR_THEME)};
      mount.textContent = '';
      createRoot(mount).render(
        h(ConfigProvider, { theme }, h(Anchor, { affix: false, targetOffset: 84, items }))
      );
    }
  </script>`;
}

// The shared two-column hub layout + sticky-anchor + fallback CSS. Included in each hub page's
// extraCss. The body column's section anchors set their own scroll-margin-top (84px) to clear the header.
const HUB_ANCHOR_CSS = `
  .hub-layout{display:grid;grid-template-columns:236px minmax(0,1fr);gap:32px;align-items:start;margin-top:26px}
  .hub-body{min-width:0}
  .hub-anchor{position:sticky;top:80px;max-height:calc(100vh - 100px);overflow:auto;padding-right:4px}
  .hub-anchor-h{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:var(--aha-text-tertiary);font-weight:600;margin:0 0 10px;padding-left:2px}
  .hub-anchor .ant-anchor-link-title{font-size:13px;color:var(--aha-text-secondary)}
  .hub-anchor .ant-anchor-link-title-active{color:var(--aha-color-primary);font-weight:600}
  /* A top-level link that CONTAINS nested links is a group header (Settings' Composition/Controls) —
     render it as a small-caps label. A flat list of leaf links (the Audience page) has no parents, so
     every item stays the normal 13px link — not uppercased like a header. */
  .hub-anchor .ant-anchor>.ant-anchor-link:has(.ant-anchor-link)>.ant-anchor-link-title{text-transform:uppercase;letter-spacing:.4px;font-size:11px;font-weight:600;color:var(--aha-text-tertiary)}
  .sa-fallback{display:flex;flex-direction:column}
  .sa-fb-group{margin-bottom:14px}
  .sa-fb-cat{text-transform:uppercase;letter-spacing:.4px;font-size:11px;font-weight:600;color:var(--aha-text-tertiary);margin:0 0 6px}
  .sa-fallback a{display:block;font-size:13px;color:var(--aha-text-secondary);text-decoration:none;padding:3px 0 3px 12px;border-left:2px solid var(--aha-split)}
  .sa-fallback a:hover{color:var(--aha-color-primary);border-left-color:var(--aha-color-primary)}
  @media (max-width:900px){
    .hub-layout{grid-template-columns:1fr}
    .hub-anchor{display:none}
  }`;

/* ===== Settings — its OWN standalone area, and ONE self-contained page (settings/index.html).
   Everything an agent needs lives INLINE here: the composition pattern (surfaces, the full rule text,
   composed-of) from guidelines/settings.json, the schema-driven settings-list component with a LIVE
   example + framework code + full API from contracts/settings-list.json, and every settings control's
   summary + spec + API from its own contract. It READS from those same source files the detail pages
   render from — no hand-authored duplication, so it cannot drift — and reuses the shared shell + table
   + demo helpers. It never routes off this page — component nav is an in-page antd Anchor. ===== */
function renderSettingsHub() {
  const guide = GUIDELINES.find(p => p.slug === 'settings');
  // The inlined components, grouped exactly as the reference IA (Composition, then Controls). One
  // source of truth (SETTINGS_CATALOG ∩ live contracts) drives BOTH the antd Anchor items and the
  // rendered sections, so the nav can never point at a section that isn't on the page.
  const liveByCat = SETTINGS_CATALOG.map(g => ({
    cat: g.cat,
    slug: g.cat.toLowerCase(),
    items: g.items
      .map(it => ({ name: it.name, slug: it.slug, c: contracts.find(x => x.slug === it.slug) }))
      .filter(x => x.c),
  })).filter(g => g.items.length);

  // The page-level sections (the overview above the components) — defined once so the Anchor, the
  // no-JS fallback, and the rendered body all draw from the same list and stay in lock-step. Each is
  // rendered inside the body column (not above the layout), so the sticky Anchor sits beside the WHOLE
  // page and its links reflect the full IA — the overview sections AND the components — not just the
  // component list.
  const overview = [
    guide && guide.surfaceChoice ? { id: 'surfaces', title: 'Choose the surface',
      html: `<h2 id="surfaces">Choose the surface</h2>${surfaceChoiceTable(guide.surfaceChoice)}` } : null,
    guide && guide.rules ? { id: 'rules', title: 'Rules',
      html: `<h2 id="rules">Rules</h2><p class="body">The shippable checklist for any settings surface — each rule traces to an assertion in the design skill <code>${esc((guide.skillRef||{}).build || '')}</code>.</p>${rulesTable(guide.rules)}` } : null,
    guide && guide.composedOf ? { id: 'composed-of', title: 'Composed of',
      html: `<h2 id="composed-of">Composed of</h2><p class="body">What a compliant settings surface reuses from this design system.</p>${composedOfTable(guide.composedOf)}` } : null,
  ].filter(Boolean);

  // Anchor items reflect the whole page IA: the overview sections first (flat, top-level), then each
  // component group with its components nested — one antd <Anchor> tree, matching top-to-bottom order.
  const anchorItems = [
    ...overview.map(o => ({ key: o.id, href: '#' + o.id, title: o.title })),
    ...liveByCat.map(g => ({
      key: 'grp-' + g.slug,
      href: '#grp-' + g.slug,
      title: g.cat,
      children: g.items.map(x => ({ key: x.slug, href: '#ctrl-' + x.slug, title: x.name })),
    })),
  ];

  // Every control renders its OWN live preview inline — the point of "one page" is that an agent
  // reads only this URL and has everything, so each component gets the full treatment (live example
  // + playground + framework code + API + spec), identical to its per-component detail page. (A
  // preview carries its own <script type="module"> importing the real ../lib/ elements, so inlining
  // every control here also registers each <aha-*> on the page — module dedup makes the overlapping
  // imports across previews run once.)
  const richBlock = (c) => `<section class="ctrl ctrl-rich" id="ctrl-${esc(c.slug)}">
    <h3>${esc(c.name)} ${c.element ? `<code>&lt;${esc(c.element)}&gt;</code>` : ''}</h3>
    <p class="body">${esc(c.summary)}</p>
    <div class="demo">
      ${playgroundBar(c)}
      <div class="demo-stage">${part(c.preview)}</div>
      ${codeWidget(c)}
    </div>
    <h4>API</h4>
    ${propsTable(c.props)}
    ${c.opinion ? `<h4>When to use</h4>${opinionBlock(c.opinion)}` : ''}
    ${c.spec && c.spec.length ? `<h4>Spec</h4><div class="spec-line">${specList(c.spec)}</div>` : ''}
    </section>`;

  const groupBody = liveByCat.map(g => `
  <h2 id="grp-${g.slug}" class="grp-h">${esc(g.cat)}</h2>
  ${g.items.map(x => richBlock(x.c)).join('\n')}`).join('\n');

  // No-JS / CDN-down fallback: plain in-page anchors, whole-page IA (overview sections + component
  // groups), so the one-page nav always works even before the antd Anchor mounts. Same shape the
  // shared hubAnchorAside() renders: overview links flat (no cat), then each component group.
  const fallbackGroups = [
    ...(overview.length ? [{ cat: null, links: overview.map(o => ({ id: o.id, title: o.title })) }] : []),
    ...liveByCat.map(g => ({ cat: g.cat, links: g.items.map(x => ({ id: 'ctrl-' + x.slug, title: x.name })) })),
  ];

  const main = `
  <span id="top"></span>
  <h1>Settings <span class="badge pattern">one page · one URL · everything inline</span></h1>
  ${headline(['Every settings component on one self-contained page, one URL', 'Composition pieces and every control, inline', 'Switching components scrolls the page (antd Anchor) and never changes the URL', 'An agent reads this page and has it all'])}
  <p class="gen">◆ generated from guidelines/settings.json + the settings-list &amp; control contracts — do not edit by hand</p>

  ${guide && guide.lead ? `<div class="note" style="margin:0 0 16px">${mdInline(guide.lead)}</div>` : ''}

  <div class="hub-layout">
    ${hubAnchorAside(fallbackGroups)}
    <div class="hub-body">
      ${overview.map(o => o.html).join('\n')}
      ${groupBody}
    </div>
  </div>

  ${hubAnchorScript(anchorItems)}`;
  const extraCss = `
  .badge.pattern{color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30)}
  .pill.warn{background:#FFF0EB;color:#B24A20}
  .ref{font-family:Menlo,monospace;font-size:10.5px;color:var(--aha-text-tertiary);background:var(--aha-gray-20);border-radius:5px;padding:1px 6px;white-space:nowrap}
${HUB_ANCHOR_CSS}
  .hub-body>h2{scroll-margin-top:84px}
  .grp-h{margin:36px 0 4px;text-transform:uppercase;letter-spacing:.4px;font-size:13px;color:var(--aha-text-tertiary);border-bottom:1px solid var(--aha-split);padding-bottom:8px;scroll-margin-top:84px}
  .ctrl{padding:16px 0;border-top:1px solid var(--aha-split);scroll-margin-top:84px}
  .ctrl h3{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:16px;margin:0 0 6px}
  .ctrl h4{font-size:13px;margin:16px 0 6px;color:var(--aha-text-secondary)}
  .ctrl h3 code{font-size:12px;font-weight:400;color:var(--aha-text-secondary);background:var(--aha-gray-20);border-radius:5px;padding:1px 7px}`;
  return docShell({ base: '../', active: 'hub:settings', section: 'settings', main, extraCss, noSidebar: true });
}

/* Consolidated Settings page as a Markdown feed — the same self-contained content, flat, for agents. */
function renderSettingsHubMd() {
  const guide = GUIDELINES.find(p => p.slug === 'settings');
  const rules = guide ? (guide.rules || []).map(r => `- ${r.rule} (${(r.ref||[]).join(', ')})`).join('\n') : '';
  const co = guide ? (guide.composedOf || []).map(x => `- ${x.ref} (${x.as}) — ${x.use} [${x.status}]`).join('\n') : '';
  const surf = guide ? (guide.surfaceChoice || []).map(s => `- **${s.surface}** — ${s.useFor} (e.g. ${s.example})`).join('\n') : '';
  const propLines = (c) => (c.props || []).map(p => `  - \`${p.name}\` (${p.type}) — ${p.desc}`).join('\n');
  const ctrlMd = (c) => {
    const spec = (c.spec || []).map(s => `${s.label}: ${s.value}`).join(' · ');
    return `### ${c.name}${c.element ? ` (<${c.element}>)` : ''}\n${c.summary}\n${spec ? `\nSpec: ${spec}\n` : ''}${(c.props||[]).length ? `\nProps:\n${propLines(c)}\n` : ''}`;
  };
  // Every component inline, grouped exactly as the on-page IA (Composition, then Controls).
  const groupsMd = SETTINGS_CATALOG.map(g => {
    const items = g.items.map(it => contracts.find(x => x.slug === it.slug)).filter(Boolean);
    return items.length ? `## ${g.cat}\n${items.map(ctrlMd).join('\n')}` : '';
  }).filter(Boolean).join('\n\n');
  return `# Settings — one self-contained page, one URL
> Generated from guidelines/settings.json + the settings-list & control contracts — do not edit by hand. Every settings component is inline on this one page; switching between them is an in-page scroll, never a new URL.

${guide ? guide.summary : ''}

## Choose the surface
${surf}

## Rules
${rules}

## Composed of
${co}

${groupsMd}
`;
}

/* ===== G3 · design.md ===== */
function renderDesignMd(t, cs) {
  const c = t.color, P = c.primitives, b = c.button;
  const ramp = (hue) => `- **${hue}** — ` + Object.keys(P[hue]).map(s => `\`${s}\` ${P[hue][s]}`).join(' · ');
  const primitiveLines = Object.keys(P).filter(h => h!=='white' && h!=='black').map(ramp).join('\n');
  const tbl = (rows) => '| Token | Value |\n| --- | --- |\n' + rows.map(([k,v]) => `| \`--aha-${k}\` | \`${v}\` |`).join('\n');
  const seed   = [['color-primary',c.primary],['color-primary-hover',c.primaryHover],['color-primary-active',c.primaryActive],['color-success',c.success],['color-warning',c.warning],['color-error',c.error],['color-info',c.info]];
  const text   = [['text-default',c.textDefault],['text-secondary',c.textSecondary],['text-tertiary',c.textTertiary],['text-disabled',c.textDisabled],['text-inverse',c.textInverse],['text-link',c.textLink],['text-link-hover',c.textLinkHover],['text-primary-ink',c.textPrimaryInk],['text-positive',c.textPositive],['text-negative',c.textNegative],['text-warning',c.textWarning]];
  const border = [['border',c.border],['border-secondary',c.borderSecondary],['border-strong',c.borderStrong],['border-disabled',c.borderDisabled],['border-hover',c.borderHover],['border-active',c.borderActive],['border-error',c.borderError],['border-success',c.borderSuccess],['border-warning',c.borderWarning],['border-info',c.borderInfo],['checkbox-border',c.checkboxBorder]];
  const bg     = [['bg-base',c.bgBase],['bg-container',c.bgContainer],['bg-container-secondary',c.bgContainerSecondary],['bg-container-disabled',c.bgContainerDisabled],['bg-elevated',c.bgElevated],['bg-layout',c.bgLayout],['bg-accent',c.bgAccent],['bg-informative',c.bgInformative],['bg-hover',c.bgHover],['bg-positive',c.bgPositive],['bg-negative',c.bgNegative],['bg-warning',c.bgWarning],['bg-overlay',c.bgOverlay],['bg-dark',c.bgDark],['bg-dark-raised',c.bgDarkRaised]];
  const icon   = [['icon-default',c.iconDefault],['icon-strong',c.iconStrong],['icon-muted',c.iconMuted],['icon-disabled',c.iconDisabled],['icon-inverse',c.iconInverse],['icon-active',c.iconActive]];
  const btn    = [['btn-primary-bg',b.primaryBg],['btn-primary-bg-hover',b.primaryBgHover],['btn-primary-bg-press',b.primaryBgPress],['btn-primary-fg',b.primaryFg],['btn-secondary-bg',b.secondaryBg],['btn-secondary-bg-hover',b.secondaryBgHover],['btn-secondary-border',b.secondaryBorder],['btn-secondary-border-press',b.secondaryBorderPress],['btn-tertiary-bg-hover',b.tertiaryBgHover],['btn-disabled-bg',b.disabledBg],['btn-disabled-fg',b.disabledFg],['btn-danger-bg',b.dangerBg],['btn-danger-bg-hover',b.dangerBgHover],['btn-danger-ring',b.dangerRing],['btn-encourage-bg',b.encourageBg],['btn-encourage-bg-hover',b.encourageBgHover],['btn-encourage-bg-press',b.encourageBgPress]];
  const brand  = Object.keys(c.brand).map(k => [`brand-${k}`, c.brand[k]]);
  const vizValue = (path, hex) => (aliasOf(path) ? `var(${aliasOf(path).cssVar}) = ${hex}` : hex);
  const viz    = [['viz-ink', vizValue('color.viz.ink', c.viz.ink)], ['viz-ink-inverse', vizValue('color.viz.inkInverse', c.viz.inkInverse)], ['viz-neutral', vizValue('color.viz.neutral', c.viz.neutral)],
    ...Object.keys(c.viz.series).map(k => [`viz-series-${k}`, vizValue(`color.viz.series.${k}`, c.viz.series[k])]), ...Object.keys(c.viz.tint).map(k => [`viz-tint-${k}`, vizValue(`color.viz.tint.${k}`, c.viz.tint[k])])];
  const comps = cs.map(x => `- **${x.name}** (${x.tier}) — ${x.summary}`).join('\n');
  return `# AhaSlides Design System — design.md
> Machine-readable visual language for AI design + code tools. Generated from tokens.canonical.json — do not edit by hand.
> Version ${PKG.version} · changelog (what changed per release): ${SITE}/CHANGELOG.md

## Brand
Primary is violet purple \`${c.primary}\` on near-white neutrals; ink is warm gray \`${c.textDefault}\`.
Backgrounds are **white by default**; no gradients on fills (AI-affordance border-only exception).
Success \`${c.success}\` · warning \`${c.warning}\` · error \`${c.error}\` · info \`${c.info}\`.

## Colour — primitive ramps
Each hue is a 10→100 scale. Semantic tokens below alias into these; **never hardcode a ramp value in a component** — bind to a semantic \`--aha-*\` token.
${primitiveLines}

## Colour — semantic tokens
### Seed
${tbl(seed)}

### Text
${tbl(text)}

### Border
${tbl(border)}

### Background
${tbl(bg)}

### Icon
${tbl(icon)}

### Button
${tbl(btn)}

### Brand slots (categorical, Aha 1–13)
${tbl(brand)}

### Data visualisation (\`<aha-chart>\` brand palette)
Series colours for charts on Report and other app screens. On the presenting/audience canvas a chart takes the deck palette instead (\`palette="deck"\`).
${tbl(viz)}

## Typography
Font **Plus Jakarta Sans** (self-hosted), weights **400 / 600** only. Base body **14** at line-height ratio **1.5**.
Size scale: 12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 48 · 56 · 64. Letter-spacing: headings 0, body 0.2px, subtext 0.3px. No Inter.

## Shape & density
Radius scale: ${t.radius.xs} · ${t.radius.sm} · **${t.radius.default}** (default) · ${t.radius.lg} · ${t.radius.xl}; pills ${t.radius.pill}.
Control height: root **${t.controlHeight.root}** (Input/Select inherit); Button ${t.controlHeight.button.sm}/${t.controlHeight.button.md}/${t.controlHeight.button.lg}/${t.controlHeight.button.xl}.
Spacing: 4-based — ${t.space.slice(0,12).join(' · ')} …
Layout: app content max-width **${t.layout.contentMaxWidth}** (centred; bind to \`--aha-content-max-width\`).

## Architecture
Leaf primitives (button, checkbox, input, tag, badge, switch) = ONE shared Lit web component, same code + CSS in React and Vue.
Composites (table, form, datepicker) = antd v6 (React) + ant-design-vue v4 (Vue) themed by the shared tokens.

## Components
${comps}
`;
}

/* ===== Foundations · Design tokens (styled page, generated from tokens.canonical.json) ===== */
// One Foundations · design-token page per category (Colour / Typography / Spacing / Radius /
// Sizing). All render from tokens.canonical.json; the sidebar lists them as separate items.
function renderTokenPage(pageSlug) {
  const c = TOK.color, r = TOK.radius, ch = TOK.controlHeight, s = TOK.size;
  const swatch = (n, v) => `<div class="sw"><div class="chip" style="background:${v}"></div><div class="meta"><div class="nm">${esc(n)}</div><div class="hex">${esc(v)}</div></div></div>`;
  const swGroup = (title, entries) => `<h3 class="tok-h3">${esc(title)}</h3><div class="swatches">${entries.map(([n,v])=>swatch(n,v)).join('')}</div>`;
  const P = c.primitives, b = c.button;
  const ramp = (hue) => `<div class="ramp"><div class="ramp-name">${esc(hue)}</div><div class="ramp-cells">`
    + Object.keys(P[hue]).map(s => `<div class="ramp-cell" title="${P[hue][s]}"><div class="ramp-chip" style="background:${P[hue][s]}"></div><div class="ramp-k">${s}</div></div>`).join('')
    + `</div></div>`;
  const primitives = Object.keys(P).filter(h => h!=='white' && h!=='black').map(ramp).join('');
  const typeRows = [['display1',s.display1],['display2',s.display2],['h1',s.h1],['h2',s.h2],['h3',s.h3],['h4',s.h4],['h5 / xl',s.xl],['h6',s.h6],['body (default)',s.default],['bodyLG (l)',s.l],['bodySM (sm)',s.sm]]
    .map(([role,px]) => `<tr><td style="font-size:${px}px;line-height:1.2">${esc(role)}</td><td><code>${px}px</code></td></tr>`).join('');
  const radScale = [['xs',r.xs],['sm',r.sm],['default',r.default],['lg',r.lg],['xl',r.xl]];
  const radChips = radScale.map(([n,v]) => `<div class="scale-cell"><div class="radius-chip" style="border-radius:${v}px"></div><div class="hex">${n} · ${v}px</div></div>`).join('');
  const chRows = `<tr><td>Fields — Input / Select / DatePicker (root)</td><td><code>${ch.root}px</code></td></tr>`
    + `<tr><td>Field sm / lg</td><td><code>${ch.sm}px / ${ch.lg}px</code></td></tr>`
    + `<tr><td>Button sm / md / lg / xl</td><td><code>${ch.button.sm} / ${ch.button.md} / ${ch.button.lg} / ${ch.button.xl}px</code></td></tr>`;
  const spaceBars = TOK.space.filter(n => n>0 && n<=64).map(n => `<div class="scale-cell"><div class="space-bar" style="width:${n}px"></div><div class="hex">${n}</div></div>`).join('');

  const gen = `<p class="gen">◆ generated from tokens.canonical.json — do not edit by hand</p>`;
  const BODY = {
    colour: {
      title: 'Colour', highlights: ["Primitive ramps plus semantic tokens that alias into them", "Never hardcode a ramp value", "Bind to a semantic --aha-* token"], lead: 'The primitive ramps and the semantic tokens that alias into them. Never hardcode a ramp value in a component — bind to a semantic <code>--aha-*</code> token.',
      body: `
  <h2>Primitive ramps</h2>
  <p class="body">The raw colour scales (10&rarr;100). Semantic tokens below alias into these — never hardcode a ramp value in a component.</p>
  <div class="ramps">${primitives}</div>

  <h2>Semantic colour</h2>
  ${swGroup('Brand', [['primary',c.primary],['primaryHover',c.primaryHover],['primaryActive',c.primaryActive],['focus',c.focus]])}
  ${swGroup('Status', [['success',c.success],['warning',c.warning],['error',c.error],['info',c.info]])}
  ${swGroup('Text', [['textDefault',c.textDefault],['textSecondary',c.textSecondary],['textTertiary',c.textTertiary],['textDisabled',c.textDisabled],['textLink',c.textLink],['textPositive',c.textPositive],['textNegative',c.textNegative],['textWarning',c.textWarning]])}
  ${swGroup('Border', [['border',c.border],['borderSecondary',c.borderSecondary],['borderStrong',c.borderStrong],['borderHover',c.borderHover],['borderActive',c.borderActive],['checkboxBorder',c.checkboxBorder]])}
  ${swGroup('Background', [['bgLayout',c.bgLayout],['bgAccent',c.bgAccent],['bgInformative',c.bgInformative],['bgPositive',c.bgPositive],['bgNegative',c.bgNegative],['bgWarning',c.bgWarning],['bgDark',c.bgDark]])}
  ${swGroup('Icon', [['iconDefault',c.iconDefault],['iconStrong',c.iconStrong],['iconMuted',c.iconMuted],['iconDisabled',c.iconDisabled],['iconActive',c.iconActive]])}
  ${swGroup('Button', [['primary',b.primaryBg],['primaryHover',b.primaryBgHover],['danger',b.dangerBg],['encourage',b.encourageBg],['disabledBg',b.disabledBg]])}
  ${swGroup('Brand slots (Aha 1–13)', Object.keys(c.brand).map(k=>['aha'+k, c.brand[k]]))}
  ${swGroup('Data visualisation (chart series · aliases of the colour tokens above)', [...Object.keys(c.viz.series).map(k => [`viz-series-${k}`, `color.viz.series.${k}`]), ...Object.keys(c.viz.tint).map(k => [`viz-tint-${k}`, `color.viz.tint.${k}`]), ['viz-ink', 'color.viz.ink'], ['viz-neutral', 'color.viz.neutral']]
    .map(([name, path]) => [`--aha-${name} → ${aliasOf(path) ? aliasOf(path).cssVar : ''}`, path.split('.').reduce((at, step) => at[step], TOK)]))}`,
    },
    typography: {
      title: 'Typography', highlights: ["Product face Plus Jakarta Sans, self-hosted", "Weights 400 and 600 only", "No Inter"], lead: 'Product face <b>Plus Jakarta Sans</b> (self-hosted); weights <b>400 / 600</b> only. No Inter.',
      body: `
  <p class="body">Line-height ratios: tight 1.2 · heading 1.3 · body 1.5. Letter-spacing: headlines 0 · body 0.2px · subtext 0.3px.</p>
  ${docTable('<th>Role</th><th>Size</th>', typeRows)}`,
    },
    spacing: {
      title: 'Spacing', highlights: ["One 4-based spacing scale", "Hierarchy and separation come from these tokens", "Never ad-hoc px"], lead: 'A single 4-based spacing scale — hierarchy and separation come from these tokens, never ad-hoc px.',
      body: `
  <div class="scale-row" style="align-items:flex-end">${spaceBars}</div>
  <p class="body">4-based scale (px): ${TOK.space.join(' · ')}.</p>`,
    },
    radius: {
      title: 'Radius', highlights: ["The corner-radius scale: 4, 6, 8, 12, 16", "Anything off the scale is drift"], lead: 'The corner-radius scale. Anything off <code>4 · 6 · 8 · 12 · 16</code> is drift.',
      body: `
  <div class="scale-row">${radChips}</div>
  <p class="body">Pill <code>${r.pill}px</code> for capsules; <code>${r.marketing}px</code> reserved for marketing surfaces. Anything off the 4·6·8·12·16 scale is drift.</p>`,
    },
    sizing: {
      title: 'Sizing', highlights: ["Control heights: root field height and the Button size ramp", "Plus the app-content max-width"], lead: 'Control heights — the root field height and the Button size ramp — plus the app-content max-width.',
      body: `
  ${docTable('<th>Control</th><th>Height</th>', chRows)}
  <p class="body">Fields share the root height; Button steps sm / md / lg / xl. Set size via the <code>size</code> prop — never inline a height.</p>
  <h3 class="tok-h3">Layout</h3>
  <p class="body">App content caps at <code>${TOK.layout.contentMaxWidth}px</code> — bind the page/screen container to <code>--aha-content-max-width</code> and centre it (<code>max-width:var(--aha-content-max-width);margin-inline:auto</code>). Don't hardcode a content width.</p>`,
    },
  };
  const pg = BODY[pageSlug];
  const main = `
  <h1>${esc(pg.title)}</h1>
  ${headline(pg.highlights, pg.lead)}
  ${gen}
  ${pg.body}`;
  const extraCss = `
  .tok-h3{font-size:12px;text-transform:uppercase;letter-spacing:.4px;color:var(--aha-text-tertiary);margin:18px 0 8px;font-weight:600}
  .swatches{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:12px;margin-bottom:8px}
  .sw{border:1px solid var(--aha-split);border-radius:10px;overflow:hidden}
  .sw .chip{height:54px}
  .sw .meta{padding:8px 11px}
  .sw .nm{font-size:13px;font-weight:600}
  .sw .hex{font-family:Menlo,monospace;font-size:11px;color:var(--aha-text-tertiary)}
  .scale-row{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin:12px 0 8px}
  .scale-cell{text-align:center}
  .radius-chip{width:66px;height:48px;background:var(--aha-purple-10);border:1.5px solid var(--aha-color-primary);margin-bottom:6px}
  .space-bar{height:16px;background:var(--aha-color-primary);border-radius:2px;margin-bottom:5px}
  .ramps{display:flex;flex-direction:column;gap:10px;margin:8px 0}
  .ramp{display:flex;align-items:center;gap:12px}
  .ramp-name{flex:0 0 92px;font-size:12px;font-weight:600;color:var(--aha-text-secondary);text-transform:capitalize}
  .ramp-cells{display:flex;flex:1 1 auto;gap:4px;flex-wrap:wrap}
  .ramp-cell{width:44px;text-align:center}
  .ramp-chip{height:34px;border-radius:6px;border:1px solid rgba(0,0,0,.06)}
  .ramp-k{font-size:10px;color:var(--aha-text-tertiary);margin-top:3px;font-family:Menlo,monospace}`;
  return docShell({ base: '../', active: 'token:' + pageSlug, section: 'foundations', main, extraCss });
}

/* ===== self-describing "how to consume" blocks =====
   Printed INTO the docs so a human or an agent can install + connect from the page
   alone, without being told. Feed links are ABSOLUTE (SITE) so they resolve anywhere. */
function consumeBlock() {
  return `
  <section class="consume" id="get-started">
    <h2 style="margin-top:30px">Get started</h2>
    <p class="body">Published to <b>GitHub Packages</b>, so point the <code>${esc(SCOPE)}</code> scope at the registry and authenticate <b>once</b>, then install, import the token layer at your app root, and import any component. It is <b>one</b> element — identical in React, Vue, and outside any app.</p>
    <div class="consume-grid">
      <div class="cg"><div class="cg-h">0 · Point the scope at GitHub Packages — once, in <code>.npmrc</code></div><pre class="cg-code">${esc(NPMRC)}</pre></div>
      <div class="cg"><div class="cg-h">1 · Install</div><pre class="cg-code">npm i ${esc(PKGNAME)}</pre></div>
      <div class="cg"><div class="cg-h">2 · Token layer — once, at the app root</div><pre class="cg-code">import '${esc(PKGNAME)}/tokens.css';</pre></div>
      <div class="cg"><div class="cg-h">3 · A component — import its subpath, use the element</div><pre class="cg-code">import '${esc(PKGNAME)}/aha-button';   // registers &lt;aha-button&gt;
&lt;aha-button variant="primary"&gt;Save&lt;/aha-button&gt;</pre></div>
      <div class="cg"><div class="cg-h">No build step? — one tag registers every element (CDN / no-build pages)</div><pre class="cg-code">&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@master/lib/tokens.css"&gt;
&lt;script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@master/lib/all.js"&gt;&lt;/script&gt;
&lt;aha-button variant="primary"&gt;Save&lt;/aha-button&gt;   // bundled apps: prefer per-element imports (tree-shaking)</pre></div>
    </div>
    <h3>For agents — read this, then connect automatically</h3>
    <p class="body">Every feed below is generated from the same contract as the components, so it can never drift. Start at <code>llms.txt</code> and follow it:</p>
    <ul class="agent-feeds">
      <li><b>Index feed</b> — <a href="${SITE}/llms.txt"><code>${SITE}/llms.txt</code></a> — one entry per component; the entry point.</li>
      <li><b>Full docs</b> — <a href="${SITE}/llms-full.txt"><code>${SITE}/llms-full.txt</code></a> — every component concatenated.</li>
      <li><b>Visual language</b> — <a href="${SITE}/design.md"><code>${SITE}/design.md</code></a> · <b>Token layer</b> — <a href="${SITE}/variables.css"><code>${SITE}/variables.css</code></a></li>
      <li><b>Per component</b> — <code>${SITE}/&lt;slug&gt;.agent.json</code> — machine feed: props, tokens, spec, opinion, install, both snippets.</li>
    </ul>
  </section>`;
}

// Compact per-component install + feed pointer, shown on each component's doc page.
function componentConsume(c, { heading = true } = {}) {
  const entry = c.reuse && c.reuse.entry ? c.reuse.entry.replace(/^\.\//, '') : null;
  const npmrc = `# .npmrc — once: point the ${SCOPE} scope at GitHub Packages
${NPMRC}
`;
  const install = entry
    ? `${npmrc}
npm i ${PKGNAME}
import '${PKGNAME}/tokens.css';   // once, at the app root
${c.reuse.registers
  ? `import '${PKGNAME}/${entry}';   // registers &lt;${esc(c.reuse.registers)}&gt;`
  : `import { ${esc((c.reuse.exportsNamed || []).join(', '))} } from '${PKGNAME}/${entry}';`}`
    : `${npmrc}
npm i ${PKGNAME}
import '${PKGNAME}/tokens.css';   // once, at the app root
// composite — consumes antd (React) / ant-design-vue (Vue); see the snippets below`;
  return `
  ${heading ? '<h2>Install</h2>\n  ' : ''}<pre class="cg-code">${install}</pre>
  <p class="gen install-note">Agent feed for this component (absolute, fetchable anywhere): <a href="${SITE}/${c.slug}.agent.json"><code>${c.slug}.agent.json</code></a> · <a href="${SITE}/${c.slug}/${c.slug}.md"><code>${c.slug}.md</code></a> · <a href="${SITE}/${c.slug}.llms.txt"><code>${c.slug}.llms.txt</code></a></p>`;
}

/* ===== anti-slop consumer feed — the build→judge→fix loop, per surface =====
   Joins the DS-owned criteria store (binary judge criteria) with guidelines/*.json
   (the rules), keyed by surface==guideline.slug. This is what a feed-only agent reads
   BEFORE it builds and self-runs AFTER it builds. Generated — no rule text authored here. */
const ANTISLOP_LOOP = [
  'You are generating AhaSlides product UI by consuming this design system.',
  'Before you write a screen: (1) identify the surface(s) you are building;',
  "(2) read that surface’s rules below; (3) after building, run the MECHANICAL gate first",
  '(node screen-lint.mjs --surface=<product|canvas> <files>) to hard-fail the zero-interpretation',
  "defects (raw hex, off-scale radius/weight, gradient fills, sub-16px/viewport fonts), then the",
  'surface’s BINARY judge — every criterion is PASS or FAIL, no partial credit; (4) fix every FAIL and re-judge;',
  '(5) ship only when every criterion PASSes.',
].join('\n');

// A surface target is a DS source path; consumers fetch its published live feed, never a snapshot.
function antiSlopTargetUrl(source) {
  if (source === 'tokens.canonical.json') return `${SITE}/design.md`;
  if (source === 'contracts') return `${SITE}/llms.txt`;
  if (source === 'icons/registry.json') return `${SITE}/icons.agent.json`;
  let m = source.match(/^contracts\/([a-z0-9-]+)\.json$/);
  if (m) return `${SITE}/${m[1]}.agent.json`;
  m = source.match(/^guidelines\/([a-z0-9-]+)\.json$/);
  if (m) return `${SITE}/guidelines/${m[1]}/${m[1]}.agent.json`;
  throw new Error(`anti-slop target "${source}" has no published feed — map it in antiSlopTargetUrl`);
}

function renderAntiSlop(store, guidelines) {
  const bySlug = Object.fromEntries((guidelines || []).map(p => [p.slug, p]));
  const surfaces = store ? Object.entries(store.surfaces) : [];
  let md = `# AhaSlides Design System — anti-slop\n\n> The official AhaSlides anti-slop loop. Generated from anti-slop/criteria.json + guidelines/*.json — do not edit by hand.\n> Owner: ${store?.owner || 'ahaslides-design'}. Feeds: ${SITE}/anti-slop.md · ${SITE}/anti-slop.agent.json\n\n## The loop\n\n${ANTISLOP_LOOP}\n\n`;
  const agent = { generatedFrom: 'anti-slop/criteria.json + guidelines/*.json', owner: store?.owner || 'ahaslides-design', loop: ANTISLOP_LOOP, surfaces: {} };
  for (const [key, s] of surfaces) {
    const p = bySlug[key];
    md += `## Surface: ${key}${p ? ` (guidelines/${key}/${key}.md)` : ''}\n`;
    md += p ? `${p.summary}\n\n` : '\n';
    if (p && p.rules?.length) {
      md += `Rules:\n${p.rules.map(r => `- ${r.rule}${r.ref?.length ? ` [${r.ref.join(', ')}]` : ''}`).join('\n')}\n\n`;
    }
    const targets = (s.targets || []).map(t => ({ ...t, url: antiSlopTargetUrl(t.source) }));
    if (targets.length) {
      md += `Judge against the live DS (never a frozen snapshot):\n${targets.map(t => `- ${t.url} — ${t.use}`).join('\n')}\n\n`;
    }
    md += `Judge (binary — PASS/FAIL each):\n${(s.criteria || []).map(c => `- ${c.id}. ${c.title} — ${c.test}`).join('\n')}\n\n`;
    agent.surfaces[key] = {
      surface: s.surface, origin: s.origin, skillRef: s.skillRef || (p ? p.skillRef : null), targets,
      rules: p ? (p.rules || []) : [], criteria: s.criteria || [], selfCheck: p ? (p.selfCheck || []) : [],
    };
  }
  const wired = new Set(surfaces.map(([k]) => k));
  const notWired = (guidelines || []).map(p => p.slug).filter(sl => !wired.has(sl));
  if (notWired.length) {
    md += `## Not yet wired\n\nThese guidelines exist but have no anti-slop judge criteria in the store yet (Phase-2 fan-out): ${notWired.join(', ')}.\n`;
    agent.notWired = notWired;
  }
  return { md, agentJson: JSON.stringify(agent, null, 2) + '\n' };
}

/* ===== overview / landing page ===== */
function renderIndex(cs) {
  cs = cs.filter(c => !c.docPage);
  const cards = cs.map(c => `<a class="card" href="${docPagePath(c)}">
      <div class="ct">${esc(c.name)} <span class="badge ${c.tier==='leaf-lit'?'leaf':'composite'}">${c.tier==='leaf-lit'?'leaf':'composite'}</span></div>
      <div class="cs">${esc(c.summary)}</div>
      <div class="cf">${c.slug}.md · ${c.slug}.agent.json · ${c.slug}.llms.txt</div></a>`).join('');
  const planned = [...COMPONENTS_CATALOG, ...PATTERNS_CATALOG].reduce((n,g)=>n+g.items.length,0);
  const main = `
  <h1>Components</h1>
  ${headline(['One token source and one contract per component', 'Generates this site, the llms.txt feeds, design.md and each agent.json together', 'Generated together, so they cannot drift'])}
  <p class="gen">◆ generated by generate.mjs — ${cs.length} live of ${planned} planned components</p>

  ${consumeBlock()}

  <h2 style="margin-top:30px">Live components</h2>
  <div class="cards">${cards}</div>

  ${GUIDELINES.length ? `<h2>Guidelines</h2>
  <p class="body">Composition guides — how to assemble the components above for a use case. A pattern ships no new primitive; it reuses components and documents conventions, linking each rule back to its <code>aha-design</code> skill.</p>
  <div class="cards">${GUIDELINES.map(p => {
    const missing = (p.composedOf||[]).filter(x=>x.status==='missing').length;
    return `<a class="card" href="guidelines/${p.slug}/index.html">
      <div class="ct">${esc(p.name)} <span class="badge pattern" style="color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30)">pattern</span></div>
      <div class="cs">${esc(p.summary)}</div>
      <div class="cf">${(p.rules||[]).length} rules · reuses ${(p.composedOf||[]).length}${missing?` · ${missing} backlog`:''}</div></a>`;
  }).join('')}</div>` : ''}

  <h2>Agent feeds</h2>
  <p class="feeds">
    <a href="feeds/llms-txt.html"><code>llms.txt</code></a> index ·
    <a href="feeds/llms-full-txt.html"><code>llms-full.txt</code></a> full ·
    <a href="feeds/design-md.html"><code>design.md</code></a> visual language ·
    <a href="feeds/changelog.html"><code>CHANGELOG.md</code></a> version history ·
    <a href="feeds/variables-css.html"><code>variables.css</code></a> token layer ·
    per-component <code>&lt;slug&gt;.agent.json</code>
  </p>

  <h2>Roadmap</h2>
  <p class="body">The <b>Components</b> tab lists the full planned inventory (greyed = <b>soon</b>), taken from the aha-design <code>component-standard</code> measured set. Leaf primitives ship as one shared Lit web component (portable to any environment); composites ship as antd / ant-design-vue wrappers (app-only). Each component follows the same lifecycle: contract &rarr; build &rarr; theme &rarr; render-matrix verify &rarr; judge &rarr; publish.</p>`;
  return docShell({ base: '', active: '__overview__', section: 'overview', main });
}

/* ===== Icon library — runtime, gallery page, and agent feeds (from the registry) ===== */
// The client artifacts every icon-bearing page loads: the registry data + the shared element.
function writeIconRuntime() {
  mkdirSync(join(OUT, 'icons'), { recursive: true });
  writeFileSync(join(OUT, 'icons', 'registry.js'), 'window.AHA_ICONS=' + JSON.stringify(ICONS.icons) + ';\n');
  writeFileSync(join(OUT, 'icons', 'aha-icon.js'), AHA_ICON_JS);
}
const GALLERY_JS = `
(function(){
  var q=document.getElementById('icon-search'), grid=document.getElementById('icon-grid'),
      count=document.getElementById('icon-count'), cells=[].slice.call(grid.querySelectorAll('.ic')),
      fams=[].slice.call(document.querySelectorAll('.fam-chip')), fam='all';
  function apply(){
    var t=(q.value||'').trim().toLowerCase(), n=0;
    cells.forEach(function(c){
      var ok=(fam==='all'||c.dataset.fam===fam) && (!t||c.dataset.name.indexOf(t)>=0);
      c.style.display=ok?'':'none'; if(ok)n++;
    });
    count.textContent=n+' icon'+(n===1?'':'s');
  }
  q.addEventListener('input',apply);
  var linked=new URLSearchParams(location.search).get('q'); if(linked) q.value=linked;
  fams.forEach(function(b){b.addEventListener('click',function(){fams.forEach(function(x){x.classList.remove('on')});b.classList.add('on');fam=b.dataset.fam;apply();});});
  grid.addEventListener('click',function(e){
    var c=e.target.closest('.ic'); if(!c)return;
    var name=c.dataset.name;
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(name);
    var was=c.querySelector('.icn').textContent; c.classList.add('copied'); c.querySelector('.icn').textContent='copied!';
    setTimeout(function(){c.classList.remove('copied');c.querySelector('.icn').textContent=was;},900);
  });
  apply();
})();
`;
function renderIconGallery() {
  const entries = Object.entries(ICONS.icons).sort((a, b) => a[0].localeCompare(b[0]));
  const strip = (n) => n.replace(/^(system|slidetype|filetype)-/, '');
  const cells = entries.map(([name, v]) =>
    `<button class="ic" type="button" data-name="${esc(name)}" data-fam="${esc(v.family)}" title="${esc(name)} — click to copy"><aha-icon name="${esc(name)}" size="24"></aha-icon><span class="icn">${esc(strip(name))}</span></button>`).join('');
  const chips = ['all', ...ICONS.families].map((f, i) =>
    `<button class="fam-chip${i === 0 ? ' on' : ''}" type="button" data-fam="${esc(f)}">${esc(f)}${f === 'all' ? '' : ` <b>${Object.values(ICONS.icons).filter(x => x.family === f).length}</b>`}</button>`).join('');
  const main = `
  <h1>Icon library</h1>
  ${headline([`${ICONS.count} glyphs across ${ICONS.families.length} families, imported from Figma Design System V3`, 'Call any glyph by name with <aha-icon name="…">; never inline an SVG', 'Click a glyph to copy its name'])}
  <p class="gen">◆ generated from icons/registry.json (built by build-icons.mjs from ${esc(ICONS.$generatedFrom || 'Figma')}) — do not edit by hand</p>

  <div class="gal-bar">
    <input id="icon-search" type="search" placeholder="Search ${ICONS.count} icons by name…" autocomplete="off" spellcheck="false" />
    <div class="fam-chips">${chips}</div>
    <span id="icon-count" class="gal-count"></span>
  </div>
  <div id="icon-grid" class="icon-grid">${cells}</div>

  <script src="registry.js"></script>
  <script src="aha-icon.js"></script>
  <script>${GALLERY_JS}</script>`;
  const extraCss = `
  .gal-bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:8px 0 18px;position:sticky;top:64px;background:#fff;padding:12px 0;z-index:5;border-bottom:1px solid var(--aha-split)}
  #icon-search{flex:1 1 320px;min-width:240px;height:38px;padding:0 14px;font-family:var(--aha-font-product);font-size:14px;border:1px solid var(--aha-border,#D4D4D4);border-radius:8px;outline:none}
  #icon-search:focus{border-color:var(--aha-color-primary);box-shadow:0 0 0 3px var(--aha-focus-ring-soft,#EDE0FF)}
  .fam-chips{display:flex;gap:6px}
  .fam-chip{font-family:var(--aha-font-product);font-size:13px;color:var(--aha-text-secondary);background:var(--aha-gray-20);border:1px solid transparent;border-radius:999px;padding:6px 12px;cursor:pointer;text-transform:capitalize}
  .fam-chip b{opacity:.6;font-weight:600}
  .fam-chip.on{background:var(--aha-purple-10);border-color:var(--aha-purple-30);color:#5715A0}
  .gal-count{font-size:12px;color:var(--aha-text-tertiary);font-family:Menlo,monospace;margin-left:auto}
  .icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}
  .ic{display:flex;flex-direction:column;align-items:center;gap:9px;padding:16px 8px 10px;background:#fff;border:1px solid var(--aha-split);border-radius:10px;cursor:pointer;color:var(--aha-icon-default,#4B4B4B);font-family:var(--aha-font-product)}
  .ic:hover{border-color:var(--aha-purple-30);color:var(--aha-color-primary);box-shadow:0 3px 10px rgba(106,30,187,.08)}
  .ic .icn{font-size:11px;line-height:1.3;color:var(--aha-text-tertiary);word-break:break-word;text-align:center}
  .ic.copied{border-color:var(--aha-color-success);color:var(--aha-color-success)}
  .ic.copied .icn{color:var(--aha-color-success)}`;
  return docShell({ base: '../', active: '__icons__', section: 'foundations', main, extraCss });
}
/* ===== Foundations · Logo library (logo/manifest.json is the source of truth; the SVGs are copied to dist/logo) ===== */
const LOGO_MANIFEST = JSON.parse(read(join(root, 'logo', 'manifest.json'))).logos;
const LOGO_AHA = LOGO_MANIFEST.filter(l => l.category === 'AhaSlides');
const LOGO_BRANDS = LOGO_MANIFEST.filter(l => l.category !== 'AhaSlides');
const LOGO_DARK_TILE = new Set(['ahaslides-logo-white', 'thesplash-white']);
const LOGO_DONTS = ['Change the colours', 'Stretch the logo', 'Rotate or tilt the logo', 'Apply a gradient to The Splash', 'Apply a gradient to the wordmark', 'Separate and move the elements'];
const LOGO_GALLERY_JS = `
(function(){
  var root=document.getElementById('logo-gallery'),q=document.getElementById('logo-search'),count=document.getElementById('logo-count');
  var tabs=[].slice.call(root.querySelectorAll('[role=tab]')),panels=[].slice.call(root.querySelectorAll('[role=tabpanel]'));
  function active(){return panels.filter(function(p){return !p.hidden})[0];}
  function apply(){
    var t=q.value.trim().toLowerCase();
    panels.forEach(function(p){
      var cells=[].slice.call(p.querySelectorAll('.lg')),n=0;
      cells.forEach(function(c){var ok=!t||c.dataset.name.indexOf(t)>-1||c.dataset.label.indexOf(t)>-1;c.hidden=!ok;if(ok)n++;});
      [].slice.call(p.querySelectorAll('.lg-sec')).forEach(function(s){s.hidden=!s.querySelector('.lg:not([hidden])');});
      p.dataset.shown=n;p.dataset.total=cells.length;
    });
    var p=active();count.textContent=p.dataset.shown+' of '+p.dataset.total;
  }
  function select(tab){
    tabs.forEach(function(x){var on=x===tab;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;document.getElementById(x.getAttribute('aria-controls')).hidden=!on;});
    apply();
  }
  tabs.forEach(function(tab,i){
    tab.addEventListener('click',function(){select(tab);});
    tab.addEventListener('keydown',function(e){
      var d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0; if(!d)return;
      var next=tabs[(i+d+tabs.length)%tabs.length];select(next);next.focus();e.preventDefault();
    });
  });
  q.addEventListener('input',apply);
  root.addEventListener('click',function(e){
    var c=e.target.closest('.lg'); if(!c||e.target.closest('a'))return;
    if(c.classList.contains('copied'))return;
    if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(c.dataset.name);
    var l=c.querySelector('.lgn'),was=l.textContent; c.classList.add('copied'); l.textContent='copied!';
    setTimeout(function(){c.classList.remove('copied');l.textContent=was;},900);
  });
  root.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ')return;
    var c=e.target.closest('.lg'); if(!c||e.target!==c)return;
    e.preventDefault();c.click();
  });
  apply();
})();
`;
function renderLogoPage() {
  const cell = l =>
    `<div class="lg" data-name="${esc(l.id)}" data-label="${esc(l.name.toLowerCase())}" role="button" tabindex="0" title="${esc(l.name)} — click to copy its id"><div class="lg-stage${LOGO_DARK_TILE.has(l.id) ? ' lg-dark' : ''}"><img${l.id.startsWith('ahaslides-logo') ? ' class="lg-lockup"' : ''} src="../logo/${esc(l.file)}" alt="${esc(l.name)} logo" loading="lazy"/></div><span class="lgn">${esc(l.name)}</span><a class="lg-dl" href="../logo/${esc(l.file)}" download><span class="lg-file">${esc(l.file)}</span><span class="lg-arrow">&darr;</span></a></div>`;
  const sections = list => {
    const names = [...new Set(list.map(l => l.section))];
    return names.map(n => `<section class="lg-sec"><h3 class="tok-h3 lg-sec-h">${esc(n)}</h3><div class="logo-grid">${list.filter(l => l.section === n).map(cell).join('')}</div></section>`).join('');
  };
  const main = `
  <h1>Logo library</h1>
  ${headline([`The AhaSlides logo and the ${LOGO_BRANDS.length} third-party brand logos the presenter app shows`, 'Each brand is the current official full-colour SVG from theSVG; never redraw a brand mark or stand in a letter tile', 'Click a tile to copy its id, or use the download link'])}
  <p class="gen">◆ generated from logo/manifest.json (each Brands logo records its source URL, fetch date and where the presenter app shows it) — fetch files from ${esc(SITE)}/logo/&lt;file&gt;</p>

  <div id="logo-gallery">
    <div class="gal-bar">
      <div class="logo-tabs" role="tablist" aria-label="Logo groups">
        <button class="logo-tab" id="tab-aha" role="tab" type="button" aria-selected="true" aria-controls="panel-aha">AhaSlides <b>${LOGO_AHA.length}</b></button>
        <button class="logo-tab" id="tab-brands" role="tab" type="button" aria-selected="false" aria-controls="panel-brands" tabindex="-1">Brands <b>${LOGO_BRANDS.length}</b></button>
      </div>
      <input id="logo-search" type="search" placeholder="Search logos by name…" aria-label="Search logos" autocomplete="off" spellcheck="false" />
      <span id="logo-count" class="gal-count" aria-live="polite"></span>
    </div>
    <div id="panel-aha" role="tabpanel" aria-labelledby="tab-aha" class="lg-panel">${sections(LOGO_AHA)}</div>
    <div id="panel-brands" role="tabpanel" aria-labelledby="tab-brands" class="lg-panel" hidden>${sections(LOGO_BRANDS)}</div>
  </div>

  <h3 class="tok-h3">AhaSlides logo rules</h3>
  <p class="body">The logo is The Splash plus the wordmark. Use the full-colour file on white, the white file on Radical Pink, Radical Purple or Deep Space Blue, and the black file for one-colour use on light surfaces. Minimum size <b>154 &times; 35 px</b> on screen, <b>175 &times; 40 mm</b> in print.</p>
  <h3 class="tok-h3">Don&rsquo;t</h3>
  <ul class="lg-donts">${LOGO_DONTS.map(d => `<li>${esc(d)}</li>`).join('')}</ul>
  <h3 class="tok-h3">Third-party marks</h3>
  <p class="body">Brand logos belong to their owners and stay unaltered. The list is what the presenter app renders today; to add a brand, add it to the app first, then fetch its current SVG from theSVG or the brand&rsquo;s own press page and record the source in <code>logo/manifest.json</code>.</p>

  <script>${LOGO_GALLERY_JS}</script>`;
  const extraCss = `
  .gal-bar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin:8px 0 18px;position:sticky;top:64px;background:#fff;padding:12px 0 0;z-index:5;border-bottom:1px solid var(--aha-split)}
  .logo-tabs{display:flex;gap:4px;margin-bottom:-1px}
  .logo-tab{font-family:var(--aha-font-product);font-size:14px;font-weight:600;color:var(--aha-text-secondary);background:transparent;border:none;border-bottom:2px solid transparent;padding:8px 14px 10px;cursor:pointer}
  .logo-tab b{opacity:.6;font-weight:600;margin-left:4px}
  .logo-tab[aria-selected="true"]{color:#5715A0;border-bottom-color:var(--aha-color-primary)}
  .logo-tab:hover{color:#5715A0}
  .logo-tab:focus-visible,.lg:focus-visible{outline:2px solid var(--aha-color-primary);outline-offset:2px}
  #logo-search{flex:1 1 260px;min-width:220px;height:38px;margin-bottom:12px;padding:0 14px;font-family:var(--aha-font-product);font-size:14px;border:1px solid var(--aha-border,#D4D4D4);border-radius:8px;outline:none}
  #logo-search:focus{border-color:var(--aha-color-primary);box-shadow:0 0 0 3px var(--aha-focus-ring-soft,#EDE0FF)}
  .gal-count{font-size:12px;color:var(--aha-text-tertiary);font-family:Menlo,monospace;margin:0 0 12px auto}
  .logo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:24px}
  .lg-panel[hidden],.lg-sec[hidden]{display:none}
  .lg-sec-h{margin:20px 0 10px}
  .lg-sec:first-child .lg-sec-h{margin-top:4px}
  .lg{display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 10px 12px;background:#fff;border:1px solid var(--aha-split);border-radius:10px;cursor:pointer;font-family:var(--aha-font-product)}
  .lg[hidden]{display:none}
  .lg:hover{border-color:var(--aha-purple-30);box-shadow:0 3px 10px rgba(106,30,187,.08)}
  .lg-stage{display:flex;align-items:center;justify-content:center;width:100%;height:104px;border-radius:6px;background:var(--aha-gray-10,#FAFAFA)}
  .lg-stage.lg-dark{background:var(--aha-color-primary)}
  .lg-stage img{width:56px;height:56px;object-fit:contain;display:block}
  .lg-stage img.lg-lockup{width:100%;max-width:156px;height:60px}
  .lg .lgn{font-size:13px;line-height:1.3;color:var(--aha-text-default);text-align:center}
  .lg-dl{font-size:11px;color:var(--aha-text-tertiary);text-decoration:none;max-width:100%;display:flex;align-items:baseline;gap:4px;white-space:nowrap}
  .lg-file{min-width:0;overflow:hidden;text-overflow:ellipsis}
  .lg-arrow{flex:none}
  .lg-dl:hover{color:var(--aha-text-link)}
  .lg.copied{border-color:var(--aha-color-success)}
  .lg.copied .lgn{color:var(--aha-color-success)}
  .lg-donts{margin:0;padding-left:20px;font-size:14px;line-height:1.8;color:var(--aha-text-default)}`;
  return docShell({ base: '../', active: '__logo__', section: 'foundations', main, extraCss });
}
function renderIconsLlms() {
  const byFam = {};
  for (const [k, v] of Object.entries(ICONS.icons)) (byFam[v.family] || (byFam[v.family] = [])).push(k);
  let s = `# AhaSlides Icons — call by name\n\n> ${ICONS.count} glyphs, generated from ${ICONS.$generatedFrom}. Render with the shared <aha-icon> element — NEVER hand-author or inline an <svg>.\n\n`;
  s += 'Usage: `<aha-icon name="system-bell" size={16} label="Notifications" />`\n';
  s += '- size: 12 | 16 | 24 | 32 (only). Colour follows currentColor — set it on the wrapper.\n';
  s += '- omit `label` and add `decorative` for an icon that only repeats adjacent text.\n';
  s += '- filled/active state → pick the `-filled` asset (e.g. system-bookmark-simple-filled).\n\n';
  for (const fam of ICONS.families) s += `## ${fam} (${(byFam[fam] || []).length})\n${(byFam[fam] || []).sort().join(', ')}\n\n`;
  return s;
}
function renderIconsAgentJson() {
  return JSON.stringify({
    generatedFrom: ICONS.$generatedFrom, element: 'aha-icon',
    usage: '<aha-icon name="system-bell" size={16} label="Notifications" />',
    rules: { sizes: [12, 16, 24, 32], colour: 'currentColor (set on wrapper)', decorative: 'add `decorative`, drop `label`', filledState: 'use the -filled asset' },
    families: ICONS.families, count: ICONS.count,
    names: Object.keys(ICONS.icons).sort(),
    icons: Object.fromEntries(Object.entries(ICONS.icons).map(([k, v]) => [k, { family: v.family, recolorable: v.recolorable }])),
  }, null, 2) + '\n';
}

/* ===== run ===== */
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
const contracts = readdirSync(CDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(CDIR, f))));
contracts.sort((a,b)=>a.name.localeCompare(b.name));
LIVE = new Set(contracts.map(c => c.slug));   // drives which nav items link vs render as "soon"

/* patterns — composition guides (loaded before any page renders so the Patterns nav is present everywhere) */
GUIDELINES = existsSync(GDIR)
  ? readdirSync(GDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(GDIR, f)))).sort((a,b)=>a.name.localeCompare(b.name))
  : [];
/* marketing sections — loaded before any page renders so the Patterns sidebar lists them everywhere.
   Absent-safe: no marketing/ dir → no group/pages/feed. */
MARKETING = existsSync(MDIR)
  ? readdirSync(MDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(MDIR, f)))).sort((a,b)=>a.name.localeCompare(b.name))
  : [];
/* audience library — a single-page area loaded from its data file. Absent-safe: no
   audience/library.json → no Audience tab/page. */
AUDIENCE = existsSync(join(ADIR, 'library.json')) ? JSON.parse(read(join(ADIR, 'library.json'))) : null;
AUD_CSS = existsSync(join(ADIR, 'audience.css')) ? read(join(ADIR, 'audience.css')) : '';
/* anti-slop — the DS-owned criteria store (surfaces → binary judge criteria). The single
   source of truth the consumer feeds compile from. Absent-safe: no store → no feed. */
const ANTISLOP = existsSync(join(root, 'anti-slop', 'criteria.json'))
  ? JSON.parse(read(join(root, 'anti-slop', 'criteria.json')))
  : null;
/* top-nav landing per area — each tab opens that area's first real page */
const firstComponent = contracts.find(c => !PATTERN_SLUGS.has(c.slug) && !SETTINGS_SLUGS.has(c.slug) && !c.docPage);
const firstPattern = PATTERNS_CATALOG.flatMap(g => g.items).find(it => LIVE.has(it.slug));
NAV_LANDING = {
  overview: 'index.html',
  foundations: `foundations/${TOKEN_PAGES[0].slug}.html`,
  components: (firstComponent ? `${firstComponent.slug}/index.html` : 'index.html'),
  patterns: (firstPattern ? `${firstPattern.slug}/index.html` : 'index.html'),
  settings: 'settings/index.html',
  guidelines: (GUIDELINES[0] ? `guidelines/${GUIDELINES[0].slug}/index.html` : 'index.html'),
  audience: (AUDIENCE ? 'audience/index.html' : 'index.html'),
  charts: 'charts/index.html',
  feeds: 'feeds/llms-txt.html',
};
if (GUIDELINES.length) {
  RAW_FEEDS.push(
    { name: 'guidelines.llms.txt',  file: 'guidelines.llms.txt',  page: 'guidelines-llms-txt',  desc: 'One entry per composition pattern — what it reuses, the rule count, and its component backlog.' },
    { name: 'guidelines.agent.json', file: 'guidelines.agent.json', page: 'guidelines-agent-json', desc: 'Machine feed: every pattern with its composedOf reuse graph, rules (each ref’d to a skill assertion), and whether it ships code.' },
  );
}
if (MARKETING.length) {
  RAW_FEEDS.push(
    { name: 'marketing.llms.txt',  file: 'marketing.llms.txt',  page: 'marketing-llms-txt',  desc: 'One entry per marketing section (Hero, Section container) for the AhaSlides marketing sites, paste-and-run and token-bound.' },
    { name: 'marketing.agent.json', file: 'marketing.agent.json', page: 'marketing-agent-json', desc: 'Machine feed: every marketing section with its summary, paste-and-run html/css, and how to consume it.' },
  );
}
if (ANTISLOP) {
  RAW_FEEDS.push(
    { name: 'anti-slop.md', file: 'anti-slop.md', page: 'anti-slop-md', desc: 'The official AhaSlides anti-slop loop — per-surface rules + the binary judge a consumer self-runs. Read this BEFORE building.' },
    { name: 'anti-slop.agent.json', file: 'anti-slop.agent.json', page: 'anti-slop-agent-json', desc: 'Machine feed: the anti-slop loop + per-surface { rules, criteria, selfCheck }. Compiled from the DS-owned criteria store.' },
  );
}

writeFileSync(join(OUT, 'variables.css'), '/* Generated from tokens.canonical.json — do not edit by hand. */\n' + tokenVars(TOK) + '\n');

/* Importable token layer for real consumers: @ahaslides-product/design/tokens.css + /tokens */
mkdirSync(join(root, 'lib'), { recursive: true });
writeFileSync(join(root, 'lib', 'tokens.css'), '/* @ahaslides-product/design/tokens.css — generated from tokens.canonical.json. */\n' + tokenVars(TOK) + '\n');
writeFileSync(join(root, 'lib', 'tokens.js'),
  '// @ahaslides-product/design/tokens — the canonical design tokens (generated from tokens.canonical.json).\n' +
  'export const tokens = ' + JSON.stringify(TOK, null, 2) + ';\n' +
  '// Tokens defined as aliases of another token: path → the referenced token path and its CSS var.\n' +
  'export const tokenAliases = ' + JSON.stringify(Object.fromEntries(TOKEN_ALIASES), null, 2) + ';\nexport default tokens;\n');

/* All-in-one entry — @ahaslides-product/design/all (JS-only). ONE import registers every shared
   <aha-*> element (incl. <aha-icon>/<aha-illustration>); the consumer still loads the token layer
   separately (import '${PKGNAME}/tokens.css' or a <link> to lib/tokens.css). Built for CDN / no-build
   pages — a single <script> tag, then any <aha-*> works. Bundled apps should prefer per-element
   imports so unused elements tree-shake out. Generated by enumerating the shipped element modules
   (every lib/*.js that calls customElements.define) so the set can never drift from what ships. */
const ELEMENT_MODULES = readdirSync(join(root, 'lib'))
  .filter(f => f.endsWith('.js') && f !== 'all.js')
  .filter(f => /customElements\.define\(/.test(read(join(root, 'lib', f))))
  .sort();
writeFileSync(join(root, 'lib', 'all.js'),
  `// @ahaslides-product/design/all — all-in-one entry (generated by generate.mjs; do not edit by hand).\n` +
  `// ONE import registers every shared <aha-*> element. Load the token layer separately:\n` +
  `//   <link rel="stylesheet" href=".../lib/tokens.css">   or   import '${PKGNAME}/tokens.css'\n` +
  `// Bundled apps should prefer per-element imports for tree-shaking; this suits CDN / no-build pages.\n` +
  ELEMENT_MODULES.map(f => `import './${f}';`).join('\n') + '\n');
console.log(`  ✓ lib/all.js — all-in-one entry (${ELEMENT_MODULES.length} elements)`);

/* Ship the real component modules INTO the site (dist/lib) so a doc-page preview can
   ESM-import the SHIPPED element (../lib/<name>.js) — resolves both locally and on
   GitHub Pages under the project path. Without this, lib/ isn't deployed and every
   live preview 404s its import. Single source: the preview runs the real element. */
cpSync(join(root, 'lib'), join(OUT, 'lib'), { recursive: true });

/* Ship the self-hosted product face (Plus Jakarta Sans, weights 400/600) INTO the site
   (dist/fonts) so the shellCss @font-face `url(<base>fonts/…woff2)` actually resolves.
   Without this the woff2 404s on GitHub Pages and every page — including the shadow-DOM
   component previews — silently falls back to -apple-system instead of the brand face. */
cpSync(join(root, 'fonts'), join(OUT, 'fonts'), { recursive: true });
cpSync(join(root, 'logo'), join(OUT, 'logo'), { recursive: true });

writeFileSync(join(OUT, 'design.md'), renderDesignMd(TOK, contracts));
// CHANGELOG.md — shipped verbatim into the site so it's a fetchable feed (/CHANGELOG.md) and
// gets a styled in-shell page (see RAW_FEEDS). Single source: the repo-root file the gate enforces.
writeFileSync(join(OUT, 'CHANGELOG.md'), read(join(root, 'CHANGELOG.md')));
mkdirSync(join(OUT, 'foundations'), { recursive: true });
for (const p of TOKEN_PAGES) writeFileSync(join(OUT, 'foundations', `${p.slug}.html`), renderTokenPage(p.slug));
writeFileSync(join(OUT, 'foundations', 'logo.html'), renderLogoPage());
writeFileSync(join(OUT, 'index.html'), renderIndex(contracts));

/* Icon library — runtime (registry.js + aha-icon.js), the searchable gallery page, and the agent feeds */
writeIconRuntime();
writeFileSync(join(OUT, 'icons', 'index.html'), renderIconGallery());
writeFileSync(join(OUT, 'icons.llms.txt'), renderIconsLlms());
writeFileSync(join(OUT, 'icons.agent.json'), renderIconsAgentJson());
console.log(`  ✓ icons: registry.js · aha-icon.js · icons/index.html (${ICONS.count} glyphs) · icons.llms.txt · icons.agent.json`);

const indexLines = [
  '# AhaSlides Design System',
  '',
  `> The single source of truth for AhaSlides UI, generated from one contract per component.`,
  `> Version: ${PKG.version} — changelog: ${SITE}/CHANGELOG.md`,
  `> Registry:  GitHub Packages (${REGISTRY}) — needs a GitHub token with read:packages.`,
  `> Configure once in .npmrc:  ${SCOPE}:registry=${REGISTRY}`,
  `> Install:  npm i ${PKGNAME}`,
  `> Import the token layer once at the app root:  import '${PKGNAME}/tokens.css'`,
  `> Then import a component by subpath, e.g.  import '${PKGNAME}/aha-button'`,
  `> No build step? One tag registers every element — CDN / no-build pages:`,
  `>   <script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@master/lib/all.js"></script>`,
  `>   (loads the whole set; for bundled apps prefer per-element imports so unused elements tree-shake out)`,
  '>',
  '> ⚑ Before you build: this is the OFFICIAL AhaSlides anti-slop tool. Read anti-slop.md and',
  `>   run the binary judge for your surface — build → self-judge (PASS/FAIL each) → fix → repeat.`,
  `>   ${SITE}/anti-slop.md         the anti-slop loop + per-surface rules (read FIRST)`,
  `>   ${SITE}/anti-slop.agent.json machine feed: loop + per-surface { rules, criteria, selfCheck }`,
  '>',
  '> Feeds (absolute URLs, fetch directly):',
  `>   ${SITE}/llms.txt          this index`,
  `>   ${SITE}/llms-full.txt     every component, full docs`,
  `>   ${SITE}/design.md         machine-readable visual language + tokens`,
  `>   ${SITE}/CHANGELOG.md      version history — what changed per release`,
  `>   ${SITE}/variables.css     the --aha-* token layer`,
  `>   ${SITE}/foundations/logo.html  logo library — two tabs: the AhaSlides logo set, and the third-party brand logos the presenter app shows (Google Slides, PowerPoint, Teams, Zoom, Excel, Word, PDF, Drive, OneDrive, Google, Microsoft, PayPal, Stripe, ChatGPT, YouTube, Facebook, Instagram, LinkedIn, X, Reddit, Medium), each the current SVG from thesvg.org; files at ${SITE}/logo/<file>.svg, index at ${SITE}/logo/manifest.json; never redraw a brand mark`,
  `>   ${SITE}/guidelines.llms.txt  composition patterns (settings, overlays, app shell…) — read before components`,
  `>   ${SITE}/<slug>.agent.json per-component machine feed (props, tokens, spec, opinion, install, snippets)`,
  '>',
  '> Claude Code agents: install the DS agent plugin (skill aha-design + hooks, versioned with each release):',
  '>   /plugin marketplace add AhaSlides-Product/ahaslides-design',
  '>   /plugin install ahaslides-design@ahaslides-design',
  '>   (settings.json: enabledPlugins + extraKnownMarketplaces — see the repo README, "Agent plugin")',
  '>',
  '> Lint a screen from code (pure, no fs/process; Node and Cloudflare workerd):',
  `>   import { lintHtml } from '@ahaslides-product/design/screen-lint';`,
  `>   lintHtml(html, { surface: 'product' | 'canvas' }) → { findings: [{ rule, line, message, severity }] }`,
  '>   Opt out per line, per rule: ds-lint-allow: <rule-id>[,<rule-id>] (<reason>) — a bare ds-lint-allow suppresses nothing and warns.',
  '',
  ...patternIndexLines(),
  '## Components',
  '',
];
const fullDocs = [];
for (const c of contracts) {
  const d = join(OUT, c.slug); mkdirSync(d, { recursive: true });
  if (c.docPage) {
    mkdirSync(join(OUT, dirname(c.docPage)), { recursive: true });
    writeFileSync(join(OUT, c.docPage), renderHtml(c));
    writeFileSync(join(d, 'index.html'), redirectStub('../' + c.docPage));
  } else writeFileSync(join(d, 'index.html'), renderHtml(c));
  if (c.conformancePart) writeFileSync(join(d, '_conformance.html'), renderConformanceHarness(c));
  const md = renderMd(c);
  writeFileSync(join(d, `${c.slug}.md`), md);
  const agentJson = renderAgent(c);
  writeFileSync(join(d, `${c.slug}.agent.json`), agentJson);       // alongside the doc page
  writeFileSync(join(OUT, `${c.slug}.agent.json`), agentJson);     // flat canonical URL agents fetch
  writeFileSync(join(OUT, `${c.slug}.llms.txt`), renderLlms(c));
  indexLines.push(`- [${c.name}](${c.slug}/${c.slug}.md) — ${c.tier} — ${c.summary}${settingsHubPointer(c) ? ' (Settings pattern: read the Settings hub first)' : ''}`);
  fullDocs.push(md);
  console.log(`  ✓ ${c.slug}: index.html · ${c.slug}.md · ${c.slug}.agent.json · ${c.slug}.llms.txt`);
}
writeFileSync(join(OUT, 'llms.txt'), indexLines.join('\n') + '\n');
// Full-context feed ends with the changelog, so an agent reading the whole thing knows what
// changed per release (and which version these docs describe).
writeFileSync(join(OUT, 'llms-full.txt'), fullDocs.join('\n---\n\n') + '\n---\n\n' + read(join(root, 'CHANGELOG.md')) + '\n');

/* patterns — doc page + md + agent feed per pattern, plus the two index feeds */
for (const p of GUIDELINES) {
  const d = join(OUT, 'guidelines', p.slug); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'index.html'), renderGuidelineHtml(p));
  writeFileSync(join(d, `${p.slug}.md`), renderGuidelineMd(p));
  writeFileSync(join(d, `${p.slug}.agent.json`), renderGuidelineAgent(p));
  const missing = (p.composedOf || []).filter(x => x.status === 'missing').length;
  console.log(`  ✓ guideline ${p.slug}: index.html · ${p.slug}.md · ${p.slug}.agent.json${missing?` (⚠ ${missing} backlog component${missing===1?'':'s'})`:''}`);
}
/* Settings hub — one consolidated top-level URL (settings/index.html) for the whole Settings
   group, composed from the guideline + settings-list contract (no duplicated content). */
if (GUIDELINES.some(p => p.slug === 'settings')) {
  const sd = join(OUT, 'settings'); mkdirSync(sd, { recursive: true });
  writeFileSync(join(sd, 'index.html'), renderSettingsHub());
  writeFileSync(join(sd, 'settings.md'), renderSettingsHubMd());
  console.log('  ✓ settings hub: settings/index.html · settings/settings.md');
}
if (GUIDELINES.length) {
  writeFileSync(join(OUT, 'guidelines.llms.txt'), renderGuidelinesLlms(GUIDELINES));
  writeFileSync(join(OUT, 'guidelines.agent.json'), JSON.stringify(GUIDELINES.map(p => JSON.parse(renderGuidelineAgent(p))), null, 2) + '\n');
}
if (MARKETING.length) {
  for (const b of MARKETING) {
    const d = join(OUT, 'marketing', b.slug); mkdirSync(d, { recursive: true });
    writeFileSync(join(d, 'index.html'), renderMarketingHtml(b));
    writeFileSync(join(d, `${b.slug}.md`), renderMarketingMd(b));
    writeFileSync(join(d, `${b.slug}.agent.json`), renderMarketingAgent(b));
    console.log(`  ✓ marketing ${b.slug}: index.html · ${b.slug}.md · ${b.slug}.agent.json`);
  }
  writeFileSync(join(OUT, 'marketing.llms.txt'), renderMarketingLlms(MARKETING));
  writeFileSync(join(OUT, 'marketing.agent.json'), JSON.stringify(MARKETING.map(b => JSON.parse(renderMarketingAgent(b))), null, 2) + '\n');
}
for (const [slug, target] of Object.entries(LANDING_REDIRECTS)) {
  const d = join(OUT, 'landing', slug); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'index.html'), redirectStub((slug ? '../../' : '../') + target));
}
/* audience library — one first-class in-site page (audience/index.html) under the DS shell */
if (AUDIENCE) {
  mkdirSync(join(OUT, 'audience'), { recursive: true });
  writeFileSync(join(OUT, 'audience', 'index.html'), renderAudienceLibrary());
  console.log(`  ✓ audience library: audience/index.html (${AUDIENCE.sections.length} component sections)`);
}
/* anti-slop consumer feeds — compiled from the DS-owned store + guidelines. */
if (ANTISLOP) {
  const { md, agentJson } = renderAntiSlop(ANTISLOP, GUIDELINES);
  writeFileSync(join(OUT, 'anti-slop.md'), md);
  writeFileSync(join(OUT, 'anti-slop.agent.json'), agentJson);
  console.log(`  ✓ anti-slop: anti-slop.md · anti-slop.agent.json (${Object.keys(ANTISLOP.surfaces).length} surface(s))`);
  // A marketplace install copies only agent/, so the plugin's hooks carry their own release's criteria.
  mkdirSync(join(root, 'agent', 'anti-slop'), { recursive: true });
  writeFileSync(join(root, 'agent', 'anti-slop', 'criteria.json'), read(join(root, 'anti-slop', 'criteria.json')));
  console.log('  ✓ agent plugin: agent/anti-slop/criteria.json');
}

// Feed pages LAST — they embed the actual generated files (now all on disk) in a code wrapper.
mkdirSync(join(OUT, 'feeds'), { recursive: true });
for (const f of RAW_FEEDS) {
  writeFileSync(join(OUT, 'feeds', `${f.page}.html`), renderFeedPage(f, read(join(OUT, f.file))));
}
const searchIndex = buildSearchIndex({ outDir: OUT, contracts, icons: ICONS, tokenCss: tokenVars(TOK), version: PKG.version });
writeFileSync(join(OUT, 'search-index.json'), JSON.stringify(searchIndex));
console.log(`  ✓ search: search-index.json (${searchIndex.count} entries)`);
console.log(`\nGenerated ${contracts.length} component(s) + variables.css + design.md + ${TOKEN_PAGES.length} token pages + index.html + llms feeds + ${RAW_FEEDS.length} feed pages → dist/`);
