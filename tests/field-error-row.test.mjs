import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

const page = `<!doctype html><body>
<aha-input id="input" status="error" error-message="Enter a name"></aha-input>
<aha-input id="large" size="large"></aha-input>
<aha-select id="select" status="error" error-message="Pick one"></aha-select>
<aha-counted-textarea id="area" status="error" error-message="Too short"></aha-counted-textarea>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('error-message renders a 12px glyph and sm text below the field, linked and invalid', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'field-error-row-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const rowOf = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const field = root.querySelector('.field, .trigger');
      const error = root.querySelector('aha-field-error');
      const glyph = error.shadowRoot.querySelector('.glyph').getBoundingClientRect();
      return { text: error.textContent, size: getComputedStyle(error).fontSize, glyph: glyph.width + 'x' + glyph.height,
        below: error.getBoundingClientRect().top >= field.getBoundingClientRect().bottom,
        invalid: field.getAttribute('aria-invalid'), described: field.ariaDescribedByElements.length };
    };
    const height = (id) => document.getElementById(id).shadowRoot.querySelector('.wrap').getBoundingClientRect().height;
    return { input: rowOf('input'), select: rowOf('select'), area: rowOf('area'), defaultHeight: height('input'), largeHeight: height('large') };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-select")' });
  const row = (text) => ({ text, size: '12px', glyph: '12x12', below: true, invalid: 'true', described: 1 });
  assert.deepEqual(result, { input: row('Enter a name'), select: row('Pick one'), area: row('Too short'), defaultHeight: 40, largeHeight: 48 });
});

test('toggling status or invalid after error-message shows and clears the error row', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'field-error-toggle-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>
<aha-input id="input" error-message="Enter a name"></aha-input>
<script type="module">import '${lib}'; window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const host = document.getElementById('input');
    const root = host.shadowRoot;
    const field = root.querySelector('.field');
    const error = root.querySelector('aha-field-error');
    const state = () => ({ message: error.message, described: (field.ariaDescribedByElements || []).length });
    const before = state();
    host.setAttribute('status', 'error');
    const withStatus = state();
    host.removeAttribute('status');
    const statusRemoved = state();
    host.setAttribute('invalid', '');
    const withInvalid = state();
    host.removeAttribute('invalid');
    return { before, withStatus, statusRemoved, withInvalid, invalidRemoved: state() };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-input")' });
  const hidden = { message: '', described: 0 };
  const shown = { message: 'Enter a name', described: 1 };
  assert.deepEqual(result, { before: hidden, withStatus: shown, statusRemoved: hidden, withInvalid: shown, invalidRemoved: hidden });
});
