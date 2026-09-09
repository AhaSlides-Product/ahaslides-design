#!/usr/bin/env node
/**
 * standards.mjs — THE component gate.
 *
 * A component does not pass unless it meets the reusable standard. For EVERY contract in
 * contracts/*.json this enforces, and fails the build (exit 1) on any miss:
 *
 *   1. Contract is complete        — the fields the generator + agents rely on are present.
 *   2. It declares how it's reused  — a `reuse` block naming a real package entry point.
 *   3. That entry is published      — the subpath is in package.json "exports" and the file exists.
 *   4. It actually imports          — `import '@ahaslides-product/design/<entry>'` resolves and runs.
 *   5. It registers / exports       — leaf: registers its custom element; composite: exports its artifact.
 *   6. Its snippets consume the DS  — reference @ahaslides-product/design, never a fake pkg or a banned library.
 *   7. It's render-gated            — carries a `conformance` block so qa.mjs can measure the real UI.
 *   8. Its icons come from the DS   — every <aha-icon name="…"> resolves in the icon registry (the
 *                                     published gallery); no inline <svg> glyph bypasses the library.
 *
 * This is the "can a teammate contribute safely?" gate: add contracts/<slug>.json + lib/<entry>.js,
 * and this proves your component registers and is genuinely reusable — or it fails, loudly, per rule.
 * (Render truth — does it LOOK right — is qa.mjs. Run both via `npm run check`.)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const CDIR = join(root, 'contracts');
const PATDIR = join(root, 'patterns');   // composition-guide artifacts (settings, …)
const PDIR = join(root, 'parts');
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const PKG = JSON.parse(read(join(root, 'package.json')));
const EXPORTS = PKG.exports || {};

/* ===== the VISUAL STANDARD — the "same quality" bar =====
   standards.mjs used to prove a component was *reusable* (importable, registered, consumed by its
   real name). It did NOT prove the component was *on-standard* — that lived only in the aha-design
   skills + judges, which run solely when a contributor chooses to. So a teammate could ship an
   off-palette colour, an off-scale radius, or a nonexistent token and pass both gates.
   These primitives make the house non-negotiables (palette, the 4/6/8/12/16 radius scale, real
   --aha-* tokens) something the gate ENFORCES — not something the author has to remember. */
