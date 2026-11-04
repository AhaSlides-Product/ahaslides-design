import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./empty-size-small.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenario = String.raw`(async () => {
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const measure = (id) => {
    const root = document.getElementById(id).shadowRoot;
    const box = getComputedStyle(root.querySelector('.empty'));
    return {
      padding: box.paddingTop + ' ' + box.paddingLeft,
      caption: getComputedStyle(root.querySelector('.desc')).fontSize,
      art: Math.round(root.querySelector('.built-in aha-illustration').getBoundingClientRect().width),
      height: Math.round(document.getElementById(id).getBoundingClientRect().height),
    };
  };
  return { small: measure('small'), standard: measure('default') };
})()`;

test('size="small" shrinks art, padding and caption for a narrow panel; the default is unchanged', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    await command('Emulation.setDeviceMetricsOverride', { width: 360, height: 640, deviceScaleFactor: 1, mobile: false });
    const res = await command('Runtime.evaluate', { expression: scenario, awaitPromise: true, returnByValue: true });
    return res.result.value;
  }, { readyExpr: '!!window.emptyFixtureReady' });
  assert.deepEqual(r.small, { ...r.small, padding: '16px 12px', caption: '12px', art: 32 });
  assert.deepEqual(r.standard, { ...r.standard, padding: '32px 16px', caption: '14px', art: 64 });
  assert.ok(r.small.height <= 96, `small empty state is ${r.small.height}px tall`);
});
