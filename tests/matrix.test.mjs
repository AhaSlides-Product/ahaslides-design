import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./matrix.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const ready = { readyExpr: '!!window.matrixFixtureReady' };

const pick = (id, row, column) => `(() => {
  const matrix = document.querySelector('#${id}');
  const option = [...matrix.shadowRoot.querySelectorAll('aha-answer-option')]
    .find((o) => o.dataset.rowId === '${row}' && o.dataset.columnId === '${column}');
  option.shadowRoot.querySelector('.row').click();
})()`;

test('single mode keeps one column per row and every pick fires change with the whole value', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const matrix = document.querySelector('#single');
    const events = [];
    matrix.addEventListener('change', (e) => events.push(e.detail));
    ${pick('single', 'venue', 'ok')};
    ${pick('single', 'venue', 'great')};
    ${pick('single', 'talks', 'poor')};
    const selected = [...matrix.shadowRoot.querySelectorAll('aha-answer-option[selected]')].map((o) => o.dataset.rowId + ':' + o.dataset.columnId);
    return { value: matrix.value, last: events.at(-1), count: events.length, selected };
  })()`, ready);
  assert.deepEqual(result.value, { venue: ['great'], talks: ['poor'] });
  assert.deepEqual(result.last, { value: { venue: ['great'], talks: ['poor'] }, row: 'talks', column: 'poor' });
  assert.equal(result.count, 3);
  assert.deepEqual(result.selected, ['venue:great', 'talks:poor']);
});

test('multiple mode toggles columns and drops a row once it is emptied', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const matrix = document.querySelector('#multiple');
    ${pick('multiple', '0', '0')};
    ${pick('multiple', '0', '1')};
    const both = JSON.stringify(matrix.value);
    ${pick('multiple', '0', '0')};
    ${pick('multiple', '0', '1')};
    return { both, after: JSON.stringify(matrix.value), role: matrix.shadowRoot.querySelector('aha-answer-option').shadowRoot.querySelector('.row').getAttribute('role') };
  })()`, ready);
  assert.deepEqual(result, { both: '{"0":["0","1"]}', after: '{}', role: 'checkbox' });
});

test('a disabled matrix shows its value and ignores picks', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const matrix = document.querySelector('#disabled');
    let fired = false;
    matrix.addEventListener('change', () => { fired = true; });
    ${pick('disabled', '0', '0')};
    return { value: JSON.stringify(matrix.value), fired, answered: matrix.shadowRoot.querySelectorAll('aha-answer-option[answered]').length };
  })()`, ready);
  assert.deepEqual(result, { value: '{"0":["1"]}', fired: false, answered: 2 });
});

test('on a 360px phone the columns stack in one full-width column with no sideways scroll', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const matrix = document.querySelector('#single');
    const options = [...matrix.shadowRoot.querySelectorAll('.group')[0].querySelectorAll('aha-answer-option')];
    const lefts = new Set(options.map((o) => Math.round(o.getBoundingClientRect().left)));
    return { columns: lefts.size, overflow: matrix.scrollWidth > 360, width: Math.round(options[0].getBoundingClientRect().width) };
  })()`, ready);
  assert.deepEqual(result, { columns: 1, overflow: false, width: 360 });
});

