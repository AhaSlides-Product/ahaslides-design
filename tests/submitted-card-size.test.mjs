import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./submitted-card-size.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('size sm, md and lg scale the heading, subtitle and glyph; no size renders as md', { skip }, async () => {
  const result = await evaluateInPage(fixture, `(() => {
    const measure = (id) => {
      const root = document.getElementById(id).shadowRoot;
      const font = (selector) => { const style = getComputedStyle(root.querySelector(selector)); return style.fontSize + '/' + style.lineHeight; };
      return { heading: font('.heading'), subtitle: font('.subtitle'), glyph: root.querySelector('aha-icon').getAttribute('size') };
    };
    const lg = document.getElementById('lg');
    const before = measure('lg');
    lg.removeAttribute('size');
    return { plain: measure('plain'), sm: measure('sm'), md: measure('md'), lg: before, cleared: measure('lg') };
  })()`, { readyExpr: '!!window.submittedCardFixtureReady' });
  const md = { heading: '16px/24px', subtitle: '14px/21px', glyph: '32' };
  assert.deepEqual(result, {
    plain: md, md, cleared: md,
    sm: { heading: '14px/22px', subtitle: '12px/18px', glyph: '24' },
    lg: { heading: '20px/28px', subtitle: '16px/24px', glyph: '32' },
  });
});
