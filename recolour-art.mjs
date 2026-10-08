#!/usr/bin/env node
/**
 * recolour-art.mjs — brings DS-owned art onto the allowed colour list, by rule rather than by hand.
 *
 *   illustrations/svg/**      every fill, stroke and gradient stop → Vivid Pink, its two tints, or a grey
 *   logo/*.svg                third-party brand logos → greyscale (the AhaSlides logo and The Splash are skipped)
 *   icons/svg/filetype/*.svg  the one baked brand colour → the DS icon ink, so the glyph follows the text colour
 *
 * The mapping (`toAllowedColour`) is deterministic and idempotent: a colour already on the list is left
 * alone, so re-running after a new Figma or brand import only touches what the import brought in.
 * Run it, then rebuild the registries:
 *
 *   node recolour-art.mjs && node build-icons.mjs && node build-illustrations.mjs
 *   node recolour-art.mjs --check     list what would change, write nothing, exit 1 if anything would
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

const VIVID_PINK = '#E70E68', DARKER_PINK = '#DB005B', PINK_30 = '#F8B7D2', PINK_5 = '#FEF3F7';
export const ALLOWED_COLOURS = [VIVID_PINK, DARKER_PINK, PINK_30, PINK_5];
const ICON_INK = '#4A4A4A';
const OWN_LOGOS = /^(ahaslides-logo|thesplash)/;

const expand = (hex) => { const h = hex.slice(1); return (h.length === 3 || h.length === 4 ? [...h].map(c => c + c).join('') : h).toUpperCase(); };
const grey = (level) => { const v = Math.max(0, Math.min(255, Math.round(level))).toString(16).padStart(2, '0').toUpperCase(); return `#${v}${v}${v}`; };

/**
 * The allowed colour that stands in for `hex` (#RGB, #RRGGBB or #RRGGBBAA; any alpha is kept).
 * `greyscale` forces a grey of the same lightness, the treatment for third-party logos.
 *
 * Purples, magentas, pinks and reds are the old brand family, so they move onto the pink ramp by
 * lightness. Every other hue becomes a grey of the same lightness, which keeps neighbouring shapes
 * apart where sending every hue to pink would flatten them into one silhouette.
 */
export function toAllowedColour(hex, { greyscale = false } = {}) {
  const full = expand(hex), alpha = full.slice(6);
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
  if (ALLOWED_COLOURS.includes(`#${full.slice(0, 6)}`) || (r === g && g === b)) return `#${full.slice(0, 6)}${alpha}`;
  const lightness = 0.299 * r + 0.587 * g + 0.114 * b;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), mid = (max + min) / 510;
  const saturation = max === min ? 0 : (max - min) / 255 / (1 - Math.abs(2 * mid - 1));
  let hue = 0;
  if (max !== min) {
    if (max === r) hue = ((g - b) / (max - min)) % 6; else if (max === g) hue = (b - r) / (max - min) + 2; else hue = (r - g) / (max - min) + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const brandFamily = hue >= 250 || hue < 15;
  if (greyscale || saturation < 0.12 || !brandFamily || mid < 0.2) return grey(lightness) + alpha;
  if (mid >= 0.93) return PINK_5 + alpha;
  if (mid >= 0.75) return PINK_30 + alpha;
  if (mid >= 0.42) return VIVID_PINK + alpha;
  return DARKER_PINK + alpha;
}

const rgbToHex = (text) => { const [r, g, b] = text.match(/\d+/g).map(Number); return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''); };
const NAMED_COLOURS = { red: '#FF0000', blue: '#0000FF', green: '#008000', yellow: '#FFFF00', orange: '#FFA500', purple: '#800080', pink: '#FFC0CB', magenta: '#FF00FF', cyan: '#00FFFF', navy: '#000080', teal: '#008080', gold: '#FFD700' };
const HEX = /(?<![\w(&])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])/g;
const RGB = /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi;
const NAMED = new RegExp(`((?:fill|stroke|stop-color|flood-color)\\s*[=:]\\s*"?)(${Object.keys(NAMED_COLOURS).join('|')})\\b`, 'gi');
/* A filter that tints its input paints a colour too: the three constant terms of an feColorMatrix. */
const MATRIX = /(<feColorMatrix\b[^>]*\bvalues=")([^"]+)(")/gi;
const matrixTint = (values) => {
  const n = values.trim().split(/[\s,]+/).map(Number);
  const constantRows = n.length === 20 && [0, 5, 10].every(row => n.slice(row, row + 4).every(v => v === 0));
  return constantRows ? '#' + [n[4], n[9], n[14]].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('') : null;
};

/** Every colour an SVG paints, as hex: hex and rgb() values, named colours on paint attributes, and filter tints. */
export function coloursInSvg(svg) {
  return [
    ...(svg.match(HEX) || []),
    ...(svg.match(RGB) || []).map(rgbToHex),
    ...[...svg.matchAll(NAMED)].map(m => NAMED_COLOURS[m[2].toLowerCase()]),
    ...[...svg.matchAll(MATRIX)].map(m => matrixTint(m[2])).filter(Boolean),
  ];
}

/** The SVG with every colour from `coloursInSvg` mapped through `map`. url(#id) references are left alone. */
export function recolourSvg(svg, map) {
  return svg
    .replace(MATRIX, (whole, open, values, close) => {
      const tint = matrixTint(values);
      if (!tint) return whole;
      const n = values.trim().split(/[\s,]+/), mapped = expand(map(tint));
      [4, 9, 14].forEach((index, channel) => { n[index] = String(+(parseInt(mapped.slice(channel * 2, channel * 2 + 2), 16) / 255).toFixed(6)); });
      return open + n.join(' ') + close;
    })
    .replace(NAMED, (whole, attribute, name) => attribute + map(NAMED_COLOURS[name.toLowerCase()]))
    .replace(RGB, (colour) => map(rgbToHex(colour)))
    .replace(HEX, (colour) => map(colour));
}

const svgFiles = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? svgFiles(path) : name.endsWith('.svg') ? [path] : [];
});

export const ART_SOURCES = [
  { label: 'illustrations', files: () => svgFiles(join(root, 'illustrations', 'svg')), map: (colour) => toAllowedColour(colour) },
  { label: 'third-party logos', files: () => svgFiles(join(root, 'logo')).filter(path => !OWN_LOGOS.test(path.split('/').pop())), map: (colour) => toAllowedColour(colour, { greyscale: true }) },
  { label: 'file-type icons', files: () => svgFiles(join(root, 'icons', 'svg', 'filetype')), map: (colour) => (/^#(fff|ffffff)$/i.test(colour) ? colour : ICON_INK) },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  let changed = 0;
  for (const { label, files, map } of ART_SOURCES) {
    const paths = files(), touched = [];
    for (const path of paths) {
      const before = readFileSync(path, 'utf8'), after = recolourSvg(before, map);
      if (after === before) continue;
      touched.push(relative(root, path));
      if (!check) writeFileSync(path, after);
    }
    changed += touched.length;
    console.log(`${label}: ${touched.length} of ${paths.length} file(s) ${check ? 'would change' : 'recoloured'}`);
    if (check) for (const path of touched) console.log(`    ${path}`);
  }
  process.exit(check && changed ? 1 : 0);
}
