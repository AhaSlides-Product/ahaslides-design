/*
 * screen-lint.mjs — the MECHANICAL composition gate.
 *
 * The mechanical twin of DESIGN-LANGUAGE-JUDGE.md. The judge is an LLM critique of a whole screen;
 * this catches the ZERO-INTERPRETATION subset of the design language statically, so it can hard-fail
 * in CI without a model in the loop. It runs on a CONSUMER SCREEN (a page/view/slide built by
 * reusing this DS) — the DS ships it so every consumer runs the same checker in their own CI, the
 * same way the DS ships the components. Not a substitute for the judge: contrast in the token world,
 * "is this calm", copy quality, right-instrument — none of that is statically decidable and stays
 * the judge's job. This gate only asserts the things a machine can prove.
 *
 * USAGE
 *   node screen-lint.mjs --surface=product  <file ...>
 *   node screen-lint.mjs --surface=canvas   <file ...>
 *   node screen-lint.mjs --self-test                       # dogfood: run over this repo's snippets
 *
 * --surface is REQUIRED and mirrors the judge's J0: you cannot grade a screen without first routing
 * its world. Product UI = fixed violet-on-white; Canvas/Audience = colour/font read from the deck at
 * runtime, so ANY hardcoded colour there is a defect.
 *
 * Escape hatch (auditable, greppable, per-line): name the rule(s) AND give a reason —
 *   ...  <!-- ds-lint-allow: hex,radius (why) -->     or     /* ds-lint-allow: hex (why) *​/
 * It silences only the named rules on that line. A bare `ds-lint-allow` suppresses nothing and is
 * reported as a warning.
 *
 * Programmatic use (pure, no fs/process — Node and Cloudflare workerd):
 *   import { lintHtml } from '@ahaslides-product/design/screen-lint';
 *   lintHtml(source, { surface: 'product' }) // -> { path, findings: [{ rule, line, message, severity }] }
 *
 * Exit code: non-zero if any HARD finding remains. WARN never fails the build (region heuristics).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintHtml } from './lib/screen-lint.js';

const root = dirname(fileURLToPath(import.meta.url));
/* ---- args ---- */
const argv = process.argv.slice(2);
const selfTest = argv.includes('--self-test');
const measure = argv.includes('--measure');   // opt-in: also RENDER each screen at 360/768/1440 and fail on horizontal overflow (needs headless Chrome)
let surface = (argv.find(a => a.startsWith('--surface=')) || '').split('=')[1] || '';
const files = argv.filter(a => !a.startsWith('--'));

/* The measured responsive pass — the render-side twin of the static min-width trap. A real consumer
   SCREEN (not a component showcase) must fit a phone: render it at the 360px floor up and fail if it
   forces a horizontal scroll (documentElement.scrollWidth exceeds the viewport). This is SOUND at the
   screen layer precisely because a screen is a single composed layout — unlike a doc/showcase page
   that packs many wide variants — so overflow here is a real device defect, not demo width. Opt-in
   (`--measure`) and Chrome-gated so the static path stays dependency-free for consumer CI. */
const MEASURE_VIEWPORTS = [
  { label: '360', width: 360, height: 640 },
  { label: '768', width: 768, height: 1024 },
  { label: '1440', width: 1440, height: 900 },
];
async function runMeasure(fileList) {
  const { measureAtViewports } = await import('./cdp.mjs');
  const expr = `(function(){var de=document.documentElement;return {ow:Math.round(de.scrollWidth),cw:de.clientWidth};})()`;
  let hardCount = 0;
  console.log(`\n=== SCREEN-LINT · measured responsive pass (360/768/1440) ===\n`);
  for (const f of fileList) {
    try {
      const r = await measureAtViewports('file://' + f, expr, { viewports: MEASURE_VIEWPORTS, readyExpr: "document.readyState==='complete'", timeout: 45000 });
      const over = MEASURE_VIEWPORTS.filter(v => { const m = r[v.label] || {}; return (m.ow - m.cw) > 1; })
        .map(v => `${v.label}px +${(r[v.label].ow - r[v.label].cw)}`);
      console.log(`${over.length ? '✗' : '✓'} ${f.replace(root + '/', '')}`);
      if (over.length) { hardCount++; console.log(`      ✗ FAIL [overflow] horizontal scroll at ${over.join(', ')} — the screen must reflow to fit the phone floor`); }
      else console.log('      · fits every viewport (no horizontal overflow)');
    } catch (e) {
      hardCount++;
      console.log(`✗ ${f.replace(root + '/', '')}\n      ✗ FAIL [measure] could not render: ${e.message}`);
    }
  }
  console.log(`\n${fileList.length} screen(s) measured · ${hardCount} overflow fail(s)\n`);
  return hardCount;
}

