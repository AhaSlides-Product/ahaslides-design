import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-dropdown.js', import.meta.url))).href;
const attr = (value) => JSON.stringify(value).replace(/"/g, '&quot;');
const share = [
  { key: 'copy', label: 'Copy link' },
  { key: 'visibility', label: 'Visibility', children: [
    { key: 'private', label: 'Only me', selected: false },
    { key: 'team', label: 'Team', selected: true },
    { key: 'public', label: 'Anyone with the link', selected: false },
  ] },
];

const page = `<!doctype html><body>
<aha-dropdown id="share" label="Share" items="${attr(share)}"></aha-dropdown>
<aha-dropdown id="mixed" label="Share" value="copy" items="${attr(share)}"></aha-dropdown>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('a per-item selected marks its own list as a radio set that does not move on select', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-selected-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const root = (id) => document.getElementById(id).shadowRoot;
    const row = (id, key) => root(id).querySelector('.item[data-key="' + key + '"]');
    const state = (id) => ['copy', 'visibility', 'private', 'team', 'public'].map((key) => {
      const r = row(id, key);
      return key + ':' + r.getAttribute('role') + ':' + r.getAttribute('aria-checked') + ':' + r.classList.contains('selected');
    });
    const share = document.getElementById('share');
    const before = state('share');
    const style = getComputedStyle(row('share', 'team'));
    const look = style.fontWeight + ' ' + style.backgroundColor;
    const events = [];
    share.addEventListener('select', (e) => events.push(e.detail.key));
    root('share').querySelector('.trigger').click();
    const focusedOnOpen = root('share').activeElement && root('share').activeElement.getAttribute('data-key');
    row('share', 'public').click();
    const afterSelect = state('share');
    const mixed = document.getElementById('mixed');
    row('mixed', 'public').click();
    return { before, look, focusedOnOpen, afterSelect, events, mixed: state('mixed'), mixedValue: mixed.getAttribute('value') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-dropdown")' });
  assert.deepEqual(result, {
    before: ['copy:menuitem:null:false', 'visibility:menuitem:null:false', 'private:menuitemradio:false:false', 'team:menuitemradio:true:true', 'public:menuitemradio:false:false'],
    look: '600 rgba(231, 14, 104, 0.05)',
    focusedOnOpen: null,
    afterSelect: ['copy:menuitem:null:false', 'visibility:menuitem:null:false', 'private:menuitemradio:false:false', 'team:menuitemradio:true:true', 'public:menuitemradio:false:false'],
    events: ['public'],
    mixed: ['copy:menuitemradio:true:true', 'visibility:menuitem:null:false', 'private:menuitemradio:false:false', 'team:menuitemradio:true:true', 'public:menuitemradio:false:false'],
    mixedValue: 'copy',
  });
});
