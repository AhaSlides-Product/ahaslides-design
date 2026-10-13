#!/usr/bin/env node
/**
 * recolour-art.mjs — brings DS-owned art onto the allowed colour list, by rule rather than by hand.
 *
 *   illustrations/svg/**      every fill, stroke and gradient stop → the illustration tints (a Vivid Pink
 *                             ramp, pale to full), white, the default ink or a neutral grey
 *   logo/*.svg                third-party brand logos → greyscale (the AhaSlides logo and The Splash are skipped)
 *   icons/svg/filetype/*.svg  the one baked brand colour → the DS icon ink, so the glyph follows the text colour
 *
 * The mappings are deterministic and idempotent: a colour already on the list is left alone, so
 * re-running after a new Figma or brand import only touches what the import brought in. An
 * illustration maps by lightness, which is lossy, so redo one from its original export, never from
 * an already recoloured file. Run it, then rebuild the registries:
 *
 *   node recolour-art.mjs && node build-icons.mjs && node build-illustrations.mjs
 *   node recolour-art.mjs --check     list what would change, write nothing, exit 1 if anything would
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

const VIVID_PINK = '#E70E68', DARKER_PINK = '#DB005B', PINK_30 = '#F8B7D2', PINK_5 = '#FEF3F7';
export const ALLOWED_COLOURS = [VIVID_PINK, DARKER_PINK, PINK_30, PINK_5];
const INK = '#1A1A1A', ICON_INK = '#4A4A4A';
const OWN_LOGOS = /^(ahaslides-logo|thesplash)/;

const expand = (hex) => { const h = hex.slice(1); return (h.length === 3 || h.length === 4 ? [...h].map(c => c + c).join('') : h).toUpperCase(); };
const channels = (hex) => [0, 2, 4].map(i => parseInt(expand(hex).slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const grey = (level) => toHex([level, level, level]);
const INK_LEVEL = channels(INK)[0];

/** Vivid Pink at each of these percentages on white, as flat hex: the only pinks an illustration may paint. */
const ILLUSTRATION_TINT_PERCENTAGES = [5, 10, 20, 30, 45, 60, 80, 100];
export const ILLUSTRATION_TINTS = [
  ...ILLUSTRATION_TINT_PERCENTAGES.map(percentage => toHex(channels(VIVID_PINK).map(channel => 255 - (percentage / 100) * (255 - channel)))),
  DARKER_PINK,
];

/** CIE L* (0 black to 100 white), the scale on which equal steps look equally far apart. */
function perceivedLightness(hex) {
  const [r, g, b] = channels(hex).map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.008856 ? 116 * Math.cbrt(luminance) - 16 : 903.3 * luminance;
}
const TINT_LIGHTNESS = ILLUSTRATION_TINTS.map(perceivedLightness);
const NEUTRAL_SATURATION = 0.1, WHITE_FROM = 99, INK_BELOW = 25;
const saturation = ([r, g, b]) => { const max = Math.max(r, g, b), min = Math.min(r, g, b), mid = (max + min) / 510; return max === min ? 0 : (max - min) / 255 / (1 - Math.abs(2 * mid - 1)); };

/**
 * Per-illustration exceptions, keyed by file name then by ORIGINAL colour, for the places where the
 * ramp alone merges two neighbouring shapes or leaves a face too dark to read.
 */
export const ILLUSTRATION_OVERRIDES = {
  'offer-frame': { '#282E63': DARKER_PINK, '#414A98': VIVID_PINK, '#A76D36': PINK_30 },
  'team-collaborator': { '#F2BE2D': '#FACFE1', '#C48563': '#F493BB', '#BC7657': '#F16EA4' },
};

/**
 * The illustration colour that stands in for `hex` (#RGB, #RRGGBB or #RRGGBBAA; any alpha is kept).
 * Hue is discarded: a colour becomes the illustration tint nearest to it in perceived lightness, so
 * shading keeps its order. White stays white, a colour too dark for any pink becomes the default
 * ink, and a grey stays a grey (never darker than the ink).
 */
