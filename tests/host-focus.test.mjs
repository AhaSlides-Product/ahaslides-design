import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./host-focus.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

const inPage = (command, body) => withValue(command('Runtime.evaluate', { expression: `(async () => { ${body} })()`, awaitPromise: true, returnByValue: true }));
const withValue = async (pending) => { const read = await pending; if (read.exceptionDetails) throw new Error(read.exceptionDetails.exception?.description || read.exceptionDetails.text); return read.result.value; };

test('host.focus() moves focus into aha-button, aha-switch and aha-select', { skip }, async () => {
  const focused = await withPage(fixture, (command) => inPage(command, `
    const result = {};
    for (const id of ['button', 'switch', 'select']) {
      const host = document.getElementById(id);
      host.focus();
      result[id] = document.activeElement === host && host.shadowRoot.activeElement !== null;
    }
    return result;`), { readyExpr: '!!window.hostFocusFixtureReady' });
  assert.deepEqual(focused, { button: true, switch: true, select: true });
});

test('aha-button keeps its inner button and keyboard focus when variant, size, loading or label change', { skip }, async () => {
  const kept = await withPage(fixture, (command) => inPage(command, `
    const host = document.getElementById('button');
    host.focus();
    const inner = host.shadowRoot.activeElement;
    const result = {};
    for (const [name, value] of [['variant', 'primary'], ['size', 'sm'], ['loading', ''], ['aria-label', 'Customise survey'], ['icon-only', '']]) {
      host.setAttribute(name, value);
      result[name] = host.shadowRoot.activeElement === inner && host.shadowRoot.querySelector('button') === inner;
    }
    host.removeAttribute('loading');
    result.label = inner.getAttribute('aria-label');
    return result;`), { readyExpr: '!!window.hostFocusFixtureReady' });
  assert.deepEqual(kept, { variant: true, size: true, loading: true, 'aria-label': true, 'icon-only': true, label: 'Customise survey' });
});

test('an aha-button link that turns into a button while loading keeps keyboard focus', { skip }, async () => {
  const state = await withPage(fixture, (command) => inPage(command, `
    const host = document.getElementById('link');
    host.focus();
    host.setAttribute('loading', '');
    const loading = host.shadowRoot.activeElement?.localName;
    host.removeAttribute('loading');
    return { loading, after: host.shadowRoot.activeElement?.localName, href: host.shadowRoot.querySelector('a')?.getAttribute('href') };`), { readyExpr: '!!window.hostFocusFixtureReady' });
  assert.deepEqual(state, { loading: 'button', after: 'a', href: '#next' });
});

test('aria-current on aha-button reaches the inner button and follows changes', { skip }, async () => {
  const current = await withPage(fixture, (command) => inPage(command, `
    const host = document.getElementById('dot');
    const inner = () => host.shadowRoot.querySelector('button');
    const initial = inner().getAttribute('aria-current');
    host.setAttribute('aria-current', 'step');
    const changed = inner().getAttribute('aria-current');
    host.removeAttribute('aria-current');
    return { initial, changed, removed: inner().hasAttribute('aria-current') };`), { readyExpr: '!!window.hostFocusFixtureReady' });
  assert.deepEqual(current, { initial: 'page', changed: 'step', removed: false });
});
