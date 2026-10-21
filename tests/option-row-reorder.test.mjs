import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

async function run(body) {
  const file = join(mkdtempSync(join(tmpdir(), 'option-row-reorder-')), 'page.html');
  writeFileSync(file, `<!doctype html><body>
<aha-option-row id="plain" orderable value="A"></aha-option-row>
<aha-option-row id="r" orderable reorderable value="B"></aha-option-row>
<aha-option-row id="d" orderable reorderable disabled value="C"></aha-option-row>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-option-row'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  return evaluateInPage(pathToFileURL(file).href, `(() => {
    const row = (id) => document.getElementById(id);
    const handle = (r) => r.shadowRoot.querySelector('.handle');
    const field = (r) => r.shadowRoot.querySelector('.field');
    const textarea = (r) => field(r).shadowRoot.querySelector('textarea');
    ${body}
  })()`, { readyExpr: '!!window.ready' });
}

test('the handle is not focusable without reorderable, focusable with it, and inert when disabled', { skip }, async () => {
  const result = await run(`
    return {
      plain: { tabIndex: handle(row('plain')).tabIndex, role: handle(row('plain')).getAttribute('role') },
      r: { tabIndex: handle(row('r')).tabIndex, role: handle(row('r')).getAttribute('role'), label: handle(row('r')).getAttribute('aria-label') },
      d: { tabIndex: handle(row('d')).tabIndex, role: handle(row('d')).getAttribute('role') },
    };`);
  assert.deepEqual(result, {
    plain: { tabIndex: -1, role: null },
    r: { tabIndex: 0, role: 'button', label: 'Drag to reorder, or use the arrow keys' },
    d: { tabIndex: -1, role: null },
  });
});

test('ArrowUp/ArrowDown on the handle emit reorder-move with direction, only when reorderable and not disabled', { skip }, async () => {
  const result = await run(`
    const press = (r, key) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true });
      handle(r).dispatchEvent(event);
      return event.defaultPrevented;
    };
    const seen = (r) => { const out = []; r.addEventListener('reorder-move', (e) => out.push(e.detail)); return out; };
    const plain = row('plain'), rr = row('r'), d = row('d');
    const seenPlain = seen(plain), seenR = seen(rr), seenD = seen(d);
    const preventedPlain = press(plain, 'ArrowDown');
    const preventedUp = press(rr, 'ArrowUp');
    const preventedDown = press(rr, 'ArrowDown');
    const preventedD = press(d, 'ArrowDown');
    return { preventedPlain, preventedUp, preventedDown, preventedD, seenPlain, seenR, seenD };`);
  assert.deepEqual(result, {
    preventedPlain: false, preventedUp: true, preventedDown: true, preventedD: false,
    seenPlain: [], seenR: [{ direction: 'up' }, { direction: 'down' }], seenD: [],
  });
});

test('pointerdown on the handle emits reorder-grab with pointer details and leaves focus off the field', { skip }, async () => {
  const result = await run(`
    const rr = row('r');
    const seen = []; rr.addEventListener('reorder-grab', (e) => seen.push(e.detail));
    const event = new PointerEvent('pointerdown', { bubbles: true, composed: true, button: 0, pointerId: 7, clientX: 12, clientY: 34 });
    handle(rr).dispatchEvent(event);
    return { seen, fieldFocused: field(rr).shadowRoot.activeElement === textarea(rr) };`);
  assert.deepEqual(result, { seen: [{ pointerId: 7, clientX: 12, clientY: 34 }], fieldFocused: false });
});

test('Enter/Space on the handle trigger a click, only when reorderable and not disabled', { skip }, async () => {
  const result = await run(`
    const press = (r, key) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true });
      handle(r).dispatchEvent(event);
      return event.defaultPrevented;
    };
    const seen = (r) => { const out = []; handle(r).addEventListener('click', () => out.push(1)); return out; };
    const plain = row('plain'), rr = row('r'), d = row('d');
    const seenPlain = seen(plain), seenR = seen(rr), seenD = seen(d);
    const preventedPlain = press(plain, 'Enter');
    const preventedEnter = press(rr, 'Enter');
    const preventedSpace = press(rr, ' ');
    const preventedD = press(d, 'Enter');
    return { preventedPlain, preventedEnter, preventedSpace, preventedD, seenPlain, seenR, seenD };`);
  assert.deepEqual(result, {
    preventedPlain: false, preventedEnter: true, preventedSpace: true, preventedD: false,
    seenPlain: [], seenR: [1, 1], seenD: [],
  });
});

test('the reorderable handle sets touch-action:none so touch dragging does not also scroll the page', { skip }, async () => {
  const result = await run(`
    return { touchAction: getComputedStyle(handle(row('r'))).touchAction };`);
  assert.deepEqual(result, { touchAction: 'none' });
});

test('focusHandle() focuses the row\'s handle', { skip }, async () => {
  const result = await run(`
    const rr = row('r');
    rr.focusHandle();
    return { focused: rr.shadowRoot.activeElement === handle(rr) };`);
  assert.deepEqual(result, { focused: true });
});
