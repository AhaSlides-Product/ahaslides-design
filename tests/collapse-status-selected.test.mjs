import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./collapse-overflow.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenario = String.raw`(async () => {
  const wait = (ms) => new Promise((done) => setTimeout(done, ms));
  const make = (attributes) => {
    const collapse = document.createElement('aha-collapse');
    for (const [name, value] of Object.entries(attributes)) collapse.setAttribute(name, value);
    collapse.innerHTML = '<span slot="header">Row</span>Body';
    document.body.append(collapse);
    return collapse;
  };
  const read = (collapse) => {
    const head = collapse.shadowRoot.querySelector('.head');
    const panel = collapse.shadowRoot.querySelector('.panel');
    return { border: getComputedStyle(panel).borderTopColor, background: getComputedStyle(head).backgroundColor, current: head.getAttribute('aria-current') };
  };
  const plain = make({});
  const error = make({ status: 'error' });
  const warning = make({ status: 'warning' });
  const selected = make({ selected: '' });
  await wait(300);
  const out = { plain: read(plain), error: read(error), warning: read(warning), selected: read(selected) };
  plain.setAttribute('selected', '');
  await wait(300);
  out.plainAfter = read(plain);
  plain.removeAttribute('selected');
  await wait(300);
  out.plainCleared = read(plain);
  return out;
})()`;

test('status paints the panel border and selected marks the head', { skip }, async () => {
  const result = await withPage(fixture, async (command) => {
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    return command('Runtime.evaluate', { expression: scenario, awaitPromise: true, returnByValue: true }).then((r) => r.result.value);
  }, { readyExpr: '!!window.collapseFixtureReady' });
  assert.equal(result.plain.border, 'rgb(227, 227, 227)');
  assert.equal(result.plain.current, null);
  assert.equal(result.error.border, 'rgb(26, 26, 26)');
  assert.equal(result.warning.border, 'rgb(26, 26, 26)');
  assert.equal(result.selected.background, 'rgb(247, 247, 247)');
  assert.equal(result.selected.current, 'true');
  assert.notEqual(result.plain.background, result.selected.background);
  assert.equal(result.plainAfter.current, 'true');
  assert.equal(result.plainCleared.current, null);
  assert.equal(result.plainCleared.border, result.plain.border);
});
