import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = (name) => pathToFileURL(fileURLToPath(new URL(`../lib/${name}.js`, import.meta.url))).href;
const items = JSON.stringify([{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-dropdown id="plain" label="Actions" items="${items}"></aha-dropdown>
<aha-dropdown id="kebab" items="${items}"><aha-button slot="trigger" icon-only aria-label="More"><aha-icon slot="icon" name="system-dots-three-vertical" size="16" decorative></aha-icon></aha-button></aha-dropdown>
<script type="module">import '${lib('aha-button')}'; import '${lib('aha-dropdown')}'; window.ready = true;</script>`;

test('a slotted trigger replaces the default button and drives the menu', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'dropdown-slot-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const plain = document.getElementById('plain');
    const host = document.getElementById('kebab');
    const root = host.shadowRoot;
    const trigger = host.querySelector('[slot=trigger]');
    const isOpen = () => root.querySelector('.dd').classList.contains('open');
    const key = (k) => {
      const inner = trigger.shadowRoot.querySelector('button');
      const event = new KeyboardEvent('keydown', { key: k, bubbles: true, composed: true, cancelable: true });
      inner.dispatchEvent(event);
    };
    const plainVisible = getComputedStyle(plain.shadowRoot.querySelector('.trigger')).display !== 'none';
    const defaultHidden = getComputedStyle(root.querySelector('.trigger')).display === 'none';
    const initial = { haspopup: trigger.getAttribute('aria-haspopup'), expanded: trigger.getAttribute('aria-expanded') };
    trigger.click();
    const afterClick = { open: isOpen(), expanded: trigger.getAttribute('aria-expanded') };
    key('Escape');
    const afterEscape = { open: isOpen(), expanded: trigger.getAttribute('aria-expanded') };
    key('Enter');
    const afterEnter = isOpen();
    key('Escape');
    key('ArrowDown');
    const afterArrow = isOpen();
    return { plainVisible, defaultHidden, initial, afterClick, afterEscape, afterEnter, afterArrow };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-dropdown") && !!customElements.get("aha-button")' });
  assert.deepEqual(result, {
    plainVisible: true, defaultHidden: true,
    initial: { haspopup: 'menu', expanded: 'false' },
    afterClick: { open: true, expanded: 'true' },
    afterEscape: { open: false, expanded: 'false' },
    afterEnter: true, afterArrow: true,
  });
});
