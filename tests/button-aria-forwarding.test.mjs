import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements ??= { get: () => undefined, define: () => {} };
const { AhaButton } = await import('../lib/aha-button.js');

const fakeInner = () => {
  const attributes = new Map();
  return {
    attributes,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
  };
};

const buttonWith = (hostAttributes, elementsById = {}) => {
  const button = new AhaButton();
  button.getAttribute = (name) => (name in hostAttributes ? hostAttributes[name] : null);
  button.hasAttribute = (name) => name in hostAttributes;
  button.getRootNode = () => ({ getElementById: (id) => elementsById[id] ?? null });
  button._button = fakeInner();
  return button;
};

test('aria-disabled and aria-labelledby are observed so a change reaches the inner button', () => {
  assert.ok(AhaButton.observedAttributes.includes('aria-disabled'));
  assert.ok(AhaButton.observedAttributes.includes('aria-labelledby'));
});

test('aria-disabled is copied to the inner button and removed with the host attribute', () => {
  const button = buttonWith({ 'aria-disabled': 'true' });
  button._forwardState();
  assert.equal(button._button.attributes.get('aria-disabled'), 'true');
  const cleared = buttonWith({});
  cleared._button.setAttribute('aria-disabled', 'true');
  cleared._forwardState();
  assert.equal(cleared._button.attributes.has('aria-disabled'), false);
});

test('aria-labelledby ids are resolved in the host tree and handed over as elements', () => {
  const heading = { id: 'heading' };
  const button = buttonWith({ 'aria-labelledby': 'heading missing' }, { heading });
  button._button.ariaLabelledByElements = undefined;
  button._forwardLabelledBy();
  assert.deepEqual(button._button.ariaLabelledByElements, [heading]);
});

test('a disabled ancestor fieldset disables the button and re-renders it', () => {
  const button = buttonWith({});
  let renders = 0;
  button.shadowRoot = {};
  button._render = () => { renders += 1; };
  assert.equal(button._isDisabled(), false);
  button.formDisabledCallback(true);
  assert.equal(button._isDisabled(), true);
  button.formDisabledCallback(false);
  assert.equal(button._isDisabled(), false);
  assert.equal(renders, 2);
});

test('the disabled attribute still disables without a fieldset', () => {
  assert.equal(buttonWith({ disabled: '' })._isDisabled(), true);
});
