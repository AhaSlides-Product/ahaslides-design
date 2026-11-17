import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./alert-banner-heading.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('a banner heading runs on in the message line, bold and at the message size; an inline alert stacks it', { skip }, async () => {
  const read = await withPage(fixture, async (command) => {
    const result = await command('Runtime.evaluate', {
      expression: `(() => {
        const measure = (id) => {
          const root = document.getElementById(id).shadowRoot;
          const title = root.querySelector('.title'), msg = root.querySelector('.msg');
          const style = getComputedStyle(title);
          return { size: style.fontSize, line: style.lineHeight, weight: style.fontWeight, sameLine: title.getBoundingClientRect().top === msg.getBoundingClientRect().top };
        };
        return { inline: measure('inline'), banner: measure('banner') };
      })()`,
      returnByValue: true,
    });
    return result.result.value;
  }, { readyExpr: '!!window.alertFixtureReady' });
  assert.deepEqual(read.banner, { size: '14px', line: '21px', weight: '600', sameLine: true });
  assert.deepEqual(read.inline, { size: '14px', line: '21px', weight: '600', sameLine: false });
});
