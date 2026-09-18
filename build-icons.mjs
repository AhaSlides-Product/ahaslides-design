#!/usr/bin/env node
/**
 * build-icons.mjs — the icon SOURCE step.
 *
 * Reads the raw SVGs imported from Figma (Design System V3 · node 50699-7126) under
 * icons/svg/<family>/<name>.svg and normalises them into ONE registry:
 *
 *   icons/registry.json   { name → { family, viewBox, body, recolorable } }
 *
 * Normalisation makes every glyph safe to inline and theme:
 *   - strip <defs>/<clipPath> and the clip wrappers (Figma bounding-box noise)
 *   - unwrap <g>, drop id= / clip-path= (no cross-icon id collisions when inlined)
 *   - rebind the DS icon ink #4A4A4A → currentColor  (so colour follows the text colour)
 *   - keep any *baked brand* colour (filetype glyphs) untouched → recolorable:false
 *
 * The registry is the single source the <aha-icon> runtime + the gallery + the agent
 * feeds are generated from. Re-run whenever the SVGs change:  node build-icons.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const SVGDIR = join(root, 'icons', 'svg');
const OUT = join(root, 'icons', 'registry.json');
const LIB = join(root, 'lib');   // the importable package entry points
const DS_INK = /#4a4a4a/gi;   // the Design System V3 icon default ink → currentColor

function normalise(svg) {
  const viewBox = (svg.match(/viewBox="([^"]+)"/) || [, '0 0 24 24'])[1];
  let inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, '')   // drop everything up to and incl. the root <svg>
    .replace(/<\/svg>\s*$/i, '')
    .replace(/<defs[\s\S]*?<\/defs>/gi, '')       // clip defs — bounding-box noise
    .replace(/<clipPath[\s\S]*?<\/clipPath>/gi, '')
    .replace(/<\/?g\b[^>]*>/gi, '')               // unwrap groups
    .replace(/\sclip-path="[^"]*"/gi, '')         // dangling clip refs
    .replace(/\sid="[^"]*"/gi, '')                // no id collisions when many are inlined
    .replace(DS_INK, 'currentColor')              // theme the ink
    .replace(/>\s+</g, '><')
    .trim();
  const recolorable = /currentColor/.test(inner) && !/#[0-9a-f]{3,8}/i.test(inner);
  return { viewBox, body: inner, recolorable };
}

// An icon name must be kebab-case (lowercase, digits, single hyphens) — the one form a consumer can
// GUESS. A capitalised or &-bearing name (system-Medal, system-q&a) can't be guessed, so a consumer
// types the kebab form, misses, and ships a broken icon. This is enforced at the SOURCE so a future
// Figma import can't reintroduce one: an off-form filename fails the build here, loudly.
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const families = readdirSync(SVGDIR).filter(f => statSync(join(SVGDIR, f)).isDirectory());
const icons = {};
const offForm = [];
let n = 0;
for (const fam of families.sort()) {
  const dir = join(SVGDIR, fam);
  for (const file of readdirSync(dir).filter(f => f.endsWith('.svg')).sort()) {
    const name = file.replace(/\.svg$/, '');
    if (!KEBAB.test(name)) { offForm.push(`${fam}/${file}`); continue; }
    const { viewBox, body, recolorable } = normalise(readFileSync(join(dir, file), 'utf8'));
    if (!body) { console.warn(`  ! empty body: ${fam}/${name}`); continue; }
    icons[name] = { family: fam, viewBox, body, recolorable };
    n++;
  }
}
if (offForm.length) {
  console.error(`\n✗ icon build failed — ${offForm.length} icon name(s) are not kebab-case (un-guessable, so consumers get them wrong):`);
  for (const f of offForm) console.error(`    ${f}  →  rename to lowercase-hyphenated (e.g. system-arrow-circle-up)`);
  console.error('  Kebab-case is the only guessable form. Rename the SVG (and add a back-compat alias below if a consumer already references the old spelling).\n');
  process.exit(1);
}

// Back-compat aliases — glyphs renamed to kebab-case. The kebab name is canonical; each
// deprecated spelling still resolves so a consumer that referenced the old (working) name doesn't
// silently break while it migrates. Remove an entry once no consumer references the old spelling.
const ALIASES = {
  'system-Medal': 'system-medal',
  'system-PaperPlaneTilt': 'system-paper-plane-tilt',
  'system-arrowCircleUp': 'system-arrow-circle-up',
  'system-q&a': 'system-qa',
};
for (const [oldName, canon] of Object.entries(ALIASES)) {
  if (icons[canon]) { icons[oldName] = { ...icons[canon], aliasOf: canon }; n++; }
  else console.warn(`  ! alias skipped: ${oldName} → ${canon} (canonical glyph not found)`);
}

const registry = {
  $generatedFrom: 'Figma · Design System V3 · node 50699-7126 (Icon & Illustration)',
  $note: 'Single source for <aha-icon>. Do not edit by hand — re-run build-icons.mjs after changing icons/svg/**.',
  families: families.sort(),
  count: n,
  icons,
};
writeFileSync(OUT, JSON.stringify(registry, null, 2) + '\n');

/* Also emit the ESM registry the published package imports (pure JS — no JSON-import assertions,
   works identically in Node and the browser). This is what `@ahaslides-product/design/icons` consumes. */
mkdirSync(LIB, { recursive: true });
writeFileSync(join(LIB, 'icons-registry.js'),
  `// Generated by build-icons.mjs from ${registry.$generatedFrom}. Do not edit by hand.\n` +
  `export const meta = ${JSON.stringify({ generatedFrom: registry.$generatedFrom, families: registry.families, count: registry.count })};\n` +
  `export const icons = ${JSON.stringify(icons)};\n` +
  `export default icons;\n`);

console.log(`icons registry → ${OUT} + lib/icons-registry.js\n  ${n} glyphs across ${families.length} families: ${families.join(', ')}`);
