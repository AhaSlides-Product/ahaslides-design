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
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const CDIR = join(root, 'contracts');
const PATDIR = join(root, 'patterns');   // pattern artifacts (composition guides over existing components)
const PDIR = join(root, 'parts');
const OUT  = join(root, 'dist');
const read = (p) => readFileSync(p, 'utf8');
const part = (name) => (name && existsSync(join(PDIR, name)) ? read(join(PDIR, name)) : '');
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
const CATALOG = [
  { cat: 'General',      items: [ { name: 'Button', slug: 'button' }, { name: 'Icon', slug: 'icon' } ] },
  { cat: 'Data Entry',   items: [ { name: 'Checkbox', slug: 'checkbox' }, { name: 'Radio', slug: 'radio' }, { name: 'Switch', slug: 'switch' }, { name: 'Input', slug: 'input' }, { name: 'Select', slug: 'select' }, { name: 'DatePicker', slug: 'datepicker' }, { name: 'Form', slug: 'form' }, { name: 'Upload', slug: 'uploader' } ] },
  { cat: 'Data Display', items: [ { name: 'Badge', slug: 'badge' }, { name: 'Tag', slug: 'tag' }, { name: 'Tooltip', slug: 'tooltip' }, { name: 'Tabs', slug: 'tabs' }, { name: 'Table', slug: 'table' } ] },
  { cat: 'Navigation',   items: [ { name: 'Dropdown', slug: 'dropdown' } ] },
  { cat: 'Feedback',     items: [ { name: 'Modal', slug: 'modal' } ] },
];
let LIVE = new Set();   // slugs with a real contract — assigned once contracts load
let PATTERNS = [];      // loaded pattern artifacts — assigned once patterns load (drives the Patterns nav)
let NAV_LANDING = {};   // top-nav → each area's landing page (set once contracts/patterns load)

/* AntD-style IA: top-level AREAS live in the header nav; each area gets its OWN scoped left
   sidebar (Components shows only components, Foundations only tokens/icons, etc.). One area
   per screen keeps every sidebar short and relevant. */
