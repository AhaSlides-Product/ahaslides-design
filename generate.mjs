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

/* ===== R1 canonical tokens → the --aha-* var layer (single source) ===== */
const TOK = JSON.parse(read(join(root, 'tokens.canonical.json')));
function tokenVars(t) {
  const c = t.color, f = t.font, r = t.radius;
  return `:root{
  --aha-color-primary:${c.primary}; --aha-color-primary-hover:${c.primaryHover}; --aha-color-primary-active:${c.primaryActive};
  --aha-color-success:${c.success}; --aha-color-warning:${c.warning}; --aha-color-error:${c.error}; --aha-color-info:${c.info};
  --aha-text-default:${c.textDefault}; --aha-text-secondary:${c.textSecondary}; --aha-text-tertiary:${c.textTertiary}; --aha-text-disabled:${c.textDisabled};
  --aha-border:${c.border}; --aha-border-secondary:${c.borderSecondary}; --aha-border-strong:${c.borderStrong}; --aha-border-disabled:${c.borderDisabled}; --aha-split:${c.borderSecondary};
  --aha-checkbox-border:${c.checkboxBorder};
  --aha-bg-container:${c.bgContainer}; --aha-bg-container-disabled:${c.bgContainerDisabled}; --aha-bg-layout:${c.bgLayout}; --aha-bg-accent:${c.bgAccent}; --aha-bg-informative:${c.bgInformative}; --aha-bg-overlay:${c.bgOverlay}; --aha-bg-dark:${c.bgDark};
  --aha-purple-10:${c.bgAccent}; --aha-purple-30:${c.focus};
  --aha-gray-20:${c.bgLayout}; --aha-gray-30:${c.borderSecondary};
  --aha-font-product:${f.product}; --aha-font-display:${f.display}; --aha-font-mono:${f.mono};
  --aha-radius-xs:${r.xs}px; --aha-radius-sm:${r.sm}px; --aha-radius-default:${r.default}px; --aha-radius-lg:${r.lg}px; --aha-radius-xl:${r.xl}px; --aha-radius-pill:${r.pill}px;
}`;
}

