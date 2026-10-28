import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement = class {};
globalThis.customElements = { get: () => undefined, define: () => {} };
const { AhaCsat } = await import('../lib/aha-csat.js');

function csatWith(attributes) {
  const textarea = {
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
  };
  const node = { textContent: '', setAttribute() {}, removeAttribute() {}, toggleAttribute() {}, classList: { toggle() {} } };
  const csat = {
    _fbText: textarea,
    _popover: node,
    _fromFeedbackButton: false,
    attributes,
    getAttribute(name) { return name in this.attributes ? this.attributes[name] : null; },
    hasAttribute(name) { return name in this.attributes; },
    _syncConfirmation() {},
    shadowRoot: { querySelector: () => node, querySelectorAll: () => [] },
  };
  return csat;
}

test('feedback-hint unset leaves the textarea without an info-message', () => {
  const csat = csatWith({});
  AhaCsat.prototype._update.call(csat);
  assert.equal('info-message' in csat._fbText.attributes, false);
});

test('feedback-hint is forwarded to the textarea info-message and cleared when removed', () => {
  const csat = csatWith({ 'feedback-hint': 'What you write goes to the developer' });
  AhaCsat.prototype._update.call(csat);
  assert.equal(csat._fbText.attributes['info-message'], 'What you write goes to the developer');
  delete csat.attributes['feedback-hint'];
  AhaCsat.prototype._update.call(csat);
  assert.equal('info-message' in csat._fbText.attributes, false);
});

test('feedback-hint is an observed attribute', () => {
  assert.ok(AhaCsat.observedAttributes.includes('feedback-hint'));
});