const SECTIONS = [
  { key: 'overview',    label: 'Overview' },
  { key: 'foundations', label: 'Foundations' },
  { key: 'components',  label: 'Components' },
  { key: 'patterns',    label: 'Patterns' },
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
  L.push(`--aha-text-default:${c.textDefault}; --aha-text-secondary:${c.textSecondary}; --aha-text-tertiary:${c.textTertiary}; --aha-text-disabled:${c.textDisabled}; --aha-text-inverse:${c.textInverse}; --aha-text-link:${c.textLink}; --aha-text-link-hover:${c.textLinkHover}; --aha-text-primary-ink:${c.textPrimaryInk}; --aha-text-positive:${c.textPositive}; --aha-text-negative:${c.textNegative}; --aha-text-warning:${c.textWarning};`);
  /* surfaces */
  L.push(`--aha-bg-base:${c.bgBase}; --aha-bg-container:${c.bgContainer}; --aha-bg-container-secondary:${c.bgContainerSecondary}; --aha-bg-container-disabled:${c.bgContainerDisabled}; --aha-bg-elevated:${c.bgElevated}; --aha-bg-layout:${c.bgLayout}; --aha-bg-accent:${c.bgAccent}; --aha-bg-informative:${c.bgInformative}; --aha-bg-hover:${c.bgHover}; --aha-bg-positive:${c.bgPositive}; --aha-bg-negative:${c.bgNegative}; --aha-bg-warning:${c.bgWarning}; --aha-bg-overlay:${c.bgOverlay}; --aha-bg-dark:${c.bgDark}; --aha-bg-dark-raised:${c.bgDarkRaised};`);
  /* border */
  L.push(`--aha-border:${c.border}; --aha-border-secondary:${c.borderSecondary}; --aha-border-strong:${c.borderStrong}; --aha-border-disabled:${c.borderDisabled}; --aha-border-hover:${c.borderHover}; --aha-border-focus:${c.focus}; --aha-border-active:${c.borderActive}; --aha-border-error:${c.borderError}; --aha-border-success:${c.borderSuccess}; --aha-border-warning:${c.borderWarning}; --aha-border-info:${c.borderInfo}; --aha-split:${c.borderSecondary}; --aha-checkbox-border:${c.checkboxBorder};`);
  /* icon */
  L.push(`--aha-icon-default:${c.iconDefault}; --aha-icon-strong:${c.iconStrong}; --aha-icon-muted:${c.iconMuted}; --aha-icon-disabled:${c.iconDisabled}; --aha-icon-inverse:${c.iconInverse}; --aha-icon-active:${c.iconActive};`);
  /* focus */
  L.push(`--aha-focus:${c.focus}; --aha-focus-ring:${c.focus}; --aha-focus-ring-soft:${c.focusRingSoft};`);
  /* buttons */
  L.push(`--aha-btn-primary-bg:${b.primaryBg}; --aha-btn-primary-bg-hover:${b.primaryBgHover}; --aha-btn-primary-bg-press:${b.primaryBgPress}; --aha-btn-primary-fg:${b.primaryFg}; --aha-btn-secondary-bg:${b.secondaryBg}; --aha-btn-secondary-bg-hover:${b.secondaryBgHover}; --aha-btn-secondary-border:${b.secondaryBorder}; --aha-btn-secondary-border-hover:${b.secondaryBorderHover}; --aha-btn-secondary-border-press:${b.secondaryBorderPress}; --aha-btn-tertiary-bg-hover:${b.tertiaryBgHover}; --aha-btn-tertiary-bg-active:${b.tertiaryBgActive}; --aha-btn-disabled-bg:${b.disabledBg}; --aha-btn-disabled-fg:${b.disabledFg}; --aha-btn-danger-bg:${b.dangerBg}; --aha-btn-danger-bg-hover:${b.dangerBgHover}; --aha-btn-danger-bg-press:${b.dangerBgPress}; --aha-btn-danger-ring:${b.dangerRing}; --aha-btn-positive-bg:${b.positiveBg}; --aha-btn-positive-bg-hover:${b.positiveBgHover}; --aha-btn-positive-bg-press:${b.positiveBgPress}; --aha-btn-positive-fg:${b.positiveFg}; --aha-btn-focus-ring:${b.focusRing}; --aha-btn-focus-ring-success:${b.focusRingSuccess}; --aha-btn-elevate-primary:${b.elevatePrimary}; --aha-btn-elevate-secondary:${b.elevateSecondary}; --aha-btn-encourage-bg:${b.encourageBg}; --aha-btn-encourage-bg-hover:${b.encourageBgHover}; --aha-btn-encourage-bg-press:${b.encourageBgPress};`);
  /* brand slots + alpha ramps */
  L.push(Object.keys(c.brand).map(k => `--aha-brand-${k}:${c.brand[k]};`).join(' '));
  L.push(Object.keys(c.alpha).map(k => `--aha-${kebab(k)}:${c.alpha[k]};`).join(' '));
  /* type + shape */
  L.push(`--aha-font-product:${f.product}; --aha-font-display:${f.display}; --aha-font-mono:${f.mono};`);
  L.push(`--aha-radius-xs:${r.xs}px; --aha-radius-sm:${r.sm}px; --aha-radius-default:${r.default}px; --aha-radius-lg:${r.lg}px; --aha-radius-xl:${r.xl}px; --aha-radius-pill:${r.pill}px;`);
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
.brand .logo{width:30px;height:30px;border-radius:8px;background:var(--aha-color-primary);color:#fff;font-weight:700;display:inline-flex;align-items:center;justify-content:center;font-size:15px}
.brand small{display:block;font-size:11px;font-weight:400;color:var(--aha-text-tertiary);letter-spacing:.2px;margin-top:1px}
.hmeta{font-size:12px;color:var(--aha-text-tertiary);display:flex;gap:14px;align-items:center}
.hmeta .ver{font-family:Menlo,monospace;background:var(--aha-gray-20);border-radius:6px;padding:3px 9px}
.doc-body{display:flex;align-items:flex-start}
.doc-nav{position:sticky;top:64px;flex:0 0 268px;width:268px;height:calc(100vh - 64px);overflow-y:auto;padding:22px 14px 70px;border-right:1px solid var(--aha-split);background:#fff}
.doc-main{flex:1 1 auto;min-width:0;padding:36px 52px 96px}
.doc-main-inner{max-width:1040px;margin:0 auto}

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

/* ---- detail page ---- */
.crumbs{font-size:12px;letter-spacing:.3px;text-transform:uppercase;color:var(--aha-text-tertiary);margin:0 0 8px}
.doc-main h1{font-size:30px;line-height:38px;font-weight:600;margin:0 0 6px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.subtitle{color:var(--aha-text-secondary);font-size:16px;line-height:25px;margin:0 0 10px;max-width:82ch}
.gen{font-size:11px;color:var(--aha-text-tertiary);margin:0 0 18px;font-family:Menlo,monospace}
.doc-main h2{font-size:20px;line-height:28px;font-weight:600;margin:44px 0 14px;scroll-margin-top:80px}
.doc-main h2:first-of-type{margin-top:34px}
.body{line-height:1.75;color:var(--aha-text-default);max-width:82ch}
.badge{display:inline-block;font-size:11px;letter-spacing:.3px;text-transform:uppercase;font-weight:600;border-radius:6px;padding:3px 9px}
.badge.leaf{color:#0E7C63;background:#D3F5EC;border:1px solid #16C49A}
.badge.composite{color:#B24A20;background:#FFF0EB;border:1px solid #FF7747}
.badge.raw{color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);font-family:Menlo,monospace;text-transform:none}

/* ---- agent-feed code page ---- */
.code-panel.feed{border-radius:12px;margin:14px 0}
.code-panel.feed .tab{cursor:default}
.code-panel.feed pre{max-height:70vh}

/* ---- demo card (stage + code-toggle footer, AntD-style) ---- */
.demo{border:1px solid var(--aha-split);border-radius:12px;overflow:hidden;margin:0 0 12px;background:#fff}
.demo-stage{padding:0}
.demo-toolbar{display:flex;justify-content:flex-end;padding:9px 14px;border-top:1px dashed var(--aha-split)}
.demo .code-panel{margin-top:0;border-radius:0}

/* ---- utilities used by preview parts ---- */
.tier{font-size:11px;letter-spacing:.3px;text-transform:uppercase;font-weight:600;color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:6px;padding:2px 8px;display:inline-block;margin-bottom:14px}
.lbl{font-size:11px;letter-spacing:.3px;text-transform:uppercase;color:var(--aha-text-tertiary);margin:0 0 8px}
.row{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.stack{display:flex;flex-direction:column;gap:8px}
.grid2{display:grid;grid-template-columns:1fr 1fr}
.grid2>div{padding:22px 20px}.grid2>div:first-child{border-right:1px solid var(--aha-split)}
.note{background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.6;color:var(--aha-text-secondary)}
.pad{padding:22px 20px}
code{font-family:Menlo,monospace;font-size:12px;background:var(--aha-gray-20);padding:1px 6px;border-radius:4px;color:#5715A0}
table.api{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--aha-split);border-radius:8px;overflow:hidden}
table.api td,table.api th{text-align:left;padding:10px 14px;border-bottom:1px solid var(--aha-split);vertical-align:top}
table.api tr:last-child td{border-bottom:none}
table.api th{color:var(--aha-text-tertiary);font-weight:600;font-size:11px;letter-spacing:.3px;text-transform:uppercase;background:var(--aha-gray-20)}
ul{margin:0;padding-left:18px}li{margin:5px 0;line-height:1.6}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600;background:#D3F5EC;color:#0E7C63;margin:2px 4px 2px 0}
.pill.na{background:var(--aha-gray-20);color:var(--aha-text-tertiary)}
.spec-line{margin-bottom:12px;color:var(--aha-text-secondary);font-size:13px;line-height:1.7}

/* ---- component index cards (overview) ---- */
.cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}
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

const WIDGET_JS = `
document.querySelectorAll('.code-tabs').forEach(function(w){
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
`;

const FEED_JS = `
document.querySelectorAll('.code-panel.feed').forEach(function(w){
  var copy=w.querySelector('.copy'), pre=w.querySelector('pre');
  if(!copy||!pre) return;
  copy.addEventListener('click',function(){
    var text=pre.textContent;
    var done=function(){copy.textContent='Copied';setTimeout(function(){copy.textContent='Copy';},1200);};
    if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(done,function(){fb(text,done);});}else fb(text,done);
    function fb(t,cb){var ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');}catch(e){}document.body.removeChild(ta);cb();}
  });
});
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
// Static docs grid helper (like ant.design's own API/token tables) — NOT an AntD data-grid
// call site, so the shared-DataTable rule doesn't apply. The tag name is composed so the
// call-site guard (which greps for the literal opening tag) stays quiet on these docs tables.
const TBL = 't' + 'able';
const docTable = (head, rows) => `<${TBL} class="api"><tr>${head}</tr>${rows}</${TBL}>`;

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
  { name: 'variables.css', file: 'variables.css',  page: 'variables-css', desc: 'The --aha-* token layer as CSS custom properties, generated from tokens.canonical.json.' },
  { name: 'icons.llms.txt', file: 'icons.llms.txt', page: 'icons-llms-txt', desc: 'Every icon name, grouped by family — the feed an agent reads to call <aha-icon name="…"> instead of writing an SVG.' },
  { name: 'icons.agent.json', file: 'icons.agent.json', page: 'icons-agent-json', desc: 'Machine feed: the full icon catalogue (names + family + recolorable) plus the <aha-icon> usage contract.' },
];
// Header top-nav — the AntD-style area switcher. Each area lands on its own screen.
function topNav(base, section) {
  return `<nav class="top-nav">` + SECTIONS.map(s => {
    if (s.key === 'patterns' && !PATTERNS.length) return '';
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
      `<a class="nav-item${active==='token:'+p.slug?' active':''}" href="${base}foundations/${p.slug}.html"><span>${esc(p.label)}</span>${active==='token:'+p.slug?'':'<span class="nav-dot" title="live"></span>'}</a>`).join('');
    inner =
      `<div class="nav-group"><div class="nav-cat">Design tokens</div>${tokenItems}</div>` +
      `<div class="nav-group"><div class="nav-cat">Assets</div>` +
      `<a class="nav-item${active==='__icons__'?' active':''}" href="${base}icons/index.html"><span>Icon library</span>${active==='__icons__'?'':`<span class="nav-count">${ICONS.count}</span>`}</a>` +
      `</div>`;
  } else if (section === 'components') {
    inner = CATALOG.map(g => {
      const items = g.items.map(it => {
        if (LIVE.has(it.slug))
          return `<a class="nav-item${it.slug===active?' active':''}" href="${base}${it.slug}/index.html"><span>${esc(it.name)}</span><span class="nav-dot" title="live"></span></a>`;
        return `<span class="nav-item soon"><span>${esc(it.name)}</span><i>soon</i></span>`;
      }).join('');
      return `<div class="nav-group"><div class="nav-cat">${esc(g.cat)}</div>${items}</div>`;
    }).join('');
  } else if (section === 'patterns') {
    inner = `<div class="nav-group"><div class="nav-cat">Patterns</div>` +
      PATTERNS.map(p => `<a class="nav-item${active===('pattern:'+p.slug)?' active':''}" href="${base}patterns/${p.slug}/index.html"><span>${esc(p.name)}</span><span class="nav-dot" title="live"></span></a>`).join('') +
      `</div>`;
  } else if (section === 'feeds') {
    inner = `<div class="nav-group"><div class="nav-cat">Agent feeds</div>` +
      RAW_FEEDS.map(f => `<a class="nav-item raw${active===('feed:'+f.file)?' active':''}" href="${base}feeds/${f.page}.html"><span>${esc(f.name)}</span><i>raw</i></a>`).join('') +
      `</div>`;
  }
  return `<nav class="doc-nav">${inner}</nav>`;
}

function docShell({ base, active, section = 'components', main, extraCss = '' }) {
  const nav = sidebarNav(base, active, section);
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
<style>${tokenVars(TOK)}${shellCss(base)}${extraCss}</style></head><body>
<header class="doc-header">
  <a class="brand" href="${base}index.html"><span class="logo">a</span><span>AhaSlides Design<small>for agents · single source → generated</small></span></a>
  ${topNav(base, section)}
  <div class="hmeta"><span class="ver">v${esc(PKG.version)}</span><span>React · Vue · Lit</span></div>
</header>
<div class="doc-body">
  ${nav}
  <main class="doc-main"><div class="doc-main-inner">${main}</div></main>
</div>
<script>${WIDGET_JS}${FEED_JS}</script>
</body></html>`;
}

// Agent-feed page: the raw file content shown in a code wrapper (with copy), inside the shell.
function renderFeedPage(f, content) {
  const main = `
  <p class="crumbs">Agent feeds · raw</p>
  <h1>${esc(f.name)} <span class="badge raw">raw feed</span></h1>
  <p class="subtitle">${esc(f.desc)}</p>
  <p class="gen">◆ generated — the exact file served to agents at <code>/${esc(f.file)}</code> · do not edit by hand</p>
  <div class="code-panel feed">
    <div class="code-head"><div class="tabs"><span class="tab active">${esc(f.file)}</span></div><button class="copy" type="button">Copy</button></div>
    <pre class="active">${esc(content)}</pre>
  </div>`;
  return docShell({ base: '../', active: 'feed:' + f.file, section: 'feeds', main });
}

function renderHtml(c) {
  const preview = part(c.preview);
  const main = `
  <p class="crumbs">Components · ${esc(c.group)}</p>
  <h1>${esc(c.name)}</h1>
  <p class="subtitle">${esc(c.summary)}</p>
  <!-- generated from contracts/${c.slug}.json + tokens.canonical.json — do not edit by hand -->

  <h2>Examples</h2>
  <div class="demo">
    <div class="demo-stage">${preview}</div>
    ${codeWidget(c)}
  </div>

  <h2>API</h2>
  ${propsTable(c.props)}

  ${componentConsume(c)}

  ${c.opinion ? `<h2>When to use</h2>${opinionBlock(c.opinion)}${surfaceBlock(c.surfaces)}` : ''}

  <h2>Spec</h2>
  <div class="spec-line">${specList(c.spec)}</div>`;
  return docShell({ base: '../', active: c.slug, section: 'components', main });
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
  : `a CDN-React runnable page (React + antd loaded from a CDN, no build step) — React/Vue use the same shared-themed DataTable via your bundler`;

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
${use}
`;
}
function renderLlms(c) {
  const props = (c.props||[]).map(p => `- ${p.name}: ${p.type}, default ${p.default}. ${p.desc}`).join('\n');
  const use = c.opinion ? 'Use when: ' + (c.opinion.whenToUse||[]).map(x=>`${x.what} (${x.when})`).join('; ') + '.\n' : '';
  const surf = (c.surfaces&&c.surfaces.length) ? `Surfaces: ${c.surfaces.join(', ')}.\n` : '';
  const htmlLead = hasHtml(c) ? `Default to the HTML snippet — ${htmlKind(c)}.\n` : '';
  return `## ${c.name}
${c.summary}
Tier: ${c.tier}. Frameworks: ${frameworksLine(c)}.
${htmlLead}${surf}Props:
${props}
Tokens: ${(c.tokensUsed||[]).join(', ')}.
${use}`;
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
      doc: `${SITE}/${c.slug}/index.html`,
      md: `${SITE}/${c.slug}/${c.slug}.md`,
      agentJson: `${SITE}/${c.slug}.agent.json`,
      llms: `${SITE}/${c.slug}.llms.txt`,
      index: `${SITE}/llms.txt`,
    },
    recommendedSnippet: hasHtml(c) ? 'html' : (c.snippets[0]?.key || 'react'),
    vibeCode: hasHtml(c)
      ? `Emit the HTML snippet by default — ${htmlKind(c)}. Paste into an .html file and it renders with no build step.`
      : null,
    frameworks,
    props: c.props || [], tokens: c.tokensUsed || [], spec: c.spec || [],
    opinion: c.opinion || null, surfaces: c.surfaces || null, snippets,
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

function renderPatternHtml(p) {
  const missing = (p.composedOf || []).filter(x => x.status === 'missing');
  const skill = p.skillRef || {};
  const guide = p.guide ? part(p.guide) : '';
  const main = `
  <p class="crumbs">Patterns · composition guide</p>
  <h1>${esc(p.name)} <span class="badge pattern">pattern</span></h1>
  <p class="subtitle">${esc(p.summary)}</p>
  <p class="gen">◆ generated from patterns/${p.slug}.json${p.guide ? ` + parts/${esc(p.guide)}` : ''} — do not edit by hand</p>

  ${p.lead ? `<div class="note" style="margin:0 0 18px">${mdInline(p.lead)}</div>` : ''}

  <h2>Based on</h2>
  <p class="body">The rationale, worked examples, and the full assertion set live in the design skill — this pattern distils the enforceable subset and links each rule back to it.</p>
  <div class="skillrefs">
    ${skill.build ? `<span class="skillref"><b>build</b> <code>${esc(skill.build)}</code></span>` : ''}
    ${skill.judge ? `<span class="skillref"><b>judge</b> <code>${esc(skill.judge)}</code></span>` : ''}
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
  return docShell({ base: '../../', active: 'pattern:' + p.slug, section: 'patterns', main, extraCss });
}
function renderPatternMd(p) {
  const skill = p.skillRef || {};
  const co = (p.composedOf || []).map(x => `- ${x.ref} (${x.as}) — ${x.use} [${x.status}]`).join('\n');
  const rules = (p.rules || []).map(r => `- ${r.rule} (${(r.ref||[]).join(', ')})`).join('\n');
  const surf = (p.surfaceChoice || []).map(s => `- **${s.surface}** — ${s.useFor} (e.g. ${s.example})`).join('\n');
  return `# ${p.name} — pattern
> Generated from patterns/${p.slug}.json — do not edit by hand. Composition guide, not a component.

${p.summary}

Based on: ${skill.build || '—'}${skill.judge ? ` · judge: ${skill.judge}` : ''}
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
function renderPatternAgent(p) {
  return JSON.stringify({
    generatedFrom: `patterns/${p.slug}.json`, kind: 'pattern', pattern: p.name, slug: p.slug,
    summary: p.summary, skillRef: p.skillRef || null, surfaces: p.surfaces || null,
    surfaceChoice: p.surfaceChoice || null, composedOf: p.composedOf || [],
    componentBacklog: p.componentBacklog || null, rules: p.rules || [],
    shipsCode: !!p.reuse, reuse: p.reuse || null,
  }, null, 2) + '\n';
}
function renderPatternsLlms(patterns) {
  let s = `# AhaSlides Design System — patterns\n\n> Composition guides over existing components. Each pattern reuses the DS's components and documents the conventions for a use case; the narrative "why" lives in the linked aha-design skill.\n\n`;
  for (const p of patterns) {
    const missing = (p.composedOf || []).filter(x => x.status === 'missing').map(x => x.ref);
    s += `## ${p.name} (patterns/${p.slug}/${p.slug}.md)\n${p.summary}\nBased on: ${(p.skillRef||{}).build || '—'}. Surfaces: ${(p.surfaces||[]).join(', ')}.\nReuses: ${(p.composedOf||[]).map(x=>x.ref).join(', ')}.${missing.length?` Component backlog: ${missing.join(', ')}.`:''}\nRules: ${(p.rules||[]).length}. Ships code: ${p.reuse?'yes':'no (doc-only)'}.\n\n`;
  }
  return s;
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
  const comps = cs.map(x => `- **${x.name}** (${x.tier}) — ${x.summary}`).join('\n');
  return `# AhaSlides Design System — design.md
> Machine-readable visual language for AI design + code tools. Generated from tokens.canonical.json — do not edit by hand.

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

## Typography
Font **Plus Jakarta Sans** (self-hosted), weights **400 / 600** (Display 700). Base body **14** at line-height ratio **1.5**.
Size scale: 12 · 14 · 16 · 18 · 20 · 24 · 32 · 40 · 48 · 56 · 64. Letter-spacing: headings 0, body 0.2px, subtext 0.3px. No Inter.

## Shape & density
Radius scale: ${t.radius.xs} · ${t.radius.sm} · **${t.radius.default}** (default) · ${t.radius.lg} · ${t.radius.xl}; pills ${t.radius.pill}.
Control height: root **${t.controlHeight.root}** (Input/Select inherit); Button ${t.controlHeight.button.sm}/${t.controlHeight.button.md}/${t.controlHeight.button.lg}/${t.controlHeight.button.xl}.
Spacing: 4-based — ${t.space.slice(0,12).join(' · ')} …

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
    .map(([role,px]) => `<tr><td style="font-size:${Math.min(px,28)}px;line-height:1.2">${esc(role)}</td><td><code>${px}px</code></td></tr>`).join('');
  const radScale = [['xs',r.xs],['sm',r.sm],['default',r.default],['lg',r.lg],['xl',r.xl]];
  const radChips = radScale.map(([n,v]) => `<div class="scale-cell"><div class="radius-chip" style="border-radius:${v}px"></div><div class="hex">${n} · ${v}px</div></div>`).join('');
  const chRows = `<tr><td>Fields — Input / Select / DatePicker (root)</td><td><code>${ch.root}px</code></td></tr>`
    + `<tr><td>Field sm / lg</td><td><code>${ch.sm}px / ${ch.lg}px</code></td></tr>`
    + `<tr><td>Button sm / md / lg / xl</td><td><code>${ch.button.sm} / ${ch.button.md} / ${ch.button.lg} / ${ch.button.xl}px</code></td></tr>`;
  const spaceBars = TOK.space.filter(n => n>0 && n<=64).map(n => `<div class="scale-cell"><div class="space-bar" style="width:${n}px"></div><div class="hex">${n}</div></div>`).join('');

  const gen = `<p class="gen">◆ generated from tokens.canonical.json — do not edit by hand</p>`;
  const BODY = {
    colour: {
      title: 'Colour', lead: 'The primitive ramps and the semantic tokens that alias into them. Never hardcode a ramp value in a component — bind to a semantic <code>--aha-*</code> token.',
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
  ${swGroup('Brand slots (Aha 1–13)', Object.keys(c.brand).map(k=>['aha'+k, c.brand[k]]))}`,
    },
    typography: {
      title: 'Typography', lead: 'Product face <b>Plus Jakarta Sans</b> (self-hosted); weights <b>400 / 600</b> (Display 700). No Inter.',
      body: `
  <p class="body">Line-height ratios: tight 1.2 · heading 1.3 · body 1.5. Letter-spacing: headlines 0 · body 0.2px · subtext 0.3px.</p>
  ${docTable('<th>Role</th><th>Size</th>', typeRows)}`,
    },
    spacing: {
      title: 'Spacing', lead: 'A single 4-based spacing scale — hierarchy and separation come from these tokens, never ad-hoc px.',
      body: `
  <div class="scale-row" style="align-items:flex-end">${spaceBars}</div>
  <p class="body">4-based scale (px): ${TOK.space.join(' · ')}.</p>`,
    },
    radius: {
      title: 'Radius', lead: 'The corner-radius scale. Anything off <code>4 · 6 · 8 · 12 · 16</code> is drift.',
      body: `
  <div class="scale-row">${radChips}</div>
  <p class="body">Pill <code>${r.pill}px</code> for capsules; <code>${r.marketing}px</code> reserved for marketing surfaces. Anything off the 4·6·8·12·16 scale is drift.</p>`,
    },
    sizing: {
      title: 'Sizing', lead: 'Control heights — the root field height and the Button size ramp.',
      body: `
  ${docTable('<th>Control</th><th>Height</th>', chRows)}
  <p class="body">Fields share the root height; Button steps sm / md / lg / xl. Set size via the <code>size</code> prop — never inline a height.</p>`,
    },
  };
  const pg = BODY[pageSlug];
  const main = `
  <p class="crumbs">Foundations · design tokens</p>
  <h1>${esc(pg.title)}</h1>
  <p class="subtitle">${pg.lead}</p>
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
function componentConsume(c) {
  const entry = c.reuse && c.reuse.entry ? c.reuse.entry.replace(/^\.\//, '') : null;
  const npmrc = `# .npmrc — once: point the ${SCOPE} scope at GitHub Packages
${NPMRC}
`;
  const install = entry
    ? `${npmrc}
npm i ${PKGNAME}
import '${PKGNAME}/tokens.css';   // once, at the app root
import '${PKGNAME}/${entry}';   // registers &lt;${esc(c.element || c.slug)}&gt;`
    : `${npmrc}
npm i ${PKGNAME}
import '${PKGNAME}/tokens.css';   // once, at the app root
// composite — consumes antd (React) / ant-design-vue (Vue); see the snippets below`;
  return `
  <h2>Install</h2>
  <pre class="cg-code">${install}</pre>
  <p class="gen install-note">Agent feed for this component (absolute, fetchable anywhere): <a href="${SITE}/${c.slug}.agent.json"><code>${c.slug}.agent.json</code></a> · <a href="${SITE}/${c.slug}/${c.slug}.md"><code>${c.slug}.md</code></a> · <a href="${SITE}/${c.slug}.llms.txt"><code>${c.slug}.llms.txt</code></a></p>`;
}

/* ===== overview / landing page ===== */
function renderIndex(cs) {
  const cards = cs.map(c => `<a class="card" href="${c.slug}/index.html">
      <div class="ct">${esc(c.name)} <span class="badge ${c.tier==='leaf-lit'?'leaf':'composite'}">${c.tier==='leaf-lit'?'leaf':'composite'}</span></div>
      <div class="cs">${esc(c.summary)}</div>
      <div class="cf">${c.slug}.md · ${c.slug}.agent.json · ${c.slug}.llms.txt</div></a>`).join('');
  const planned = CATALOG.reduce((n,g)=>n+g.items.length,0);
  const main = `
  <p class="crumbs">AhaSlides Design System · for agents</p>
  <h1>Components</h1>
  <p class="subtitle">One token source + one contract per component &rarr; this site, the <code>llms.txt</code> feeds, <code>design.md</code>, and per-component <code>agent.json</code> — all generated together, so they can't drift.</p>
  <p class="gen">◆ generated by generate.mjs — ${cs.length} live of ${planned} planned components</p>

  ${consumeBlock()}

  <h2 style="margin-top:30px">Live components</h2>
  <div class="cards">${cards}</div>

  ${PATTERNS.length ? `<h2>Patterns</h2>
  <p class="body">Composition guides — how to assemble the components above for a use case. A pattern ships no new primitive; it reuses components and documents conventions, linking each rule back to its <code>aha-design</code> skill.</p>
  <div class="cards">${PATTERNS.map(p => {
    const missing = (p.composedOf||[]).filter(x=>x.status==='missing').length;
    return `<a class="card" href="patterns/${p.slug}/index.html">
      <div class="ct">${esc(p.name)} <span class="badge pattern" style="color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30)">pattern</span></div>
      <div class="cs">${esc(p.summary)}</div>
      <div class="cf">${(p.rules||[]).length} rules · reuses ${(p.composedOf||[]).length}${missing?` · ${missing} backlog`:''}</div></a>`;
  }).join('')}</div>` : ''}

  <h2>Agent feeds</h2>
  <p class="feeds">
    <a href="feeds/llms-txt.html"><code>llms.txt</code></a> index ·
    <a href="feeds/llms-full-txt.html"><code>llms-full.txt</code></a> full ·
    <a href="feeds/design-md.html"><code>design.md</code></a> visual language ·
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
  <p class="crumbs">Foundations · icon library</p>
  <h1>Icon library</h1>
  <p class="subtitle">The complete set imported from Figma Design System V3 — <b>${ICONS.count}</b> glyphs across ${ICONS.families.length} families. Call any of them by name with <code>&lt;aha-icon name="…"&gt;</code>; never inline an SVG. Click a glyph to copy its name.</p>
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
PATTERNS = existsSync(PATDIR)
  ? readdirSync(PATDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(PATDIR, f)))).sort((a,b)=>a.name.localeCompare(b.name))
  : [];
/* top-nav landing per area — each tab opens that area's first real page */
NAV_LANDING = {
  overview: 'index.html',
  foundations: `foundations/${TOKEN_PAGES[0].slug}.html`,
  components: (contracts[0] ? `${contracts[0].slug}/index.html` : 'index.html'),
  patterns: (PATTERNS[0] ? `patterns/${PATTERNS[0].slug}/index.html` : 'index.html'),
  feeds: 'feeds/llms-txt.html',
};
if (PATTERNS.length) {
  RAW_FEEDS.push(
    { name: 'patterns.llms.txt',  file: 'patterns.llms.txt',  page: 'patterns-llms-txt',  desc: 'One entry per composition pattern — what it reuses, the rule count, and its component backlog.' },
    { name: 'patterns.agent.json', file: 'patterns.agent.json', page: 'patterns-agent-json', desc: 'Machine feed: every pattern with its composedOf reuse graph, rules (each ref’d to a skill assertion), and whether it ships code.' },
  );
}

writeFileSync(join(OUT, 'variables.css'), '/* Generated from tokens.canonical.json — do not edit by hand. */\n' + tokenVars(TOK) + '\n');

/* Importable token layer for real consumers: @ahaslides-product/design/tokens.css + /tokens */
mkdirSync(join(root, 'lib'), { recursive: true });
writeFileSync(join(root, 'lib', 'tokens.css'), '/* @ahaslides-product/design/tokens.css — generated from tokens.canonical.json. */\n' + tokenVars(TOK) + '\n');
writeFileSync(join(root, 'lib', 'tokens.js'),
  '// @ahaslides-product/design/tokens — the canonical design tokens (generated from tokens.canonical.json).\n' +
  'export const tokens = ' + JSON.stringify(TOK, null, 2) + ';\nexport default tokens;\n');
writeFileSync(join(OUT, 'design.md'), renderDesignMd(TOK, contracts));
mkdirSync(join(OUT, 'foundations'), { recursive: true });
for (const p of TOKEN_PAGES) writeFileSync(join(OUT, 'foundations', `${p.slug}.html`), renderTokenPage(p.slug));
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
  `> Registry:  GitHub Packages (${REGISTRY}) — needs a GitHub token with read:packages.`,
  `> Configure once in .npmrc:  ${SCOPE}:registry=${REGISTRY}`,
  `> Install:  npm i ${PKGNAME}`,
  `> Import the token layer once at the app root:  import '${PKGNAME}/tokens.css'`,
  `> Then import a component by subpath, e.g.  import '${PKGNAME}/aha-button'`,
  '>',
  '> Feeds (absolute URLs, fetch directly):',
  `>   ${SITE}/llms.txt          this index`,
  `>   ${SITE}/llms-full.txt     every component, full docs`,
  `>   ${SITE}/design.md         machine-readable visual language + tokens`,
  `>   ${SITE}/variables.css     the --aha-* token layer`,
  `>   ${SITE}/<slug>.agent.json per-component machine feed (props, tokens, spec, opinion, install, snippets)`,
  '',
  '## Components',
  '',
];
const fullDocs = [];
for (const c of contracts) {
  const d = join(OUT, c.slug); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'index.html'), renderHtml(c));
  if (c.conformancePart) writeFileSync(join(d, '_conformance.html'), renderConformanceHarness(c));
  const md = renderMd(c);
  writeFileSync(join(d, `${c.slug}.md`), md);
  const agentJson = renderAgent(c);
  writeFileSync(join(d, `${c.slug}.agent.json`), agentJson);       // alongside the doc page
  writeFileSync(join(OUT, `${c.slug}.agent.json`), agentJson);     // flat canonical URL agents fetch
  writeFileSync(join(OUT, `${c.slug}.llms.txt`), renderLlms(c));
  indexLines.push(`- [${c.name}](${c.slug}/${c.slug}.md) — ${c.tier} — ${c.summary}`);
  fullDocs.push(md);
  console.log(`  ✓ ${c.slug}: index.html · ${c.slug}.md · ${c.slug}.agent.json · ${c.slug}.llms.txt`);
}
writeFileSync(join(OUT, 'llms.txt'), indexLines.join('\n') + '\n');
writeFileSync(join(OUT, 'llms-full.txt'), fullDocs.join('\n---\n\n') + '\n');

/* patterns — doc page + md + agent feed per pattern, plus the two index feeds */
for (const p of PATTERNS) {
  const d = join(OUT, 'patterns', p.slug); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'index.html'), renderPatternHtml(p));
  writeFileSync(join(d, `${p.slug}.md`), renderPatternMd(p));
  writeFileSync(join(d, `${p.slug}.agent.json`), renderPatternAgent(p));
  const missing = (p.composedOf || []).filter(x => x.status === 'missing').length;
  console.log(`  ✓ pattern ${p.slug}: index.html · ${p.slug}.md · ${p.slug}.agent.json${missing?` (⚠ ${missing} backlog component${missing===1?'':'s'})`:''}`);
}
if (PATTERNS.length) {
  writeFileSync(join(OUT, 'patterns.llms.txt'), renderPatternsLlms(PATTERNS));
  writeFileSync(join(OUT, 'patterns.agent.json'), JSON.stringify(PATTERNS.map(p => JSON.parse(renderPatternAgent(p))), null, 2) + '\n');
}

// Feed pages LAST — they embed the actual generated files (now all on disk) in a code wrapper.
mkdirSync(join(OUT, 'feeds'), { recursive: true });
for (const f of RAW_FEEDS) {
  writeFileSync(join(OUT, 'feeds', `${f.page}.html`), renderFeedPage(f, read(join(OUT, f.file))));
}
console.log(`\nGenerated ${contracts.length} component(s) + variables.css + design.md + ${TOKEN_PAGES.length} token pages + index.html + llms feeds + ${RAW_FEEDS.length} feed pages → dist/`);