/* ===== structural shell styles (token values come from tokenVars, not here) ===== */
const SHELL_CSS = `
/* Plus Jakarta Sans — AhaSlides DS V3 product face (aha-design-typography), self-hosted per
   aha-design-antd; weights 400/600; system-ui final fallback. DS-mandated — do not substitute. */
@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:400;font-display:swap;
  src:local("Plus Jakarta Sans"),url("../fonts/PlusJakartaSans-Regular.woff2") format("woff2")}
@font-face{font-family:"Plus Jakarta Sans";font-style:normal;font-weight:600;font-display:swap;
  src:local("Plus Jakarta Sans"),url("../fonts/PlusJakartaSans-SemiBold.woff2") format("woff2")}
*{box-sizing:border-box}
body{margin:0;background:var(--aha-gray-20);color:var(--aha-text-default);font-family:var(--aha-font-product);font-size:14px;line-height:22px;-webkit-font-smoothing:antialiased}
.wrap{max-width:1160px;margin:0 auto;padding:32px 24px 90px}
.crumbs{font-size:12px;letter-spacing:.3px;text-transform:uppercase;color:var(--aha-text-tertiary);margin:0 0 6px}
h1{font-size:32px;line-height:40px;font-weight:600;margin:0 0 6px}
.badge{display:inline-block;font-size:11px;letter-spacing:.3px;text-transform:uppercase;font-weight:600;border-radius:6px;padding:2px 8px;margin-left:6px}
.badge.leaf{color:#0E7C63;background:#D3F5EC;border:1px solid #16C49A}
.badge.composite{color:#B24A20;background:#FFF0EB;border:1px solid #FF7747}
.lead{color:var(--aha-text-secondary);margin:0 0 26px;font-size:16px;line-height:24px;max-width:80ch}
.gen{font-size:11px;color:var(--aha-text-tertiary);margin:0 0 24px;font-family:Menlo,monospace}
section{background:#fff;border:1px solid var(--aha-split);border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.05);margin:0 0 20px;overflow:hidden}
section>h2{margin:0;padding:14px 20px;font-size:12px;letter-spacing:.4px;text-transform:uppercase;color:var(--aha-text-secondary);border-bottom:1px solid var(--aha-split);background:var(--aha-gray-20)}
.pad{padding:22px 20px}
.tier{font-size:11px;letter-spacing:.3px;text-transform:uppercase;font-weight:600;color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:6px;padding:2px 8px;display:inline-block;margin-bottom:16px}
.lbl{font-size:11px;letter-spacing:.3px;text-transform:uppercase;color:var(--aha-text-tertiary);margin:0 0 8px}
.row{display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
.stack{display:flex;flex-direction:column;gap:8px}
.grid2{display:grid;grid-template-columns:1fr 1fr}
.grid2>div{padding:22px 20px}.grid2>div:first-child{border-right:1px solid var(--aha-split)}
.note{background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:8px;padding:12px 14px;font-size:13px;line-height:1.6;color:var(--aha-text-secondary)}
code{font-family:Menlo,monospace;font-size:12px;background:var(--aha-gray-20);padding:1px 6px;border-radius:4px;color:#5715A0}
table{width:100%;border-collapse:collapse;font-size:13px}
td,th{text-align:left;padding:9px 12px;border-bottom:1px solid var(--aha-split);vertical-align:top}
th{color:var(--aha-text-tertiary);font-weight:600;font-size:11px;letter-spacing:.3px;text-transform:uppercase}
ul{margin:0;padding-left:18px}li{margin:4px 0}
.pill{display:inline-block;padding:1px 8px;border-radius:999px;font-size:12px;font-weight:600;background:#D3F5EC;color:#0E7C63;margin:2px 0}
.pill.na{background:var(--aha-gray-20);color:var(--aha-text-tertiary)}
.show-code{font-family:var(--aha-font-product);font-size:13px;font-weight:600;color:#5715A0;background:var(--aha-purple-10);border:1px solid var(--aha-purple-30);border-radius:8px;padding:8px 14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.show-code:hover{background:#F0E7FF}.show-code .chev{transition:transform .15s ease}
.code-tabs[data-open="true"] .show-code .chev{transform:rotate(90deg)}
.code-panel{margin-top:12px;background:#1A1A2E;border-radius:12px;overflow:hidden}
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

function codeWidget(c) {
  const tabs = c.snippets.map((s, i) =>
    `<button class="tab ${i===0?'active':''}" type="button" data-f="${s.key}">${esc(s.label)}</button>`).join('');
  const panes = c.snippets.map((s, i) =>
    `<pre class="code ${s.key} ${i===0?'active':''}">${esc(part(s.file))}</pre>`).join('\n');
  return `<div class="code-tabs" data-open="false">
    <button class="show-code" type="button"><span class="chev">▸</span> Show code</button>
    <div class="code-panel" hidden>
      <div class="code-head"><div class="tabs">${tabs}</div><button class="copy" type="button">Copy</button></div>
      ${panes}
    </div></div>`;
}
function propsTable(props) {
  if (!props || !props.length) return '';
  const rows = props.map(p => `<tr><td><code>${esc(p.name)}</code></td><td>${esc(p.type)}</td><td><code>${esc(p.default)}</code></td><td>${esc(p.desc)}</td></tr>`).join('');
  return `<table><tr><th>Prop</th><th>Type</th><th>Default</th><th>Notes</th></tr>${rows}</table>`;
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

function renderHtml(c) {
  const preview = part(c.preview);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AhaSlides DS · ${esc(c.name)}</title>
<style>${tokenVars(TOK)}${SHELL_CSS}</style></head><body>
<div class="wrap">
  <p class="crumbs">${esc(c.group)} · ${c.tier==='leaf-lit'?'leaf primitive':'composite'} · ${c.tier==='leaf-lit'?'hybrid 2a':'hybrid 2b'}</p>
  <h1>${esc(c.name)} <span class="badge ${c.tier==='leaf-lit'?'leaf':'composite'}">${esc(c.badge)}</span></h1>
  <p class="lead">${esc(c.lead)}</p>
  <p class="gen">◆ generated from contracts/${c.slug}.json + tokens.canonical.json — do not edit by hand · run: node generate.mjs</p>

  <section><h2>Live — ${c.tier==='leaf-lit'?'the same &lt;'+esc(c.element)+'&gt; consumed by both frameworks':'DS V3 DataTable · React (antd v6) vs Vue (ant-design-vue v4)'}</h2>
    ${preview}
  </section>

  <section><h2>Code</h2><div class="pad">${codeWidget(c)}
    <div class="note" style="margin-top:14px">${esc(c.codeNote||'')}</div></div></section>

  <section><h2>API</h2><div class="pad">${propsTable(c.props)}</div></section>

  ${c.opinion ? `<section><h2>aha-design — when to use</h2><div class="pad">${opinionBlock(c.opinion)}${surfaceBlock(c.surfaces)}</div></section>` : ''}

  <section><h2>aha-design — component-standard self-check</h2><div class="pad">
    <div style="margin-bottom:10px">${specList(c.spec)}</div>${selfCheck(c.selfCheck)}</div></section>
</div>
<script>${WIDGET_JS}</script>
</body></html>`;
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
  const c = t.color;
  const colorRows = [['primary',c.primary],['success',c.success],['warning',c.warning],['error',c.error],['info',c.info],['text',c.textDefault],['textSecondary',c.textSecondary],['border',c.border],['bgLayout',c.bgLayout],['bgAccent',c.bgAccent]]
    .map(([k,v]) => `| \`${k}\` | \`${v}\` |`).join('\n');
  const comps = cs.map(x => `- **${x.name}** (${x.tier}) — ${x.summary}`).join('\n');
  return `# AhaSlides Design System — design.md
> Machine-readable visual language for AI design + code tools. Generated from tokens.canonical.json — do not edit by hand.

## Brand
Primary is violet purple \`${c.primary}\` on near-white neutrals; ink is warm gray \`${c.textDefault}\`.
Backgrounds are **white by default**; no gradients on fills (AI-affordance border-only exception).
Success \`${c.success}\` · warning \`${c.warning}\` · error \`${c.error}\` · info \`${c.info}\`.

## Colour tokens
| Token | Value |
| --- | --- |
${colorRows}

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

/* ===== index page ===== */
function renderIndex(cs) {
  const cards = cs.map(c => `<a class="card" href="${c.slug}/index.html">
      <div class="ct">${esc(c.name)} <span class="badge ${c.tier==='leaf-lit'?'leaf':'composite'}">${esc(c.tier)}</span></div>
      <div class="cs">${esc(c.summary)}</div>
      <div class="cf">${c.slug}.md · ${c.slug}.agent.json</div></a>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>AhaSlides Design System — for agents</title>
