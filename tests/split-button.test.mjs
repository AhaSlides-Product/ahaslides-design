import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-split-button.js', import.meta.url))).href;
const items = JSON.stringify([{ key: 'start', label: 'Present from start' }, { key: 'current', label: 'Present from current slide' }]).replace(/"/g, '&quot;');

const page = `<!doctype html><body>
<aha-split-button id="split" variant="primary" items="${items}">Present</aha-split-button>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('the main half fires click, the caret opens the menu without it, and a row emits select', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'split-button-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const host = document.getElementById('split');
    const root = host.shadowRoot;
    const main = root.querySelector('.main');
    const caret = root.querySelector('.caret');
    const menu = root.querySelector('.menu');
    const inner = (el) => el.shadowRoot.querySelector('button');
    const clicks = [];
    const selected = [];
    host.addEventListener('click', () => clicks.push('click'));
    host.addEventListener('select', (e) => selected.push(e.detail.key));
    inner(main).click();
    inner(caret).click();
    const afterCaret = { clicks: clicks.length, open: menu.open, expanded: caret.getAttribute('aria-expanded'), haspopup: caret.getAttribute('aria-haspopup'), label: caret.getAttribute('aria-label') };
    menu.shadowRoot.querySelector('.item[data-key=current]').click();
    const afterSelect = { clicks: clicks.length, selected: selected.slice(), open: menu.open };
    const radii = { mainEnd: getComputedStyle(inner(main)).borderTopRightRadius, caretStart: getComputedStyle(inner(caret)).borderTopLeftRadius, mainStart: getComputedStyle(inner(main)).borderTopLeftRadius };
    host.setAttribute('loading', '');
    const loading = { main: main.hasAttribute('loading'), caret: caret.hasAttribute('loading') };
    host.removeAttribute('loading');
    host.setAttribute('disabled', '');
    await new Promise((r) => requestAnimationFrame(r));
    const disabled = { main: inner(main).disabled, caret: inner(caret).disabled };
    return { afterCaret, afterSelect, radii, loading, disabled, sameNodes: root.querySelector('.main') === main };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-split-button")' });
  assert.deepEqual(result, {
    afterCaret: { clicks: 1, open: true, expanded: 'true', haspopup: 'menu', label: 'More options' },
    afterSelect: { clicks: 1, selected: ['current'], open: false },
    radii: { mainEnd: '0px', caretStart: '0px', mainStart: '8px' },
    loading: { main: true, caret: false },
    disabled: { main: true, caret: true },
    sameNodes: true,
  });
});
