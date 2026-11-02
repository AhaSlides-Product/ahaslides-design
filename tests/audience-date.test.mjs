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

test('a value set before connecting, and a typed answer, survive being attached and re-attached', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const date = document.createElement('aha-audience-date');
    date.value = '2026-11-02';
    document.body.append(date);
    const afterAttach = date.value;
    date.remove();
    document.body.append(date);
    return { afterAttach, afterReattach: date.value };
  })()`, ready);
  assert.deepEqual(result, { afterAttach: '2026-11-02', afterReattach: '2026-11-02' });
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

test('autocomplete is off unless the host sets birthday', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${typeHelpers}
    const names = (id) => ['day', 'month', 'year'].map((part) => inner(document.querySelector(id), part).getAttribute('autocomplete'));
    return { plain: names('#dmy'), birthday: names('#birthday') };
  })()`, ready);
  assert.deepEqual(result, { plain: ['off', 'off', 'off'], birthday: ['bday-day', 'bday-month', 'bday-year'] });
});

test('the input fills the whole box so a tap near the edge lands on it', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${typeHelpers}
    const date = document.querySelector('#dmy');
    const host = date.shadowRoot.querySelector('aha-counted-input[data-part="day"]');
    const box = host.shadowRoot.querySelector('.wrap').getBoundingClientRect();
    const field = inner(date, 'day').getBoundingClientRect();
    return { leftGap: Math.round(field.left - box.left), rightGap: Math.round(box.right - field.right) };
  })()`, ready);
  assert.ok(result.leftGap <= 1 && result.rightGap <= 1, JSON.stringify(result));
});

test('an invalid date keeps the pink focus shadow and links the error to every input', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${typeHelpers}
    const date = document.querySelector('#dmy');
    type(date, 'day', '31'); type(date, 'month', '02'); type(date, 'year', '2026');
    date.shadowRoot.querySelector('.date').dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.querySelector('#outside') }));
    const day = date.shadowRoot.querySelector('aha-counted-input[data-part="day"]');
    day.setAttribute('_focused', '');
    const wrap = getComputedStyle(day.shadowRoot.querySelector('.wrap'));
    const error = date.shadowRoot.querySelector('aha-field-error');
    return {
      status: day.getAttribute('status'),
      shadow: wrap.boxShadow,
      described: ['day', 'month', 'year'].map((part) => inner(date, part).ariaDescribedByElements?.[0] === error),
    };
  })()`, ready);
  assert.equal(result.status, 'error');
  assert.match(result.shadow, /rgba\(231, 14, 104, 0\.3\)/);
  assert.deepEqual(result.described, [true, true, true]);
});
