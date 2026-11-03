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
      const w = (id) => { const el = document.getElementById(id); el.open = true; const width = Math.round(el.shadowRoot.querySelector('.listbox').getBoundingClientRect().width); el.open = false; return width; };
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

test('loading, filter="off", width="content", rich options with a selected label, and mode="tags" work when opted in', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const type = async (text) => command('Input.insertText', { text });
    const out = {};
    out.restFocus = await evaluate(`document.activeElement === document.body`);
    const root = (id) => `document.getElementById('${id}').shadowRoot`;

    out.loadingClosed = await evaluate(`({ spin: getComputedStyle(${root('server')}.querySelector('.spin')).display !== 'none',
      caret: getComputedStyle(${root('server')}.querySelector('.caret')).display !== 'none' })`);
    await evaluate(`window.serverQueries = []; document.getElementById('server').addEventListener('search', (e) => window.serverQueries.push(e.detail.query));
      document.getElementById('server').shadowRoot.querySelector('.trigger').click()`);
    out.loadingOpen = await evaluate(`({ open: document.getElementById('server').open, busy: ${root('server')}.querySelector('.listbox').getAttribute('aria-busy'),
      loadingRow: !${root('server')}.querySelector('.loading').hidden, text: ${root('server')}.querySelector('.loading').textContent,
      empty: !${root('server')}.querySelector('.empty').hidden })`);
    await type('qz');
    await evaluate(`(() => { const el = document.getElementById('server'); el.options = [{ label: 'Quarterly review', value: '7' }, { label: 'Kick-off', value: '9' }]; el.removeAttribute('loading'); })()`);
    out.unfiltered = await evaluate(`({ queries: window.serverQueries, visible: [...${root('server')}.querySelectorAll('.option:not([hidden])')].map((o) => o.dataset.value),
      loadingRow: !${root('server')}.querySelector('.loading').hidden, busy: ${root('server')}.querySelector('.listbox').hasAttribute('aria-busy'),
      query: ${root('server')}.querySelector('.search').value })`);
    await evaluate(`${root('server')}.querySelector('.option[data-value="9"]').click(); document.getElementById('server').options = [{ label: 'Other', value: '1' }]`);
    out.keptLabel = await evaluate(`({ value: document.getElementById('server').value, shown: ${root('server')}.querySelector('.value').textContent })`);
    await evaluate(`document.getElementById('server').options = []; document.getElementById('server').shadowRoot.querySelector('.trigger').click()`);
    out.noResults = await evaluate(`({ open: document.getElementById('server').open, empty: !${root('server')}.querySelector('.empty').hidden })`);

    out.width = await evaluate(`(() => { const el = document.getElementById('role'); const before = Math.round(el.getBoundingClientRect().width);
      el.value = 'viewer'; const after = Math.round(el.getBoundingClientRect().width);
      el.style.cssText = 'position:fixed; right:0; top:0'; el.options = [{ label: 'Editor', value: 'editor' }, { label: 'Viewer only', value: 'viewer', description: 'Can see results but cannot change the deck or its settings' }];
      el.shadowRoot.querySelector('.trigger').click();
      const list = el.shadowRoot.querySelector('.listbox').getBoundingClientRect();
      return { before, after, narrowerThanDefault: before < 240, listInView: list.left >= 0 && list.right <= document.documentElement.clientWidth }; })()`);

    out.country = await evaluate(`(() => { const r = ${root('country')}; const row = r.querySelector('.option');
      const search = r.querySelector('.search'); document.getElementById('country').shadowRoot.querySelector('.trigger').click();
      search.value = '+84'; search.dispatchEvent(new Event('input'));
      return { trigger: r.querySelector('.value').textContent, prefix: row.querySelector('.prefix').textContent, label: row.querySelector('.label').textContent,
        suffix: row.querySelector('.suffix').textContent, matched: [...r.querySelectorAll('.option:not([hidden])')].map((o) => o.dataset.value) }; })()`);
    await evaluate(`window.tagEvents = []; document.getElementById('tags').addEventListener('change', (e) => window.tagEvents.push(e.detail.values)); document.getElementById('tags').focus()`);
    out.tagFocus = await evaluate(`${root('tags')}.activeElement === ${root('tags')}.querySelector('.input')`);
    await evaluate(`document.activeElement.blur && document.activeElement.blur()`);
    const chip = await evaluate(`(() => { const b = ${root('tags')}.querySelector('aha-tag').getBoundingClientRect(); return { x: b.left + 6, y: b.top + b.height / 2 }; })()`);
    for (const type of ['mousePressed', 'mouseReleased']) await command('Input.dispatchMouseEvent', { type, x: chip.x, y: chip.y, button: 'left', clickCount: 1 });
    out.chipClickFocus = await evaluate(`${root('tags')}.activeElement === ${root('tags')}.querySelector('.input')`);
    await type('x@y.z ');
    await type('half');
    out.typed = await evaluate(`({ values: document.getElementById('tags').values, field: ${root('tags')}.querySelector('.input').value })`);
    await evaluate(`(() => { const input = ${root('tags')}.querySelector('.input'); input.value = ''; const data = new DataTransfer();
      data.setData('text/plain', 'p@q.r\\ns@t.u, a@b.c'); input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true })); })()`);
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8 });
    out.tags = await evaluate(`({ values: document.getElementById('tags').values, events: window.tagEvents,
      chips: [...${root('tags')}.querySelectorAll('aha-tag')].map((t) => t.textContent), placeholder: ${root('tags')}.querySelector('.input').placeholder })`);
    out.clipped = await evaluate(`(() => { const el = document.getElementById('clipped'); el.scrollIntoView({ block: 'start' });
      el.shadowRoot.querySelector('.trigger').click();
      const list = el.shadowRoot.querySelector('.listbox'); const box = list.getBoundingClientRect();
      const card = document.getElementById('clip-card').getBoundingClientRect();
      const x = box.left + box.width / 2, y = box.bottom - 12;
      const hit = el.shadowRoot.elementFromPoint(x, y);
      return { topLayer: list.matches(':popover-open'), extendsPastCard: box.bottom > card.bottom, hitIsOption: !!hit && list.contains(hit) }; })()`);
    out.grown = await evaluate(`new Promise((resolve) => { const el = document.getElementById('grow'); el.style.top = (innerHeight - 200) + 'px';
      el.shadowRoot.querySelector('.trigger').click();
      const list = el.shadowRoot.querySelector('.listbox'); const before = list.getBoundingClientRect().bottom <= innerHeight;
      el.options = Array.from({ length: 12 }, (_, i) => ({ label: 'Result ' + (i + 1), value: String(i) })); el.removeAttribute('loading');
      setTimeout(() => { const box = list.getBoundingClientRect();
        resolve({ before, inside: box.top >= 0 && box.bottom <= innerHeight, flipped: el.hasAttribute('_flip') }); }, 150); })`);
    out.reattached = await evaluate(`(() => { const el = document.getElementById('tags'); el.values = ['kept@a.b', 'kept@c.d'];
      const parent = el.parentNode; el.remove(); parent.appendChild(el);
      return { values: el.values, chips: [...el.shadowRoot.querySelectorAll('aha-tag')].map((t) => t.textContent) }; })()`);
    return out;
  }, { readyExpr: '!!window.selectOptionsFixtureReady' });

  assert.deepEqual(result.loadingClosed, { spin: true, caret: false });
  assert.deepEqual(result.loadingOpen, { open: true, busy: 'true', loadingRow: true, text: 'Loading…', empty: false });
  assert.deepEqual(result.unfiltered, { queries: ['qz'], visible: ['7', '9'], loadingRow: false, busy: false, query: 'qz' });
  assert.deepEqual(result.keptLabel, { value: '9', shown: 'Kick-off' });
  assert.deepEqual(result.noResults, { open: true, empty: true });
  assert.equal(result.width.before, result.width.after);
  assert.equal(result.width.narrowerThanDefault, true);
  assert.equal(result.width.listInView, true);
  assert.deepEqual(result.country, { trigger: '🇬🇧 +44', prefix: '🇬🇧', label: 'United Kingdom', suffix: '+44', matched: ['84'] });
  assert.equal(result.tagFocus, true);
  assert.deepEqual(result.typed, { values: ['a@b.c', 'x@y.z'], field: 'half' });
  assert.deepEqual(result.tags, {
    values: ['a@b.c', 'x@y.z', 'p@q.r'],
    events: [['a@b.c', 'x@y.z'], ['a@b.c', 'x@y.z', 'p@q.r', 's@t.u'], ['a@b.c', 'x@y.z', 'p@q.r']],
    chips: ['a@b.c', 'x@y.z', 'p@q.r'],
    placeholder: '',
  });
  assert.deepEqual(result.clipped, { topLayer: true, extendsPastCard: true, hitIsOption: true });
  assert.equal(result.restFocus, true);
  assert.equal(result.chipClickFocus, true);
  assert.deepEqual(result.grown, { before: true, inside: true, flipped: true });
  assert.deepEqual(result.reattached, { values: ['kept@a.b', 'kept@c.d'], chips: ['kept@a.b', 'kept@c.d'] });
});

