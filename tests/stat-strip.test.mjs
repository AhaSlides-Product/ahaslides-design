import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./stat-strip.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenario = String.raw`(async () => {
  await customElements.whenDefined('aha-stat-tile');
  const columns = (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length;
  const fits = (el) => el.scrollWidth <= el.parentElement.clientWidth;
  const wide = document.querySelector('#wide');
  const about = document.querySelector('#about');
  const value = document.querySelector('#profile .user-stat .value');
  const label = document.querySelector('#profile .user-stat .label');
  const tileValue = wide.querySelector('aha-stat-tile').shadowRoot.querySelector('.value');
  return {
    wideColumns: columns(wide),
    aboutColumns: columns(about),
    aboutFits: fits(about),
    hostValueWeight: getComputedStyle(value).fontWeight,
    tileValueWeight: tileValue ? getComputedStyle(tileValue).fontWeight : null,
    labelAboveValue: label.getBoundingClientRect().top < value.getBoundingClientRect().top,
  };
})()`;

test('stat strip caps a row at 5, wraps narrow host markup, and draws host figures SemiBold like the tile', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenario, { readyExpr: '!!window.statStripFixtureReady' });
  assert.equal(result.wideColumns, 5);
  assert.equal(result.aboutColumns, 2);
  assert.equal(result.aboutFits, true);
  assert.equal(result.hostValueWeight, '600');
  assert.equal(result.hostValueWeight, result.tileValueWeight);
  assert.equal(result.labelAboveValue, true);
});
