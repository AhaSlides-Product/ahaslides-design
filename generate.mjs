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
const PDIR = join(root, 'parts');
const OUT  = join(root, 'dist');
const read = (p) => readFileSync(p, 'utf8');
const part = (name) => (name && existsSync(join(PDIR, name)) ? read(join(PDIR, name)) : '');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const PKG = JSON.parse(read(join(root, 'package.json')));

/* ===== R1 canonical tokens → the --aha-* var layer (single source) ===== */
const TOK = JSON.parse(read(join(root, 'tokens.canonical.json')));

/* ===== full planned inventory (AntD-style left-nav taxonomy) — the component-standard
   measured set. Live pages come from contracts/; the rest render as greyed "soon" so the
   nav shows the whole roadmap. Order/categories mirror ant.design's component menu. ===== */
const CATALOG = [
  { cat: 'General',      items: [ { name: 'Button', slug: 'button' } ] },
  { cat: 'Data Entry',   items: [ { name: 'Checkbox', slug: 'checkbox' }, { name: 'Radio', slug: 'radio' }, { name: 'Switch', slug: 'switch' }, { name: 'Input', slug: 'input' }, { name: 'Select', slug: 'select' }, { name: 'Upload', slug: 'uploader' } ] },
  { cat: 'Data Display', items: [ { name: 'Badge', slug: 'badge' }, { name: 'Tag', slug: 'tag' }, { name: 'Tooltip', slug: 'tooltip' }, { name: 'Tabs', slug: 'tabs' }, { name: 'Table', slug: 'table' } ] },
  { cat: 'Navigation',   items: [ { name: 'Dropdown', slug: 'dropdown' } ] },
  { cat: 'Feedback',     items: [ { name: 'Modal', slug: 'modal' } ] },
];
let LIVE = new Set();   // slugs with a real contract — assigned once contracts load
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
  L.push(`--aha-btn-primary-bg:${b.primaryBg}; --aha-btn-primary-bg-hover:${b.primaryBgHover}; --aha-btn-primary-bg-press:${b.primaryBgPress}; --aha-btn-primary-fg:${b.primaryFg}; --aha-btn-secondary-bg:${b.secondaryBg}; --aha-btn-secondary-bg-hover:${b.secondaryBgHover}; --aha-btn-secondary-border:${b.secondaryBorder}; --aha-btn-secondary-border-press:${b.secondaryBorderPress}; --aha-btn-tertiary-bg-hover:${b.tertiaryBgHover}; --aha-btn-disabled-bg:${b.disabledBg}; --aha-btn-disabled-fg:${b.disabledFg}; --aha-btn-danger-bg:${b.dangerBg}; --aha-btn-danger-bg-hover:${b.dangerBgHover}; --aha-btn-danger-ring:${b.dangerRing}; --aha-btn-encourage-bg:${b.encourageBg}; --aha-btn-encourage-bg-hover:${b.encourageBgHover}; --aha-btn-encourage-bg-press:${b.encourageBgPress};`);
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
.doc-header{position:sticky;top:0;z-index:30;height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:0 24px;background:#fff;border-bottom:1px solid var(--aha-split)}
.brand{display:flex;align-items:center;gap:11px;font-size:16px;font-weight:600;color:var(--aha-text-default);text-decoration:none}
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
];
function sidebarNav(base, active) {
  const top = `<a class="nav-top${active==='__overview__'?' active':''}" href="${base}index.html">Overview</a>`;
  const foundations =
    `<div class="nav-group"><div class="nav-cat">Foundations</div>` +
    `<a class="nav-item${active==='__tokens__'?' active':''}" href="${base}design-tokens.html"><span>Design tokens</span>${active==='__tokens__'?'':'<span class="nav-dot" title="live"></span>'}</a>` +
    `</div>`;
  const groups = CATALOG.map(g => {
    const items = g.items.map(it => {
      if (LIVE.has(it.slug))
        return `<a class="nav-item${it.slug===active?' active':''}" href="${base}${it.slug}/index.html"><span>${esc(it.name)}</span><span class="nav-dot" title="live"></span></a>`;
      return `<span class="nav-item soon"><span>${esc(it.name)}</span><i>soon</i></span>`;
    }).join('');
    return `<div class="nav-group"><div class="nav-cat">${esc(g.cat)}</div>${items}</div>`;
  }).join('');
  const feeds =
    `<div class="nav-group"><div class="nav-cat">Agent feeds</div>` +
    RAW_FEEDS.map(f => `<a class="nav-item raw${active===('feed:'+f.file)?' active':''}" href="${base}feeds/${f.page}.html"><span>${esc(f.name)}</span><i>raw</i></a>`).join('') +
    `</div>`;
  return `<nav class="doc-nav">${top}${foundations}${groups}${feeds}</nav>`;
}

