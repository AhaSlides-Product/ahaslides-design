#!/usr/bin/env node
/**
 * QA loop for the generated design system.
 *  - Static assertions on the generated files (structure + feeds).
 *  - A bounded headless SCREENSHOT render of each page (can't hang) — proves it mounts.
 *  - CONTRACT CONFORMANCE: measures the REAL rendered UI (getComputedStyle via headless
 *    CDP, cdp.mjs) against each contract's `conformance` block. For composites this asserts
 *    BOTH framework tiers hit the contract AND match each other (parity) — the real gate.
 * Prints a PASS/FAIL scorecard; exits non-zero on any FAIL.
 */
import { readdirSync, readFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateInPage } from './cdp.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const DIST = join(root, 'dist');
const CDIR = join(root, 'contracts');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');

function screenshotBytes(file, tag) {
  const out = `/tmp/aha-qa-${tag}.png`;
  try { rmSync(out, { force: true }); } catch {}
  try {
    execFileSync(CHROME, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--virtual-time-budget=12000', `--user-data-dir=/tmp/aha-qa-prof-${tag}`,
      '--window-size=1200,1400', `--screenshot=${out}`, 'file://' + file,
    ], { stdio: 'ignore', timeout: 45000 });   // hard 45s cap — cannot hang
  } catch {}
  return existsSync(out) ? statSync(out).size : 0;
}

/* Measure the rendered UI against a contract.conformance block.
   Composites point at a hidden dual-tier harness (_conformance.html) since the doc page shows
   a single UI; leaf measures the doc page directly. */
async function runConformance(slug, conf, harness) {
  const file = 'file://' + join(DIST, slug, harness ? '_conformance.html' : 'index.html');
  const bad = (v) => Object.keys(conf.expect).filter(k => String(v[k]) !== String(conf.expect[k]));
  const detail = (v, keys) => keys.map(k => `${k}=${v[k]} want ${conf.expect[k]}`).join(', ');
  if (conf.roots) {
    const expr = `(function(){var measure=(${conf.measure});var roots=${JSON.stringify(conf.roots)};var out={};roots.forEach(function(r){out[r]=measure(r);});return out;})()`;
    const res = await evaluateInPage(file, expr, { readyExpr: conf.ready, timeout: 45000 });
    const perRoot = conf.roots.map(r => ({ root: r, bad: bad(res[r] || {}), v: res[r] || {} }));
    const keys = Object.keys(conf.expect);
    const parity = keys.every(k => new Set(conf.roots.map(r => String((res[r] || {})[k]))).size === 1);
    return { roots: true, perRoot, parity, detail };
  }
  const res = await evaluateInPage(file, conf.measure, { readyExpr: conf.ready, timeout: 45000 });
  return { roots: false, bad: bad(res), res, detail };
}

const results = [];
const chk = (list, name, cond, note = '') => list.push([name, !!cond, cond ? '' : note]);

