import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

test('typing in an option row keeps the typed text and emits one input with the value; a question list emits only its change', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'option-row-input-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>
<aha-option-row id="row" value="Paris"></aha-option-row>
<aha-question-list id="list" questions='[{"prompt":"Q","options":[{"text":"A"},{"text":"B"}]}]'></aha-question-list>
<script type="module">import '${lib}'; window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const type = (textarea, text) => {
      textarea.value = text;
      textarea.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true, inputType: 'insertText', data: text.slice(-1) }));
    };
    const row = document.getElementById('row');
    const values = [];
    row.addEventListener('input', (e) => values.push(e.detail && e.detail.value));
    type(row.shadowRoot.querySelector('.field').shadowRoot.querySelector('textarea'), 'ParisX');
    const list = document.getElementById('list');
    const changes = [];
    list.addEventListener('change', (e) => changes.push(!!(e.detail && e.detail.questions)));
    let leakedInputs = 0;
    list.addEventListener('input', () => leakedInputs++);
    const option = list.shadowRoot.querySelector('aha-option-row');
    type(option.shadowRoot.querySelector('.field').shadowRoot.querySelector('textarea'), 'AX');
    return { value: row.getAttribute('value'), values: values.filter(Boolean), optionText: list.questions[0].options[0].text, changes, leakedInputs };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-question-list")' });
  assert.deepEqual(result, { value: 'ParisX', values: ['ParisX'], optionText: 'AX', changes: [true], leakedInputs: 0 });
});
