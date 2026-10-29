import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./option-image-only-whole.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const scenarios = String.raw`(async () => {
  await new Promise((done) => setTimeout(done, 100));
  const measure = (root, selector) => {
    const picture = root.querySelector(selector + ' .picture');
    const image = picture.querySelector('img');
    const box = picture.getBoundingClientRect();
    const natural = image.naturalWidth / image.naturalHeight;
    const imageBox = image.getBoundingClientRect();
    return {
      boxHeight: Math.round(box.height),
      boxWidth: Math.round(box.width),
      fit: getComputedStyle(image).objectFit,
      background: getComputedStyle(picture).backgroundColor,
      natural,
      shownRatio: imageBox.width / imageBox.height,
      containedWidth: Math.min(imageBox.width, imageBox.height * natural),
    };
  };
  const answer = (id) => measure(document.getElementById(id).shadowRoot, '.row');
  const rank = document.getElementById('rank').shadowRoot;
  const rankRow = (id) => measure(rank, '[data-option-id="' + id + '"]');
  return {
    answer: { portrait: answer('answer-portrait'), square: answer('answer-square'), landscape: answer('answer-landscape') },
    rank: { portrait: rankRow('portrait'), square: rankRow('square'), landscape: rankRow('landscape') },
  };
})()`;

test('an image-only row shows the whole picture: contained, as tall as the picture allows up to 240px, on a neutral background', { skip }, async () => {
  const result = await evaluateInPage(fixture, scenarios, { readyExpr: '!!window.wholePictureReady', timeout: 45000 });
  for (const component of ['answer', 'rank']) {
    const { portrait, square, landscape } = result[component];
    for (const shape of [portrait, square, landscape]) {
      assert.equal(shape.fit, 'contain');
      assert.equal(shape.background, 'rgb(243, 243, 243)');
      assert.ok(shape.boxHeight <= 240);
    }
    assert.equal(portrait.boxHeight, 240);
    assert.equal(square.boxHeight, 240);
    assert.ok(landscape.boxHeight < 240);
    assert.ok(Math.abs(landscape.boxHeight - landscape.boxWidth / 2) < 1, 'landscape box follows its 2:1 ratio');
    assert.ok(landscape.boxHeight > 120, 'landscape is taller than the old 120px strip');
  }
});
