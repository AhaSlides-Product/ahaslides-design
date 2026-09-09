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
  chk('≥2 framework snippets', Array.isArray(ct.snippets) && ct.snippets.length >= 2);
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

  // 6b) EVERY component ships a paste-and-run HTML snippet — no exceptions — so end-users can
  //     vibe-code decks/courses/hubs with no build step. LEAF: the custom element is the native
  //     form (the snippet uses <element> directly). COMPOSITE (no framework-free element): a
  //     CDN-React runnable page — React + antd loaded from a CDN so it still opens-and-renders.
  const isLeaf = !!(ct.reuse && ct.reuse.registers) || /leaf/.test(ct.tier || '');
  const html = (ct.snippets || []).find(s => s.key === 'html');
  chk('ships an HTML (paste-and-run) snippet', !!html, 'add a { key:"html" } snippet in parts/<slug>.html.txt — every component needs one');
  if (html) {
    const htmlText = read(join(PDIR, html.file));
    if (isLeaf) {
      chk('HTML snippet imports the DS + uses the element', /@ahaslides-product\/design/.test(htmlText) && new RegExp(`<${ct.element}[\\s>]`).test(htmlText),
        'a leaf HTML snippet must import @ahaslides-product/design and use its custom element');
    } else {
      // composite: a CDN-React page — must consume the DS (e.g. the shared theme) and be runnable
      // (loads React from a CDN, mounts into the DOM), not a hand-styled raw table.
      chk('HTML snippet is a runnable CDN-React page consuming the DS', /@ahaslides-product\/design/.test(htmlText) && /esm\.sh|cdn|unpkg|jsdelivr/i.test(htmlText) && /react/i.test(htmlText),
        'a composite HTML snippet must load React from a CDN and consume @ahaslides-product/design (e.g. the shared theme)');
    }
  }

  // 7) render-gated (qa.mjs measures it; here we just require the block exists)
  chk('carries a `conformance` block (render-gated by qa.mjs)', !!ct.conformance && !!ct.conformance.measure);

  results.push({ slug: ct.slug || ct.name, checks });
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
console.log(`\n${pass} artifact(s) meet the standard / ${fail} fail${warnCount ? ` · ${warnCount} warning(s)` : ''}\n`);
if (!contracts.length && !patterns.length) { console.log('No contracts or patterns found — nothing to gate.'); }
process.exit(fail ? 1 : 0);
