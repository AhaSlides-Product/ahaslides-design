#!/usr/bin/env node
/**
 * icon-similarity.mjs — finds icons that look nearly identical.
 *
 * Every glyph under icons/svg/<family>/<name>.svg is drawn in pure JS (no browser, no dependency)
 * the way <aha-icon> draws it at 16px: fills as filled, every stroke at the runtime's 1.5px, on a
 * 32 × 32 grid. Two glyphs whose drawings overlap at or above the threshold are a near-duplicate
 * pair. Outline / -filled (or -fill / -stroke) variants of one glyph are deliberate and never paired.
 *
 *   node icon-similarity.mjs                   every near-duplicate pair (the clean-up report)
 *   node icon-similarity.mjs --json            the same, as JSON
 *   node icon-similarity.mjs --check <svg>     the library icons closest to a candidate SVG file
 *   node icon-similarity.mjs --update-baseline rewrite icon-duplicates.baseline.json (shrink only)
 *
 * standards.mjs runs the gate: a pair that is not in icon-duplicates.baseline.json fails, and the
 * baseline may only shrink.
 */
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DUPLICATE_THRESHOLD = 0.86;
export const DUPLICATE_BASELINE_FILE = 'icon-duplicates.baseline.json';
export const DUPLICATE_BASELINE_ABOUT = 'Near-identical icon pairs that shipped before the near-duplicate gate. They are listed for a person to decide on (keep both, merge, or remove one); standards.mjs fails a pair that is not listed, and fails when this list grows or names a pair that is no longer near-identical. Shrink it with node icon-similarity.mjs --update-baseline.';

const GRID = 32;
const SUPERSAMPLE = 3;
const SAMPLES = GRID * SUPERSAMPLE;
const RUNTIME_STROKE_AT_16PX = 1.5;
const CURVE_STEPS = 12;

const attribute = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];

const ARGUMENT_COUNT = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

