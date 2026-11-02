import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./button-pressed.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const inPage = async (command, body) => {
  const read = await command('Runtime.evaluate', { expression: `(async () => { ${body} })()`, awaitPromise: true, returnByValue: true });
  if (read.exceptionDetails) throw new Error(read.exceptionDetails.exception?.description || read.exceptionDetails.text);
  return read.result.value;
};

test('pressed draws the press look and derives aria-pressed; pressed="false", an author aria-pressed and disabled are respected', { skip }, async () => {
  const state = await withPage(fixture, (command) => inPage(command, `
    const read = (id) => {
      const inner = document.getElementById(id).shadowRoot.querySelector('button');
      const style = getComputedStyle(inner);
      return { ariaPressed: inner.getAttribute('aria-pressed'), border: style.borderTopColor, background: style.backgroundColor };
    };
    const host = document.getElementById('rest');
    const before = read('rest');
    host.setAttribute('pressed', '');
    const turnedOn = read('rest');
    host.removeAttribute('pressed');
    return { before, turnedOn, after: read('rest'), on: read('on'), off: read('off'), mixed: read('mixed'), disabled: read('disabled'), primary: read('primary') };`), { readyExpr: '!!window.pressedFixtureReady' });
  const pressBorder = 'rgb(219, 0, 91)';
  assert.equal(state.before.ariaPressed, null);
  assert.notEqual(state.before.border, pressBorder);
  assert.deepEqual([state.on.ariaPressed, state.on.border], ['true', pressBorder]);
  assert.deepEqual(state.turnedOn, state.on);
  assert.deepEqual(state.after, state.before);
  assert.deepEqual(state.off, { ...state.before, ariaPressed: 'false' });
  assert.equal(state.mixed.ariaPressed, 'mixed');
  assert.notEqual(state.disabled.border, pressBorder);
  assert.equal(state.primary.background, pressBorder);
});
