import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./audience-date.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const ready = { readyExpr: '!!window.audienceDateFixtureReady' };

const typeHelpers = `
  const inner = (date, part) => date.shadowRoot.querySelector('aha-counted-input[data-part="' + part + '"]').shadowRoot.querySelector('.field');
  const type = (date, part, text) => { const field = inner(date, part); field.focus(); field.value = text; field.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true })); };
`;

test('typing day, month and year gives an ISO value, strips non-digits and moves focus on a full part', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${typeHelpers}
    const date = document.querySelector('#dmy');
    const events = [];
    date.addEventListener('change', (e) => events.push(e.detail));
    type(date, 'day', '2');
    const partial = date.value;
    type(date, 'day', '0a2');
    const focusAfterDay = date.shadowRoot.activeElement?.dataset.part;
    type(date, 'month', '11');
    type(date, 'year', '2026');
    const order = [...date.shadowRoot.querySelectorAll('aha-counted-input')].map((f) => f.dataset.part).join();
    const day = inner(date, 'day');
    return { partial, value: date.value, last: events.at(-1), day: day.value, inputmode: day.getAttribute('inputmode'), focusAfterDay, order };
  })()`, ready);
  assert.deepEqual(result, { partial: '', value: '2026-11-02', last: { value: '2026-11-02', valid: true }, day: '02', inputmode: 'numeric', focusAfterDay: 'month', order: 'day,month,year' });
});

test('format orders the fields and a value attribute fills them; an impossible date is empty and shows the error after leaving', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${typeHelpers}
    const mdy = document.querySelector('#mdy');
    const order = [...mdy.shadowRoot.querySelectorAll('aha-counted-input')].map((f) => f.dataset.part).join();
    const separator = mdy.shadowRoot.querySelector('.separator').textContent;
    const filled = mdy.value;
    const error = mdy.shadowRoot.querySelector('aha-field-error');
    type(mdy, 'day', '31');
    type(mdy, 'month', '02');
    const beforeLeave = error.hidden;
    inner(mdy, 'month').dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true, relatedTarget: document.querySelector('#outside') }));
    return { order, separator, filled, invalid: mdy.value, beforeLeave, afterLeave: error.hidden, status: mdy.shadowRoot.querySelector('aha-counted-input').getAttribute('status') };
  })()`, ready);
  assert.deepEqual(result, { order: 'month,day,year', separator: '-', filled: '2026-11-02', invalid: '', beforeLeave: true, afterLeave: false, status: 'error' });
});

test('disabled keeps a leap-day value and disables every field; the inner field change never leaks out', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const date = document.querySelector('#locked');
    const fields = [...date.shadowRoot.querySelectorAll('aha-counted-input')];
    let leaked = 0;
    const dmy = document.querySelector('#dmy');
    dmy.addEventListener('change', (e) => { if (!('valid' in (e.detail || {}))) leaked++; });
    dmy.shadowRoot.querySelector('aha-counted-input').shadowRoot.querySelector('.field').dispatchEvent(new Event('change'));
    return { value: date.value, disabled: fields.every((f) => f.hasAttribute('disabled')), leaked };
  })()`, ready);
  assert.deepEqual(result, { value: '2024-02-29', disabled: true, leaked: 0 });
});

test('on a 360px phone the three fields fit one line with no overflow', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const date = document.querySelector('#dmy');
    const tops = new Set([...date.shadowRoot.querySelectorAll('aha-counted-input')].map((f) => Math.round(f.getBoundingClientRect().top)));
    return { lines: tops.size, overflow: date.scrollWidth > 360 };
  })()`, ready);
  assert.deepEqual(result, { lines: 1, overflow: false });
});
