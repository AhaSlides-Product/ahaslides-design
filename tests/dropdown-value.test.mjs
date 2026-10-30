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
  { key: 'editor', label: 'Editor', description: 'Edit and present' },
  { key: 'presenter', label: 'Presenter', description: 'Present only, cannot edit' },
]).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-dropdown id="picker" value="editor" items="${items}"></aha-dropdown>
<aha-dropdown id="labelled" label="Share as" value="editor" items="${items}"></aha-dropdown>
<aha-dropdown id="actions" label="Actions" items="${items}"></aha-dropdown>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('value makes the dropdown a single-choice picker; without it rows stay plain actions', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-value-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const root = (id) => document.getElementById(id).shadowRoot;
    const rows = (id) => [...root(id).querySelectorAll('.item')];
    const triggerText = (id) => root(id).querySelector('.trigger-label').textContent;
    const picker = document.getElementById('picker');
    const before = { text: triggerText('picker'), roles: rows('picker').map((r) => r.getAttribute('role')), checked: rows('picker').map((r) => r.getAttribute('aria-checked')), selected: rows('picker').map((r) => r.classList.contains('selected')) };
    const selectedRow = rows('picker')[0];
    const style = getComputedStyle(selectedRow);
    const tinted = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.fontWeight === '600';
    const sameNode = selectedRow;
    const events = [];
    picker.addEventListener('select', (e) => events.push(e.detail.key));
    root('picker').querySelector('.trigger').click();
    const focusedOnOpen = root('picker').activeElement && root('picker').activeElement.getAttribute('data-key');
    rows('picker')[1].click();
    const after = { value: picker.getAttribute('value'), text: triggerText('picker'), selected: rows('picker').map((r) => r.classList.contains('selected')), closed: !root('picker').querySelector('.dd').classList.contains('open'), rebuilt: rows('picker')[0] !== sameNode, events };
    picker.setAttribute('value', 'editor');
    return {
      before, tinted, focusedOnOpen, after,
      appSet: { text: triggerText('picker'), selected: rows('picker').map((r) => r.classList.contains('selected')) },
      explicitLabelWins: triggerText('labelled'),
      actions: { roles: rows('actions').map((r) => r.getAttribute('role')), checked: rows('actions').map((r) => r.hasAttribute('aria-checked')), selected: rows('actions').map((r) => r.classList.contains('selected')), text: triggerText('actions') },
    };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-dropdown")' });
  assert.deepEqual(result, {
    before: { text: 'Editor', roles: ['menuitemradio', 'menuitemradio'], checked: ['true', 'false'], selected: [true, false] },
    tinted: true,
    focusedOnOpen: 'editor',
    after: { value: 'presenter', text: 'Presenter', selected: [false, true], closed: true, rebuilt: false, events: ['presenter'] },
    appSet: { text: 'Editor', selected: [true, false] },
    explicitLabelWins: 'Share as',
    actions: { roles: ['menuitem', 'menuitem'], checked: [false, false], selected: [false, false], text: 'Actions' },
  });
});