/* ---- runner ---- */
function run(fileList, surf) {
  const results = fileList.map(f => {
    const { findings } = lintHtml(readFileSync(f, 'utf8'), { surface: surf, path: f });
    const asRow = (x) => [x.line ? `L${x.line}` : '—', x.rule, x.message];
    return {
      path: f,
      hard: findings.filter(x => x.severity === 'hard').map(asRow),
      warn: findings.filter(x => x.severity === 'warn').map(asRow),
    };
  });
  let hardCount = 0, warnCount = 0;
  console.log(`\n=== AhaSlides DS — SCREEN-LINT (mechanical gate) · surface: ${surf} ===\n`);
  for (const r of results) {
    const ok = r.hard.length === 0;
    console.log(`${ok ? '✓' : '✗'} ${r.path.replace(root + '/', '')}`);
    if (ok && !r.warn.length) console.log('      · no mechanical defects');
    for (const [ln, id, msg] of r.hard) { hardCount++; console.log(`      ✗ FAIL [${id}] ${ln}: ${msg}`); }
    for (const [ln, id, msg] of r.warn) { warnCount++; console.log(`      ⚠ WARN [${id}] ${ln}: ${msg}`); }
  }
  console.log(`\n${results.length} screen(s) · ${hardCount} hard fail(s) · ${warnCount} warning(s)`);
  console.log('Note: statically-undecidable rules (AA contrast in the token layer, copy quality, right-instrument,');
  console.log('"is this calm") are NOT linted here — run them through DESIGN-LANGUAGE-JUDGE.md.\n');
  return hardCount;
}

/* ---- self-test: dogfood the material/a11y rules over the repo's own snippets + previews ---- */
if (selfTest) {
  const partsDir = join(root, 'parts');
  // Dogfood over the LEAF paste-and-run snippets — the artifact closest to hand-authored consumer
  // screen markup. Excluded: (a) COMPOSITE snippets, which are CDN-React pages that map on-palette DS
  // values into an antd theme object inline (hex is expected there — the same exemption standards.mjs
  // makes by tier; a real screen themes once at the root, not inline); (b) .preview.html harnesses,
  // which are internal qa scaffolds with throwaway demo styling, not consumer output.
  const composite = new Set();
  for (const f of readdirSync(join(root, 'contracts'))) {
    try { const c = JSON.parse(readFileSync(join(root, 'contracts', f), 'utf8')); if (/composite/i.test(c.tier || '')) composite.add(c.slug); } catch {}
  }
  const canvasSlugs = new Set(['canvas', 'audience']);
  const leaf = readdirSync(partsDir).filter(f => f.endsWith('.html.txt'))
    .filter(f => { const slug = f.replace('.html.txt', ''); return !composite.has(slug) && !canvasSlugs.has(slug); });
  console.log(`Self-test: linting ${leaf.length} leaf paste-and-run snippet(s) as product-UI (composite theme pages + preview harnesses excluded).`);
  const hard = run(leaf.map(f => join(partsDir, f)), 'product');
  process.exit(hard > 0 ? 1 : 0);
}

/* ---- normal CLI ---- */
if (!surface || !['product', 'canvas'].includes(surface)) {
  console.error('screen-lint: --surface=product|canvas is REQUIRED (route the world first, like the judge J0).');
  process.exit(2);
}
if (!files.length) {
  console.error('screen-lint: pass one or more files to lint, e.g. node screen-lint.mjs --surface=product page.html');
  process.exit(2);
}
const abs = files.map(f => (f.startsWith('/') ? f : join(process.cwd(), f)));
let hard = run(abs, surface);
if (measure) hard += await runMeasure(abs);   // opt-in render pass — a real screen must fit the phone floor
process.exit(hard > 0 ? 1 : 0);
