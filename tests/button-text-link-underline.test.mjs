import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/aha-button.js', import.meta.url))).href;

const page = `<!doctype html><body>
<aha-button id="link" variant="text-link">Learn more</aha-button>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('text-link has no underline at rest and is underlined on hover, keyboard focus and press', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'text-link-underline-')), 'page.html');
  writeFileSync(file, page);
  const result = await evaluateInPage(pathToFileURL(file).href, `(() => {
    const button = document.getElementById('link').shadowRoot.querySelector('button');
    const sheet = [...button.getRootNode().styleSheets].flatMap((s) => [...s.cssRules]);
    const lineIn = (state) => {
      const rule = sheet.find((r) => r.selectorText && r.selectorText.split(',').some((s) => s.includes('text-link') && s.trim().endsWith('button:' + state)));
      return rule ? rule.style.textDecorationLine || rule.style.textDecoration : 'missing';
    };
    return { rest: getComputedStyle(button).textDecorationLine, hover: lineIn('hover'), focus: lineIn('focus-visible'), active: lineIn('active') };
  })()`, { readyExpr: 'window.ready === true' });
  assert.equal(result.rest, 'none');
  assert.match(result.hover, /underline/);
  assert.match(result.focus, /underline/);
  assert.match(result.active, /underline/);
});
