#!/usr/bin/env node
/**
 * scaffold.mjs — `npm run new:component <slug>`.
 *
 * Onboarding used to be "copy Checkbox by hand": author the contract + lib module + four parts +
 * wire package.json exports, all manually — the exact place a new contributor's quality diverges
 * from the house bar. This emits a COMPLETE, on-standard LEAF that passes BOTH gates out of the
 * box (token-bound colour, on-scale radius, a real conformance block, real snippets, real export
 * wiring). Run it, run `npm run check` (green), then edit the known-good baseline into the thing
 * you actually need — you start from passing, not from a blank file.
 *
 *   npm run new:component toggle-switch
 *
 * Leaf only — composites (a shared antd theme like Table) are rare and bespoke; copy `table` by
 * hand and follow CONTRIBUTING.md §3–4.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const slug = (process.argv[2] || '').trim();

if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(slug)) {
  console.error(`\n✗ Usage: npm run new:component <slug>\n  <slug> must be kebab-case, e.g. "toggle-switch", "segmented".\n`);
  process.exit(1);
}

const el = `aha-${slug}`;                                              // custom-element tag
const Cls = 'Aha' + slug.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());  // PascalCase class
const Name = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c) => (c === slug[0] ? c.toUpperCase() : ' ' + c)).replace(/-/g, '');  // Title Case-ish label
const Title = slug.split('-').map((w, i) => i === 0 ? w[0].toUpperCase() + w.slice(1) : w).join(' ');

const contractPath = join(root, 'contracts', `${slug}.json`);
const libRel = `./lib/${el}.js`;
const libPath = join(root, libRel);
if (existsSync(contractPath) || existsSync(libPath)) {
  console.error(`\n✗ "${slug}" already exists (contract or lib). Pick another slug or edit it directly.\n`);
  process.exit(1);
}

/* ---- 1) the importable module: a real, registered, token-bound custom element ---- */
const lib = `/**
 * @ahaslides-product/design/${el} — the shared ${Title} primitive.
 *
 *   import '@ahaslides-product/design/${el}';   // registers <${el}>
 *   <${el}>Label</${el}>
 *
 * ONE element, shadow-DOM CSS, themed only by --aha-* tokens → byte-identical in React and Vue.
 * Zero dependencies. Scaffolded on-standard; edit the STYLE + attributes into the real component.
 */
const STYLE = \`
  :host{ display:inline-block }
  .box{ display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box;
    height:36px; padding:0 16px; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; font-weight:600;
    border:0; border-radius:var(--aha-radius-default,8px); cursor:pointer;
    background:var(--aha-color-primary,#6A1EBB); color:var(--aha-text-inverse,#FFFFFF) }
  :host([disabled]) .box{ cursor:not-allowed; opacity:.5 }
\`;

export class ${Cls} extends HTMLElement {
  static get observedAttributes() { return ['disabled']; }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { v ? this.setAttribute('disabled', '') : this.removeAttribute('disabled'); }

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
  }
  attributeChangedCallback() { if (this.shadowRoot) this._render(); }

  _render() {
    this.shadowRoot.innerHTML = \`<style>\${STYLE}</style><span class="box"><slot></slot></span>\`;
    this.shadowRoot.querySelector('.box').addEventListener('click', () => {
      if (this.disabled) return;
      this.dispatchEvent(new CustomEvent('activate', { bubbles: true, composed: true }));
    });
  }
}

export function define${Cls}(tag = '${el}') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, ${Cls});
  return true;
}
if (typeof window !== 'undefined') define${Cls}();

export default { ${Cls}, define${Cls} };
`;

/* ---- 2) the contract (complete, render-gated, on-standard) ---- */
const contract = {
  name: Title,
  slug,
  group: 'General',
  tier: 'leaf',
  badge: 'shared web component',
  element: el,
  reuse: { entry: `./${el}`, registers: el, exportsNamed: [Cls, `define${Cls}`] },
  summary: `TODO: one line — what ${Title} is for.`,
  lead: `ONE custom element — <${el}> — defined once, imported unchanged by React and Vue. Shadow-DOM CSS, themed only by --aha-* tokens.`,
  codeNote: 'Same element, same shadow-DOM CSS → identical render across frameworks.',
  tokensUsed: ['color-primary', 'text-inverse', 'radius-default', 'font-product'],
  spec: [
    { label: 'Size', value: 'height 36 (r8), 16px inline padding, label 14/1.5' },
    { label: 'Fill', value: 'brand #6A1EBB, inverse label #FFFFFF' },
  ],
  props: [
    { name: 'disabled', type: 'boolean', default: 'false', desc: 'non-interactive; dimmed' },
  ],
  opinion: {
    whenToUse: [{ what: Title, when: 'TODO: when to reach for this component' }],
    note: 'TODO: the one opinionated rule for this component.',
  },
  surfaces: ['editor', 'dashboard'],
  snippets: [
    { key: 'html', label: 'HTML', file: `${slug}.html.txt`, runnable: 'paste-and-run', note: 'The native form — a web component in an HTML file renders on open, no build step.' },
    { key: 'react', label: 'React', file: `${slug}.react.txt` },
    { key: 'vue', label: 'Vue 3', file: `${slug}.vue.txt` },
  ],
  preview: `${slug}.preview.html`,
  conformance: {
    $about: 'Measured by qa.mjs against the RENDERED UI (getComputedStyle via headless CDP). Leaf = ONE shared element, single render.',
    ready: `!!(document.querySelector('${el}') && document.querySelector('${el}').shadowRoot && document.querySelector('${el}').shadowRoot.querySelector('.box'))`,
    singleUI: true,
    measure: `(function(){var el=document.querySelector('${el}');var b=el&&el.shadowRoot&&el.shadowRoot.querySelector('.box');if(!b)return{};var s=getComputedStyle(b);return{bg:s.backgroundColor,fg:s.color,height:s.height,radius:s.borderTopLeftRadius};})()`,
    expect: { bg: 'rgb(106, 30, 187)', fg: 'rgb(255, 255, 255)', height: '36px', radius: '8px' },
  },
  selfCheck: [
    { label: 'brand fill #6A1EBB + inverse label', verdict: 'PASS' },
    { label: 'radius 8 · height 36', verdict: 'PASS' },
  ],
};