const TOKENS = JSON.parse(read(join(root, 'tokens.canonical.json')) || '{}');
const RADIUS_SCALE = new Set([0, 4, 6, 8, 12, 16, 999]);   // --aha-radius-* ; pill = 999
const NEUTRALS = new Set(['#FFFFFF', '#000000']);          // universal; 'transparent' handled in inPalette
const normHex = (h) => { h = h.toUpperCase(); return /^#[0-9A-F]{3}$/.test(h) ? '#' + [...h.slice(1)].map(c => c + c).join('') : h; };
// every hex the canonical token set blesses — the palette an on-standard colour must land in
const PALETTE = new Set(); JSON.stringify(TOKENS).replace(/#[0-9A-Fa-f]{3,8}/g, (h) => (PALETTE.add(normHex(h)), h));
// the generated custom properties an author may legitimately bind tokensUsed to (source file, always present)
const CSSVARS = new Set([...read(join(root, 'lib', 'tokens.css')).matchAll(/--aha-[a-z0-9-]+/g)].map(m => m[0]));
const rgbToHex = (s) => { const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i); return m ? normHex('#' + [1, 2, 3].map(i => (+m[i]).toString(16).padStart(2, '0')).join('')) : null; };
const isColour = (v) => /^\s*(#[0-9A-Fa-f]{3,8}|rgba?\()/.test(String(v));
const isPx = (v) => /^\s*\d+(\.\d+)?px\s*$/.test(String(v));
const inPalette = (v) => { const s = String(v).trim(); if (/^transparent$/i.test(s)) return true; const hex = s.startsWith('#') ? normHex(s) : rgbToHex(s); return !!hex && (PALETTE.has(hex) || NEUTRALS.has(hex)); };

/* ===== the ICON LIBRARY — the single source every component icon must come from =====
   icons/registry.json (built by build-icons.mjs from Figma DS V3) IS the icon library published
   at the gallery below. The house rule is: a component never hand-rolls a glyph — it summons one
   BY NAME via <aha-icon name="…">, and that name must be a real glyph in the registry. This gate
   makes it enforceable: every named icon a component references (in its source, its snippets, or
   its contract) must resolve here, and an inline <svg> glyph in element source is a bypass (caught
   in the source scan below). */
const ICON_REGISTRY = JSON.parse(read(join(root, 'icons', 'registry.json')) || '{"icons":{}}');
const ICON_NAMES = new Set(Object.keys(ICON_REGISTRY.icons || {}));
const ICON_GALLERY = 'https://ahaslides-product.github.io/ahaslides-design/icons/index.html';
// Pull every icon referenced by name from a blob of source / snippet / contract text. A DS icon is
// always summoned as <aha-icon name="…"> (also :name= for Vue-bind, name={…} for JSX). A plain
// static value is one literal; a dynamic binding (ternary) is mined for its quoted string literals
// so those are checked too. A pure-variable binding (name={icon}) carries no literal — left to runtime.
function iconRefs(text) {
  const names = new Set();
  for (const tag of String(text).match(/<aha-icon\b[^>]*>/gi) || []) {
    const m = tag.match(/(?::|\s)name\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/i);
    if (!m) continue;
    const quoted = m[1] ?? m[2];
    if (quoted != null && /^[^"'{}?()\s]+$/.test(quoted) && quoted.includes('-')) { names.add(quoted); continue; }
    for (const lit of (m[1] ?? m[2] ?? m[3] ?? '').match(/['"]([^'"]+)['"]/g) || []) {
      const s = lit.slice(1, -1); if (s.includes('-')) names.add(s);   // a literal inside a dynamic binding
    }
  }
  return names;
}

// Minimal DOM shim so the custom-element modules import + self-register headlessly (no browser).
const els = new Map();
globalThis.window = globalThis;
globalThis.customElements = { define: (t, c) => els.set(t, c), get: (t) => els.get(t) };
globalThis.HTMLElement = class { constructor() { this.attributes = {}; } };

const REQUIRED = ['name', 'slug', 'group', 'tier', 'summary', 'props', 'spec', 'snippets', 'opinion', 'surfaces', 'preview', 'conformance'];
// A pattern is a composition guide, not a component — different required shape.
const PATTERN_REQUIRED = ['name', 'slug', 'kind', 'summary', 'skillRef', 'surfaces', 'composedOf', 'rules'];
// Backlog policy — a pattern that names a component the DS doesn't ship yet.
//   false → WARN: the doc-only pattern lands, the gap is tracked loudly (the pattern pulls the roadmap into the open).
//   true  → HARD FAIL: the referenced components must exist here first before the pattern can pass.
const PATTERN_BACKLOG_HARD_FAIL = false;
// Motion policy — interactive leaf states must animate via the shared motion tokens (--aha-motion-* durations
// + --aha-ease-* curves), not snap and not a bare timing literal; and the transition must live on a PERSISTENT
// node (a subtree rebuild on the state change kills it — the Switch-click bug).
//
// Motion findings are a HARD FAIL by default — so a NEW component can't ship any of them. The only grace is
// MOTION_DEBT below: a tiny, explicit, greppable allow-list of components that already shipped a given defect
// before this gate existed. Those stay WARN (don't brick CI) until Fleet restructures them (Slack PRO38-5).
// Remove each entry as its component is fixed; when MOTION_DEBT is empty the motion gate is fully hard, no exceptions.
// Keys are the element tag; values are the finding kinds grandfathered for it: 'dead' | 'snap' | 'literal' | 'bounce' | 'sync'.
const MOTION_DEBT = {
  'aha-switch':   ['dead'],   // rebuilds subtree on [checked] — knob transform can't fire
  'aha-checkbox': ['dead'],   // rebuilds subtree on [checked]/[indeterminate]
  'aha-tooltip':  ['dead'],   // rebuilds subtree on [open]
  'aha-paywall':  ['snap'],   // an interactive state with no transition declared
};
const BANNED = [
  [/@aha\/design\b/, 'the old placeholder specifier @aha/design — must be @ahaslides-product/design'],
  [/lucide|heroicons|font-?awesome|@ant-design\/icons/i, 'a non-DS icon set — use <aha-icon> by name'],
  [/@mui\/|@chakra-ui\/|@radix-ui\/|@mantine\/|react-bootstrap/i, 'a non-AntD component library'],
];

const results = [];
const contracts = readdirSync(CDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(CDIR, f))));

for (const ct of contracts) {
  const checks = [];
  const chk = (name, cond, note = '') => checks.push([name, !!cond, cond ? '' : note]);

  // 1) contract completeness
  const missing = REQUIRED.filter(k => ct[k] == null || (Array.isArray(ct[k]) && !ct[k].length));
  chk('contract complete (all required fields)', missing.length === 0, `missing: ${missing.join(', ')}`);
  // Decision: every component supports all three — HTML / React / Vue — and HTML LEADS (it's the
  // default doc tab + agent-feed snippet). Enforce both, not just "≥2 snippets".
  const snippetKeys = (ct.snippets || []).map(s => s.key);
  chk('HTML snippet leads (listed first)', snippetKeys[0] === 'html', 'list the { key:"html" } snippet FIRST — docs + feed lead with it');
  chk('ships React + Vue snippets (all three)', snippetKeys.includes('react') && snippetKeys.includes('vue'), 'every component supports HTML/React/Vue — add the missing snippet');
  chk('≥1 prop documented', Array.isArray(ct.props) && ct.props.length >= 1);

  // 2) declares reuse
  const r = ct.reuse;
  chk('declares a `reuse` entry point', r && typeof r.entry === 'string', 'add "reuse": { entry, registers|exportsNamed }');

  if (r && r.entry) {
    // 3) entry is a published package export that exists on disk
    const mapped = EXPORTS[r.entry];
    chk(`reuse.entry "${r.entry}" is in package.json exports`, !!mapped, 'add it to "exports"');
    chk('entry file exists on disk', mapped && existsSync(resolve(root, mapped)), mapped ? `${mapped} missing` : '');

    // 4) it imports by its published name (self-reference over exports); 5) registers/exports
    const spec = PKG.name + r.entry.replace(/^\./, '');
    try {
      const mod = await import(spec);
      chk(`import "${spec}" resolves`, !!mod);
      if (r.registers) {
        chk(`registers <${r.registers}> on import`, !!customElements.get(r.registers), 'element not defined after import');
      } else {
        chk('composite exports a shared artifact (reuse.exportsNamed)', Array.isArray(r.exportsNamed) && r.exportsNamed.length >= 1,
          'a composite must export a reusable artifact (e.g. a theme)');
      }
      for (const nm of (r.exportsNamed || [])) chk(`exports \`${nm}\``, nm in mod, 'named export missing');
    } catch (e) {
      chk(`import "${spec}" resolves`, false, e.message.split('\n')[0]);
    }
  }

  // 6) snippets consume the DS (real package) and no fakes / banned libs
  const snippetText = (ct.snippets || []).map(s => read(join(PDIR, s.file))).join('\n');
  chk('a snippet imports @ahaslides-product/design', /@ahaslides-product\/design/.test(snippetText) || ct.tier?.includes('composite'),
    'snippets must show consuming the real package');
  for (const [re, why] of BANNED) chk(`snippets free of: ${why}`, !re.test(snippetText), 'found in a snippet');

  // 6c) ICONS COME FROM THE DS LIBRARY — every glyph a component uses must be a real icon in the
  //     registry (the published gallery), summoned as <aha-icon name="…">. Gather every named
  //     reference from the component's own source + all its snippets + preview + the contract text,
  //     and prove each resolves. A typo or a non-DS name renders the dashed error box at runtime —
  //     here it fails the gate loudly instead.
  const iconEntry = r && r.entry && EXPORTS[r.entry] ? read(resolve(root, EXPORTS[r.entry])) : '';
  const iconText = [iconEntry, snippetText, ct.preview ? read(join(PDIR, ct.preview)) : '', JSON.stringify(ct)].join('\n');
  for (const nm of iconRefs(iconText)) {
    chk(`icon "${nm}" is in the DS icon library`, ICON_NAMES.has(nm),
      `not a glyph in icons/registry.json — pick a name from the gallery (${ICON_GALLERY}) or add the SVG + re-run build-icons.mjs`);
  }

  // 6b) EVERY component ships a paste-and-run HTML snippet — no exceptions — so end-users can
  //     vibe-code decks/courses/hubs with no build step. LEAF: the custom element is the native
  //     form (the snippet uses <element> directly). COMPOSITE (no framework-free element): a
  //     CDN-React runnable page — React + antd loaded from a CDN so it still opens-and-renders.
  const isLeaf = !!(ct.reuse && ct.reuse.registers) || /leaf/.test(ct.tier || '');
  const html = (ct.snippets || []).find(s => s.key === 'html');
  chk('ships an HTML (paste-and-run) snippet', !!html, 'add a { key:"html" } snippet in parts/<slug>.html.txt — every component needs one');
  if (html) {
    const htmlText = read(join(PDIR, html.file));
    // The snippet must consume the DS from a public CDN — either the npm package
    // (@ahaslides-product/design) or the repo via jsDelivr /gh/ (ahaslides-product/ahaslides-design).
    const consumesDS = /@ahaslides-product\/design|ahaslides-product\/ahaslides-design/.test(htmlText);
    if (isLeaf) {
      chk('HTML snippet imports the DS + uses the element', consumesDS && new RegExp(`<${ct.element}[\\s>]`).test(htmlText),
        'a leaf HTML snippet must import the DS element from a public CDN and use its custom element');
    } else {
      // composite: a CDN-React page — must consume the DS (e.g. the shared theme) and be runnable
      // (loads React from a CDN, mounts into the DOM), not a hand-styled raw table.
      chk('HTML snippet is a runnable CDN-React page consuming the DS', consumesDS && /esm\.sh|cdn|unpkg|jsdelivr/i.test(htmlText) && /react/i.test(htmlText),
        'a composite HTML snippet must load React from a CDN and consume the DS (e.g. the shared theme)');
    }
    // Guardrail: the jsDelivr /gh/ ref must be SINGLE-SOURCED via the @__REF__ placeholder
    // (generate.mjs injects the live ref). A hardcoded @v1.2.3 in the source freezes the CDN at a
    // stale tag — exactly the bug where components added after that tag 404 at runtime.
    if (/ahaslides-product\/ahaslides-design@/.test(htmlText)) {
      chk('CDN ref is single-sourced (@__REF__, not a hardcoded tag)',
        htmlText.includes('@__REF__') && !/ahaslides-design@v?\d+\.\d+\.\d+/.test(htmlText),
        'pin the /gh/ ref as @__REF__ (generate.mjs injects it) — never a hardcoded @vX.Y.Z');
    }
  }

  // 7) render-gated (qa.mjs measures it; here we require the block exists AND actually measures the look)
  chk('carries a `conformance` block (render-gated by qa.mjs)', !!ct.conformance && !!ct.conformance.measure);

  // 7b) CONFORMANCE COVERAGE — the render gate is only as strong as this block. A block that
  //     measures one property passes qa.mjs trivially, so a hollow contract looked as "done" as a
  //     rigorous one. Require the block to actually pin the look: a tier-floor of assertions, at
  //     least one COLOUR (proves colour binding renders) and one DIMENSION (proves geometry).
  //     Value-classified, not by key name — an author names their own keys.
  const exp = (ct.conformance && ct.conformance.expect) || {};
  const expKeys = Object.keys(exp), expVals = Object.values(exp);
  const floor = isLeaf ? 4 : 6;
  chk(`conformance measures ≥${floor} properties`, expKeys.length >= floor, `only ${expKeys.length} — too thin to prove the render; measure colour + size + a state`);
  chk('conformance measures ≥1 colour', expVals.some(isColour), 'add a colour assertion (bg/border/fg) so qa proves the colour binding, not just geometry');
  chk('conformance measures ≥1 dimension (px)', expVals.some(isPx), 'add a size/radius assertion so qa proves the geometry');

  // 7c) THE VISUAL STANDARD on the published contract — the "same quality" bar, now enforced:
  //     every measured radius is on the 4/6/8/12/16 scale, every measured colour is on-palette,
  //     and every token the contract claims to use actually exists. These caught nothing before.
  for (const [k, v] of Object.entries(exp)) {
    if (/radius/i.test(k) && isPx(v)) chk(`expect.${k} radius on the 4/6/8/12/16 scale`, RADIUS_SCALE.has(parseFloat(v)), `${v} is off the radius scale`);
    if (isColour(v)) chk(`expect.${k} colour is on-palette`, inPalette(v), `${v} is not a canonical token value — bind to the palette`);
  }
  // tokensUsed must be VERIFIABLE against the real theming source — no drift between what a
  // contract claims and what the component is actually themed by. The source differs by tier:
  //   leaf      → each entry is a DS custom property: --aha-<entry> exists in the token source.
  //   composite → each entry is a key of the exported theme artifact: a `token.<key>`, or a
  //               component override written "Comp.key" (e.g. "Table.headerBg").
  if (r && r.entry) {
    if (isLeaf && CSSVARS.size) {
      for (const t of (ct.tokensUsed || [])) chk(`tokensUsed "${t}" is a real --aha-${t}`, CSSVARS.has('--aha-' + t), 'a leaf token is a DS custom property — fix the name or add the token to the source');
    } else if (!isLeaf) {
      try {
        const artifact = (await import(PKG.name + r.entry.replace(/^\./, '')))[(r.exportsNamed || [])[0]] || {};
        const tokenKeys = new Set(Object.keys(artifact.token || {}));
        const compKeys = new Set();
        for (const [cn, obj] of Object.entries(artifact.components || {})) for (const k of Object.keys(obj || {})) compKeys.add(`${cn}.${k}`);
        for (const t of (ct.tokensUsed || [])) chk(`tokensUsed "${t}" is a key of the theme artifact`, t.includes('.') ? compKeys.has(t) : tokenKeys.has(t), 'a composite token must exist in the exported theme (token.<key> or Comp.key)');
      } catch { /* import failure already reported by the reuse check above */ }
    }
  }

  results.push({ slug: ct.slug || ct.name, checks });
}

/* ===== the VISUAL STANDARD on component SOURCE =====
   The contract is the published truth, but the lib module is what actually ships. Enforce the same
   bar on it, classifying by the reuse role a contract declares:
     • ELEMENT (leaf, `reuse.registers`) — colour binds to a --aha-* token (no BARE hex outside a
       var(--aha-…, fallback)), and any literal border-radius is on the scale.
     • THEME (composite artifact, no `registers`) — literals are expected (it maps the DS into a
       vendor theme) but every hex must stay ON-PALETTE, so the theme can't drift off the system.
     • DEFINITION layers (tokens.*, the icon registry) are the value SOURCE — not scanned.
   A genuinely-decorative exception (a sub-scale tick radius, a white checkmark stroke) carries an
   auditable, greppable escape hatch on its own line: `ds-lint-allow: hex,radius (why)`. */
const libFindings = [];
for (const ct of contracts) {
  const r = ct.reuse; if (!r || !r.entry) continue;
  const mapped = EXPORTS[r.entry]; if (!mapped || !/\.js$/.test(mapped)) continue;
  const mode = r.registers ? 'element' : 'theme';
  const isIconRuntime = r.registers === 'aha-icon';   // the <aha-icon> element IS the library runtime — it draws the <svg>
  const raw = read(resolve(root, mapped));
  const lines = raw.split('\n');
  // blank out comment bodies but preserve line count so findings map to real line numbers
  const code = raw.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n').map(l => l.replace(/\/\/.*$/, ''));
  const hits = [];
  const motionFindings = [];   // [kind, msg] tuples — hard fail unless the component grandfathers that kind (MOTION_DEBT)
  code.forEach((line, i) => {
    const allow = (lines[i].match(/ds-lint-allow:\s*([a-z, ]+)/i) || [, ''])[1];
    const allowHex = /hex/.test(allow), allowRadius = /radius/.test(allow), allowMotion = /motion/.test(allow);
    const allowSvg = /svg/.test(allow);
    if (mode === 'element') {
      const bare = line.replace(/var\(\s*--aha-[a-z0-9-]+\s*(,[^)]*)?\)/gi, 'TOK');   // fallbacks are fine; the token is the real value
      if (!allowHex) for (const h of bare.match(/#[0-9A-Fa-f]{3,8}\b/g) || []) hits.push(`L${i + 1}: bare hex ${h} — bind to a token: var(--aha-…, ${h})`);
      if (!allowRadius) for (const m of line.matchAll(/border-radius\s*:\s*([0-9.]+)px/gi)) if (!RADIUS_SCALE.has(parseFloat(m[1]))) hits.push(`L${i + 1}: border-radius ${m[1]}px off the 4/6/8/12/16 scale`);
      // a transition's timing must come from a motion token — a bare literal (.12s/150ms) is the drift (.1/.12/.15) we're killing
      if (!allowMotion && /transition/i.test(line))
        for (const m of bare.match(/(?:\d*\.\d+|\d+)\s*m?s\b/g) || []) motionFindings.push(['literal', `L${i + 1}: bare transition timing ${m.trim()} — bind to a motion token (var(--aha-motion-mid) var(--aha-ease-in-out))`]);
      // no bounce/elastic easing — a cubic-bezier whose control-point Y leaves [0,1] overshoots (back/elastic),
      // which reads dated/tacky and isn't how AntD (or a real object) decelerates. Use an exponential ease-out.
      if (!allowMotion) for (const m of line.matchAll(/cubic-bezier\(\s*-?[0-9.]+\s*,\s*(-?[0-9.]+)\s*,\s*-?[0-9.]+\s*,\s*(-?[0-9.]+)\s*\)/gi)) {
        const y1 = parseFloat(m[1]), y2 = parseFloat(m[2]);
        if (y1 < 0 || y1 > 1 || y2 < 0 || y2 > 1) motionFindings.push(['bounce', `L${i + 1}: bounce/elastic easing ${m[0]} — the curve overshoots (control-point Y outside 0–1). Use an exponential ease-out (var(--aha-ease-out) / --aha-ease-in-out), not a "back" ease`]);
      }
      // an inline <svg> glyph bypasses the icon library — a component must summon glyphs by name via
      // <aha-icon name="…">. Genuine sub-glyph chrome (a spinner, a checkmark tick) is an auditable
      // exception on that line: ds-lint-allow: svg (why). The icon runtime itself is exempt — it IS the drawer.
      if (!allowSvg && !isIconRuntime && /<svg\b/i.test(line)) hits.push(`L${i + 1}: inline <svg> — use an <aha-icon name="…"> from the DS library, or justify chrome with ds-lint-allow: svg (why)`);
    } else {
      for (const h of line.match(/#[0-9A-Fa-f]{3,8}\b/g) || []) if (!inPalette(h)) hits.push(`L${i + 1}: off-palette ${h} — a theme must map to a canonical token value`);
    }
  });
  // per-file motion smells (element only)
  if (mode === 'element') {
    const body = code.join('\n');
    const interactive = /:hover|:focus|:focus-visible|:focus-within|:active|:checked|cursor\s*:\s*pointer|\[(?:checked|open|disabled)\]/i.test(body);
    const animates = /transition|@keyframes|animation\s*:/i.test(body);
    const fileAllows = /ds-lint-allow:\s*[a-z, ]*motion/i.test(raw);
    // (a) an interactive element whose states SNAP — no transition declared at all
    if (interactive && !animates && !fileAllows)
      motionFindings.push(['snap', `interactive element declares no transition — hover/focus/checked/open states must animate (var(--aha-motion-mid) var(--aha-ease-in-out)), never snap`]);
    // (b) a DEAD transition — the element declares one but rebuilds its whole subtree on a state change, so the
    //     browser has no "from" state and it never fires (the Switch-click bug — survives even after the CSS is
    //     correct). The transition must live on a PERSISTENT node: toggle the attribute/class, mutate in place.
    //     STATE = any animatable-state attr; RE-RENDER = any wholesale subtree rebuild (innerHTML/replaceChildren/
    //     render()), whether triggered from attributeChangedCallback OR a property setter. Broad on purpose — a new
    //     component shouldn't be able to dodge the check by renaming the attr or swapping the rebuild mechanism.
    // Precise toggle-states — the ones that pair with a :host([x]) rule to animate a property. (NOT value/loading/etc.:
    // those trigger a re-render too, but the transition there is usually on :hover/:focus — a different concern, not a
    // dead transition. Flagging them would false-positive on legit fields like Input.)
    const STATE_RE = /\b(checked|open|active|selected|expanded|pressed|indeterminate|toggled|collapsed)\b/i;
    const stateAttrs = (body.match(/observedAttributes[\s\S]{0,200}?\[([^\]]*)\]/) || [, ''])[1];
    const setterRenders = /set\s+\w+\s*\([^)]*\)\s*\{[^}]*(?:_render|this\.render|innerHTML\s*=|replaceChildren)/.test(body);
    const togglesState = STATE_RE.test(stateAttrs) || setterRenders;
    const rebuilds = /(innerHTML\s*=|replaceChildren\s*\(|\.render\s*\()/.test(body) &&
                     (/attributeChangedCallback/.test(body) || setterRenders);
    if (animates && togglesState && rebuilds && !fileAllows) {
      const which = (stateAttrs.replace(/['"\s]/g, '').split(',').filter(a => STATE_RE.test(a)).join('/')) || 'a state setter';
      motionFindings.push(['dead', `transition may be DEAD — a state change (${which}) triggers a full subtree rebuild (innerHTML/replaceChildren/render), so the declared transition can't fire across it. Toggle the attribute/class on a persistent node instead of rebuilding the subtree (the Switch-click case)`]);
    }
    // (c) the EXAMPLE must show the SAME motion as the shipped component. The preview is a hand-kept copy
    //     (a self-contained reimplementation — and qa.mjs measures IT, not lib), so it drifts: it has dropped
    //     a transition before. Flag any transition lib ships that the preview is missing → the example lies.
    const txns = (s) => new Set([...s.matchAll(/transition\s*:\s*([^;}`]+)/gi)]
      .map(m => m[1].replace(/\s+/g, ' ').trim().toLowerCase())
      .filter(t => t && !/^none\b/.test(t)));
    const pv = read(join(PDIR, (ct.slug || '') + '.preview.html'));
    if (pv && !fileAllows) {
      const missing = [...txns(raw)].filter(t => !txns(pv).has(t));
      if (missing.length)
        motionFindings.push(['sync', `example out of sync — parts/${ct.slug}.preview.html is missing ${missing.length} transition(s) the component ships (e.g. "${missing[0].slice(0, 48)}…"), so the rendered example shows different motion than <${r.registers}> — and qa measures the preview, not lib. Keep the preview copy in sync with the element.`]);
    }
  }
  // HARD FAIL by default — a NEW component can't ship any motion defect. Only the exact (component, kind) pairs
  // in MOTION_DEBT get a WARN pass (known pre-gate debt, tracked on PRO38-5); everything else fails the file.
  const debt = MOTION_DEBT[r.registers] || [];
  const motionHits = [];
  for (const [kind, msg] of motionFindings) (debt.includes(kind) ? motionHits : hits).push(debt.includes(kind) ? `${msg}  [grandfathered: ${r.registers}/${kind} — PRO38-5]` : msg);
  libFindings.push({ file: mapped.replace(/^\.\//, ''), mode, hits, motionHits });
}

/* ===== patterns — composition guides. A pattern ships no primitive; it reuses components and
   documents conventions. It's gated on: completeness, a real skillRef, a composedOf reuse graph
   that resolves into the component set, rules that trace back to the skill, and (if it ships a
   wrapper) the same import/export checks a composite gets. ===== */
const contractSlugs = new Set(contracts.map(c => c.slug));
const patterns = existsSync(PATDIR)
  ? readdirSync(PATDIR).filter(f => f.endsWith('.json')).map(f => JSON.parse(read(join(PATDIR, f))))
  : [];
const patternResults = [];
for (const p of patterns) {
  const checks = [], warns = [];
  const chk = (name, cond, note = '') => checks.push([name, !!cond, cond ? '' : note]);
  const warn = (name, note = '') => warns.push([name, note]);

  // 1) completeness + kind + the skill it distils
  const missing = PATTERN_REQUIRED.filter(k => p[k] == null || (Array.isArray(p[k]) && !p[k].length));
  chk('pattern complete (all required fields)', missing.length === 0, `missing: ${missing.join(', ')}`);
  chk('kind is "pattern"', p.kind === 'pattern');
  chk('links a build skill (skillRef.build)', p.skillRef && typeof p.skillRef.build === 'string', 'add skillRef.build — the design skill it distils');

  // 2) composedOf — the reuse graph must resolve into the component set (the teeth)
  chk('declares composedOf (what it reuses)', Array.isArray(p.composedOf) && p.composedOf.length >= 1);
  for (const dep of (p.composedOf || [])) {
    if (!dep || !dep.ref) { chk('composedOf entry has a ref', false, 'each entry needs { ref, as, use, status }'); continue; }
    if (dep.as === 'component') {
      if (dep.status === 'available') {
        chk(`composedOf: "${dep.ref}" exists as a component`, contractSlugs.has(dep.ref), 'marked available but no such contract — fix the slug or mark it missing');
      } else if (PATTERN_BACKLOG_HARD_FAIL) {
        chk(`composedOf backlog: "${dep.ref}" exists`, contractSlugs.has(dep.ref), 'referenced component not in the DS — add it here first');
      } else {
        warn(`composedOf backlog: "${dep.ref}" not in the DS yet`, 'a compliant surface needs it — add it here so the pattern is buildable by reuse');
      }
    } else if (dep.as === 'token') {
      chk(`composedOf: "${dep.ref}" binds an --aha-* token`, /^--aha-/.test(dep.ref), 'token refs bind to --aha-* vars');
    } else {
      chk(`composedOf: "${dep.ref}" declares its kind`, false, 'as must be "component" or "token"');
    }
  }

  // 3) rules — the checklist, each traceable to a skill assertion
  chk('has ≥1 rule', Array.isArray(p.rules) && p.rules.length >= 1);
  chk('every rule traces to a skill assertion (ref)',
    (p.rules || []).every(x => x && x.rule && Array.isArray(x.ref) && x.ref.length >= 1),
    'each rule needs ref: ["SETTINGS-xx", …] back to the skill');

  // 4) the guide narrative doesn't smuggle in a banned library
  const guideText = p.guide ? read(join(PDIR, p.guide)) : '';
  for (const [re, why] of BANNED) chk(`guide free of: ${why}`, !re.test(guideText), 'found in the guide');

  // 5) optional composition code — gated like a composite when present
  if (p.reuse && p.reuse.entry) {
    const mapped = EXPORTS[p.reuse.entry];
    chk(`reuse.entry "${p.reuse.entry}" is in package.json exports`, !!mapped, 'add it to "exports"');
    chk('entry file exists on disk', mapped && existsSync(resolve(root, mapped)), mapped ? `${mapped} missing` : '');
    const spec = PKG.name + p.reuse.entry.replace(/^\./, '');
    try {
      const mod = await import(spec);
      chk(`import "${spec}" resolves`, !!mod);
      for (const nm of (p.reuse.exportsNamed || [])) chk(`exports \`${nm}\``, nm in mod, 'named export missing');
    } catch (e) { chk(`import "${spec}" resolves`, false, e.message.split('\n')[0]); }
  }

  patternResults.push({ slug: p.slug || p.name, checks, warns });
}

/* ===== repo gate — CHANGELOG + version ===========================================================
   House rule: every merge ships a CHANGELOG entry AND bumps the package version. The changelog is
   the consumer-facing record of what each published version changed; the version is what `npm
   publish` ships on the v* tag. A rule that isn't gated is a suggestion — so this makes it real:
   a PR that forgets either goes red here, like any other standard.
   Format (CHANGELOG.md, newest first):
     ## X.Y.Z — YYYY-MM-DD      (em-dash or hyphen; the TOP entry must equal package.json "version")
     ### Added | Changed | Fixed | Removed
     - one bullet per change
   ================================================================================================= */
const repoChecks = [];
{
  const rchk = (name, cond, note = '') => repoChecks.push([name, !!cond, cond ? '' : note]);
  const changelog = read(join(root, 'CHANGELOG.md'));
  rchk('CHANGELOG.md exists', !!changelog, 'add a CHANGELOG.md at the repo root (newest entry on top)');
  if (changelog) {
    const m = changelog.match(/^##\s+(\d+\.\d+\.\d+)\s+[—-]\s+(\d{4}-\d{2}-\d{2})\s*$/m);
    rchk('top entry heads the file as "## X.Y.Z — YYYY-MM-DD"', !!m,
      'the newest change must head the file as "## <semver> — <YYYY-MM-DD>"');
    if (m) {
      rchk(`top version ${m[1]} matches package.json ${PKG.version}`, m[1] === PKG.version,
        `they must match — bump package.json "version" to ${m[1]} (or fix the heading)`);
      // the block from this heading up to the next "## " must carry at least one "- " bullet
      const block = changelog.slice(changelog.indexOf(m[0]) + m[0].length).split(/\n##\s/)[0];
      rchk('top entry lists ≥1 change bullet', /^\s*-\s+\S/m.test(block),
        'describe what changed as "- …" bullets under the version heading');
    }
  }
}

/* ---- report ---- */
let pass = 0, fail = 0, warnCount = 0;
console.log('\n=== AhaSlides DS — STANDARDS gate ===\n');
console.log('components');
for (const r of results) {
  const ok = r.checks.every(x => x[1]);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} ${r.slug}`);
  for (const [n, v, note] of r.checks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}${!v && note ? `  [${note}]` : ''}`);
}
if (patternResults.length) {
  console.log('\npatterns');
  for (const r of patternResults) {
    const ok = r.checks.every(x => x[1]);
    ok ? pass++ : fail++;
    console.log(`${ok ? '✓' : '✗'} ${r.slug}  [pattern]`);
    for (const [n, v, note] of r.checks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}${!v && note ? `  [${note}]` : ''}`);
    for (const [n, note] of r.warns) { warnCount++; console.log(`      ⚠ WARN: ${n}${note ? `  [${note}]` : ''}`); }
  }
}
if (libFindings.length) {
  console.log('\ncomponent source (visual standard)');
  for (const f of libFindings) {
    const ok = f.hits.length === 0;
    ok ? pass++ : fail++;
    console.log(`${ok ? '✓' : '✗'} ${f.file}  [${f.mode}]`);
    if (ok) console.log(`      · ${f.mode === 'element' ? 'colour token-bound, radius on-scale' : 'every hex on-palette'}`);
    for (const h of f.hits) console.log(`      ✗ FAIL: ${h}`);
    for (const h of (f.motionHits || [])) { warnCount++; console.log(`      ⚠ WARN: ${h}`); }
  }
}
{
  console.log('\nrepo');
  const ok = repoChecks.every(x => x[1]);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} CHANGELOG + version`);
  for (const [n, v, note] of repoChecks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}${!v && note ? `  [${note}]` : ''}`);
}
console.log(`\n${pass} artifact(s) meet the standard / ${fail} fail${warnCount ? ` · ${warnCount} warning(s)` : ''}\n`);
if (!contracts.length && !patterns.length) { console.log('No contracts or patterns found — nothing to gate.'); }
process.exit(fail ? 1 : 0);
