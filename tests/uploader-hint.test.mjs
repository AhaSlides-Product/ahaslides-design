import { test } from 'node:test';
import assert from 'node:assert/strict';

globalThis.HTMLElement ??= class {};
const registry = new Map();
globalThis.customElements ??= { get: (tag) => registry.get(tag), define: (tag, element) => registry.set(tag, element) };
await import('../lib/icons.js');
const { defineAhaUploader } = await import('../lib/aha-uploader.js');
defineAhaUploader('aha-uploader-under-test');
const AhaUploader = registry.get('aha-uploader-under-test');

function renderedMarkup(attributes) {
  const uploader = Object.create(AhaUploader.prototype);
  uploader.getAttribute = (name) => attributes[name] ?? null;
  uploader.hasAttribute = (name) => name in attributes;
  uploader.shadowRoot = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [] };
  uploader._render();
  return uploader.shadowRoot.innerHTML;
}

test('hint renders escaped under the prompt inside the same wrapper', () => {
  const markup = renderedMarkup({ hint: 'PNG <b>& JPG' });
  assert.match(markup, /<div><div><b>Click to upload<\/b> or drag files here<\/div><div class="hint" part="hint">PNG &lt;b&gt;&amp; JPG<\/div><\/div>/);
});

test('no hint attribute adds no hint node', () => {
  assert.doesNotMatch(renderedMarkup({}), /class="hint"/);
});

test('hint is hidden in picture-card mode and at the upload limit', () => {
  assert.doesNotMatch(renderedMarkup({ hint: 'PNG', listtype: 'picture-card' }), /class="hint"/);
  assert.doesNotMatch(renderedMarkup({ hint: 'PNG', maxcount: '1', items: '[{"name":"a.png"}]' }), /class="hint"/);
});
