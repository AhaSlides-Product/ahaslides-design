#!/usr/bin/env node
/* Build an AhaSlides Splash background SVG from the real splash icon (logo/thesplash.svg).

   node build-splash.mjs --layout centre|right|minimal --surface white|pink --width W --height H --out FILE.svg
   node build-splash.mjs --all [DIR]     rebuild the ready-made set (default: backgrounds/)

   Geometry and colours are read from brand/colour-rules.json (splash). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

export function loadSplashRules(rulesPath = join(root, 'brand', 'colour-rules.json')) {
  return JSON.parse(readFileSync(rulesPath, 'utf8')).splash;
}

export function readIcon(iconSvg) {
  const viewBox = iconSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const hooks = [...iconSvg.matchAll(/<path d="([^"]+)"/g)].map(match => match[1]);
  if (!viewBox || hooks.length !== 4) throw new Error('expected the four-hook splash icon');
  return { iconWidth: Number(viewBox[1]), hooks };
}

function cubicExtrema(p0, p1, p2, p3) {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  let roots = [];
  if (Math.abs(a) < 1e-12) roots = Math.abs(b) > 1e-12 ? [-c / b] : [];
  else {
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) roots = [(-b + Math.sqrt(discriminant)) / (2 * a), (-b - Math.sqrt(discriminant)) / (2 * a)];
  }
  const values = [p0, p3];
  for (const t of roots) if (t > 0 && t < 1) values.push((1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3);
  return [Math.min(...values), Math.max(...values)];
}

export function pathBounds(pathData) {
  const tokens = pathData.match(/[MCLHZ]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const xs = [], ys = [];
  let x = 0, y = 0, index = 0, command = null;
  while (index < tokens.length) {
    if (/[A-Z]/.test(tokens[index])) {
      command = tokens[index++];
      if (command === 'Z') continue;
    }
    if (command === 'M' || command === 'L') {
      x = Number(tokens[index]); y = Number(tokens[index + 1]); index += 2;
      xs.push(x); ys.push(y);
    } else if (command === 'H') {
      x = Number(tokens[index++]);
      xs.push(x);
    } else if (command === 'C') {
      const [x1, y1, x2, y2, x3, y3] = tokens.slice(index, index + 6).map(Number);
      index += 6;
      xs.push(...cubicExtrema(x, x1, x2, x3));
      ys.push(...cubicExtrema(y, y1, y2, y3));
      x = x3; y = y3;
    } else throw new Error(`unsupported path command ${command} in the splash icon`);
  }
  return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
}

export function largestHook(hooks) {
  const area = (hook) => { const bounds = pathBounds(hook); return (bounds.right - bounds.left) * (bounds.bottom - bounds.top); };
  return hooks.reduce((largest, hook) => (area(hook) > area(largest) ? hook : largest));
}

function wholeIcon(hooks, colour, scale, meetingX, meetingY, meetingPoint) {
  const transform = `translate(${meetingX.toFixed(3)} ${meetingY.toFixed(3)}) scale(${scale.toFixed(6)}) translate(${(-meetingPoint.x).toFixed(1)} ${(-meetingPoint.y).toFixed(1)})`;
  return `<g fill="${colour}" transform="${transform}">${hooks.map(hook => `<path d="${hook}"/>`).join('')}</g>`;
}

function minimalHooks(hooks, colour, width, height, layout) {
  const hook = largestHook(hooks);
  const { top, right, bottom } = pathBounds(hook);
  const scale = layout.hookLengthPerLongerSide * Math.max(width, height) / (bottom - top);
  // rotate(-90) maps (x, y) to (y, -x); rotate(90) maps (x, y) to (-y, x).
  const bottomLeft = `translate(${(-top * scale).toFixed(3)} ${((1 - layout.bottomLeftCoversLowerShare) * height + right * scale).toFixed(3)}) rotate(-90) scale(${scale.toFixed(6)})`;
  const topRight = `translate(${(width + top * scale).toFixed(3)} ${(layout.topRightCoversUpperShare * height - right * scale).toFixed(3)}) rotate(90) scale(${scale.toFixed(6)})`;
  return `<g fill="${colour}"><path transform="${bottomLeft}" d="${hook}"/><path transform="${topRight}" d="${hook}"/></g>`;
}

/** Returns the SVG text of one Splash background, built for exactly width by height. */
export function buildSplash({ layout, surface, width, height, rules = loadSplashRules(), iconSvg = readFileSync(join(root, rules.icon), 'utf8') }) {
  const geometry = rules.layouts[layout];
  const colours = rules.surfaces[surface];
  if (!geometry || !colours) throw new Error(`layout is one of ${Object.keys(rules.layouts).join(', ')}; surface is one of ${Object.keys(rules.surfaces).join(', ')}`);
  const { iconWidth, hooks } = readIcon(iconSvg);
  const splash = layout === 'minimal'
    ? minimalHooks(hooks, colours.hooks, width, height, geometry)
    : wholeIcon(hooks, colours.hooks, geometry.iconWidthPerShorterSide * Math.min(width, height) / iconWidth,
      geometry.meetingPointAcross * width, geometry.meetingPointDown * height, rules.meetingPoint);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `<clipPath id="frame"><rect width="${width}" height="${height}"/></clipPath>`
    + `<rect width="${width}" height="${height}" fill="${colours.background}"/>`
    + `<g clip-path="url(#frame)">${splash}</g></svg>\n`;
}

/** The ready-made set: every layout on every surface, at each frame the rules settle for it. */
export function readyMadeSet(rules = loadSplashRules()) {
  const files = [];
  for (const surface of Object.keys(rules.surfaces)) {
    for (const [layout, geometry] of Object.entries(rules.layouts)) {
      for (const ratio of geometry.readyMadeFrames || Object.keys(rules.frames)) {
        const { width, height } = rules.frames[ratio];
        files.push({ file: `splash-${layout}-${surface}-${ratio}.svg`, layout, surface, ratio, width, height });
      }
    }
  }
  return files;
}

function main(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const name = argv[index].replace(/^--/, '');
    options[name] = argv[index + 1] && !argv[index + 1].startsWith('--') ? argv[++index] : true;
  }
  const rules = loadSplashRules();
  if (options.all) {
    const outputDirectory = resolve(options.all === true ? join(root, 'backgrounds') : options.all);
    mkdirSync(outputDirectory, { recursive: true });
    for (const entry of readyMadeSet(rules)) writeFileSync(join(outputDirectory, entry.file), buildSplash({ ...entry, rules }));
    console.log(`built ${readyMadeSet(rules).length} Splash backgrounds in ${outputDirectory}`);
    return 0;
  }
  const width = Number(options.width), height = Number(options.height);
  if (!options.layout || !options.surface || !Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0 || typeof options.out !== 'string') {
    console.error('usage: node build-splash.mjs --layout centre|right|minimal --surface white|pink --width W --height H --out FILE.svg\n       node build-splash.mjs --all [DIR]');
    return 2;
  }
  writeFileSync(resolve(options.out), buildSplash({ layout: options.layout, surface: options.surface, width, height, rules }));
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.exit(main(process.argv.slice(2))); }
  catch (error) { console.error(error.message); process.exit(2); }
}
