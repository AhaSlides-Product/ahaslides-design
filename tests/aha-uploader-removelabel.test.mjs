import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.document = { createRange: () => ({ createContextualFragment: (html) => ({ html }) }) };
globalThis.HTMLElement = class {
  constructor() { this.attributes = new Map(); }
  getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
  hasAttribute(name) { return this.attributes.has(name); }
};
globalThis.customElements = { get: () => undefined, define: () => {} };
const { AhaUploader } = await import('../lib/aha-uploader.js');

function removeLabel(attributes) {
  const el = new AhaUploader();
  for (const [k, v] of Object.entries(attributes)) el.attributes.set(k, v);
  return el._rowHtml({ name: 'a<b>.png' }, 0).match(/aria-label="([^"]*)"/)[1];
}

test('remove button label defaults to English and escapes the file name', () => {
  assert.equal(removeLabel({}), 'Remove a&lt;b&gt;.png');
});

test('removelabel replaces {name} with the escaped file name', () => {
  assert.equal(removeLabel({ removelabel: 'Xoá {name}' }), 'Xoá a&lt;b&gt;.png');
});
