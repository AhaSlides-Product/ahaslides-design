import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-answer-list.js', import.meta.url))).href;
const OPTIONS = JSON.stringify([{ id: 'a', label: 'Coffee' }, { id: 'b', label: 'Tea' }, { id: 'o', label: 'Other (please specify)', other: true, otherValue: 'Mate' }]);

async function run(attrs, body) {
  const file = join(mkdtempSync(join(tmpdir(), 'answer-list-opt-in-')), 'page.html');
  writeFileSync(file, `<!doctype html><body><aha-answer-list ${attrs} options='${OPTIONS}'></aha-answer-list>
<script type="module">import { answerOptionLabel } from '${lib}'; window.answerOptionLabel = answerOptionLabel; await customElements.whenDefined('aha-answer-list'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const list = document.querySelector('aha-answer-list');
    const rows = [...list.shadowRoot.querySelector('.list').children];
    const stops = () => rows.map((r) => r._choice().tabIndex);
    ${body}
  })()`, { readyExpr: '!!window.ready' });
}

test('answerOptionLabel runs A to Z then AA, numbers from 1, and nothing for an unknown style', { skip }, async () => {
  const result = await run('', `return { alphabet: [0, 25, 26, 27].map((i) => answerOptionLabel('alphabet', i)), other: [answerOptionLabel('number', 0), answerOptionLabel(null, 0)] };`);
  assert.deepEqual(result, { alphabet: ['A', 'Z', 'AA', 'AB'], other: ['1', ''] });
});

test('without the opt-in attributes the rows carry no letter and each is a Tab stop', { skip }, async () => {
  const result = await run('', `return { letters: rows.map((r) => r.getAttribute('letter')), stops: stops() };`);
  assert.deepEqual(result, { letters: [null, null, null], stops: [0, 0, 0] });
});

test('option-labels, roving and an other option reach the rows; other-input carries the option id', { skip }, async () => {
  const result = await run('option-labels="alphabet" roving other-placeholder="Type it"', `
    const seen = [];
    list.addEventListener('other-input', (e) => seen.push(e.detail));
    const other = rows[2];
    const input = other.shadowRoot.querySelector('.other-input');
    input.value = 'Yerba mate';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    return { letters: rows.map((r) => r.getAttribute('letter')), stops: stops(), other: other.hasAttribute('other'),
      seeded: other.getAttribute('other-value'), placeholder: input.placeholder, seen };`);
  assert.deepEqual(result, {
    letters: ['A', 'B', 'C'], stops: [0, -1, -1], other: true, seeded: 'Mate', placeholder: 'Type it',
    seen: [{ id: 'o', value: 'Yerba mate' }],
  });
});
