import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-canvas-count.js', import.meta.url))).href;

async function measure(attrs) {
  const file = join(mkdtempSync(join(tmpdir(), 'canvas-count-')), 'page.html');
  writeFileSync(file, `<!doctype html><body><aha-canvas-count ${attrs}></aha-canvas-count>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-canvas-count'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const r = document.querySelector('aha-canvas-count').shadowRoot;
    const px = (n) => Math.round(n.getBoundingClientRect().height);
    return { box: px(r.querySelector('.box')), disc: px(r.querySelector('.is-correct')),
      number: getComputedStyle(r.querySelector('.number')).fontSize, unit: r.querySelector('.unit').getAttribute('size') };
  })()`, { readyExpr: '!!window.ready' });
}

test('size="sm" is the 32px step with 16px discs and a 14px count; no size keeps the 40px default', { skip }, async () => {
  assert.deepEqual(await measure('size="sm" correct="12" wrong="3"'), { box: 32, disc: 16, number: '14px', unit: '12' });
  assert.deepEqual(await measure('correct="12" wrong="3"'), { box: 40, disc: 20, number: '16px', unit: '16' });
});