/* ---- global feeds ---- */
const g = [];
chk(g, 'variables.css has canonical tokens', /--aha-color-primary:#6A1EBB/i.test(read(join(DIST,'variables.css'))) && /--aha-radius-default:8px/.test(read(join(DIST,'variables.css'))));
chk(g, 'variables.css clean (no Google Fonts / no Inter)', !/googleapis|\bInter\b/.test(read(join(DIST,'variables.css'))));
chk(g, 'design.md carries brand + architecture', /#6A1EBB/.test(read(join(DIST,'design.md'))) && /Leaf primitives/.test(read(join(DIST,'design.md'))));
{ const dm = read(join(DIST,'design.md'));
  chk(g, 'design.md carries full palette (primitive ramps + semantic tables)',
    /primitive ramps/i.test(dm) && /--aha-btn-encourage-bg/.test(dm) && /--aha-brand-13/.test(dm) && /`100`/.test(dm)); }
chk(g, 'index.html present', read(join(DIST,'index.html')).length > 400);
chk(g, 'llms.txt lists Checkbox + Table', /Checkbox/.test(read(join(DIST,'llms.txt'))) && /Table/.test(read(join(DIST,'llms.txt'))));
chk(g, 'llms-full.txt non-empty', read(join(DIST,'llms-full.txt')).length > 400);
chk(g, 'design-tokens.html styled in shell', /class="doc-nav"/.test(read(join(DIST,'design-tokens.html'))) && /--aha-color-primary:#6A1EBB/i.test(read(join(DIST,'design-tokens.html'))));
{ const fp = read(join(DIST,'feeds','llms-txt.html'));
  chk(g, 'feed pages: in-shell + raw content in code wrapper', /class="doc-nav"/.test(fp) && /class="code-panel feed"/.test(fp) && /Checkbox/.test(fp)); }
results.push({ slug: '(global feeds)', checks: g });

/* ---- contracts (tier + conformance) ---- */
const contracts = {};
for (const f of readdirSync(CDIR).filter(f => f.endsWith('.json'))) { const j = JSON.parse(readFileSync(join(CDIR, f), 'utf8')); contracts[j.slug] = j; }

/* ---- per component ---- */
const NON_COMPONENT_DIRS = new Set(['feeds', 'fonts']);  // generated support dirs, not components
const slugs = readdirSync(DIST, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.') && !NON_COMPONENT_DIRS.has(d.name)).map(d => d.name);
for (const slug of slugs) {
  const c = [];
  const ct = contracts[slug];
  const isLeaf = ct && /leaf/.test(ct.tier || '');
  const html = read(join(DIST, slug, 'index.html'));
  const md = read(join(DIST, slug, `${slug}.md`));
  let aj = null; try { aj = JSON.parse(read(join(DIST, slug, `${slug}.agent.json`))); } catch {}

  chk(c, 'md feed non-empty', md.length > 150);
  chk(c, 'agent.json valid', !!aj);
  chk(c, 'agent.json ≥2 snippets', aj && Object.keys(aj.snippets||{}).length >= 2);
  chk(c, 'agent.json has props', aj && (aj.props||[]).length > 0);
  chk(c, 'agent.json carries opinion + surfaces', aj && aj.opinion && Array.isArray(aj.surfaces) && aj.surfaces.length > 0);
  chk(c, 'page: generated banner', /generated from contracts/.test(html));
  chk(c, 'page: single rendered UI (no stacked framework versions)', (/<aha-/.test(html) || /id="react-root"/.test(html)) && !(/id="react-root"/.test(html) && /id="vue-root"/.test(html)));
  chk(c, 'page: code widget (tabs + copy)', /class="tab /.test(html) && /class="copy"/.test(html));
  chk(c, 'page: no hardcoded google fonts / Inter', !/googleapis|\bInter\b/.test(html));

  const bytes = screenshotBytes(join(DIST, slug, 'index.html'), slug);
  chk(c, `page renders (screenshot ${(bytes/1024|0)}KB > 30KB)`, bytes > 30000);

  /* the visible doc demo must actually mount (harness conformance below measures a
     separate file, so this guards against a blank demo on the page the user reads) */
  if (ct && ct.conformancePart && ct.conformance && ct.conformance.docReady) {
    try {
      const ok = await evaluateInPage('file://' + join(DIST, slug, 'index.html'), ct.conformance.docReady, { readyExpr: ct.conformance.docReady, timeout: 45000 });
      chk(c, 'doc page demo mounts (single UI renders)', !!ok);
    } catch (e) { chk(c, 'doc page demo mounts (single UI renders)', false, e.message); }
  }

  /* the real gate — measured rendered UI vs the contract */
  if (ct && ct.conformance) {
    try {
      const r = await runConformance(slug, ct.conformance, ct.conformancePart);
      if (r.roots) {
        for (const pr of r.perRoot) chk(c, `contract conformance ${pr.root}`, pr.bad.length === 0, r.detail(pr.v, pr.bad));
        chk(c, 'React ≡ Vue render parity', r.parity, 'rendered values differ across frameworks');
      } else {
        chk(c, 'contract conformance (rendered UI matches spec)', r.bad.length === 0, r.detail(r.res, r.bad));
      }
    } catch (e) {
      chk(c, 'contract conformance (rendered UI matches spec)', false, e.message);
    }
  } else {
    chk(c, 'contract has a conformance block', false, 'no conformance in contract — gate is blind to the rendered UI');
  }
  results.push({ slug, checks: c });
}

/* ---- report ---- */
let pass = 0, fail = 0;
console.log('\n=== AhaSlides DS — QA scorecard ===\n');
for (const r of results) {
  const ok = r.checks.every(x => x[1]);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} ${r.slug}`);
  for (const [n, v, note] of r.checks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}${!v && note ? `  [${note}]` : ''}`);
}
console.log(`\n${pass} group(s) pass / ${fail} fail\n`);
process.exit(fail ? 1 : 0);
