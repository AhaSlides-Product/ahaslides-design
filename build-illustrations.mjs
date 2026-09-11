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
 * FIDELITY FIRST. An illustration is multi-colour art, NOT a themeable glyph — so unlike an
 * icon this NEVER recolours (no #4A4A4A → currentColor rebind) and, crucially, it preserves the
 * art's own rendering machinery: the FULL <defs> (gradients, filters, masks, clipPaths), every
 * <g> and its opacity / transform / mask / filter / clip-path, and all id="…"/url(#…) references.
 * The Figma node export bakes the whole "Oldies" board around each spot (a #E1E1E1 background,
 * the board's frame rounded-rect + a giant white card, all at coordinates far outside the spot's
 * own viewBox). Those — and ONLY those — are stripped:
 *   - the leading full-viewBox placeholder <rect fill="#E1E1E1"> (the board background), and
 *   - any self-closing <path/> / <rect/> whose geometry blows far past the frame (|coord| beyond
 *     4× the longer viewBox edge — the board border + the oversized white card). Real art lives
 *     within ~0..w/h, so 4× is a wide, safe margin that never clips the illustration itself.
 * Everything else is kept byte-for-byte, so the inlined body renders exactly as Figma shows it
 * (minus the grey board). ids are safe to keep: each <aha-illustration> renders in its OWN shadow
 * root, so url(#…) references can't collide across illustrations inlined on one page.
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

function normalise(raw) {
  const svgOpen = raw.match(/<svg[^>]*>/i)?.[0] || '';
  const viewBox = (svgOpen.match(/viewBox="([^"]+)"/) || [, '0 0 24 24'])[1];
  const parts = viewBox.split(/\s+/).map(Number);
  const w = Math.round(parts[2] || Number(svgOpen.match(/width="([\d.]+)"/)?.[1]) || 24);
  const h = Math.round(parts[3] || Number(svgOpen.match(/height="([\d.]+)"/)?.[1]) || 24);

  // isolate the inner markup (drop the root <svg> open/close) — keep EVERYTHING else intact
  let inner = raw
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')
    .replace(/<\/svg>\s*$/i, '');

  // Strip the "Oldies" board chrome by its SPECIFIC identity, never by coordinate magnitude (art
  // is exported as large-coord paths inside scaling <g transform> groups, so magnitude is not a
  // board signal). The board is three things and only three:
  //   (a) the full-viewBox #E1E1E1 background rect,
  //   (b) the #D5D5D5-fill frame border path(s) — a grey only the board uses, and
  //   (c) the oversized white "card" rect(s) — a <rect> far larger than the spot's own frame.
  // Every real art element (any colour, any coordinate, grouped or not) is kept untouched.
  inner = inner
    .replace(/<rect\b[^>]*fill="#E1E1E1"[^>]*\/>/gi, '')
    .replace(/<path\b[^>]*fill="#D5D5D5"[^>]*\/>/gi, '')
    .replace(/<rect\b[^>]*\/>/gi, (el) => {
      const rw = Number(el.match(/width="([\d.]+)"/)?.[1] || 0);
      const rh = Number(el.match(/height="([\d.]+)"/)?.[1] || 0);
      return (rw > w * 3 || rh > h * 3) ? '' : el;   // the board card dwarfs the frame
    });

  // tidy inter-tag whitespace only — do NOT touch <defs>, <g>, opacity, transform, ids, url(#…)
  inner = inner.replace(/>\s+</g, '><').trim();
  return { viewBox, body: inner, w, h };
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
