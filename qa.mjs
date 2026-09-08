#!/usr/bin/env node
/**
 * QA loop for the generated design system.
 *  - Static assertions on the generated files (structure + feeds).
 *  - A bounded headless SCREENSHOT render of each page (hard timeout, can't hang);
 *    a mounted page yields a substantial PNG, a blank/crashed one is tiny.
 * Prints a PASS/FAIL scorecard; exits non-zero on any FAIL.
 */
import { readdirSync, readFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const DIST = join(root, 'dist');
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

const results = [];
const chk = (list, name, cond) => list.push([name, !!cond]);

/* ---- global feeds ---- */
const g = [];
chk(g, 'variables.css has canonical tokens', /--aha-color-primary:#6A1EBB/i.test(read(join(DIST,'variables.css'))) && /--aha-radius-default:8px/.test(read(join(DIST,'variables.css'))));
chk(g, 'variables.css clean (no Google Fonts / no Inter)', !/googleapis|\bInter\b/.test(read(join(DIST,'variables.css'))));
chk(g, 'design.md carries brand + architecture', /#6A1EBB/.test(read(join(DIST,'design.md'))) && /Leaf primitives/.test(read(join(DIST,'design.md'))));
chk(g, 'index.html present', read(join(DIST,'index.html')).length > 400);
chk(g, 'llms.txt lists Checkbox + Table', /Checkbox/.test(read(join(DIST,'llms.txt'))) && /Table/.test(read(join(DIST,'llms.txt'))));
chk(g, 'llms-full.txt non-empty', read(join(DIST,'llms-full.txt')).length > 400);
results.push({ slug: '(global feeds)', checks: g });

/* ---- per component ---- */
const slugs = readdirSync(DIST, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('.')).map(d => d.name);
for (const slug of slugs) {
  const c = [];
  const html = read(join(DIST, slug, 'index.html'));
  const md = read(join(DIST, slug, `${slug}.md`));
  let aj = null; try { aj = JSON.parse(read(join(DIST, slug, `${slug}.agent.json`))); } catch {}

  chk(c, 'md feed non-empty', md.length > 150);
  chk(c, 'agent.json valid', !!aj);
  chk(c, 'agent.json ≥2 snippets', aj && Object.keys(aj.snippets||{}).length >= 2);
  chk(c, 'agent.json has props', aj && (aj.props||[]).length > 0);
  chk(c, 'agent.json carries opinion + surfaces', aj && aj.opinion && Array.isArray(aj.surfaces) && aj.surfaces.length > 0);
  chk(c, 'page: generated banner', /generated from contracts/.test(html));
  chk(c, 'page: both framework roots', /id="react-root"/.test(html) && /id="vue-root"/.test(html));
  chk(c, 'page: code widget (tabs + copy)', /class="tab /.test(html) && /class="copy"/.test(html));
  chk(c, 'page: no hardcoded google fonts / Inter', !/googleapis|\bInter\b/.test(html));

  const bytes = screenshotBytes(join(DIST, slug, 'index.html'), slug);
  chk(c, `page renders (screenshot ${(bytes/1024|0)}KB > 30KB)`, bytes > 30000);
  results.push({ slug, checks: c });
}

/* ---- report ---- */
let pass = 0, fail = 0;
console.log('\n=== AhaSlides DS — QA scorecard ===\n');
for (const r of results) {
  const ok = r.checks.every(x => x[1]);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} ${r.slug}`);
  for (const [n, v] of r.checks) console.log(`      ${v ? '·' : '✗ FAIL:'} ${n}`);
}
console.log(`\n${pass} group(s) pass / ${fail} fail\n`);
process.exit(fail ? 1 : 0);