export function toIllustrationColour(hex, overrides = {}) {
  const full = expand(hex), solid = `#${full.slice(0, 6)}`, alpha = full.slice(6);
  if (overrides[solid]) return overrides[solid] + alpha;
  if (ILLUSTRATION_TINTS.includes(solid)) return solid + alpha;
  const [r, g, b] = channels(solid), lightness = perceivedLightness(solid);
  if (lightness >= WHITE_FROM) return '#FFFFFF' + alpha;
  if (saturation([r, g, b]) < NEUTRAL_SATURATION) return grey(Math.max(r === g && g === b ? r : 0.299 * r + 0.587 * g + 0.114 * b, INK_LEVEL)) + alpha;
  if (lightness < INK_BELOW) return INK + alpha;
  const nearest = TINT_LIGHTNESS.reduce((best, tint, index) => (Math.abs(tint - lightness) < Math.abs(TINT_LIGHTNESS[best] - lightness) ? index : best), 0);
  return ILLUSTRATION_TINTS[nearest] + alpha;
}

/** The grey of the same lightness as `hex`, never darker than the default ink: the treatment for third-party logos. */
export function toGreyscale(hex) {
  const full = expand(hex), [r, g, b] = channels(hex);
  return grey(Math.max(r === g && g === b ? r : 0.299 * r + 0.587 * g + 0.114 * b, INK_LEVEL)) + full.slice(6);
}

const rgbToHex = (text) => { const [r, g, b] = text.match(/\d+/g).map(Number); return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join(''); };
const NAMED_COLOURS = { black: '#000000', red: '#FF0000', blue: '#0000FF', green: '#008000', yellow: '#FFFF00', orange: '#FFA500', purple: '#800080', pink: '#FFC0CB', magenta: '#FF00FF', cyan: '#00FFFF', navy: '#000080', teal: '#008080', gold: '#FFD700' };
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

/**
 * The SVG with every colour from `coloursInSvg` mapped through `map`. url(#id) references are left alone.
 * A filter tint reaches `map` with `{ filterTint: true }`: a neutral one is a shadow or an alpha extraction.
 */
export function recolourSvg(svg, map) {
  return svg
    .replace(MATRIX, (whole, open, values, close) => {
      const tint = matrixTint(values);
      if (!tint) return whole;
      const n = values.trim().split(/[\s,]+/), mapped = expand(map(tint, { filterTint: true }));
      if (mapped === expand(tint)) return whole;
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
const isNeutral = (hex) => { const [r, g, b] = channels(hex); return r === g && g === b; };
/* build-illustrations.mjs finds the Figma board around each export by these two greys, so they pass through. */
const BOARD_CHROME = ['#E1E1E1', '#D5D5D5'];

export const ART_SOURCES = [
  {
    label: 'illustrations',
    files: () => svgFiles(join(root, 'illustrations', 'svg')),
    mapFor: (path) => {
      const overrides = ILLUSTRATION_OVERRIDES[basename(path, '.svg')] || {};
      return (colour, { filterTint = false } = {}) => ((filterTint && isNeutral(colour)) || BOARD_CHROME.includes(colour.toUpperCase()) ? colour : toIllustrationColour(colour, overrides));
    },
  },
  {
    label: 'third-party logos',
    files: () => svgFiles(join(root, 'logo')).filter(path => !OWN_LOGOS.test(basename(path))),
    mapFor: () => (colour, { filterTint = false } = {}) => (filterTint && isNeutral(colour) ? colour : toGreyscale(colour)),
  },
  {
    label: 'file-type icons',
    files: () => svgFiles(join(root, 'icons', 'svg', 'filetype')),
    mapFor: () => (colour) => (/^#(fff|ffffff)$/i.test(colour) ? colour : ICON_INK),
  },
];

if (import.meta.url === `file://${process.argv[1]}`) {
  const check = process.argv.includes('--check');
  let changed = 0;
  for (const { label, files, mapFor } of ART_SOURCES) {
    const paths = files(), touched = [];
    for (const path of paths) {
      const before = readFileSync(path, 'utf8'), after = recolourSvg(before, mapFor(path));
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
