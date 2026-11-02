import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./card-interactive.html', import.meta.url))).href;
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
    await evaluate('new Promise((resolve) => setTimeout(resolve, 50))');
    const before = await evaluate(`JSON.stringify({ role: ${byId('interactive')}.getAttribute('role'), tabindex: ${byId('interactive')}.getAttribute('tabindex'), authorRole: ${byId('author-role')}.getAttribute('role'), plainRole: ${byId('plain')}.getAttribute('role') })`);
    await evaluate(`${byId('interactive')}.removeAttribute('interactive')`);
    const after = await evaluate(`JSON.stringify({ role: ${byId('interactive')}.getAttribute('role'), tabindex: ${byId('interactive')}.getAttribute('tabindex') })`);
    const clicks = await evaluate('JSON.stringify(window.clicks)');
    return { clicks: JSON.parse(clicks), before: JSON.parse(before), after: JSON.parse(after) };
  }, { readyExpr: '!!window.cardFixtureReady' });

  assert.equal(result.clicks.interactive, 2, 'Enter and Space each click an interactive card once');
  assert.equal(result.clicks.plain, 0, 'a card without interactive ignores Enter and Space');
  assert.equal(result.clicks.nested, 1, 'Space on an inner button clicks that button only, not the card a second time');
  assert.deepEqual(result.before, { role: 'button', tabindex: '0', authorRole: 'link', plainRole: null });
  assert.deepEqual(result.after, { role: null, tabindex: null }, 'removing interactive removes the role and tabindex it added');
});
