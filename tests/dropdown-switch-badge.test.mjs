import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-dropdown.js', import.meta.url))).href;
const items = [
  { key: 'start', label: 'Present from start', icon: 'system-play' },
  { key: 'backstage', label: 'Present with Backstage', badge: 'Beta' },
  { type: 'switch', key: 'fullscreen', label: 'Full screen' },
];
const attr = JSON.stringify(items).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-dropdown id="dd" label="Present" items="${attr}"></aha-dropdown>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('a switch row toggles in place with the menu open and emits change, never select; a badge renders after the label', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-switch-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const dd = document.getElementById('dd');
    const root = dd.shadowRoot;
    const row = () => root.querySelector('.item[data-key="fullscreen"]');
    const toggle = () => row().querySelector('aha-switch');
    const events = [];
    dd.addEventListener('change', (e) => events.push(e.detail));
    dd.addEventListener('select', (e) => events.push({ select: e.detail.key }));
    root.querySelector('.trigger').click();
    const node = row();
    const initial = { role: node.getAttribute('role'), checked: node.getAttribute('aria-checked'), switchOn: toggle().hasAttribute('checked') };
    node.click();
    const afterClick = { open: dd.open, checked: node.getAttribute('aria-checked'), switchOn: toggle().hasAttribute('checked'), focused: root.activeElement === node };
    node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    const afterEnter = { open: dd.open, checked: node.getAttribute('aria-checked'), focused: root.activeElement === node };
    const next = JSON.parse(dd.getAttribute('items'));
    next[2].checked = true;
    dd.setAttribute('items', JSON.stringify(next));
    const controlled = { sameNode: row() === node, open: dd.open, checked: row().getAttribute('aria-checked'), switchOn: toggle().hasAttribute('checked') };
    const badgeRow = root.querySelector('.item[data-key="backstage"]');
    const badge = badgeRow.querySelector('aha-badge');
    const label = badgeRow.querySelector('.label');
    return {
      initial, afterClick, afterEnter, controlled, events,
      badge: {
        kind: badge && badge.getAttribute('kind'),
        text: badge && badge.getAttribute('text'),
        afterLabel: !!badge && label.nextElementSibling.nextElementSibling === badge,
        hidden: badge && badge.getAttribute('aria-hidden'),
        name: badgeRow.textContent.trim(),
      },
      plainRowUnchanged: !root.querySelector('.item[data-key="start"] aha-badge') && root.querySelector('.item[data-key="start"]').getAttribute('role') === 'menuitem',
    };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-dropdown") && !!customElements.get("aha-switch")' });
  assert.deepEqual(result, {
    initial: { role: 'menuitemcheckbox', checked: 'false', switchOn: false },
    afterClick: { open: true, checked: 'true', switchOn: true, focused: true },
    afterEnter: { open: true, checked: 'false', focused: true },
    controlled: { sameNode: true, open: true, checked: 'true', switchOn: true },
    events: [{ key: 'fullscreen', checked: true }, { key: 'fullscreen', checked: false }],
    badge: { kind: 'beta', text: 'Beta', afterLabel: true, hidden: 'true', name: 'Present with Backstage, Beta' },
    plainRowUnchanged: true,
  });
});
