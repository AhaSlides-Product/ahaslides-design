import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-form.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const $ = (id) => document.getElementById(id);
  const inner = (item) => item.control.shadowRoot.querySelector('.field');
  const described = (field) => (field.ariaDescribedByElements || []).map((node) => node.id);
  const out = {};
  await wait(50);
  const form = $('invite');
  const name = $('name-item');
  const email = $('email-item');
  const key = $('key-item');
  const terms = $('terms-item');

  const label = getComputedStyle(name.shadowRoot.querySelector('.label'));
  out.look = [label.fontSize, label.lineHeight, label.fontWeight, label.color,
    getComputedStyle(name.shadowRoot.querySelector('.head')).paddingBottom, getComputedStyle(name).marginBottom,
    getComputedStyle(name.shadowRoot.querySelector('.mark')).color];
  out.markShown = [!name.shadowRoot.querySelector('.mark').hidden, !key.shadowRoot.querySelector('.mark').hidden];
  out.named = [inner(email).getAttribute('aria-label'), inner(email).getAttribute('aria-required'), $('key').getAttribute('aria-label')];
  out.helpDescribes = described(inner(email)).includes(email.id ? email.id + '-help' : email.querySelector('[slot=help]').id);
  out.controlFillsItem = Math.round(email.control.getBoundingClientRect().width) === Math.round(email.getBoundingClientRect().width);

  $('send').click();
  await wait(50);
  out.invalidEvent = formEvents.at(-1)[0];
  out.errors = formEvents.at(-1)[1].errors.map((error) => [error.name, error.message]);
  const emailError = email.querySelector('[slot=error]');
  out.errorShown = [emailError.textContent, emailError.hidden, emailError.hasAttribute('icon'), email.control.getAttribute('status'), inner(email).getAttribute('aria-invalid')];
  out.errorDescribes = described(inner(email))[0] === emailError.id;
  out.errorLook = getComputedStyle(emailError).color;
  out.focusedFirstInvalid = document.activeElement === email.control;
  out.checkboxError = [terms.querySelector('[slot=error]').textContent, terms.control.getAttribute('aria-invalid'), terms.control.hasAttribute('aria-label')];

  email.control.value = 'ada@example.com';
  email.control.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true }));
  await wait(20);
  out.clearedOnEdit = [email.message, email.control.hasAttribute('status'), inner(email).hasAttribute('aria-invalid')];

  $('key').value = 'Bad Key';
  $('key').dispatchEvent(new Event('input', { bubbles: true }));
  $('key').focus();
  $('key').blur();
  await wait(20);
  out.nativeInvalid = [key.message, $('key').getAttribute('aria-invalid'), $('key').getAttribute('aria-describedby')];
  $('key').value = 'abc';
  $('key').dispatchEvent(new Event('input', { bubbles: true }));
  await wait(20);
  out.nativeCleared = [$('key').hasAttribute('aria-invalid'), $('key').getAttribute('aria-describedby')];

  terms.control.checked = true;
  key.error = 'That key is taken';
  out.serverError = [key.querySelector('[slot=error]').textContent, $('key').getAttribute('aria-invalid')];
  inner(email).focus();
  formEvents.length = 0;
  inner(email).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
  await wait(50);
  out.enterSubmits = formEvents.map(([type, detail]) => [type, detail && detail.values]);

  $('clear').click();
  await wait(20);
  out.reset = [formEvents.at(-1)[0], name.control.value, email.control.value, $('key').value, terms.control.checked];

  email.control.value = 'ada@example.com';
  terms.control.checked = true;
  name.validator = async () => { await wait(30); return ''; };
  formEvents.length = 0;
  const pending = form.submit();
  email.control.value = '';
  email.control.dispatchEvent(new CustomEvent('input', { bubbles: true, composed: true }));
  await pending;
  out.editWhileValidating = formEvents.map(([type]) => type);
  name.validator = null;

  formEvents.length = 0;
  email.control.value = 'ada@example.com';
  $('send').setAttribute('loading', '');
  inner(name).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
  await wait(50);
  out.enterWhileLoading = formEvents.length;
  $('send').removeAttribute('loading');

  name.validator = async () => { await wait(30); return ''; };
  email.control.value = 'ada@example.com';
  terms.control.checked = true;
  formEvents.length = 0;
  const cancelled = form.submit();
  form.reset();
  await cancelled;
  out.resetDuringSubmit = formEvents.map(([type]) => type);
  name.validator = null;

  form.setAttribute('layout', 'horizontal');
  form.setAttribute('required-mark', 'optional');
  await wait(20);
  out.horizontal = [name.getAttribute('_layout'), getComputedStyle(name.shadowRoot.querySelector('.item')).display,
    !name.shadowRoot.querySelector('.mark').hidden, key.shadowRoot.querySelector('.optional').hidden, key.shadowRoot.querySelector('.optional').textContent];

  const courses = $('courses-item');
  const emptyList = await courses.validate();
  courses.control.values = ['c2'];
  out.multipleRequired = [emptyList, await courses.validate()];

  return out;
})()`;

test('aha-form validates, wires and submits its items', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: 'window.formFixtureReady === true' });
  assert.deepEqual(result.look, ['14px', '22px', '400', 'rgb(26, 26, 26)', '4px', '20px', 'rgb(26, 26, 26)']);
  assert.deepEqual(result.markShown, [true, false]);
  assert.deepEqual(result.named, ['Email', 'true', 'Key']);
  assert.equal(result.helpDescribes, true);
  assert.equal(result.controlFillsItem, true);
  assert.equal(result.invalidEvent, 'invalid');
  assert.deepEqual(result.errors, [['email', 'We need this one.'], ['terms', 'Accept the terms to continue.']]);
  assert.deepEqual(result.errorShown, ['We need this one.', false, true, 'error', 'true']);
  assert.equal(result.errorDescribes, true);
  assert.equal(result.errorLook, 'rgb(26, 26, 26)');
  assert.equal(result.focusedFirstInvalid, true);
  assert.deepEqual(result.checkboxError, ['Accept the terms to continue.', 'true', false]);
  assert.deepEqual(result.clearedOnEdit, ['', false, false]);
  assert.deepEqual(result.nativeInvalid, ['Use lowercase letters only', 'true', 'key-note key-item-error']);
  assert.deepEqual(result.nativeCleared, [false, 'key-note']);
  assert.deepEqual(result.serverError, ['That key is taken', 'true']);
  assert.deepEqual(result.enterSubmits, [['submit', { name: 'Ada', email: 'ada@example.com', key: 'abc', terms: true }]]);
  assert.deepEqual(result.reset, ['reset', 'Ada', '', '', false]);
  assert.deepEqual(result.editWhileValidating, ['invalid']);
  assert.equal(result.enterWhileLoading, 0);
  assert.deepEqual(result.resetDuringSubmit, ['reset']);
  assert.deepEqual(result.multipleRequired, ['We need this one.', '']);
  assert.deepEqual(result.horizontal, ['horizontal', 'flex', false, false, '(optional)']);
});
