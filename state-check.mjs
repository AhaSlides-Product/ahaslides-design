#!/usr/bin/env node
/**
 * state-check.mjs — the interactive-state gate.
 *
 * Renders a built docs page in headless Chrome, forces every interactive element into :hover,
 * :focus-visible and :active through the DevTools CSS domain, and measures what is actually painted:
 *
 *   contrast   text against its real background must reach 4.5:1 (3:1 for large text and icons)
 *   colour     every ink, fill, border, outline and shadow must be on the allowed colour list
 *   focus      a keyboard-focused control must show an indicator that reaches 3:1 against the page
 *
 * Inside a subtree that carries a presenter's deck theme (inline `--aha-deck-*` variables, as set by
 * `applyDeck`) the colours are customer content, so the colour-list finding is waived there. Contrast
 * and focus are still measured.
 *
 * A contract's conformance block only pins resting values, so a hover that turns a label
 * dark-on-dark, or an un-themed antd blue hover, passed every other gate.
 *
 *   node state-check.mjs                 every component page in dist/
 *   node state-check.mjs button paywall  only those slugs
 *   node state-check.mjs --dist=<dir>    a built site somewhere else
 *   node state-check.mjs --known         also print the baselined findings
 *   node state-check.mjs --update-baseline   rewrite state-check.baseline.json from this run
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPage } from './cdp.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const DIST = (process.argv.find(a => a.startsWith('--dist=')) || '').slice(7) || join(root, 'dist');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export const STATES = [
  { name: 'rest', element: [], ancestors: [] },
  { name: 'hover', element: ['hover'], ancestors: ['hover'] },
  { name: 'focus', element: ['focus', 'focus-visible'], ancestors: ['focus-within'] },
  { name: 'active', element: ['hover', 'active'], ancestors: ['hover', 'active'] },
];

/* Runs inside the page. Kept as one function so it is serialised verbatim into Runtime.evaluate. */
function installProbe() {
  const ALLOWED = ['231,14,104', '219,0,91', '254,243,247', '248,183,210'];
  const INTERACTIVE = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=menuitem],[role=option],[role=radio],[role=checkbox],[role=switch],[role=link],[tabindex]:not([tabindex="-1"])';
  const PER_SIGNATURE = 2, MAX_ELEMENTS = 160;

  const flatParent = (node) => node.assignedSlot || node.parentElement || (node.getRootNode && node.getRootNode().host) || null;
  const parse = (value) => {
    const text = String(value || '').trim();
    let m = text.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i);
    if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] == null ? 1 : (m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]) };
    m = text.match(/^color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.e-]+))?\)$/i);
    if (m) return { r: Math.round(m[1] * 255), g: Math.round(m[2] * 255), b: Math.round(m[3] * 255), a: m[4] == null ? 1 : +m[4] };
    return null;
  };
  const coloursIn = (value) => (String(value || '').match(/rgba?\([^)]*\)|color\(srgb[^)]*\)/gi) || []).map(parse).filter(Boolean);
  const over = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const luminance = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const la = luminance(a), lb = luminance(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase() + (c.a < 0.995 ? `@${Math.round(c.a * 100)}%` : '');
  const onList = (c) => c.a < 0.02 || (Math.abs(c.r - c.g) <= 2 && Math.abs(c.g - c.b) <= 2 && Math.abs(c.r - c.b) <= 2) || ALLOWED.includes([c.r, c.g, c.b].map(Math.round).join(','));

  const boxOf = (node) => { let n = node; while (n && getComputedStyle(n).display === 'contents') n = flatParent(n); return n ? n.getBoundingClientRect() : null; };
  /* The colour painted behind a node: every ancestor fill composited down to the white page.
     Returns null when an image or gradient sits in the stack, because its colour cannot be read. */
  const backdrop = (node) => {
    const layers = [], box = boxOf(node), x = box ? box.left + box.width / 2 : 0, y = box ? box.top + box.height / 2 : 0;
    climb: for (let n = node; n; n = flatParent(n)) {
      /* An absolutely positioned earlier sibling (a selected-state tint laid under the label) paints behind too. */
      for (let under = n.previousElementSibling; under; under = under.previousElementSibling) {
        const cs = getComputedStyle(under), c = parse(cs.backgroundColor), opacity = parseFloat(cs.opacity);
        const r = under.getBoundingClientRect();
        if (cs.position !== 'absolute' || !c || c.a * opacity <= 0.02 || !box || x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
        layers.push({ ...c, a: c.a * opacity });
        if (c.a * opacity >= 0.995) break climb;
      }
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none') return null;
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= 0.995) break; }
    }
    let result = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) result = over(layers[i], result);
    return result;
  };
  const opacityOf = (node) => { let o = 1; for (let n = node; n; n = flatParent(n)) o *= parseFloat(getComputedStyle(n).opacity || '1'); return o; };
  const visible = (el) => {
    let box = el;
    while (box && getComputedStyle(box).display === 'contents') box = flatParent(box);
    if (!box || !box.getClientRects().length) return false;
    const r = box.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false;
    for (let n = el; n; n = flatParent(n)) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.05) return false; }
    return true;
  };
  const disabled = (el) => { for (let n = el; n; n = flatParent(n)) { if (n.matches(':disabled,[disabled],[aria-disabled="true"],.ant-btn-disabled,[class*="-disabled"]')) return true; } return false; };

  const flatChildren = (el) => {
    if (el.shadowRoot) return [...el.shadowRoot.childNodes];
    if (el.tagName === 'SLOT') { const assigned = el.assignedNodes({ flatten: true }); return assigned.length ? assigned : [...el.childNodes]; }
    return [...el.childNodes];
  };
  /* Elements that paint ink inside `el`: the flat-tree parent of each text run, plus each icon. */
  const inkCarriers = (el) => {
    const found = new Map();
    const walk = (node, parent) => {
      if (node.nodeType === 3) { if (node.nodeValue.trim()) found.set(parent, 'text'); return; }
      if (node.nodeType !== 1 || node.tagName === 'STYLE' || node.tagName === 'SCRIPT') return;
      if (node.tagName === 'AHA-ICON' || node.tagName === 'svg') { if (!found.has(node)) found.set(node, 'icon'); return; }
      for (const child of flatChildren(node)) walk(child, node);
    };
    for (const child of flatChildren(el)) walk(child, el);
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.value && !/^(range|checkbox|radio|color|file)$/.test(el.type)) found.set(el, 'text');
    return [...found];
  };

  const describe = (el) => {
    const parts = [];
    for (let n = el, depth = 0; n && depth < 3; n = (n.getRootNode && n.getRootNode().host) || null, depth++) {
      const attrs = ['variant', 'size', 'type', 'role', 'status', 'tone'].filter(a => n.hasAttribute(a)).map(a => `[${a}=${n.getAttribute(a)}]`).join('');
      const names = typeof n.className === 'string' ? n.className.trim().split(/\s+/).filter(name => name && !/^css-/.test(name)) : [];
      const cls = names.length ? '.' + names.slice(0, 3).join('.') : '';
      parts.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '') + cls + attrs);
    }
    return parts.join(' » ');
  };

  /* Colours are read as soon as a state is forced, so a transition would hand back a half-way shade. */
  const settle = new CSSStyleSheet();
  settle.replaceSync('*,*::before,*::after{transition:none !important}');
  const all = [];
  const collect = (rootNode) => {
    rootNode.adoptedStyleSheets = [...rootNode.adoptedStyleSheets, settle];
    for (const el of rootNode.querySelectorAll('*')) {
      if (el.matches(INTERACTIVE)) all.push(el);
      if (el.shadowRoot) collect(el.shadowRoot);
    }
  };
  collect(document);
  const perSignature = new Map(), elements = [];
  for (const el of all) {
    if (!visible(el) || disabled(el)) continue;
    const cs = getComputedStyle(el);
    const signature = describe(el) + '|' + cs.color + '|' + cs.backgroundColor;
    const seen = perSignature.get(signature) || 0;
    if (seen >= PER_SIGNATURE || elements.length >= MAX_ELEMENTS) continue;
    perSignature.set(signature, seen + 1); elements.push(el);
  }
  const ancestors = new Set();
  for (const el of elements) for (let n = flatParent(el); n; n = flatParent(n)) ancestors.add(n);
  for (const el of elements) ancestors.delete(el);

  const paint = (el) => {
    const cs = getComputedStyle(el), marks = [];
    if (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) marks.push(...coloursIn(cs.outlineColor));
    if (cs.outlineStyle === 'auto') marks.push({ r: 255, g: 255, b: 255, a: 1 }); // the UA ring is two-tone and getComputedStyle exposes only the dark one
    if (cs.boxShadow !== 'none') marks.push(...coloursIn(cs.boxShadow));
    const border = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none' ? cs.borderTopColor : '';
    return { outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 ? cs.outlineColor + cs.outlineWidth : '', shadow: cs.boxShadow, border, background: cs.backgroundColor, marks, borderColour: parse(border) };
  };
  /* Where a focus indicator can land: the control, the wrappers around it, or a part inside it. */
  const focusSurfaces = (el) => {
    const nodes = [el];
    for (let n = flatParent(el), depth = 0; n && depth < 4; n = flatParent(n), depth++) nodes.push(n);
    const inside = (node) => { for (const child of flatChildren(node)) if (child.nodeType === 1 && nodes.length < 48) { nodes.push(child); inside(child); } };
    inside(el);
    return nodes;
  };
  const rest = new Map(), drawnInvisible = new Set();
  const judgeFocus = (index, outside) => {
    let best = 0, changed = false;
    for (const [node, before] of rest.get(index) || []) {
      if (!node.isConnected) continue;
      const after = paint(node);
      if (after.outline !== before.outline || after.shadow !== before.shadow) { changed = true; for (const c of after.marks) if (c.a > 0.02) best = Math.max(best, ratio(over(c, outside), outside)); }
      if (after.border !== before.border && after.borderColour) { changed = true; best = Math.max(best, ratio(over(after.borderColour, outside), outside)); }
      if (after.background !== before.background) { changed = true; const fill = parse(after.background); if (fill) best = Math.max(best, ratio(over(fill, outside), outside)); }
    }
    return { changed, best };
  };
  const pause = (ms) => new Promise(done => setTimeout(done, ms));

  const measure = async (state) => {
    const findings = [], unresolved = [];
    elements.forEach((el, index) => {
      if (!el.isConnected || !visible(el)) return;
      let deckThemed = false;
      for (let n = el; n && !deckThemed; n = flatParent(n)) deckThemed = !!n.style && [...n.style].some(name => name.startsWith('--aha-deck-'));
      const who = describe(el), label = (el.getAttribute('aria-label') || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 32);
      const report = (kind, detail) => { if (!(kind === 'colour' && deckThemed)) findings.push({ kind, state, who, label, detail }); };

      for (const [carrier, type] of inkCarriers(el)) {
        if (!visible(carrier)) continue;
        const cs = getComputedStyle(carrier);
        const ink = parse(cs.webkitTextFillColor) || parse(cs.color), behind = backdrop(carrier);
        if (!ink || !behind) continue;
        const painted = over({ ...ink, a: ink.a * opacityOf(carrier) }, behind);
        const size = parseFloat(cs.fontSize), large = type === 'icon' || size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
        const need = large ? 3 : 4.5, got = ratio(painted, behind);
        /* Ink that already matches its background at rest is hidden on purpose (an unchecked tick, a
           screen-reader-only label); ink that only vanishes in a state is the defect. */
        if (state === 'rest' && got < 1.03) { drawnInvisible.add(carrier); continue; }
        if (drawnInvisible.has(carrier) && got < 1.03) continue;
        if (got < need) report('contrast', `${type} ${hex(painted)} on ${hex(behind)} is ${got.toFixed(2)}:1, needs ${need}:1`);
        if (!onList(ink)) report('colour', `${type} ink ${hex(ink)} is not on the allowed colour list`);
      }

      const cs = getComputedStyle(el), now = paint(el);
      const fills = [['fill', cs.backgroundColor], ['border', now.border], ['outline', now.outline ? cs.outlineColor : ''], ['shadow', cs.boxShadow === 'none' ? '' : cs.boxShadow]];
      for (const [name, value] of fills) for (const c of coloursIn(value)) if (!onList(c)) report('colour', `${name} ${hex(c)} is not on the allowed colour list`);

      if (state === 'rest') { rest.set(index, focusSurfaces(el).map(n => [n, paint(n)])); return; }
      if (state !== 'focus') return;
      const outside = backdrop(flatParent(el) || el);
      if (!outside) return;
      const { changed, best } = judgeFocus(index, outside);
      if (!changed) unresolved.push({ el, index, outside, report });
      else if (best < 3) report('focus', `focus indicator is ${best.toFixed(2)}:1 against ${hex(outside)}, needs 3:1`);
    });
    /* A control that draws its focus from script (a focus listener setting an attribute) shows nothing
       under a forced pseudo-class, so it is given real focus before it is judged. */
    for (const { el, index, outside, report } of unresolved) {
      try { el.focus({ preventScroll: true, focusVisible: true }); } catch {}
      await pause(120);
      const { changed, best } = judgeFocus(index, outside);
      try { el.blur(); } catch {}
      if (!changed) report('focus', 'keyboard focus draws no outline, ring, border or fill change');
      else if (best < 3) report('focus', `focus indicator is ${best.toFixed(2)}:1 against ${hex(outside)}, needs 3:1`);
    }
    return findings;
  };

  window.__stateCheck = { elements, ancestors: [...ancestors], measure };
  return elements.length;
}

