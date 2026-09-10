#!/usr/bin/env node
/**
 * build-illustrations.mjs — the ILLUSTRATION source step (the twin of build-icons.mjs).
 *
 * Reads the raw multi-colour spot-art SVGs exported from Figma (Oldies library section,
 * file P764iQ6y4ZwW7W3f7FLZyW) under illustrations/svg/<family>/<name>.svg and normalises
 * them into ONE registry:
 *
 *   illustrations/registry.json   { name → { family, viewBox, body, w, h } }
 *
 * Normalisation makes every illustration safe to inline — WITHOUT recolouring it (unlike an
 * icon, an illustration keeps its own multi-colour palette; there is no #4A4A4A → currentColor
 * rebind here). What it strips is the Figma export noise:
 *   - the leading placeholder canvas <rect fill="#E1E1E1"> (the Oldies board background)
 *   - the "Oldies" page-frame chrome: any <path>/<rect> whose geometry lands far outside the
 *     viewBox (the giant frame rounded-rect + the oversized white card behind each spot)
 *   - <clipPath> defs and every clip-path="…" reference (bounding-box noise)
 *   - <defs> entirely when nothing but clip-paths lived there; a <defs> that still holds a real
 *     gradient (linear/radial) is KEPT so the art's gradient fills resolve
 *   - id= attributes (no cross-illustration id collisions when many are inlined) and <g> wrappers
 *
 * The registry is the single source the <aha-illustration> runtime + the agent feeds are
 * generated from. Re-run whenever the SVGs change:  node build-illustrations.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const SVGDIR = join(root, 'illustrations', 'svg');
const OUT = join(root, 'illustrations', 'registry.json');
const LIB = join(root, 'lib');
const OUTLIER = -40;   // any coordinate below this is page-frame chrome, never real art (art lives in 0..W/H)

// A single <path …/> or <rect …/> element that carries a coordinate far outside the viewBox is the
// Oldies board chrome (the frame rounded-rect + the oversized white card), not the illustration.
function isFrameChrome(el) {
  const nums = (el.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  return nums.some(n => n < OUTLIER);
}

function normalise(raw) {
  const svgOpen = raw.match(/<svg[^>]*>/i)?.[0] || '';
  const viewBox = (svgOpen.match(/viewBox="([^"]+)"/) || [, '0 0 24 24'])[1];
  const [, , , vbW, vbH] = viewBox.split(/\s+/).map(Number).length === 4
    ? [0, 0, 0, ...[]] : [];
  const parts = viewBox.split(/\s+/).map(Number);
  const w = Math.round(parts[2] || Number(svgOpen.match(/width="([\d.]+)"/)?.[1]) || 24);
  const h = Math.round(parts[3] || Number(svgOpen.match(/height="([\d.]+)"/)?.[1]) || 24);

  // 1) isolate the inner markup (drop the root <svg> open/close)
  let inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');

  // 2) split off <defs>; keep only real gradients (clipPaths are noise)
  let keptDefs = '';
  inner = inner.replace(/<defs>([\s\S]*?)<\/defs>/gi, (_, body) => {
    const grads = body.match(/<(linear|radial)Gradient[\s\S]*?<\/\1Gradient>/gi) || [];
    if (grads.length) keptDefs += grads.join('');
    return '';   // remove the original defs block from the flow
  });

  // 3) drop the leading placeholder canvas rect (Figma "Oldies" board background)
  inner = inner.replace(/<rect\b[^>]*fill="#E1E1E1"[^>]*\/>/i, '');

  // 4) remove the page-frame chrome — any <path/> or <rect/> that reaches far outside the viewBox
  inner = inner
    .replace(/<path\b[^>]*\/>/gi, (el) => (isFrameChrome(el) ? '' : el))
    .replace(/<rect\b[^>]*\/>/gi, (el) => (isFrameChrome(el) ? '' : el));

  // 5) unwrap groups, drop clip-path refs + ids (safe to inline many at once), tidy whitespace
  inner = inner
    .replace(/<\/?g\b[^>]*>/gi, '')
    .replace(/\sclip-path="[^"]*"/gi, '')
    .replace(/\sid="[^"]*"/gi, '')
    .replace(/>\s+</g, '><')
    .trim();

  const body = keptDefs ? `<defs>${keptDefs}</defs>${inner}` : inner;
  return { viewBox, body, w, h };
}

const families = readdirSync(SVGDIR).filter(f => statSync(join(SVGDIR, f)).isDirectory());
const illustrations = {};
let n = 0;
for (const fam of families.sort()) {
  const dir = join(SVGDIR, fam);
  for (const file of readdirSync(dir).filter(f => f.endsWith('.svg')).sort()) {
    const name = file.replace(/\.svg$/, '');
    const svg = readFileSync(join(dir, file), 'utf8');
    if (/<image\b|xlink:href|data:image/i.test(svg)) {   // raster inside → not a pure-SVG illustration
      console.warn(`  ! skipped (embeds raster, not pure-SVG): ${fam}/${name}`);
      continue;
    }
    const { viewBox, body, w, h } = normalise(svg);
    if (!body) { console.warn(`  ! empty body: ${fam}/${name}`); continue; }
    illustrations[name] = { family: fam, viewBox, body, w, h };
    n++;
  }
}

const registry = {
  $generatedFrom: 'Figma · Oldies library · file P764iQ6y4ZwW7W3f7FLZyW (multi-colour spot illustrations)',
  $note: 'Single source for <aha-illustration>. Do not edit by hand — re-run build-illustrations.mjs after changing illustrations/svg/**.',
  families: families.sort(),
  count: n,
  illustrations,
};
writeFileSync(OUT, JSON.stringify(registry, null, 2) + '\n');

// Also emit the ESM registry the published package imports (pure JS — works in Node and the browser).
mkdirSync(LIB, { recursive: true });
writeFileSync(join(LIB, 'illustrations-registry.js'),
  `// Generated by build-illustrations.mjs from ${registry.$generatedFrom}. Do not edit by hand.\n` +
  `export const meta = ${JSON.stringify({ generatedFrom: registry.$generatedFrom, families: registry.families, count: registry.count })};\n` +
  `export const illustrations = ${JSON.stringify(illustrations)};\n` +
  `export default illustrations;\n`);

console.log(`illustrations registry → ${OUT} + lib/illustrations-registry.js\n  ${n} illustrations across ${families.length} families: ${families.join(', ')}`);