function tokenisePath(d) {
  const tokens = [];
  const pattern = /([MLHVCSQTAZmlhvcsqtaz])|([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)/g;
  let match;
  while ((match = pattern.exec(d))) tokens.push(match[1] ? { command: match[1] } : { number: parseFloat(match[2]), text: match[2], index: match.index });
  return tokens;
}

function arcPoints(x1, y1, rx, ry, rotationDegrees, largeArc, sweep, x2, y2) {
  if (rx === 0 || ry === 0) return [[x2, y2]];
  rx = Math.abs(rx); ry = Math.abs(ry);
  const phi = rotationDegrees * Math.PI / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const xp = cos * dx + sin * dy, yp = -sin * dx + cos * dy;
  const lambda = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
  if (lambda > 1) { rx *= Math.sqrt(lambda); ry *= Math.sqrt(lambda); }
  const numerator = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
  const factor = (largeArc === sweep ? -1 : 1) * Math.sqrt(Math.max(0, numerator / (rx * rx * yp * yp + ry * ry * xp * xp)));
  const cxp = factor * rx * yp / ry, cyp = -factor * ry * xp / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const start = angle(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
  let delta = angle((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  const steps = Math.max(4, Math.ceil(Math.abs(delta) / (Math.PI / 12)));
  const points = [];
  for (let i = 1; i <= steps; i++) {
    const t = start + delta * i / steps;
    const ex = rx * Math.cos(t), ey = ry * Math.sin(t);
    points.push([cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]);
  }
  return points;
}

export function pathToSubpaths(d) {
  const tokens = tokenisePath(d);
  const subpaths = [];
  let current = null, x = 0, y = 0, startX = 0, startY = 0, lastControl = null, lastCommand = '';
  let index = 0, command = null;
  const nextNumber = () => {
    const token = tokens[index++];
    if (!token || token.number === undefined) throw new Error('bad path data');
    return token.number;
  };
  const nextFlag = () => {
    const token = tokens[index];
    if (!token || token.number === undefined) throw new Error('bad arc flag');
    if (token.text.length > 1 && /^[01]/.test(token.text)) {
      const flag = Number(token.text[0]);
      token.text = token.text.slice(1);
      token.number = parseFloat(token.text);
      return flag;
    }
    index++;
    return token.number ? 1 : 0;
  };
  const lineTo = (nx, ny) => { current.push([nx, ny]); x = nx; y = ny; };
  const cubic = (c1x, c1y, c2x, c2y, ex, ey) => {
    const x0 = x, y0 = y;
    for (let i = 1; i <= CURVE_STEPS; i++) {
      const t = i / CURVE_STEPS, u = 1 - t;
      current.push([u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex,
        u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * ey]);
    }
    x = ex; y = ey;
  };
  const quadratic = (cx, cy, ex, ey) => {
    const x0 = x, y0 = y;
    for (let i = 1; i <= CURVE_STEPS; i++) {
      const t = i / CURVE_STEPS, u = 1 - t;
      current.push([u * u * x0 + 2 * u * t * cx + t * t * ex, u * u * y0 + 2 * u * t * cy + t * t * ey]);
    }
    x = ex; y = ey;
  };
  while (index < tokens.length) {
    if (tokens[index].command) command = tokens[index++].command;
    else if (!command) throw new Error('path data must start with a command');
    const upper = command.toUpperCase(), relative = command !== upper;
    const ox = relative ? x : 0, oy = relative ? y : 0;
    if (upper !== 'Z' && upper !== 'M' && !current) { current = [[x, y]]; subpaths.push({ points: current, closed: false }); }
    switch (upper) {
      case 'M': {
        const nx = nextNumber() + ox, ny = nextNumber() + oy;
        current = [[nx, ny]]; subpaths.push({ points: current, closed: false });
        x = startX = nx; y = startY = ny;
        command = relative ? 'l' : 'L';
        break;
      }
      case 'L': lineTo(nextNumber() + ox, nextNumber() + oy); break;
      case 'H': lineTo(nextNumber() + ox, y); break;
      case 'V': lineTo(x, nextNumber() + oy); break;
      case 'C': {
        const c1x = nextNumber() + ox, c1y = nextNumber() + oy, c2x = nextNumber() + ox, c2y = nextNumber() + oy;
        const ex = nextNumber() + ox, ey = nextNumber() + oy;
        cubic(c1x, c1y, c2x, c2y, ex, ey); lastControl = [c2x, c2y];
        break;
      }
      case 'S': {
        const reflect = /[CS]/i.test(lastCommand) && lastControl ? [2 * x - lastControl[0], 2 * y - lastControl[1]] : [x, y];
        const c2x = nextNumber() + ox, c2y = nextNumber() + oy, ex = nextNumber() + ox, ey = nextNumber() + oy;
        cubic(reflect[0], reflect[1], c2x, c2y, ex, ey); lastControl = [c2x, c2y];
        break;
      }
      case 'Q': {
        const cx = nextNumber() + ox, cy = nextNumber() + oy, ex = nextNumber() + ox, ey = nextNumber() + oy;
        quadratic(cx, cy, ex, ey); lastControl = [cx, cy];
        break;
      }
      case 'T': {
        const control = /[QT]/i.test(lastCommand) && lastControl ? [2 * x - lastControl[0], 2 * y - lastControl[1]] : [x, y];
        const ex = nextNumber() + ox, ey = nextNumber() + oy;
        quadratic(control[0], control[1], ex, ey); lastControl = control;
        break;
      }
      case 'A': {
        const rx = nextNumber(), ry = nextNumber(), rotation = nextNumber(), largeArc = nextFlag(), sweep = nextFlag();
        const ex = nextNumber() + ox, ey = nextNumber() + oy;
        for (const point of arcPoints(x, y, rx, ry, rotation, largeArc, sweep, ex, ey)) current.push(point);
        x = ex; y = ey;
        break;
      }
      case 'Z':
        if (current) { current.closed = true; subpaths[subpaths.length - 1].closed = true; }
        x = startX; y = startY; current = null;
        break;
    }
    if (upper !== 'C' && upper !== 'S' && upper !== 'Q' && upper !== 'T') lastControl = null;
    lastCommand = upper;
    if (ARGUMENT_COUNT[upper] === 0 && index < tokens.length && !tokens[index].command) throw new Error('numbers after Z');
  }
  return subpaths;
}

function shapeToSubpaths(tagName, tag) {
  const number = (name, fallback = 0) => { const value = attribute(tag, name); return value === undefined ? fallback : parseFloat(value); };
  switch (tagName) {
    case 'path': return pathToSubpaths(attribute(tag, 'd') || '');
    case 'rect': {
      const x = number('x'), y = number('y'), width = number('width'), height = number('height');
      return [{ points: [[x, y], [x + width, y], [x + width, y + height], [x, y + height]], closed: true }];
    }
    case 'circle': case 'ellipse': {
      const cx = number('cx'), cy = number('cy');
      const rx = tagName === 'circle' ? number('r') : number('rx'), ry = tagName === 'circle' ? number('r') : number('ry');
      const points = [];
      for (let i = 0; i < 48; i++) points.push([cx + rx * Math.cos(i * Math.PI / 24), cy + ry * Math.sin(i * Math.PI / 24)]);
      return [{ points, closed: true }];
    }
    case 'line': return [{ points: [[number('x1'), number('y1')], [number('x2'), number('y2')]], closed: false }];
    case 'polyline': case 'polygon': {
      const values = (attribute(tag, 'points') || '').trim().split(/[\s,]+/).map(Number);
      const points = [];
      for (let i = 0; i + 1 < values.length; i += 2) points.push([values[i], values[i + 1]]);
      return [{ points, closed: tagName === 'polygon' }];
    }
  }
  return [];
}

const DRAWABLE = new Set(['path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon']);

export function parseIcon(svg) {
  const viewBox = (attribute(svg.match(/<svg\b[^>]*>/i)?.[0] || '', 'viewBox') || '0 0 16 16').trim().split(/[\s,]+/).map(Number);
  const shapes = [];
  const masks = {};
  const stack = [{ fill: undefined, stroke: undefined, rule: undefined }];
  let skipDepth = 0, maskId = null;
  for (const match of svg.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)) {
    const [tag, closing, rawName, , selfClosing] = match;
    const name = rawName.toLowerCase();
    if (closing) {
      if (name === 'defs' || name === 'clippath') skipDepth--;
      if (name === 'mask') maskId = null;
      if (['g', 'svg', 'mask'].includes(name) && stack.length > 1) stack.pop();
      continue;
    }
    const own = { fill: attribute(tag, 'fill'), stroke: attribute(tag, 'stroke'), rule: attribute(tag, 'fill-rule') };
    const inherited = stack[stack.length - 1];
    const style = { fill: own.fill ?? inherited.fill, stroke: own.stroke ?? inherited.stroke, rule: own.rule ?? inherited.rule };
    if (name === 'defs' || name === 'clippath') { if (!selfClosing) skipDepth++; continue; }
    if (name === 'mask') { maskId = attribute(tag, 'id') || ''; masks[maskId] = []; if (!selfClosing) stack.push(style); continue; }
    if (name === 'g' || name === 'svg') { if (!selfClosing) stack.push(style); continue; }
    if (!DRAWABLE.has(name) || skipDepth > 0) continue;
    const subpaths = shapeToSubpaths(name, tag);
    const fill = style.fill === undefined ? 'black' : style.fill;
    const shape = {
      subpaths,
      filled: fill !== 'none' && fill !== 'transparent',
      stroked: !!style.stroke && style.stroke !== 'none',
      evenOdd: style.rule === 'evenodd',
      mask: (attribute(tag, 'mask') || '').match(/url\(#([^)]+)\)/)?.[1],
    };
    if (maskId !== null) masks[maskId].push(shape); else shapes.push(shape);
  }
  return { viewBox, shapes, masks };
}

function fillSamples(target, subpaths, evenOdd, scale, offsetX, offsetY) {
  const edges = [];
  for (const { points } of subpaths) {
    for (let i = 0; i < points.length; i++) {
      const [x0, y0] = points[i], [x1, y1] = points[(i + 1) % points.length];
      if (y0 === y1) continue;
      edges.push([(x0 - offsetX) * scale, (y0 - offsetY) * scale, (x1 - offsetX) * scale, (y1 - offsetY) * scale]);
    }
  }
  for (let row = 0; row < SAMPLES; row++) {
    const sy = row + 0.5;
    const crossings = [];
    for (const [x0, y0, x1, y1] of edges) {
      if ((sy >= y0 && sy < y1) || (sy >= y1 && sy < y0)) crossings.push([x0 + (sy - y0) * (x1 - x0) / (y1 - y0), y1 > y0 ? 1 : -1]);
    }
    if (!crossings.length) continue;
    crossings.sort((a, b) => a[0] - b[0]);
    let winding = 0;
    for (let i = 0; i < crossings.length - 1; i++) {
      winding = evenOdd ? winding ^ 1 : winding + crossings[i][1];
      if (!winding) continue;
      const from = Math.max(0, Math.ceil(crossings[i][0] - 0.5)), to = Math.min(SAMPLES - 1, Math.floor(crossings[i + 1][0] - 0.5));
      for (let column = from; column <= to; column++) target[row * SAMPLES + column] = 1;
    }
  }
}

function strokeSamples(target, subpaths, scale, offsetX, offsetY) {
  const radius = RUNTIME_STROKE_AT_16PX / 16 * SAMPLES / 2, radiusSquared = radius * radius;
  for (const { points, closed } of subpaths) {
    const count = closed ? points.length : points.length - 1;
    for (let i = 0; i < Math.max(count, 1); i++) {
      const [ax, ay] = points[i].map((value, axis) => (value - (axis ? offsetY : offsetX)) * scale);
      const [bx, by] = points[(i + 1) % points.length].map((value, axis) => (value - (axis ? offsetY : offsetX)) * scale);
      const minX = Math.max(0, Math.floor(Math.min(ax, bx) - radius)), maxX = Math.min(SAMPLES - 1, Math.ceil(Math.max(ax, bx) + radius));
      const minY = Math.max(0, Math.floor(Math.min(ay, by) - radius)), maxY = Math.min(SAMPLES - 1, Math.ceil(Math.max(ay, by) + radius));
      const dx = bx - ax, dy = by - ay, lengthSquared = dx * dx + dy * dy;
      for (let row = minY; row <= maxY; row++) {
        for (let column = minX; column <= maxX; column++) {
          const px = column + 0.5 - ax, py = row + 0.5 - ay;
          const t = lengthSquared ? Math.max(0, Math.min(1, (px * dx + py * dy) / lengthSquared)) : 0;
          const ex = px - t * dx, ey = py - t * dy;
          if (ex * ex + ey * ey <= radiusSquared) target[row * SAMPLES + column] = 1;
        }
      }
    }
  }
}

function drawShape(shape, scale, offsetX, offsetY) {
  const samples = new Uint8Array(SAMPLES * SAMPLES);
  if (shape.filled) fillSamples(samples, shape.subpaths, shape.evenOdd, scale, offsetX, offsetY);
  if (shape.stroked) strokeSamples(samples, shape.subpaths, scale, offsetX, offsetY);
  return samples;
}

/** Coverage of a glyph on a 32 × 32 grid (values 0–1), drawn as <aha-icon> draws it at 16px. */
export function rasteriseIcon(svg) {
  const { viewBox: [offsetX, offsetY, width, height], shapes, masks } = parseIcon(svg);
  const scale = SAMPLES / Math.max(width, height);
  const samples = new Uint8Array(SAMPLES * SAMPLES);
  for (const shape of shapes) {
    const drawn = drawShape(shape, scale, offsetX, offsetY);
    if (shape.mask && masks[shape.mask]) {
      const mask = new Uint8Array(SAMPLES * SAMPLES);
      for (const maskShape of masks[shape.mask]) drawShape(maskShape, scale, offsetX, offsetY).forEach((value, i) => { if (value) mask[i] = 1; });
      for (let i = 0; i < drawn.length; i++) drawn[i] &= mask[i];
    }
    for (let i = 0; i < drawn.length; i++) samples[i] |= drawn[i];
  }
  const coverage = new Float32Array(GRID * GRID);
  for (let row = 0; row < SAMPLES; row++) {
    for (let column = 0; column < SAMPLES; column++) {
      if (samples[row * SAMPLES + column]) coverage[Math.floor(row / SUPERSAMPLE) * GRID + Math.floor(column / SUPERSAMPLE)] += 1 / (SUPERSAMPLE * SUPERSAMPLE);
    }
  }
  return blur(coverage);
}

// A one-pixel blur so a stroke nudged by half a pixel still reads as the same drawing.
function blur(coverage) {
  const pass = (source, horizontal) => {
    const out = new Float32Array(source.length);
    for (let row = 0; row < GRID; row++) {
      for (let column = 0; column < GRID; column++) {
        let sum = 2 * source[row * GRID + column], weight = 2;
        for (const step of [-1, 1]) {
          const r = horizontal ? row : row + step, c = horizontal ? column + step : column;
          if (r >= 0 && r < GRID && c >= 0 && c < GRID) { sum += source[r * GRID + c]; weight++; }
        }
        out[row * GRID + column] = sum / weight;
      }
    }
    return out;
  };
  return pass(pass(coverage, true), false);
}

/** Overlap of two drawings: 1 = the same picture, 0 = nothing in common. */
export function similarity(a, b) {
  let shared = 0, union = 0;
  for (let i = 0; i < a.length; i++) { shared += Math.min(a[i], b[i]); union += Math.max(a[i], b[i]); }
  return union ? shared / union : 1;
}

const VARIANT_SUFFIX = /-(filled|fill|stroke|outline)$/;
/** Outline and filled drawings of one glyph (system-note / system-note-filled) are deliberate variants. */
export function isVariantPair(first, second) {
  const stem = (name) => name.replace(VARIANT_SUFFIX, '');
  return first !== second && stem(first) === stem(second);
}

export const pairKey = (first, second) => [first, second].sort().join(' ~ ');

/** Every glyph file under icons/svg: { name → { family, file, svg } }. Aliases are not files, so never appear. */
export function readGlyphSources(root) {
  const folder = join(root, 'icons', 'svg');
  const glyphs = {};
  for (const family of readdirSync(folder).filter(entry => statSync(join(folder, entry)).isDirectory()).sort()) {
    for (const file of readdirSync(join(folder, family)).filter(entry => entry.endsWith('.svg')).sort()) {
      glyphs[file.replace(/\.svg$/, '')] = { family, file: `icons/svg/${family}/${file}`, svg: readFileSync(join(folder, family, file), 'utf8') };
    }
  }
  return glyphs;
}

export function rasteriseAll(glyphs) {
  const drawings = {};
  for (const [name, { svg }] of Object.entries(glyphs)) {
    try { drawings[name] = rasteriseIcon(svg); } catch { drawings[name] = null; }
  }
  return drawings;
}

export function nearDuplicatePairs(drawings, threshold = DUPLICATE_THRESHOLD) {
  const names = Object.keys(drawings).filter(name => drawings[name]).sort();
  const pairs = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      if (isVariantPair(names[i], names[j])) continue;
      const score = similarity(drawings[names[i]], drawings[names[j]]);
      if (score >= threshold) pairs.push({ pair: pairKey(names[i], names[j]), first: names[i], second: names[j], score: Math.round(score * 1000) / 1000 });
    }
  }
  return pairs.sort((a, b) => b.score - a.score || a.pair.localeCompare(b.pair));
}

export function closestIcons(candidate, drawings, limit = 8) {
  return Object.entries(drawings).filter(([, drawing]) => drawing)
    .map(([name, drawing]) => ({ name, score: Math.round(similarity(candidate, drawing) * 1000) / 1000 }))
    .sort((a, b) => b.score - a.score).slice(0, limit);
}

/* baseBaseline is null when no base branch can be read: the growth check then waits for CI. */
export function evaluateDuplicateGate({ pairs, baseline, baseBaseline = null, unreadable = [] }) {
  const failures = [];
  const listed = new Set(baseline);
  const found = new Set(pairs.map(entry => entry.pair));
  for (const entry of pairs) {
    if (!listed.has(entry.pair)) failures.push(`${entry.first} looks nearly identical to ${entry.second} (${Math.round(entry.score * 100)}% overlap): reuse ${entry.second} — run npm run icon-search — or redraw the new glyph so it reads differently`);
  }
  for (const name of unreadable) failures.push(`${name}: the SVG could not be drawn for the near-duplicate check — use plain path data`);
  const stale = baseline.filter(pair => !found.has(pair));
  if (stale.length) failures.push(`${DUPLICATE_BASELINE_FILE} lists ${stale.length} pair(s) that are no longer near-identical or no longer exist — run node icon-similarity.mjs --update-baseline: ${stale.join(', ')}`);
  if (baseBaseline) {
    const before = new Set(baseBaseline);
    const added = baseline.filter(pair => !before.has(pair));
    if (added.length) failures.push(`${DUPLICATE_BASELINE_FILE} may only shrink, but this pull request adds: ${added.join(', ')} — reuse the existing icon instead`);
  }
  return { failures, nextBaseline: baseline.filter(pair => found.has(pair)) };
}

export function readDuplicateBaseline(root) {
  const path = join(root, DUPLICATE_BASELINE_FILE);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')).pairs : [];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = dirname(fileURLToPath(import.meta.url));
  const args = process.argv.slice(2);
  const glyphs = readGlyphSources(root);
  const drawings = rasteriseAll(glyphs);
  const checkIndex = args.indexOf('--check');
  if (checkIndex >= 0) {
    const file = args[checkIndex + 1];
    if (!file) { console.error('usage: node icon-similarity.mjs --check <file.svg>'); process.exit(2); }
    const own = basename(file).replace(/\.svg$/, '');
    const candidate = rasteriseIcon(readFileSync(file, 'utf8'));
    const others = Object.fromEntries(Object.entries(drawings).filter(([name]) => name !== own && !isVariantPair(name, own)));
    for (const { name, score } of closestIcons(candidate, others)) console.log(`${score >= DUPLICATE_THRESHOLD ? '✗' : ' '} ${(score * 100).toFixed(0).padStart(3)}%  ${name}`);
    console.log(`\n✗ = at or above the ${DUPLICATE_THRESHOLD * 100}% near-duplicate threshold: reuse that icon instead of adding this one.`);
    process.exit(0);
  }
  const pairs = nearDuplicatePairs(drawings);
  if (args.includes('--update-baseline')) {
    const { nextBaseline } = evaluateDuplicateGate({ pairs, baseline: readDuplicateBaseline(root) });
    const keep = existsSync(join(root, DUPLICATE_BASELINE_FILE)) ? nextBaseline : pairs.map(entry => entry.pair);
    writeFileSync(join(root, DUPLICATE_BASELINE_FILE), JSON.stringify({ $about: DUPLICATE_BASELINE_ABOUT, threshold: DUPLICATE_THRESHOLD, pairs: keep }, null, 1) + '\n');
    console.log(`${DUPLICATE_BASELINE_FILE}: ${keep.length} pair(s)`);
    process.exit(0);
  }
  if (args.includes('--json')) { console.log(JSON.stringify({ threshold: DUPLICATE_THRESHOLD, pairs }, null, 2)); process.exit(0); }
  console.log(`${pairs.length} near-identical icon pair(s) at ≥ ${DUPLICATE_THRESHOLD * 100}% overlap (outline / -filled variants skipped):\n`);
  for (const entry of pairs) console.log(`  ${(entry.score * 100).toFixed(0).padStart(3)}%  ${entry.first}  ~  ${entry.second}`);
}
