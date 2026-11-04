import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./card-select-preview.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const el = document.querySelector('#looks');
  const cards = () => [...el.shadowRoot.querySelectorAll('.card')];
  const out = {};
  const changes = [];
  el.addEventListener('change', (e) => changes.push(e.detail.value));

  out.assigned = cards().map((c) => c.querySelector('slot').assignedElements().map((n) => n.textContent).join());
  out.ariaLabels = cards().map((c) => c.getAttribute('aria-label'));
  out.previewHidden = cards().every((c) => c.querySelector('.preview').getAttribute('aria-hidden') === 'true');
  const box = cards()[0].querySelector('.preview').getBoundingClientRect();
  out.ratio = Math.round((box.width / box.height) * 100) / 100;
  out.labelClipped = cards()[0].querySelector('.card-label').getBoundingClientRect().width <= 1;
  out.shownLabelWidth = document.querySelector('#shown').shadowRoot.querySelector('.card-label').getBoundingClientRect().width;

  out.noneChecked = cards().every((c) => c.getAttribute('aria-checked') === 'false');
  out.tabStops = cards().map((c) => c.tabIndex);

  el.querySelector('[slot="bold"]').click(); await frame();
  out.afterSlotClick = el.value;
  const sel = getComputedStyle(cards()[2]);
  out.selBg = sel.backgroundColor;
  out.selRing = sel.boxShadow;
  out.selBorder = sel.borderTopColor;

  el.value = 'retired'; await frame();
  out.unknownNoneChecked = cards().every((c) => c.getAttribute('aria-checked') === 'false');
  out.unknownTabStops = cards().map((c) => c.tabIndex);
  out.changes = changes;
  return out;
})()`;

test('preview tiles show the app-drawn slot, select by click on it, ring the selection without a fill, and keep one tab stop with no value', { skip }, async () => {
  const r = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.cardSelectFixtureReady', timeout: 45000 });
  assert.deepEqual(r.assigned, ['Classic', 'Modern', 'Bold']);
  assert.deepEqual(r.ariaLabels, ['Classic', 'Modern', 'Bold']);
  assert.equal(r.previewHidden, true);
  assert.equal(r.ratio, 1.41);
  assert.equal(r.labelClipped, true);
  assert.ok(r.shownLabelWidth > 20, 'hide-labels="false" leaves the label visible');
  assert.equal(r.noneChecked, true);
  assert.deepEqual(r.tabStops, [0, -1, -1]);
  assert.equal(r.afterSlotClick, 'bold');
  assert.equal(r.selBg, 'rgb(255, 255, 255)');
  assert.equal(r.selRing, 'rgb(231, 14, 104) 0px 0px 0px 2px');
  assert.equal(r.selBorder, 'rgb(255, 255, 255)');
  assert.equal(r.unknownNoneChecked, true);
  assert.deepEqual(r.unknownTabStops, [0, -1, -1]);
  assert.deepEqual(r.changes, ['bold']);
});

test('preview tiles: one group name on the host, equal options keep the cards, a gap between focus and selected rings, a muted inert disabled tile, and a forced-colours selected outline', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const named = async (name) => (await command('Accessibility.getFullAXTree')).nodes
      .filter((n) => !n.ignored && n.name && n.name.value === name).map((n) => n.role.value);
    const card = (i) => `document.querySelector('#looks').shadowRoot.querySelectorAll('.card')[${i}]`;
    const frame = 'new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))';
    const out = {};
    await command('Accessibility.enable');

    out.groupRoles = await named('Certificate design');
    await evaluate(`document.querySelector('#looks').removeAttribute('aria-label')`);
    out.groupRolesUnnamed = await named('Certificate design');
    await evaluate(`document.querySelector('#looks').setAttribute('aria-label', 'Certificate design')`);

    out.sameNodes = await evaluate(`(() => { const el = document.querySelector('#looks'); const before = ${card(1)};
      el.options = el.options.map((o) => ({ ...o })); return before === ${card(1)}; })()`);
    out.rebuiltOnChange = await evaluate(`(() => { const el = document.querySelector('#looks'); const before = ${card(1)};
      el.options = el.options.map((o) => ({ ...o, label: o.label + '!' })); el.options = el.options.map((o) => ({ ...o, label: o.label.slice(0, -1) }));
      return before !== ${card(1)}; })()`);

    await evaluate(`(async () => { document.querySelector('#looks').value = 'modern'; await ${frame}; })()`);
    for (const type of ['rawKeyDown', 'keyUp']) await command('Input.dispatchKeyEvent', { type, key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
    out.focus = await evaluate(`(() => { const c = ${card(1)}; const s = getComputedStyle(c); return [c.matches(':focus-visible'), s.outlineOffset, s.boxShadow]; })()`);

    out.disabled = await evaluate(`(async () => { const el = document.querySelector('#looks'); el.disabled = true; await ${frame};
      const look = el.querySelector('[slot="modern"]'); const b = look.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      const s = getComputedStyle(${card(1)}); const out = [hit === look, s.boxShadow]; el.disabled = false; return out; })()`);

    await command('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
    out.forced = await evaluate(`(() => { document.activeElement.blur(); return [getComputedStyle(${card(1)}).outlineStyle, getComputedStyle(${card(0)}).outlineStyle]; })()`);
    return out;
  }, { readyExpr: '!!window.cardSelectFixtureReady' });
  assert.deepEqual(r.groupRoles, ['radiogroup'], 'the host aria-label names the radiogroup once');
  assert.deepEqual(r.groupRolesUnnamed, []);
  assert.equal(r.sameNodes, true, 'an equal options array keeps the card nodes');
  assert.equal(r.rebuiltOnChange, true, 'a changed options array still rebuilds');
  assert.deepEqual(r.focus, [true, '4px', 'rgb(231, 14, 104) 0px 0px 0px 2px']);
  assert.deepEqual(r.disabled, [false, 'rgb(181, 181, 181) 0px 0px 0px 2px'], 'a disabled preview takes no hit and mutes the ring');
  assert.deepEqual(r.forced, ['solid', 'none'], 'forced colours outline only the selected preview tile');
});

test('min-tile-width drops columns with the element\'s own width and keeps columns while tiles fit', { skip }, async () => {
  const across = String.raw`(async () => {
    const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const box = document.body.appendChild(document.createElement('div'));
    const make = (attrs) => {
      const el = document.createElement('aha-card-select');
      for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value);
      el.options = ['a', 'b', 'c', 'd'].map((value) => ({ value, label: value }));
      return box.appendChild(el);
    };
    const count = (el) => new Set([...el.shadowRoot.querySelectorAll('.tip')].map((tip) => tip.offsetLeft)).size;
    const fluid = make({ columns: '3', 'min-tile-width': '110' });
    const fixed = make({ columns: '3' });
    const out = { sweep: [], fixedCounts: new Set(), overflow: 0 };
    for (let width = 100; width <= 700; width += 7) {
      box.style.width = width + 'px';
      await frame();
      out.sweep.push([width, count(fluid)]);
      out.fixedCounts.add(count(fixed));
      if (fluid.shadowRoot.querySelector('.grid').scrollWidth > width) out.overflow++;
    }
    out.fixedCounts = [...out.fixedCounts];
    box.style.width = '320px';
    fluid.minTileWidth = 140; await frame();
    out.after140 = count(fluid);
    fluid.minTileWidth = null; await frame();
    out.afterRemoved = count(fluid);
    return out;
  })()`;
  const r = await evaluateInPage(fixture, across, { readyExpr: '!!window.cardSelectFixtureReady', timeout: 45000 });
  const wrong = r.sweep.filter(([width, n]) => n !== Math.max(1, Math.min(3, Math.floor((width + 8) / 118))));
  assert.deepEqual(wrong, [], 'tiles per row at each width');
  assert.equal(r.overflow, 0);
  assert.deepEqual(r.fixedCounts, [3], 'without the attribute columns never drop');
  assert.equal(r.after140, 2);
  assert.equal(r.afterRemoved, 3);
});