test('mode="multiple", tags suggestions, option groups and autocomplete trailing text work when opted in', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const press = async (key, code, keyCode) => {
      const fields = { key, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
      await command('Input.dispatchKeyEvent', { type: 'keyDown', ...fields, ...(key === 'Enter' ? { text: '\r' } : {}) });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const type = async (text) => command('Input.insertText', { text });
    const root = (id) => `document.getElementById('${id}').shadowRoot`;
    const state = (id) => evaluate(`(() => { const el = document.getElementById('${id}'); const r = el.shadowRoot;
      return { values: el.values, open: el.hasAttribute('open'), chips: [...r.querySelectorAll('aha-tag:not([closing])')].map((t) => t.textContent),
        selected: [...r.querySelectorAll('.option[aria-selected="true"]')].map((o) => o.dataset.value),
        disabled: [...r.querySelectorAll('.option[aria-disabled="true"]')].map((o) => o.dataset.value),
        visible: [...r.querySelectorAll('.option:not([hidden])')].map((o) => o.dataset.value),
        active: r.querySelector('.option[data-active="true"]')?.dataset.value ?? null, query: r.querySelector('.input').value }; })()`);
    const out = {};

    out.multiStart = await evaluate(`(() => { const r = ${root('multi')}; const input = r.querySelector('.input');
      return { multiselectable: r.querySelector('.listbox').getAttribute('aria-multiselectable'), role: input.getAttribute('role'),
        readOnly: input.readOnly, suffix: r.querySelector('.option[data-value="c2"] .suffix').textContent, chips: [...r.querySelectorAll('aha-tag')].map((t) => t.textContent) }; })()`);
    await evaluate(`window.multiEvents = []; document.getElementById('multi').addEventListener('change', (e) => window.multiEvents.push(e.detail.values));
      document.getElementById('multi').addEventListener('clear', (e) => window.multiEvents.push('clear')); document.getElementById('multi').focus()`);
    await press('ArrowDown', 'ArrowDown', 40);
    await press('ArrowDown', 'ArrowDown', 40);
    await press('Enter', 'Enter', 13);
    out.multiPicked = await state('multi');
    await evaluate(`${root('multi')}.querySelector('.option[data-value="c3"]').click()`);
    out.multiCapped = await state('multi');
    await press('Backspace', 'Backspace', 8);
    out.multiBackspace = await state('multi');
    await evaluate(`${root('multi')}.querySelector('.clear').click()`);
    out.multiCleared = { ...(await state('multi')), events: await evaluate('window.multiEvents') };
    await press('Escape', 'Escape', 27);

    await evaluate(`document.getElementById('multi-search').focus()`);
    await type('expert');
    out.searchFiltered = { ...(await state('multi-search')),
      groups: await evaluate(`[...${root('multi-search')}.querySelectorAll('.group-item')].map((g) => g.hidden)`) };
    await press('Enter', 'Enter', 13);
    out.searchPicked = await state('multi-search');
    await press('Escape', 'Escape', 27);

    await evaluate(`document.getElementById('tags-suggest').focus()`);
    await type('pr');
    out.suggest = await state('tags-suggest');
    await press('ArrowDown', 'ArrowDown', 40);
    await press('Enter', 'Enter', 13);
    out.suggestPicked = await state('tags-suggest');
    await type('Rome');
    out.freeTyped = await state('tags-suggest');
    await press('Enter', 'Enter', 13);
    out.freeAdded = await state('tags-suggest');

    await evaluate(`${root('grouped')}.querySelector('.trigger').click()`);
    out.groupAria = await evaluate(`(() => { const r = ${root('grouped')}; const group = r.querySelector('[role="group"]');
      const label = r.getElementById(group.getAttribute('aria-labelledby'));
      return { label: label.textContent, labelIsOption: label.classList.contains('option'), headers: r.querySelectorAll('.group-label').length }; })()`);
    await press('ArrowDown', 'ArrowDown', 40);
    await press('ArrowDown', 'ArrowDown', 40);
    out.groupKeyboard = await evaluate(`${root('grouped')}.querySelector('.option[data-active="true"]')?.dataset.value`);
    await evaluate(`(() => { const s = ${root('grouped')}.querySelector('.search'); s.value = 'car'; s.dispatchEvent(new Event('input')); })()`);
    out.groupFiltered = await evaluate(`[...${root('grouped')}.querySelectorAll('.group-item')].map((g) => g.hidden)`);
    await press('Enter', 'Enter', 13);
    out.groupPicked = await evaluate(`({ value: document.getElementById('grouped').value, shown: ${root('grouped')}.querySelector('.value').textContent,
      groupsShown: [...${root('grouped')}.querySelectorAll('.group-item')].every((g) => !g.hidden) })`);

    await evaluate(`(() => { const f = ${root('ac')}.querySelector('.field'); f.focus(); f.value = 'apac'; f.dispatchEvent(new Event('input')); })()`);
    out.autocomplete = await evaluate(`[...${root('ac')}.querySelectorAll('.option')].map((o) => ({ label: o.querySelector('.label').textContent, suffix: o.querySelector('.suffix')?.textContent }))`);
    return out;
  }, { readyExpr: '!!window.selectOptionsFixtureReady' });

  const base = { open: true, query: '' };
  assert.deepEqual(result.multiStart, { multiselectable: 'true', role: 'combobox', readOnly: true, suffix: '8', chips: ['Algebra'] });
  assert.deepEqual(result.multiPicked, { ...base, values: ['c1', 'c2'], chips: ['Algebra', 'Biology'], selected: ['c1', 'c2'], disabled: ['c3'], visible: ['c1', 'c2', 'c3'], active: 'c2' });
  assert.deepEqual(result.multiCapped.values, ['c1', 'c2']);
  assert.deepEqual(result.multiBackspace, { ...base, values: ['c1'], chips: ['Algebra'], selected: ['c1'], disabled: [], visible: ['c1', 'c2', 'c3'], active: 'c2' });
  assert.deepEqual(result.multiCleared.values, []);
  assert.deepEqual(result.multiCleared.events, [['c1', 'c2'], ['c1'], [], 'clear']);
  assert.deepEqual(result.searchFiltered, { values: [], open: true, chips: [], selected: [], disabled: [], visible: ['a'], active: 'a', query: 'expert', groups: [false, true] });
  assert.deepEqual(result.searchPicked, { ...base, values: ['a'], chips: ['Advanced'], selected: ['a'], disabled: [], visible: ['i', 'a', 'u'], active: 'a' });
  assert.deepEqual(result.suggest, { values: [], open: true, chips: [], selected: [], disabled: [], visible: ['Prague'], active: null, query: 'pr' });
  assert.deepEqual(result.suggestPicked, { values: ['Prague'], open: true, chips: ['Prague'], selected: ['Prague'], disabled: [], visible: ['Paris', 'Prague', 'Oslo'], active: 'Prague', query: '' });
  assert.equal(result.freeTyped.open, false);
  assert.deepEqual(result.freeAdded.values, ['Prague', 'Rome']);
  assert.deepEqual(result.groupAria, { label: 'Fruit', labelIsOption: false, headers: 2 });
  assert.equal(result.groupKeyboard, 'carrot');
  assert.deepEqual(result.groupFiltered, [true, false]);
  assert.deepEqual(result.groupPicked, { value: 'carrot', shown: 'Carrot', groupsShown: true });
  assert.deepEqual(result.autocomplete, [{ label: 'Asia', suffix: 'APAC' }]);
});
