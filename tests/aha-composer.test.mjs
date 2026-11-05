import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-composer.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const host = document.getElementById('c');
  const root = host.shadowRoot;
  const frame = () => new Promise((r) => requestAnimationFrame(() => r()));
  const out = {};
  const bar = root.querySelector('.bar');
  out.barTag = bar.localName;
  bar.focus();
  await frame();
  const ta = root.querySelector('.field').shadowRoot.querySelector('textarea');
  out.openAfterFocus = host.open;
  out.focusInEditor = root.activeElement === root.querySelector('.field') && ta.matches(':focus');

  ta.value = 'hello world';
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  ta.setSelectionRange(6, 11);
  root.querySelector('[data-tool="bold"]').click();
  out.bold = host.value;
  out.plainPreview = root.querySelector('.plain').textContent;

  host.value = '<img src=x onerror=alert(1)>';
  out.previewElements = root.querySelector('.plain').children.length;

  let submitted = null;
  host.addEventListener('submit', (e) => { submitted = e.detail.value; });
  host.value = 'Thanks!';
  await frame();
  root.querySelector('.submit').click();
  out.submitted = submitted;
  out.clearedAfterSubmit = host.value;
  out.closedAfterSubmit = host.open;
  out.focusOnBarAfterClose = root.activeElement === bar;
  out.stillClosed = host.open;
  return out;
})()`;

test('aha-composer opens from its input bar, formats the draft and submits it', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: 'window.composerFixtureReady === true' });
  assert.equal(r.barTag, 'aha-input');
  assert.equal(r.openAfterFocus, true);
  assert.equal(r.focusInEditor, true);
  assert.equal(r.bold, 'hello **world**');
  assert.equal(r.plainPreview, 'hello **world**');
  assert.equal(r.previewElements, 0);
  assert.equal(r.submitted, 'Thanks!');
  assert.equal(r.clearedAfterSubmit, '');
  assert.equal(r.closedAfterSubmit, false);
  assert.equal(r.focusOnBarAfterClose, true);
  assert.equal(r.stillClosed, false);
});
