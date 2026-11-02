import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./card.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const KEYS = {
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r' },
  Space: { key: ' ', code: 'Space', windowsVirtualKeyCode: 32, nativeVirtualKeyCode: 32, text: ' ' },
};

test('an interactive <aha-card> is a keyboard button: Enter and Space click it once, other cards and inner controls are left alone', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const press = async (focusExpression, name) => {
      await evaluate(`${focusExpression}.focus()`);
      const { text, ...key } = KEYS[name];
      await command('Input.dispatchKeyEvent', { type: 'keyDown', text, unmodifiedText: text, ...key });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
    };
    const byId = (id) => `document.getElementById('${id}')`;
    await press(byId('interactive'), 'Enter');
    await press(byId('interactive'), 'Space');
    await press(byId('plain'), 'Enter');
    await press(byId('plain'), 'Space');
    await press(byId('nested-button'), 'Space');
    await press(byId('loading-interactive'), 'Enter');
    await evaluate('new Promise((resolve) => setTimeout(resolve, 50))');
    const before = await evaluate(`JSON.stringify({ role: ${byId('interactive')}.getAttribute('role'), tabindex: ${byId('interactive')}.getAttribute('tabindex'), authorRole: ${byId('author-role')}.getAttribute('role'), plainRole: ${byId('plain')}.getAttribute('role') })`);
    await evaluate(`${byId('interactive')}.removeAttribute('interactive')`);
    const after = await evaluate(`JSON.stringify({ role: ${byId('interactive')}.getAttribute('role'), tabindex: ${byId('interactive')}.getAttribute('tabindex') })`);
    const clicks = await evaluate('JSON.stringify(window.clicks)');
    return { clicks: JSON.parse(clicks), before: JSON.parse(before), after: JSON.parse(after) };
  }, { readyExpr: '!!window.cardFixtureReady' });

  assert.equal(result.clicks.interactive, 2, 'Enter and Space each click an interactive card once');
  assert.equal(result.clicks.plain, 0, 'a card without interactive ignores Enter and Space');
  assert.equal(result.clicks['loading-interactive'], 0, 'a loading card ignores Enter');
  assert.equal(result.clicks.nested, 1, 'Space on an inner button clicks that button only, not the card a second time');
  assert.deepEqual(result.before, { role: 'button', tabindex: '0', authorRole: 'link', plainRole: null });
  assert.deepEqual(result.after, { role: null, tabindex: null }, 'removing interactive removes the role and tabindex it added');
});

test('<aha-card> title slot wins over card-title, an empty title hides the header, loading toggles in place, stretch evens a grid and a flex row', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    return JSON.parse(await evaluate(`(async () => {
      const shadow = (id) => document.getElementById(id).shadowRoot;
      const shown = (node) => getComputedStyle(node).display !== 'none';
      const rich = shadow('rich-title');
      const toggle = document.getElementById('toggle-loading');
      const body = toggle.shadowRoot.querySelector('.body');
      const content = toggle.shadowRoot.querySelector('.content');
      const skeleton = toggle.shadowRoot.querySelector('.skeleton');
      toggle.setAttribute('loading', '');
      const loading = { busy: body.getAttribute('aria-busy'), content: shown(content), skeleton: shown(skeleton), sameBody: toggle.shadowRoot.querySelector('.body') === body };
      toggle.removeAttribute('loading');
      const loaded = { busy: body.getAttribute('aria-busy'), content: shown(content), skeleton: shown(skeleton) };
      const heights = (id) => [...document.getElementById(id).querySelectorAll('aha-card')].map((card) => Math.round(card.shadowRoot.querySelector('.card').getBoundingClientRect().height));
      return JSON.stringify({
        slotTitle: rich.querySelector('slot[name="title"]').assignedNodes().map((node) => node.textContent).join(''),
        fallbackShown: rich.querySelector('.title-text').getClientRects().length > 0,
        emptyHeadShown: shown(shadow('empty-title').querySelector('.head')),
        loading, loaded, grid: heights('grid'), flex: heights('flex'),
      });
    })()`));
  }, { readyExpr: '!!window.cardFixtureReady' });

  assert.equal(result.slotTitle, 'Slot title');
  assert.equal(result.fallbackShown, false, 'card-title text is hidden when the title slot is filled');
  assert.equal(result.emptyHeadShown, false, 'card-title="" with no title slot renders no header');
  assert.deepEqual(result.loading, { busy: 'true', content: false, skeleton: true, sameBody: true });
  assert.deepEqual(result.loaded, { busy: null, content: true, skeleton: false });
  assert.equal(result.grid[0], result.grid[1], `stretched cards in a grid row share one height: ${result.grid}`);
  assert.equal(result.flex[0], result.flex[1], `stretched cards in a flex row share one height: ${result.flex}`);
});
