import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-tag-link.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const $ = (id) => document.getElementById(id);
  const chip = (id) => $(id).shadowRoot.querySelector('.chip');
  const out = {};
  out.plainTag = chip('plain').tagName;
  out.linkTag = chip('link').tagName;
  out.linkHref = chip('link').getAttribute('href');
  out.checkableTag = chip('checkable').tagName;

  const link = $('link');
  const node = chip('link');
  link.setAttribute('href', '#quizzes');
  link.setAttribute('target', '_blank');
  out.sameNodeAfterHrefChange = chip('link') === node;
  out.hrefUpdated = node.getAttribute('href');
  out.targetPassed = node.getAttribute('target');
  out.relDefaulted = node.getAttribute('rel');
  link.setAttribute('rel', 'nofollow');
  out.relPassed = node.getAttribute('rel');

  node.focus();
  out.focusable = link.shadowRoot.activeElement === node;
  out.focusRing = getComputedStyle(node).outlineStyle;

  link.removeAttribute('href');
  out.afterRemove = chip('link').tagName;
  return out;
})()`;

test('aha-tag renders a real link only when href is set', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: 'window.tagFixtureReady === true' });
  assert.equal(r.plainTag, 'SPAN');
  assert.equal(r.linkTag, 'A');
  assert.equal(r.linkHref, '#polls');
  assert.equal(r.checkableTag, 'BUTTON');
  assert.equal(r.sameNodeAfterHrefChange, true);
  assert.equal(r.hrefUpdated, '#quizzes');
  assert.equal(r.targetPassed, '_blank');
  assert.equal(r.relDefaulted, 'noopener noreferrer');
  assert.equal(r.relPassed, 'nofollow');
  assert.equal(r.focusable, true);
  assert.notEqual(r.focusRing, 'none');
  assert.equal(r.afterRemove, 'SPAN');
});
