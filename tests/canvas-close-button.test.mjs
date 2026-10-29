import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./canvas-close-button.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const rgba = (value) => {
  const srgb = value.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/);
  if (!srgb) return value;
  const [red, green, blue] = srgb.slice(1, 4).map((channel) => Math.round(Number(channel) * 255));
  const alpha = srgb[4] === undefined ? 1 : Number(srgb[4]);
  return alpha === 1 ? `rgb(${red}, ${green}, ${blue})` : `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

const readStates = async (command, id, forcedPseudoClasses) => {
  const inner = await command('Runtime.evaluate', { expression: `document.querySelector('#${id}').shadowRoot.querySelector('button')` });
  const { nodeId } = await command('DOM.requestNode', { objectId: inner.result.objectId });
  await command('CSS.forcePseudoState', { nodeId, forcedPseudoClasses });
  const read = await command('Runtime.evaluate', {
    expression: `(() => { const b = document.querySelector('#${id}').shadowRoot.querySelector('button'); const s = getComputedStyle(b); const r = b.getBoundingClientRect(); return { colour: s.color, background: s.backgroundColor, width: r.width, height: r.height, radius: s.borderTopLeftRadius }; })()`,
    returnByValue: true,
  });
  const state = read.result.value;
  return { ...state, colour: rgba(state.colour), background: rgba(state.background) };
};

test('the canvas close is a 20 x 20 square in both deck variants', { skip }, async () => {
  const sizes = await withPage(fixture, async (command) => {
    await command('DOM.enable'); await command('CSS.enable');
    await command('DOM.getDocument', { depth: -1, pierce: true });
    return { tertiary: await readStates(command, 'tertiary', []), secondary: await readStates(command, 'secondary', []) };
  }, { readyExpr: '!!window.canvasCloseFixtureReady' });
  for (const close of [sizes.tertiary, sizes.secondary]) {
    assert.deepEqual([close.width, close.height, close.radius], [20, 20, '6px']);
  }
});

test('the tertiary-deck close is deck ink at 76% at rest, full ink on a wash on hover and press, 45% when disabled', { skip }, async () => {
  const states = await withPage(fixture, async (command) => {
    await command('DOM.enable'); await command('CSS.enable');
    await command('DOM.getDocument', { depth: -1, pierce: true });
    const result = { rest: await readStates(command, 'tertiary', []), hover: await readStates(command, 'tertiary', ['hover']), active: await readStates(command, 'tertiary', ['active']) };
    await command('Runtime.evaluate', { expression: `document.querySelector('#tertiary').setAttribute('disabled', '')` });
    result.disabled = await readStates(command, 'tertiary', []);
    result.disabledHover = await readStates(command, 'tertiary', ['hover']);
    result.audience = await readStates(command, 'audience', []);
    result.app = await readStates(command, 'app', []);
    return result;
  }, { readyExpr: '!!window.canvasCloseFixtureReady' });
  assert.equal(states.rest.colour, 'rgba(26, 26, 26, 0.76)');
  assert.equal(states.hover.colour, 'rgb(26, 26, 26)');
  assert.equal(states.hover.background, 'rgba(26, 26, 26, 0.05)');
  assert.equal(states.active.colour, 'rgb(26, 26, 26)');
  assert.equal(states.active.background, 'rgba(26, 26, 26, 0.1)');
  assert.equal(states.disabled.colour, 'rgba(26, 26, 26, 0.45)');
  assert.equal(states.disabledHover.colour, 'rgba(26, 26, 26, 0.45)');
  assert.equal(states.audience.colour, 'rgb(26, 26, 26)');
  assert.deepEqual([states.audience.width, states.audience.height], [36, 36]);
  assert.equal(states.app.colour, 'rgb(138, 138, 138)');
});

test('the secondary-deck close keeps the white fill and dark-ink glyph', { skip }, async () => {
  const states = await withPage(fixture, async (command) => {
    await command('DOM.enable'); await command('CSS.enable');
    await command('DOM.getDocument', { depth: -1, pierce: true });
    return { rest: await readStates(command, 'secondary', []), hover: await readStates(command, 'secondary', ['hover']) };
  }, { readyExpr: '!!window.canvasCloseFixtureReady' });
  assert.equal(states.rest.colour, 'rgb(26, 26, 26)');
  assert.equal(states.rest.background, 'rgb(255, 255, 255)');
  assert.equal(states.hover.colour, 'rgb(26, 26, 26)');
});
