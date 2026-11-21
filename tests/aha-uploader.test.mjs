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

function zoneMarkup(attributes) {
  const el = new AhaUploader();
  for (const [k, v] of Object.entries(attributes)) el.attributes.set(k, v);
  el.shadowRoot = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
  el._render();
  return el.shadowRoot.innerHTML.slice(el.shadowRoot.innerHTML.indexOf('</style>'));
}

test('description renders escaped inside the drop zone, under the prompt', () => {
  assert.match(zoneMarkup({ description: 'PNG, <SVG> & GIF, up to 15 MB' }),
    /<div class="zone"[^>]*>.*<div><div><b>Click to upload<\/b> or drag files here<\/div><div class="description" part="description">PNG, &lt;SVG&gt; &amp; GIF, up to 15 MB<\/div><\/div><\/div>/);
});

test('without description the zone markup is unchanged', () => {
  assert.equal(zoneMarkup({}), zoneMarkup({ description: '' }));
  assert.doesNotMatch(zoneMarkup({}), /description/);
});

test('description is not shown in picture-card mode or at the upload limit', () => {
  assert.doesNotMatch(zoneMarkup({ description: 'PNG', listtype: 'picture-card' }), /description/);
  assert.doesNotMatch(zoneMarkup({ description: 'PNG', maxcount: '1', items: '[{"name":"a.png"}]' }), /class="description"/);
});

test('size lg renders a 48px icon, default stays 24px', () => {
  assert.match(zoneMarkup({ size: 'lg' }), /name="system-upload-simple" size="48"/);
  assert.match(zoneMarkup({}), /name="system-upload-simple" size="24"/);
  assert.match(zoneMarkup({ size: 'lg', maxcount: '0' }), /aria-disabled="true"><aha-icon name="system-upload-simple" size="48"/);
});
