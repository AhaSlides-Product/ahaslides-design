import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./audience-contact.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const ready = { readyExpr: '!!window.audienceContactFixtureReady' };

const helpers = `
  const inner = (el, id) => el.shadowRoot.querySelector('aha-counted-input[data-field="' + id + '"]').shadowRoot.querySelector('.field');
  const type = (el, id, text) => { const f = inner(el, id); f.focus(); f.value = text; f.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true })); };
  const leave = (el, id) => inner(el, id).dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true, relatedTarget: document.querySelector('#outside') }));
`;

test('the default is a required name and email; the value is keyed by id and valid only when both are real', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${helpers}
    const el = document.querySelector('#basic');
    const events = [];
    el.addEventListener('change', (e) => events.push(e.detail));
    const ids = [...el.shadowRoot.querySelectorAll('aha-counted-input')].map((f) => f.dataset.field).join();
    type(el, 'name', 'Mai');
    type(el, 'email', 'mai@example');
    const bad = el.valid;
    type(el, 'email', 'mai@example.com');
    return { ids, bad, last: events.at(-1), email: { type: inner(el, 'email').type, autocomplete: inner(el, 'email').getAttribute('autocomplete'), dir: inner(el, 'email').getAttribute('dir') } };
  })()`, ready);
  assert.deepEqual(result, { ids: 'name,email', bad: false, last: { value: { name: 'Mai', email: 'mai@example.com' }, valid: true }, email: { type: 'email', autocomplete: 'email', dir: 'ltr' } });
});

test('a required field left empty and a bad email show their message once the field has been left', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${helpers}
    const el = document.createElement('aha-audience-contact');
    document.body.append(el);
    const errors = () => [...el.shadowRoot.querySelectorAll('aha-field-error')].map((e) => e.hidden ? '' : e.getAttribute('message'));
    type(el, 'name', '');
    type(el, 'email', 'nope');
    const before = errors();
    leave(el, 'name');
    leave(el, 'email');
    return { before, after: errors(), status: el.shadowRoot.querySelector('aha-counted-input').getAttribute('status') };
  })()`, ready);
  assert.deepEqual(result, { before: ['This field is required', ''], after: ['This field is required', 'Enter a real email address'], status: 'error' });
});

test('a phone field takes a dial code, writes "<code> <number>" and splits a given value back; text fields stay free', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${helpers}
    const el = document.querySelector('#full');
    const select = el.shadowRoot.querySelector('aha-select');
    type(el, 'phone', '912345678');
    const first = el.value.phone;
    select.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: { value: '+44' } }));
    const second = el.value.phone;
    el.value = { name: 'Mai', phone: '+84 987654321', role: 'Host' };
    return { first, second, refilled: el.value, phoneType: inner(el, 'phone').type, phoneDir: inner(el, 'phone').getAttribute('dir'), nameDir: inner(el, 'name').getAttribute('dir'), valid: el.valid, selected: select.value };
  })()`, ready);
  assert.deepEqual(result, { first: '+84 912345678', second: '+44 912345678', refilled: { name: 'Mai', email: '', phone: '+84 987654321', role: 'Host' }, phoneType: 'tel', phoneDir: 'ltr', nameDir: 'auto', valid: true, selected: '+84' });
});

test('disabled disables every field and keeps the value; inner change events never leak', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    ${helpers}
    const el = document.querySelector('#locked');
    let leaked = 0;
    const basic = document.querySelector('#basic');
    basic.addEventListener('change', (e) => { if (!('valid' in (e.detail || {}))) leaked++; });
    inner(basic, 'name').dispatchEvent(new Event('change'));
    return { value: el.value, disabled: [...el.shadowRoot.querySelectorAll('aha-counted-input')].every((f) => f.hasAttribute('disabled')), leaked };
  })()`, ready);
  assert.deepEqual(result, { value: { name: 'Mai', email: 'mai@example.com' }, disabled: true, leaked: 0 });
});

test('on a 360px phone, also right to left, the fields and the dial code fit with no overflow', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const full = document.querySelector('#full');
    const basic = document.querySelector('#basic');
    const phone = full.shadowRoot.querySelector('.phone');
    const input = phone.querySelector('aha-counted-input').getBoundingClientRect();
    const select = phone.querySelector('aha-select').getBoundingClientRect();
    return { fullOverflow: full.scrollWidth > 360, basicOverflow: basic.scrollWidth > 360, sameLine: Math.abs(input.top - select.top) < 2, selectOnRight: select.left > input.left };
  })()`, ready);
  assert.deepEqual(result, { fullOverflow: false, basicOverflow: false, sameLine: true, selectOnRight: true });
});
