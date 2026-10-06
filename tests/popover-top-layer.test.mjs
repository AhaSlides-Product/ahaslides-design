import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./popover-top-layer.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const ready = '!!window.popoverFixtureReady && !!document.querySelector("#csat").shadowRoot';

const scenarios = String.raw`(async () => {
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const panelOf = (popover) => popover.shadowRoot.querySelector('.pop');
  const deepHit = (x, y) => {
    let hit = document.elementFromPoint(x, y);
    while (hit && hit.shadowRoot) {
      const inner = hit.shadowRoot.elementFromPoint(x, y);
      if (!inner || inner === hit) break;
      hit = inner;
    }
    return hit;
  };
  const insidePanel = (node, panel) => {
    for (let at = node; at; at = at.assignedSlot || at.parentNode || at.host) if (at === panel) return true;
    return false;
  };
  const report = (popover) => {
    const panel = panelOf(popover);
    const rect = panel.getBoundingClientRect();
    const points = [[rect.left + 4, rect.top + 4], [rect.right - 4, rect.top + 4], [rect.left + 4, rect.bottom - 4],
      [rect.right - 4, rect.bottom - 4], [rect.left + rect.width / 2, rect.top + rect.height / 2]];
    return {
      topLayer: panel.hasAttribute('popover') && panel.matches(':popover-open'),
      rect: { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height },
      viewport: { width: document.documentElement.clientWidth, height: window.innerHeight },
      visiblePoints: points.filter(([x, y]) => insidePanel(deepHit(x, y), panel)).length,
      opacity: getComputedStyle(panel).opacity,
    };
  };
  const out = {};

  const clipped = document.querySelector('#clipped');
  const clippedTrigger = document.querySelector('#clipped-trigger');
  clippedTrigger.click();
  await frame();
  out.clipped = { ...report(clipped), expanded: clipped.shadowRoot.querySelector('.trigger').getAttribute('aria-expanded'),
    clipBottom: document.querySelector('#clip').getBoundingClientRect().bottom };
  panelOf(clipped).querySelector('.body').click();
  await frame();
  out.clipped.openAfterInsideClick = clipped.open;
  clippedTrigger.focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await frame();
  out.escape = { open: clipped.open, topLayer: report(clipped).topLayer, expanded: clipped.shadowRoot.querySelector('.trigger').getAttribute('aria-expanded'),
    focusReturned: document.activeElement === clippedTrigger };

  clippedTrigger.click();
  await frame();
  document.body.click();
  await frame();
  out.outsideClick = { open: clipped.open, topLayer: report(clipped).topLayer };

  for (const id of ['right', 'left']) {
    const popover = document.querySelector('#' + id);
    popover.open = true;
    await frame();
    out[id] = report(popover);
    popover.open = false;
  }

  const scrolled = document.querySelector('#scrolled');
  scrolled.open = true;
  await frame();
  const beforeScroll = report(scrolled).rect.top;
  document.querySelector('#scroller').scrollTop = 10;
  await frame();
  const afterScroll = report(scrolled).rect.top;
  document.querySelector('#scroller .tall').style.paddingLeft = '40px';
  const beforeResize = report(scrolled).rect.left;
  window.dispatchEvent(new Event('resize'));
  await frame();
  out.scroll = { moved: beforeScroll - afterScroll, resizeMoved: report(scrolled).rect.left - beforeResize };
  scrolled.open = false;

  const plain = document.querySelector('#plain');
  plain.open = true;
  await frame();
  const plainTrigger = plain.querySelector('button').getBoundingClientRect();
  out.plain = { ...report(plain), hasPopoverAttribute: panelOf(plain).hasAttribute('popover'), gap: report(plain).rect.top - plainTrigger.bottom };
  plain.open = false;

  const csat = document.querySelector('#csat');
  csat.shadowRoot.querySelector('.down').click();
  await frame();
  const feedback = csat.shadowRoot.querySelector('aha-popover');
  out.csat = { ...report(feedback), open: feedback.open, downExpanded: csat.shadowRoot.querySelector('.down').getAttribute('aria-expanded') };
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await frame();
  out.csat.closedByEscape = !feedback.open;
  return out;
})()`;

const run = (query = '') => evaluateInPage(fixture + query, scenarios, { readyExpr: ready, timeout: 45000 });
const fullyInViewport = (result) => result.rect.left >= 8 && result.rect.top >= 8 &&
  result.rect.right <= result.viewport.width - 8 && result.rect.bottom <= result.viewport.height - 8;

test('flip popover renders in the top layer, unclipped and uncovered', { skip }, async () => {
  const result = await run();
  assert.equal(result.clipped.topLayer, true);
  assert.ok(result.clipped.rect.bottom > result.clipped.clipBottom + 40, 'panel extends past the clipping ancestor');
  assert.equal(result.clipped.visiblePoints, 5, 'clipped panel is hit-testable at every corner and its centre');
  assert.equal(result.clipped.expanded, 'true');
  assert.equal(result.clipped.openAfterInsideClick, true);

  assert.deepEqual(result.escape, { open: false, topLayer: false, expanded: 'false', focusReturned: true });
  assert.deepEqual(result.outsideClick, { open: false, topLayer: false });

  for (const side of ['right', 'left']) {
    assert.equal(result[side].topLayer, true, side);
    assert.ok(fullyInViewport(result[side]), `${side}-edge panel stays 8px inside the viewport`);
    assert.equal(result[side].visiblePoints, 5, `${side}-edge panel is not clipped by its narrow container`);
  }

  assert.equal(result.scroll.moved, 10, 'panel follows a 10px scroll');
  assert.equal(result.scroll.resizeMoved, 40, 'panel re-measures on resize');

  assert.equal(result.plain.hasPopoverAttribute, false, 'a popover without flip keeps its in-flow panel');
  assert.equal(result.plain.gap, 8);

  assert.equal(result.csat.open, true);
  assert.equal(result.csat.topLayer, true);
  assert.equal(result.csat.visiblePoints, 5, 'aha-csat feedback panel escapes its clipping ancestor');
  assert.equal(result.csat.downExpanded, 'true');
  assert.equal(result.csat.closedByEscape, true);
});

test('without the Popover API the flip popover falls back to fixed positioning', { skip }, async () => {
  const result = await run('?nopopover');
  assert.equal(result.clipped.topLayer, false);
  assert.ok(result.clipped.visiblePoints < 5, 'fallback is still clipped by a transform + contain:paint ancestor');
  assert.equal(result.escape.open, false);
  assert.equal(result.outsideClick.open, false);
  assert.ok(fullyInViewport(result.right));
  assert.ok(fullyInViewport(result.left));
  assert.equal(result.scroll.moved, 10);
  assert.equal(result.csat.open, true);
  assert.equal(result.csat.closedByEscape, true);
});
