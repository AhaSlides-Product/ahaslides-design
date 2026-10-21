import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./button-link.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const readExpression = `(() => {
  const look = (id) => {
    const inner = document.querySelector('#' + id).shadowRoot.querySelector('[part=button]');
    const style = getComputedStyle(inner);
    const keys = ['display', 'height', 'padding-left', 'padding-right', 'border-radius', 'border-top-color', 'border-top-width', 'background-color', 'color', 'font-size', 'font-weight', 'text-decoration-line', 'box-shadow', 'cursor'];
    return { tag: inner.tagName, href: inner.getAttribute('href'), target: inner.getAttribute('target'), rel: inner.getAttribute('rel'), style: Object.fromEntries(keys.map((key) => [key, style.getPropertyValue(key)])) };
  };
  document.querySelector('#submit').shadowRoot.querySelector('[part=button]').click();
  return { button: look('button'), link: look('link'), secondaryButton: look('secondary-button'), secondaryLink: look('secondary-link'), disabledLink: look('disabled-link'), submitted: window.submitted };
})()`;

test('href renders a link that looks exactly like the button, and type=submit submits its form', { skip }, async () => {
  const read = await withPage(fixture, async (command) => {
    const result = await command('Runtime.evaluate', { expression: readExpression, returnByValue: true });
    return result.result.value;
  }, { readyExpr: '!!window.buttonLinkFixtureReady' });
  assert.equal(read.button.tag, 'BUTTON');
  assert.equal(read.link.tag, 'A');
  assert.equal(read.link.href, '/signup');
  assert.equal(read.link.target, '_blank');
  assert.equal(read.link.rel, 'noopener');
  assert.deepEqual(read.link.style, read.button.style);
  assert.deepEqual(read.secondaryLink.style, read.secondaryButton.style);
  assert.equal(read.disabledLink.tag, 'BUTTON');
  assert.equal(read.submitted, 1);
});
