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
  { key: 'edit', label: 'Edit', testid: 'row-edit', attrs: { 'data-tracking-name': 'a"b', 'aria-label': 'Edit it', onclick: 'x()', 'data-key': 'spoof', 'data-testid': 'ignored', 'data-off': false } },
  { type: 'group', label: 'More', children: [{ key: 'deep', label: 'Deep', testid: 'row-deep', attrs: { 'data-testid': 'attrs-only' } }] },
  { key: 'plain', label: 'Plain' },
  { type: 'switch', key: 'flip', label: 'Flip', attrs: { 'data-tracking-name': 'flip' } },
  { key: 'sub', label: 'Sub', attrs: { 'data-tracking-name': 'sub' }, children: [{ key: 'leaf', label: 'Leaf', attrs: { 'data-tracking-name': 'leaf' } }] },
]).replace(/"/g, '&quot;');
const page = `<!doctype html><body>
<aha-dropdown id="busy" loading label="Saving" items="${items}"></aha-dropdown>
<aha-dropdown id="idle" label="Actions" items="${items}"></aha-dropdown>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('loading shows the spinner and blocks opening by click and keyboard; testid and attrs reach the rows', { skip }, async () => {
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
      tracked: [...busy.shadowRoot.querySelectorAll('.item')].map((row) => row.getAttribute('data-tracking-name')),
      edit: (({ dataset, attributes }) => ({ key: dataset.key, label: attributes['aria-label'].value, onclick: attributes.onclick ?? null, off: attributes['data-off'] ?? null }))(busy.shadowRoot.querySelector('.item')),
    };
  })()`, { readyExpr: '!!window.ready' });
  assert.deepEqual(result.afterAttempt.busy, { spinner: true, caret: false, busy: 'true', open: false });
  assert.deepEqual(result.afterAttempt.idle, { spinner: false, caret: true, busy: null, open: true });
  assert.deepEqual(result.afterLoaded, { spinner: false, caret: true, busy: null, open: true });
  assert.deepEqual(result.testids, ['row-edit', 'row-deep', null, null, null, null]);
  assert.deepEqual(result.tracked, ['a"b', null, null, 'flip', 'sub', 'leaf']);
  assert.deepEqual(result.edit, { key: 'edit', label: 'Edit it', onclick: null, off: null });
});
