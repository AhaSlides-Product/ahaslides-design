import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-segmented.js', import.meta.url))).href;
const options = JSON.stringify([
  { value: 'list', icon: 'system-list', ariaLabel: 'List view', testid: 'view-list' },
  { value: 'grid', label: 'Grid', testid: 'view-grid' },
  { value: 'table', label: 'Table' },
]).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-segmented id="rich" options="${options}"></aha-segmented>
<aha-segmented id="plain" options="Day|Week"></aha-segmented>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('option testid reaches the option button; options without it and string options render no attribute', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'segmented-testid-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const ids = (id) => [...document.getElementById(id).shadowRoot.querySelectorAll('.seg')].map((b) => b.getAttribute('data-testid'));
    return { rich: ids('rich'), plain: ids('plain') };
  })()`);
  assert.deepEqual(result.rich, ['view-list', 'view-grid', null]);
  assert.deepEqual(result.plain, [null, null]);
});
