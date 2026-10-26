import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

test('canvas play: md 48, lg 64 (default), hero 96, flat primary disc, named, clickable, deck focus ring', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'canvas-play-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="--aha-button-focus-gap:rgb(1, 2, 3); --aha-button-focus-ring:rgb(4, 5, 6)">
<aha-canvas-play id="md" size="md"></aha-canvas-play><aha-canvas-play id="lg"></aha-canvas-play>
<aha-canvas-play id="hero" size="hero" label="Wiedergabe"></aha-canvas-play>
<aha-canvas-play id="off" disabled></aha-canvas-play>
<script type="module">import '${lib}'; await customElements.whenDefined('aha-canvas-play'); await new Promise((r) => requestAnimationFrame(r)); window.ready = true;</script>`);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const box = (id) => document.getElementById(id).shadowRoot.querySelector('.box');
    const size = (id) => { const s = getComputedStyle(box(id)); return [s.width, s.height]; };
    const hero = box('hero');
    let clicks = 0;
    document.getElementById('hero').addEventListener('click', () => { clicks++; });
    hero.click();
    const disabled = document.getElementById('off');
    let offClicks = 0;
    disabled.addEventListener('click', () => { offClicks++; });
    disabled.shadowRoot.querySelector('.box').click();
    disabled.click();
    hero.focus();
    const style = getComputedStyle(hero);
    return { md: size('md'), lg: size('lg'), hero: size('hero'), bg: style.backgroundColor, name: hero.getAttribute('aria-label'), defaultName: box('lg').getAttribute('aria-label'),
      clicks, offClicks, glyph: document.getElementById('hero').shadowRoot.querySelector('aha-icon').getAttribute('size') };
  })()`, { readyExpr: '!!window.ready', timeout: 45000 });
  assert.deepEqual(result.md, ['48px', '48px']);
  assert.deepEqual(result.lg, ['64px', '64px']);
  assert.deepEqual(result.hero, ['96px', '96px']);
  assert.equal(result.bg, 'rgb(231, 14, 104)');
  assert.equal(result.name, 'Wiedergabe');
  assert.equal(result.defaultName, 'Play');
  assert.equal(result.clicks, 1);
  assert.equal(result.offClicks, 0);
  assert.equal(result.glyph, '32');
});
