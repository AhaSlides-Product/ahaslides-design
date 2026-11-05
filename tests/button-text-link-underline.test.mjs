import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./button-text-link-underline.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('text-link has no underline at rest and is underlined on hover, press and keyboard focus', { skip }, async () => {
  const decorationByState = await withPage(fixture, async (command) => {
    await command('DOM.enable'); await command('CSS.enable');
    await command('DOM.getDocument', { depth: -1, pierce: true });
    const inner = await command('Runtime.evaluate', { expression: `document.querySelector('#link').shadowRoot.querySelector('button')` });
    const { nodeId } = await command('DOM.requestNode', { objectId: inner.result.objectId });
    const decoration = async (forcedPseudoClasses) => {
      await command('CSS.forcePseudoState', { nodeId, forcedPseudoClasses });
      const read = await command('Runtime.evaluate', { expression: `getComputedStyle(document.querySelector('#link').shadowRoot.querySelector('button')).textDecorationLine`, returnByValue: true });
      return read.result.value;
    };
    return {
      rest: await decoration([]),
      hover: await decoration(['hover']),
      active: await decoration(['active']),
      focusVisible: await decoration(['focus', 'focus-visible']),
    };
  }, { readyExpr: '!!window.textLinkFixtureReady' });
  assert.equal(decorationByState.rest, 'none');
  assert.equal(decorationByState.hover, 'underline');
  assert.equal(decorationByState.active, 'underline');
  assert.equal(decorationByState.focusVisible, 'underline');
});

test('size inline sits in a sentence: no padding, no box, the line stays its own height', { skip }, async () => {
  const layout = await withPage(fixture, async (command) => {
    const read = await command('Runtime.evaluate', {
      expression: `(() => {
        const part = (id) => document.getElementById(id).shadowRoot.querySelector('[part=button]');
        const box = (id) => { const style = getComputedStyle(part(id)); return { tag: part(id).localName, padding: style.paddingLeft, border: style.borderLeftWidth, background: style.backgroundColor, lineHeight: style.lineHeight, fontSize: style.fontSize, fontFamily: style.fontFamily, height: part(id).getBoundingClientRect().height }; };
        const height = (id) => document.getElementById(id).getBoundingClientRect().height;
        return { toggle: box('toggle'), anchor: box('anchor'), plain: height('plain'), sentence: height('sentence'), wrapped: height('wrapped'), sentenceFont: getComputedStyle(document.getElementById('sentence')).fontFamily };
      })()`,
      returnByValue: true,
    });
    return read.result.value;
  }, { readyExpr: '!!window.textLinkFixtureReady' });
  assert.equal(layout.sentence, layout.plain);
  assert.equal(layout.wrapped, 63);
  assert.equal(layout.toggle.tag, 'button');
  assert.equal(layout.anchor.tag, 'a');
  for (const control of [layout.toggle, layout.anchor]) {
    assert.equal(control.padding, '0px');
    assert.equal(control.border, '0px');
    assert.equal(control.background, 'rgba(0, 0, 0, 0)');
    assert.equal(control.lineHeight, '21px');
    assert.equal(control.fontSize, '14px');
    assert.equal(control.fontFamily, layout.sentenceFont);
  }
});

test('size inline is underlined at rest in both forms, selectable, and a wrapped toggle stays aligned to the start', { skip }, async () => {
  const read = await withPage(fixture, async (command) => {
    const state = async () => (await command('Runtime.evaluate', {
      expression: `(() => {
        const style = (id) => getComputedStyle(document.getElementById(id).shadowRoot.querySelector('[part=button]'));
        const height = (id) => document.getElementById(id).getBoundingClientRect().height;
        return { toggle: style('toggle').textDecorationLine, anchor: style('anchor').textDecorationLine, select: style('toggle').userSelect, align: style('long-toggle').textAlign, longHeight: document.getElementById('long-toggle').shadowRoot.querySelector('[part=button]').getBoundingClientRect().height, plain: height('plain'), grown: height('grown') };
      })()`,
      returnByValue: true,
    })).result.value;
    const rest = await state();
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] });
    const forced = await state();
    return { rest, forced };
  }, { readyExpr: '!!window.textLinkFixtureReady' });
  assert.equal(read.rest.toggle, 'underline');
  assert.equal(read.rest.anchor, 'underline');
  assert.equal(read.forced.toggle, 'underline');
  assert.equal(read.forced.anchor, 'underline');
  assert.equal(read.rest.select, 'text');
  assert.equal(read.rest.align, 'start');
  assert.ok(read.rest.longHeight > 21, 'the button box wraps inside itself');
  assert.equal(read.rest.grown, read.rest.plain, 'loading and an icon do not grow the line');
});

test('size inline keeps the keyboard focus ring and the underline in both forms', { skip }, async () => {
  const rings = await withPage(fixture, async (command) => {
    const tab = async () => {
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    };
    const seen = {};
    for (let press = 0; press < 3; press++) {
      await tab();
      const read = await command('Runtime.evaluate', {
        expression: `(() => { const host = document.activeElement; const inner = host.shadowRoot.activeElement; const style = getComputedStyle(inner); return { id: host.id, style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset, decoration: style.textDecorationLine }; })()`,
        returnByValue: true,
      });
      seen[read.result.value.id] = read.result.value;
    }
    return seen;
  }, { readyExpr: '!!window.textLinkFixtureReady' });
  for (const id of ['toggle', 'anchor']) {
    assert.equal(rings[id].style, 'solid', `${id} ring style`);
    assert.equal(rings[id].width, '2px', `${id} ring width`);
    assert.equal(rings[id].colour, 'rgb(231, 14, 104)', `${id} ring colour`);
    assert.equal(rings[id].offset, '2px', `${id} ring offset`);
    assert.equal(rings[id].decoration, 'underline', `${id} underline on focus`);
  }
});
