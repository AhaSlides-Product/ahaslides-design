import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./select-options.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('allow-clear, show-search, option description and popup-width work, and a plain select is unchanged', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const press = async (key, code, keyCode, text) => {
      const fields = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
      await command('Input.dispatchKeyEvent', { type: 'keyDown', ...fields, ...(text ? { text } : {}) });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const out = {};
    const root = (id) => `document.getElementById('${id}').shadowRoot`;

    out.plain = await evaluate(`({ clearShown: getComputedStyle(${root('plain')}.querySelector('.clear')).display !== 'none',
      searchShown: getComputedStyle(${root('plain')}.querySelector('.search')).display !== 'none',
      descriptions: ${root('plain')}.querySelectorAll('.description').length })`);

    out.clear = await evaluate(`new Promise((resolve) => {
      const el = document.getElementById('clearable'); const events = [];
      el.addEventListener('change', (e) => events.push('change:' + e.detail.value));
      el.addEventListener('clear', (e) => events.push('clear:' + e.detail.value));
      const shownBefore = getComputedStyle(el.shadowRoot.querySelector('.clear')).display !== 'none';
      el.shadowRoot.querySelector('.clear').click();
      resolve({ shownBefore, value: el.value, events, shownAfter: getComputedStyle(el.shadowRoot.querySelector('.clear')).display !== 'none' });
    })`);

    await evaluate(`document.getElementById('search').shadowRoot.querySelector('.trigger').focus()`);
    await press('a', 'KeyA', 65, 'a');
    await press('l', 'KeyL', 76, 'l');
    out.filtered = await evaluate(`(() => { const r = ${root('search')};
      return { focused: r.activeElement === r.querySelector('.search'), query: r.querySelector('.search').value,
        visible: [...r.querySelectorAll('.option:not([hidden])')].map((o) => o.dataset.value),
        active: r.querySelector('.option[data-active="true"]')?.dataset.value,
        activedescendant: r.querySelector('.search').getAttribute('aria-activedescendant') === r.querySelector('.option[data-active="true"]')?.id }; })()`);
    await evaluate(`document.getElementById('search').shadowRoot.querySelector('.search').value = 'zzz'; document.getElementById('search').shadowRoot.querySelector('.search').dispatchEvent(new Event('input'))`);
    out.noMatch = await evaluate(`(() => { const e = ${root('search')}.querySelector('.empty'); return { shown: !e.hidden, text: e.textContent }; })()`);
    await evaluate(`document.getElementById('search').shadowRoot.querySelector('.search').value = 'gam'; document.getElementById('search').shadowRoot.querySelector('.search').dispatchEvent(new Event('input'))`);
    out.composing = await evaluate(`(() => { const el = document.getElementById('search'); const before = el.value;
      el.shadowRoot.querySelector('.search').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, composed: true }));
      return { unchanged: el.value === before, open: el.open }; })()`);
    await press('Enter', 'Enter', 13, '\r');
    out.picked = await evaluate(`({ value: document.getElementById('search').value, open: document.getElementById('search').open,
      searchShown: getComputedStyle(${root('search')}.querySelector('.search')).display !== 'none',
      allVisible: ${root('search')}.querySelectorAll('.option[hidden]').length === 0 })`);

    out.rich = await evaluate(`(() => { const o = ${root('rich')}.querySelector('.option');
      return { label: o.querySelector('.label').textContent, description: o.querySelector('.description').textContent, title: o.title }; })()`);

    out.width = await evaluate(`(() => {
      const w = (id) => Math.round(document.getElementById(id).shadowRoot.querySelector('.listbox').getBoundingClientRect().width);
      return { match: w('match'), matchControl: Math.round(document.getElementById('match').getBoundingClientRect().width), fixed: w('fixed') }; })()`);
    return out;
  }, { readyExpr: '!!window.selectOptionsFixtureReady' });

  assert.deepEqual(result.plain, { clearShown: false, searchShown: false, descriptions: 0 });
  assert.deepEqual(result.clear, { shownBefore: true, value: '', events: ['change:', 'clear:'], shownAfter: false });
  assert.deepEqual(result.filtered, { focused: true, query: 'al', visible: ['a', 'ab'], active: 'a', activedescendant: true });
  assert.deepEqual(result.noMatch, { shown: true, text: 'No matches' });
  assert.deepEqual(result.composing, { unchanged: true, open: true });
  assert.deepEqual(result.picked, { value: 'g', open: false, searchShown: false, allVisible: true });
  assert.deepEqual(result.rich, { label: 'Editor', description: 'Edit and view results', title: 'Can edit' });
  assert.equal(result.width.match, result.width.matchControl);
  assert.equal(result.width.fixed, 180);
});
