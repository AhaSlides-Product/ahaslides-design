import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-list.js', import.meta.url))).href;
const items = JSON.stringify([
  { key: 'nps', title: 'NPS survey' },
  { key: 'csat', title: 'CSAT survey', selected: true, actions: [{ key: 'edit', icon: 'system-pencil-simple', label: 'Edit' }] },
  { title: 'Untitled survey' },
]).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-list id="picker" selectable list-title="Pick a survey" items="${items}"></aha-list>
<aha-list id="plain" list-title="Pick a survey" items="${items}"></aha-list>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('selectable turns item rows into a single-choice listbox with no controls inside options; without it rows stay a plain list with their actions', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'list-selectable-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const root = (id) => document.getElementById(id).shadowRoot;
    const rows = (id) => [...root(id).querySelectorAll('.row')];
    const state = (id) => rows(id).map((r) => r.getAttribute('aria-selected'));
    const tabs = (id) => rows(id).map((r) => r.tabIndex);
    const picker = document.getElementById('picker');
    const events = [];
    picker.addEventListener('select', (e) => events.push(e.detail));
    const before = { role: root('picker').querySelector('.rows').getAttribute('role'), roles: rows('picker').map((r) => r.getAttribute('role')), selected: state('picker'), tabs: tabs('picker') };
    const firstRow = rows('picker')[0];
    const controlsInOptions = root('picker').querySelectorAll('[role="option"] button, [role="option"] .act').length;
    rows('picker')[2].click();
    const afterClick = { value: picker.getAttribute('value'), selected: state('picker'), focused: root('picker').activeElement === rows('picker')[2] };
    rows('picker')[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    root('picker').activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    root('picker').activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const afterKeys = { value: picker.getAttribute('value'), selected: state('picker'), tabs: tabs('picker') };
    picker.setAttribute('value', 'nps');
    return {
      before, controlsInOptions, afterClick, afterKeys, events,
      appSet: { selected: state('picker'), rebuilt: rows('picker')[0] !== firstRow },
      plain: { role: root('plain').querySelector('.rows').getAttribute('role'), roles: rows('plain').map((r) => r.getAttribute('role')), selected: rows('plain').map((r) => r.hasAttribute('aria-selected')), tabbable: rows('plain').map((r) => r.hasAttribute('tabindex')), actions: [...root('plain').querySelectorAll('.act')].map((b) => b.getAttribute('data-key')) },
    };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-list")' });
  assert.deepEqual(result, {
    before: { role: 'listbox', roles: ['option', 'option', 'option'], selected: ['false', 'true', 'false'], tabs: [-1, 0, -1] },
    controlsInOptions: 0,
    afterClick: { value: '2', selected: ['false', 'false', 'true'], focused: true },
    afterKeys: { value: 'csat', selected: ['false', 'true', 'false'], tabs: [-1, 0, -1] },
    events: [{ key: '2', index: 2 }, { key: 'csat', index: 1 }],
    appSet: { selected: ['true', 'false', 'false'], rebuilt: false },
    plain: { role: 'list', roles: ['listitem', 'listitem', 'listitem'], selected: [false, false, false], tabbable: [false, false, false], actions: ['edit'] },
  });
});