<style>${tokenVars(TOK)}${SHELL_CSS}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.card{display:block;padding:18px;border:1px solid var(--aha-split);border-radius:12px;text-decoration:none;color:inherit;background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.card:hover{box-shadow:0 4px 8px rgba(0,0,0,.06)}
.ct{font-size:16px;font-weight:600;margin-bottom:4px}.cs{color:var(--aha-text-secondary);font-size:14px}
.cf{margin-top:8px;font-family:Menlo,monospace;font-size:11px;color:var(--aha-text-tertiary)}
.feeds{margin:0 0 24px;font-size:13px}.feeds code{margin-right:4px}
</style></head><body><div class="wrap">
  <p class="crumbs">AhaSlides Design System · for agents</p>
  <h1>Components</h1>
  <p class="lead">Generated from contracts + tokens.canonical.json. Each page has a verified live preview and copyable React/Vue code.</p>
  <p class="feeds">Agent feeds: <code>llms.txt</code> · <code>llms-full.txt</code> · <code>design.md</code> · <code>variables.css</code> · per-component <code>&lt;name&gt;.agent.json</code></p>
  <div class="cards">${cards}</div>
</div></body></html>`;
}

/* ===== run ===== */
if (existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
const contracts = readdirSync(CDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(CDIR, f))));
contracts.sort((a,b)=>a.name.localeCompare(b.name));

writeFileSync(join(OUT, 'variables.css'), '/* Generated from tokens.canonical.json — do not edit by hand. */\n' + tokenVars(TOK) + '\n');
writeFileSync(join(OUT, 'design.md'), renderDesignMd(TOK, contracts));
writeFileSync(join(OUT, 'index.html'), renderIndex(contracts));

const indexLines = ['# AhaSlides Design System — components', '', '> feeds: design.md · variables.css · llms-full.txt', ''];
const fullDocs = [];
for (const c of contracts) {
  const d = join(OUT, c.slug); mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'index.html'), renderHtml(c));
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
console.log(`\nGenerated ${contracts.length} component(s) + variables.css + design.md + index.html + llms feeds → dist/`);
