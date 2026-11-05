import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./input-sizes.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('aha-input and aha-input-number share one height scale: small 32, default 40, large 48', { skip }, async () => {
  const sizes = await withPage(fixture, async (command) => {
    const out = await command('Runtime.evaluate', { returnByValue: true, expression: `(() => {
      const inner = (wrap, node) => {
        const w = wrap.getBoundingClientRect(), n = node.getBoundingClientRect();
        return n.height > 0 && n.top >= w.top && n.bottom <= w.bottom;
      };
      return Array.from(document.querySelectorAll('aha-input, aha-input-number')).map((el) => {
        const root = el.shadowRoot, wrap = root.querySelector('.wrap');
        const steps = Array.from(root.querySelectorAll('.step'));
        const clear = root.querySelector('.clear');
        return {
          id: el.id,
          height: wrap.getBoundingClientRect().height,
          stepHeights: steps.map((s) => s.getBoundingClientRect().height),
          partsInside: [...steps, ...(clear ? [clear] : [])].every((node) => inner(wrap, node)),
        };
      });
    })()` });
    return out.result.value;
  }, { readyExpr: '!!window.inputSizesFixtureReady' });

  const expected = { sm: 32, small: 32, default: 40, large: 48 };
  for (const { id, height, stepHeights, partsInside } of sizes) {
    const size = id.split('-')[1];
    assert.equal(height, expected[size], `${id}: ${height}px tall`);
    assert.ok(partsInside, `${id}: the clear button and stepper sit inside the field box`);
    if (id.startsWith('number-')) assert.deepEqual(stepHeights, [14, 14], `${id}: each stepper button stays 18×14`);
  }
  assert.equal(sizes.length, 8);
});
