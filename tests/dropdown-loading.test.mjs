import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-dropdown.js', import.meta.url))).href;
const items = JSON.stringify([
  { key: 'edit', label: 'Edit', testid: 'row-edit' },
  { type: 'group', label: 'More', children: [{ key: 'deep', label: 'Deep', testid: 'row-deep' }] },
  { key: 'plain', label: 'Plain' },
]).replace(/"/g, '&quot;');
const page = `<!doctype html><body>
<aha-dropdown id="busy" loading label="Saving" items="${items}"></aha-dropdown>
<aha-dropdown id="idle" label="Actions" items="${items}"></aha-dropdown>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('loading shows the spinner and blocks opening by click and keyboard; testid reaches the rows', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-loading-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const state = (id) => {
      const root = document.getElementById(id).shadowRoot;
      return { spinner: !!root.querySelector('.trigger .spin'), caret: !!root.querySelector('.trigger aha-icon'), busy: root.querySelector('.trigger').getAttribute('aria-busy'), open: root.querySelector('.dd').classList.contains('open') };
    };
    const busy = document.getElementById('busy');
    const idle = document.getElementById('idle');
    busy.shadowRoot.querySelector('.trigger').click();
    busy.shadowRoot.querySelector('.trigger').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    idle.shadowRoot.querySelector('.trigger').click();
    const afterAttempt = { busy: state('busy'), idle: state('idle') };
    busy.removeAttribute('loading');
    busy.shadowRoot.querySelector('.trigger').click();
    return {
      afterAttempt,
      afterLoaded: state('busy'),
      testids: [...busy.shadowRoot.querySelectorAll('.item')].map((row) => row.getAttribute('data-testid')),
    };
  })()`, { readyExpr: 'window.ready === true' });
  assert.deepEqual(result.afterAttempt.busy, { spinner: true, caret: false, busy: 'true', open: false });
  assert.deepEqual(result.afterAttempt.idle, { spinner: false, caret: true, busy: null, open: true });
  assert.deepEqual(result.afterLoaded, { spinner: false, caret: true, busy: null, open: true });
  assert.deepEqual(result.testids, ['row-edit', 'row-deep', null]);
});
