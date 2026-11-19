import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluateInPage, resolveChrome } from '../cdp.mjs';

const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';
const lib = pathToFileURL(fileURLToPath(new URL('../lib/all.js', import.meta.url))).href;

const page = `<!doctype html><body style="width:360px">
<aha-setting-row id="req" label="Question" help="Tip." required><aha-input slot="control"></aha-input></aha-setting-row>
<aha-setting-row id="fr" label="Question" required required-label="Obligatoire"><aha-input slot="control"></aha-input></aha-setting-row>
<aha-setting-row id="plain" label="Title"><aha-input slot="control"></aha-input></aha-setting-row>
<script type="module">import '${lib}'; window.ready = true;</script>`;

test('required shows a neutral tag after the help and sets aria-required, both removed with the attribute', { skip }, async () => {
  const file = join(mkdtempSync(join(tmpdir(), 'setting-row-required-')), 'page.html');
  writeFileSync(file, page);
  const r = await evaluateInPage(pathToFileURL(file).href, `(async () => {
    const state = (id) => {
      const host = document.getElementById(id);
      const tag = host.shadowRoot.querySelector('.req');
      const help = host.shadowRoot.querySelector('.help');
      return {
        shown: getComputedStyle(tag).display !== 'none',
        text: tag.textContent,
        color: tag.getAttribute('color'),
        afterHelp: tag.getBoundingClientRect().left >= help.getBoundingClientRect().right - 1,
        aria: host.querySelector('[slot=control]').getAttribute('aria-required'),
      };
    };
    const on = state('req');
    const plain = state('plain');
    const fr = document.getElementById('fr').shadowRoot.querySelector('.req').textContent;
    const host = document.getElementById('req');
    const moved = host.querySelector('[slot=control]');
    host.appendChild(Object.assign(document.createElement('aha-input'), { slot: 'control' }));
    moved.remove();
    document.body.appendChild(moved);
    await new Promise((r) => setTimeout(r, 0));
    const movedAria = moved.getAttribute('aria-required');
    host.removeAttribute('required');
    const off = state('req');
    return { on, plain, off, fr, movedAria };
  })()`, { readyExpr: '!!window.ready && !!customElements.get("aha-input") && !!customElements.get("aha-tag")' });
  assert.deepEqual(r.on, { shown: true, text: 'Required', color: null, afterHelp: true, aria: 'true' });
  assert.equal(r.fr, 'Obligatoire');
  assert.equal(r.movedAria, null);
  assert.equal(r.plain.shown, false);
  assert.equal(r.plain.aria, null);
  assert.equal(r.off.shown, false);
  assert.equal(r.off.aria, null);
});
