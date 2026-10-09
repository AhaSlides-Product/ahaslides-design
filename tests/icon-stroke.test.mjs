import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';
import { LINE, strokeWidthFor } from '../lib/icons.js';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/icons.js', import.meta.url))).href;
const GLYPHS = { sixteenViewBox: 'system-bell', twentyFourViewBox: 'slidetype-poll', outlier: 'system-graduation-cap' };

test('stroke width in viewBox units renders as the paired pixel width for every size and viewBox', () => {
  for (const viewBox of ['0 0 16 16', '0 0 24 24', '0 0 24.0001 24']) {
    for (const [size, line] of Object.entries(LINE)) {
      const rendered = strokeWidthFor(Number(size), viewBox) * Number(size) / parseFloat(viewBox.split(' ')[2]);
      assert.ok(Math.abs(rendered - line) < 1e-3, `${viewBox} @${size}px renders ${rendered}px, expected ${line}px`);
    }
  }
});

test('an off-grid size takes the nearest on-grid size stroke', () => {
  assert.equal(strokeWidthFor(20, '0 0 16 16') * 20 / 16, 1.5);
  assert.equal(strokeWidthFor(30, '0 0 24 24') * 30 / 24, 2.5);
});

test('the rendered <aha-icon> strokes every stroked element at 1 / 1.5 / 2 / 2.5 px', { skip }, async () => {
  const sizes = Object.keys(LINE);
  const cells = Object.entries(GLYPHS).flatMap(([key, name]) => sizes.map(size => `<aha-icon data-key="${key}" name="${name}" size="${size}"></aha-icon>`)).join('');
  const file = join(mkdtempSync(join(tmpdir(), 'icon-stroke-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>${cells}<script type="module">import '${lib}'; window.ready = true;</script>`);
  const measured = await evaluateInPage(pathToFileURL(file).href, `(() => [...document.querySelectorAll('aha-icon')].map(icon => {
    const svg = icon.shadowRoot.querySelector('svg');
    const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    const widths = [...svg.querySelectorAll('[stroke]')].map(el => +(parseFloat(getComputedStyle(el).strokeWidth) * scale).toFixed(3));
    return { key: icon.dataset.key, size: icon.getAttribute('size'), widths };
  }))()`, { readyExpr: '!!window.ready && !!customElements.get("aha-icon")' });
  assert.equal(measured.length, Object.keys(GLYPHS).length * sizes.length);
  for (const { key, size, widths } of measured) {
    assert.ok(widths.length > 0, `${key} @${size} has stroked elements`);
    for (const width of widths) assert.equal(width, LINE[size], `${key} @${size}px stroke`);
  }
});

const root = fileURLToPath(new URL('..', import.meta.url));
const GRID = Object.keys(LINE).map(Number);
const OFF_GRID_ALLOWED = {};

function sourceFiles() {
  const lib = readdirSync(join(root, 'lib')).filter(name => name.endsWith('.js') && !/registry|illustrations/.test(name)).map(name => `lib/${name}`);
  const parts = readdirSync(join(root, 'parts')).map(name => `parts/${name}`);
  return [...lib, ...parts, 'generate.mjs'];
}

function iconSizesIn(text) {
  const found = [];
  const addLiteral = (value, index) => found.push({ value: Number(value), index });
  for (const match of text.matchAll(/<aha-icon\b[^>]*?[\s:]size=(?:"(\d+)"|\{(\d+)\}|"\$\{([^}"]*)\}")/g)) {
    if (match[1] || match[2]) addLiteral(match[1] || match[2], match.index);
    else for (const number of match[3].matchAll(/[?:]\s*(\d+)(?!\d)/g)) addLiteral(number[1], match.index);
  }
  for (const match of text.matchAll(/['"]aha-icon['"],\s*\{[^}]*?\bsize:\s*'(\d+)'/g)) addLiteral(match[1], match.index);
  for (const match of text.matchAll(/dsStatusIcon\(h,\s*[^,)]+,\s*(\d+)\)|statusIconCss\([^,)]+,\s*(\d+)\)/g)) addLiteral(match[1] || match[2], match.index);
  return found;
}

test('no component, flavour snippet or docs template passes an off-grid size to <aha-icon>', () => {
  const offenders = [];
  for (const file of sourceFiles()) {
    const text = readFileSync(join(root, file), 'utf8');
    for (const { value, index } of iconSizesIn(text)) {
      if (GRID.includes(value)) continue;
      const line = text.slice(0, index).split('\n').length;
      const allowedReason = OFF_GRID_ALLOWED[`${file}:${value}`];
      if (!allowedReason) offenders.push(`${file}:${line} passes size ${value}; use one of ${GRID.join(' / ')}`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('the guard recognises every spelling of an off-grid size', () => {
  const samples = [
    '<aha-icon name="a" size="14"></aha-icon>',
    '<aha-icon name="a" size={20} />',
    '<aha-icon name="a" :size="18" />',
    "h('aha-icon', { name: 'a', size: '28' })",
    '<aha-icon name="a" size="${open ? 12 : 10}"></aha-icon>',
    'dsStatusIcon(h, type, 20)',
  ];
  for (const sample of samples) assert.ok(iconSizesIn(sample).some(({ value }) => !GRID.includes(value)), sample);
});
