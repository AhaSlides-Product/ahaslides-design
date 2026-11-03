import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;
const evaluate = (command) => async (expression) =>
  (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

const pageWith = (body) => {
  const file = join(mkdtempSync(join(tmpdir(), 'row-')), 'page.html');
  writeFileSync(file, `<!doctype html><body style="margin:0">${body}<script type="module">import '${lib}'; window.ready = true;</script>`);
  return pathToFileURL(file).href;
};

test('real typing into an option row never sets value to "undefined" and emits one string input per keystroke', { skip }, async () => {
  const url = pageWith('<aha-option-row id="row" value="Paris"></aha-option-row>');
  const result = await withPage(url, async (command) => {
    const run = evaluate(command);
    await run(`(() => {
      const row = document.getElementById('row');
      window.seen = []; window.inputs = [];
      new MutationObserver(() => window.seen.push(row.getAttribute('value'))).observe(row, { attributes: true, attributeFilter: ['value'] });
      row.addEventListener('input', (e) => window.inputs.push(e.detail && e.detail.value));
      row.shadowRoot.querySelector('.field').shadowRoot.querySelector('textarea').focus();
    })()`);
    for (const text of ['X', 'Y', 'Z']) await command('Input.insertText', { text });
    return JSON.parse(await run('JSON.stringify({ seen: window.seen, inputs: window.inputs })'));
  }, { readyExpr: '!!window.ready && !!customElements.get("aha-option-row")' });
  assert.deepEqual(result, { seen: ['ParisX', 'ParisXY', 'ParisXYZ'], inputs: ['ParisX', 'ParisXY', 'ParisXYZ'] });
});

test('every setting-row help bubble stays inside a 320px and a 383px viewport', { skip }, async () => {
  const labels = ['Progress bar', 'Speaker notes', 'Show the leaderboard between questions', 'Allow audience to submit more than one answer', 'Time limit', 'Points', 'Answer reveal', 'Q'];
  const rows = labels.map((label, index) =>
    `<aha-setting-row label="${label}" help="Shown to the audience between slides, and kept on the results page after voting has closed for everyone." ${index % 2 ? 'layout="stack"' : ''}><aha-switch slot="control"></aha-switch></aha-setting-row>`).join('');
  const url = pageWith(`<div style="padding:12px 16px">${rows}</div>`);
  for (const width of [320, 383]) {
    const outside = await withPage(url, async (command) => {
      await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      const run = evaluate(command);
      return run(`(async () => {
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        await wait(300);
        const outside = [];
        for (const row of document.querySelectorAll('aha-setting-row')) {
          const tip = row.shadowRoot.querySelector('.help');
          const button = tip.shadowRoot.querySelector('.help');
          button.focus(); await wait(350);
          const box = tip.shadowRoot.querySelector('.bubble').getBoundingClientRect();
          if (box.left < 0 || box.top < 0 || box.right > innerWidth || box.bottom > innerHeight) outside.push(row.getAttribute('label'));
          button.blur(); await wait(150);
        }
        return outside;
      })()`);
    }, { readyExpr: '!!window.ready && !!customElements.get("aha-setting-row")' });
    assert.deepEqual(outside, [], `bubbles outside at ${width}px`);
  }
});

test('a host echoing a stale or trimmed value while the field is focused never eats a typed space; a new value still applies', { skip }, async () => {
  const fields = {
    'aha-option-row': 'el.shadowRoot.querySelector(".field").shadowRoot.querySelector("textarea")',
    'aha-counted-textarea': 'el.shadowRoot.querySelector("textarea")',
    'aha-counted-input': 'el.shadowRoot.querySelector(".field")',
    'aha-input': 'el.shadowRoot.querySelector(".field")',
  };
  const url = pageWith(Object.keys(fields).map((tag) => `<${tag} value=""></${tag}>`).join(''));
  for (const [tag, field] of Object.entries(fields)) {
    const result = await withPage(url, async (command) => {
      const run = evaluate(command);
      const read = () => run(`(() => { const el = document.querySelector('${tag}'); return { field: ${field}.value, value: el.value }; })()`);
      await run(`(() => { const el = document.querySelector('${tag}'); window.el = el; (${field}).focus(); })()`);
      await command('Input.insertText', { text: 'Hello' });
      await command('Input.insertText', { text: ' ' });
      await run('new Promise((resolve) => setTimeout(() => { el.value = "Hello"; resolve(); }, 20))');
      await command('Input.insertText', { text: 'W' });
      const typed = await read();
      await run('el.value = "Reset"');
      const reset = await read();
      await command('Input.imeSetComposition', { text: 'vi', selectionStart: 2, selectionEnd: 2 });
      await run('el.value = "Reset"');
      const composing = await read();
      await command('Input.insertText', { text: 'việt' });
      return { typed, reset, composing, committed: await read() };
    }, { readyExpr: `!!window.ready && !!customElements.get("${tag}")` });
    assert.deepEqual(result, {
      typed: { field: 'Hello W', value: 'Hello W' },
      reset: { field: 'Reset', value: 'Reset' },
      composing: { field: 'Resetvi', value: 'Resetvi' },
      committed: { field: 'Resetviệt', value: 'Resetviệt' },
    }, tag);
  }
});