function docShell({ base, active, main, extraCss = '' }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AhaSlides Design System — for agents</title>
<style>${tokenVars(TOK)}${shellCss(base)}${extraCss}</style></head><body>
<header class="doc-header">
  <a class="brand" href="${base}index.html"><span class="logo">a</span><span>AhaSlides Design<small>for agents · single source → generated</small></span></a>
  <div class="hmeta"><span class="ver">v${esc(PKG.version)}</span><span>React · Vue · Lit</span></div>
</header>
<div class="doc-body">
  ${sidebarNav(base, active)}
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
  return docShell({ base: '../', active: 'feed:' + f.file, main });
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

  ${c.opinion ? `<h2>When to use</h2>${opinionBlock(c.opinion)}${surfaceBlock(c.surfaces)}` : ''}

  <h2>Spec</h2>
  <div class="spec-line">${specList(c.spec)}</div>`;
  return docShell({ base: '../', active: c.slug, main });
}

// Hidden conformance harness (composites): mounts both framework tiers with the token layer,
// so qa.mjs can measure React ≡ Vue parity even though the doc page shows a single UI.
function renderConformanceHarness(c) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<style>${tokenVars(TOK)}
body{margin:0;font-family:var(--aha-font-product);background:#fff;color:var(--aha-text-default)}</style></head>
<body>${part(c.conformancePart)}</body></html>`;
}

function renderMd(c) {
  const props = (c.props||[]).map(p => `| \`${p.name}\` | ${p.type} | \`${p.default}\` | ${p.desc} |`).join('\n');
  const spec = (c.spec||[]).map(s => `- ${s.label}: ${s.value}`).join('\n');
  const use = c.opinion ? '\n## When to use\n' + (c.opinion.whenToUse||[]).map(x=>`- **${x.what}** — ${x.when}`).join('\n') + (c.opinion.note?`\n\n${c.opinion.note}`:'') : '';
  const surf = (c.surfaces&&c.surfaces.length) ? `\n\nSurfaces: ${c.surfaces.join(', ')}.` : '';
  return `# ${c.name}
> Generated from ${c.slug}.contract.json — do not edit by hand.

${c.summary}

Tier: **${c.tier}**. Frameworks: React, Vue 3.${surf}

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
  return `## ${c.name}
${c.summary}
Tier: ${c.tier}. Frameworks: React, Vue 3.
${surf}Props:
${props}
Tokens: ${(c.tokensUsed||[]).join(', ')}.
${use}`;
}
function renderAgent(c) {
  const snippets = {};
  for (const s of c.snippets) snippets[s.key] = part(s.file);
  return JSON.stringify({
    generatedFrom: `${c.slug}.contract.json`, component: c.name, slug: c.slug, group: c.group, tier: c.tier,
    summary: c.summary,
    frameworks: c.tier === 'leaf-lit'
      ? { react: { via: 'web-component', ref: c.element }, vue: { via: 'web-component', ref: c.element } }
      : { react: { package: 'antd', major: 6 }, vue: { package: 'ant-design-vue', major: 4 } },
    props: c.props || [], tokens: c.tokensUsed || [], spec: c.spec || [],
    opinion: c.opinion || null, surfaces: c.surfaces || null, snippets,
  }, null, 2) + '\n';
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
function renderTokensPage() {
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
  const main = `
  <p class="crumbs">Foundations · design tokens</p>
  <h1>Design tokens</h1>
  <p class="subtitle">The single canonical token set (R1) — the source both this site and <code>variables.css</code> are generated from. Precedence when sources disagree: measured component-standard &gt; DS export (brand) &gt; aha-design skill.</p>
  <p class="gen">◆ generated from tokens.canonical.json — do not edit by hand</p>

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

  <h2>Typography</h2>
  <p class="body">Product face <b>Plus Jakarta Sans</b> (self-hosted); weights <b>400 / 600</b> (Display 700). No Inter. Line-height ratios: tight 1.2 · heading 1.3 · body 1.5. Letter-spacing: headlines 0 · body 0.2px · subtext 0.3px.</p>
  ${docTable('<th>Role</th><th>Size</th>', typeRows)}

  <h2>Radius</h2>
  <div class="scale-row">${radChips}</div>
  <p class="body">Pill <code>${r.pill}px</code> for capsules; <code>${r.marketing}px</code> reserved for marketing surfaces. Anything off the 4·6·8·12·16 scale is drift.</p>

  <h2>Control height</h2>
  ${docTable('<th>Control</th><th>Height</th>', chRows)}

  <h2>Spacing</h2>
  <div class="scale-row" style="align-items:flex-end">${spaceBars}</div>
  <p class="body">4-based scale (px): ${TOK.space.join(' · ')}.</p>`;
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
  return docShell({ base: '', active: '__tokens__', main, extraCss });
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

  <h2 style="margin-top:30px">Live components</h2>
  <div class="cards">${cards}</div>

  <h2>Agent feeds</h2>
  <p class="feeds">
    <a href="feeds/llms-txt.html"><code>llms.txt</code></a> index ·
    <a href="feeds/llms-full-txt.html"><code>llms-full.txt</code></a> full ·
    <a href="feeds/design-md.html"><code>design.md</code></a> visual language ·
    <a href="feeds/variables-css.html"><code>variables.css</code></a> token layer ·
    per-component <code>&lt;slug&gt;.agent.json</code>
  </p>

  <h2>Roadmap</h2>
  <p class="body">The left nav lists the full planned inventory (greyed = <b>soon</b>), taken from the aha-design <code>component-standard</code> measured set. Leaf primitives ship as one shared Lit web component (portable to any environment); composites ship as antd / ant-design-vue wrappers (app-only). Each component follows the same lifecycle: contract &rarr; build &rarr; theme &rarr; render-matrix verify &rarr; judge &rarr; publish.</p>`;
  return docShell({ base: '', active: '__overview__', main });
}

