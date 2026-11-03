import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = (name) => pathToFileURL(fileURLToPath(new URL(`../lib/${name}.js`, import.meta.url))).href;

const page = `<!doctype html><body>
<aha-counted-input id="plain"></aha-counted-input>
<aha-counted-input id="auto" autofocus></aha-counted-input>
<aha-audience-field id="field" label="Code"><aha-counted-input></aha-counted-input></aha-audience-field>
<aha-audience-field id="autofield" label="Name" autofocus><aha-counted-input></aha-counted-input></aha-audience-field>
<script type="module">import '${lib('aha-counted-input')}'; import '${lib('aha-audience-field')}'; window.ready = true;</script>`;

test('focus() reaches the inner field and autofocus focuses it once, for both components', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'counted-focus-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const inner = (el) => el.shadowRoot.activeElement && el.shadowRoot.activeElement.localName;
    const wait = () => new Promise((r) => setTimeout(r, 50));
    await wait();
    const out = {};
    const autoFocused = document.activeElement;
    out.autofocus = [autoFocused.id || autoFocused.localName, inner(document.getElementById('auto')) || inner(document.getElementById('autofield').querySelector('aha-counted-input'))];
    document.getElementById('plain').focus();
    out.plain = [document.activeElement.id, inner(document.getElementById('plain')), document.getElementById('plain').hasAttribute('_focused')];
    const control = document.getElementById('field').querySelector('aha-counted-input');
    document.getElementById('field').focus();
    out.field = [document.activeElement === control, inner(control)];
    control.shadowRoot.querySelector('.field').blur();
    document.getElementById('autofield').setAttribute('autofocus', '');
    document.getElementById('autofield').querySelector('aha-counted-input').shadowRoot.querySelector('.field').blur();
    await wait();
    out.once = document.activeElement === document.body;
    return out;
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-counted-input") && !!customElements.get("aha-audience-field")' });
  assert.deepEqual(result.plain, ['plain', 'input', true], 'host.focus() lands in the inner input and draws the focus state');
  assert.deepEqual(result.field, [true, 'input'], 'audience-field.focus() focuses the slotted control and its inner input');
  assert.equal(result.autofocus[1], 'input', 'an autofocus attribute focuses the inner input on load');
  assert.equal(result.once, true, 'autofocus fires once, not again on later attribute changes');
});