/* ---- 3) the doc parts ---- */
// preview: defines the element inline (vanilla) so the doc page renders with no external import
const preview = `<div class="pad">
  <div class="lbl">Default · disabled</div>
  <div class="row">
    <${el}>Label</${el}>
    <${el} disabled>Disabled</${el}>
  </div>
</div>

<script type="module">
const STYLE = \`
  :host{ display:inline-block }
  .box{ display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box;
    height:36px; padding:0 16px; gap:8px;
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:14px; font-weight:600;
    border:0; border-radius:var(--aha-radius-default,8px); cursor:pointer;
    background:var(--aha-color-primary,#6A1EBB); color:var(--aha-text-inverse,#FFFFFF) }
  :host([disabled]) .box{ cursor:not-allowed; opacity:.5 }
\`;
class ${Cls} extends HTMLElement {
  connectedCallback(){ if(!this.shadowRoot) this.attachShadow({mode:'open'}); this.shadowRoot.innerHTML = \`<style>\${STYLE}</style><span class="box"><slot></slot></span>\`; }
}
customElements.define('${el}', ${Cls});
</script>
`;

const htmlTxt = `<!-- ⚠ Hosting pending (Q3): these CDN URLs need the package on a PUBLIC CDN/npm. It currently publishes to GitHub Packages (authed), which jsDelivr/esm.sh do NOT serve — paste-and-run works once DevOps publishes publicly (or swap in the branded CDN base). -->
<!-- Paste-and-run: save as .html and open in a browser. No build step.
     <${el}> is the SAME shared custom element React and Vue consume. -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ahaslides-product/design/lib/tokens.css">
<script type="module">
  import 'https://cdn.jsdelivr.net/npm/@ahaslides-product/design/lib/${el}.js';   // registers <${el}>
</script>

<${el}>Label</${el}>
`;

const reactTxt = `import '@ahaslides-product/design/${el}';   // registers <${el}>

// React 18 renders the custom element directly; add a ref wrapper only if you need to bind props.
export function Demo() {
  return <${el}>Label</${el}>;
}
`;

const vueTxt = `// main.ts — register the element + mark aha-* as custom elements
import '@ahaslides-product/design/${el}';
app.config.compilerOptions.isCustomElement = (tag) => tag.startsWith('aha-');

// Component.vue
<template>
  <${el}>Label</${el}>
</template>
`;

/* ---- 4) wire package.json exports (targeted insert — preserves the file's hand formatting) ---- */
const pkgPath = join(root, 'package.json');
let pkg = readFileSync(pkgPath, 'utf8');
const exportLine = `    "./${el}": "${libRel}",\n`;
if (!pkg.includes(`"./${el}":`)) {
  pkg = pkg.replace(/("exports":\s*\{\n)/, `$1${exportLine}`);
}
// the element self-registers on import, so mark its module as a side effect (bundlers keep it)
if (!new RegExp(`"sideEffects":\\s*\\[[^\\]]*${el}\\.js`).test(pkg)) {
  pkg = pkg.replace(/("sideEffects":\s*\[)/, `$1"${libRel}", `);
}
writeFileSync(pkgPath, pkg);

/* ---- write everything ---- */
writeFileSync(libPath, lib);
writeFileSync(contractPath, JSON.stringify(contract, null, 2) + '\n');
writeFileSync(join(root, 'parts', `${slug}.preview.html`), preview);
writeFileSync(join(root, 'parts', `${slug}.html.txt`), htmlTxt);
writeFileSync(join(root, 'parts', `${slug}.react.txt`), reactTxt);
writeFileSync(join(root, 'parts', `${slug}.vue.txt`), vueTxt);

console.log(`
✓ Scaffolded "${slug}" (leaf) — an on-standard baseline that passes both gates:
    lib/${el}.js            the registered, token-bound element
    contracts/${slug}.json   the contract (render-gated)
    parts/${slug}.{preview.html,html.txt,react.txt,vue.txt}
    package.json             + "./${el}" export

Next:
  1. npm run check          → confirm green (13→ more components meet the standard)
  2. Edit lib/${el}.js       → make it the real component (keep colour token-bound, radius on-scale)
  3. Update the contract     → real summary/props/spec/opinion, and the conformance expect values
                               to your MEASURED render (the gate holds you to them)
  4. npm run check          → green again = done
`);
