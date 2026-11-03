import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const libUrl = (name) => pathToFileURL(fileURLToPath(new URL(`../lib/${name}.js`, import.meta.url))).href;
const items = JSON.stringify([
  { key: 'duplicate', label: 'Duplicate', icon: 'system-duplicate', shortcut: 'Mod+D' },
  { key: 'copy', label: 'Copy to…' },
  { key: 'move', label: 'Move', description: 'To another presentation', shortcut: 'Mod+M' },
  { key: 'delete', label: 'Delete', shortcut: 'Del', disabled: true },
]).replace(/"/g, '&quot;');

const page = `<!doctype html><body style="font:14px sans-serif">
<aha-menu id="menu" items="${items}"></aha-menu>
<aha-dropdown id="dd" label="Slide" open items="${items}"></aha-dropdown>
<script type="module">import '${libUrl('aha-menu')}'; import '${libUrl('aha-dropdown')}'; window.ready = true;</script>`;

test('a row shortcut draws the DS chip on the trailing edge of the label line; rows without one are unchanged', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'menu-shortcut-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const read = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const [duplicate, copy, move, remove] = root.querySelectorAll('.panel .item, .menu .item');
      const chip = (row) => row.querySelector('.shortcut');
      const box = (el) => el.getBoundingClientRect();
      const centre = (el) => (box(el).top + box(el).bottom) / 2;
      const onLabelLine = (row) => Math.abs(centre(chip(row)) - centre(row.querySelector('.label'))) <= 1;
      const trailing = (row) => Math.abs(box(row).right - parseFloat(getComputedStyle(row).paddingRight) - box(chip(row)).right) <= 1;
      return {
        text: chip(duplicate).textContent,
        hidden: chip(duplicate).getAttribute('aria-hidden'),
        keys: duplicate.getAttribute('aria-keyshortcuts'),
        height: getComputedStyle(duplicate).height,
        placed: onLabelLine(duplicate) && trailing(duplicate),
        withDescription: onLabelLine(move) && trailing(move) && box(chip(move)).bottom <= box(move.querySelector('.description')).top,
        plain: !chip(copy) && !copy.hasAttribute('aria-keyshortcuts'),
        deleteKeys: remove.getAttribute('aria-keyshortcuts'),
        disabledColour: getComputedStyle(chip(remove)).color === getComputedStyle(remove).color,
      };
    };
    return { menu: read('menu'), dropdown: read('dd') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-menu") && !!customElements.get("aha-dropdown")' });
  for (const which of ['menu', 'dropdown']) {
    assert.equal(result[which].text, 'Ctrl D', which);
    assert.equal(result[which].hidden, 'true', which);
    assert.equal(result[which].keys, 'Control+D', which);
    assert.equal(result[which].placed, true, which);
    assert.equal(result[which].withDescription, true, which);
    assert.equal(result[which].plain, true, which);
    assert.equal(result[which].deleteKeys, 'Delete', which);
    assert.equal(result[which].disabledColour, true, which);
  }
  assert.equal(result.menu.height, '36px');
});
