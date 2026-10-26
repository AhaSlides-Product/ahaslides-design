import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./button-focus-ring.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const variants = ['primary', 'secondary', 'tertiary', 'link', 'positive', 'secondary-deck', 'tertiary-deck', 'text', 'text-link', 'primary-alt', 'danger'];

async function ringByVariant(consumerStyling) {
  return withPage(fixture, async (command) => {
    if (consumerStyling) await command('Runtime.evaluate', { expression: `document.getElementById('consumer').media = 'all'` });
    const tab = async () => {
      await command('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    };
    const rings = {};
    for (const variant of variants) {
      await tab();
      const read = await command('Runtime.evaluate', {
        expression: `(() => { const host = document.activeElement; const inner = host.shadowRoot.activeElement; const style = getComputedStyle(inner);
          return { variant: host.id, focusVisible: inner.matches(':focus-visible'), style: style.outlineStyle, width: style.outlineWidth, colour: style.outlineColor, offset: style.outlineOffset } })()`,
        returnByValue: true,
      });
      rings[variant] = read.result.value;
    }
    return rings;
  }, { readyExpr: '!!window.focusRingFixtureReady' });
}

for (const [label, consumerStyling] of [['by default', false], ['when the consumer sets its own elevation tokens and a box-shadow on ::part(button)', true]]) {
  test(`every variant draws a 2px Vivid Pink outline ring on keyboard focus ${label}`, { skip }, async () => {
    const rings = await ringByVariant(consumerStyling);
    for (const variant of variants) {
      const ring = rings[variant];
      assert.equal(ring.variant, variant);
      assert.ok(ring.focusVisible, `${variant} should match :focus-visible after Tab`);
      assert.equal(ring.style, 'solid', `${variant} ring style`);
      assert.equal(ring.width, '2px', `${variant} ring width`);
      assert.equal(ring.colour, 'rgb(231, 14, 104)', `${variant} ring colour`);
      assert.equal(ring.offset, '2px', `${variant} ring offset`);
    }
  });
}
