import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const source = readFileSync(new URL('../lib/aha-select.js', import.meta.url), 'utf8');

test('Escape on the open trigger closes and stops propagation, closed Escape is ignored', () => {
  assert.match(source, /e\.key === 'Escape' && this\.open\) \{ e\.preventDefault\(\); e\.stopPropagation\(\); this\._close\(true\)/);
});

test('Escape in the list stops propagation', () => {
  assert.match(source, /case 'Escape': e\.preventDefault\(\); e\.stopPropagation\(\); this\._close\(true\)/);
});

const fixture = pathToFileURL(fileURLToPath(new URL('./select-escape.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('Escape in an open select closes only the list, not the surrounding drawer or modal', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const press = async (key, code, keyCode) => {
      const fields = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
      await command('Input.dispatchKeyEvent', { type: 'keyDown', ...fields });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const out = {};
    for (const [host, select] of [['drawer', 'drawer-select'], ['modal', 'modal-select']]) {
      await evaluate(`document.getElementById('${select}').focus(); document.getElementById('${select}')._openList()`);
      await press('Escape', 'Escape', 27);
      out[host] = await evaluate(`({ selectOpen: document.getElementById('${select}').open, hostOpen: document.getElementById('${host}').hasAttribute('open') })`);
      if (host === 'drawer') await evaluate(`document.getElementById('drawer').close()`);
    }
    return out;
  }, { readyExpr: '!!window.selectEscapeFixtureReady' });
  assert.deepEqual(result.drawer, { selectOpen: false, hostOpen: true });
  assert.deepEqual(result.modal, { selectOpen: false, hostOpen: true });
});
