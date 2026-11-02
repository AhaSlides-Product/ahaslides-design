import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-stat-tile.js', import.meta.url))).href;
const page = `<!doctype html><body>
<aha-stat-tile id="plain" label="Learners" value="10"></aha-stat-tile>
<aha-stat-tile id="iconed" icon="system-user" label="Learners" value="10"></aha-stat-tile>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('icon shows a muted 16px icon beside the label; without it the label row is unchanged', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'stat-tile-icon-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const read = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const icon = root.querySelector('.label-icon');
      const label = root.querySelector('.label');
      return { hidden: icon.hidden, name: icon.getAttribute('name'), size: icon.getAttribute('size'), display: getComputedStyle(label).display, text: label.textContent, height: label.getBoundingClientRect().height };
    };
    return { plain: read('plain'), iconed: read('iconed') };
  })()`, { readyExpr: 'window.ready === true' });
  assert.deepEqual({ hidden: result.plain.hidden, name: result.plain.name, display: result.plain.display }, { hidden: true, name: null, display: 'block' });
  assert.deepEqual({ hidden: result.iconed.hidden, name: result.iconed.name, size: result.iconed.size, display: result.iconed.display }, { hidden: false, name: 'system-user', size: '16', display: 'flex' });
  assert.equal(result.iconed.text, 'Learners');
  assert.equal(result.iconed.height, result.plain.height);
});
