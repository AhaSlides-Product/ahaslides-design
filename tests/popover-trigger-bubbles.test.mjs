import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = (name) => pathToFileURL(fileURLToPath(new URL(`../lib/${name}`, import.meta.url))).href;

const page = `<!doctype html><body>
<aha-csat id="a" source="a"></aha-csat>
<aha-csat id="b" source="b"></aha-csat>
<aha-popover id="p1"><button slot="trigger" id="t1">one</button>One</aha-popover>
<aha-popover id="p2"><button slot="trigger" id="t2">two</button>Two</aha-popover>
<script type="module">import '${lib('aha-csat.js')}'; import '${lib('aha-popover.js')}'; window.ready = true;</script>`;

const run = async (expression) => {
  const file = join(mkdtempSync(join(tmpdir(), 'popover-bubbles-')), 'page.html');
  writeFileSync(file, page);
  return evaluateInPage(pathToFileURL(file).href, expression, { readyExpr: '!!window.ready && !!customElements.get("aha-csat") && !!customElements.get("aha-popover")' });
};

test('clicking a thumb or feedback of a second aha-csat closes the first one\'s open feedback popover', { skip }, async () => {
  const result = await run(`(() => {
    const open = (id) => document.getElementById(id).shadowRoot.querySelector('aha-popover').open;
    const down = (id) => document.getElementById(id).shadowRoot.querySelector('.down');
    down('a').click();
    const afterA = [open('a'), open('b')];
    down('b').click();
    return { afterA, afterB: [open('a'), open('b')] };
  })()`);
  assert.deepEqual(result, { afterA: [true, false], afterB: [false, true] });
});

test('a popover trigger click still toggles its own popover and bubbles to the host', { skip }, async () => {
  const result = await run(`(() => {
    const p1 = document.getElementById('p1'), p2 = document.getElementById('p2');
    let hostClicks = 0;
    document.addEventListener('click', () => hostClicks++);
    document.getElementById('t1').click();
    const opened = p1.open;
    document.getElementById('t1').click();
    const toggledOff = p1.open;
    document.getElementById('t1').click();
    document.getElementById('t2').click();
    return { opened, toggledOff, firstClosedBySecond: p1.open, secondOpen: p2.open, hostClicks };
  })()`);
  assert.deepEqual(result, { opened: true, toggledOff: false, firstClosedBySecond: false, secondOpen: true, hostClicks: 4 });
});

test('Escape and an outside click still close an open popover', { skip }, async () => {
  const result = await run(`(() => {
    const p1 = document.getElementById('p1');
    document.getElementById('t1').click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    const afterEscape = p1.open;
    document.getElementById('t1').click();
    document.body.click();
    return { afterEscape, afterOutside: p1.open };
  })()`);
  assert.deepEqual(result, { afterEscape: false, afterOutside: false });
});
