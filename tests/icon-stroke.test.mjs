import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
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
