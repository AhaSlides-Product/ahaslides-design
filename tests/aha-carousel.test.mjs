import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-carousel.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const MOVE_MS = 450;

test('aha-carousel keeps one set of slides, moves by arrow, dot, key and swipe, fires each event once with the right index, and has no controls for one slide', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const wait = (ms) => new Promise((done) => setTimeout(done, ms));
    const KEYS = { ArrowRight: 39, ArrowLeft: 37, Home: 36, End: 35 };
    const press = async (key) => {
      const fields = { key, code: key, windowsVirtualKeyCode: KEYS[key], nativeVirtualKeyCode: KEYS[key] };
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...fields });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const part = (id, selector) => `document.getElementById('${id}').shadowRoot.querySelector('${selector}')`;
    const centre = (expression) => evaluate(`(() => { const b = ${expression}.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width }; })()`);
    const click = async (expression) => {
      const { x, y } = await centre(expression);
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
    };
    const drag = (id, dx, dy = 0) => dragFrom(part(id, '.viewport'), dx, dy);
    const dragFrom = async (expression, dx, dy = 0) => {
      const { x, y } = await centre(expression);
      const points = (px, py) => ({ touchPoints: [{ x: px, y: py, id: 1 }] });
      await command('Input.dispatchTouchEvent', { type: 'touchStart', ...points(x, y) });
      for (let step = 1; step <= 6; step += 1) {
        await command('Input.dispatchTouchEvent', { type: 'touchMove', ...points(x + (dx * step) / 6, y + (dy * step) / 6) });
        await wait(30);
      }
      await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    };
    const log = () => evaluate('window.log.splice(0)');
    const state = (id) => evaluate(`(() => {
      const c = document.getElementById('${id}'), r = c.shadowRoot;
      return {
        index: c.index,
        attr: c.getAttribute('index'),
        inert: [...c.children].map((s) => s.hasAttribute('inert')),
        current: [...r.querySelectorAll('.dot')].map((d) => d.getAttribute('aria-current')),
        tabbable: [...r.querySelectorAll('.dot')].map((d) => d.tabIndex),
        status: r.querySelector('aha-live-region').textContent,
        prevOff: r.querySelector('.prev').hasAttribute('disabled'),
        nextOff: r.querySelector('.next').hasAttribute('disabled'),
      };
    })()`);
    const out = {};
    const setMotion = (value) => command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value }] });
    const restLatency = (id) => evaluate(`new Promise((done) => {
      const c = document.getElementById('${id}'), start = performance.now();
      c.addEventListener('after-change', () => done(performance.now() - start), { once: true });
      c.goTo(c.index === 0 ? 1 : 0);
    })`);
    await setMotion('no-preference');

    out.opening = await state('plain');
    out.names = await evaluate(`[${part('plain', '.prev')}.getAttribute('aria-label'), ${part('plain', '.next')}.getAttribute('aria-label'), ${part('plain', '.dot')}.getAttribute('aria-label'), ${part('plain', '.carousel')}.getAttribute('aria-label'), ${part('plain', '.carousel')}.getAttribute('role')]`);
    out.geometry = await evaluate(`(() => { const r = document.getElementById('plain').shadowRoot; const b = [...r.querySelectorAll('.bar')].map((n) => n.getBoundingClientRect()); const s = getComputedStyle(r.querySelectorAll('.bar')[1]); return [b[0].width, b[0].height, b[1].width, b[1].left - b[0].right, s.backgroundColor, r.querySelector('.dot').getBoundingClientRect().height]; })()`);
    out.ids = await evaluate(`[document.querySelectorAll('#two').length, document.getElementById('plain').querySelectorAll('[id]').length, document.getElementById('plain').count]`);

    await click(part('plain', '.next'));
    out.atStart = await evaluate(`document.getElementById('plain').index`);
    await wait(MOVE_MS);
    out.afterArrow = await log();
    out.second = await state('plain');

    await click(part('plain', '.next'));
    await wait(MOVE_MS);
    out.focusFromDisabled = await evaluate(`document.getElementById('plain').shadowRoot.activeElement && document.getElementById('plain').shadowRoot.activeElement.className`);
    await click(part('plain', '.next'));
    await wait(MOVE_MS);
    out.atEnd = await state('plain');
    out.endEvents = await log();

    await evaluate(`(() => { const c = document.getElementById('plain'); c.goTo(0); c.next(); c.next(); })()`);
    await wait(MOVE_MS);
    out.merged = await log();

    await evaluate(`document.getElementById('plain').index = 1`);
    await wait(MOVE_MS);
    out.silent = [await log(), await evaluate(`document.getElementById('plain').index`)];

    await evaluate(`document.getElementById('plain').shadowRoot.querySelectorAll('.dot')[1].focus()`);
    await press('ArrowRight');
    await wait(MOVE_MS);
    await press('Home');
    await wait(MOVE_MS);
    await press('End');
    await wait(MOVE_MS);
    await press('ArrowLeft');
    await wait(MOVE_MS);
    out.keys = await log();
    out.dotFocus = await evaluate(`[...document.getElementById('plain').shadowRoot.querySelectorAll('.dot')].indexOf(document.getElementById('plain').shadowRoot.activeElement)`);

    await evaluate(`document.getElementById('plain').goTo(0)`);
    await wait(MOVE_MS);
    await log();
    await drag('plain', -120);
    await wait(MOVE_MS);
    out.swipeNext = await log();
    await drag('plain', -30);
    await wait(MOVE_MS);
    out.tooShort = [await log(), await evaluate(`getComputedStyle(${part('plain', '.track')}).getPropertyValue('--_drag')`)];
    await drag('plain', 8, 120);
    await wait(MOVE_MS);
    out.vertical = await log();
    await evaluate(`document.getElementById('plain').goTo(0)`);
    await wait(MOVE_MS);
    await log();
    await drag('plain', 120);
    await wait(MOVE_MS);
    out.pastStart = await log();

    const a = await centre(part('plain', '.viewport'));
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: a.x + 60, y: a.y, button: 'left', buttons: 1, clickCount: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: a.x - 60, y: a.y, button: 'left', buttons: 1 });
    out.dragging = await evaluate(`document.getElementById('plain').hasAttribute('_dragging')`);
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: a.x - 60, y: a.y, button: 'left', buttons: 0, clickCount: 1 });
    await wait(MOVE_MS);
    out.mouseDrag = await log();

    const heights = [await evaluate(`${part('adaptive', '.viewport')}.getBoundingClientRect().height`)];
    await evaluate(`document.getElementById('adaptive').next()`);
    await wait(MOVE_MS);
    heights.push(await evaluate(`${part('adaptive', '.viewport')}.getBoundingClientRect().height`));
    await evaluate(`document.querySelector('#adaptive .tall').style.height = '300px'`);
    await wait(100);
    heights.push(await evaluate(`${part('adaptive', '.viewport')}.style.height`));
    out.heights = heights;
    await evaluate(`document.getElementById('adaptive').goTo(2)`);
    await wait(MOVE_MS);
    await log();
    out.adaptiveLabels = await evaluate(`[${part('adaptive', '.prev')}.getAttribute('aria-label'), ${part('adaptive', '.next')}.getAttribute('aria-label')]`);
    await evaluate(`document.getElementById('adaptive').next()`);
    await wait(MOVE_MS);
    out.wrap = [await log(), (await state('adaptive')).prevOff];

    await evaluate(`Object.assign(document.getElementById('adaptive'), { dotLabel: (p, t) => 'Go to image ' + p + ' of ' + t, positionText: (p, t) => 'Image ' + p + ' of ' + t })`);
    await evaluate(`document.getElementById('adaptive').next()`);
    await wait(MOVE_MS + 100);
    await log();
    out.custom = await evaluate(`[${part('adaptive', '.dot')}.getAttribute('aria-label'), ${part('adaptive', 'aha-live-region')}.textContent]`);

    await evaluate(`document.getElementById('rtl').shadowRoot.querySelector('.dot').focus()`);
    await press('ArrowLeft');
    await wait(MOVE_MS);
    out.rtlKey = await log();
    await drag('rtl', 120);
    await wait(MOVE_MS);
    out.rtlSwipe = await log();
    out.rtlSlideShowing = await evaluate(`(() => { const c = document.getElementById('rtl'); const a = c.children[2].getBoundingClientRect(), b = c.getBoundingClientRect(); return Math.round(a.left - b.left); })()`);
    out.rtlFlip = await evaluate(`getComputedStyle(${part('rtl', '.next')}.querySelector('aha-icon')).scale`);

    out.single = await evaluate(`(() => { const c = document.getElementById('single'), r = c.shadowRoot; return [r.querySelector('.prev').hidden, r.querySelector('.next').hidden, r.querySelector('.dots').hidden, c.children[0].hasAttribute('inert'), r.querySelector('aha-live-region').textContent, c.next()]; })()`);
    out.empty = await evaluate(`(() => { const c = document.getElementById('empty'), r = c.shadowRoot; return [c.count, c.index, r.querySelector('.next').hidden, r.querySelector('.dots').hidden, c.getBoundingClientRect().height]; })()`);

    out.restWithMotion = await restLatency('rtl');
    await setMotion('reduce');
    await wait(50);
    out.restReduced = await restLatency('rtl');
    await log();

    const byId = (id) => `document.getElementById('${id}')`;
    const toGestureStart = `(async () => { const c = document.getElementById('gesture'); c.index = 0; await new Promise((done) => setTimeout(done, 20)); window.log.splice(0); window.clicks = []; })()`;
    await evaluate(`document.addEventListener('click', (e) => { (window.clicks = window.clicks || []).push(e.target.id || e.target.localName); })`);

    await evaluate(toGestureStart);
    await dragFrom(byId('away'), -120);
    await wait(50);
    out.swipeFromLink = [await log(), await evaluate('window.clicks')];
    await evaluate(toGestureStart);
    await drag('gesture', -120);
    await wait(50);
    out.clickAfterTouchSwipe = await evaluate(`(() => { const b = document.getElementById('there'); let got = 0; b.addEventListener('click', () => { got += 1; }, { once: true }); b.click(); return got; })()`);

    await evaluate(toGestureStart);
    await dragFrom(byId('field'), -120);
    await wait(50);
    out.swipeFromField = await log();
    await click(byId('press'));
    await wait(50);
    out.pressStaysClick = await evaluate('window.clicks');

    const edge = await evaluate(`(() => { const b = ${part('gesture', '.viewport')}.getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.bottom - 1 }; })()`);
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', x: edge.x, y: edge.y, button: 'left', buttons: 1, clickCount: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: edge.x, y: edge.y + 4, button: 'left', buttons: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x: edge.x, y: edge.y + 4, button: 'left', buttons: 0, clickCount: 1 });
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: edge.x, y: edge.y - 2, button: 'none', buttons: 0 });
    await command('Input.dispatchMouseEvent', { type: 'mouseMoved', x: edge.x - 60, y: edge.y - 2, button: 'none', buttons: 0 });
    out.releasedOutside = await evaluate(`document.getElementById('gesture').hasAttribute('_dragging')`);

    await evaluate(toGestureStart);
    out.moves = await evaluate(`(async () => {
      const c = document.getElementById('gesture'), settle = () => new Promise((done) => setTimeout(done, 20));
      let bubbled = 0;
      const count = () => { bubbled += 1; };
      document.body.addEventListener('change', count);
      const fraction = [c.goTo(1.5), c.getAttribute('index')];
      document.body.removeEventListener('change', count);
      c.index = 0.7;
      fraction.push(c.getAttribute('index'));
      await settle();
      c.append(document.createElement('div'));
      const appended = [c.count, c.goTo(3), c.index];
      await settle();
      c.lastElementChild.remove();
      await settle();
      return { fraction, bubbled, appended };
    })()`);
    out.fractionLog = await log();

    await evaluate(toGestureStart);
    out.focus = await evaluate(`(async () => {
      const c = document.getElementById('gesture'), r = c.shadowRoot;
      document.getElementById('press').focus();
      c.goTo(1);
      const held = [document.activeElement.id, r.activeElement && r.activeElement.className];
      document.getElementById('there').focus();
      const dots = r.querySelectorAll('.dot');
      c.index = 2;
      dots[2].focus();
      c.lastElementChild.remove();
      await new Promise((done) => setTimeout(done, 20));
      const dotGone = r.activeElement && r.activeElement.className;
      r.querySelector('.carousel').blur();
      return [...held, dotGone, r.querySelector('.carousel').hasAttribute('tabindex')];
    })()`);
    await log();

    out.lateCopy = await evaluate(`(async () => {
      const c = document.getElementById('quiet'), live = c.shadowRoot.querySelector('aha-live-region');
      let spoken = 0;
      new MutationObserver((changes) => { if (live.textContent) spoken += changes.length; }).observe(live, { childList: true, characterData: true, subtree: true });
      c.positionText = (p, t) => 'Image ' + p + ' of ' + t;
      await new Promise((done) => setTimeout(done, 100));
      c.append(document.createElement('div'));
      await new Promise((done) => setTimeout(done, 100));
      const quiet = spoken;
      c.next();
      await new Promise((done) => setTimeout(done, 100));
      return [quiet, live.textContent];
    })()`);
    await log();

    out.images = await evaluate(`(async () => {
      const png = (w, h) => { const k = document.createElement('canvas'); k.width = w; k.height = h; return k.toDataURL(); };
      const [wide, square] = document.querySelectorAll('#images img');
      wide.src = png(800, 200);
      square.src = png(800, 800);
      await Promise.all([wide.decode(), square.decode()]);
      const b = wide.getBoundingClientRect();
      return b.height / b.width;
    })()`);

    out.hiddenAdaptive = await evaluate(`(async () => {
      const c = document.getElementById('late'), v = c.shadowRoot.querySelector('.viewport');
      const hidden = v.style.height;
      c.style.display = '';
      await new Promise((done) => requestAnimationFrame(() => setTimeout(done, 20)));
      return [hidden, getComputedStyle(v).height];
    })()`);

    out.removed = await evaluate(`(async () => {
      const c = document.getElementById('plain');
      c.goTo(2);
      const last = c.children[2];
      last.remove();
      await new Promise((done) => setTimeout(done, 20));
      const moved = [c.index, c.count, c.shadowRoot.querySelectorAll('.dot').length, c.children[1].hasAttribute('inert')];
      document.body.append(c.children[1]);
      await new Promise((done) => setTimeout(done, 20));
      return [...moved, document.body.lastElementChild.hasAttribute('inert')];
    })()`);
    return out;
  }, { readyExpr: '!!window.fixtureReady' });

  assert.deepEqual(r.opening, {
    index: 0, attr: null, inert: [false, true, true], current: ['true', null, null], tabbable: [0, -1, -1],
    status: 'Item 1 of 3', prevOff: true, nextOff: false,
  });
  assert.deepEqual(r.names, ['Previous item', 'Next item', 'Go to item 1 of 3', 'Photos', 'group']);
  assert.deepEqual(r.geometry, [28, 4, 16, 8, 'rgb(138, 138, 138)', 24]);
  assert.deepEqual(r.ids, [1, 4, 3]);

  assert.equal(r.atStart, 1);
  assert.deepEqual(r.afterArrow, ['plain:change:1:1', 'plain:after-change:1:1']);
  assert.deepEqual(r.second, {
    index: 1, attr: '1', inert: [true, false, true], current: [null, 'true', null], tabbable: [-1, 0, -1],
    status: 'Item 2 of 3', prevOff: false, nextOff: false,
  });

  assert.equal(r.atEnd.index, 2);
  assert.equal(r.atEnd.nextOff, true);
  assert.deepEqual(r.endEvents, ['plain:change:2:2', 'plain:after-change:2:2']);
  assert.equal(r.focusFromDisabled, 'arrow prev');

  assert.deepEqual(r.merged, ['plain:change:0:0', 'plain:change:1:1', 'plain:change:2:2', 'plain:after-change:2:2']);
  assert.deepEqual(r.silent, [[], 1]);
  assert.deepEqual(r.keys, [
    'plain:change:2:2', 'plain:after-change:2:2', 'plain:change:0:0', 'plain:after-change:0:0',
    'plain:change:2:2', 'plain:after-change:2:2', 'plain:change:1:1', 'plain:after-change:1:1',
  ]);
  assert.equal(r.dotFocus, 1);

  assert.deepEqual(r.swipeNext, ['plain:change:1:1', 'plain:after-change:1:1']);
  assert.deepEqual(r.tooShort, [[], '']);
  assert.deepEqual(r.vertical, []);
  assert.deepEqual(r.pastStart, []);
  assert.equal(r.dragging, true);
  assert.deepEqual(r.mouseDrag, ['plain:change:1:1', 'plain:after-change:1:1']);

  assert.deepEqual(r.heights, [100, 220, '300px']);
  assert.deepEqual(r.adaptiveLabels, ['Previous image', 'Next image']);
  assert.deepEqual(r.wrap, [['adaptive:change:0:0', 'adaptive:after-change:0:0'], false]);
  assert.deepEqual(r.custom, ['Go to image 1 of 3', 'Image 2 of 3']);

  assert.deepEqual(r.rtlKey, ['rtl:change:1:1', 'rtl:after-change:1:1']);
  assert.deepEqual(r.rtlSwipe, ['rtl:change:2:2', 'rtl:after-change:2:2']);
  assert.equal(r.rtlSlideShowing, 0);
  assert.equal(r.rtlFlip, '-1 1');

  assert.deepEqual(r.single, [true, true, true, false, '', false]);
  assert.deepEqual(r.empty, [0, 0, true, true, 0]);
  assert.ok(r.restWithMotion >= 250, `after-change waits for the track, got ${r.restWithMotion}ms`);
  assert.ok(r.restReduced < 100, `reduced motion rests at once, got ${r.restReduced}ms`);
  assert.deepEqual(r.removed, [1, 2, 2, false, false]);

  assert.deepEqual(r.swipeFromLink, [['gesture:change:1:1', 'gesture:after-change:1:1'], []]);
  assert.equal(r.clickAfterTouchSwipe, 1);
  assert.deepEqual(r.swipeFromField, []);
  assert.deepEqual(r.pressStaysClick, ['press']);
  assert.equal(r.releasedOutside, false);
  assert.deepEqual(r.moves, { fraction: [true, '1', '0'], bubbled: 0, appended: [4, true, 3] });
  assert.ok(r.fractionLog.includes('gesture:change:1:1'), r.fractionLog.join());
  assert.deepEqual(r.focus, ['gesture', 'carousel', 'carousel', false]);
  assert.deepEqual(r.lateCopy, [0, 'Image 2 of 4']);
  assert.equal(r.images, 0.25);
  assert.deepEqual(r.hiddenAdaptive, ['', '100px']);
});
