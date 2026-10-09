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
