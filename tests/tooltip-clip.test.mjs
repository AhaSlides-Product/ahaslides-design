import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./tooltip-clip.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const PLACEMENTS = ['top', 'bottom', 'left', 'right', 'top-start', 'top-end', 'bottom-start', 'bottom-end', 'left-start', 'left-end', 'right-start', 'right-end'];

const scenarios = String.raw`(async () => {
  const placements = ${JSON.stringify(PLACEMENTS)};
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const innerBox = (el) => { const r = el.getBoundingClientRect(); return { top: r.top + el.clientTop, left: r.left + el.clientLeft, right: r.left + el.clientLeft + el.clientWidth, bottom: r.top + el.clientTop + el.clientHeight }; };
  const viewport = { top: 0, left: 0, right: document.documentElement.clientWidth, bottom: innerHeight };
  const intersect = (a, b) => ({ top: Math.max(a.top, b.top), left: Math.max(a.left, b.left), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) });
  const clipOf = (tip) => {
    if (tip.closest('[data-clip]')) return intersect(innerBox(tip.closest('[data-clip]')), viewport);
    if (tip.closest('clip-panel')) return intersect(innerBox(tip.closest('clip-panel').shadowRoot.querySelector('[part=clip]')), viewport);
    return viewport;
  };
  const clipped = [];
  const keptPreference = [];
  const arrowOff = [];
  for (const tip of document.querySelectorAll('aha-tooltip:not([data-scroll])')) {
    for (const placement of placements) {
      tip.setAttribute('placement', placement);
      tip.setAttribute('open', '');
      await frame();
      const bubble = tip.shadowRoot.querySelector('.bubble');
      const r = bubble.getBoundingClientRect();
      const clip = clipOf(tip);
      const used = tip.getAttribute('data-placement') || placement;
      const label = tip.dataset.case + ' ' + placement + ' -> ' + used;
      if (r.left < clip.left - 0.5 || r.right > clip.right + 0.5 || r.top < clip.top - 0.5 || r.bottom > clip.bottom + 0.5) clipped.push(label);
      if (tip.getAttribute('placement') !== placement) keptPreference.push('attribute rewritten: ' + label);
      if (tip.hasAttribute('data-room') && used !== placement) keptPreference.push('moved with room: ' + label);
      const side = used.split('-')[0];
      if ((side === 'top' || side === 'bottom') && tip.getAttribute('arrow') !== 'false') {
        const arrow = getComputedStyle(bubble, '::after');
        const translate = parseFloat(arrow.translate) || 0;
        const left = arrow.left === 'auto' ? r.width - parseFloat(arrow.right) : parseFloat(arrow.left);
        const arrowCentre = r.left + left + translate;
        const trigger = tip.getBoundingClientRect();
        if (arrowCentre < trigger.left - 0.5 || arrowCentre > trigger.right + 0.5) arrowOff.push(label);
      }
      tip.removeAttribute('open');
    }
  }
  return { clipped, keptPreference, arrowOff };
})()`;

test('a tooltip never paints outside its clipping panel or the viewport, keeps the author placement when it fits, and keeps its arrow on the trigger', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.tooltipClipFixtureReady', timeout: 45000 });
  assert.deepEqual(result.clipped, []);
  assert.deepEqual(result.keptPreference, []);
  assert.deepEqual(result.arrowOff, []);
});