async function nodeIdsOf(command, expression) {
  const handle = await command('Runtime.evaluate', { expression, objectGroup: 'state-check' });
  const properties = await command('Runtime.getProperties', { objectId: handle.result.objectId, ownProperties: true });
  const ids = [];
  for (const property of properties.result) {
    if (!/^\d+$/.test(property.name) || !property.value?.objectId) continue;
    try { ids.push((await command('DOM.requestNode', { objectId: property.value.objectId })).nodeId); } catch {}
  }
  return ids;
}

/** checkStates(fileUrl) → { elements, findings: [{ kind, state, who, label, detail }] } for one built page. */
export async function checkStates(fileUrl, { timeout = 60000 } = {}) {
  return withPage(fileUrl, async (command) => {
    await command('Runtime.evaluate', { awaitPromise: true, expression: `new Promise(function(done){var started=Date.now();(function wait(){var root=document.getElementById('react-root');var settled=document.readyState==='complete'&&(!root||root.childElementCount>0);if(settled||Date.now()-started>40000)setTimeout(done,settled?600:0);else setTimeout(wait,150);})();})` });
    await command('DOM.enable'); await command('CSS.enable');
    await command('DOM.getDocument', { depth: -1, pierce: true });
    const installed = await command('Runtime.evaluate', { expression: `(${installProbe.toString()})()`, returnByValue: true });
    if (installed.exceptionDetails) throw new Error('probe failed: ' + (installed.exceptionDetails.exception?.description || installed.exceptionDetails.text));
    const elementIds = await nodeIdsOf(command, 'window.__stateCheck.elements');
    const ancestorIds = await nodeIdsOf(command, 'window.__stateCheck.ancestors');
    const findings = [];
    for (const state of STATES) {
      for (const nodeId of elementIds) await command('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: state.element });
      for (const nodeId of ancestorIds) await command('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: state.ancestors });
      await sleep(state.name === 'rest' ? 0 : 120);
      const measured = await command('Runtime.evaluate', { expression: `window.__stateCheck.measure(${JSON.stringify(state.name)})`, returnByValue: true, awaitPromise: true });
      if (measured.exceptionDetails) throw new Error('measure failed: ' + (measured.exceptionDetails.exception?.description || measured.exceptionDetails.text));
      findings.push(...(measured.result.value || []));
    }
    const seen = new Set();
    return { elements: elementIds.length, findings: findings.filter(f => { const key = [f.kind, f.state, f.who, f.detail].join('|'); return seen.has(key) ? false : (seen.add(key), true); }) };
  }, { timeout });
}

export const formatFinding = (f) => `${f.state} · ${f.who}${f.label ? ` “${f.label}”` : ''}: ${f.detail}`;

/* Known debt: findings that predate the gate, one entry per element and state so a fixed one cannot hide a new one. */
const BASELINE_PATH = join(root, 'state-check.baseline.json');
const debtKey = (f) => `${f.kind} · ${formatFinding(f)}`;
const readBaseline = () => (existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).debt : {});

/** Every built page that has an index.html, by its dist folder name. */
export const builtPages = (dist = DIST) => readdirSync(dist, { withFileTypes: true }).filter(d => d.isDirectory() && existsSync(join(dist, d.name, 'index.html'))).map(d => d.name);

/**
 * checkPage(slug) → { elements, fresh, known, resolved }: `known` findings are baselined debt; `fresh` ones fail the
 * gate, and so do `resolved` ones, baseline entries the page no longer shows (drop them with --update-baseline).
 */
export async function checkPage(slug, { dist = DIST, baseline = readBaseline() } = {}) {
  /* A page that swaps its own content while it settles drops the probe's context; a fresh load measures it. */
  let measured, lastError;
  for (let attempt = 0; attempt < 3 && !measured; attempt++) {
    try { measured = await checkStates('file://' + join(dist, slug, 'index.html')); } catch (error) { lastError = error; }
  }
  if (!measured) throw lastError;
  const { elements, findings } = measured;
  const debt = new Set(baseline[slug] || []), seen = new Set(findings.map(debtKey));
  return { elements, findings, fresh: findings.filter(f => !debt.has(debtKey(f))), known: findings.filter(f => debt.has(debtKey(f))), resolved: [...debt].filter(key => !seen.has(key)) };
}

/** checkPages(slugs) → { [slug]: checkPage result or { error } }, a few pages at a time. */
export async function checkPages(slugs, { jobs = Number(process.env.STATE_CHECK_JOBS || 3), ...options } = {}) {
  const results = {}; let next = 0;
  const worker = async () => {
    while (next < slugs.length) {
      const slug = slugs[next++];
      try { results[slug] = await checkPage(slug, options); } catch (error) { results[slug] = { error: error.message }; }
    }
  };
  await Promise.all(Array.from({ length: jobs }, worker));
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const wanted = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const pages = builtPages().filter(slug => !wanted.length || wanted.includes(slug));
  const results = await checkPages(pages);
  if (process.argv.includes('--update-baseline')) {
    const debt = { ...readBaseline() };
    for (const slug of pages) {
      if (results[slug].error) continue;
      const keys = [...new Set(results[slug].findings.map(debtKey))].sort();
      if (keys.length) debt[slug] = keys; else delete debt[slug];
    }
    const sorted = Object.fromEntries(Object.keys(debt).sort().map(slug => [slug, debt[slug]]));
    writeFileSync(BASELINE_PATH, JSON.stringify({ $about: 'Interactive-state findings that predate state-check.mjs, per built page. A finding listed here is reported as known debt and does not fail the gate; any other finding does. Fix one, then run node state-check.mjs --update-baseline to drop it; an entry the page no longer shows fails the gate until it is dropped. Never add an entry to make a new finding pass.', debt: sorted }, null, 1) + '\n');
  }
  const baseline = readBaseline();
  let failed = 0, known = 0;
  for (const slug of pages.sort()) {
    const result = results[slug];
    if (result.error) { failed++; console.log(`✗ ${slug}  [could not measure: ${result.error}]`); continue; }
    const debt = new Set(baseline[slug] || []);
    const fresh = result.findings.filter(f => !debt.has(debtKey(f)));
    const seen = new Set(result.findings.map(debtKey)), resolved = [...debt].filter(key => !seen.has(key));
    known += result.findings.length - fresh.length;
    if (fresh.length || resolved.length) failed++;
    console.log(`${fresh.length || resolved.length ? '✗' : '✓'} ${slug}  (${result.elements} interactive element(s)${result.findings.length - fresh.length ? `, ${result.findings.length - fresh.length} known` : ''})`);
    for (const f of fresh) console.log(`      ${f.kind.toUpperCase()}  ${formatFinding(f)}`);
    for (const key of resolved) console.log(`      RESOLVED  ${key} — run node state-check.mjs --update-baseline`);
    if (process.argv.includes('--known')) for (const f of result.findings.filter(f => debt.has(debtKey(f)))) console.log(`      known  ${f.kind.toUpperCase()}  ${formatFinding(f)}`);
  }
  console.log(`\n${pages.length - failed} page(s) pass / ${failed} fail · ${known} known finding(s) in state-check.baseline.json\n`);
  process.exit(failed ? 1 : 0);
}
