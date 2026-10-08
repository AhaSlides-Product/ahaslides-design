import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-dropdown.js', import.meta.url))).href;
const items = JSON.stringify([{ key: 'a', label: 'A' }, { key: 'b', label: 'B', disabled: true }, { key: 'c', label: 'C' }]).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-dropdown id="dd" label="Actions" items="${items}"></aha-dropdown>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('Tab from the open trigger enters the menu and steps through enabled items', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-tab-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const host = document.getElementById('dd');
    const root = host.shadowRoot;
    const trigger = root.querySelector('.trigger');
    const key = (target, k, shiftKey = false) => {
      const event = new KeyboardEvent('keydown', { key: k, shiftKey, bubbles: true, composed: true, cancelable: true });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const focused = () => root.activeElement && root.activeElement.getAttribute('data-key') || (root.activeElement === trigger ? 'trigger' : null);
    const isOpen = () => root.querySelector('.dd').classList.contains('open');
    trigger.focus();
    key(trigger, 'Enter');
    const afterOpen = focused();
    trigger.focus();
    key(trigger, 'Tab');
    const afterTab = focused();
    const [first, , last] = root.querySelectorAll('.item');
    key(first, 'Tab');
    const skipsDisabled = focused();
    key(last, 'Tab', true);
    const backToFirst = focused();
    key(first, 'Tab', true);
    const backToTrigger = focused();
    const stillOpen = isOpen();
    key(first, 'Tab');
    key(last, 'Tab');
    return { afterOpen, afterTab, skipsDisabled, backToFirst, backToTrigger, stillOpen, closedPastLast: !isOpen() };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-dropdown")' });
  assert.deepEqual(result, { afterOpen: 'a', afterTab: 'a', skipsDisabled: 'c', backToFirst: 'a', backToTrigger: 'trigger', stillOpen: true, closedPastLast: true });
});