const scrollScenario = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const scroller = document.getElementById('scroller');
  const tip = document.getElementById('scrolling');
  const inside = () => {
    const bubble = tip.shadowRoot.querySelector('.bubble').getBoundingClientRect();
    const clip = scroller.getBoundingClientRect();
    return bubble.top >= clip.top + scroller.clientTop - 0.5 && bubble.bottom <= clip.top + scroller.clientTop + scroller.clientHeight + 0.5;
  };
  tip.setAttribute('placement', 'top');
  tip.setAttribute('open', '');
  await frame();
  const before = { side: tip.getAttribute('data-placement'), inside: inside() };
  scroller.scrollTop = 100;
  await frame();
  const scrolled = { side: tip.getAttribute('data-placement'), inside: inside() };
  tip.removeAttribute('open');
  await frame();
  scroller.scrollTop = 0;
  await frame();
  const afterHide = tip.getAttribute('data-placement');
  return { before, scrolled, afterHide };
})()`;

test('an open tooltip re-picks its side when its panel scrolls, and stops watching scroll once hidden', { skip }, async () => {
  const result = await evaluateInPage(fixture, scrollScenario, { readyExpr: '!!window.tooltipClipFixtureReady', timeout: 45000 });
  assert.deepEqual(result.before, { side: 'top', inside: true });
  assert.deepEqual(result.scrolled, { side: 'bottom', inside: true });
  assert.equal(result.afterHide, 'bottom');
});

const drawerScenario = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const drawer = document.getElementById('drawer-scroll');
  const tip = document.getElementById('drawer-tip');
  drawer.setAttribute('open', '');
  await new Promise((done) => setTimeout(done, 600));
  const body = drawer.shadowRoot.querySelector('.body');
  const inside = () => {
    const bubble = tip.shadowRoot.querySelector('.bubble').getBoundingClientRect();
    const clip = body.getBoundingClientRect();
    return bubble.top >= clip.top + body.clientTop - 0.5 && bubble.bottom <= clip.top + body.clientTop + body.clientHeight + 0.5;
  };
  tip.setAttribute('placement', 'top');
  tip.setAttribute('open', '');
  await frame();
  const before = { side: tip.getAttribute('data-placement'), inside: inside() };
  body.scrollTop = 110;
  await frame();
  const scrolled = { side: tip.getAttribute('data-placement'), inside: inside() };
  tip.removeAttribute('open');
  await frame();
  body.scrollTop = 0;
  await frame();
  return { before, scrolled, afterHide: tip.getAttribute('data-placement') };
})()`;

test('a tooltip slotted in an aha-drawer re-picks its side when the drawer body scrolls, and stops once hidden', { skip }, async () => {
  const result = await evaluateInPage(fixture, drawerScenario, { readyExpr: '!!window.tooltipClipFixtureReady', timeout: 45000 });
  assert.deepEqual(result.before, { side: 'top', inside: true });
  assert.deepEqual(result.scrolled, { side: 'bottom', inside: true });
  assert.equal(result.afterHide, 'bottom');
});

const narrowScenario = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const panel = document.getElementById('narrow');
  const tip = document.getElementById('narrow-tip');
  const bubble = tip.shadowRoot.querySelector('.bubble');
  tip.setAttribute('placement', 'bottom-start');
  tip.setAttribute('open', '');
  await frame();
  const rect = bubble.getBoundingClientRect();
  const clip = panel.getBoundingClientRect();
  const narrowed = { maxWidth: parseFloat(getComputedStyle(bubble).maxWidth), width: rect.width, fits: rect.left >= clip.left - 0.5 && rect.right <= clip.right + 0.5, panel: panel.clientWidth };
  panel.style.width = '400px';
  tip.removeAttribute('open');
  await frame();
  tip.setAttribute('open', '');
  await frame();
  const widened = parseFloat(getComputedStyle(bubble).maxWidth);
  return { narrowed, widened };
})()`;

test('a tooltip narrows to a clipping panel narrower than its max width and goes back to 280px when the panel widens', { skip }, async () => {
  const result = await evaluateInPage(fixture, narrowScenario, { readyExpr: '!!window.tooltipClipFixtureReady', timeout: 45000 });
  assert.ok(result.narrowed.maxWidth <= result.narrowed.panel, 'max-width ' + result.narrowed.maxWidth);
  assert.ok(result.narrowed.width <= result.narrowed.panel);
  assert.equal(result.narrowed.fits, true);
  assert.equal(result.widened, 280);
});
