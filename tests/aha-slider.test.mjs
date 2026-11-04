import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-slider.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('aha-slider drags and keys to exact steps, fires input then one change, flips in RTL, and aha-form-item reads it', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const KEYS = { ArrowRight: 39, ArrowLeft: 37, ArrowUp: 38, PageUp: 33, Home: 36, End: 35 };
    const press = async (key) => {
      const fields = { key, code: key, windowsVirtualKeyCode: KEYS[key], nativeVirtualKeyCode: KEYS[key] };
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...fields });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const rail = (id) => evaluate(`(() => { const b = document.getElementById('${id}').shadowRoot.querySelector('.rail').getBoundingClientRect(); return { x: b.left, w: b.width, y: b.top + b.height / 2 }; })()`);
    const mouse = (type, x, y) => command('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
    const handle = (id) => `document.getElementById('${id}').shadowRoot.querySelector('.handle')`;
    const log = () => evaluate('window.log.splice(0).map((e) => e.join(":"))');
    const out = {};

    const z = await rail('zoom');
    await mouse('mousePressed', z.x + z.w * 0.25, z.y);
    await mouse('mouseMoved', z.x + z.w * 0.3337, z.y);
    out.dragging = await evaluate(`(() => { const el = document.getElementById('zoom'); return [el.value, el.hasAttribute('_dragging'), getComputedStyle(el.shadowRoot.querySelector('.bubble')).opacity]; })()`);
    await mouse('mouseReleased', z.x + z.w * 0.3337, z.y);
    out.dragEvents = await log();
    out.dragFocus = await evaluate(`document.getElementById('zoom').shadowRoot.activeElement === ${handle('zoom')}`);

    await evaluate(`document.getElementById('zoom').valueText = (v) => Math.round(v * 100) + '%'`);
    out.valueText = await evaluate(`(() => { const r = document.getElementById('zoom').shadowRoot; const h = r.querySelector('.handle'); return [h.getAttribute('role'), h.getAttribute('aria-label'), h.getAttribute('aria-valuemin'), h.getAttribute('aria-valuemax'), h.getAttribute('aria-valuenow'), h.getAttribute('aria-valuetext'), r.querySelector('.bubble').textContent]; })()`);

    await evaluate(`document.getElementById('plain').focus()`);
    for (const key of ['ArrowRight', 'ArrowUp', 'PageUp', 'Home', 'ArrowLeft', 'End']) await press(key);
    out.keys = await log();

    await evaluate(`document.getElementById('rtl').focus()`);
    await press('ArrowRight');
    out.rtlKey = await log();
    const rr = await rail('rtl');
    await mouse('mousePressed', rr.x + rr.w * 0.1, rr.y);
    await mouse('mouseReleased', rr.x + rr.w * 0.1, rr.y);
    out.rtlDrag = await log();

    const o = await rail('off');
    await mouse('mousePressed', o.x + o.w * 0.9, o.y);
    await mouse('mouseReleased', o.x + o.w * 0.9, o.y);
    out.disabled = await evaluate(`[document.getElementById('off').value, ${handle('off')}.tabIndex, ${handle('off')}.getAttribute('aria-disabled'), window.log.length]`);

    out.clamped = await evaluate(`(() => { const el = document.createElement('aha-slider'); el.setAttribute('step', '5'); el.value = 103; document.body.append(el); const a = el.value; el.value = null; const b = el.value; el.setAttribute('step', '0.1'); el.value = 0.3; return [a, b, el.value]; })()`);

    const item = `document.getElementById('overlay-item')`;
    out.item = await evaluate(`(() => { const s = document.querySelector('#overlay-item aha-slider'); s.value = 55; return [${item}.value, typeof ${item}.value, JSON.stringify([...new FormData(document.getElementById('form'))]), s.shadowRoot.querySelector('.handle').getAttribute('aria-label')]; })()`);
    await evaluate(`${item}.reset()`);
    out.reset = await evaluate(`${item}.value`);
    return out;
  }, { readyExpr: '!!window.fixtureReady' });

  assert.deepEqual(r.dragging, [1.67, true, '1']);
  assert.deepEqual(r.dragEvents, ['zoom:input:1.5', 'zoom:input:1.67', 'zoom:change:1.67']);
  assert.equal(r.dragFocus, true);
  assert.deepEqual(r.valueText, ['slider', 'Zoom', '1', '3', '1.67', '167%', '167%']);
  assert.deepEqual(r.keys, [
    'plain:input:41', 'plain:change:41', 'plain:input:42', 'plain:change:42', 'plain:input:52', 'plain:change:52',
    'plain:input:0', 'plain:change:0', 'plain:input:100', 'plain:change:100',
  ]);
  assert.deepEqual(r.rtlKey, ['rtl:input:49', 'rtl:change:49']);
  assert.deepEqual(r.rtlDrag, ['rtl:input:90', 'rtl:change:90']);
  assert.deepEqual(r.disabled, [60, -1, 'true', 0]);
  assert.deepEqual(r.clamped, [100, 0, 0.3]);
  assert.deepEqual(r.item, [55, 'number', '[["overlay","55"]]', 'Overlay']);
  assert.equal(r.reset, 30);
});