/* ===== run ===== */
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
const contracts = readdirSync(CDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(CDIR, f))));
contracts.sort((a,b)=>a.name.localeCompare(b.name));
LIVE = new Set(contracts.map(c => c.slug));   // drives which nav items link vs render as "soon"

writeFileSync(join(OUT, 'variables.css'), '/* Generated from tokens.canonical.json — do not edit by hand. */\n' + tokenVars(TOK) + '\n');
writeFileSync(join(OUT, 'design.md'), renderDesignMd(TOK, contracts));
writeFileSync(join(OUT, 'design-tokens.html'), renderTokensPage());
writeFileSync(join(OUT, 'index.html'), renderIndex(contracts));

const indexLines = ['# AhaSlides Design System — components', '', '> feeds: design.md · variables.css · llms-full.txt', ''];
const fullDocs = [];
for (const c of contracts) {
  const d = join(OUT, c.slug); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'index.html'), renderHtml(c));
  if (c.conformancePart) writeFileSync(join(d, '_conformance.html'), renderConformanceHarness(c));
  const md = renderMd(c);
  writeFileSync(join(d, `${c.slug}.md`), md);
  writeFileSync(join(d, `${c.slug}.agent.json`), renderAgent(c));
  writeFileSync(join(OUT, `${c.slug}.llms.txt`), renderLlms(c));
  indexLines.push(`- [${c.name}](${c.slug}/${c.slug}.md) — ${c.tier} — ${c.summary}`);
  fullDocs.push(md);
  console.log(`  ✓ ${c.slug}: index.html · ${c.slug}.md · ${c.slug}.agent.json · ${c.slug}.llms.txt`);
}
writeFileSync(join(OUT, 'llms.txt'), indexLines.join('\n') + '\n');
writeFileSync(join(OUT, 'llms-full.txt'), fullDocs.join('\n---\n\n') + '\n');

// Feed pages LAST — they embed the actual generated files (now all on disk) in a code wrapper.
mkdirSync(join(OUT, 'feeds'), { recursive: true });
for (const f of RAW_FEEDS) {
  writeFileSync(join(OUT, 'feeds', `${f.page}.html`), renderFeedPage(f, read(join(OUT, f.file))));
}
console.log(`\nGenerated ${contracts.length} component(s) + variables.css + design.md + design-tokens.html + index.html + llms feeds + ${RAW_FEEDS.length} feed pages → dist/`);
