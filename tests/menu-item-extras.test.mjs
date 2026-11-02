import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const libUrl = pathToFileURL(fileURLToPath(new URL('../lib/aha-menu.js', import.meta.url))).href;
const items = JSON.stringify([
  { key: 'rename', label: 'Rename', testid: 'row-rename' },
  { key: 'export', label: 'Export', slot: 'export', attrs: { 'data-track': 'export', 'aria-label': 'Export to PDF', onclick: 'x', 'data-key': 'forged' } },
  { key: 'copy', label: 'Copy', disabled: true },
  { key: 'delete', label: 'Delete', danger: true, disabled: true },
  { key: 'plain', label: 'Plain' },
]).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-menu id="menu" items="${items}"><b slot="export">Export <i>Pro</i></b></aha-menu>
<script type="module">import '${libUrl}'; window.ready = true;</script>`;

test('row testid, attrs and slot reach the row; disabled rows are aria-disabled and skipped by the arrow keys', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'menu-extras-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const root = document.getElementById('menu').shadowRoot;
    const [rename, exportRow, copy, remove, plain] = root.querySelectorAll('.item');
    const slot = exportRow.querySelector('slot');
    rename.focus();
    exportRow.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const afterDown = root.activeElement && root.activeElement.dataset.key;
    return {
      testid: rename.getAttribute('data-testid'),
      track: exportRow.getAttribute('data-track'),
      ariaLabel: exportRow.getAttribute('aria-label'),
      dropped: exportRow.hasAttribute('onclick') || exportRow.getAttribute('data-key') !== 'export',
      projected: slot && slot.assignedElements().map((el) => el.textContent).join(),
      disabled: [copy, remove].map((row) => row.disabled && row.getAttribute('aria-disabled')),
      disabledDangerInk: getComputedStyle(remove).color === getComputedStyle(copy).color,
      afterDown,
      plainUnchanged: !plain.hasAttribute('data-testid') && !plain.hasAttribute('aria-disabled') && !plain.querySelector('slot'),
    };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-menu")' });
  assert.equal(result.testid, 'row-rename');
  assert.equal(result.track, 'export');
  assert.equal(result.ariaLabel, 'Export to PDF');
  assert.equal(result.dropped, false);
  assert.equal(result.projected, 'Export Pro');
  assert.deepEqual(result.disabled, ['true', 'true']);
  assert.equal(result.disabledDangerInk, true);
  assert.equal(result.afterDown, 'plain');
  assert.equal(result.plainUnchanged, true);
});
