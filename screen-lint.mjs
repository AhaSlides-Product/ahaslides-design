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
 * Escape hatch (auditable, greppable, per-line — same contract as standards.mjs):
 *   ...  <!-- ds-lint-allow: hex,radius (why) -->     or     /* ds-lint-allow: hex (why) *​/
 *
 * Exit code: non-zero if any HARD finding remains. WARN never fails the build (region heuristics).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const RADIUS_SCALE = new Set([0, 4, 6, 8, 12, 16, 999, 9999]);   // 4/6/8/12/16 + pill

/* ---- args ---- */
const argv = process.argv.slice(2);
const selfTest = argv.includes('--self-test');
let surface = (argv.find(a => a.startsWith('--surface=')) || '').split('=')[1] || '';
const files = argv.filter(a => !a.startsWith('--'));

/* CSS-value contexts we scan for colour/gradient/radius/font — avoids hex in a URL, id, or href. */
const COLOR_PROP = /(?:^|[;{"'\s])(?:color|background(?:-color|-image)?|fill|stroke|border(?:-[a-z]+)?|box-shadow|outline|caret-color)\s*:/i;
const styleText = (line) => {
  // Scan the line ONCE if it carries CSS (an inline style attr, a colour attribute like the badge
  // `color="…"`, or a bare CSS property in a <style>/theme block). Scanning the whole line once —
  // rather than the attr AND the line — avoids double-reporting the same hit.
  if (/style\s*=|(?:^|[\s;{])color\s*=|border-radius|font-size|font-family|gradient/i.test(line) || COLOR_PROP.test(line))
    return line;
  return '';
};
// strip var(--aha-…, #fallback) so a token fallback is never mistaken for a bare literal
const stripVars = (s) => s.replace(/var\([^)]*\)/gi, ' ');

/* ---- the rules ---- */
// severity: 'hard' fails the build; 'warn' never does. `worlds`: which surface(s) it applies to.
function lintFile(path, text, surf) {
  const lines = text.split(/\r?\n/);
  const hard = [], warn = [];
  let primaryCount = 0;

  lines.forEach((raw, i) => {
    const L = `L${i + 1}`;
    const allowM = raw.match(/ds-lint-allow:\s*([a-z,\s]+)/i);
    const allow = allowM ? allowM[1].toLowerCase() : '';
    const ok = (r) => allow.includes(r);
    const css = stripVars(styleText(raw));

    /* ---- shared HARD ---- */
    // gradient on a background/fill (border-image AI-affordance is the documented exception)
    if (!ok('gradient') && /(linear|radial|conic)-gradient/i.test(css)
        && /(background|fill)/i.test(css) && !/border-image|mask/i.test(css))
      hard.push([`${L}`, 'gradient-fill', 'gradient on a background/fill — backgrounds are flat; only a border-image AI-affordance may gradient']);

    // off-scale border-radius
    if (!ok('radius'))
      for (const m of css.matchAll(/border-radius\s*:\s*([0-9.]+)px/gi))
        if (!RADIUS_SCALE.has(parseFloat(m[1])))
          hard.push([`${L}`, 'radius-off-scale', `border-radius ${m[1]}px is off the 4/6/8/12/16 scale`]);

    // icon-only interactive control with no accessible name
    const iconOnlyBtn = /<aha-button\b[^>]*\bicon-only\b[^>]*>/i.test(raw);
    const bareIconBtn = /<button\b[^>]*>\s*(?:<aha-icon\b|<svg\b|<i\b)[^<]*(?:<\/aha-icon>|<\/svg>|<\/i>)?\s*<\/button>/i.test(raw);
    if (!ok('a11y') && (iconOnlyBtn || bareIconBtn)
        && !/aria-label\s*=|aria-labelledby\s*=|title\s*=/i.test(raw))
      hard.push([`${L}`, 'icon-only-no-name', 'icon-only control has no accessible name — add aria-label (X2)']);

    /* ---- world-specific colour ---- */
    const hexes = (css.match(/#[0-9A-Fa-f]{3,8}\b/g) || []);
    const funcs = (css.match(/\b(?:rgba?|hsla?)\s*\(/gi) || []);
    if (surf === 'canvas') {
      // Canvas/Audience: colour + font come from the deck (xprops) at runtime — nothing hardcoded.
      if (!ok('hex') && (hexes.length || funcs.length))
        hard.push([`${L}`, 'canvas-hardcoded-colour', `hardcoded colour ${(hexes[0] || funcs[0])} — canvas colour must read from the deck theme (xprops), never a literal (C1)`]);
      for (const m of css.matchAll(/font-size\s*:\s*([^;}"']*)/gi)) {
        const v = m[1];
        if (/[\d.](?:vw|vh|vmin|vmax)\b|clamp\(/i.test(v))
          hard.push([`${L}`, 'canvas-viewport-font', `font-size ${v.trim()} uses a viewport unit/clamp — resolves wrong under the stage transform (CV4)`]);
        const px = (v.match(/([0-9.]+)px/) || [])[1];
        if (px && parseFloat(px) < 16)
          hard.push([`${L}`, 'canvas-tiny-font', `font-size ${px}px is below the 16px canvas floor — illegible from the back of the room (CV4)`]);
      }
      if (!ok('font') && /font-family\s*:/i.test(css))
        warn.push([`${L}`, 'canvas-hardcoded-font', 'font-family literal on canvas — font should read from the deck theme (xprops)']);
    } else {
      // Product UI: colour binds to a --aha-* token; a bare hex is a defect (border-image excepted).
      if (!ok('hex'))
        for (const h of hexes)
          hard.push([`${L}`, 'raw-hex', `bare hex ${h} — bind to a token: var(--aha-…, ${h})`]);
      // the product type scale is weights 400/600 ONLY — 500/700/bold are off-scale
      if (!ok('weight'))
        for (const m of css.matchAll(/font-weight\s*:\s*(\d{3}|bold(?:er)?)\b/gi)) {
          const w = m[1].toLowerCase();
          const n = /^bold/.test(w) ? 700 : parseInt(w, 10);
          if (n !== 400 && n !== 600)
            hard.push([`${L}`, 'off-scale-weight', `font-weight ${m[1]} — the type scale is 400/600 only (PU10)`]);
        }
    }

    /* ---- product-UI region heuristics (WARN — never fail; meaningless on a component snippet) ---- */
    if (surf === 'product') {
      if (/\b(?:variant|type)\s*=\s*["']primary["']|class\s*=\s*["'][^"']*\bprimary[^"']*btn/i.test(raw)) primaryCount++;
      // box-in-a-box: a bordered/card container whose style also sits on a line that opens another
      if (/border\s*:|box-shadow\s*:|class\s*=\s*["'][^"']*\bcard\b/i.test(raw)
          && /<[a-z][^>]*(border\s*:|box-shadow\s*:|class\s*=\s*["'][^"']*\bcard\b)[^>]*>.*<[a-z][^>]*(border\s*:|box-shadow\s*:|\bcard\b)/i.test(raw))
        warn.push([`${L}`, 'box-in-box', 'a bordered/card container nested directly inside another — hierarchy is space, not nested boxes (PU2)']);
    }
  });

  if (surf === 'product' && primaryCount > 1)
    warn.push(['—', 'multi-primary', `${primaryCount} primary actions detected — a view has ONE loud action (PU1). (heuristic: ignore if these are separate regions/a component demo)`]);

  // one finding per (line, rule, message) — a hit seen in >1 CSS context is still one defect
  const uniq = (arr) => [...new Map(arr.map(f => [f.join('|'), f])).values()];
  return { path, hard: uniq(hard), warn: uniq(warn) };
}

/* ---- runner ---- */
function run(fileList, surf) {
  const results = fileList.map(f => lintFile(f, readFileSync(f, 'utf8'), surf));
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
process.exit(run(files.map(f => (f.startsWith('/') ? f : join(process.cwd(), f))), surface) > 0 ? 1 : 0);
