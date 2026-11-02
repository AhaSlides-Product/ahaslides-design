import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./input-prefix-shrink.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('prefix-shrink truncates a long prefix instead of squeezing the field', { skip }, async () => {
  const layout = await withPage(fixture, async (command) => {
    const out = await command('Runtime.evaluate', { returnByValue: true, expression: `(() => {
      const read = (id) => {
        const root = document.getElementById(id).shadowRoot;
        const wrap = root.querySelector('.wrap'), prefix = root.querySelector('[part="prefix"]'), field = root.querySelector('.field');
        const text = prefix.firstElementChild || prefix;
        const p = prefix.getBoundingClientRect(), t = text.getBoundingClientRect();
        return { field: field.getBoundingClientRect().width, prefix: p.width, truncated: prefix.scrollWidth > prefix.clientWidth + 1,
          overflows: wrap.scrollWidth > wrap.clientWidth + 1, startCut: t.left < p.left - 1, endCut: t.right > p.right + 1 };
      };
      return Object.fromEntries(['pushes', 'end', 'start', 'short', 'short-plain'].map((id) => [id, read(id)]));
    })()` });
    return out.result.value;
  }, { readyExpr: '!!window.prefixShrinkFixtureReady' });

  assert.ok(layout.pushes.field < 96, `without prefix-shrink the long prefix squeezes the field (${layout.pushes.field}px)`);
  for (const id of ['end', 'start']) {
    assert.ok(layout[id].field >= 96, `${id}: the field keeps at least 96px (${layout[id].field}px)`);
    assert.equal(layout[id].truncated, true, `${id}: the prefix truncates`);
    assert.equal(layout[id].overflows, false, `${id}: nothing spills out of the field box`);
  }
  assert.equal(layout.end.endCut && !layout.end.startCut, true, 'prefix-shrink cuts the end of the prefix');
  assert.equal(layout.start.startCut && !layout.start.endCut, true, 'prefix-shrink="start" cuts the start, keeping the end next to the field');
  assert.equal(layout.short.truncated, false, 'a prefix that fits is not truncated');
  assert.equal(Math.round(layout.short.prefix), Math.round(layout['short-plain'].prefix), 'a prefix that fits keeps its width');
});
